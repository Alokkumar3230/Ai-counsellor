import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, MessageSquare, Target, CheckCircle, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AI Counsellor</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-20 xl:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl xl:text-6xl font-bold tracking-tight mb-6">
            Your Journey to the Perfect University{' '}
            <span className="text-primary">Starts Here</span>
          </h1>
          <p className="text-lg xl:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI Counsellor guides you through every step of your study abroad journey—from
            discovering universities to submitting applications with confidence.
          </p>
          <div className="flex flex-col xl:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="gap-2 w-full xl:w-auto">
                Start Your Journey
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-16 xl:py-24 bg-muted/50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl xl:text-4xl font-bold text-center mb-12">
            How AI Counsellor Works
          </h2>
          <div className="grid gap-8 xl:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Guidance</h3>
                <p className="text-muted-foreground">
                  Get personalized recommendations based on your academic background, goals,
                  and budget through intelligent conversations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <Target className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart University Matching</h3>
                <p className="text-muted-foreground">
                  Discover universities categorized as Dream, Target, or Safe based on your
                  profile and admission chances.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Application Roadmap</h3>
                <p className="text-muted-foreground">
                  Get a clear action plan with tasks, deadlines, and guidance to complete
                  your applications successfully.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="container px-4 py-16 xl:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl xl:text-4xl font-bold text-center mb-12">
            Your Step-by-Step Journey
          </h2>
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Complete Your Profile',
                description:
                  'Share your academic background, goals, budget, and test scores to help us understand you better.',
              },
              {
                step: '2',
                title: 'Explore with AI Counsellor',
                description:
                  'Chat with our AI to get personalized university recommendations and insights about your chances.',
              },
              {
                step: '3',
                title: 'Build Your Shortlist',
                description:
                  'Add universities to your shortlist and categorize them as Dream, Target, or Safe options.',
              },
              {
                step: '4',
                title: 'Lock Your Choices',
                description:
                  'Commit to your top universities to unlock detailed application guidance and resources.',
              },
              {
                step: '5',
                title: 'Complete Applications',
                description:
                  'Follow your personalized task list to prepare documents, write essays, and submit applications.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16 xl:py-24 bg-primary/5">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl xl:text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of students who have found their perfect university with AI
            Counsellor.
          </p>
          <Link to="/login">
            <Button size="lg" className="gap-2">
              Get Started Now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © 2026 AI Counsellor. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
