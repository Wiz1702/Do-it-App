import { CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Task } from '@/types/task';

interface QuickStatsProps {
  tasks: Task[];
}

export function QuickStats({ tasks }: QuickStatsProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTasks = tasks.filter(task => {
    const scheduled = task.scheduledStart;
    return scheduled && scheduled >= today && scheduled < tomorrow;
  });

  const completedToday = todayTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length;
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date() > t.deadline).length;
  
  const upcomingDeadlines = tasks.filter(t => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return t.status !== 'completed' && t.deadline <= threeDaysFromNow && t.deadline > new Date();
  }).length;

  const stats = [
    {
      label: 'Completed Today',
      value: `${completedToday}/${todayTasks.length}`,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      icon: Clock,
      color: 'text-chart-professional',
      bgColor: 'bg-chart-professional/10',
    },
    {
      label: 'Overdue',
      value: overdueTasks,
      icon: AlertTriangle,
      color: 'text-danger',
      bgColor: 'bg-danger/10',
    },
    {
      label: 'Due Soon',
      value: upcomingDeadlines,
      icon: Calendar,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <Card 
          key={stat.label} 
          className="animate-slide-up" 
          style={{ animationDelay: `${0.05 * index}s` }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
