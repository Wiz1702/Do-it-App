import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface NotificationSettings {
  enabled: boolean;
  reminderMinutes: number; // minutes before deadline
}

const STORAGE_KEY = 'doitapp_notification_settings';
const NOTIFIED_TASKS_KEY = 'doitapp_notified_tasks';

const defaultSettings: NotificationSettings = {
  enabled: false,
  reminderMinutes: 30,
};

export function useNotifications(tasks: Task[]) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse notification settings:', e);
      }
    }

    const notified = localStorage.getItem(NOTIFIED_TASKS_KEY);
    if (notified) {
      try {
        setNotifiedTasks(new Set(JSON.parse(notified)));
      } catch (e) {
        console.error('Failed to parse notified tasks:', e);
      }
    }

    // Check current permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Save notified tasks
  const markTaskNotified = useCallback((taskId: string) => {
    setNotifiedTasks(prev => {
      const updated = new Set(prev);
      updated.add(taskId);
      localStorage.setItem(NOTIFIED_TASKS_KEY, JSON.stringify([...updated]));
      return updated;
    });
  }, []);

  // Clear old notified tasks (completed or past deadline)
  useEffect(() => {
    const taskIds = new Set(tasks.map(t => t.id));
    const outdated = [...notifiedTasks].filter(id => {
      const task = tasks.find(t => t.id === id);
      return !task || task.status === 'completed' || new Date(task.deadline) < new Date();
    });

    if (outdated.length > 0) {
      setNotifiedTasks(prev => {
        const updated = new Set([...prev].filter(id => !outdated.includes(id)));
        localStorage.setItem(NOTIFIED_TASKS_KEY, JSON.stringify([...updated]));
        return updated;
      });
    }
  }, [tasks, notifiedTasks]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        updateSettings({ enabled: true });
      }
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [updateSettings]);

  // Send a notification
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted' || !settings.enabled) return;

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [permission, settings.enabled]);

  // Check for upcoming deadlines
  useEffect(() => {
    if (!settings.enabled || permission !== 'granted') return;

    const checkDeadlines = () => {
      const now = new Date();
      const reminderThreshold = settings.reminderMinutes * 60 * 1000;

      tasks.forEach(task => {
        if (task.status === 'completed' || notifiedTasks.has(task.id)) return;

        const deadline = new Date(task.deadline);
        const timeUntilDeadline = deadline.getTime() - now.getTime();

        // Check if within reminder window but not past deadline
        if (timeUntilDeadline > 0 && timeUntilDeadline <= reminderThreshold) {
          const minutes = Math.round(timeUntilDeadline / 60000);
          sendNotification(`⏰ Task Due Soon: ${task.title}`, {
            body: minutes > 0 
              ? `Due in ${minutes} minute${minutes !== 1 ? 's' : ''}`
              : 'Due now!',
            tag: `task-${task.id}`,
            requireInteraction: true,
          });
          markTaskNotified(task.id);
        }
      });
    };

    // Check immediately and then every minute
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60000);

    return () => clearInterval(interval);
  }, [tasks, settings, permission, notifiedTasks, sendNotification, markTaskNotified]);

  return {
    permission,
    settings,
    updateSettings,
    requestPermission,
    sendNotification,
    isSupported: 'Notification' in window,
  };
}
