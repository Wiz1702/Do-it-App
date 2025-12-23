import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PointsRecord, Task } from '@/types/task';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

interface PointsTrendChartProps {
  pointsHistory: PointsRecord[];
  tasks: Task[];
}

export function PointsTrendChart({ pointsHistory, tasks }: PointsTrendChartProps) {
  // Generate last 14 days of data
  const today = new Date();
  const twoWeeksAgo = subDays(today, 13);
  
  const days = eachDayOfInterval({ start: twoWeeksAgo, end: today });

  const chartData = days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Points earned that day
    const dayPoints = pointsHistory
      .filter(p => {
        const recordDate = new Date(p.timestamp);
        return recordDate >= dayStart && recordDate < dayEnd;
      })
      .reduce((sum, p) => sum + p.points, 0);

    // Tasks completed that day
    const tasksCompleted = tasks.filter(t => {
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate >= dayStart && completedDate < dayEnd;
    }).length;

    return {
      date: format(day, 'MMM d'),
      points: dayPoints,
      tasks: tasksCompleted,
    };
  });

  // Calculate cumulative points
  let cumulative = 0;
  const cumulativeData = chartData.map(d => {
    cumulative += d.points;
    return { ...d, cumulative };
  });

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Points Trend</CardTitle>
        <CardDescription>Your points earned over the last 2 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="points"
                name="Daily Points"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fill="url(#pointsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">
              {chartData.reduce((sum, d) => sum + d.points, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Points Earned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">
              {chartData.reduce((sum, d) => sum + d.tasks, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Tasks Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-category-professional">
              {Math.round(chartData.reduce((sum, d) => sum + d.points, 0) / 14)}
            </p>
            <p className="text-xs text-muted-foreground">Avg Daily Points</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
