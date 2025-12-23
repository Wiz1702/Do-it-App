import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserStats, Task } from '@/types/task';
import { Lightbulb, TrendingUp, AlertTriangle, Target, Flame, Clock } from 'lucide-react';

interface ImprovementTipsProps {
  stats: UserStats;
  tasks: Task[];
}

interface Tip {
  icon: React.ElementType;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info';
}

export function ImprovementTips({ stats, tasks }: ImprovementTipsProps) {
  const tips: Tip[] = [];

  // Analyze streak
  if (stats.currentStreak >= 7) {
    tips.push({
      icon: Flame,
      title: 'Amazing streak!',
      description: `You're on a ${stats.currentStreak}-day streak. Keep pushing to beat your best of ${stats.bestStreak} days!`,
      type: 'success',
    });
  } else if (stats.currentStreak === 0 && stats.bestStreak > 0) {
    tips.push({
      icon: Flame,
      title: 'Restart your streak',
      description: `Your best streak was ${stats.bestStreak} days. Complete a task today to start building momentum again!`,
      type: 'warning',
    });
  }

  // Analyze completion rate
  const total = stats.tasksCompleted + stats.tasksMissed;
  const completionRate = total > 0 ? (stats.tasksCompleted / total) * 100 : 0;
  
  if (completionRate >= 90) {
    tips.push({
      icon: Target,
      title: 'Excellent completion rate!',
      description: `You complete ${Math.round(completionRate)}% of your tasks. You're a productivity champion!`,
      type: 'success',
    });
  } else if (completionRate < 70 && total > 5) {
    tips.push({
      icon: AlertTriangle,
      title: 'Improve task completion',
      description: 'Try breaking down large tasks into smaller, manageable pieces to improve your completion rate.',
      type: 'warning',
    });
  }

  // Analyze category balance
  const { categoryBreakdown } = stats;
  const categories = ['academic', 'professional', 'personal'] as const;
  const totals = categories.map(c => categoryBreakdown[c].total);
  const maxCategory = categories[totals.indexOf(Math.max(...totals))];
  const minCategory = categories[totals.indexOf(Math.min(...totals))];
  
  if (Math.max(...totals) > Math.min(...totals) * 3 && Math.min(...totals) > 0) {
    tips.push({
      icon: TrendingUp,
      title: 'Balance your categories',
      description: `You have many ${maxCategory} tasks. Consider adding more ${minCategory} tasks for a balanced life.`,
      type: 'info',
    });
  }

  // Analyze overdue tasks
  const overdueTasks = tasks.filter(t => 
    t.status !== 'completed' && new Date(t.deadline) < new Date()
  );
  
  if (overdueTasks.length > 0) {
    tips.push({
      icon: Clock,
      title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
      description: 'Clear your backlog to prevent point deductions and maintain momentum.',
      type: 'warning',
    });
  }

  // Add general tip if no specific insights
  if (tips.length === 0) {
    tips.push({
      icon: Lightbulb,
      title: 'Get started!',
      description: 'Add some tasks to get personalized productivity insights and recommendations.',
      type: 'info',
    });
  }

  // Points optimization tip
  if (stats.totalPoints > 0 && stats.tasksCompleted > 0) {
    const avgPoints = Math.round(stats.totalPoints / stats.tasksCompleted);
    tips.push({
      icon: TrendingUp,
      title: 'Points optimization',
      description: `You earn an average of ${avgPoints} points per task. Focus on high-importance tasks to maximize your score!`,
      type: 'info',
    });
  }

  const getTypeStyles = (type: Tip['type']) => {
    switch (type) {
      case 'success':
        return 'bg-success/5 border-success/20 text-success';
      case 'warning':
        return 'bg-warning/5 border-warning/20 text-warning';
      case 'info':
        return 'bg-accent/5 border-accent/20 text-accent';
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Improvement Tips</CardTitle>
        <CardDescription>Personalized recommendations for better productivity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tips.slice(0, 4).map((tip, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-4 rounded-lg border ${getTypeStyles(tip.type)}`}
            >
              <div className={`p-2 rounded-lg bg-current/10`}>
                <tip.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{tip.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
