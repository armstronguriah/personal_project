import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ui} from '../styles/ui';
import {getSavedPrograms, setSessionCompletion} from '../services/programApi';
import {getSessionLogs, saveResistanceSets, saveCardioNotes} from '../services/workoutLogApi';
import {isCardioExercise} from '../utils/workoutPrescription';
import {entryKey} from '../utils/workoutLog';
import {formatWorkoutType} from '../utils/formatters';
import WorkoutSelector from '../components/WorkoutSelector';
import WorkoutExerciseLog from '../components/WorkoutExerciseLog';


function entriesFromLogs(logs) {
    const entries = {};

    for (const log of logs) {
        entries[entryKey(log.exerciseId, log.setNumber)] = {
            weightLb: String(log.weightLb),
            reps: String(log.reps),
            actualRpe: log.actualRpe == null
                ? ''
                : String(log.actualRpe)
        };
    }

    return entries;
}

export default function WorkoutTracker() {
    const [programs, setPrograms] = useState([]);
    const [programId, setProgramId] = useState('');
    const [week, setWeek] = useState(1);
    const [sessionNumber, setSessionNumber] = useState(null);

    const [entries, setEntries] = useState({});
    const [cardioNotes, setCardioNotes] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logsReady, setLogsReady] = useState(false);

    const [saving, setSaving] = useState(false);
    const [updatingCompletion, setUpdatingCompletion] = useState(false);
    const [dirty, setDirty] = useState(false);

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Load saved programs
    useEffect(() => {
        const controller = new AbortController();

        async function loadPrograms() {
            try {
                const data = await getSavedPrograms(controller.signal);

                if (controller.signal.aborted) return;

                setPrograms(data);

                if (data.length > 0) {
                    setProgramId(String(data[0].id));
                    setSessionNumber(
                        data[0].schedule?.[0]?.sessionNumber ?? null
                    );
                }
            } catch (err) {
                if (!controller.signal.aborted) {
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

    const selectedProgram = programs.find(
        (program) => String(program.id) === programId
    );

    const schedule = selectedProgram?.schedule ?? [];

    const daysPerWeek = Math.max(
        1,
        Number(selectedProgram?.preferences?.trainingDays) || 1
    );

    const totalWeeks = Math.ceil(schedule.length / daysPerWeek);

    const weekSessions = schedule.slice(
        (week - 1) * daysPerWeek,
        week * daysPerWeek
    );

    const activeSession = schedule.find(
        (session) => session.sessionNumber === sessionNumber
    );

    const isCompleted =
        selectedProgram?.completedSessions?.includes(
            sessionNumber
        ) ?? false;

    // Load logs whenever the selected program or session changes
    useEffect(() => {
        if (!programId || sessionNumber === null) return;

        const controller = new AbortController();

        async function loadLogs() {
            setLoadingLogs(true);
            setLogsReady(false);
            setEntries({});
            setCardioNotes({});
            setDirty(false);
            setError('');
            setMessage('');

            try {
                const {sets: logs, notes} = await getSessionLogs(
                    programId, sessionNumber, controller.signal
                );

                if (!controller.signal.aborted) {
                    setEntries(entriesFromLogs(logs));
                    setCardioNotes(notes);
                    setLogsReady(true);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingLogs(false);
                }
            }
        }

        loadLogs();

        return () => controller.abort();
    }, [programId, sessionNumber]);

    // Warn before changing sessions with unsaved input
    function canChangeSelection() {
        return (
            !dirty ||
            window.confirm('Discard unsaved workout log changes?')
        );
    }

    function handleProgramChange(event) {
        const nextId = event.target.value;

        if (!canChangeSelection()) return;

        const program = programs.find(
            (item) => String(item.id) === nextId
        );

        setProgramId(nextId);
        setWeek(1);
        setSessionNumber(
            program?.schedule?.[0]?.sessionNumber ?? null
        );
        setEntries({});
        setMessage('');
    }

    function handleWeekChange(nextWeek) {
        if (!canChangeSelection()) return;

        const firstSession = schedule[
        (nextWeek - 1) * daysPerWeek
            ];

        setWeek(nextWeek);
        setSessionNumber(firstSession?.sessionNumber ?? null);
        setMessage('');
    }

    function handleSessionChange(nextSessionNumber) {
        if (!canChangeSelection()) return;

        setSessionNumber(nextSessionNumber);
        setMessage('');
    }

    // Update an individual set input
    function handleEntryChange(
        exercise,
        setNumber,
        field,
        value
    ) {
        const key = entryKey(exercise.exerciseId, setNumber);

        setEntries((previous) => ({
            ...previous,
            [key]: {
                weightLb: '',
                reps: String(exercise.reps),
                actualRpe: '',
                ...previous[key],
                [field]: value
            }
        }));

        setDirty(true);
        setMessage('');
    }

    function handleCardioNotesChange(exerciseId, value) {
        setCardioNotes((previous) => ({
            ...previous,
            [exerciseId]: value
        }));
        setDirty(true);
        setMessage('');
    }

    // Save all logged sets for the selected session
    async function handleSaveLogs() {
        if (!activeSession || !logsReady || saving) return;

        setError('');
        setMessage('');

        const sets = [];

        for (const exercise of activeSession.exercises) {
            for (
                let setNumber = 1;
                setNumber <= exercise.sets;
                setNumber++
            ) {
                const entry = entries[
                    entryKey(exercise.exerciseId, setNumber)
                    ];

                // A blank weight means this set was not logged.
                if (!entry || entry.weightLb === '') {
                    continue;
                }

                const weightLb = Number(entry.weightLb);
                const reps = Number(entry.reps);
                const actualRpe =
                    entry.actualRpe === ''
                        ? null
                        : Number(entry.actualRpe);

                if (
                    !Number.isFinite(weightLb) ||
                    weightLb < 0 ||
                    !Number.isInteger(reps) ||
                    reps < 1 ||
                    (
                        actualRpe !== null &&
                        (
                            !Number.isFinite(actualRpe) ||
                            actualRpe < 1 ||
                            actualRpe > 10
                        )
                    )
                ) {
                    setError(
                        `Check the logged values for ${exercise.exerciseName}.`
                    );
                    return;
                }

                sets.push({
                    exerciseId: exercise.exerciseId,
                    setNumber,
                    weightLb,
                    reps,
                    actualRpe
                });
            }
        }

        setSaving(true);

        try {
            const savedLogs = await saveResistanceSets(programId, sessionNumber, sets);

            // Only save notes for cardio exercises still present in the session.
            // This also handles an exercise that was swapped after an earlier log.
            const activeCardioIds = new Set(
                activeSession.exercises
                    .filter(isCardioExercise)
                    .map((exercise) => String(exercise.exerciseId))
            );
            const activeCardioNotes = Object.fromEntries(
                Object.entries(cardioNotes).filter(([exerciseId]) =>
                    activeCardioIds.has(exerciseId)
                )
            );

            // Cardio notes are stored independently from weight-and-rep sets.
            const savedNotes = await saveCardioNotes(
                programId, sessionNumber, activeCardioNotes
            );
            setEntries(entriesFromLogs(savedLogs));
            setCardioNotes(savedNotes);
            setDirty(false);
            setMessage(
                `Workout log saved. ${savedLogs.length} resistance sets recorded.`
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    // Reuse existing workout completion endpoint
    async function handleToggleCompletion() {
        if (!activeSession || updatingCompletion || dirty) return;

        setUpdatingCompletion(true);
        setError('');
        setMessage('');

        try {
            const updatedProgram = await setSessionCompletion(
                programId, sessionNumber, !isCompleted
            );

            setPrograms((previous) =>
                previous.map((program) =>
                    program.id === updatedProgram.id
                        ? updatedProgram
                        : program
                )
            );

            setMessage(
                isCompleted
                    ? 'Workout completion removed.'
                    : 'Workout marked complete.'
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingCompletion(false);
        }
    }

    if (loading) {
        return (
            <div className={ui.card} role="status">
                Loading workout tracker...
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8">

            {/* Page Header */}
            <div className="space-y-3">
        <span className={ui.badge}>
          Training Log
        </span>

                <h1 className={ui.heading}>
                    Workout Tracker
                </h1>

                <p className="text-sm text-slate-500">
                    Record weight, reps, and RPE for lifting, or add notes about your cardio sessions.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {message && (
                <div
                    role="status"
                    className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
                >
                    {message}
                </div>
            )}

            {/* Empty State */}
            {programs.length === 0 ? (
                <div className={`${ui.card} space-y-4`}>
                    <h2 className="text-lg font-semibold text-slate-900">
                        No Saved Programs
                    </h2>

                    <p className="text-sm text-slate-500">
                        Save a generated program before logging workouts.
                    </p>

                    <Link to="/generate" className={ui.primaryButton}>
                        Generate Program
                    </Link>
                </div>
            ) : (
                <>
                    {/* Program Selector */}
                    <WorkoutSelector
                        programs={programs}
                        programId={programId}
                        onProgramChange={handleProgramChange}
                        saving={saving}
                        totalWeeks={totalWeeks}
                        week={week}
                        onWeekChange={handleWeekChange}
                        weekSessions={weekSessions}
                        sessionNumber={sessionNumber}
                        onSessionChange={handleSessionChange}
                    />

                    {/* Selected Session */}
                    {activeSession && (
                        <section className="space-y-5">

                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Session {activeSession.sessionNumber}
                                        {' — '}
                                        {formatWorkoutType(activeSession.workoutType)}
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {activeSession.exercises.length} exercises
                                    </p>
                                </div>

                                <span className={ui.badge}>
                  {isCompleted ? 'Completed' : 'Not Completed'}
                </span>
                            </div>

                            <p className="text-sm text-slate-500">
                                Enter a weight for each completed set.
                                Use 0 lb for bodyweight or unloaded sets.
                                Leave weight blank for sets you haven't performed.
                            </p>

                            {loadingLogs && (
                                <p role="status" className="text-sm text-blue-700">
                                    Loading recorded sets...
                                </p>
                            )}

                            {logsReady && activeSession.exercises.map(
                                (exercise) => (
                                    <WorkoutExerciseLog
                                        key={exercise.exerciseId}
                                        exercise={exercise}
                                        entries={entries}
                                        cardioNotes={cardioNotes}
                                        onEntryChange={handleEntryChange}
                                        onCardioNotesChange={handleCardioNotesChange}
                                    />
                                )
                            )}

                            {/* Save and Complete Controls */}
                            {logsReady && (
                                <div className={`${ui.card} space-y-4`}>
                                    {dirty && (
                                        <p className="text-sm font-medium text-amber-700">
                                            You have unsaved workout log changes.
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={handleSaveLogs}
                                            disabled={saving || updatingCompletion}
                                            className={ui.primaryButton}
                                        >
                                            {saving
                                                ? 'Saving...'
                                                : 'Save Workout Log'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleToggleCompletion}
                                            disabled={
                                                dirty ||
                                                saving ||
                                                updatingCompletion
                                            }
                                            className={ui.secondaryButton}
                                        >
                                            {updatingCompletion
                                                ? 'Updating...'
                                                : isCompleted
                                                    ? 'Undo Completion'
                                                    : 'Mark Workout Complete'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
