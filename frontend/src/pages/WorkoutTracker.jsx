import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ui} from '../styles/ui';
import {formatWorkoutPrescription, isCardioExercise} from '../utils/workoutPrescription';


function entryKey(exerciseId, setNumber) {
    return `${exerciseId}:${setNumber}`;
}

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

function formatLabel(value) {
    return (value ?? '')
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function WorkoutTracker() {
    const [programs, setPrograms] = useState([]);
    const [programId, setProgramId] = useState('');
    const [week, setWeek] = useState(1);
    const [sessionNumber, setSessionNumber] = useState(null);

    const [entries, setEntries] = useState({});
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
                const response = await fetch('/api/programs/saved', {
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error('Unable to load saved programs.');
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error('Unexpected program response.');
                }

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
            setDirty(false);
            setError('');
            setMessage('');

            try {
                const response = await fetch(
                    `/api/programs/saved/${programId}/sessions/${sessionNumber}/sets`,
                    {
                        signal: controller.signal
                    }
                );

                if (!response.ok) {
                    throw new Error('Unable to load workout log.');
                }

                const logs = await response.json();

                if (!Array.isArray(logs)) {
                    throw new Error('Unexpected workout log response.');
                }

                if (!controller.signal.aborted) {
                    setEntries(entriesFromLogs(logs));
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
            const response = await fetch(
                `/api/programs/saved/${programId}/sessions/${sessionNumber}/sets`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({sets})
                }
            );

            if (!response.ok) {
                throw new Error('Unable to save workout log.');
            }

            const savedLogs = await response.json();

            setEntries(entriesFromLogs(savedLogs));
            setDirty(false);
            setMessage(
                `Workout log saved. ${savedLogs.length} sets recorded.`
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
            const response = await fetch(
                `/api/programs/saved/${programId}/sessions/${sessionNumber}/completion`,
                {
                    method: isCompleted ? 'DELETE' : 'PUT'
                }
            );

            if (!response.ok) {
                throw new Error('Unable to update workout completion.');
            }

            const updatedProgram = await response.json();

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
                    Record your actual weight, reps, and RPE
                    for each set of your saved workouts.
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
                    <section className={`${ui.card} space-y-5`}>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Select Your Workout
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Choose a program, week, and session to log.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="tracker-program" className={ui.label}>
                                Saved Program
                            </label>

                            <select
                                id="tracker-program"
                                value={programId}
                                onChange={handleProgramChange}
                                disabled={saving}
                                className={ui.input}
                            >
                                {programs.map((program) => (
                                    <option key={program.id} value={program.id}>
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Week Navigation */}
                        {totalWeeks > 1 && (
                            <div>
                                <h3 className={ui.label}>Training Week</h3>

                                <div
                                    role="group"
                                    aria-label="Training week"
                                    className="flex flex-wrap gap-2"
                                >
                                    {Array.from(
                                        {length: totalWeeks},
                                        (_, index) => index + 1
                                    ).map((weekNumber) => (
                                        <button
                                            key={weekNumber}
                                            type="button"
                                            disabled={saving}
                                            onClick={() =>
                                                handleWeekChange(weekNumber)
                                            }
                                            aria-pressed={week === weekNumber}
                                            className={
                                                week === weekNumber
                                                    ? ui.primaryButton
                                                    : ui.secondaryButton
                                            }
                                        >
                                            Week {weekNumber}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Session Navigation */}
                        <div>
                            <h3 className={ui.label}>Workout Session</h3>

                            <div className="flex flex-wrap gap-2">
                                {weekSessions.map((session, index) => (
                                    <button
                                        key={session.sessionNumber}
                                        type="button"
                                        disabled={saving}
                                        onClick={() =>
                                            handleSessionChange(session.sessionNumber)
                                        }
                                        className={
                                            session.sessionNumber === sessionNumber
                                                ? ui.primaryButton
                                                : ui.secondaryButton
                                        }
                                    >
                                        Day {index + 1} — {
                                        formatLabel(session.workoutType)
                                    }
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Selected Session */}
                    {activeSession && (
                        <section className="space-y-5">

                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Session {activeSession.sessionNumber}
                                        {' — '}
                                        {formatLabel(activeSession.workoutType)}
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
                                    <article
                                        key={exercise.exerciseId}
                                        className={`${ui.card} space-y-5`}
                                    >
                                        {/* Exercise Heading */}
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">
                                                    {exercise.exerciseName}
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {formatWorkoutPrescription(exercise)}
                                                </p>
                                            </div>

                                            <span className={ui.badge}>
                                                Target RPE: {
                                                exercise.targetRpe ?? '—'
                                            }
                                             </span>
                                        </div>

                                        {isCardioExercise(exercise) && (
                                            <p className="text-sm text-slate-500">
                                                Cardio duration and interval results are not logged yet.
                                                You can still mark this session complete.
                                            </p>
                                        )}

                                        {/* Set Entry Table — resistance exercises only */}
                                        {!isCardioExercise(exercise) && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[500px] border-collapse">

                                                    <thead>
                                                    <tr>
                                                        <th className={ui.tableHeader}>
                                                            Set
                                                        </th>

                                                        <th className={ui.tableHeader}>
                                                            Weight (lb)
                                                        </th>

                                                        <th className={ui.tableHeader}>
                                                            Reps
                                                        </th>

                                                        <th className={ui.tableHeader}>
                                                            Actual RPE
                                                        </th>
                                                    </tr>
                                                    </thead>

                                                    <tbody>
                                                    {Array.from(
                                                        {length: exercise.sets},
                                                        (_, index) => index + 1
                                                    ).map((setNumber) => {
                                                        const key = entryKey(
                                                            exercise.exerciseId,
                                                            setNumber
                                                        );

                                                        const entry = entries[key] ?? {
                                                            weightLb: '',
                                                            reps: String(exercise.reps),
                                                            actualRpe: ''
                                                        };

                                                        return (
                                                            <tr key={setNumber}>
                                                                <td className={ui.tableCell}>
                                                                    {setNumber}
                                                                </td>

                                                                <td className={ui.tableCell}>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="any"
                                                                        value={entry.weightLb}
                                                                        aria-label={`${exercise.exerciseName} set ${setNumber} weight`}
                                                                        onChange={(event) =>
                                                                            handleEntryChange(
                                                                                exercise,
                                                                                setNumber,
                                                                                'weightLb',
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        className={`${ui.input} min-w-24`}
                                                                        placeholder="0"
                                                                    />
                                                                </td>

                                                                <td className={ui.tableCell}>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        step="1"
                                                                        value={entry.reps}
                                                                        aria-label={`${exercise.exerciseName} set ${setNumber} reps`}
                                                                        onChange={(event) =>
                                                                            handleEntryChange(
                                                                                exercise,
                                                                                setNumber,
                                                                                'reps',
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        className={`${ui.input} min-w-20`}
                                                                    />
                                                                </td>

                                                                <td className={ui.tableCell}>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max="10"
                                                                        step="0.5"
                                                                        value={entry.actualRpe}
                                                                        aria-label={`${exercise.exerciseName} set ${setNumber} actual RPE`}
                                                                        onChange={(event) =>
                                                                            handleEntryChange(
                                                                                exercise,
                                                                                setNumber,
                                                                                'actualRpe',
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        className={`${ui.input} min-w-20`}
                                                                        placeholder="Optional"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </article>
                                )
                            )}

                            {/* Save and Complete Controls */}
                            {logsReady && (
                                <div className={`${ui.card} space-y-4`}>
                                    {dirty && (
                                        <p className="text-sm font-medium text-amber-700">
                                            You have unsaved set changes.
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
