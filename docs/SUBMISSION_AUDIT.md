# Rubric Audit and Verification Record

**Source reviewed:** user-supplied `workout-generator-project.zip`, 4 November 2026. The audit inspected Java, React, package/configuration files and the XML JUnit result files included in the upload. The ZIP also contained prebuilt `.gradle/`, `build/`, `.git/`, `.idea/`, `__MACOSX/` and `.DS_Store` content; the revised deliverable intentionally omits those files.

## Rubric assessment

| Category (max points) | Evidence in this project | Assessment / remaining proof |
|---|---|---|
| Startup and cross-component integration (**100**) | Docker Compose PostgreSQL config matches `localhost:5433` JDBC config; Vite `/api` proxy matches Spring Boot port 8080; frontend page routes/API paths correspond to controllers; seeded exercise data included | **Not yet certifiable as 100** without fresh `docker compose up`, `./gradlew bootRun`, `npm ci`, build, and end-to-end workflow on target machine. Use the README and `scripts/smoke-test.sh`. |
| Technical code walkthrough (**100**) | Layered Spring controllers/services/repositories, DTO validation, JPA/soft delete, React state, localStorage drafts, periodization, workout logging | Technical quality is demonstrable; rubric score ultimately depends on presenter's explanation. See `PRESENTATION_GUIDE.md`. |
| API-first docs and troubleshooting (**120**) | New root `../../workout-generator-project/README.md` lists all mapped routes, verbs, example requests/responses, setup; new `TROUBLESHOOTING.md` addresses real errors and AI-assisted diagnostic prompts | **Documentation substantially improved**; review for course-specific requirements and confirm code examples in running app. |
| Prepared to answer questions (**40**) | Technical Q&A covers data flow, design choices, DB model, validation, React Router, Docker, RPE and limitations | Read and practice answers; cannot guarantee oral performance from files. |
| Professional, engaging presentation (**40**) | Timed live demo outline, readiness checklist, peer engagement suggestions | Requires presenter rehearsal and working live demo; cannot grade from source code. |

**Rubric maximum:** 400 points. A reliable numeric grade cannot be awarded solely from a ZIP file; oral and runtime categories require a live assessment.

## Verified by inspection

- ZIP contains **13 JUnit XML suites recording 119 tests, 0 failures, 0 errors, 0 skipped**. These are archived results from the user's computer, *not tests rerun by this audit*.
- JavaScript/JSX source files passed a local TypeScript parser **syntax-only** check (0 syntax diagnostics). This is not a Vite build, React integration test, or ESLint run.
- API routes were enumerated from the Spring Boot controller annotations.
- Direct `react-router` version 8 declaration was removed because the frontend imports `react-router-dom` version 7; its transitive Router 7 remains in the lockfile.
- New root README, troubleshooting guide, presentation guide, and non-destructive API smoke-test script added; frontend README changed from default Vite scaffold to project instructions.

## Could not verify in this environment

- The Gradle wrapper requires an initial download from `services.gradle.org`, which is inaccessible in this sandbox; the Java unit/integration tests therefore **could not be rerun**.
- npm packages required by `npm ci` were not in the offline cache, and the registry could not be fetched; **Vite build/lint/Vitest could not be run here**.
- This environment lacks Docker, so startup against a real PostgreSQL container and end-to-end API/database integration **were not executable here**.
- The available Node installation is `22.16.0`, older than some dependencies in the submitted lockfile; the README calls out the required newer patch level.

## Known limitations to explain honestly

- No user accounts or API ownership checks: **local/single-user demo only**, not safe for open public multi-user hosting.
- No full Docker Compose orchestration: Compose runs PostgreSQL; Spring Boot and Vite start in separate terminals.
- The app uses `ddl-auto=update`, seeded demo exercises, and development DB credentials; a production deployment needs migrations and secrets management.
- Workout logs and completion are distinct operations. Existing logs can become stale if the underlying exercise is later swapped; avoid swapping an already-logged exercise until that workflow is improved.
- Frontend has a small component test, but no full browser E2E suite; dedicated saved-program and set-log backend integration tests are not in the uploaded source.
- ExerciseDB is an optional external service. Demo instructions/media and exact search matches depend on its availability and terms.

## Final preparation checklist

- [ ] Verify Node version; run `npm ci` cleanly in `frontend/`.
- [ ] Run `docker compose up -d postgres-db`; inspect health/logs.
- [ ] Run `./gradlew test`; confirm Testcontainers and 119+ expected tests pass.
- [ ] Start backend (`./gradlew bootRun`); run `bash scripts/smoke-test.sh`.
- [ ] Run `npm run build`, `npm run lint`, and `npm run test` in `frontend/`.
- [ ] Perform live UI flow: generate > switch weeks > swap > navigate/restore draft > save > load > log set > reload > mark complete.
- [ ] Check 400/404 error display and ExerciseDB failure handling.
- [ ] Rehearse the technical Q&A and professional demo with working terminals.
