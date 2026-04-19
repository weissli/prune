import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/services/storage';
import { generatePlantInfo, generatePlantImage } from '@/services/gemini';
import { AppState, Plant, AppSettings } from '@/types';

export const useStore = () => {
  const [state, setState] = useState<AppState>(storage.get());

  const refresh = useCallback(() => {
    setState({ ...storage.get() });
  }, []);

  useEffect(() => {
    window.addEventListener('storage_update', refresh);
    return () => window.removeEventListener('storage_update', refresh);
  }, [refresh]);

  const { plants, tasks, settings } = state;

  const addPlant = (plant: Plant) => {
    return storage.addPlant(plant);
  };

  const updatePlant = (plant: Plant) => {
    return storage.updatePlant(plant);
  };

  const deletePlant = (plantId: string) => {
    return storage.deletePlant(plantId);
  };

  const toggleTask = (plantId: string, month: number, year: number, taskName?: string) => {
    const res = storage.toggleTask(plantId, month, year, taskName);
    refresh();
    return res;
  };

  const updateSettings = (settings: Partial<AppSettings>) => {
    return storage.updateSettings(settings);
  };

  const importData = (json: string) => {
    const success = storage.importData(json);
    if (success) refresh();
    return success;
  };

  const exportData = () => {
    return JSON.stringify(state, null, 2);
  };

  const upgradeLegacyData = async () => {
    if (!settings.geminiApiKey) {
      throw new Error('API Key required');
    }

    const updatedPlants = [...plants];
    let updatedTasks = [...tasks];

    for (let i = 0; i < updatedPlants.length; i++) {
      const p = updatedPlants[i];
      if (!p.pruningTasks || p.pruningTasks.length === 0) {
        try {
          const info = await generatePlantInfo(p.name, settings.geminiApiKey);
          updatedPlants[i] = {
            ...p,
            careInstructions: info.careInstructions,
            pruningTasks: info.tasks
          };

          // Image retrieval retry
          const currentImg = updatedPlants[i].imageUrl;
          const isMissingOrPlaceholder = !currentImg || 
                                         currentImg.startsWith('https://images.unsplash.com') || 
                                         currentImg.includes('placeholder');
          
          if (isMissingOrPlaceholder) {
            let imgUrl = null;
            for (let attempt = 0; attempt < 2; attempt++) {
              try {
                imgUrl = await generatePlantImage(p.name, settings.geminiApiKey);
                if (imgUrl) break;
              } catch (e) {
                console.warn(`Attempt ${attempt + 1} failed for ${p.name} image`);
              }
            }
            if (imgUrl) {
              updatedPlants[i].imageUrl = imgUrl;
            }
          }

          updatedTasks = updatedTasks.filter(t => t.plantId !== p.id);
        } catch (e) {
          console.error(`Failed to upgrade ${p.name}`, e);
        }
      }
    }

    storage.set({ ...state, plants: updatedPlants, tasks: updatedTasks });
  };

  return {
    plants,
    tasks,
    settings,
    addPlant,
    updatePlant,
    deletePlant,
    toggleTask,
    updateSettings,
    importData,
    exportData,
    upgradeLegacyData,
    refresh
  };
};
