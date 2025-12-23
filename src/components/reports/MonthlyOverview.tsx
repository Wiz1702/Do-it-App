import { Card, CardContent } from '@/components/ui/card';
import { Trophy, CheckCircle2, XCircle, Flame, TrendingUp, Clock } from 'lucide-react';
import { UserStats, Task } from '@/types/task';

interface MonthlyOverviewProps {
  stats: UserStats;
  tasks: Task[];
}

export function MonthlyOverview({ stats, tasks }: MonthlyOverviewProps) {
  const completedThisMonth = tasks.filter(t => {
    if (!t.completedAt) return false;
    const now = new Date();
    const completedDate = new Date(t.completedAt);
    return completedDate.getMonth() === now.getMonth() && 
           completedDate.getFullYear() === now.getFullYear();
  }).length;

  const totalTimeSpent = tasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.estimatedTime, 0);

  const completionRate = stats.tasksCompleted + stats.tasksMissed > 0
    ? Math.round((stats.tasksCompleted / (stats.tasksCompleted + stats.tasksMissed)) * 100)
    : 0;

  const cards = [
    {
      title: 'Total Points',
      value: stats.totalPoints.toLocaleString(),
      icon: Trophy,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Tasks Completed',
      value: completedThisMonth.toString(),
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: 'text-category-academic',
      bgColor: 'bg-category-academic/10',
    },
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: Flame,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Time Invested',
      value: `${Math.round(totalTimeSpent / 60)}h`,
      icon: Clock,
      color: 'text-category-professional',
      bgColor: 'bg-category-professional/10',
    },
    {
      title: 'Tasks Missed',
      value: stats.tasksMissed.toString(),
      icon: XCircle,
      color: 'text-danger',
      bgColor: 'bg-danger/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/50">
          <CardContent className="p-4">
            <div className={`${card.bgColor} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
