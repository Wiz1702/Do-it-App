import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Brain, LayoutList, Send, Sparkles, TimerReset, WifiOff } from 'lucide-react';
import { Task, UserStats } from '@/types/task';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTaskStore } from '@/hooks/useTaskStore';

type CoachMessage = {
  id: string;
  role: 'coach' | 'user';
  content: string;
};

type CoachContext = {
  dueToday: Task[];
  overdue: Task[];
  upcoming: Task[];
  activeTasks: Task[];
  topFocus: Task[];
  streak: number;
  completed: number;
};

const quickPrompts = [
  { label: 'Plan my day', prompt: 'How should I prioritize today?' },
  { label: 'Catch me up', prompt: 'I feel behind. What should I do first?' },
  { label: 'Better habits', prompt: 'Give me 3 tips to stay productive this week.' },
];

async function generateOpenAIReply(prompt: string, ctx: CoachContext, apiKey?: string) {
  if (!apiKey) {
    throw new Error('OpenAI API key missing');
  }

  const tasksSummary = ctx.topFocus
    .map((task, index) => `${index + 1}) ${task.title} - due ${formatDistanceToNow(task.deadline, { addSuffix: true })} - importance ${task.importance}/10`)
    .join('\n');

  const systemPrompt = [
    'You are a concise productivity coach. Give direct, actionable guidance.',
    'Use the user prompt below plus context from their board.',
    `Top focus tasks:\n${tasksSummary || 'None yet.'}`,
    `Stats: streak ${ctx.streak} days, completed ${ctx.completed}, overdue ${ctx.overdue.length}, due today ${ctx.dueToday.length}, upcoming ${ctx.upcoming.length}.`,
    'Keep answers under 150 words. Use short lists and plain language.',
  ].join('\n\n');

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('OpenAI returned no content');
  }
  return text;
}

function buildContext(tasks: Task[], stats: UserStats): CoachContext {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  const activeTasks = tasks.filter(task => task.status !== 'completed');
  const dueToday = activeTasks.filter(task => task.deadline >= startOfToday && task.deadline <= endOfToday);
  const overdue = activeTasks.filter(task => task.deadline < now);

  const upcoming = activeTasks.filter(task => {
    const twoDaysOut = new Date(now);
    twoDaysOut.setDate(twoDaysOut.getDate() + 2);
    return task.deadline > now && task.deadline <= twoDaysOut;
  });

  // Small heuristic to highlight tasks that mix urgency and importance.
  const scored = [...activeTasks].sort((a, b) => {
    const hoursToDeadlineA = (a.deadline.getTime() - now.getTime()) / 3600000;
    const hoursToDeadlineB = (b.deadline.getTime() - now.getTime()) / 3600000;
    const urgencyA = hoursToDeadlineA <= 0 ? 48 : Math.max(0, 48 - hoursToDeadlineA);
    const urgencyB = hoursToDeadlineB <= 0 ? 48 : Math.max(0, 48 - hoursToDeadlineB);
    const scoreA = a.importance * 1.6 + a.difficulty * 0.6 + urgencyA;
    const scoreB = b.importance * 1.6 + b.difficulty * 0.6 + urgencyB;
    return scoreB - scoreA;
  });

  return {
    dueToday,
    overdue,
    upcoming,
    activeTasks,
    topFocus: scored.slice(0, 3),
    streak: stats.currentStreak,
    completed: stats.tasksCompleted,
  };
}

function formatTaskLine(task: Task) {
  return `${task.title} - due ${formatDistanceToNow(task.deadline, { addSuffix: true })}`;
}

function generalTips(seed: number) {
  const tipSets = [
    [
      'Timebox the top task for 45-60 minutes and mute notifications.',
      'Batch quick admin items into a 20-minute block instead of sprinkling them through the day.',
      'Close sessions with a 3-bullet recap: what moved, what is blocked, what starts next.',
    ],
    [
      'Work in 90-minute deep-focus blocks with a 10-minute reset to plan the next move.',
      'Group similar work (same category) to reduce context switching costs.',
      'Set a visible "shutdown" time - most overruns happen in the last hour of the day.',
    ],
    [
      'Prep the next day by choosing the first task before you log off.',
      'Keep tasks phrased as actions ("Draft outline for...") to lower friction to start.',
      'Use a quick win (15-20 minutes) to build momentum, then tackle the hardest item.',
    ],
  ];

  return tipSets[seed % tipSets.length];
}

function buildResponse(prompt: string, ctx: CoachContext) {
  const lower = prompt.toLowerCase();
  const parts: string[] = [];

  const focusLines = ctx.topFocus.map((task, index) => `${index + 1}. ${formatTaskLine(task)}`);

  if (focusLines.length) {
    parts.push(
      `Here is what deserves your focus right now:\n${focusLines.join('\n')}\n- Block 45-60 minutes for #1, then 25-30 for #2.\n- Bundle similar tasks to avoid context switching.`,
    );
  } else {
    parts.push('No open tasks yet. Add a task and I will craft a day plan around it.');
  }

  if (ctx.overdue.length) {
    const overdueTitles = ctx.overdue.slice(0, 2).map(task => task.title).join(', ');
    parts.push(`Overdue items to clear first: ${overdueTitles}. Start the day by closing one of these within 30 minutes.`);
  } else if (ctx.dueToday.length) {
    parts.push(`You have ${ctx.dueToday.length} task${ctx.dueToday.length === 1 ? '' : 's'} due today. Protect a morning block to finish the earliest deadline.`);
  }

  if (lower.includes('habit') || lower.includes('tip') || lower.includes('productive')) {
    parts.push(generalTips(ctx.completed + ctx.streak).join('\n'));
  } else if (lower.includes('behind') || lower.includes('overwhelm') || lower.includes('catch')) {
    parts.push(
      'Catching up plan:\n1) Clear one overdue item first (scope it to 30-45 minutes).\n2) Reschedule anything that obviously does not fit today - make a conscious tradeoff.\n3) Set two deep-focus blocks and one admin batch; nothing else gets added until they are done.',
    );
  } else if (lower.includes('arrange') || lower.includes('plan') || lower.includes('priorit')) {
    parts.push(
      'Arrange your day:\n- Start with the hardest/highest stakes task.\n- Follow with a 20-30 minute quick win to regain momentum.\n- Reserve a late-day slot for communication and small tasks so deep work stays protected.',
    );
  } else {
    parts.push('Want tips, a plan for today, or help breaking work into steps? Ask me anything and I will tailor it to your board.');
  }

  return parts.join('\n\n');
}

interface ProductivityCoachChatProps {
  tasks: Task[];
  stats: UserStats;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => Promise<unknown> | unknown;
}

export function ProductivityCoachChat({ tasks, stats, onAddTask }: ProductivityCoachChatProps) {
  const context = useMemo(() => buildContext(tasks, stats), [tasks, stats]);
  const { addTask } = useTaskStore();
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const openaiActive = Boolean(openaiKey);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CoachMessage[]>(() => [
    {
      id: 'coach-intro',
      role: 'coach',
      content: context.activeTasks.length
        ? `I am your productivity coach. I see ${context.dueToday.length} due today, ${context.overdue.length} overdue, and ${context.upcoming.length} due soon. Ask me how to arrange your day or get quick tips.`
        : 'I am your productivity coach. Add a task and I will build a day plan around it, or ask for general productivity tips.',
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [draftMessage, setDraftMessage] = useState<CoachMessage | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftDeadline, setDraftDeadline] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [draftCategory, setDraftCategory] = useState<'academic' | 'professional' | 'personal'>('personal');
  const [draftEstimated, setDraftEstimated] = useState(30);
  const [draftImportance, setDraftImportance] = useState(5);
  const [draftDifficulty, setDraftDifficulty] = useState(5);
  const [isSavingTask, setIsSavingTask] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const introLine = useMemo(
    () =>
      context.activeTasks.length
        ? `I am your productivity coach. I see ${context.dueToday.length} due today, ${context.overdue.length} overdue, and ${context.upcoming.length} due soon. Ask me how to arrange your day or get quick tips.`
        : 'I am your productivity coach. Add a task and I will build a day plan around it, or ask for general productivity tips.',
    [context.activeTasks.length, context.dueToday.length, context.overdue.length, context.upcoming.length],
  );

  useEffect(() => {
    setMessages(prev => {
      if (!prev.length) return [{ id: 'coach-intro', role: 'coach', content: introLine }];
      const [first, ...rest] = prev;
      if (first.role !== 'coach' || first.content === introLine) return prev;
      return [{ ...first, content: introLine }, ...rest];
    });
  }, [introLine]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (value?: string) => {
    if (isSending) return;
    const text = (value ?? input).trim();
    if (!text) return;

    const timestamp = Date.now();
    const userMessage: CoachMessage = { id: `user-${timestamp}`, role: 'user', content: text };

    setMessages(prev => [
      ...prev,
      userMessage,
    ]);
    setInput('');
    setIsSending(true);
    setDraftMessage(null);

    let coachReply = buildResponse(text, context);

    if (openaiActive) {
      try {
        coachReply = await generateOpenAIReply(text, context, openaiKey);
      } catch (error) {
        console.error('server error', error);
        coachReply = `${coachReply}\n\n(Server unavailable right now - showing local guidance instead.)`;
      }
    }

    const coachMessage: CoachMessage = { id: `coach-${timestamp}`, role: 'coach', content: coachReply };
    setMessages(prev => [...prev, coachMessage]);
    setIsSending(false);
  };

  const startDraftFromMessage = (message: CoachMessage) => {
    const firstLine = message.content.split('\n').find(Boolean) || 'New task';
    const trimmedTitle = firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
    setDraftTitle(trimmedTitle);
    setDraftDescription(message.content);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDraftDeadline(
      new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
    );
    setDraftMessage(message);
  };

  const handleCreateTask = async () => {
    if (!draftTitle.trim()) {
      toast.error('Add a title before creating a task.');
      return;
    }
    if (!draftDeadline) {
      toast.error('Choose a deadline.');
      return;
    }

    const handler = typeof onAddTask === 'function' ? onAddTask : addTask;
    try {
      setIsSavingTask(true);
      const deadlineDate = new Date(draftDeadline);
      await handler({
        title: draftTitle.trim(),
        description: draftDescription || undefined,
        category: draftCategory,
        estimatedTime: draftEstimated,
        difficulty: draftDifficulty,
        importance: draftImportance,
        deadline: deadlineDate,
        dependencies: [],
        isRecurring: false,
        recurringPattern: undefined,
        scheduledStart: undefined,
        scheduledEnd: undefined,
      });
      toast.success('Task added from coach advice.');
      setDraftMessage(null);
      setDraftDescription('');
      setDraftTitle('');
    } catch (error) {
      console.error('Error creating task from coach', error);
      toast.error('Could not add the task. Please try again.');
    } finally {
      setIsSavingTask(false);
    }
  };

  return (
    <Card className="border border-border/60 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Brain className="h-5 w-5 text-accent" />
              Productivity Coach
            </CardTitle>
            <CardDescription>Ask for tips, scheduling help, or a quick productivity plan.</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-4 w-4 text-accent" />
              Streak {context.streak}d
            </Badge>
            <Badge variant={openaiActive ? 'secondary' : 'danger'} className="gap-1">
              {openaiActive ? <Sparkles className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {openaiActive ? 'OpenAI active' : 'Local only'}
            </Badge>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <TimerReset className="h-4 w-4 text-chart-academic" />
            Today: {context.dueToday.length}
          </Badge>
          <Badge variant={context.overdue.length ? 'danger' : 'secondary'} className="gap-1">
            <LayoutList className="h-4 w-4 text-chart-professional" />
            Overdue: {context.overdue.length}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-4 w-4 text-chart-personal" />
            Upcoming: {context.upcoming.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map(prompt => (
            <Button
              key={prompt.label}
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => handleSend(prompt.prompt)}
            >
              <Sparkles className="h-4 w-4" />
              {prompt.label}
            </Button>
          ))}
        </div>

        <ScrollArea className="h-64 rounded-lg border border-border/60 bg-muted/40 p-3">
          <div className="space-y-3">
            {messages.map(message => (
              <div key={message.id} className="space-y-1">
                <div
                  className={cn(
                    'flex',
                    message.role === 'coach' ? 'justify-start' : 'justify-end',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[90%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                      message.role === 'coach'
                        ? 'bg-card border border-border/60 text-foreground'
                        : 'bg-accent text-accent-foreground',
                    )}
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {message.content}
                  </div>
                </div>
                {message.role === 'coach' && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => startDraftFromMessage(message)}
                    >
                      Use as task
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {draftMessage && (
          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Create task from coach advice</p>
              <Button variant="ghost" size="sm" onClick={() => setDraftMessage(null)}>
                Cancel
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="draft-title">Title</Label>
                <Input
                  id="draft-title"
                  value={draftTitle}
                  onChange={e => setDraftTitle(e.target.value)}
                  placeholder="Task title"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="draft-deadline">Deadline</Label>
                <Input
                  id="draft-deadline"
                  type="datetime-local"
                  value={draftDeadline}
                  onChange={e => setDraftDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={draftCategory}
                  onValueChange={value => setDraftCategory(value as 'academic' | 'professional' | 'personal')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="draft-estimated">Estimated time (min)</Label>
                <Input
                  id="draft-estimated"
                  type="number"
                  min={5}
                  value={draftEstimated}
                  onChange={e => setDraftEstimated(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="draft-importance">Importance (1-10)</Label>
                <Input
                  id="draft-importance"
                  type="number"
                  min={1}
                  max={10}
                  value={draftImportance}
                  onChange={e => setDraftImportance(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="draft-difficulty">Difficulty (1-10)</Label>
                <Input
                  id="draft-difficulty"
                  type="number"
                  min={1}
                  max={10}
                  value={draftDifficulty}
                  onChange={e => setDraftDifficulty(Number(e.target.value))}
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="draft-description">Description</Label>
                <Input
                  id="draft-description"
                  value={draftDescription}
                  onChange={e => setDraftDescription(e.target.value)}
                  placeholder="Details or steps from the coach message"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDraftMessage(null)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={isSavingTask}>
                {isSavingTask ? 'Adding...' : 'Add to tasks'}
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="Ask for tips or a day plan..."
            disabled={isSending}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={() => handleSend()} className="gap-2" aria-label="Send message" disabled={isSending}>
            <Send className="h-4 w-4" />
            {isSending ? 'Sending' : 'Send'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {openaiActive
            ? ''
            : ''}
        </p>
      </CardContent>
    </Card>
  );
}
