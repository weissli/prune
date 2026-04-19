import React from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/Button';

interface InstallBannerProps {
  onClose: () => void;
  onInstall: () => void;
  isIOS: boolean;
  hasPrompt: boolean;
}

export const InstallBanner: React.FC<InstallBannerProps> = ({
  onClose,
  onInstall,
  isIOS,
  hasPrompt,
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] p-5 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-2xl text-white">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold mb-1">Install Prune</h2>
          {isIOS ? (
            <p className="text-sm opacity-90">
              Tap the share button <span className="font-bold">↑</span> and select <span className="font-bold">"Add to Home Screen"</span>.
            </p>
          ) : hasPrompt ? (
            <p className="text-sm opacity-90">
              Add Prune to your home screen for a better experience.
            </p>
          ) : (
            <p className="text-sm opacity-90">
              Open your browser menu and select <span className="font-bold">"Add to Home Screen"</span>.
            </p>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>
      {!isIOS && hasPrompt && (
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={onInstall} 
            className="bg-white text-blue-600 hover:bg-blue-50 border-none font-medium"
          >
            Install Now
          </Button>
        </div>
      )}
    </div>
  );
};
