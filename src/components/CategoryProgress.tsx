import { BookOpen, Briefcase, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserStats, TaskCategory } from '@/types/task';

interface CategoryProgressProps {
  stats: UserStats;
}

const categoryConfig: Record<TaskCategory, { 
  icon: React.ReactNode; 
  label: string; 
  colorClass: string;
  progressClass: string;
}> = {
  academic: { 
    icon: <BookOpen className="h-4 w-4" />, 
    label: 'Academic',
    colorClass: 'text-chart-academic',
    progressClass: '[&>div]:bg-chart-academic',
  },
  professional: { 
    icon: <Briefcase className="h-4 w-4" />, 
    label: 'Professional',
    colorClass: 'text-chart-professional',
    progressClass: '[&>div]:bg-chart-professional',
  },
  personal: { 
    icon: <Heart className="h-4 w-4" />, 
    label: 'Personal',
    colorClass: 'text-chart-personal',
    progressClass: '[&>div]:bg-chart-personal',
  },
};

export function CategoryProgress({ stats }: CategoryProgressProps) {
  return (
    <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Category Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.entries(stats.categoryBreakdown) as [TaskCategory, { completed: number; total: number }][]).map(
          ([category, data]) => {
            const config = categoryConfig[category];
            const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
            
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${config.colorClass}`}>
                    {config.icon}
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {data.completed}/{data.total}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className={`h-2 ${config.progressClass}`}
                />
              </div>
            );
          }
        )}
      </CardContent>
    </Card>
  );
}
