# Presentation and Technical Walkthrough — Workout Generator

## Preparation before guests arrive

Keep Docker Desktop, Spring Boot (`./gradlew bootRun`), and Vite (`npm run dev`) running. Open `http://localhost:5173` and verify `/api/health` returns 200. Prepare one saved 4-week strength program with a logged workout and one unsaved draft so every feature can be demonstrated quickly. Keep a terminal showing a passing test run and another showing the API health request. Disable notifications and close unrelated tabs.

## Suggested live demo (about 6–8 minutes; adapt to your time limit)

| Order | Demo | Technical explanation |
|---|---|---|
| 1 | Dashboard and navbar (30 sec) | React Router displays page components; `AppShell` shares navigation/layout |
| 2 | Exercise Library (60 sec) | Spring REST controller, validation, JPA repository, soft deletion and filtering |
| 3 | Generate 4-week program (90 sec) | `ProgramService` selects equipment-compatible movement patterns; `PeriodizationPlanner` changes sets, reps, and target RPE |
| 4 | Switch weeks, inspect and swap an exercise (60 sec) | Immutable React state update; compatible swaps preserve prescription |
| 5 | Leave Generate and return (30 sec) | Unsaved draft is restored from `localStorage`; user must explicitly save to DB |
| 6 | Save and open My Programs (45 sec) | Spring service serializes preferences and schedule to PostgreSQL; completion tracking is stored separately |
| 7 | Workout Tracker: log one set, save, revisit (60 sec) | Per-set relational records hold actual weight/reps/RPE; GET/PUT session log endpoints |
| 8 | Open tests, README, or network tab (45 sec) | Explain automated test scope and what still requires runtime verification |

**Audience engagement:** Ask a peer which equipment they would select and choose that preset for the demo; then ask whether an exercise should be swapped. Use the answer to demonstrate the relevant UI and backend validation. This keeps engagement relevant and technically grounded.

## Explain the architecture in your own words

> “The browser renders React components. Their `fetch('/api/...')` calls go through Vite's development proxy to Spring Boot. Controllers validate and route HTTP requests, services implement the rules for exercise selection, periodization, and saved-program operations, and Spring Data JPA accesses PostgreSQL. Actual workout logs are stored separately from the generated prescription, so a user's recorded performance does not rewrite the planned workout.”

## Questions you should be able to answer

**Why did you choose Spring Boot and React?** Spring Boot provides dependency injection, validation, REST endpoints, and JPA data access; React offers reusable components and state for the interactive schedule and tracker. They communicate through JSON over HTTP.

**What happens when the user clicks Generate?** The form assembles `GenerateProgramRequest`; the controller validates it; `ProgramService` selects a weekly split and exercises based on movement pattern, equipment, goal, experience, and session time; `PeriodizationPlanner` expands the base week and varies prescriptions. The JSON schedule returns to React.

**What is dependency injection?** Spring instantiates and supplies services and repositories to constructors. The controller depends on an abstraction of the business operation rather than manually constructing database dependencies, so the service can be mocked in controller tests.

**Why separate controller/service/repository?** HTTP concerns, business decisions, and persistence have different responsibilities. A controller test can mock the service; a service test can mock the repository; JPA integration tests can target the database layer.

**How is data validated?** DTOs use Jakarta Bean Validation annotations such as `@NotBlank`, `@Min`, and `@Max`. The global exception handler formats malformed JSON and validation failures as HTTP 400 responses; services enforce rules requiring database state, such as no duplicate exercise swaps.

**What is the difference between a Java record and JPA entity?** `WorkoutExercise`/`WorkoutDay` records are concise immutable payloads. `SavedProgram` and `WorkoutSetLog` entities have persistent database identity and lifecycle.

**What is periodization here?** This is a deterministic, goal-specific 4- or 8-week prescription pattern with changes in sets, reps, and target RPE and deload templates. It is **not** auto-adjusting based on weight lifted. The user can log actual RPE separately for future progression features.

**How do exercise swaps work?** React presents candidates with matching movement pattern and permitted equipment; the backend re-checks those constraints and whether the session is completed. It retains the original sets, reps, and target RPE.

**Why store a draft in localStorage?** It persists unsaved UI state across navigation/refresh without creating unwanted PostgreSQL records. It is browser-local, not private user storage, and not suitable as shared-account persistence.

**What does Docker do here?** Docker Compose creates the PostgreSQL service and persistent named volume. The Spring backend and Vite frontend still run on the host; the whole stack is not containerized.

**What tests do you have?** The submitted ZIP contains archived JUnit XML showing 119 tests passed with zero failures. Covered areas include exercise controller, repository, services, program controller, planner, model and DTO tests. These are historic results, not a clean-room rerun. The frontend includes a GeneratedWorkout component test; run it with Vitest after installing dependencies. Dedicated tests for all saved program and tracker endpoints are a useful next improvement.

**Can anybody access another user's workouts if you deploy this publicly?** Yes; the API has no user accounts or ownership checks. This version is for locally run demos, not a public multi-user service. A public version needs authentication, authorization, and separate data ownership.

**How are API failures handled?** Controllers return appropriate HTTP responses for missing resources, validation errors, and external service failure; the frontend shows errors instead of assuming every fetch succeeds. Database downtime still prevents normal operation; the setup guide documents how to diagnose it.

**Why didn't you deploy the application?** The deliverable is a reproducible local full-stack project. Public hosting requires security and user management that are beyond this MVP. A README and Docker-backed database allow reviewers to run it locally.

## Presentation quality checklist

- Show a clean browser tab, readable zoom, and sample data that works.
- Use the README's real API examples rather than typing long JSON live.
- Explain **why** the design was chosen, not merely the method names.
- Distinguish target RPE from actual RPE, and browser draft from saved database record.
- Be transparent about limitations: no authentication; no automated weight progression; external ExerciseDB depends on internet; logging only for saved workouts.
- Verify startup and build commands from a clean environment before presenting.
- Finish with one future improvement: user accounts, stronger test coverage for the tracker, or adaptive training progression.
