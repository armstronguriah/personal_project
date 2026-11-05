
import {
    EQUIPMENT_OPTIONS,
    MUSCLE_OPTIONS,
    MOVEMENT_OPTIONS
} from '../constants/exerciseOptions';

import { ui } from '../styles/ui';

export default function ExerciseFilters({
                                            equipment,
                                            primaryMuscle,
                                            movementPattern,
                                            onEquipmentChange,
                                            onMuscleChange,
                                            onMovementChange
                                        }) {
    const hasActiveFilters =
        equipment !== '' ||
        primaryMuscle !== '' ||
        movementPattern !== '';

    function handleResetFilters() {
        onEquipmentChange('');
        onMuscleChange('');
        onMovementChange('');
    }

    return (
        <section className={`${ui.card} space-y-5`}>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        Filter Exercises
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Narrow down exercises by equipment,
                        muscle group, or movement pattern.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleResetFilters}
                    disabled={!hasActiveFilters}
                    className={ui.secondaryButton}
                >
                    Reset Filters
                </button>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                {/* Equipment */}
                <div>
                    <label
                        htmlFor="filter-equipment"
                        className={ui.label}
                    >
                        Equipment
                    </label>

                    <select
                        id="filter-equipment"
                        value={equipment}
                        onChange={(event) =>
                            onEquipmentChange(event.target.value)
                        }
                        className={ui.input}
                    >
                        <option value="">All Equipment</option>

                        {EQUIPMENT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Primary Muscle */}
                <div>
                    <label
                        htmlFor="filter-muscle"
                        className={ui.label}
                    >
                        Primary Muscle
                    </label>

                    <select
                        id="filter-muscle"
                        value={primaryMuscle}
                        onChange={(event) =>
                            onMuscleChange(event.target.value)
                        }
                        className={ui.input}
                    >
                        <option value="">All Muscles</option>

                        {MUSCLE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Movement Pattern */}
                <div>
                    <label
                        htmlFor="filter-movement"
                        className={ui.label}
                    >
                        Movement Pattern
                    </label>

                    <select
                        id="filter-movement"
                        value={movementPattern}
                        onChange={(event) =>
                            onMovementChange(event.target.value)
                        }
                        className={ui.input}
                    >
                        <option value="">All Patterns</option>


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
                </div>
            </div>
        </section>
    );
}
