# Workout Generator — API Reference and Local Setup

A full-stack, locally runnable training-program generator built with **Java 21, Spring Boot, PostgreSQL, React, Vite, and Tailwind CSS**. Generate goal-based 1–8-week schedules (the UI currently offers 4–8 weeks), review or swap exercises, save programs, and log completed sets. This is a **single-user/local demonstration**, not a hosted multi-user service.

## 1. API usage (start here)

**Base URL:** `http://localhost:8080/api` when using the backend directly. When the React development server is running, it proxies `/api` to the backend. **Content-Type:** `application/json` for JSON request bodies.

| Verb | Endpoint | Purpose / result |
|---|---|---|
| `GET` | `/api/health` | Backend liveness: `{"status":"ok","application":"Workout Generator"}` |
| `GET` | `/api/exercises` | List undeleted exercises; optional `equipment`, `primaryMuscle`, `movementPattern` query parameters |
| `GET` | `/api/exercises/{id}` | Find a single exercise (`404` if missing/deleted) |
| `POST` | `/api/exercises` | Create exercise (`201`); returns exercise object |
| `PUT` | `/api/exercises/{id}` | Update exercise; returns updated object or `404` |
| `DELETE` | `/api/exercises/{id}` | Soft-delete exercise (`204` or `404`) |
| `GET` | `/api/exercises/{id}/external-matches` | Up to ten related ExerciseDB results (external network required) |
| `GET` | `/api/exercises/external/{externalId}` | ExerciseDB details, including instructions/media where available |
| `POST` | `/api/programs/generate` | Generate schedule: array of `WorkoutDay` records |
| `POST` | `/api/programs/saved` | Save a named schedule to PostgreSQL (`201`) |
| `GET` | `/api/programs/saved` | List saved programs, newest first |
| `GET` | `/api/programs/saved/{id}` | Read a saved program |
| `DELETE` | `/api/programs/saved/{id}` | Delete a saved program and its workout logs (`204`) |
| `PUT` | `/api/programs/saved/{id}/sessions/{sessionNumber}/completion` | Mark session complete; returns updated saved program |
| `DELETE` | `/api/programs/saved/{id}/sessions/{sessionNumber}/completion` | Undo completion; returns updated saved program |
| `PUT` | `/api/programs/saved/{id}/sessions/{sessionNumber}/exercises/{exerciseId}` | Swap a session exercise; body contains `replacementExerciseId` |
| `GET` | `/api/programs/saved/{programId}/sessions/{sessionNumber}/sets` | Read actual logged sets |
| `PUT` | `/api/programs/saved/{programId}/sessions/{sessionNumber}/sets` | Replace logged sets for that session; accepts partial or empty log |

### Example A: health check

```bash
curl -i http://localhost:8080/api/health
```

Expected HTTP `200` response:

```json
{"status":"ok","application":"Workout Generator"}
```

### Example B: exercise search and CRUD

```bash
curl 'http://localhost:8080/api/exercises?equipment=Dumbbell&movementPattern=SQUAT'

curl -i -X POST http://localhost:8080/api/exercises \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Example Dumbbell Squat",
    "primaryMuscle":"Quadriceps",
    "equipment":"Dumbbell",
    "movementPattern":"SQUAT",
    "description":"Controlled squat variation."
  }'
```

A successful POST returns `201` and an `Exercise` JSON object with an assigned `id`, plus `name`, `primaryMuscle`, `equipment`, `description`, `movementPattern`, and `deleted` fields. You can update it with `PUT /api/exercises/{id}` (same request fields), or soft-delete it using `DELETE /api/exercises/{id}`. Exercise names and key fields are required; name, muscle, and equipment have 100-character maximums, while description has a 500-character maximum.

### Example C: generate a program

```bash
curl -i -X POST http://localhost:8080/api/programs/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "goal":"STRENGTH",
    "experience":"INTERMEDIATE",
    "trainingDays":1,
    "sessionMinutes":60,
    "programWeeks":4,
    "availableEquipment":["Dumbbell","Bodyweight"]
  }'
```

The result is an array of workout sessions. A **simplified example of the response shape** (not a guaranteed selection or exact prescription):

```json
[
  {
    "sessionNumber": 1,
    "workoutType": "FULL_BODY",
    "exercises": [
      {"exerciseId": 1, "exerciseName": "Goblet Squat", "sets": 4, "reps": 6, "targetRpe": 7.0}
    ]
  }
]
```

The real 4-week request above should return **4 sessions**, with exercise selections dependent on the seed data. For `D` training days over `W` weeks, the normal response contains `D × W` sessions, including a possible empty-exercise `ACTIVE_RECOVERY` session on seven-day splits. The planner cycles sets, reps, and target RPE by week; deloads are scheduled in weeks 4 and 8. These are fixed templates, **not adaptive weight recommendations**.

Supported goal strings: `STRENGTH`, `HYPERTROPHY`, `ENDURANCE`, `HYBRID`. Experience: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`. Training days: `1–7`; session minutes: `30–120`; API program weeks: `1–8` (omitted defaults to `1` for backward compatibility). Equipment strings: `Barbell`, `Dumbbell`, `Bodyweight`, `Cable`, `Machine`, `Kettlebell`, `Resistance Band`.

### Example D: save and retrieve a program

Take the *full* array returned by Example C and submit it as `schedule`:

```json
{
  "name": "Four-Week Strength",
  "preferences": {
    "goal": "STRENGTH",
    "experience": "INTERMEDIATE",
    "trainingDays": 1,
    "sessionMinutes": 60,
    "programWeeks": 4,
    "availableEquipment": ["Dumbbell", "Bodyweight"]
  },
  "schedule": [
    {"sessionNumber": 1, "workoutType": "FULL_BODY", "exercises": []},
    {"sessionNumber": 2, "workoutType": "FULL_BODY", "exercises": []},
    {"sessionNumber": 3, "workoutType": "FULL_BODY", "exercises": []},
    {"sessionNumber": 4, "workoutType": "FULL_BODY", "exercises": []}
  ]
}
```

The empty exercise arrays above are **only a compact example of the request structure**; in normal use, send the generated workouts unchanged (or with permitted UI swaps). The service validates the number of sessions against `trainingDays × programWeeks`. `POST /api/programs/saved` returns `201` with an object containing `id`, `name`, `preferences`, `schedule`, `createdAt`, and `completedSessions` (initially `[]`). Retrieve it with `GET /api/programs/saved/{id}`.

To swap one exercise in a saved session:

```bash
curl -i -X PUT 'http://localhost:8080/api/programs/saved/1/sessions/1/exercises/42' \
  -H 'Content-Type: application/json' \
  -d '{"replacementExerciseId":51}'
```

Replace `1`, `42`, and `51` with real IDs. A valid swap must use an available exercise with a matching movement pattern and permitted equipment; it cannot duplicate an exercise already in that session or modify a completed workout. Sets, reps, and target RPE are retained.

### Example E: log actual sets

```bash
curl -i -X PUT 'http://localhost:8080/api/programs/saved/1/sessions/1/sets' \
  -H 'Content-Type: application/json' \
  -d '{"sets":[
    {"exerciseId":42,"setNumber":1,"weightLb":185,"reps":5,"actualRpe":7.5}
  ]}'

curl 'http://localhost:8080/api/programs/saved/1/sessions/1/sets'
```

Replace IDs with ones from a real saved schedule. A successful PUT returns `200` and records such as:

```json
[{"exerciseId":42,"setNumber":1,"weightLb":185.00,"reps":5,"actualRpe":7.5}]
```

`weightLb` must be nonnegative; `reps` must be at least 1; `actualRpe` can be omitted or be between 1 and 10. You can save a partial workout. The PUT **replaces** all logs for that session; `{"sets":[]}` clears them. Saving logs and marking a session complete are separate operations.

### API errors

- `400 Bad Request`: invalid input, unsupported enum, or an invalid swap/log value. Bean-validation errors are returned in an `errors` object, for example `{"errors":{"goal":"must match ..."}}`; malformed JSON returns `{"error":"Malformed JSON request"}`.
- `404 Not Found`: missing resource or session.
- `502 Bad Gateway`: ExerciseDB service is unavailable or returns an unexpected response.
- Other backend/database failures should be investigated in Spring Boot console output.

## 2. Run locally from a fresh clone

### Requirements

- **JDK 21** (`java -version`)
- **Node.js 22.22.2+ (22.x) or 24.15.0+ (24.x)** (`node -v`). Several packages in the submitted lockfile require these minimum patch versions; older Node 22 builds can produce `EBADENGINE` warnings.
- **Docker Engine/Desktop** with `docker compose` (the database is containerized; Java/React are not)
- Internet access the first time Gradle and npm download their dependencies, and for external ExerciseDB lookups
- On macOS/Linux: a shell such as bash/zsh. On Windows, use `gradlew.bat` for Gradle commands.

### Terminal 1: PostgreSQL

```bash
docker compose up -d postgres-db
docker compose ps
```

The included `compose.yaml` creates database `workout_generator`, user `workout_user`, and exposes PostgreSQL at **127.0.0.1:5433** (inside the container PostgreSQL listens on `5432`). It uses a named Docker volume, `workout_pgdata`, to persist data. These are **development-only credentials**; do not expose the configuration publicly.

### Terminal 2: Spring Boot API

```bash
# From repository root
./gradlew bootRun
# If a ZIP/unzip operation removed execute permission: chmod +x gradlew
```

On Windows: `gradlew.bat bootRun`. Backend listens on `http://localhost:8080`; check `http://localhost:8080/api/health`. Spring JPA is configured with `ddl-auto=update`, and `ExerciseDataSeeder` imports names not yet in the database from `src/main/resources/exercises_seed.csv` on startup. Allow time for the initial dependency download and database initialization.

### Terminal 3: React/Vite frontend

```bash
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite (typically **http://localhost:5173**). The Vite proxy sends `/api` traffic to port `8080`, so both servers must run during local development.

### Verify the app

```bash
# From project root, with API running
bash scripts/smoke-test.sh

# Backend tests (requires Docker for Testcontainers tests)
./gradlew test

# Frontend, from frontend/
npm run build
npm run lint
```

Do not run `npm run build` until `npm ci` completes. The GitHub ZIP intentionally excludes `node_modules`, IDE caches, Gradle output, and Git history.

## 3. Architecture

```text
Browser / React 19 + React Router DOM
  pages: Dashboard, Generate, My Programs, Exercise Library, Tracker
      | JSON fetch('/api/...')
      v
Vite proxy (/api -> localhost:8080, development only)
      |
      v
Spring Boot 4 controllers (REST/validation/error mapping)
      |
      v
Services (selection, periodization, saved programs, log handling)
      |
      v
Spring Data JPA repositories
      |
      v
PostgreSQL (Docker volume, host port 5433)

Optional: ExerciseDB public service -> search/details demonstrations
```

**Code locations:**

- `src/main/java/mil/army/moda/workoutgeneratorproject/controller/` — HTTP endpoints and request/response coordination.
- `dto/` — validated API payloads and response records.
- `service/` — generation/selection/periodization, persistence operations, external API access.
- `model/` — JPA entities, enums, and immutable workout records.
- `repository/` — Spring Data JPA persistence.
- `config/ExerciseDataSeeder.java` + `src/main/resources/exercises_seed.csv` — local starter exercise catalog.
- `frontend/src/pages/` — pages; `frontend/src/components/` — reusable React UI.
- `frontend/src/services/exerciseApi.js` — exercise API adapter.

### Key design choices

1. **Separate controller / service / repository** layers to isolate HTTP handling from business rules and database operations, making components easier to test.
2. **WorkoutDay and WorkoutExercise are Java records** because generated prescriptions are immutable data; `SavedProgram` and `WorkoutSetLog` are JPA entities because they need persistence/identity.
3. **Exercises are soft-deleted**, protecting historical schedule references. Program deletion cascades to logged sets.
4. **Generated schedules are JSON fields** inside saved programs, while individual performance logs have their own relational table so actual workouts do not overwrite the prescription.
5. **An unsaved generated program is a browser `localStorage` draft**, not a PostgreSQL record. Saving explicitly creates a DB record; drafts do not sync between browsers.
6. **Target RPE vs actual RPE:** The generator prescribes target effort; users record actual weight/reps/RPE in the Tracker. Periodization varies prescriptions by week and experience; it does not calculate progressive weights from prior logs yet.
7. **The API has no account system or ownership authorization.** It is intended for personal/local demonstration, not shared public deployment.

## 4. Troubleshooting and presentation

- **[Troubleshooting guide](docs/TROUBLESHOOTING.md)** — organized symptoms, causes, terminal checks, copyable fixes, and example AI-assisted debugging prompts.
- **[Presentation & technical Q&A](docs/PRESENTATION_GUIDE.md)** — a short demo sequence, architecture talking points, test evidence, and likely instructor questions.
- **[Submission audit](docs/SUBMISSION_AUDIT.md)** — rubric assessment, what was checked, limitations, and remaining manual verification.

## 5. Notes on external content and deployment

- Exercise instructions/media may come from [ExerciseDB](https://github.com/ExerciseDB/exercisedb-api) via the public service. Searches are approximate, and image/GIF availability depends on the external server. Attribute third-party media and review its current licensing/terms before public/commercial use.
- The default credentials, `ddl-auto=update`, lack of authentication, and exposed CRUD routes are designed for **local development only**. A production deployment would require accounts/authorization, secrets management, database migrations, secure networking, rate limiting, and stronger end-to-end tests.
- Demo data is **not a substitute for medical advice**; the program is a training-planning tool, not a clinical recommendation engine.
