import { Trophy, TrendingUp, Target, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserStats } from '@/types/task';

interface PointsCardProps {
  stats: UserStats;
}

export function PointsCard({ stats }: PointsCardProps) {
  const completionRate = Math.round(
    (stats.tasksCompleted / (stats.tasksCompleted + stats.tasksMissed)) * 100
  );

  return (
    <Card className="overflow-hidden border-0 shadow-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="gradient-gold p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-accent-foreground/80 text-sm font-medium">Total Points</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold text-accent-foreground">
                {stats.totalPoints.toLocaleString()}
              </span>
              <Trophy className="h-6 w-6 text-accent-foreground/80 animate-float" />
            </div>
          </div>
          <div className="h-16 w-16 rounded-full bg-accent-foreground/10 flex items-center justify-center animate-pulse-glow">
            <TrendingUp className="h-8 w-8 text-accent-foreground" />
          </div>
        </div>
      </div>
      
      <CardContent className="p-6 bg-card">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.tasksCompleted}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          
          <div className="text-center border-x border-border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="h-4 w-4 text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-chart-professional" />
            </div>
            <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
