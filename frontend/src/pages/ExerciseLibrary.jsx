import {useEffect, useRef, useState} from 'react';
import ExerciseTable from '../components/ExerciseTable';
import ExerciseForm from '../components/ExerciseForm';
import ExerciseFilters from '../components/ExerciseFilters';
import ExerciseDetailsModal from '../components/ExerciseDetailsModal';

import {
    getExercises,
    saveExercise,
    deleteExercise
} from '../services/exerciseApi';

import {ui} from '../styles/ui';

// Create an empty exercise object
function createEmptyExercise() {
    return {
        name: '',
        primaryMuscle: '',
        equipment: '',
        movementPattern: '',
        description: ''
    };
}

function ExerciseLibrary() {
    // Exercise table state
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter state
    const [equipment, setEquipment] = useState('');
    const [primaryMuscle, setPrimaryMuscle] = useState('');
    const [movementPattern, setMovementPattern] = useState('');

    // Add / save state
    const [newExercise, setNewExercise] = useState(
        createEmptyExercise
    );
    const [saveMessage, setSaveMessage] = useState('');
    const [saveError, setSaveError] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Delete state
    const [deletingId, setDeletingId] = useState(null);
    const [deleteError, setDeleteError] = useState('');

    // Edit state
    const [editingId, setEditingId] = useState(null);

    // Form validation errors
    const [fieldErrors, setFieldErrors] = useState({});

    //Button
    const exerciseFormRef = useRef(null);

    //api db
    const [selectedExercise, setSelectedExercise] = useState(null);

    function handleAddExerciseClick() {
        // Exit edit mode and prepare an empty form
        setEditingId(null);
        setNewExercise(createEmptyExercise());
        setFieldErrors({});
        setSaveMessage('');
        setSaveError(false);

        // Scroll to the form
        exerciseFormRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // Update form inputs
    function handleFormChange(event) {
        const {name, value} = event.target;

        setNewExercise((previous) => ({
            ...previous,
            [name]: value
        }));

        setFieldErrors((previous) => ({
            ...previous,
            [name]: ''
        }));
    }

    // Add or update an exercise
    async function handleSaveExercise(event) {
        event.preventDefault();

        setSaveMessage('');
        setSaveError(false);
        setFieldErrors({});

        const isEditing = editingId !== null;

        try {
            await saveExercise(newExercise, editingId);

            setNewExercise(createEmptyExercise());
            setEditingId(null);

            setSaveMessage(
                isEditing
                    ? 'Exercise updated successfully!'
                    : 'Exercise added successfully!'
            );

            setRefreshKey((previous) => previous + 1);
        } catch (error) {
            if (error.fieldErrors) {
                setFieldErrors(error.fieldErrors);
                return;
            }

            setSaveError(true);
            setSaveMessage(
                `Unable to save exercise: ${error.message}`
            );
        }
    }

    // Populate the form when editing
    function handleEditExercise(exercise) {
        setEditingId(exercise.id);

        setNewExercise({
            name: exercise.name,
            primaryMuscle: exercise.primaryMuscle,
            equipment: exercise.equipment,
            movementPattern: exercise.movementPattern ?? '',
            description: exercise.description ?? ''
        });

        exerciseFormRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        setFieldErrors({});
        setSaveMessage('');
        setSaveError(false);
    }

    // Cancel editing and reset form
    function handleCancelEdit() {
        setEditingId(null);
        setNewExercise(createEmptyExercise());

        setFieldErrors({});
        setSaveMessage('');
        setSaveError(false);
    }

    // Delete an exercise
    async function handleDeleteExercise(id) {
        const confirmed = window.confirm(
            'Are you sure you want to delete this exercise?'
        );

        if (!confirmed) {
            return;
        }

        setDeletingId(id);
        setDeleteError('');

        try {
            await deleteExercise(id);

            setRefreshKey((previous) => previous + 1);
        } catch (error) {
            setDeleteError(
                `Unable to delete exercise: ${error.message}`
            );
        } finally {
            setDeletingId(null);
        }
    }

    // Fetch exercises whenever filters or refreshKey change
    useEffect(() => {
        const controller = new AbortController();

        async function loadExercises() {
            setLoading(true);
            setError('');

            try {
                const filters = {
                    equipment,
                    primaryMuscle,
                    movementPattern
                };

                const data = await getExercises(
                    filters,
                    controller.signal
                );

                if (!controller.signal.aborted) {
                    setExercises(data);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setError('Unable to load exercises.');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadExercises();

        return () => controller.abort();
    }, [
        equipment,
        primaryMuscle,
        movementPattern,
        refreshKey
    ]);

    return (
        <div className="mx-auto max-w-6xl space-y-8">

            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">

                <div className="space-y-3">
    <span className={ui.badge}>
      Exercise Database
    </span>

                    <h1 className={ui.heading}>
                        Exercise Explorer
                    </h1>

                    <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                        Browse, filter, and manage exercises in your
                        workout library.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleAddExerciseClick}
                    className={ui.primaryButton}
                >
                    + Add Exercise
                </button>
            </div>

            {/* Exercise Filters */}
            <ExerciseFilters
                equipment={equipment}
                primaryMuscle={primaryMuscle}
                movementPattern={movementPattern}
                onEquipmentChange={setEquipment}
                onMuscleChange={setPrimaryMuscle}
                onMovementChange={setMovementPattern}
            />

            {/* Loading State */}
            {loading && (
                <div
                    role="status"
                    className={`${ui.panel} flex items-center gap-3`}
                >
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"/>

                    <p className="text-sm font-medium text-blue-800">
                        Loading exercises...
                    </p>
                </div>
            )}

            {/* Loading Error */}
            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {/* Delete Error */}
            {deleteError && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {deleteError}
                </div>
            )}

            {!loading && !error && (
                <ExerciseTable
                    exercises={exercises}
                    onEdit={handleEditExercise}
                    onDelete={handleDeleteExercise}
                    onViewDetails={setSelectedExercise}
                    deletingId={deletingId}
                />
            )}

            {/* Add / Edit Exercise Section */}
            <section
                ref={exerciseFormRef}
                id="add-exercise"
                className="scroll-mt-28 space-y-5"
            >

                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900">
                        {editingId !== null
                            ? 'Manage Exercise'
                            : 'Add to Your Library'}
                    </h2>

                    <p className="text-sm text-slate-500">
                        {editingId !== null
                            ? 'Update the selected exercise below.'
                            : 'Create a new exercise to include in your workout programs.'}
                    </p>
                </div>

                {/* Save Message */}
                {saveMessage && (
                    <div
                        role={saveError ? 'alert' : 'status'}
                        className={
                            saveError
                                ? 'rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700'
                                : 'rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700'
                        }
                    >
                        {saveMessage}
                    </div>
                )}

                {/* Exercise Form */}
                <ExerciseForm
                    newExercise={newExercise}
                    editingId={editingId}
                    fieldErrors={fieldErrors}
                    onChange={handleFormChange}
                    onSubmit={handleSaveExercise}
                    onCancel={handleCancelEdit}
                />

                {selectedExercise && (
                    <ExerciseDetailsModal
                        key={selectedExercise.id}
                        exercise={selectedExercise}
                        onClose={() => setSelectedExercise(null)}
                    />
                )}

            </section>
        </div>
    );
}

export default ExerciseLibrary;
