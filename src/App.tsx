import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './screens/Home';
import SessionFlow from './screens/SessionFlow';
import History from './screens/History';
import Progress from './screens/Progress';
import Settings from './screens/Settings';
import LogCheck from './screens/LogCheck';

function NavTab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex-1 py-3 text-center text-sm font-medium ${
          isActive ? 'text-neutral-100' : 'text-neutral-500'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <main className="flex-1 px-4 pt-6 pb-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/session" element={<SessionFlow />} />
          <Route path="/check" element={<LogCheck />} />
          <Route path="/history" element={<History />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <nav
        className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-md -translate-x-1/2 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <NavTab to="/" label="Today" />
        <NavTab to="/history" label="History" />
        <NavTab to="/progress" label="Progress" />
        <NavTab to="/settings" label="Settings" />
      </nav>
    </div>
  );
}
