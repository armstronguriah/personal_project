import {EQUIPMENT_OPTIONS} from '../constants/exerciseOptions';
import {ui} from '../styles/ui';
import StyledSelect from './StyledSelect.jsx';

// This component only displays the form. GenerateProgram owns its state and actions.
export default function WorkoutSetupForm({
    preferences,
    equipmentError,
    isGenerating,
    onSubmit,
    onChange,
    onEquipmentAccessChange,
    onEquipmentToggle
}) {
    return (
        <form
            onSubmit={onSubmit}
            className={`${ui.card} space-y-6`}
        >
            <div className="border-b border-slate-200 pb-5">
                <h2 className="text-xl font-bold text-slate-900">
                    Your Training Preferences
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Choose your preferences to build a personalized
                    workout program.
                </p>
            </div>

            {/* Main Form Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* Fitness Goal */}
                <div>
                    <label htmlFor="goal" className={ui.label}>
                        Primary Fitness Goal
                    </label>

                    <StyledSelect
                        id="goal"
                        name="goal"
                        value={preferences.goal}
                        onValueChange={(value) =>
                            onChange({
                                target: {
                                    name: 'goal',
                                    value
                                }
                            })
                        }
                        placeholder="Select Goal"
                        required
                        options={[
                            { value: 'STRENGTH', label: 'Strength' },
                            { value: 'HYPERTROPHY', label: 'Muscle Growth' },
                            { value: 'ENDURANCE', label: 'Endurance' },
                            { value: 'HYBRID', label: 'Hybrid / General Fitness' }
                        ]}
                    />
                </div>

                {/* Experience */}
                <div>
                    <label htmlFor="experience" className={ui.label}>
                        Experience Level
                    </label>


                    <StyledSelect
                        id="experience"
                        name="experience"
                        value={preferences.experience}
                        onValueChange={(value) =>
                            onChange({
                                target: {
                                    name: 'experience',
                                    value
                                }
                            })
                        }
                        placeholder="Select Experience"
                        required
                        options={[
                            { value: 'BEGINNER', label: 'Beginner' },
                            { value: 'INTERMEDIATE', label: 'Intermediate' },
                            { value: 'ADVANCED', label: 'Advanced' }
                        ]}
                    />

                </div>

                {/* Training Days */}
                <div>
                    <label htmlFor="trainingDays" className={ui.label}>
                        Training Days Per Week
                    </label>


                    <StyledSelect
                        id="trainingDays"
                        name="trainingDays"
                        value={preferences.trainingDays}
                        onValueChange={(value) =>
                            onChange({
                                target: {
                                    name: 'trainingDays',
                                    value
                                }
                            })
                        }
                        placeholder="Select Days"
                        required
                        options={[1, 2, 3, 4, 5, 6, 7].map((day) => ({
                            value: String(day),
                            label: `${day} ${day === 1 ? 'Day' : 'Days'}`
                        }))}
                    />

                </div>

                {/* Session Duration */}
                <div>
                    <label htmlFor="sessionMinutes" className={ui.label}>
                        Workout Duration
                    </label>


                    <StyledSelect
                        id="sessionMinutes"
                        name="sessionMinutes"
                        value={preferences.sessionMinutes}
                        onValueChange={(value) =>
                            onChange({
                                target: {
                                    name: 'sessionMinutes',
                                    value
                                }
                            })
                        }
                        placeholder="Select Duration"
                        required
                        options={[30, 45, 60, 90, 120].map((minutes) => ({
                            value: String(minutes),
                            label: `${minutes} Minutes`
                        }))}
                    />

                </div>


                <div>
                    <label htmlFor="programWeeks" className={ui.label}>
                        Program Length
                    </label>


                    <StyledSelect
                        id="programWeeks"
                        name="programWeeks"
                        value={preferences.programWeeks}
                        onValueChange={(value) =>
                            onChange({
                                target: {
                                    name: 'programWeeks',
                                    value
                                }
                            })
                        }
                        placeholder="Select Program Length"
                        required
                        options={[4, 5, 6, 7, 8].map((weeks) => ({
                            value: String(weeks),
                            label: `${weeks} Weeks`
                        }))}
                    />

                </div>


                {/* Equipment Selection */}
                <div className="md:col-span-2">
                    <label
                        htmlFor="equipmentAccess"
                        className={ui.label}
                    >
                        Available Equipment
                    </label>


                    <StyledSelect
                        id="equipmentAccess"
                        name="equipmentAccess"
                        value={preferences.equipmentAccess}
                        onValueChange={(value) =>
                            onEquipmentAccessChange({
                                target: { value }
                            })
                        }
                        placeholder="Select Equipment"
                        required
                        options={[
                            { value: 'FULL_GYM', label: 'Full Gym' },
                            { value: 'BARBELL', label: 'Barbell and Rack' },
                            { value: 'DUMBBELL', label: 'Dumbbells' },
                            { value: 'BODYWEIGHT', label: 'Bodyweight Only' },
                            { value: 'CUSTOM', label: 'Custom Equipment' }
                        ]}
                    />


                    {/* Custom Equipment Checkboxes */}
                    {preferences.equipmentAccess === 'CUSTOM' && (
                        <fieldset className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                            <legend className="px-2 text-sm font-semibold text-slate-700">
                                Select the equipment you have
                            </legend>

                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {EQUIPMENT_OPTIONS.map((equipment) => (
                                    <label
                                        key={equipment}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50"
                                    >
                                        <input
                                            type="checkbox"
                                            value={equipment}
                                            checked={preferences.availableEquipment.includes(
                                                equipment
                                            )}
                                            onChange={onEquipmentToggle}
                                            className="h-4 w-4 cursor-pointer accent-blue-600"
                                        />

                                        <span className="text-sm font-medium text-slate-700">
                    {equipment}
                  </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    )}

                    {/* Selected Equipment Summary */}
                    {preferences.availableEquipment.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {preferences.availableEquipment.map((equipment) => (
                                <span key={equipment} className={ui.badge}>
                {equipment}
              </span>
                            ))}
                        </div>
                    )}

                    {equipmentError && (
                        <p
                            role="alert"
                            className="mt-3 text-sm font-medium text-red-600"
                        >
                            {equipmentError}
                        </p>
                    )}
                </div>
            </div>

            {/* Current Selections */}
            <div className={ui.panel}>
                <h3 className="mb-4 text-base font-semibold text-blue-900">
                    Current Selections
                </h3>

                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Fitness Goal
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                            {preferences.goal || 'Not selected'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Experience
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                            {preferences.experience || 'Not selected'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Training Days
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                            {preferences.trainingDays
                                ? `${preferences.trainingDays} per week`
                                : 'Not selected'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Session Duration
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                            {preferences.sessionMinutes
                                ? `${preferences.sessionMinutes} minutes`
                                : 'Not selected'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Program Length
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                            {preferences.programWeeks} weeks
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Total Sessions
                        </p>

                        <p className="mt-1 font-semibold text-blue-700">
                            {preferences.trainingDays
                                ? Number(preferences.trainingDays) *
                                Number(preferences.programWeeks)
                                : 'Not selected'}
                        </p>
                    </div>

                    <div className="sm:col-span-2">
                        <p className="text-xs font-medium text-slate-500">
                            Equipment
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                            {preferences.availableEquipment.length > 0
                                ? preferences.availableEquipment.join(', ')
                                : 'Not selected'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <div
                className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                    Your program will be generated based on these preferences.
                </p>

                <button
                    type="submit"
                    disabled={isGenerating}
                    className={ui.primaryButton}
                >
                    {isGenerating
                        ? 'Generating...'
                        : 'Generate Program'}
                </button>
            </div>
        </form>
    );
}
