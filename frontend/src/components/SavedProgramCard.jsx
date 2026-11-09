import GeneratedWorkout from './GeneratedWorkout';
import {ui} from '../styles/ui';
import { formatWorkoutType as formatLabel } from '../utils/formatters';

// Presentational component: the page owns program state and API actions.
export default function SavedProgramCard({
    program,
    isExpanded,
    deletingProgramId,
    updatingKey,
    onDelete,
    onToggleExpand,
    onToggleComplete,
    onSwapExercise
}) {
    const completedSessions = program.completedSessions ?? [];
    const totalSessions = program.schedule.length;
    const completedCount = completedSessions.length;
    const progressPercent = totalSessions > 0
        ? Math.min(100, (completedCount / totalSessions) * 100)
        : 0;
    const isComplete = totalSessions > 0 && completedCount === totalSessions;
    const isInProgress = completedCount > 0 && !isComplete;

    return (
        <article
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >

            {/* Program Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-4">

                    <div>
                        <h3 className="text-xl font-bold text-slate-900">
                            {program.name}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Created on{' '}
                            {new Date(
                                program.createdAt
                            ).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Program Status */}
                    <span
                        className={
                            isComplete
                                ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700'
                                : isInProgress
                                    ? ui.badge
                                    : 'rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'
                        }
                    >
  {isComplete
      ? 'Completed'
      : isInProgress
          ? 'In Progress'
          : 'Not Started'}
</span>
                </div>
            </div>

            {/* Program Details */}
            <div className="space-y-6 p-5 sm:p-6">

                {/* Program Preferences */}
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-4">

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Training Goal
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatLabel(program.preferences.goal)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Experience
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatLabel(program.preferences.experience)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Training Days
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {program.preferences.trainingDays} / week
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Duration
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {program.preferences.sessionMinutes} min
                        </p>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-3">

                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900">
                            Workout Progress
                        </h4>

                        <span className="text-sm font-semibold text-blue-700">
    {Math.round(progressPercent)}%
  </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                        role="progressbar"
                        aria-label={`${program.name} completion`}
                        aria-valuenow={completedCount}
                        aria-valuemin={0}
                        aria-valuemax={totalSessions}
                        className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                    >
                        <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-300"
                            style={{
                                width: `${progressPercent}%`
                            }}
                        />
                    </div>

                    <p className="text-xs text-slate-500">
                        {completedCount} of {totalSessions}{' '}
                        workouts completed
                    </p>
                </div>

                {/* View Workouts Button */}

                {/* Program Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">

                    <p className="text-sm text-slate-500">
                        {totalSessions} workout sessions
                    </p>

                    <div className="flex flex-wrap items-center gap-3">

                        {/* Delete Program */}
                        <button
                            type="button"
                            onClick={() =>
                                onDelete()
                            }
                            disabled={
                                deletingProgramId !== null ||
                                updatingKey !== null
                            }
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {deletingProgramId === program.id
                                ? 'Deleting...'
                                : 'Delete Program'}
                        </button>

                        {/* Expand / Collapse Workouts */}
                        <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={() =>
                                onToggleExpand()
                            }
                            disabled={deletingProgramId === program.id}
                            className={
                                isExpanded
                                    ? ui.secondaryButton
                                    : ui.primaryButton
                            }
                        >
                            {isExpanded
                                ? 'Hide Workouts'
                                : 'View Workouts'}
                        </button>

                    </div>
                </div>

            </div>

            {/* Expanded Workout Schedule */}
            {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-6 sm:px-6">


                    <GeneratedWorkout
                        schedule={program.schedule}
                        completedSessions={completedSessions}
                        trainingDays={program.preferences.trainingDays}
                        availableEquipment={
                            program.preferences.availableEquipment ?? []
                        }
                        updatingSession={
                            updatingKey?.startsWith(`${program.id}:`)
                                ? Number(updatingKey.split(':')[1])
                                : null
                        }
                        onToggleComplete={(sessionNumber, shouldComplete) =>
                            onToggleComplete(sessionNumber, shouldComplete)
                        }
                        onSwapExercise={(
                            sessionNumber,
                            currentExerciseId,
                            replacement
                        ) =>
                            onSwapExercise(sessionNumber, currentExerciseId, replacement)
                        }
                    />

                </div>
            )}
        </article>
    );
}
