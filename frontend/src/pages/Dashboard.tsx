import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FolderKanban,
  ListChecks,
  DollarSign,
  Users,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react';

const client = createClient();

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  start_date: string;
  end_date: string;
}

interface Task {
  id: number;
  project_id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string;
}

interface Finance {
  id: number;
  project_id: number;
  item: string;
  type: string;
  amount: number;
}

interface Contact {
  id: number;
  project_id: number;
  name: string;
  role: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [finances, setFinances] = useState<Finance[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, taskRes, finRes, contRes] = await Promise.all([
          client.entities.projects.query({ query: {}, limit: 50 }),
          client.entities.tasks.query({ query: {}, limit: 50 }),
          client.entities.finances.query({ query: {}, limit: 50 }),
          client.entities.contacts.query({ query: {}, limit: 50 }),
        ]);
        setProjects(projRes.data.items || []);
        setTasks(taskRes.data.items || []);
        setFinances(finRes.data.items || []);
        setContacts(contRes.data.items || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'in_progress');
  const highPriorityTasks = tasks.filter(
    (t) => t.priority === 'high' && t.status !== 'completed' && t.status !== 'done'
  );
  const totalBudget = finances.filter((f) => f.type === 'income' || f.type === 'budget').reduce((s, f) => s + f.amount, 0);
  const totalExpense = finances.filter((f) => f.type === 'expense' || f.type === 'cost').reduce((s, f) => s + f.amount, 0);

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': case 'in_progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'completed': case 'done': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'on_hold': case 'paused': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div
        className="relative rounded-2xl overflow-hidden h-48 flex items-end"
        style={{
          backgroundImage: `url(https://mgx-backend-cdn.metadl.com/generate/images/1158159/2026-04-27/nnf6luiaaflq/hero-dashboard.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="relative z-10 p-6">
          <h1 className="text-3xl font-serif font-bold text-white">Good morning! 🌊</h1>
          <p className="text-white/80 mt-1">Here's your project overview</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold text-foreground mt-1">{activeProjects.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
                <p className="text-3xl font-bold text-foreground mt-1">{highPriorityTasks.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center">
                <ListChecks className="w-6 h-6 text-coral" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget Left</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  ${(totalBudget - totalExpense).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contacts</p>
                <p className="text-3xl font-bold text-foreground mt-1">{contacts.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects & Tasks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold">Projects</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/projects')}
              className="text-primary"
            >
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center">
                <img
                  src="https://mgx-backend-cdn.metadl.com/generate/images/1158159/2026-04-27/nnf6cuaaafna/empty-projects.png"
                  alt="No projects"
                  className="w-40 h-40 mx-auto object-contain opacity-60"
                />
                <p className="text-muted-foreground mt-4">No projects yet. Start by creating one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <Card
                  key={project.id}
                  className="border-0 shadow-md bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {project.name}
                          </h3>
                          <Badge variant="outline" className={`text-xs ${statusColor(project.status)}`}>
                            {project.status}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${priorityColor(project.priority)}`}>
                            {project.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {project.description}
                        </p>
                      </div>
                      <div className="shrink-0 w-24">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* High Priority Tasks */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-coral" />
            <h2 className="text-xl font-serif font-bold">High Priority</h2>
          </div>

          <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 space-y-3">
              {highPriorityTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No high priority tasks 🎉
                </p>
              ) : (
                highPriorityTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-coral shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{task.due_date || 'No due date'}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${priorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Budget Overview</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Budget</span>
                  <span className="font-medium">${totalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-medium text-coral">${totalExpense.toLocaleString()}</span>
                </div>
                <Progress
                  value={totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0}
                  className="h-2"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-medium text-emerald-600">
                    ${(totalBudget - totalExpense).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}