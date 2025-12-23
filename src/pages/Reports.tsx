import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Header } from '@/components/Header';
import { CompletionRatesChart } from '@/components/reports/CompletionRatesChart';
import { PointsTrendChart } from '@/components/reports/PointsTrendChart';
import { TimeInsightsCard } from '@/components/reports/TimeInsightsCard';
import { MonthlyOverview } from '@/components/reports/MonthlyOverview';
import { ImprovementTips } from '@/components/reports/ImprovementTips';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Reports = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { tasks, stats, pointsHistory, loading: tasksLoading } = useTaskStore();

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

  return (
    <div className="min-h-screen bg-background">
      <Header stats={stats} onSignOut={signOut} />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Monthly Progress Report
            </h2>
            <p className="text-muted-foreground mt-1">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <MonthlyOverview stats={stats} tasks={tasks} />

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <CompletionRatesChart stats={stats} />
          <PointsTrendChart pointsHistory={pointsHistory} tasks={tasks} />
        </div>

        {/* Insights & Tips */}
        <div className="grid lg:grid-cols-2 gap-6">
          <TimeInsightsCard tasks={tasks} />
          <ImprovementTips stats={stats} tasks={tasks} />
        </div>
      </main>
    </div>
  );
};

export default Reports;
