
import { useEffect, useRef, useState } from 'react';
import { ui } from '../styles/ui';

// Normalize names for exact-match comparisons
function normalizeName(name) {
    return (name ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

// Format labels such as "upper arms" or "HORIZONTAL_PUSH"
function formatLabel(value) {
    if (!value) return 'Not provided';

    return value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatList(values) {
    if (!Array.isArray(values) || values.length === 0) {
        return 'Not provided';
    }

    return values.map(formatLabel).join(', ');
}

export default function ExerciseDetailsModal({
                                                 exercise,
                                                 onClose
                                             }) {
    // Results from the search endpoint
    const [matches, setMatches] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loadingSearch, setLoadingSearch] = useState(true);
    const [searchError, setSearchError] = useState('');

    // Full details from the exercise-by-ID endpoint
    const [detailedExercise, setDetailedExercise] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState('');

    const closeButtonRef = useRef(null);

    // Close the modal with Escape
    useEffect(() => {
        closeButtonRef.current?.focus();

        function handleEscape(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // STEP 1: Search ExerciseDB using the local exercise ID
    useEffect(() => {
        const controller = new AbortController();

        async function searchExercises() {
            setLoadingSearch(true);
            setSearchError('');
            setMatches([]);
            setSelectedId(null);
            setDetailedExercise(null);

            try {
                const response = await fetch(
                    `/api/exercises/${exercise.id}/external-matches`,
                    {
                        signal: controller.signal
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        'Unable to search ExerciseDB. Please try again.'
                    );
                }

                const results = await response.json();

                if (!Array.isArray(results)) {
                    throw new Error('Unexpected ExerciseDB search response.');
                }

                if (controller.signal.aborted) return;

                setMatches(results);

                // Auto-select only when the names match exactly
                const exactMatch = results.find(
                    (result) =>
                        normalizeName(result.name) ===
                        normalizeName(exercise.name)
                );

                if (exactMatch?.exerciseId) {
                    setSelectedId(exactMatch.exerciseId);
                }

            } catch (error) {
                if (!controller.signal.aborted) {
                    setSearchError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingSearch(false);
                }
            }
        }

        searchExercises();

        return () => controller.abort();
    }, [exercise.id, exercise.name]);

    // STEP 2: Fetch full details when an exercise is selected
    useEffect(() => {
        if (!selectedId) {
            return;
        }

        const controller = new AbortController();

        async function loadExerciseDetails() {
            setLoadingDetails(true);
            setDetailsError('');
            setDetailedExercise(null);

            try {
                const response = await fetch(
                    `/api/exercises/external/${encodeURIComponent(selectedId)}`,
                    {
                        signal: controller.signal
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        'Unable to load the selected exercise details.'
                    );
                }

                const result = await response.json();

                if (
                    !result ||
                    result.exerciseId !== selectedId
                ) {
                    throw new Error(
                        'ExerciseDB returned unexpected exercise details.'
                    );
                }

                if (!controller.signal.aborted) {
                    setDetailedExercise(result);
                }

            } catch (error) {
                if (!controller.signal.aborted) {
                    setDetailsError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingDetails(false);
                }
            }
        }

        loadExerciseDetails();

        return () => controller.abort();
    }, [selectedId]);

    // Selected result from the original search
    const selectedMatch = matches.find(
        (match) => match.exerciseId === selectedId
    );

    // Only display full details after loading succeeds
    const selected =
        detailedExercise?.exerciseId === selectedId
            ? detailedExercise
            : null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 px-4 py-6 sm:py-10">

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="exercise-details-title"
                className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >

                {/* Modal Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-6">

                    <div className="space-y-2">
            <span className={ui.badge}>
              Exercise Details
            </span>

                        <h2
                            id="exercise-details-title"
                            className="text-2xl font-bold text-slate-900"
                        >
                            {exercise.name}
                        </h2>

                        <p className="text-sm text-slate-500">
                            {exercise.primaryMuscle} · {exercise.equipment}
                        </p>
                    </div>

                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Close exercise details"
                        className="rounded-lg px-3 py-2 text-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        &times;
                    </button>
                </div>

                {/* Modal Content */}
                <div className="max-h-[75vh] space-y-6 overflow-y-auto p-5 sm:p-6">

                    {/* Local Exercise Information */}
                    <section className={ui.panel}>
                        <h3 className="mb-3 text-sm font-semibold text-blue-900">
                            Your Exercise Library
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-slate-500">
                                    Primary Muscle
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-900">
                                    {exercise.primaryMuscle}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Movement Pattern
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-900">
                                    {formatLabel(exercise.movementPattern)}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Searching State */}
                    {loadingSearch && (
                        <div
                            role="status"
                            className="flex items-center gap-3 py-4"
                        >
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

                            <p className="text-sm text-slate-600">
                                Searching ExerciseDB...
                            </p>
                        </div>
                    )}

                    {/* Search Error */}
                    {searchError && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                        >
                            {searchError}
                        </div>
                    )}

                    {/* Matching Exercises */}
                    {!loadingSearch &&
                        !searchError &&
                        matches.length > 0 && (

                            <section className="space-y-4">

                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Matching Exercises
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Select the correct movement to view its
                                        demonstration and instructions.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                                    {matches.map((match) => {
                                        const isSelected =
                                            selectedId === match.exerciseId;

                                        return (
                                            <button
                                                key={match.exerciseId}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedId(match.exerciseId)
                                                }
                                                aria-pressed={isSelected}
                                                className={`rounded-xl border p-4 text-left transition ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                                                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                <p className="text-sm font-semibold capitalize text-slate-900">
                                                    {match.name}
                                                </p>

                                                <p className="mt-2 text-xs text-slate-500">
                                                    {isSelected
                                                        ? 'Selected Exercise'
                                                        : 'Click to View Details'}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                    {/* No Matches */}
                    {!loadingSearch &&
                        !searchError &&
                        matches.length === 0 && (

                            <div className={ui.panel}>
                                <p className="text-sm font-medium text-blue-900">
                                    No ExerciseDB matches found.
                                </p>

                                <p className="mt-2 text-sm text-blue-800">
                                    The exercise is still available in your
                                    database, but no external demonstration
                                    was found for its name.
                                </p>
                            </div>
                        )}

                    {/* Full Details Loading State */}
                    {loadingDetails && (
                        <div
                            role="status"
                            className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"
                        >
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

                            <p className="text-sm text-slate-600">
                                Loading exercise demonstration and instructions...
                            </p>
                        </div>
                    )}

                    {/* Full Details Error */}
                    {detailsError && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                        >
                            {detailsError}
                        </div>
                    )}

                    {/* Full ExerciseDB Information */}
                    {selected && !loadingDetails && (
                        <section className="space-y-6 border-t border-slate-200 pt-6">

                            <div>
                <span className={ui.badge}>
                  ExerciseDB Demonstration
                </span>

                                <h3 className="mt-3 text-xl font-bold capitalize text-slate-900">
                                    {selected.name}
                                </h3>

                                {selectedMatch &&
                                    normalizeName(selectedMatch.name) !==
                                    normalizeName(exercise.name) && (

                                        <p className="mt-2 text-xs text-slate-500">
                                            This is a related exercise selected from ExerciseDB.
                                            Verify that its movement matches your exercise.
                                        </p>
                                    )}
                            </div>

                            {/* Animated GIF */}
                            {selected.gifUrl ? (
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
                                    <img
                                        src={selected.gifUrl}
                                        alt={`${selected.name} animated demonstration`}
                                        className="mx-auto max-h-80 w-full object-contain"
                                        loading="lazy"
                                    />
                                </div>
                            ) : (
                                <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                                    No demonstration available.
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div className={ui.panel}>
                                    <p className="text-xs font-medium text-slate-500">
                                        Target Muscles
                                    </p>

                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {formatList(selected.targetMuscles)}
                                    </p>
                                </div>

                                <div className={ui.panel}>
                                    <p className="text-xs font-medium text-slate-500">
                                        Equipment
                                    </p>

                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {formatList(selected.equipments)}
                                    </p>
                                </div>

                                <div className={ui.panel}>
                                    <p className="text-xs font-medium text-slate-500">
                                        Body Parts
                                    </p>

                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {formatList(selected.bodyParts)}
                                    </p>
                                </div>

                                <div className={ui.panel}>
                                    <p className="text-xs font-medium text-slate-500">
                                        Secondary Muscles
                                    </p>

                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {formatList(selected.secondaryMuscles)}
                                    </p>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div>
                                <h4 className="mb-4 text-lg font-bold text-slate-900">
                                    How to Perform
                                </h4>

                                {selected.instructions?.length > 0 ? (
                                    <ol className="list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700">
                                        {selected.instructions.map((step, index) => (
                                            <li key={index}>
                                                {step.replace(
                                                    /^Step\s*:?\s*\d+\s*[:.)-]?\s*/i,
                                                    ''
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="text-sm text-slate-500">
                                        No instructions were provided by ExerciseDB
                                        for this exercise.
                                    </p>
                                )}
                            </div>

                            {/* Attribution */}
                            <p className="border-t border-slate-200 pt-4 text-xs text-slate-500">
                                Exercise demonstration and information provided by{' '}
                                <a
                                    href="https://oss.exercisedb.dev/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-blue-600 hover:underline"
                                >
                                    AscendAPI / ExerciseDB
                                </a>.
                            </p>
                        </section>
                    )}

                    {/* Your Database Description */}
                    {exercise.description && (
                        <section className="border-t border-slate-200 pt-5">
                            <h3 className="text-lg font-bold text-slate-900">
                                Your Library Description
                            </h3>

                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                {exercise.description}
                            </p>
                        </section>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end border-t border-slate-200 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className={ui.secondaryButton}
                        >
                            Close Details
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
