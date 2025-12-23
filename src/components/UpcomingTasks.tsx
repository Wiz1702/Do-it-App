import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskCard } from './TaskCard';
import { Task } from '@/types/task';

interface UpcomingTasksProps {
  tasks: Task[];
  onCompleteTask: (id: string) => void;
}

export function UpcomingTasks({ tasks, onCompleteTask }: UpcomingTasksProps) {
  return (
    <Card className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
          <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No upcoming tasks!</p>
            <p className="text-xs mt-1">Add a new task to get started</p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onComplete={onCompleteTask}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
