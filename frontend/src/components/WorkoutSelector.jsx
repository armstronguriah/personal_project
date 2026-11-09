import {ui} from '../styles/ui';
import {formatWorkoutType} from '../utils/formatters';

// Presentational selector; the parent confirms discarding unsaved changes.
export default function WorkoutSelector({
    programs, programId, onProgramChange, saving,
    totalWeeks, week, onWeekChange, weekSessions,
    sessionNumber, onSessionChange
}) {
    return (
        <section className={`${ui.card} space-y-5`}>
            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    Select Your Workout
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Choose a program, week, and session to log.
                </p>
            </div>

            <div>
                <label htmlFor="tracker-program" className={ui.label}>
                    Saved Program
                </label>

                <select
                    id="tracker-program"
                    value={programId}
                    onChange={onProgramChange}
                    disabled={saving}
                    className={ui.input}
                >
                    {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                            {program.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Week Navigation */}
            {totalWeeks > 1 && (
                <div>
                    <h3 className={ui.label}>Training Week</h3>

                    <div
                        role="group"
                        aria-label="Training week"
                        className="flex flex-wrap gap-2"
                    >
                        {Array.from(
                            {length: totalWeeks},
                            (_, index) => index + 1
                        ).map((weekNumber) => (
                            <button
                                key={weekNumber}
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                    onWeekChange(weekNumber)
                                }
                                aria-pressed={week === weekNumber}
                                className={
                                    week === weekNumber
                                        ? ui.primaryButton
                                        : ui.secondaryButton
                                }
                            >
                                Week {weekNumber}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Session Navigation */}
            <div>
                <h3 className={ui.label}>Workout Session</h3>

                <div className="flex flex-wrap gap-2">
                    {weekSessions.map((session, index) => (
                        <button
                            key={session.sessionNumber}
                            type="button"
                            disabled={saving}
                            onClick={() =>
                                onSessionChange(session.sessionNumber)
                            }
                            className={
                                session.sessionNumber === sessionNumber
                                    ? ui.primaryButton
                                    : ui.secondaryButton
                            }
                        >
                            Day {index + 1} — {
                            formatWorkoutType(session.workoutType)
                        }
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
