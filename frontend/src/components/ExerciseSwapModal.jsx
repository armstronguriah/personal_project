
import { useEffect, useRef, useState } from 'react';

import { getExercises } from '../services/exerciseApi';
import { ui } from '../styles/ui';

function formatLabel(value) {
    if (!value) return 'Not specified';

    return value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ExerciseSwapModal({
                                              exercise,
                                              sessionExercises,
                                              availableEquipment = [],
                                              onSwap,
                                              onClose
                                          }) {
    const [library, setLibrary] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [swappingId, setSwappingId] = useState(null);

    const searchRef = useRef(null);

    // Load exercise choices from PostgreSQL
    useEffect(() => {
        const controller = new AbortController();

        async function loadExercises() {
            setLoading(true);
            setError('');

            try {
                const results = await getExercises(
                    {},
                    controller.signal
                );

                if (!Array.isArray(results)) {
                    throw new Error('Unexpected exercise response.');
                }

                if (!controller.signal.aborted) {
                    setLibrary(results);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(
                        err.message || 'Unable to load exercises.'
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadExercises();

        return () => controller.abort();
    }, []);

    // Focus the search input when the modal opens
    useEffect(() => {
        searchRef.current?.focus();

        function handleKeyDown(event) {
            if (event.key === 'Escape' && swappingId === null) {
                onClose();
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, swappingId]);

    // Find the original exercise's movement pattern
    const originalExercise = library.find(
        (item) => item.id === exercise.exerciseId
    );

    const movementPattern = originalExercise?.movementPattern;

    // Exercises already used in this session
    const usedIds = new Set(
        sessionExercises.map((item) => item.exerciseId)
    );

    // Only allow compatible replacements
    const replacements = library
        .filter((candidate) => {
            if (!movementPattern) return false;

            const sameMovement =
                candidate.movementPattern === movementPattern;

            const equipmentAllowed =
                availableEquipment.includes(candidate.equipment);

            const notAlreadyUsed =
                !usedIds.has(candidate.id);

            const matchesSearch = candidate.name
                .toLowerCase()
                .includes(search.trim().toLowerCase());

            return (
                sameMovement &&
                equipmentAllowed &&
                notAlreadyUsed &&
                matchesSearch
            );
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    async function handleSwap(replacement) {
        if (swappingId !== null) return;

        setSwappingId(replacement.id);
        setError('');

        try {
            await onSwap(replacement);
        } catch (err) {
            setError(
                err.message || 'Unable to swap exercise.'
            );
        } finally {
            setSwappingId(null);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 px-4 py-8">

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="swap-exercise-title"
                className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >

                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
                    <div className="space-y-2">
            <span className={ui.badge}>
              Customize Workout
            </span>

                        <h2
                            id="swap-exercise-title"
                            className="text-xl font-bold text-slate-900"
                        >
                            Swap Exercise
                        </h2>

                        <p className="text-sm text-slate-500">
                            Replacing: {exercise.exerciseName}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={swappingId !== null}
                        aria-label="Close swap dialog"
                        className="rounded-lg px-3 py-2 text-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                    >
                        &times;
                    </button>
                </div>

                <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5 sm:p-6">

                    {/* Replacement Rules */}
                    <div className={ui.panel}>
                        <p className="text-sm font-semibold text-blue-900">
                            Compatible Replacements
                        </p>

                        <p className="mt-2 text-sm leading-6 text-blue-800">
                            Same movement pattern and available equipment.
                            Your original sets and reps will be preserved.
                        </p>

                        {movementPattern && (
                            <span className={`${ui.badge} mt-3`}>
                {formatLabel(movementPattern)}
              </span>
                        )}
                    </div>

                    {/* Search */}
                    <div>
                        <label
                            htmlFor="replacement-search"
                            className={ui.label}
                        >
                            Search Replacement Exercises
                        </label>

                        <input
                            ref={searchRef}
                            id="replacement-search"
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search by exercise name..."
                            className={ui.input}
                        />
                    </div>

                    {/* Loading */}
                    {loading && (
                        <p role="status" className="text-sm text-slate-500">
                            Loading available exercises...
                        </p>
                    )}

                    {/* Errors */}
                    {error && (
                        <div
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    {/* Missing original exercise */}
                    {!loading && !originalExercise && (
                        <p className="text-sm text-slate-600">
                            This exercise could not be found in the active
                            library, so its movement pattern cannot be verified.
                        </p>
                    )}

                    {/* No matches */}
                    {!loading &&
                        originalExercise &&
                        replacements.length === 0 && (
                            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                                No compatible exercises found. Try a different
                                search, or add more exercises to your library.
                            </p>
                        )}

                    {/* Replacement List */}
                    {!loading && replacements.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-500">
                                {replacements.length} compatible exercises
                            </p>

                            {replacements.map((candidate) => (
                                <div
                                    key={candidate.id}
                                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-slate-900">
                                            {candidate.name}
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {candidate.primaryMuscle}
                                            {' · '}
                                            {candidate.equipment}
                                        </p>

                                        {candidate.description && (
                                            <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                                                {candidate.description}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleSwap(candidate)}
                                        disabled={swappingId !== null}
                                        className={ui.primaryButton}
                                    >
                                        {swappingId === candidate.id
                                            ? 'Swapping...'
                                            : 'Select'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end border-t border-slate-200 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={swappingId !== null}
                            className={ui.secondaryButton}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
