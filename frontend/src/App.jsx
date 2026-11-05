
import { Routes, Route, Navigate } from 'react-router-dom'

import ExerciseLibrary from './pages/ExerciseLibrary';
import GenerateProgram from './pages/GenerateProgram';
import MyPrograms from './pages/MyProgram.jsx';
import AppShell from './components/AppShell';
import Dashboard from "./pages/Dashboard.jsx";
import WorkoutTracker from "./pages/WorkoutTracker.jsx";

import { ui } from './styles/ui';

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
