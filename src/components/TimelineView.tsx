import { useState, useRef } from 'react';
import { Clock, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task, TaskCategory } from '@/types/task';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TimelineViewProps {
  tasks: Task[];
  onCompleteTask: (id: string) => void;
  onRescheduleTask?: (id: string, newStart: Date, newEnd: Date) => void;
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

export function TimelineView({ tasks, onCompleteTask, onRescheduleTask }: TimelineViewProps) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dropTargetHour, setDropTargetHour] = useState<number | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const getTasksForHour = (hour: number) => {
    return tasks.filter(task => {
      if (!task.scheduledStart) return false;
      return task.scheduledStart.getHours() === hour;
    });
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (task.status === 'completed') {
      e.preventDefault();
      return;
    }
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    
    // Add drag visual
    if (dragRef.current) {
      e.dataTransfer.setDragImage(dragRef.current, 0, 0);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDropTargetHour(null);
  };

  const handleDragOver = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetHour(hour);
  };

  const handleDragLeave = () => {
    setDropTargetHour(null);
  };

  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    setDropTargetHour(null);

    if (!draggedTask || !onRescheduleTask) {
      setDraggedTask(null);
      return;
    }

    // Don't do anything if dropped on same hour
    if (draggedTask.scheduledStart?.getHours() === hour) {
      setDraggedTask(null);
      return;
    }

    // Calculate new start and end times
    const today = new Date();
    const newStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, 0, 0);
    const duration = draggedTask.estimatedTime; // in minutes
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

    onRescheduleTask(draggedTask.id, newStart, newEnd);
    
    toast.success('Task rescheduled!', {
      description: `"${draggedTask.title}" moved to ${format(newStart, 'h:mm a')}`,
    });

    setDraggedTask(null);
  };

  return (
    <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Today's Timeline
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <GripVertical className="h-3 w-3 mr-1" />
              Drag to reschedule
            </Badge>
            <Badge variant="secondary">{format(new Date(), 'EEEE, MMM d')}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {hours.map((hour, index) => {
            const hourTasks = getTasksForHour(hour);
            const isCurrentHour = new Date().getHours() === hour;
            const isDropTarget = dropTargetHour === hour;
            
            return (
              <div
                key={hour}
                className={`relative flex items-stretch min-h-[60px] transition-colors duration-200 ${
                  index < hours.length - 1 ? 'border-b border-border/50' : ''
                } ${isDropTarget ? 'bg-accent/10' : ''}`}
                onDragOver={(e) => handleDragOver(e, hour)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, hour)}
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

                {/* Drop zone indicator */}
                {isDropTarget && hourTasks.length === 0 && (
                  <div className="absolute inset-0 left-16 border-2 border-dashed border-accent/50 rounded-lg pointer-events-none flex items-center justify-center">
                    <span className="text-xs text-accent">Drop here</span>
                  </div>
                )}

                {/* Tasks */}
                <div className="flex-1 py-1 pl-2 space-y-1">
                  {hourTasks.map(task => (
                    <div
                      key={task.id}
                      draggable={task.status !== 'completed'}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={`group w-full text-left p-2 rounded-lg border-l-4 ${categoryBorders[task.category]} 
                        bg-card hover:bg-secondary/50 transition-all duration-200
                        ${task.status === 'completed' ? 'opacity-50 cursor-default' : 'cursor-grab active:cursor-grabbing'}
                        ${draggedTask?.id === task.id ? 'opacity-50 scale-95' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Drag handle */}
                        {task.status !== 'completed' && (
                          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        )}
                        
                        <button
                          onClick={() => task.status !== 'completed' && onCompleteTask(task.id)}
                          className="flex-1 text-left"
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
                      </div>
                    </div>
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

      {/* Hidden drag image */}
      <div ref={dragRef} className="absolute -left-[9999px]">
        {draggedTask && (
          <div className={`p-2 rounded-lg border-l-4 ${categoryBorders[draggedTask.category]} bg-card shadow-lg`}>
            <span className="text-sm font-medium">{draggedTask.title}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
