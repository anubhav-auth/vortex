import { Outlet } from 'react-router-dom';
import { TopAppBar } from './TopAppBar.jsx';
import { RetroGrid } from '../ui/RetroGrid.jsx';

// Public-facing shell. Renders the nav + the routed page on top of the
// retro grid background.

export const AppLayout = () => (
  <div className="relative min-h-screen">
    <RetroGrid className="fixed inset-0 -z-10" />
    <TopAppBar />
    <main className="relative">
      <Outlet />
    </main>
  </div>
);
