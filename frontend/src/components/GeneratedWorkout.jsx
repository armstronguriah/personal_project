import {useEffect, useState} from 'react';

import ExerciseSwapModal from './ExerciseSwapModal';
import ExerciseDetailsModal from './ExerciseDetailsModal';
import {ui} from '../styles/ui';
import { getExerciseById } from '../services/exerciseApi';
import {formatWorkoutPrescription, isCardioExercise} from '../utils/workoutPrescription';

function formatWorkoutType(type) {
    return (type ?? '')
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function GeneratedWorkout({
                                             schedule = [],
                                             completedSessions = [],
                                             onToggleComplete,
                                             updatingSession = null,
                                             onSwapExercise,
                                             availableEquipment = [],
                                             trainingDays,
                                             onScrollToSave
                                         }) {
    // Exercise swapping
    const [swapTarget, setSwapTarget] = useState(null);

    // Exercise details
    const [viewingExerciseId, setViewingExerciseId] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState('');


    const [activeWeek, setActiveWeek] = useState(1);

    const daysPerWeek =
        Number(trainingDays) || schedule.length || 1;

    const totalWeeks = Math.ceil(
        schedule.length / daysPerWeek
    );

// Keep the selected week valid if a new schedule loads.
    const safeActiveWeek = Math.min(
        Math.max(1, activeWeek),
        Math.max(1, totalWeeks)
    );

// Show only workouts belonging to the selected week.
    const visibleSchedule = schedule.slice(
        (safeActiveWeek - 1) * daysPerWeek,
        safeActiveWeek * daysPerWeek
    );


    // Fetch local exercise information before opening details
    useEffect(() => {
        if (viewingExerciseId === null) {
            return;
        }

        const controller = new AbortController();

        async function loadExerciseDetails() {
            setDetailsLoading(true);
            setDetailsError('');
            setSelectedExercise(null);

            try {
                const exercise = await getExerciseById(
                    viewingExerciseId,
                    controller.signal
                );

                if (!controller.signal.aborted) {
                    setSelectedExercise(exercise);
                }

            } catch (error) {
                if (!controller.signal.aborted) {
                    setDetailsError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setDetailsLoading(false);
                }
            }
        }

        loadExerciseDetails();

        return () => controller.abort();
    }, [viewingExerciseId]);

    // Open exercise details
    function handleViewDetails(exerciseId) {
        setViewingExerciseId(exerciseId);
        setSelectedExercise(null);
        setDetailsError('');
    }

    // Close exercise details
    function handleCloseDetails() {
        setViewingExerciseId(null);
        setSelectedExercise(null);
        setDetailsError('');
    }

    // Replace a workout exercise
    async function handleSwap(replacement) {
        if (!swapTarget || !onSwapExercise) {
            return;
        }

        await onSwapExercise(
            swapTarget.day.sessionNumber,
            swapTarget.exercise.exerciseId,
            replacement
        );

        // Close only after a successful swap
        setSwapTarget(null);
    }

    if (schedule.length === 0) {
        return (
            <div className={ui.panel}>
                <p className="text-sm text-blue-800">
                    No workouts were generated.
                </p>
            </div>
        );
    }


    return (
        <section className="space-y-5">

            {/* Generated Workout Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">

                <div>
                    <h2 className="text-xl font-bold text-slate-900">
                        Your Workout Program
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {schedule.length} training sessions
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        For lifting: target RPE 7 ≈ 3 reps remaining;
                        RPE 8 ≈ 2, etc.
                        For cardio: target effort is perceived exertion
                        on a 1–10 scale.
                    </p>
                </div>

                {/* Only appears when the parent provides the callback */}
                {onScrollToSave && (
                    <button
                        type="button"
                        onClick={onScrollToSave}
                        className={ui.primaryButton}
                    >
                        Save Program
                    </button>
                )}

            </div>



            {/* Exercise Details Loading */}
            {detailsLoading && (
                <div
                    role="status"
                    className={`${ui.panel} flex items-center gap-3`}
                >
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"/>

                    <p className="text-sm text-blue-800">
                        Loading exercise information...
                    </p>
                </div>
            )}

            {/* Exercise Details Error */}
            {detailsError && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {detailsError}
                </div>
            )}


            {/* Week Navigation */}
            {totalWeeks > 1 && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Week {safeActiveWeek} of {totalWeeks}
                        </h3>

                        <span className={ui.badge}>
                            {schedule.length} Total Sessions
                        </span>
                    </div>

                    <nav
                        aria-label="Program weeks"
                        className="flex flex-wrap gap-2"
                    >
                        {Array.from(
                            {length: totalWeeks},
                            (_, index) => index + 1
                        ).map((week) => (
                            <button
                                key={week}
                                type="button"
                                onClick={() => setActiveWeek(week)}
                                aria-current={
                                    safeActiveWeek === week ? 'step' : undefined
                                }
                                className={
                                    safeActiveWeek === week
                                        ? 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white'
                                        : 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50'
                                }
                            >
                                Week {week}
                            </button>
                        ))}
                    </nav>
                </div>
            )}


            {/* Workout Sessions */}
            {visibleSchedule.map((day) => {
                const isCompleted = completedSessions.includes(
                    day.sessionNumber
                );

                return (
                    <article
                        key={day.sessionNumber}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >

                        {/* Session Header */}
                        <div
                            className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-5 py-4">

                            <div>
                                <h3 className="font-semibold text-slate-900">
                                    Session {day.sessionNumber}
                                    {' — '}
                                    {formatWorkoutType(day.workoutType)}
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    {day.exercises.length} exercises
                                </p>
                            </div>

                            <span
                                className={
                                    isCompleted
                                        ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700'
                                        : ui.badge
                                }
                            >
                {isCompleted ? 'Completed' : 'Workout'}
              </span>
                        </div>

                        {/* Exercise Table */}
                        {day.exercises.length === 0 ? (
                            <p className="px-5 py-6 text-sm text-slate-500">
                                No exercises assigned to this session.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] table-fixed border-collapse">
                                    <colgroup>
                                        <col className="w-[34%]" />
                                        <col className="w-[9%]" />
                                        <col className="w-[9%]" />
                                        <col className="w-[21%]" />
                                        <col className="w-[27%]" />
                                    </colgroup>

                                    <thead>
                                    <tr>
                                        <th className={ui.tableHeader}>
                                            Exercise
                                        </th>

                                        <th
                                            className={`${ui.tableHeader} text-center`}
                                        >
                                            Sets
                                        </th>

                                        <th
                                            className={`${ui.tableHeader} text-center`}
                                        >
                                            Reps
                                        </th>

                                        <th
                                            className={`${ui.tableHeader} text-center`}
                                        >
                                            Target RPE / Effort
                                        </th>

                                        <th
                                            className={`${ui.tableHeader} text-right`}
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {day.exercises.map((exercise) => (
                                        <tr
                                            key={exercise.exerciseId}
                                            className="transition-colors hover:bg-slate-50"
                                        >

                                            {/* Exercise Name */}
                                            <td
                                                className={`${ui.tableCell} font-medium text-slate-900`}
                                            >
                                                {exercise.exerciseName}

                                                {isCardioExercise(exercise) && (
                                                    <p className="mt-1 text-xs font-normal text-blue-700">
                                                        {formatWorkoutPrescription(exercise)}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Sets */}
                                            <td
                                                className={`${ui.tableCell} text-center tabular-nums`}
                                            >
                                                {isCardioExercise(exercise) ? '—' : exercise.sets}
                                            </td>

                                            {/* Reps */}
                                            <td
                                                className={`${ui.tableCell} text-center tabular-nums`}
                                            >
                                                {isCardioExercise(exercise) ? '—' : exercise.reps}
                                            </td>

                                            <td className={`${ui.tableCell} text-center`}>
                                                {exercise.targetRpe != null ? (
                                                    <span className="inline-flex rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                                        {exercise.targetRpe}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>

                                            {/* Exercise Actions */}
                                            <td className={`${ui.tableCell} text-right`}>
                                                <div className="flex flex-wrap items-center justify-end gap-2">

                                                    {/* View Exercise Details */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleViewDetails(
                                                                exercise.exerciseId
                                                            )
                                                        }
                                                        disabled={detailsLoading}
                                                        className={`${ui.secondaryButton} whitespace-nowrap`}
                                                    >
                                                        View Details
                                                    </button>

                                                    {/* Swap Exercise */}
                                                    {onSwapExercise && (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isCompleted ||
                                                                updatingSession === day.sessionNumber
                                                            }
                                                            onClick={() =>
                                                                setSwapTarget({
                                                                    day,
                                                                    exercise
                                                                })
                                                            }
                                                            title={
                                                                isCompleted
                                                                    ? 'Undo completion before swapping'
                                                                    : 'Replace this exercise'
                                                            }
                                                            className={`${ui.secondaryButton} whitespace-nowrap`}
                                                        >
                                                            Swap
                                                        </button>
                                                    )}

                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Mark Workout Complete */}
                        {onToggleComplete && (
                            <div className="flex justify-end border-t border-slate-100 px-5 py-4">
                                <button
                                    type="button"
                                    aria-pressed={isCompleted}
                                    disabled={
                                        updatingSession === day.sessionNumber
                                    }
                                    onClick={() =>
                                        onToggleComplete(
                                            day.sessionNumber,
                                            !isCompleted
                                        )
                                    }
                                    className={
                                        isCompleted
                                            ? ui.secondaryButton
                                            : ui.primaryButton
                                    }
                                >
                                    {updatingSession === day.sessionNumber
                                        ? 'Updating...'
                                        : isCompleted
                                            ? 'Undo Completion'
                                            : 'Mark Complete'}
                                </button>
                            </div>
                        )}

                    </article>
                );
            })}

            {/* Exercise Swap Modal */}
            {swapTarget && onSwapExercise && (
                <ExerciseSwapModal
                    exercise={swapTarget.exercise}
                    sessionExercises={swapTarget.day.exercises}
                    availableEquipment={availableEquipment}
                    onSwap={handleSwap}
                    onClose={() => setSwapTarget(null)}
                />
            )}

            {/* Exercise Details Modal */}
            {selectedExercise && (
                <ExerciseDetailsModal
                    exercise={selectedExercise}
                    onClose={handleCloseDetails}
                />
            )}

        </section>
    );
}
