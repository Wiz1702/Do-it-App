import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { UserStats } from '@/types/task';

interface CompletionRatesChartProps {
  stats: UserStats;
}

export function CompletionRatesChart({ stats }: CompletionRatesChartProps) {
  const { categoryBreakdown } = stats;

  const categoryData = [
    {
      name: 'Academic',
      completed: categoryBreakdown.academic.completed,
      total: categoryBreakdown.academic.total,
      color: 'hsl(var(--category-academic))',
    },
    {
      name: 'Professional',
      completed: categoryBreakdown.professional.completed,
      total: categoryBreakdown.professional.total,
      color: 'hsl(var(--category-professional))',
    },
    {
      name: 'Personal',
      completed: categoryBreakdown.personal.completed,
      total: categoryBreakdown.personal.total,
      color: 'hsl(var(--category-personal))',
    },
  ];

  const pieData = categoryData.map(cat => ({
    name: cat.name,
    value: cat.completed,
    color: cat.color,
  }));

  const totalCompleted = categoryData.reduce((sum, cat) => sum + cat.completed, 0);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Completion by Category</CardTitle>
        <CardDescription>Breakdown of completed tasks across categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          {totalCompleted > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No completed tasks yet
            </div>
          )}
        </div>
        
        {/* Category Progress Bars */}
        <div className="space-y-4 mt-4">
          {categoryData.map((cat) => {
            const rate = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
            return (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">
                    {cat.completed}/{cat.total} ({rate}%)
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${rate}%`,
                      backgroundColor: cat.color,
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
