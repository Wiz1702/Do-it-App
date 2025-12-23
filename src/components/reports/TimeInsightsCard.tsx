import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Task } from '@/types/task';
import { Clock, Zap, Target } from 'lucide-react';

interface TimeInsightsCardProps {
  tasks: Task[];
}

export function TimeInsightsCard({ tasks }: TimeInsightsCardProps) {
  // Calculate time distribution by hour of day for completed tasks
  const hourlyDistribution = new Array(24).fill(0);
  
  tasks.forEach(task => {
    if (task.completedAt) {
      const hour = new Date(task.completedAt).getHours();
      hourlyDistribution[hour]++;
    }
  });

  // Find peak productivity hours (9 AM - 9 PM range)
  const workingHours = hourlyDistribution.slice(6, 22);
  const maxTasks = Math.max(...workingHours);
  const peakHour = workingHours.indexOf(maxTasks) + 6;

  // Format hour for display
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  // Create chart data for working hours only
  const chartData = [];
  for (let hour = 6; hour < 22; hour++) {
    chartData.push({
      hour: formatHour(hour),
      tasks: hourlyDistribution[hour],
    });
  }

  // Calculate average task duration
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const avgDuration = completedTasks.length > 0
    ? Math.round(completedTasks.reduce((sum, t) => sum + t.estimatedTime, 0) / completedTasks.length)
    : 0;

  // Calculate category time breakdown
  const categoryTime = {
    academic: tasks.filter(t => t.category === 'academic' && t.status === 'completed')
      .reduce((sum, t) => sum + t.estimatedTime, 0),
    professional: tasks.filter(t => t.category === 'professional' && t.status === 'completed')
      .reduce((sum, t) => sum + t.estimatedTime, 0),
    personal: tasks.filter(t => t.category === 'personal' && t.status === 'completed')
      .reduce((sum, t) => sum + t.estimatedTime, 0),
  };

  const totalTime = categoryTime.academic + categoryTime.professional + categoryTime.personal;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Time Management Insights</CardTitle>
        <CardDescription>When you're most productive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Productivity by Hour Chart */}
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                interval={2}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar 
                dataKey="tasks" 
                name="Tasks Completed"
                fill="hsl(var(--category-professional))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
            <Zap className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">{formatHour(peakHour)}</p>
              <p className="text-xs text-muted-foreground">Peak Hour</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-category-professional/5 border border-category-professional/20">
            <Clock className="h-5 w-5 text-category-professional mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">{avgDuration}min</p>
              <p className="text-xs text-muted-foreground">Avg Duration</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
            <Target className="h-5 w-5 text-success mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">{Math.round(totalTime / 60)}h</p>
              <p className="text-xs text-muted-foreground">Total Time</p>
            </div>
          </div>
        </div>

        {/* Time by Category */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Time by Category</p>
          {Object.entries(categoryTime).map(([category, time]) => {
            const percentage = totalTime > 0 ? Math.round((time / totalTime) * 100) : 0;
            const colorVar = `hsl(var(--category-${category}))`;
            return (
              <div key={category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize text-muted-foreground">{category}</span>
                  <span className="text-foreground">{Math.round(time / 60)}h ({percentage}%)</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: colorVar,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
