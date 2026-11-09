# Frontend architecture (presentation notes)

This React frontend uses a **page / component / service** split. It does not use Redux or another global state library because the main features have independent state.

## Folder responsibilities

| Folder | What belongs here | Examples |
|---|---|---|
| `src/pages/` | Route entry points; own feature data, async lifecycle, and major actions | `GenerateProgram.jsx`, `MyProgram.jsx`, `WorkoutTracker.jsx`, `ExerciseLibrary.jsx` |
| `src/components/` | Reusable UI; receive values and callbacks as props; may own *UI-only* state (modal visibility, week tabs) | `WorkoutSetupForm.jsx`, `SavedProgramCard.jsx`, `WorkoutSelector.jsx`, `WorkoutExerciseLog.jsx` |
| `src/services/` | All HTTP calls, endpoint URLs, response validation/errors. **No React hooks/state.** | `programApi.js`, `exerciseApi.js`, `workoutLogApi.js` |
| `src/utils/` | Pure formatting or helper functions | `workoutPrescription.js`, `formatters.js`, `workoutLog.js` |
| `src/constants/` | Options shared by features | `exerciseOptions.js` |
| `src/styles/` | Shared Tailwind class strings | `ui.js` |

## Who owns which state?

- **`GenerateProgram.jsx` (page):** preferences, generation request, generated schedule, selected preview week, saving, errors and the browser draft. It passes values and callbacks to **`WorkoutSetupForm`**, which only renders the form.
- **`MyProgram.jsx` (page):** list of saved programs, expanded card ID, update/delete status. A **`SavedProgramCard`** receives each program and callback props; it does not perform network requests or own the program list.
- **`WorkoutTracker.jsx` (page):** selected program/week/session, logged sets, cardio notes, unsaved-change status, saving, completion and errors. **`WorkoutSelector`** and **`WorkoutExerciseLog`** display controls and report changes through callbacks.
- **`ExerciseLibrary.jsx` (page):** exercise records, filters, edit/delete state and actions. It already delegates presentation to `ExerciseFilters`, `ExerciseTable`, and `ExerciseForm`.
- **`Dashboard.jsx` (page):** fetches and summarizes saved programs and exercise count; primarily displays statistics.
- **`GeneratedWorkout.jsx` and `ExerciseDetailsModal.jsx` (components):** retain *local UI state* for navigation, modal details, and exercise selection; their HTTP calls go through `exerciseApi.js`.

## Example flow: create a program

1. User changes an option inside `WorkoutSetupForm`.
2. Form calls a callback such as `onChange`; the page `GenerateProgram.jsx` updates its `preferences` state.
3. User submits the form; `GenerateProgram.jsx` builds and validates the request and calls `generateWorkoutProgram()` in `services/programApi.js`.
4. The service sends JSON to Spring Boot's `POST /api/programs/generate` endpoint and returns the response.
5. The page stores the schedule in React state and renders `GeneratedWorkout`.
6. The Save action calls `saveWorkoutProgram()`; the backend persists the program in PostgreSQL. Before saving, the draft remains in browser `localStorage`.

## Example flow: log cardio notes

1. `WorkoutTracker.jsx` fetches a selected session's sets and notes with `getSessionLogs()`.
2. `WorkoutExerciseLog` displays resistance-set inputs *or* a cardio text area.
3. On text change, the child invokes `onCardioNotesChange`, and the parent updates `cardioNotes` state / flags the log as unsaved.
4. On Save, the page validates resistance sets and calls `saveResistanceSets()` followed by `saveCardioNotes()` in `workoutLogApi.js`.
5. **Caveat:** the two saves use separate backend endpoints, so the operation is not transactional across both requests. The page reports partial success when sets save but notes fail.

## Why this structure?

The page manages **what happens** (state and workflows); components manage **what users see** (UI); services manage **how the app talks to Spring Boot**. That keeps data requests consistent, avoids large blocks of JSX inside action handlers, and makes parts easier to test separately.

## Practical review before submission

Run these from `frontend/` in an environment matching your package engines:

```bash
npm ci
npm run lint
npm run build
npm test
```

Then manually smoke-test generated program creation/saving, swapping exercises, reloading stored drafts, exercise detail modals, deleting saved programs, and both cardio/lifting logging. The new files were syntax/import checked but a full Vite build is not verified in this workspace because package installation could not complete.
