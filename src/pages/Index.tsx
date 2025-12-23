import { useTaskStore } from '@/hooks/useTaskStore';
import { Header } from '@/components/Header';
import { PointsCard } from '@/components/PointsCard';
import { QuickStats } from '@/components/QuickStats';
import { TimelineView } from '@/components/TimelineView';
import { CategoryProgress } from '@/components/CategoryProgress';
import { UpcomingTasks } from '@/components/UpcomingTasks';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { toast } from 'sonner';

const Index = () => {
  const { 
    tasks, 
    stats, 
    addTask, 
    completeTask, 
    getTodaysTasks, 
    getUpcomingTasks 
  } = useTaskStore();

  const todaysTasks = getTodaysTasks();
  const upcomingTasks = getUpcomingTasks();

  const handleAddTask = (taskData: Parameters<typeof addTask>[0]) => {
    const newTask = addTask(taskData);
    toast.success('Task created!', {
      description: `"${newTask.title}" has been added to your schedule.`,
    });
  };

  const handleCompleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    completeTask(id);
    
    const isOnTime = new Date() <= task.deadline;
    const points = isOnTime ? 
      Math.round((task.difficulty + task.importance) * 2) : 
      -3;

    toast.success(isOnTime ? '🎉 Task completed!' : 'Task completed (late)', {
      description: isOnTime 
        ? `You earned +${points} points! Keep up the great work!`
        : `${points} points. Try to complete tasks on time for bonus points!`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header stats={stats} />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome back! 👋
            </h2>
            <p className="text-muted-foreground mt-1">
              You have {todaysTasks.filter(t => t.status !== 'completed').length} tasks scheduled for today
            </p>
          </div>
          <AddTaskDialog onAddTask={handleAddTask} />
        </div>

        {/* Quick Stats */}
        <QuickStats tasks={tasks} />

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Points & Progress */}
          <div className="space-y-6">
            <PointsCard stats={stats} />
            <CategoryProgress stats={stats} />
          </div>

          {/* Center Column - Timeline */}
          <div className="lg:col-span-1">
            <TimelineView 
              tasks={todaysTasks} 
              onCompleteTask={handleCompleteTask}
            />
          </div>

          {/* Right Column - Upcoming Tasks */}
          <div>
            <UpcomingTasks 
              tasks={upcomingTasks} 
              onCompleteTask={handleCompleteTask}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
