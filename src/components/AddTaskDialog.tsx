import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Task, TaskCategory } from '@/types/task';

interface AddTaskDialogProps {
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
}

export function AddTaskDialog({ onAddTask }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [difficulty, setDifficulty] = useState([5]);
  const [importance, setImportance] = useState([5]);
  const [deadline, setDeadline] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const deadlineDate = new Date(deadline);
    const scheduledStart = new Date(deadlineDate);
    scheduledStart.setHours(scheduledStart.getHours() - Math.ceil(estimatedTime / 60));
    
    onAddTask({
      title,
      description,
      category,
      estimatedTime,
      difficulty: difficulty[0],
      importance: importance[0],
      deadline: deadlineDate,
      dependencies: [],
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : undefined,
      scheduledStart,
      scheduledEnd: deadlineDate,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('personal');
    setEstimatedTime(30);
    setDifficulty([5]);
    setImportance([5]);
    setDeadline('');
    setIsRecurring(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent" size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your productivity timeline. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Complete project report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details about this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">📚 Academic</SelectItem>
                  <SelectItem value="professional">💼 Professional</SelectItem>
                  <SelectItem value="personal">❤️ Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Est. Time (minutes) *</Label>
              <Input
                id="time"
                type="number"
                min={5}
                max={480}
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline *</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Difficulty Level</Label>
              <span className="text-sm font-medium text-accent">{difficulty[0]}/10</span>
            </div>
            <Slider
              value={difficulty}
              onValueChange={setDifficulty}
              min={1}
              max={10}
              step={1}
              className="[&>span:first-child]:bg-secondary [&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent [&>span:first-child>span]:bg-accent"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Importance Level</Label>
              <span className="text-sm font-medium text-accent">{importance[0]}/10</span>
            </div>
            <Slider
              value={importance}
              onValueChange={setImportance}
              min={1}
              max={10}
              step={1}
              className="[&>span:first-child]:bg-secondary [&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent [&>span:first-child>span]:bg-accent"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <Label htmlFor="recurring" className="font-medium">Recurring Task</Label>
              <p className="text-xs text-muted-foreground mt-0.5">This task repeats regularly</p>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {isRecurring && (
            <div className="space-y-2 animate-scale-in">
              <Label>Repeat Pattern</Label>
              <Select value={recurringPattern} onValueChange={(v) => setRecurringPattern(v as typeof recurringPattern)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="accent" className="flex-1">
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
