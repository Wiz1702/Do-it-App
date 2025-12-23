import { Trophy, Flame, LogOut, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserStats } from '@/types/task';
import { Link } from 'react-router-dom';
import { NotificationSettings } from './NotificationSettings';

interface HeaderProps {
  stats: UserStats;
  onSignOut?: () => void;
  notificationProps?: {
    permission: NotificationPermission;
    settings: { enabled: boolean; reminderMinutes: number };
    onUpdateSettings: (settings: Partial<{ enabled: boolean; reminderMinutes: number }>) => void;
    onRequestPermission: () => Promise<boolean>;
    isSupported: boolean;
    upcomingCount: number;
  };
}

export function Header({ stats, onSignOut, notificationProps }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-gold shadow-md">
              <Trophy className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Do-it</h1>
              <p className="text-xs text-muted-foreground">Your productivity companion</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {/* Points Display */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
              <Trophy className="h-4 w-4 text-accent" />
              <span className="font-bold text-accent">{stats.totalPoints.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">pts</span>
            </div>
            
            <div className="flex items-center gap-2 rounded-full bg-warning/10 px-4 py-2">
              <Flame className="h-4 w-4 text-warning" />
              <span className="font-bold text-warning">{stats.currentStreak}</span>
              <span className="text-xs text-muted-foreground">day streak</span>
            </div>
          </div>

          {/* Actions */}
          <Button variant="ghost" size="icon" asChild title="View Reports">
            <Link to="/reports">
              <BarChart3 className="h-5 w-5" />
            </Link>
          </Button>

          {notificationProps && (
            <NotificationSettings
              permission={notificationProps.permission}
              settings={notificationProps.settings}
              onUpdateSettings={notificationProps.onUpdateSettings}
              onRequestPermission={notificationProps.onRequestPermission}
              isSupported={notificationProps.isSupported}
              upcomingCount={notificationProps.upcomingCount}
            />
          )}

          {onSignOut && (
            <Button variant="ghost" size="icon" onClick={onSignOut} title="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
