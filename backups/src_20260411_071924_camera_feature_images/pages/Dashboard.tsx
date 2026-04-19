import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { MONTH_NAMES, cn } from '@/lib/utils';
import { CheckCircle2, Circle, MapPin, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { bundleOnceTasks, MonthTask } from '@/lib/utils';

export const Dashboard = () => {
  const { plants, tasks, toggleTask } = useStore();
  const navigate = useNavigate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Group by task instead of plant
  const schedule = MONTH_NAMES.map((monthName, index) => {
    const monthTasks: MonthTask[] = [];
    
    plants.forEach(plant => {
      // Fallback for plants without grouped tasks
      if (plant.pruningMonths.includes(index) && (!plant.pruningTasks || plant.pruningTasks.length === 0)) {
        monthTasks.push({
          plant,
          taskName: 'Pruning',
          type: 'recurring'
        });
      }
      
      // Grouped tasks
      plant.pruningTasks?.forEach(taskDef => {
        if (taskDef.months.includes(index)) {
          monthTasks.push({
            plant,
            taskName: taskDef.name,
            type: taskDef.type,
            months: taskDef.months
          });
        }
      });
    });

    return {
      monthIndex: index,
      monthName,
      tasks: bundleOnceTasks(monthTasks)
    };
  }).filter(group => group.tasks.length > 0);

  React.useEffect(() => {
    if (schedule.length === 0) return;
    const target = schedule.find(g => g.monthIndex >= currentMonth) || schedule[0];
    if (target) {
      const el = document.getElementById(`month-${target.monthIndex}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []); // Scroll once on mount

  const isTaskCompleted = (plantId: string, month: number, taskName?: string, taskNames?: string[]) => {
    const names = taskNames && taskNames.length > 0 ? taskNames : [taskName];
    return names.every(name => 
      tasks.some(t => 
        t.plantId === plantId && 
        t.month === month && 
        (name ? t.taskName === name : true) &&
        t.year === currentYear && 
        t.completed
      )
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <header className="pt-8 pb-4">
        <h1 className="text-4xl font-bold text-brand-900 tracking-tight">My Garden</h1>
        <p className="text-slate-500 mt-2">Pruning Schedule {currentYear}</p>
      </header>

      {plants.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-brand-500" size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No plants yet</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">
            Add your first plant to generate a pruning schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {schedule.map(({ monthIndex, monthName, tasks: monthTasks }) => {
            const isPast = monthIndex < currentMonth;
            const isCurrent = monthIndex === currentMonth;

            return (
              <section key={monthName} id={`month-${monthIndex}`} className={cn("space-y-4", isPast && "opacity-60 grayscale-[0.5]")}>
                <div className="flex items-center gap-3">
                  <h2 className={cn(
                    "text-xl font-bold",
                    isCurrent ? "text-brand-600" : "text-slate-800"
                  )}>
                    {monthName}
                  </h2>
                  {isCurrent && (
                    <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-bold rounded-full uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>

                <div className="grid gap-4">
                  {monthTasks.map(({ plant, taskName, taskNames, type }, taskIdx) => {
                    const completed = isTaskCompleted(plant.id, monthIndex, taskName, taskNames);

                    return (
                      <motion.div
                        key={`${plant.id}-${taskName}-${taskIdx}`}
                        className={cn(
                          "group relative flex items-center gap-4 p-3 rounded-2xl border transition-all shadow-sm overflow-hidden",
                          completed 
                            ? "bg-slate-50 border-slate-100 opacity-60" 
                            : "bg-white border-slate-100 hover:border-brand-200 hover:shadow-md"
                        )}
                      >
                        {/* Image */}
                        <div 
                          className={cn(
                            "w-16 h-16 shrink-0 rounded-xl bg-slate-100 overflow-hidden cursor-pointer transition-opacity",
                            completed && "opacity-80 grayscale"
                          )}
                          onClick={() => navigate(`/plant/${plant.id}`)}
                        >
                          {plant.imageUrl ? (
                            <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Calendar size={24} />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/plant/${plant.id}`)}>
                          <div className="flex items-center gap-2">
                            <h3 className={cn("font-semibold truncate transition-colors", completed ? "text-slate-400 line-through" : "text-slate-900")}>
                              {plant.name}
                            </h3>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
                              type === 'once' ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                            )}>
                              {type}
                            </span>
                          </div>
                          
                          <div className="text-sm font-medium text-brand-700 mt-0.5">{taskName}</div>
                          
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 min-w-0">
                            <MapPin size={12} className="shrink-0" />
                            <span className="truncate">{plant.location}</span>
                          </div>
                        </div>

                        {/* Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const names = taskNames && taskNames.length > 0 ? taskNames : [taskName];
                            names.forEach(name => toggleTask(plant.id, monthIndex, currentYear, name));
                          }}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-full transition-colors",
                            completed ? "text-slate-400" : "text-slate-300 hover:text-brand-500"
                          )}
                        >
                          {completed ? (
                            <CheckCircle2 size={28} className="fill-slate-100" />
                          ) : (
                            <Circle size={28} />
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
