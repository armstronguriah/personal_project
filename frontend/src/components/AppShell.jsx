
import { NavLink } from 'react-router-dom';

const navigation = [
    { label: 'Dashboard', path: '/' },
    { label: 'Generate Program', path: '/generate' },
    { label: 'My Programs', path: '/programs' },
    { label: 'Exercise Library', path: '/exercises' },
    { label: 'Workout Tracker', path: '/tracker' }
];

export default function AppShell({ children }) {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
                    <NavLink
                        to="/"
                        className="flex items-center gap-3 no-underline"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
                            W
                        </div>

                        <span className="text-lg font-bold tracking-tight text-slate-900">
              Workout Generator
            </span>
                    </NavLink>

                    <nav
                        aria-label="Main navigation"
                        className="flex w-full items-center gap-1 overflow-x-auto pb-1 lg:w-auto lg:pb-0"
                    >
                        {navigation.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) =>
                                    `shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                        isActive
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                {children}
            </main>

            <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
                Workout Generator
            </footer>
        </div>
    );
}
