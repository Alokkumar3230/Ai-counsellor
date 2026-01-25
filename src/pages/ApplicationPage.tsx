import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, CheckCircle2, Circle, Calendar, AlertCircle, ClipboardList } from 'lucide-react';
import {
  getTasks,
  getLockedUniversities,
  createTask,
  toggleTaskCompletion,
  deleteTask,
  updateUserStage,
} from '@/db/api';
import type { Task, LockedUniversity } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ApplicationPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lockedUniversities, setLockedUniversities] = useState<LockedUniversity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    university_id: '',
    due_date: '',
    priority: 'medium',
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [tasksList, locked] = await Promise.all([
        getTasks(user.id),
        getLockedUniversities(user.id),
      ]);

      setTasks(tasksList);
      setLockedUniversities(locked);

      // Update stage to applying if user has locked universities and tasks
      if (locked.length > 0 && profile?.current_stage === 'committed') {
        await updateUserStage(user.id, 'applying');
        await refreshProfile();
      }

      // Generate default tasks if none exist and user has locked universities
      if (tasksList.length === 0 && locked.length > 0) {
        await generateDefaultTasks(user.id, locked);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultTasks = async (userId: string, locked: LockedUniversity[]) => {
    const defaultTasks = [
      {
        title: 'Request Academic Transcripts',
        description: 'Contact your institution to request official transcripts',
        priority: 'high',
      },
      {
        title: 'Prepare Statement of Purpose',
        description: 'Write a compelling SOP explaining your goals and motivation',
        priority: 'high',
      },
      {
        title: 'Request Letters of Recommendation',
        description: 'Ask professors or employers for recommendation letters',
        priority: 'high',
      },
      {
        title: 'Prepare Financial Documents',
        description: 'Gather bank statements and financial proof documents',
        priority: 'medium',
      },
      {
        title: 'Complete Application Forms',
        description: 'Fill out online application forms for each university',
        priority: 'medium',
      },
    ];

    try {
      for (const task of defaultTasks) {
        await createTask(userId, {
          ...task,
          university_id: locked[0].university_id,
        });
      }
      await loadData();
      toast.success('Default tasks created to get you started!');
    } catch (error) {
      console.error('Failed to generate default tasks:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!user || !newTask.title) return;

    try {
      await createTask(user.id, {
        title: newTask.title,
        description: newTask.description || undefined,
        university_id: newTask.university_id && newTask.university_id !== 'all' ? newTask.university_id : undefined,
        due_date: newTask.due_date || undefined,
        priority: newTask.priority,
      });

      await loadData();
      setDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        university_id: '',
        due_date: '',
        priority: 'medium',
      });
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await toggleTaskCompletion(taskId, !completed);
      await loadData();
      toast.success(completed ? 'Task marked as incomplete' : 'Task completed!');
    } catch (error) {
      console.error('Failed to toggle task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      await loadData();
      toast.success('Task deleted');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (lockedUniversities.length === 0) {
    return (
      <AppLayout>
        <div className="container px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Locked Universities</h2>
              <p className="text-muted-foreground mb-6">
                You need to lock at least one university before accessing application guidance.
              </p>
              <Button onClick={() => window.location.href = '/universities'}>
                Go to Universities
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const completedTasks = tasks.filter((t) => t.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const progress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const priorityColors = {
    high: 'bg-destructive/10 text-destructive',
    medium: 'bg-warning/10 text-warning',
    low: 'bg-muted text-muted-foreground',
  };

  return (
    <AppLayout>
      <div className="container px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl xl:text-4xl font-bold mb-2">Application Guidance</h1>
          <p className="text-muted-foreground">
            Manage your application tasks and track your progress
          </p>
        </div>

        {/* Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>
              {completedTasks.length} of {tasks.length} tasks completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-success transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locked Universities */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Committed Universities</CardTitle>
            <CardDescription>Universities you're applying to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lockedUniversities.map((item) => (
                <Badge key={item.id} variant="secondary" className="text-sm py-1">
                  {item.university?.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Application Tasks</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a task to your application checklist</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="e.g., Complete application form"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Add details about this task..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university">University (Optional)</Label>
                  <Select
                    value={newTask.university_id}
                    onValueChange={(value) => setNewTask({ ...newTask, university_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Universities</SelectItem>
                      {lockedUniversities.map((item) => (
                        <SelectItem key={item.university_id} value={item.university_id}>
                          {item.university?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleCreateTask} className="w-full" disabled={!newTask.title}>
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Pending Tasks</h3>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleToggleTask(task.id, task.completed)}
                        className="mt-1 shrink-0"
                      >
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                      </button>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h4 className="font-semibold">{task.title}</h4>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className={priorityColors[task.priority as keyof typeof priorityColors]}>
                              {task.priority}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {task.university?.name && (
                            <Badge variant="secondary" className="text-xs">
                              {task.university.name}
                            </Badge>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Completed Tasks</h3>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <Card key={task.id} className="opacity-60">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleToggleTask(task.id, task.completed)}
                        className="mt-1 shrink-0"
                      >
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </button>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-semibold line-through">{task.title}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No tasks yet. Click "Add Task" to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
