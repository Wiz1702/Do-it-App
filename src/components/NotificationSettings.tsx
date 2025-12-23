import { Bell, BellOff, BellRing, Clock, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types/task';

interface NotificationSettingsProps {
  permission: NotificationPermission;
  settings: {
    enabled: boolean;
    reminderMinutes: number;
  };
  onUpdateSettings: (settings: Partial<{ enabled: boolean; reminderMinutes: number }>) => void;
  onRequestPermission: () => Promise<boolean>;
  isSupported: boolean;
  upcomingCount: number;
}

const reminderOptions = [
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
];

export function NotificationSettings({
  permission,
  settings,
  onUpdateSettings,
  onRequestPermission,
  isSupported,
  upcomingCount,
}: NotificationSettingsProps) {
  const handleEnableNotifications = async () => {
    if (permission !== 'granted') {
      const granted = await onRequestPermission();
      if (!granted) return;
    }
    onUpdateSettings({ enabled: !settings.enabled });
  };

  const getIcon = () => {
    if (!settings.enabled || permission !== 'granted') {
      return <BellOff className="h-5 w-5" />;
    }
    if (upcomingCount > 0) {
      return <BellRing className="h-5 w-5" />;
    }
    return <Bell className="h-5 w-5" />;
  };

  if (!isSupported) {
    return (
      <Button variant="ghost" size="icon" disabled title="Notifications not supported">
        <BellOff className="h-5 w-5 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {getIcon()}
          {upcomingCount > 0 && settings.enabled && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-warning text-[10px] font-bold text-warning-foreground flex items-center justify-center">
              {upcomingCount > 9 ? '9+' : upcomingCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Notifications</h4>
            {settings.enabled && permission === 'granted' && (
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" />
                Active
              </Badge>
            )}
          </div>

          {permission === 'denied' && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-sm text-danger">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="font-medium">
                Enable Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Get reminded before task deadlines
              </p>
            </div>
            <Switch
              id="notifications"
              checked={settings.enabled && permission === 'granted'}
              onCheckedChange={handleEnableNotifications}
              disabled={permission === 'denied'}
            />
          </div>

          {settings.enabled && permission === 'granted' && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Remind me before deadline</Label>
              </div>
              <Select
                value={settings.reminderMinutes.toString()}
                onValueChange={(value) => onUpdateSettings({ reminderMinutes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {upcomingCount > 0 && settings.enabled && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-warning">{upcomingCount}</span> task{upcomingCount !== 1 ? 's' : ''} due within your reminder window
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
