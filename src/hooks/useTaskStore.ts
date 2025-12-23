import { useState, useCallback } from 'react';
import { Task, UserStats, PointsRecord, TaskCategory, TaskStatus } from '@/types/task';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialStats: UserStats = {
  totalPoints: 850,
  tasksCompleted: 23,
  tasksMissed: 2,
  currentStreak: 5,
  bestStreak: 12,
  categoryBreakdown: {
    academic: { completed: 8, total: 10 },
    professional: { completed: 10, total: 12 },
    personal: { completed: 5, total: 6 },
  },
};

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const initialTasks: Task[] = [
  {
    id: generateId(),
    title: 'Complete React Project',
    description: 'Finish the final components and testing',
    category: 'academic',
    estimatedTime: 120,
    difficulty: 7,
    importance: 9,
    deadline: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
    dependencies: [],
    isRecurring: false,
    status: 'in-progress',
    scheduledStart: new Date(today.getTime() + 9 * 60 * 60 * 1000),
    scheduledEnd: new Date(today.getTime() + 11 * 60 * 60 * 1000),
    createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: generateId(),
    title: 'Team Meeting',
    description: 'Weekly sync with the development team',
    category: 'professional',
    estimatedTime: 60,
    difficulty: 3,
    importance: 8,
    deadline: new Date(today.getTime() + 14 * 60 * 60 * 1000),
    dependencies: [],
    isRecurring: true,
    recurringPattern: 'weekly',
    status: 'pending',
    scheduledStart: new Date(today.getTime() + 14 * 60 * 60 * 1000),
    scheduledEnd: new Date(today.getTime() + 15 * 60 * 60 * 1000),
    createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: generateId(),
    title: 'Gym Workout',
    description: 'Upper body strength training',
    category: 'personal',
    estimatedTime: 90,
    difficulty: 5,
    importance: 7,
    deadline: new Date(today.getTime() + 18 * 60 * 60 * 1000),
    dependencies: [],
    isRecurring: true,
    recurringPattern: 'daily',
    status: 'pending',
    scheduledStart: new Date(today.getTime() + 17 * 60 * 60 * 1000),
    scheduledEnd: new Date(today.getTime() + 18.5 * 60 * 60 * 1000),
    createdAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: generateId(),
    title: 'Research Paper Review',
    description: 'Review and annotate the latest ML papers',
    category: 'academic',
    estimatedTime: 180,
    difficulty: 8,
    importance: 8,
    deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
    dependencies: [],
    isRecurring: false,
    status: 'pending',
    scheduledStart: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
    scheduledEnd: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000),
    createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: generateId(),
    title: 'Client Presentation Prep',
    description: 'Prepare slides for quarterly review',
    category: 'professional',
    estimatedTime: 150,
    difficulty: 6,
    importance: 10,
    deadline: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    dependencies: [],
    isRecurring: false,
    status: 'pending',
    scheduledStart: new Date(today.getTime() + 11 * 60 * 60 * 1000),
    scheduledEnd: new Date(today.getTime() + 13.5 * 60 * 60 * 1000),
    createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
  },
];

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [pointsHistory, setPointsHistory] = useState<PointsRecord[]>([]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      status: 'pending',
      createdAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  }, []);

  const completeTask = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const now = new Date();
    const isOnTime = now <= task.deadline;
    const points = isOnTime ? 
      Math.round((task.difficulty + task.importance) * 2) : 
      Math.round((task.difficulty + task.importance) * 0.5);

    const pointRecord: PointsRecord = {
      id: generateId(),
      taskId: id,
      points: isOnTime ? points : -3,
      reason: isOnTime ? 'on-time' : 'late',
      timestamp: now,
    };

    setTasks(prev => prev.map(task => 
      task.id === id ? { 
        ...task, 
        status: 'completed' as TaskStatus, 
        completedAt: now,
        pointsEarned: points 
      } : task
    ));

    setPointsHistory(prev => [...prev, pointRecord]);
    
    setStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + (isOnTime ? points : -3),
      tasksCompleted: prev.tasksCompleted + 1,
      currentStreak: isOnTime ? prev.currentStreak + 1 : 0,
      bestStreak: isOnTime ? Math.max(prev.bestStreak, prev.currentStreak + 1) : prev.bestStreak,
      categoryBreakdown: {
        ...prev.categoryBreakdown,
        [task.category]: {
          ...prev.categoryBreakdown[task.category],
          completed: prev.categoryBreakdown[task.category].completed + 1,
        },
      },
    }));
  }, [tasks]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const getTasksByCategory = useCallback((category: TaskCategory) => {
    return tasks.filter(task => task.category === category);
  }, [tasks]);

  const getTodaysTasks = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      const scheduled = task.scheduledStart;
      return scheduled && scheduled >= today && scheduled < tomorrow;
    }).sort((a, b) => {
      if (!a.scheduledStart || !b.scheduledStart) return 0;
      return a.scheduledStart.getTime() - b.scheduledStart.getTime();
    });
  }, [tasks]);

  const getUpcomingTasks = useCallback(() => {
    const now = new Date();
    return tasks
      .filter(task => task.status !== 'completed' && task.deadline > now)
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, 5);
  }, [tasks]);

  return {
    tasks,
    stats,
    pointsHistory,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
    getTasksByCategory,
    getTodaysTasks,
    getUpcomingTasks,
  };
}
