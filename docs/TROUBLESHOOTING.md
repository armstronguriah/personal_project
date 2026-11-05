# Troubleshooting Guide — Workout Generator

Use this guide after following the setup commands in the root [README](../../workout-generator-project/README.md). **Start with the failing layer:** Docker/PostgreSQL, Spring Boot/API, React/Vite, or the external ExerciseDB service. Record the command, first meaningful error, expected behavior, and attempted fix before changing code.

## Quick diagnostic checklist

```bash
java -version                         # Java 21
node -v                               # Node >=22.22.2 or >=24.15.0
npm -v
docker compose ps                    # postgres-db should be running
curl -i http://localhost:8080/api/health
curl -i http://localhost:8080/api/exercises
```

Run backend and frontend in separate terminals. The backend uses port **8080**, PostgreSQL is on **host port 5433**, and Vite is typically **5173**.

## 1. PostgreSQL container fails or API cannot connect

**Symptoms:** `Connection refused`, `PSQLException`, `Unable to obtain JDBC Connection`, or startup hangs at database initialization.

1. Run `docker compose ps` and `docker compose logs postgres-db --tail=80`.
2. If not running, run `docker compose up -d postgres-db`.
3. Check the application URL in `src/main/resources/application.properties`: `jdbc:postgresql://localhost:5433/workout_generator`.
4. Check whether another process is using port `5433` (`lsof -nP -iTCP:5433 -sTCP:LISTEN` on macOS).
5. If a previously created volume came from a different major PostgreSQL version, **do not delete the volume to fix it blindly**. Back up your data and use a compatible database version or a documented upgrade path.

**Why:** Docker maps `127.0.0.1:5433` to container port `5432`; the backend uses the host-side port.

## 2. Gradle fails before building

**Symptoms:** `Permission denied: ./gradlew`, wrapper download failure, or Java toolchain errors.

```bash
chmod +x gradlew       # macOS/Linux if execute bit was lost
./gradlew --version
./gradlew test
```

Ensure JDK 21 is installed and your `JAVA_HOME` points to it. The Gradle wrapper downloads Gradle 9.8.1 on first use; allow network access to its distribution host. Tests using Testcontainers also require Docker to be running.

## 3. npm install/build fails (`EBADENGINE`, missing packages)

**Symptoms:** npm complains about Node engines or Vite cannot start.

1. Confirm **Node 22.22.2+ within the 22.x line, or 24.15.0+ within 24.x**. Some current test-related dependencies demand those versions.
2. From `frontend/`, run `npm ci`, not `npm install` when checking a clean lockfile-based setup.
3. Retry `npm run build` after the install finishes. If the registry is unreachable, check connectivity and npm proxy settings.
4. If dependencies were installed with an incompatible Node version, upgrade Node and reinstall via `npm ci`.

This submission uses `react-router-dom` 7 consistently; do not reintroduce an independent React Router 8 dependency.

## 4. React page loads but API requests fail (`502`, `ECONNREFUSED`)

**Symptoms:** Vite proxy error, blank saved program list, or `Failed to fetch`.

1. Check `curl -i http://localhost:8080/api/health` first.
2. Start Spring Boot if the health request fails.
3. Confirm `frontend/vite.config.js` proxies `/api` to `http://localhost:8080`.
4. Check Developer Tools → Network → failed `/api/...` request. Examine the response body and console.
5. Verify the URL begins with `/api` (so the browser uses the proxy), not the PostgreSQL port.

A browser page displaying successfully does **not** prove the API or database is running.

## 5. React Router error (`useLocation() may be used only in context of a Router`)

Ensure `frontend/src/main.jsx` wraps `<App />` in one `<BrowserRouter>` and that navigation imports come from `react-router-dom`. Having incompatible major versions of `react-router` and `react-router-dom` can create separate contexts. Keep the dependency versions aligned, and do not create a second nested `<BrowserRouter>` in `App.jsx`.

## 6. API returns 400 / `Malformed JSON request`

Check request JSON syntax, `Content-Type: application/json`, required fields, and enum values. Compare the payload with the README example. The generator requires a valid goal, experience, training days, session duration, and nonempty equipment list; `programWeeks` is optional (defaults to 1) and may be 1–8. The React UI selects 4–8 weeks.

```bash
curl -i -X POST http://localhost:8080/api/programs/generate \
  -H 'Content-Type: application/json' \
  -d '{"goal":"STRENGTH","experience":"INTERMEDIATE","trainingDays":1,"sessionMinutes":60,"programWeeks":4,"availableEquipment":["Dumbbell","Bodyweight"]}'
```

A request with an unrecognized enum or malformed syntax should be corrected at the caller; do not bypass validation.

## 7. API returns 404, 405, or a JSON-path test says “No value”

- **404**: Check resource ID, session number, and whether it was deleted.
- **405 Method Not Allowed**: Confirm both HTTP verb and mapping. For example, completion uses `PUT` to mark complete and `DELETE` to undo; saved-program removal is `DELETE /api/programs/saved/{id}`.
- **`No value at JSON path $[0]` in MockMvc:** Print response using `.andDo(print())`. If the controller calls `createMultiWeekSchedule(...)`, stub that method rather than the older `createWeeklySchedule(...)`. An unstubbed Mockito list-returning method can yield `[]`, so `$[0]` is absent.

## 8. Workout logs do not appear / cannot save

1. Logs only apply to **saved** programs. An unsaved browser draft has no program ID.
2. Use the exact `exerciseId` from that saved session's `schedule`, and `setNumber` within its prescribed sets.
3. Enter nonnegative weight (0 for bodyweight), positive integer reps, and optional actual RPE between 1 and 10.
4. The log `PUT` replaces all saved sets for that session; incomplete log entries may be omitted. Marking completion is a separate endpoint.
5. If exercises are swapped after logging, existing log rows for the old exercise can become logically stale. For this MVP, avoid swapping logged exercises without reviewing/clearing their logs.

## 9. ExerciseDB results are missing or return 502

The app's own exercises and workout generation work without ExerciseDB. The external lookup requires internet connectivity and a responsive external API. Search matches may not exactly match the local exercise name. Try another exercise, check backend logs, and retry later. Avoid presenting third-party search availability as guaranteed.

## 10. Unsaved generated program disappears

The Generate Program page saves **one unsaved draft per browser/origin** using `localStorage`. The user can navigate or refresh, but clearing browser storage, using private mode, or opening another browser/device may lose the draft. Saving to PostgreSQL is a separate explicit action. Generating a new program replaces the old draft.

## AI-assisted debugging workflow (examples)

AI tools can help interpret error messages, **but changes should be verified against the actual code and test output**. Useful prompts include:

> “Here is my Spring Boot stack trace and `application.properties`. Identify whether the failure is in JDBC configuration, Docker networking, or Hibernate initialization. Propose the smallest testable change.”

> “Here is the MockMvc request/response from `.andDo(print())` and the controller method signature. Explain why `jsonPath('$[0]')` has no value without inventing JSON that is not present.”

> “Compare these React Router dependencies and imports for a duplicate-context problem. Show a consistent dependency fix and how to verify it with `npm ls`.”

Record your actual fix and re-run the relevant test. Do not copy AI output directly into the codebase without checking imports, versions, and behavior. This guide includes AI-assisted organization of troubleshooting steps; **successful execution must still be confirmed on the submission machine**.
