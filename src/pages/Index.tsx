import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { PointsCard } from '@/components/PointsCard';
import { QuickStats } from '@/components/QuickStats';
import { TimelineView } from '@/components/TimelineView';
import { CategoryProgress } from '@/components/CategoryProgress';
import { UpcomingTasks } from '@/components/UpcomingTasks';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { toast } from 'sonner';
import { Task } from '@/types/task';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { 
    tasks, 
    stats, 
    loading: tasksLoading,
    addTask, 
    completeTask, 
    getTodaysTasks, 
    getUpcomingTasks 
  } = useTaskStore();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const todaysTasks = getTodaysTasks();
  const upcomingTasks = getUpcomingTasks();

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask = await addTask(taskData);
    if (newTask) {
      toast.success('Task created!', {
        description: `"${newTask.title}" has been added to your schedule.`,
      });
    }
  };

  const handleCompleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const result = await completeTask(id);
    if (!result) return;
    
    const { isOnTime, points } = result;

    toast.success(isOnTime ? '🎉 Task completed!' : 'Task completed (late)', {
      description: isOnTime 
        ? `You earned +${points} points! Keep up the great work!`
        : `${points} points. Try to complete tasks on time for bonus points!`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header stats={stats} onSignOut={signOut} />
      
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
