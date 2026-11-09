
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getExercises } from '../services/exerciseApi';
import { ui } from '../styles/ui';

function formatLabel(value) {
    if (!value) return 'Not specified';

    return value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProgress(program) {
    const total = program.schedule?.length ?? 0;
    const completed = program.completedSessions?.length ?? 0;

    if (total === 0) return 0;

    return Math.min(100, Math.round((completed / total) * 100));
}

export default function Dashboard() {
    const [programs, setPrograms] = useState([]);
    const [exerciseCount, setExerciseCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        async function loadDashboard() {
            try {
                const [programResponse, exercises] = await Promise.all([
                    fetch('/api/programs/saved', {
                        signal: controller.signal
                    }),
                    getExercises({}, controller.signal)
                ]);

                if (!programResponse.ok) {
                    throw new Error('Unable to load saved programs.');
                }

                const savedPrograms = await programResponse.json();

                if (!Array.isArray(savedPrograms) ||
                    !Array.isArray(exercises)) {
                    throw new Error('Unexpected data received from server.');
                }

                if (!controller.signal.aborted) {
                    setPrograms(savedPrograms);
                    setExerciseCount(exercises.length);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(
                        err.message || 'Unable to load dashboard information.'
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadDashboard();

        return () => controller.abort();
    }, []);

    // Calculate dashboard statistics
    const totalPrograms = programs.length;

    const completedWorkouts = programs.reduce(
        (total, program) =>
            total + (program.completedSessions?.length ?? 0),
        0
    );

    // Display the three most recently saved programs
    const recentPrograms = [...programs]
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        )
        .slice(0, 3);

    const statistics = [
        {
            label: 'Saved Programs',
            value: totalPrograms,
            description: 'Your training plans'
        },
        {
            label: 'Completed Sessions',
            value: completedWorkouts,
            description: 'Across saved programs'
        },
        {
            label: 'Exercise Library',
            value: exerciseCount,
            description: 'Available exercises'
        }
    ];

    return (
        <div className="mx-auto max-w-6xl space-y-8">

            {/* Header */}
            <section className="flex flex-col gap-4 sm:min-h-40 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                    <span className={ui.badge}>
                        Training Overview
                    </span>

                    <h1 className={ui.heading}>
                        Dashboard
                    </h1>

                    <p className="max-w-xl text-sm leading-relaxed text-slate-500">
                        Manage your training programs, explore exercises,
                        and stay on top of your workout progress.
                    </p>
                </div>

                <Link
                    to="/generate"
                    className={`${ui.primaryButton} sm:self-center`}
                >
                    + New Program
                </Link>
            </section>

            {/* API Error */}
            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {/* Statistics */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">
                    Your Statistics
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {statistics.map((statistic) => (
                        <div
                            key={statistic.label}
                            className={`${ui.card} transition-shadow hover:shadow-md`}
                        >
                            <p className="text-sm font-medium text-slate-500">
                                {statistic.label}
                            </p>

                            <p className="mt-3 text-3xl font-bold text-blue-600">
                                {loading ? '...' : error ? '—' : statistic.value}
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                                {statistic.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Quick Actions */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">
                    Quick Actions
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    <Link
                        to="/generate"
                        className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                    >
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl font-bold text-blue-600">
                            +
                        </div>

                        <h3 className="font-semibold text-slate-900">
                            Generate Program
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Build a personalized workout plan based on
                            your training preferences.
                        </p>

                        <p className="mt-5 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                            Create Program
                        </p>
                    </Link>

                    <Link
                        to="/programs"
                        className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                    >
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl font-bold text-blue-600">
                            P
                        </div>

                        <h3 className="font-semibold text-slate-900">
                            My Programs
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            View saved programs and mark your workout
                            sessions complete.
                        </p>

                        <p className="mt-5 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                            View Programs
                        </p>
                    </Link>

                    <Link
                        to="/exercises"
                        className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                    >
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl font-bold text-blue-600">
                            E
                        </div>

                        <h3 className="font-semibold text-slate-900">
                            Exercise Library
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Browse, filter, add, and manage exercises
                            in your database.
                        </p>

                        <p className="mt-5 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                            Browse Exercises
                        </p>
                    </Link>

                </div>
            </section>

            {/* Recent Programs */}
            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-slate-900">
                        Recent Programs
                    </h2>

                    <Link
                        to="/programs"
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                        View All Programs
                    </Link>
                </div>

                <div className={ui.card}>
                    {loading ? (
                        <p role="status" className="text-sm text-slate-500">
                            Loading recent programs...
                        </p>
                    ) : error ? (
                        <p className="text-sm text-slate-500">
                            Recent programs are unavailable.
                        </p>
                    ) : recentPrograms.length === 0 ? (
                        <div className="space-y-3 py-5 text-center">
                            <h3 className="font-semibold text-slate-900">
                                No Programs Yet
                            </h3>

                            <p className="text-sm text-slate-500">
                                Your saved programs will appear here.
                            </p>

                            <Link
                                to="/generate"
                                className={ui.primaryButton}
                            >
                                Generate Your First Program
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recentPrograms.map((program) => {
                                const completed =
                                    program.completedSessions?.length ?? 0;

                                const total =
                                    program.schedule?.length ?? 0;

                                const progress = getProgress(program);

                                return (
                                    <div
                                        key={program.id}
                                        className="space-y-4 py-5 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">
                                                    {program.name}
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {formatLabel(program.preferences?.goal)}
                                                    {' · '}
                                                    {program.preferences?.trainingDays} days/week
                                                </p>
                                            </div>

                                            <span className={ui.badge}>
                                                {progress}% Complete
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-blue-600 transition-all"
                                                style={{
                                                    width: `${progress}%`
                                                }}
                                            />
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <p className="text-xs text-slate-500">
                                                {completed} of {total} workouts completed
                                            </p>

                                            <Link
                                                to="/programs"
                                                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                                            >
                                                View Program
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
