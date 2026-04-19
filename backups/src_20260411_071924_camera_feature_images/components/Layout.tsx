import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Settings, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative">
      <div className="h-full">
        <Outlet />
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-slate-200 z-50">
        <Button
          variant={location.pathname === '/' ? 'primary' : 'ghost'}
          size="icon"
          onClick={() => navigate('/')}
          className="rounded-full"
        >
          <Home size={20} />
        </Button>

        <Button
          variant="primary"
          size="icon"
          className="h-14 w-14 rounded-full shadow-xl bg-brand-600 hover:bg-brand-500 -mt-8 border-4 border-slate-50"
          onClick={() => navigate('/add')}
        >
          <Plus size={28} />
        </Button>

        <Button
          variant={location.pathname === '/settings' ? 'primary' : 'ghost'}
          size="icon"
          onClick={() => navigate('/settings')}
          className="rounded-full"
        >
          <Settings size={20} />
        </Button>
      </div>
    </div>
  );
};
