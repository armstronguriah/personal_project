
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import SavedProgramCard from '../components/SavedProgramCard';
import {getSavedPrograms, deleteSavedProgram, setSessionCompletion, swapSavedExercise} from '../services/programApi';
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
                const data = await getSavedPrograms(controller.signal);
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
            const updatedProgram = await setSessionCompletion(
                programId, sessionNumber, shouldComplete
            );

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
        const updatedProgram = await swapSavedExercise(
            programId, sessionNumber, currentExerciseId, replacement.id
        );

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
            await deleteSavedProgram(programId);

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
            <div className="mx-auto max-w-6xl space-y-8">
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
            <div className="mx-auto max-w-6xl space-y-8">
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
        <div className="mx-auto max-w-6xl space-y-8">

            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:min-h-40 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
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
                    className={`${ui.primaryButton} sm:self-center`}
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
                    programs.map((program) => (
                        <SavedProgramCard
                            key={program.id}
                            program={program}
                            isExpanded={expandedId === program.id}
                            deletingProgramId={deletingProgramId}
                            updatingKey={updatingKey}
                            onDelete={() => handleDeleteProgram(program.id, program.name)}
                            onToggleExpand={() => setExpandedId((previous) => previous === program.id ? null : program.id)}
                            onToggleComplete={(sessionNumber, shouldComplete) =>
                                updateSessionCompletion(program.id, sessionNumber, shouldComplete)
                            }
                            onSwapExercise={(sessionNumber, exerciseId, replacement) =>
                                handleSwapSavedExercise(program.id, sessionNumber, exerciseId, replacement)
                            }
                        />
                    ))
                )}
            </section>
        </div>
    );
}
