import { Clock, Calendar, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task, TaskCategory } from '@/types/task';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
}

const categoryConfig: Record<TaskCategory, { label: string; variant: 'academic' | 'professional' | 'personal' }> = {
  academic: { label: 'Academic', variant: 'academic' },
  professional: { label: 'Professional', variant: 'professional' },
  personal: { label: 'Personal', variant: 'personal' },
};

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const { label, variant } = categoryConfig[task.category];
  const isCompleted = task.status === 'completed';
  const isOverdue = !isCompleted && new Date() > task.deadline;
  
  const priorityScore = Math.round((task.importance * 0.4 + (10 - task.difficulty) * 0.3 + 5) * 10);

  return (
    <Card 
      className={`group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
        isCompleted ? 'opacity-60' : ''
      } ${isOverdue ? 'border-danger/50' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 shrink-0 mt-0.5 ${isCompleted ? 'text-success' : 'text-muted-foreground hover:text-success'}`}
            onClick={() => !isCompleted && onComplete(task.id)}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-semibold text-foreground ${isCompleted ? 'line-through' : ''}`}>
                {task.title}
              </h3>
              <Badge variant={variant}>{label}</Badge>
              {isOverdue && (
                <Badge variant="danger" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{task.estimatedTime} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(task.deadline, 'MMM d, h:mm a')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-accent font-medium">+{priorityScore} pts</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="text-xs text-muted-foreground">Priority</div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    i < Math.ceil(task.importance / 2)
                      ? 'bg-accent'
                      : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
