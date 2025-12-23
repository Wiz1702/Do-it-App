import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task, TaskCategory } from '@/types/task';
import { format } from 'date-fns';

interface TimelineViewProps {
  tasks: Task[];
  onCompleteTask: (id: string) => void;
}

const categoryColors: Record<TaskCategory, string> = {
  academic: 'bg-chart-academic',
  professional: 'bg-chart-professional',
  personal: 'bg-chart-personal',
};

const categoryBorders: Record<TaskCategory, string> = {
  academic: 'border-l-chart-academic',
  professional: 'border-l-chart-professional',
  personal: 'border-l-chart-personal',
};

export function TimelineView({ tasks, onCompleteTask }: TimelineViewProps) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  const getTasksForHour = (hour: number) => {
    return tasks.filter(task => {
      if (!task.scheduledStart) return false;
      return task.scheduledStart.getHours() === hour;
    });
  };

  return (
    <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Today's Timeline
          </CardTitle>
          <Badge variant="secondary">{format(new Date(), 'EEEE, MMM d')}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {hours.map((hour, index) => {
            const hourTasks = getTasksForHour(hour);
            const isCurrentHour = new Date().getHours() === hour;
            
            return (
              <div
                key={hour}
                className={`relative flex items-stretch min-h-[60px] ${
                  index < hours.length - 1 ? 'border-b border-border/50' : ''
                }`}
              >
                {/* Time label */}
                <div className={`w-16 shrink-0 py-2 text-xs font-medium ${
                  isCurrentHour ? 'text-accent' : 'text-muted-foreground'
                }`}>
                  {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
                </div>

                {/* Current time indicator */}
                {isCurrentHour && (
                  <div className="absolute left-16 top-1/2 w-full h-0.5 bg-accent/50 -translate-y-1/2 z-10">
                    <div className="absolute left-0 -top-1 w-2 h-2 rounded-full bg-accent" />
                  </div>
                )}

                {/* Tasks */}
                <div className="flex-1 py-1 pl-2 space-y-1">
                  {hourTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => task.status !== 'completed' && onCompleteTask(task.id)}
                      className={`w-full text-left p-2 rounded-lg border-l-4 ${categoryBorders[task.category]} 
                        bg-card hover:bg-secondary/50 transition-colors duration-200
                        ${task.status === 'completed' ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}>
                          {task.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {task.estimatedTime}m
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
          {Object.entries(categoryColors).map(([category, color]) => (
            <div key={category} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
              <span className="text-xs text-muted-foreground capitalize">{category}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
