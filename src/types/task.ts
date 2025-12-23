export type TaskCategory = 'academic' | 'professional' | 'personal';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'missed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  estimatedTime: number; // in minutes
  difficulty: number; // 1-10
  importance: number; // 1-10
  deadline: Date;
  dependencies: string[]; // task IDs
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  status: TaskStatus;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  completedAt?: Date;
  pointsEarned?: number;
  createdAt: Date;
}

export interface PointsRecord {
  id: string;
  taskId: string;
  points: number;
  reason: 'on-time' | 'late' | 'missed' | 'out-of-sequence' | 'bonus';
  timestamp: Date;
}

export interface DailySchedule {
  date: Date;
  timeBlocks: TimeBlock[];
}

export interface TimeBlock {
  id: string;
  taskId: string;
  startTime: Date;
  endTime: Date;
  isConflict: boolean;
}

export interface UserStats {
  totalPoints: number;
  tasksCompleted: number;
  tasksMissed: number;
  currentStreak: number;
  bestStreak: number;
  categoryBreakdown: {
    academic: { completed: number; total: number };
    professional: { completed: number; total: number };
    personal: { completed: number; total: number };
  };
}
