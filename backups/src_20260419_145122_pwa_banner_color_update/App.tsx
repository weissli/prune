/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AddPlant } from './pages/AddPlant';
import { PlantDetail } from './pages/PlantDetail';
import { Settings } from './pages/Settings';
import { Welcome } from './pages/Welcome';
import { useStore } from './hooks/useStore';
import { usePWAInstall } from './hooks/usePWAInstall';
import { InstallBanner } from './components/InstallBanner';

// Guard component to check if user has seen welcome screen
const AuthGuard = ({ children }: { children: React.ReactElement }) => {
  const { settings } = useStore();
  const location = useLocation();

  // If no API key AND hasn't seen welcome, redirect to welcome
  if (!settings.geminiApiKey && !settings.hasSeenWelcome) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  return children;
};

export default function App() {
  const { shouldShowBanner, isIOS, hasPrompt, handleInstall, handleClose } = usePWAInstall();

  return (
    <>
      {shouldShowBanner && (
        <InstallBanner
          onClose={handleClose}
          onInstall={handleInstall}
          isIOS={isIOS}
          hasPrompt={hasPrompt}
        />
      )}
      <HashRouter>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          
          <Route element={<AuthGuard><Layout /></AuthGuard>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          <Route path="/add" element={<AuthGuard><AddPlant /></AuthGuard>} />
          <Route path="/plant/:id" element={<AuthGuard><PlantDetail /></AuthGuard>} />
        </Routes>
      </HashRouter>
    </>
  );
}
