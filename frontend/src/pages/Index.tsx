import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Waves, Bot, FolderKanban, ArrowRight } from 'lucide-react';

const client = createClient();

export default function WelcomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await client.auth.me();
        navigate('/dashboard');
      } catch {
        // Not logged in, show welcome page
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = () => {
    client.auth.toLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-ocean-50 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Waves className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-serif font-bold text-foreground">BeachPlan</span>
        </div>
        <Button onClick={handleLogin} variant="outline" className="rounded-xl">
          Sign In
        </Button>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Bot className="w-4 h-4" /> AI-Powered Project Management
            </div>
            <h1 className="text-5xl lg:text-6xl font-serif font-bold leading-tight">
              Manage projects{' '}
              <span className="bg-gradient-to-r from-primary to-coral bg-clip-text text-transparent">
                like a breeze
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              BeachPlan is your AI-powered project management assistant. Track tasks,
              manage resources, monitor finances, and get intelligent insights — all in
              one beautiful workspace.
            </p>
            <div className="flex items-center gap-4">
              <Button onClick={handleLogin} size="lg" className="rounded-xl gap-2 text-base">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl text-base"
                onClick={() => navigate('/assistant')}
              >
                Try AI Assistant
              </Button>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-card shadow-lg border border-border/50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Projects</h3>
              <p className="text-sm text-muted-foreground">Track progress across all your projects</p>
            </div>
            <div className="p-5 rounded-2xl bg-card shadow-lg border border-border/50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-coral" />
              </div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">Get smart insights and recommendations</p>
            </div>
            <div className="p-5 rounded-2xl bg-card shadow-lg border border-border/50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Waves className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold">Resources</h3>
              <p className="text-sm text-muted-foreground">Manage team and resources efficiently</p>
            </div>
            <div className="p-5 rounded-2xl bg-card shadow-lg border border-border/50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold">Finances</h3>
              <p className="text-sm text-muted-foreground">Budget tracking and expense management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-4 text-center text-sm text-muted-foreground">
        © 2026 BeachPlan — AI Project Management Assistant
      </footer>
    </div>
  );
}