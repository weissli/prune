import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { storage } from '@/services/storage';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Trash2, MapPin, Calendar, CheckCircle2, Circle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MONTH_NAMES } from '@/lib/utils';
import { Plant } from '@/types';
import { cn } from '@/lib/utils';

export const PlantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plants, tasks, toggleTask } = useStore();
  
  // Find the plant from the store
  const storePlant = plants.find(p => p.id === id);
  
  // Cache the plant data so we can display it during the deletion/exit animation
  // even after it has been removed from the store.
  const [cachedPlant, setCachedPlant] = useState<Plant | undefined>(storePlant);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (storePlant) {
      setCachedPlant(storePlant);
    }
  }, [storePlant]);

  const plant = cachedPlant;

  if (!plant) {
    return (
      <div className="p-6 text-center">
        <p>Plant not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
      </div>
    );
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!plant) return;

    try {
      storage.deletePlant(plant.id);
    } catch (err) {
      console.error("Failed to delete plant:", err);
    }
    navigate('/', { replace: true });
  };

  const currentYear = new Date().getFullYear();

  const isTaskCompleted = (plantId: string, month: number, taskName?: string) => {
    return tasks.some(t => 
      t.plantId === plantId && 
      t.month === month && 
      (taskName ? t.taskName === taskName : true) &&
      t.year === currentYear && 
      t.completed
    );
  };

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Hero Image */}
      <div className="relative h-72 w-full">
        <img 
          src={plant.imageUrl} 
          alt={plant.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/50 to-transparent">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft />
          </Button>
        </div>
      </div>

      <div className="p-6 -mt-6 bg-white rounded-t-3xl relative z-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{plant.name}</h1>
          <div className="flex items-center gap-2 text-slate-500 mt-2">
            <MapPin size={16} />
            <span>{plant.location}</span>
          </div>
        </div>

        {/* Pruning Schedule */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar size={20} className="text-brand-600" />
            Pruning Schedule
          </h2>

          {plant.pruningTasks && plant.pruningTasks.length > 0 ? (
            <div className="space-y-3">
              {plant.pruningTasks.map(task => (
                <div key={task.name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 text-sm">{task.name}</h3>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
                      task.type === 'once' ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                    )}>
                      {task.type}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {task.months.map(m => {
                      const completed = isTaskCompleted(plant.id, m, task.name);
                      return (
                        <button
                          key={m}
                          onClick={() => toggleTask(plant.id, m, currentYear, task.name)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                            completed 
                              ? "bg-slate-200 text-slate-400 border-slate-200 line-through" 
                              : "bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50"
                          )}
                        >
                          {completed ? <CheckCircle2 size={14} className="text-slate-400" /> : <Circle size={14} className="text-slate-400" />}
                          {MONTH_NAMES[m]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {plant.pruningMonths.map(m => (
                <span 
                  key={m} 
                  className="px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-sm font-medium"
                >
                  {MONTH_NAMES[m]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Care Instructions */}
        {plant.careInstructions && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Care Instructions</h2>
            <div className="prose prose-slate prose-sm max-w-none">
              <ReactMarkdown>{plant.careInstructions}</ReactMarkdown>
            </div>
          </div>
        )}

        <div className="pt-8">
          <button
            type="button"
            className="w-full inline-flex items-center justify-center rounded-2xl font-medium transition-colors h-12 px-8 text-lg bg-red-500 text-white hover:bg-red-600 shadow-sm active:scale-95 cursor-pointer"
            onClick={handleDelete}
          >
            <Trash2 size={18} className="mr-2" />
            Remove Plant
          </button>
        </div>
      </div>
    </div>
  );
};
