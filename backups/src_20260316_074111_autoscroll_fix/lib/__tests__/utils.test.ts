import { describe, it, expect } from 'vitest';
import { bundleOnceTasks, MonthTask } from '../utils';

describe('bundleOnceTasks', () => {
  it('bundles tasks of type once for the same plant with matching month arrays', () => {
    const mockPlant = { id: 'plant-1' };
    const tasks: MonthTask[] = [
      { plant: mockPlant, taskName: 'Task A', type: 'once', months: [0, 1] },
      { plant: mockPlant, taskName: 'Task B', type: 'once', months: [0, 1] },
      { plant: mockPlant, taskName: 'Task C', type: 'recurring', months: [0, 1] }
    ];

    const result = bundleOnceTasks(tasks);
    
    // Expecting 2 items: Bundled Once [A & B] + Recurring C
    expect(result).toHaveLength(2);
    
    const bundledTask = result.find(t => t.taskName.includes('&'));
    expect(bundledTask).toBeDefined();
    expect(bundledTask?.taskName).toBe('Task A & Task B');
    expect(bundledTask?.taskNames).toEqual(['Task A', 'Task B']);
    
    const recurringTask = result.find(t => t.type === 'recurring');
    expect(recurringTask).toBeDefined();
    expect(recurringTask?.taskName).toBe('Task C');
  });

  it('does NOT bundle Once tasks with different month arrays', () => {
    const mockPlant = { id: 'plant-1' };
    const tasks: MonthTask[] = [
      { plant: mockPlant, taskName: 'Task A', type: 'once', months: [0, 1] },
      { plant: mockPlant, taskName: 'Task B', type: 'once', months: [1, 2] }
    ];

    const result = bundleOnceTasks(tasks);
    expect(result).toHaveLength(2);
    expect(result[0].taskName).toBe('Task A');
    expect(result[1].taskName).toBe('Task B');
  });

  it('does NOT bundle Once tasks from different plants', () => {
    const tasks: MonthTask[] = [
      { plant: { id: 'plant-1' }, taskName: 'Task A', type: 'once', months: [0, 1] },
      { plant: { id: 'plant-2' }, taskName: 'Task B', type: 'once', months: [0, 1] }
    ];

    const result = bundleOnceTasks(tasks);
    expect(result).toHaveLength(2);
  });
});
