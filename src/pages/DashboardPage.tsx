import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Lock,
  ArrowRight,
  GraduationCap,
  MessageSquare,
  Target,
  ClipboardList,
} from 'lucide-react';
import { getShortlistedUniversities, getLockedUniversities, getTasks } from '@/db/api';
import type { UserStage } from '@/types';

const STAGE_INFO: Record<
  UserStage,
  {
    title: string;
    description: string;
    icon: any;
    color: string;
  }
> = {
  not_started: {
    title: 'Getting Started',
    description: 'Complete your profile to begin',
    icon: Circle,
    color: 'text-muted-foreground',
  },
  onboarding: {
    title: 'Building Your Profile',
    description: 'Tell us about your goals',
    icon: Circle,
    color: 'text-muted-foreground',
  },
  exploring: {
    title: 'Exploring Options',
    description: 'Discover universities with AI guidance',
    icon: MessageSquare,
    color: 'text-primary',
  },
  shortlisting: {
    title: 'Building Shortlist',
    description: 'Select your target universities',
    icon: Target,
    color: 'text-primary',
  },
  committed: {
    title: 'Committed',
    description: 'Locked your university choices',
    icon: Lock,
    color: 'text-success',
  },
  applying: {
    title: 'Applying',
    description: 'Working on applications',
    icon: ClipboardList,
    color: 'text-success',
  },
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [shortlistCount, setShortlistCount] = useState(0);
  const [lockedCount, setLockedCount] = useState(0);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    if (!profile.onboarding_completed) {
      navigate('/onboarding');
      return;
    }

    const loadData = async () => {
      try {
        const [shortlisted, locked, tasks] = await Promise.all([
          getShortlistedUniversities(profile.id),
          getLockedUniversities(profile.id),
          getTasks(profile.id),
        ]);

        setShortlistCount(shortlisted.length);
        setLockedCount(locked.length);
        setTaskStats({
          total: tasks.length,
          completed: tasks.filter((t) => t.completed).length,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile, navigate]);

  if (!profile || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const currentStage = profile.current_stage;
  const stageInfo = STAGE_INFO[currentStage];
  const StageIcon = stageInfo.icon;

  const stages: UserStage[] = ['exploring', 'shortlisting', 'committed', 'applying'];
  const currentStageIndex = stages.indexOf(currentStage);
  const progress = ((currentStageIndex + 1) / stages.length) * 100;

  return (
    <AppLayout>
      <div className="container px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl xl:text-4xl font-bold mb-2">
            Welcome back, {profile.full_name || 'Student'}!
          </h1>
          <p className="text-muted-foreground">
            Track your progress and continue your university application journey
          </p>
        </div>

        {/* Current Stage Card */}
        <Card className="mb-8 border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-primary/10 ${stageInfo.color}`}>
                <StageIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{stageInfo.title}</CardTitle>
                <CardDescription>{stageInfo.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 xl:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Shortlisted Universities</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shortlistCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Universities on your list
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Locked Choices</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lockedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Committed universities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Application Tasks</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {taskStats.completed}/{taskStats.total}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Journey Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Your Journey</CardTitle>
            <CardDescription>Complete each step to move forward</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {[
                {
                  stage: 'exploring',
                  title: 'Explore with AI Counsellor',
                  description: 'Get personalized university recommendations',
                  action: 'Start Exploring',
                  link: '/counsellor',
                },
                {
                  stage: 'shortlisting',
                  title: 'Build Your Shortlist',
                  description: 'Add universities to your shortlist',
                  action: 'View Universities',
                  link: '/universities',
                },
                {
                  stage: 'committed',
                  title: 'Lock Your Choices',
                  description: 'Commit to your top universities',
                  action: 'Manage Shortlist',
                  link: '/universities',
                },
                {
                  stage: 'applying',
                  title: 'Complete Applications',
                  description: 'Work through your application tasks',
                  action: 'View Tasks',
                  link: '/application',
                },
              ].map((step, index) => {
                const isCompleted = currentStageIndex > index;
                const isCurrent = stages[index] === currentStage;
                const isLocked = currentStageIndex < index;

                return (
                  <div
                    key={step.stage}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      isCurrent ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="mt-1">
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-success" />
                      ) : isCurrent ? (
                        <Circle className="h-6 w-6 text-primary fill-primary" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{step.title}</h3>
                        {isCurrent && <Badge variant="default">Current</Badge>}
                        {isCompleted && <Badge variant="secondary">Completed</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                      <Button
                        size="sm"
                        variant={isCurrent ? 'default' : 'outline'}
                        onClick={() => navigate(step.link)}
                        disabled={isLocked}
                      >
                        {step.action}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
