import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';

import {
    EQUIPMENT_PRESETS
} from '../constants/exerciseOptions';

import GeneratedWorkout from '../components/GeneratedWorkout.jsx';
import WorkoutSetupForm from '../components/WorkoutSetupForm.jsx';
import {generateWorkoutProgram, saveWorkoutProgram} from '../services/programApi';
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

export default function GenerateProgram() {
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

    // Automatically back up any unsaved program, including swaps and week selection.
    useEffect(() => {
        try {
            if (generatedSchedule === null || requestPreview === null || savedProgramId !== null) {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
                return;
            }

            const draft = {
                preferences,
                requestPreview,
                generatedSchedule,
                programName,
                previewWeek
            };

            localStorage.setItem(
                DRAFT_STORAGE_KEY,
                JSON.stringify(draft)
            )

        } catch (error) {
            console.error('Unable to store workout draft:', error);
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

    function handleResetForm() {
        if (isGenerating || isSaving) return;

        const confirmed = window.confirm(
            'Reset the form and discard your unsaved workout draft?'
        );

        if (!confirmed) return;

        localStorage.removeItem(DRAFT_STORAGE_KEY);

        setPreferences({
            ...DEFAULT_PREFERENCES,
            availableEquipment: []
        });

        setEquipmentError('');
        setRequestPreview(null);
        setPreviewWeek(1);
        setGeneratedSchedule(null);
        setGenerationError('');
        setProgramName('');
        setSaveError('');
        setSavedProgramId(null);
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

        const requestFields = { ...preferences };
        delete requestFields.equipmentAccess;

        const request = {
            ...requestFields,
            trainingDays: Number(preferences.trainingDays),
            sessionMinutes: Number(preferences.sessionMinutes),
            programWeeks: Number(preferences.programWeeks)
        };

        setIsGenerating(true);

        try {
            const schedule = await generateWorkoutProgram(request);
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
            const savedProgram = await saveWorkoutProgram({
                name: programName.trim(),
                preferences: requestPreview,
                schedule: generatedSchedule
            });
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
            <WorkoutSetupForm
                preferences={preferences}
                equipmentError={equipmentError}
                isGenerating={isGenerating}
                onSubmit={handleSubmit}
                onChange={handleChange}
                onEquipmentAccessChange={handleEquipmentAccessChange}
                onEquipmentToggle={handleEquipmentToggle}
                resetDisabled={isGenerating || isSaving}
                onReset={handleResetForm}
            />

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
                                    placeholder="My Program"
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


