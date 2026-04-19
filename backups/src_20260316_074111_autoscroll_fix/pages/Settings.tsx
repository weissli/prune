import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Download, Upload, Key, Save } from 'lucide-react';

export const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, exportData, importData, upgradeLegacyData, plants } = useStore();
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveKey = () => {
    updateSettings({ geminiApiKey: apiKey });
    alert('API Key saved!');
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prune-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importData(content)) {
        alert('Data imported successfully!');
        // Don't navigate away, stay here so they can see advice if needed
      } else {
        alert('Failed to import data. Invalid format.');
      }
    };
    reader.readAsText(file);
  };

  const handleUpgrade = async () => {
    if (!settings.geminiApiKey) {
      alert('Please save your Gemini API Key first.');
      return;
    }
    setIsUpgrading(true);
    try {
      await upgradeLegacyData();
      alert('Data upgraded successfully with AI insights!');
    } catch (e: any) {
      alert(`Upgrade failed: ${e.message}`);
    } finally {
      setIsUpgrading(false);
    }
  };

  const legacyCount = plants.filter(p => !p.pruningTasks || p.pruningTasks.length === 0).length;

  return (
    <div className="p-6 max-w-2xl mx-auto pb-32">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <div className="space-y-8">
        {/* API Key Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key size={20} className="text-brand-600" />
            Gemini API Key
          </h2>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <p className="text-sm text-slate-500">
              Required for AI plant identification and care instructions.
            </p>
            <div className="flex gap-2">
              <Input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                placeholder="Enter your Gemini API Key"
              />
              <Button onClick={handleSaveKey}>
                <Save size={18} />
              </Button>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Download size={20} className="text-brand-600" />
            Data Management
          </h2>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="secondary" onClick={handleExport} className="w-full justify-start">
                <Download size={18} className="mr-2" />
                Export Backup
              </Button>
              
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full justify-start">
                <Upload size={18} className="mr-2" />
                Import Backup
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImport} 
                accept=".json" 
                className="hidden" 
              />
            </div>

            {legacyCount > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-amber-800">Legacy Data Detected</h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {legacyCount} plant(s) use flat structure formats. Upgrade now to enable flexible groupings.
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={handleUpgrade} 
                  disabled={isUpgrading}
                  className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100 shrink-0 text-xs py-1.5 h-auto"
                >
                  {isUpgrading ? 'Upgrading...' : 'Upgrade Now'}
                </Button>
              </div>
            )}
          </div>
        </section>

        <div className="pt-8 text-center text-xs text-slate-400">
          <p>Prune v1.0.1</p>
        </div>
      </div>
    </div>
  );
};
