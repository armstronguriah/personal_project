
import { Link, Routes, Route, Navigate } from 'react-router-dom';

import ExerciseLibrary from './pages/ExerciseLibrary';
import GenerateProgram from './pages/GenerateProgram';
import MyPrograms from './pages/MyProgram.jsx';
import AppShell from './components/AppShell';
import Dashboard from "./pages/Dashboard.jsx";
import WorkoutTracker from "./pages/WorkoutTracker.jsx";

import { ui } from './styles/ui';

// Dashboard page
function HomePage() {
    return (
        <section className="mx-auto max-w-5xl space-y-6">

            <div className="space-y-3">
        <span className={ui.badge}>
          Personalized Training
        </span>

                <h1 className={ui.heading}>
                    Welcome to Workout Generator
                </h1>

                <p className="max-w-2xl text-slate-500">
                    Create personalized workout programs based on
                    your goals, experience, and available equipment.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div className={`${ui.card} space-y-4`}>
                    <h2 className="text-xl font-semibold text-slate-900">
                        Generate a Workout
                    </h2>

                    <p className="text-sm text-slate-500">
                        Build a training program tailored to your
                        preferences and schedule.
                    </p>

                    <Link
                        to="/generate"
                        className={ui.primaryButton}
                    >
                        Generate Program
                    </Link>
                </div>

                <div className={`${ui.card} space-y-4`}>
                    <h2 className="text-xl font-semibold text-slate-900">
                        Exercise Library
                    </h2>

                    <p className="text-sm text-slate-500">
                        Browse, manage, and explore exercises
                        available in your database.
                    </p>

                    <Link
                        to="/exercises"
                        className={ui.secondaryButton}
                    >
                        Browse Exercises
                    </Link>
                </div>

            </div>
        </section>
    );
}

// Placeholder pages
function ComingSoon({ title, description }) {
    return (
        <section className={`${ui.card} space-y-3`}>
            <h1 className={ui.heading}>{title}</h1>

            <p className="text-slate-500">
                {description}
            </p>

            <p className="text-sm text-blue-600">
                We'll build this feature in an upcoming step.
            </p>
        </section>
    );
}

// Main application
function App() {
    return (
        <AppShell>
            <Routes>

                <Route
                    path="/"
                    element={<Dashboard />}
                />

                <Route
                    path="/generate"
                    element={<GenerateProgram />}
                />

                <Route
                    path="/programs"
                    element={<MyPrograms />}
                />

                <Route
                    path="/exercises"
                    element={<ExerciseLibrary />}
                />

                <Route
                    path="/tracker"
                    element={<WorkoutTracker/>}
                />

                <Route
                    path="/profile"
                    element={
                        <ComingSoon
                            title="My Profile"
                            description="Manage your fitness goals, experience and training preferences."
                        />
                    }
                />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

            </Routes>
        </AppShell>
    );
}

export default App;
