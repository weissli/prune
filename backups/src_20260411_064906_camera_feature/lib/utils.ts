import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export async function compressImage(base64Str: string, maxWidth = 300, quality = 0.5): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
}

export interface MonthTask {
  plant: any;
  taskName: string;
  taskNames?: string[];
  type: string;
  months?: number[];
}

export function bundleOnceTasks(monthTasks: MonthTask[]): MonthTask[] {
  const bundled: MonthTask[] = [];
  
  monthTasks.forEach(task => {
    if (task.type === 'once' && task.months) {
      const existing = bundled.find(t => 
        t.plant.id === task.plant.id && 
        t.type === 'once' && 
        t.months && 
        t.months.join(',') === task.months.join(',')
      );

      if (existing) {
        existing.taskNames = existing.taskNames || [existing.taskName];
        if (!existing.taskNames.includes(task.taskName)) {
          existing.taskNames.push(task.taskName);
          existing.taskName += ` & ${task.taskName}`;
        }
        return;
      }
    }
    bundled.push({ ...task, taskNames: task.taskNames || [task.taskName] });
  });

  return bundled;
}
