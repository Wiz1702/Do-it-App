import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  tasksCompleted: number;
  currentStreak: number;
}

export function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('user_id, total_points, tasks_completed, current_streak')
        .order('total_points', { ascending: false })
        .limit(10);

      if (statsError) throw statsError;

      if (!stats || stats.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const userIds = stats.map(s => s.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(
        profiles?.map(p => [p.id, { displayName: p.display_name, avatarUrl: p.avatar_url }]) || []
      );

      const leaderboardEntries: LeaderboardEntry[] = stats.map(stat => ({
        userId: stat.user_id,
        displayName: profileMap.get(stat.user_id)?.displayName || 'Anonymous User',
        avatarUrl: profileMap.get(stat.user_id)?.avatarUrl || null,
        totalPoints: stat.total_points,
        tasksCompleted: stat.tasks_completed,
        currentStreak: stat.current_streak,
      }));

      setEntries(leaderboardEntries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to realtime updates on user_stats
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
        },
        () => {
          // Refetch leaderboard when any user_stats change
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-medium w-5 text-center">{rank}</span>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No users yet. Be the first to earn points!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const isCurrentUser = entry.userId === user?.id;

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isCurrentUser
                  ? 'bg-primary/10 border border-primary/20'
                  : 'bg-muted/50 hover:bg-muted'
              } ${rank <= 3 ? 'border-l-4' : ''} ${
                rank === 1 ? 'border-l-yellow-500' : ''
              } ${rank === 2 ? 'border-l-gray-400' : ''} ${
                rank === 3 ? 'border-l-amber-600' : ''
              }`}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(rank)}
              </div>

              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {getInitials(entry.displayName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {entry.displayName}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-primary">(You)</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {entry.tasksCompleted} tasks · {entry.currentStreak} day streak
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-primary">{entry.totalPoints.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
