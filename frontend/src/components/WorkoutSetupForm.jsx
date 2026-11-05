import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';

import {
    EQUIPMENT_OPTIONS,
    EQUIPMENT_PRESETS
} from '../constants/exerciseOptions';

import GeneratedWorkout from './GeneratedWorkout.jsx';
import {ui} from '../styles/ui';

const DRAFT_STORAGE_KEY = 'workout-generator-draft-v1';

const DEFAULT_PREFERENCES = {
    goal: '',
    experience: '',
    trainingDays: '',
    sessionMinutes: '',
    programWeeks: '4',
    equipmentAccess: '',
    availableEquipment: []
};

// Recover an unsaved program from this browser, if one exists.
function loadWorkoutDraft() {
    try {
        const storedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!storedDraft) return null;

        const draft = JSON.parse(storedDraft);
        if (
            !draft ||
            !Array.isArray(draft.generatedSchedule) ||
            draft.generatedSchedule.length === 0 ||
            !draft.requestPreview ||
            !Number(draft.requestPreview.trainingDays)
        ) {
            return null;
        }

        return draft;
    } catch (error) {
        console.error('Unable to restore workout draft:', error);
        return null;
    }
}

function WorkoutSetupForm() {
    // Read browser storage once when this page mounts.
    const [restoredDraft] = useState(loadWorkoutDraft);

    // Training preferences
    const [preferences, setPreferences] = useState(() => ({
        ...DEFAULT_PREFERENCES,
        ...(restoredDraft?.preferences ?? {})
    }));

    const [equipmentError, setEquipmentError] = useState('');
    const [requestPreview, setRequestPreview] = useState(restoredDraft?.requestPreview ?? null);

    const saveSectionRef = useRef(null);

    const [previewWeek, setPreviewWeek] = useState(restoredDraft?.previewWeek ?? 1);

    // Generated schedule
    const [generatedSchedule, setGeneratedSchedule] = useState(restoredDraft?.generatedSchedule ?? null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState('');

    // Save program
    const [programName, setProgramName] = useState(restoredDraft?.programName ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [savedProgramId, setSavedProgramId] = useState(null);
    const [draftStorageError, setDraftStorageError] = useState('');

    // Automatically back up any unsaved program, including swaps and week selection.
    useEffect(() => {
        try {
            if (generatedSchedule === null || requestPreview === null || savedProgramId !== null) {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
                setDraftStorageError('');
                return;
            }

            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
                preferences,
                requestPreview,
                generatedSchedule,
                programName,
                previewWeek
            }));
            setDraftStorageError('');
        } catch (error) {
            console.error('Unable to store workout draft:', error);
            setDraftStorageError('Browser draft backup is unavailable. Save the program before leaving this page.');
        }
    }, [preferences, requestPreview, generatedSchedule, programName, previewWeek, savedProgramId]);

    const daysPerWeek = Number(requestPreview?.trainingDays) || 1;

    const totalWeeks = Math.ceil(
        (generatedSchedule?.length ?? 0) / daysPerWeek
    );

    // Keep a restored week number within the bounds of the loaded program.
    const safePreviewWeek = Math.min(
        Math.max(1, Number(previewWeek) || 1),
        Math.max(1, totalWeeks)
    );

    // Only display the sessions belonging to the selected week.
    const visibleWeekSchedule = (generatedSchedule ?? []).slice(
        (safePreviewWeek - 1) * daysPerWeek,
        safePreviewWeek * daysPerWeek
    );


    function handleScrollToSave() {
        saveSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // Handle regular form inputs
    function handleChange(event) {
        const {name, value} = event.target;

        setPreferences((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    // Handle equipment preset selection
    function handleEquipmentAccessChange(event) {
        const selectedPreset = event.target.value;

        setPreferences((previous) => ({
            ...previous,
            equipmentAccess: selectedPreset,
            availableEquipment:
                selectedPreset === 'CUSTOM'
                    ? previous.availableEquipment
                    : [...(EQUIPMENT_PRESETS[selectedPreset] ?? [])]
        }));

        setEquipmentError('');
    }

    // Handle individual equipment checkboxes
    function handleEquipmentToggle(event) {
        const {value, checked} = event.target;

        setPreferences((previous) => ({
            ...previous,
            availableEquipment: checked
                ? [...previous.availableEquipment, value]
                : previous.availableEquipment.filter(
                    (equipment) => equipment !== value
                )
        }));

        setEquipmentError('');
    }


    function handleSwapGeneratedExercise(
        sessionNumber,
        currentExerciseId,
        replacement
    ) {
        setGeneratedSchedule((previous) => {
            if (!previous) return previous;

            return previous.map((day) => {
                if (day.sessionNumber !== sessionNumber) {
                    return day;
                }

                return {
                    ...day,
                    exercises: day.exercises.map((exercise) => {
                        if (exercise.exerciseId !== currentExerciseId) {
                            return exercise;
                        }

                        return {
                            ...exercise,
                            exerciseId: replacement.id,
                            exerciseName: replacement.name
                        };
                    })
                };
            });
        });

        // The displayed schedule has changed.
        // It needs to be saved again.
        setSavedProgramId(null);
        setSaveError('');
    }


    // Generate the workout program
    async function handleSubmit(event) {
        event.preventDefault();

        if (preferences.availableEquipment.length === 0) {
            setEquipmentError('Select at least one equipment type.');
            return;
        }

        setEquipmentError('');
        setGenerationError('');
        setSaveError('');
        // Preserve the previous draft until the new generation succeeds.

        const {equipmentAccess, ...requestFields} = preferences;

        const request = {
            ...requestFields,
            trainingDays: Number(preferences.trainingDays),
            sessionMinutes: Number(preferences.sessionMinutes),
            programWeeks: Number(preferences.programWeeks)
        };

        setIsGenerating(true);

        try {
            const response = await fetch('/api/programs/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error('Failed to generate workout program.');
            }

            const schedule = await response.json();
            if (!Array.isArray(schedule)) {
                throw new Error('Unexpected workout program response.');
            }

            setRequestPreview(request);
            setGeneratedSchedule(schedule);
            setSavedProgramId(null);
            setPreviewWeek(1);
            setProgramName('');
        } catch (error) {
            setGenerationError(error.message);
        } finally {
            setIsGenerating(false);
        }
    }

    // Save generated program
    async function handleSaveProgram() {
        if (
            generatedSchedule === null ||
            requestPreview === null ||
            !programName.trim()
        ) {
            return;
        }

        setIsSaving(true);
        setSaveError('');
        setSavedProgramId(null);

        try {
            const response = await fetch('/api/programs/saved', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: programName.trim(),
                    preferences: requestPreview,
                    schedule: generatedSchedule
                })
            });

            if (!response.ok) {
                throw new Error('Unable to save workout program.');
            }

            const savedProgram = await response.json();
            setSavedProgramId(savedProgram.id);
        } catch (error) {
            setSaveError(error.message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8">

            {/* Page Header */}
            <div className="space-y-2">
        <span className={ui.badge}>
          Personalized Training
        </span>

                <h1 className={ui.heading}>
                    Generate Your Workout Program
                </h1>

                <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                    Create a workout plan tailored to your fitness goals,
                    experience, schedule, and available equipment.
                </p>
            </div>

            {/* Training Preferences Form */}
            <form
                onSubmit={handleSubmit}
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

                        <select
                            id="goal"
                            name="goal"
                            value={preferences.goal}
                            onChange={handleChange}
                            required
                            className={ui.input}
                        >
                            <option value="">Select Goal</option>
                            <option value="STRENGTH">Strength</option>
                            <option value="HYPERTROPHY">Muscle Growth</option>
                            <option value="ENDURANCE">Endurance</option>
                            <option value="HYBRID">
                                Hybrid / General Fitness
                            </option>
                        </select>
                    </div>

                    {/* Experience */}
                    <div>
                        <label htmlFor="experience" className={ui.label}>
                            Experience Level
                        </label>

                        <select
                            id="experience"
                            name="experience"
                            value={preferences.experience}
                            onChange={handleChange}
                            required
                            className={ui.input}
                        >
                            <option value="">Select Experience</option>
                            <option value="BEGINNER">Beginner</option>
                            <option value="INTERMEDIATE">Intermediate</option>
                            <option value="ADVANCED">Advanced</option>
                        </select>
                    </div>

                    {/* Training Days */}
                    <div>
                        <label htmlFor="trainingDays" className={ui.label}>
                            Training Days Per Week
                        </label>

                        <select
                            id="trainingDays"
                            name="trainingDays"
                            value={preferences.trainingDays}
                            onChange={handleChange}
                            required
                            className={ui.input}
                        >
                            <option value="">Select Days</option>
                            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                                <option key={day} value={day}>
                                    {day} {day === 1 ? 'Day' : 'Days'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Session Duration */}
                    <div>
                        <label htmlFor="sessionMinutes" className={ui.label}>
                            Workout Duration
                        </label>

                        <select
                            id="sessionMinutes"
                            name="sessionMinutes"
                            value={preferences.sessionMinutes}
                            onChange={handleChange}
                            required
                            className={ui.input}
                        >
                            <option value="">Select Duration</option>
                            {[30, 45, 60, 90, 120].map((minutes) => (
                                <option key={minutes} value={minutes}>
                                    {minutes} Minutes
                                </option>
                            ))}
                        </select>
                    </div>


                    <div>
                        <label htmlFor="programWeeks" className={ui.label}>
                            Program Length
                        </label>

                        <select
                            id="programWeeks"
                            name="programWeeks"
                            value={preferences.programWeeks}
                            onChange={handleChange}
                            required
                            className={ui.input}
                        >
                            <option value="4">4 Weeks</option>
                            <option value="5">5 Weeks</option>
                            <option value="6">6 Weeks</option>
                            <option value="7">7 Weeks</option>
                            <option value="8">8 Weeks</option>
                        </select>
                    </div>


                    {/* Equipment Selection */}
                    <div className="md:col-span-2">
                        <label
                            htmlFor="equipmentAccess"
                            className={ui.label}
                        >
                            Available Equipment
                        </label>

                        <select
                            id="equipmentAccess"
                            name="equipmentAccess"
                            value={preferences.equipmentAccess}
                            onChange={handleEquipmentAccessChange}
                            required
                            className={ui.input}
                        >
                            <option value="">Select Equipment</option>
                            <option value="FULL_GYM">Full Gym</option>
                            <option value="BARBELL">Barbell and Rack</option>
                            <option value="DUMBBELL">Dumbbells</option>
                            <option value="BODYWEIGHT">Bodyweight Only</option>
                            <option value="CUSTOM">Custom Equipment</option>
                        </select>

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
                                                onChange={handleEquipmentToggle}
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

            {/* Request Preview */}
            {requestPreview && (
                <details className={ui.card}>
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                        View API Request Details
                    </summary>

                    <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
            {JSON.stringify(requestPreview, null, 2)}
          </pre>
                </details>
            )}

            {/* Generating State */}
            {isGenerating && (
                <div
                    role="status"
                    className={`${ui.panel} flex items-center gap-3`}
                >
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"/>

                    <p className="text-sm font-medium text-blue-800">
                        Generating your workout program...
                    </p>
                </div>
            )}

            {/* Generation Error */}
            {generationError && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {generationError}
                </div>
            )}

            {/* Generated Workout + Save Section */}
            {generatedSchedule !== null && (
                <div className="space-y-8">
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <p className="font-semibold text-blue-900">
                            {savedProgramId === null ? 'Unsaved Workout Draft' : 'Program Saved'}
                        </p>

                        <p className="mt-1 text-sm text-blue-700">
                            {savedProgramId === null
                                ? 'Your draft is automatically backed up in this browser. You can navigate away and return without losing your swaps, name, or selected week.'
                                : 'This program has been saved to My Programs.'}
                        </p>
                        {draftStorageError && (
                            <p role="alert" className="mt-2 text-sm font-medium text-red-700">
                                {draftStorageError}
                            </p>
                        )}
                    </div>

                    {/* Generated Workouts */}

                    {/* Week-by-Week Preview */}
                    <div className="space-y-5">

                        {/* Week Navigation */}
                        {totalWeeks > 1 && (
                            <div className={`${ui.card} space-y-4`}>

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">
                                            Your Generated Program
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {totalWeeks} weeks · {generatedSchedule.length} total workouts
                                        </p>
                                    </div>

                                    <span className={ui.badge}>
                                        Week {safePreviewWeek} of {totalWeeks}
                                    </span>
                                </div>

                                <div
                                    role="group"
                                    aria-label="Select training week"
                                    className="flex flex-wrap gap-2"
                                >
                                    {Array.from(
                                        {length: totalWeeks},
                                        (_, index) => index + 1
                                    ).map((week) => (
                                        <button
                                            key={week}
                                            type="button"
                                            onClick={() => setPreviewWeek(week)}
                                            aria-pressed={safePreviewWeek === week}
                                            className={
                                                safePreviewWeek === week
                                                    ? 'rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white'
                                                    : 'rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50'
                                            }
                                        >
                                            Week {week}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Display only the selected week's workouts */}
                        <GeneratedWorkout
                            schedule={visibleWeekSchedule}
                            trainingDays={daysPerWeek}
                            availableEquipment={
                                requestPreview?.availableEquipment ?? []
                            }
                            onSwapExercise={handleSwapGeneratedExercise}
                            onScrollToSave={handleScrollToSave}
                        />
                    </div>


                    {/* Save Program Card */}
                    {generatedSchedule.length > 0 && (
                        <section
                            ref={saveSectionRef}
                            id="save-program"
                            className={`${ui.card} scroll-mt-28 space-y-5`}
                        >
                            <div className="border-b border-slate-200 pb-4">
                                <h2 className="text-xl font-bold text-slate-900">
                                    Save Your Program
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Give your workout program a name so you can
                                    access it later from My Programs.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="programName"
                                    className={ui.label}
                                >
                                    Program Name
                                </label>

                                <input
                                    id="programName"
                                    type="text"
                                    maxLength={100}
                                    value={programName}
                                    onChange={(event) =>
                                        setProgramName(event.target.value)
                                    }
                                    placeholder="My Strength Program"
                                    className={ui.input}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleSaveProgram}
                                    disabled={
                                        isSaving ||
                                        isGenerating ||
                                        !programName.trim() ||
                                        savedProgramId !== null
                                    }
                                    className={ui.primaryButton}
                                >
                                    {isSaving
                                        ? 'Saving...'
                                        : savedProgramId !== null
                                            ? 'Program Saved'
                                            : 'Save Program'}
                                </button>

                                {savedProgramId !== null && (
                                    <Link
                                        to="/programs"
                                        className={ui.secondaryButton}
                                    >
                                        View My Programs
                                    </Link>
                                )}
                            </div>

                            {/* Save Error */}
                            {saveError && (
                                <div
                                    role="alert"
                                    className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                                >
                                    {saveError}
                                </div>
                            )}

                            {/* Save Success */}
                            {savedProgramId !== null && (
                                <div
                                    role="status"
                                    className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"
                                >
                                    Your workout program was saved successfully!
                                </div>
                            )}
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

export default WorkoutSetupForm;
