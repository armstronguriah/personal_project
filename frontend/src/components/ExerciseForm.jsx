
import {
    EQUIPMENT_OPTIONS,
    MUSCLE_OPTIONS,
    MOVEMENT_OPTIONS
} from '../constants/exerciseOptions';

import { ui } from '../styles/ui';

export default function ExerciseForm({
                                         newExercise,
                                         editingId,
                                         fieldErrors = {},
                                         onChange,
                                         onSubmit,
                                         onCancel
                                     }) {
    const isEditing = editingId !== null;

    return (
        <section className={ui.card}>
            <div className="mb-6 border-b border-slate-200 pb-5">
                <h2 className="text-xl font-bold text-slate-900">
                    {isEditing ? 'Edit Exercise' : 'Add New Exercise'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    {isEditing
                        ? 'Update the details of this exercise.'
                        : 'Add a new exercise to your library.'}
                </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    {/* Exercise Name */}
                    <div>
                        <label htmlFor="exercise-name" className={ui.label}>
                            Exercise Name
                        </label>

                        <input
                            id="exercise-name"
                            name="name"
                            type="text"
                            maxLength={100}
                            required
                            value={newExercise.name ?? ''}
                            onChange={onChange}
                            className={ui.input}
                            placeholder="e.g. Barbell Bench Press"
                        />

                        {fieldErrors.name && (
                            <p role="alert" className="mt-2 text-xs text-red-600">
                                {fieldErrors.name}
                            </p>
                        )}
                    </div>

                    {/* Primary Muscle */}
                    <div>
                        <label
                            htmlFor="exercise-muscle"
                            className={ui.label}
                        >
                            Primary Muscle
                        </label>

                        <select
                            id="exercise-muscle"
                            name="primaryMuscle"
                            required
                            value={newExercise.primaryMuscle ?? ''}
                            onChange={onChange}
                            className={ui.input}
                        >
                            <option value="">Select Muscle</option>

                            {MUSCLE_OPTIONS.map((muscle) => (
                                <option key={muscle} value={muscle}>
                                    {muscle}
                                </option>
                            ))}
                        </select>

                        {fieldErrors.primaryMuscle && (
                            <p role="alert" className="mt-2 text-xs text-red-600">
                                {fieldErrors.primaryMuscle}
                            </p>
                        )}
                    </div>

                    {/* Equipment */}
                    <div>
                        <label
                            htmlFor="exercise-equipment"
                            className={ui.label}
                        >
                            Equipment
                        </label>

                        <select
                            id="exercise-equipment"
                            name="equipment"
                            required
                            value={newExercise.equipment ?? ''}
                            onChange={onChange}
                            className={ui.input}
                        >
                            <option value="">Select Equipment</option>

                            {EQUIPMENT_OPTIONS.map((equipment) => (
                                <option key={equipment} value={equipment}>
                                    {equipment}
                                </option>
                            ))}
                        </select>

                        {fieldErrors.equipment && (
                            <p role="alert" className="mt-2 text-xs text-red-600">
                                {fieldErrors.equipment}
                            </p>
                        )}
                    </div>

                    {/* Movement Pattern */}
                    <div>
                        <label
                            htmlFor="exercise-movement"
                            className={ui.label}
                        >
                            Movement Pattern
                        </label>

                        <select
                            id="exercise-movement"
                            name="movementPattern"
                            required
                            value={newExercise.movementPattern ?? ''}
                            onChange={onChange}
                            className={ui.input}
                        >
                            <option value="">Select Movement Pattern</option>


                            {MOVEMENT_OPTIONS.map((option) => {
                                const value =
                                    typeof option === 'string' ? option : option.value;

                                const label =
                                    typeof option === 'string'
                                        ? option.replaceAll('_', ' ')
                                        : option.label ?? value.replaceAll('_', ' ');

                                return (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                );
                            })}

                        </select>

                        {fieldErrors.movementPattern && (
                            <p role="alert" className="mt-2 text-xs text-red-600">
                                {fieldErrors.movementPattern}
                            </p>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label
                        htmlFor="exercise-description"
                        className={ui.label}
                    >
                        Description
                    </label>

                    <textarea
                        id="exercise-description"
                        name="description"
                        value={newExercise.description ?? ''}
                        onChange={onChange}
                        maxLength={500}
                        rows={4}
                        className={ui.input}
                        placeholder="Describe how to perform this exercise..."
                    />

                    <div className="mt-2 flex justify-between gap-3">
                        {fieldErrors.description ? (
                            <p role="alert" className="text-xs text-red-600">
                                {fieldErrors.description}
                            </p>
                        ) : (
                            <span />
                        )}

                        <span className="text-xs text-slate-400">
              {(newExercise.description ?? '').length}/500
            </span>
                    </div>
                </div>

                {/* Form Buttons */}
                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
                    {isEditing && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className={ui.secondaryButton}
                        >
                            Cancel
                        </button>
                    )}

                    <button
                        type="submit"
                        className={ui.primaryButton}
                    >
                        {isEditing ? 'Save Changes' : 'Add Exercise'}
                    </button>
                </div>
            </form>
        </section>
    );
}
