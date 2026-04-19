import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles, ArrowRight, ExternalLink } from 'lucide-react';

export const Welcome = () => {
  const navigate = useNavigate();
  const { updateSettings, settings } = useStore();
  const [apiKey, setApiKey] = useState('');

  // Redirect if already set up
  React.useEffect(() => {
    if (settings.geminiApiKey) {
      navigate('/', { replace: true });
    }
  }, [settings.geminiApiKey, navigate]);

  const handleSave = () => {
    if (apiKey.trim()) {
      const success = updateSettings({ geminiApiKey: apiKey, hasSeenWelcome: true });
      if (success) {
        navigate('/');
      } else {
        alert("Failed to save settings. Storage might be full or restricted.");
      }
    }
  };

  const handleSkip = () => {
    if (window.confirm("Without an API key, you'll need to enter plant details manually. Are you sure?")) {
      const success = updateSettings({ hasSeenWelcome: true });
      if (success) {
        navigate('/');
      } else {
        alert("Failed to save settings.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-8 max-w-md mx-auto">
      <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center mb-4 shadow-sm">
        <Sparkles className="text-brand-600" size={40} />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">Welcome to Prune</h1>
        <p className="text-slate-500 leading-relaxed">
          Prune uses Google's Gemini AI to automatically fetch pruning schedules and care instructions for your plants.
        </p>
      </div>

      <div className="w-full space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div className="text-left space-y-2">
          <label className="text-sm font-semibold text-slate-900">
            Enter Gemini API Key
          </label>
          <Input 
            type="password" 
            placeholder="Paste your API key here"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-white"
          />
        </div>

        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-brand-600 font-medium hover:underline"
        >
          Get a free API key <ExternalLink size={14} />
        </a>
      </div>

      <div className="w-full space-y-3">
        <Button 
          size="lg" 
          className="w-full h-14 text-lg rounded-2xl"
          onClick={handleSave}
          disabled={!apiKey.trim()}
        >
          Get Started <ArrowRight className="ml-2" size={20} />
        </Button>

        <button 
          onClick={handleSkip}
          className="text-sm text-slate-400 hover:text-slate-600 font-medium px-4 py-2"
        >
          I'll add it later (Manual Mode)
        </button>
      </div>
    </div>
  );
};
