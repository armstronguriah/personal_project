
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import GeneratedWorkout from '../components/GeneratedWorkout';
import { ui } from '../styles/ui';

// Format enum values for display
function formatLabel(value) {
    if (!value) return 'Not specified';

    return value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function MyPrograms() {
    const [programs, setPrograms] = useState([]);
    const [expandedId, setExpandedId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [updatingKey, setUpdatingKey] = useState(null);
    const [completionError, setCompletionError] = useState('');

    const [deletingProgramId, setDeletingProgramId] = useState(null);
    const [deleteError, setDeleteError] = useState('');

    // Load saved programs
    useEffect(() => {
        const controller = new AbortController();

        async function loadPrograms() {
            try {
                const response = await fetch('/api/programs/saved', {
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error('Unable to load saved programs.');
                }

                const data = await response.json();
                setPrograms(data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadPrograms();

        return () => controller.abort();
    }, []);

    // Update workout completion
    async function updateSessionCompletion(
        programId,
        sessionNumber,
        shouldComplete
    ) {
        if (updatingKey !== null) return;

        const key = `${programId}:${sessionNumber}`;

        setUpdatingKey(key);
        setCompletionError('');

        try {
            const response = await fetch(
                `/api/programs/saved/${programId}/sessions/${sessionNumber}/completion`,
                {
                    method: shouldComplete ? 'PUT' : 'DELETE'
                }
            );

            if (!response.ok) {
                throw new Error(
                    'Unable to update workout completion.'
                );
            }

            const updatedProgram = await response.json();

            setPrograms((previous) =>
                previous.map((program) =>
                    program.id === programId
                        ? updatedProgram
                        : program
                )
            );
        } catch (error) {
            setCompletionError(error.message);
        } finally {
            setUpdatingKey(null);
        }
    }


    async function handleSwapSavedExercise(
        programId,
        sessionNumber,
        currentExerciseId,
        replacement
    ) {
        const response = await fetch(
            `/api/programs/saved/${programId}/sessions/${sessionNumber}/exercises/${currentExerciseId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    replacementExerciseId: replacement.id
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                'Unable to save exercise replacement.'
            );
        }

        // The backend returns the updated saved program
        const updatedProgram = await response.json();

        // Replace just the updated program in React state
        setPrograms((previous) =>
            previous.map((program) =>
                program.id === programId
                    ? updatedProgram
                    : program
            )
        );
    }


    async function handleDeleteProgram(programId, programName) {
        if (deletingProgramId !== null || updatingKey !== null) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete "${programName}"?\n\n` +
            'This action cannot be undone. All completion progress ' +
            'for this program will also be deleted.'
        );

        if (!confirmed) {
            return;
        }

        setDeletingProgramId(programId);
        setDeleteError('');

        try {
            const response = await fetch(
                `/api/programs/saved/${programId}`,
                {
                    method: 'DELETE'
                }
            );

            if (!response.ok) {
                throw new Error('Unable to delete workout program.');
            }

            // Remove the program from React state
            setPrograms((previous) =>
                previous.filter(
                    (program) => program.id !== programId
                )
            );

            // Close the deleted program if it was expanded
            setExpandedId((previous) =>
                previous === programId ? null : previous
            );

        } catch (error) {
            setDeleteError(error.message);
        } finally {
            setDeletingProgramId(null);
        }
    }


    // Calculate overall statistics
    const totalPrograms = programs.length;

    const totalWorkouts = programs.reduce(
        (total, program) => total + program.schedule.length,
        0
    );

    const completedWorkouts = programs.reduce(
        (total, program) =>
            total + (program.completedSessions?.length ?? 0),
        0
    );

    const remainingWorkouts = Math.max(
        totalWorkouts - completedWorkouts,
        0
    );

    // Loading state
    if (loading) {
        return (
            <div className="mx-auto max-w-5xl space-y-6">
                <h1 className={ui.heading}>My Programs</h1>

                <div className={`${ui.card} flex items-center gap-3`}>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

                    <p className="text-sm text-slate-600">
                        Loading your saved programs...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="mx-auto max-w-5xl space-y-6">
                <h1 className={ui.heading}>My Programs</h1>

                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-5"
                >
                    <h2 className="font-semibold text-red-800">
                        Unable to Load Programs
                    </h2>

                    <p className="mt-2 text-sm text-red-700">
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8">

            {/* Page Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
          <span className={ui.badge}>
            Your Training Library
          </span>

                    <h1 className={ui.heading}>
                        My Programs
                    </h1>

                    <p className="max-w-xl text-sm leading-relaxed text-slate-500">
                        View your saved workout programs, track your
                        progress, and complete your training sessions.
                    </p>
                </div>

                <Link
                    to="/generate"
                    className={ui.primaryButton}
                >
                    + New Program
                </Link>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                {/* Total Programs */}
                <div className={ui.card}>
                    <p className="text-sm font-medium text-slate-500">
                        Saved Programs
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {totalPrograms}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                        Your workout plans
                    </p>
                </div>

                {/* Completed Workouts */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-6">
                    <p className="text-sm font-medium text-blue-700">
                        Workouts Completed
                    </p>

                    <p className="mt-2 text-3xl font-bold text-blue-700">
                        {completedWorkouts}
                    </p>

                    <p className="mt-2 text-xs text-blue-600">
                        Across all programs
                    </p>
                </div>

                {/* Remaining Workouts */}
                <div className={ui.card}>
                    <p className="text-sm font-medium text-slate-500">
                        Workouts Remaining
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {remainingWorkouts}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                        Sessions left to complete
                    </p>
                </div>
            </div>

            {/* Completion Error */}
            {completionError && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {completionError}
                </div>
            )}

            {deleteError && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {deleteError}
                </div>
            )}

            {/* Saved Programs Section */}
            <section className="space-y-5">

                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                        Saved Workout Programs
                    </h2>

                    <span className="text-sm text-slate-500">
            {totalPrograms} total
          </span>
                </div>

                {/* Empty State */}
                {programs.length === 0 ? (
                    <div className={`${ui.card} py-12 text-center`}>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <span className="text-2xl font-bold text-blue-600">
                W
              </span>
                        </div>

                        <h3 className="mt-5 text-lg font-semibold text-slate-900">
                            No Saved Programs Yet
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                            You haven't saved any workout programs yet.
                            Generate a personalized training plan to get started.
                        </p>

                        <Link
                            to="/generate"
                            className={`${ui.primaryButton} mt-6`}
                        >
                            Generate Your First Program
                        </Link>
                    </div>
                ) : (

                    /* Program Cards */
                    programs.map((program) => {
                        const completedSessions =
                            program.completedSessions ?? [];

                        const totalSessions = program.schedule.length;

                        const completedCount = completedSessions.length;

                        const progressPercent =
                            totalSessions > 0
                                ? Math.min(
                                    100,
                                    (completedCount / totalSessions) * 100
                                )
                                : 0;

                        const isExpanded = expandedId === program.id;

                        const isComplete =
                            totalSessions > 0 &&
                            completedCount === totalSessions;

                        const isInProgress =
                            completedCount > 0 && !isComplete;

                        return (
                            <article
                                key={program.id}
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
                                                    handleDeleteProgram(program.id, program.name)
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
                                                    setExpandedId(
                                                        isExpanded ? null : program.id
                                                    )
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
                                                updateSessionCompletion(
                                                    program.id,
                                                    sessionNumber,
                                                    shouldComplete
                                                )
                                            }
                                            onSwapExercise={(
                                                sessionNumber,
                                                currentExerciseId,
                                                replacement
                                            ) =>
                                                handleSwapSavedExercise(
                                                    program.id,
                                                    sessionNumber,
                                                    currentExerciseId,
                                                    replacement
                                                )
                                            }
                                        />

                                    </div>
                                )}
                            </article>
                        );
                    })
                )}
            </section>
        </div>
    );
}
