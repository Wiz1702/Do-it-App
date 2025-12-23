import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, UserStats, PointsRecord, TaskCategory, TaskStatus } from '@/types/task';
import { useAuth } from './useAuth';

type DbTask = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: 'academic' | 'professional' | 'personal';
  estimated_time: number;
  difficulty: number;
  importance: number;
  deadline: string;
  dependencies: string[] | null;
  is_recurring: boolean;
  recurring_pattern: 'daily' | 'weekly' | 'monthly' | null;
  status: 'pending' | 'in-progress' | 'completed' | 'missed';
  scheduled_start: string | null;
  scheduled_end: string | null;
  completed_at: string | null;
  points_earned: number | null;
  created_at: string;
  updated_at: string;
};

type DbUserStats = {
  id: string;
  user_id: string;
  total_points: number;
  tasks_completed: number;
  tasks_missed: number;
  current_streak: number;
  best_streak: number;
  academic_completed: number;
  academic_total: number;
  professional_completed: number;
  professional_total: number;
  personal_completed: number;
  personal_total: number;
  created_at: string;
  updated_at: string;
};

const defaultStats: UserStats = {
  totalPoints: 0,
  tasksCompleted: 0,
  tasksMissed: 0,
  currentStreak: 0,
  bestStreak: 0,
  categoryBreakdown: {
    academic: { completed: 0, total: 0 },
    professional: { completed: 0, total: 0 },
    personal: { completed: 0, total: 0 },
  },
};

function mapDbTaskToTask(dbTask: DbTask): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || undefined,
    category: dbTask.category as TaskCategory,
    estimatedTime: dbTask.estimated_time,
    difficulty: dbTask.difficulty,
    importance: dbTask.importance,
    deadline: new Date(dbTask.deadline),
    dependencies: dbTask.dependencies || [],
    isRecurring: dbTask.is_recurring,
    recurringPattern: dbTask.recurring_pattern || undefined,
    status: dbTask.status as TaskStatus,
    scheduledStart: dbTask.scheduled_start ? new Date(dbTask.scheduled_start) : undefined,
    scheduledEnd: dbTask.scheduled_end ? new Date(dbTask.scheduled_end) : undefined,
    completedAt: dbTask.completed_at ? new Date(dbTask.completed_at) : undefined,
    pointsEarned: dbTask.points_earned || undefined,
    createdAt: new Date(dbTask.created_at),
  };
}

function mapDbStatsToStats(dbStats: DbUserStats): UserStats {
  return {
    totalPoints: dbStats.total_points,
    tasksCompleted: dbStats.tasks_completed,
    tasksMissed: dbStats.tasks_missed,
    currentStreak: dbStats.current_streak,
    bestStreak: dbStats.best_streak,
    categoryBreakdown: {
      academic: { completed: dbStats.academic_completed, total: dbStats.academic_total },
      professional: { completed: dbStats.professional_completed, total: dbStats.professional_total },
      personal: { completed: dbStats.personal_completed, total: dbStats.personal_total },
    },
  };
}

export function useTaskStore() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [pointsHistory, setPointsHistory] = useState<PointsRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from database
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setStats(defaultStats);
      setPointsHistory([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!tasksError && tasksData) {
        setTasks(tasksData.map(mapDbTaskToTask));
      }

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .maybeSingle();

      if (!statsError && statsData) {
        setStats(mapDbStatsToStats(statsData));
      }

      // Fetch points history
      const { data: pointsData, error: pointsError } = await supabase
        .from('points_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (!pointsError && pointsData) {
        setPointsHistory(pointsData.map(p => ({
          id: p.id,
          taskId: p.task_id || '',
          points: p.points,
          reason: p.reason as PointsRecord['reason'],
          timestamp: new Date(p.created_at),
        })));
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: taskData.title,
        description: taskData.description || null,
        category: taskData.category,
        estimated_time: taskData.estimatedTime,
        difficulty: taskData.difficulty,
        importance: taskData.importance,
        deadline: taskData.deadline.toISOString(),
        dependencies: taskData.dependencies,
        is_recurring: taskData.isRecurring,
        recurring_pattern: taskData.recurringPattern || null,
        scheduled_start: taskData.scheduledStart?.toISOString() || null,
        scheduled_end: taskData.scheduledEnd?.toISOString() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding task:', error);
      return null;
    }

    const newTask = mapDbTaskToTask(data);
    setTasks(prev => [newTask, ...prev]);

    // Update category total
    await supabase
      .from('user_stats')
      .update({
        [`${taskData.category}_total`]: stats.categoryBreakdown[taskData.category].total + 1,
      })
      .eq('user_id', user.id);

    setStats(prev => ({
      ...prev,
      categoryBreakdown: {
        ...prev.categoryBreakdown,
        [taskData.category]: {
          ...prev.categoryBreakdown[taskData.category],
          total: prev.categoryBreakdown[taskData.category].total + 1,
        },
      },
    }));

    return newTask;
  }, [user, stats]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!user) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.estimatedTime) dbUpdates.estimated_time = updates.estimatedTime;
    if (updates.difficulty) dbUpdates.difficulty = updates.difficulty;
    if (updates.importance) dbUpdates.importance = updates.importance;
    if (updates.deadline) dbUpdates.deadline = updates.deadline.toISOString();
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.scheduledStart) dbUpdates.scheduled_start = updates.scheduledStart.toISOString();
    if (updates.scheduledEnd) dbUpdates.scheduled_end = updates.scheduledEnd.toISOString();

    const { error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', id);

    if (!error) {
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));
    }
  }, [user]);

  const completeTask = useCallback(async (id: string) => {
    if (!user) return;
    
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const now = new Date();
    const isOnTime = now <= task.deadline;
    const points = isOnTime ? 
      Math.round((task.difficulty + task.importance) * 2) : 
      Math.round((task.difficulty + task.importance) * 0.5);
    const pointsChange = isOnTime ? points : -3;

    // Update task in database
    const { error: taskError } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: now.toISOString(),
        points_earned: points,
      })
      .eq('id', id);

    if (taskError) {
      console.error('Error completing task:', taskError);
      return;
    }

    // Add points record
    await supabase
      .from('points_history')
      .insert({
        user_id: user.id,
        task_id: id,
        points: pointsChange,
        reason: isOnTime ? 'on-time' : 'late',
      });

    // Update stats
    const newStreak = isOnTime ? stats.currentStreak + 1 : 0;
    const newBestStreak = isOnTime ? Math.max(stats.bestStreak, newStreak) : stats.bestStreak;

    await supabase
      .from('user_stats')
      .update({
        total_points: stats.totalPoints + pointsChange,
        tasks_completed: stats.tasksCompleted + 1,
        current_streak: newStreak,
        best_streak: newBestStreak,
        [`${task.category}_completed`]: stats.categoryBreakdown[task.category].completed + 1,
      })
      .eq('user_id', user.id);

    // Update local state
    setTasks(prev => prev.map(t => 
      t.id === id ? { 
        ...t, 
        status: 'completed' as TaskStatus, 
        completedAt: now,
        pointsEarned: points 
      } : t
    ));

    setStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + pointsChange,
      tasksCompleted: prev.tasksCompleted + 1,
      currentStreak: newStreak,
      bestStreak: newBestStreak,
      categoryBreakdown: {
        ...prev.categoryBreakdown,
        [task.category]: {
          ...prev.categoryBreakdown[task.category],
          completed: prev.categoryBreakdown[task.category].completed + 1,
        },
      },
    }));

    setPointsHistory(prev => [{
      id: crypto.randomUUID(),
      taskId: id,
      points: pointsChange,
      reason: isOnTime ? 'on-time' : 'late',
      timestamp: now,
    }, ...prev]);

    return { isOnTime, points: pointsChange };
  }, [user, tasks, stats]);

  const deleteTask = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (!error) {
      setTasks(prev => prev.filter(task => task.id !== id));
    }
  }, [user]);

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
    loading,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
    getTasksByCategory,
    getTodaysTasks,
    getUpcomingTasks,
  };
}
