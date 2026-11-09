import {ui} from '../styles/ui';
import {entryKey} from '../utils/workoutLog';
import {formatWorkoutPrescription, isCardioExercise} from '../utils/workoutPrescription';

// Displays the lifting set inputs OR cardio notes for a single exercise.
// No API calls or persistence state: changes are reported to WorkoutTracker.
export default function WorkoutExerciseLog({
    exercise,
    entries,
    cardioNotes,
    onEntryChange,
    onCardioNotesChange
}) {
    return (
        <article
            className={`${ui.card} space-y-5`}
        >
            {/* Exercise Heading */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">
                        {exercise.exerciseName}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        {formatWorkoutPrescription(exercise)}
                    </p>
                </div>

                <span className={ui.badge}>
                    Target RPE: {
                    exercise.targetRpe ?? '—'
                }
                 </span>
            </div>

            {isCardioExercise(exercise) && (
                <div className="space-y-2">
                    <label
                        htmlFor={`cardio-notes-${exercise.exerciseId}`}
                        className={ui.label}
                    >
                        Cardio Notes
                    </label>
                    <textarea
                        id={`cardio-notes-${exercise.exerciseId}`}
                        rows={3}
                        maxLength={1000}
                        value={cardioNotes[exercise.exerciseId] ?? ''}
                        onChange={(event) =>
                            onCardioNotesChange(exercise.exerciseId, event.target.value)
                        }
                        placeholder="Distance, pace, intervals completed, how you felt..."
                        className={`${ui.input} w-full resize-y`}
                    />
                    <p className="text-xs text-slate-500">
                        Save Workout Log to keep this note. {String(cardioNotes[exercise.exerciseId] ?? '').length}/1000 characters.
                    </p>
                </div>
            )}

            {/* Set Entry Table — resistance exercises only */}
            {!isCardioExercise(exercise) && (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] border-collapse">

                        <thead>
                        <tr>
                            <th className={ui.tableHeader}>
                                Set
                            </th>

                            <th className={ui.tableHeader}>
                                Weight (lb)
                            </th>

                            <th className={ui.tableHeader}>
                                Reps
                            </th>

                            <th className={ui.tableHeader}>
                                Actual RPE
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {Array.from(
                            {length: exercise.sets},
                            (_, index) => index + 1
                        ).map((setNumber) => {
                            const key = entryKey(
                                exercise.exerciseId,
                                setNumber
                            );

                            const entry = entries[key] ?? {
                                weightLb: '',
                                reps: String(exercise.reps),
                                actualRpe: ''
                            };

                            return (
                                <tr key={setNumber}>
                                    <td className={ui.tableCell}>
                                        {setNumber}
                                    </td>

                                    <td className={ui.tableCell}>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={entry.weightLb}
                                            aria-label={`${exercise.exerciseName} set ${setNumber} weight`}
                                            onChange={(event) =>
                                                onEntryChange(
                                                    exercise,
                                                    setNumber,
                                                    'weightLb',
                                                    event.target.value
                                                )
                                            }
                                            className={`${ui.input} min-w-24`}
                                            placeholder="0"
                                        />
                                    </td>

                                    <td className={ui.tableCell}>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={entry.reps}
                                            aria-label={`${exercise.exerciseName} set ${setNumber} reps`}
                                            onChange={(event) =>
                                                onEntryChange(
                                                    exercise,
                                                    setNumber,
                                                    'reps',
                                                    event.target.value
                                                )
                                            }
                                            className={`${ui.input} min-w-20`}
                                        />
                                    </td>

                                    <td className={ui.tableCell}>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            step="0.5"
                                            value={entry.actualRpe}
                                            aria-label={`${exercise.exerciseName} set ${setNumber} actual RPE`}
                                            onChange={(event) =>
                                                onEntryChange(
                                                    exercise,
                                                    setNumber,
                                                    'actualRpe',
                                                    event.target.value
                                                )
                                            }
                                            className={`${ui.input} min-w-20`}
                                            placeholder="Optional"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </article>
    );
}
