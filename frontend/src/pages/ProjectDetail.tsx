import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Users,
  DollarSign,
  ListChecks,
  Package,
  Plus,
  Mail,
  Phone,
  Building2,
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

interface Resource {
  id: number;
  project_id: number;
  name: string;
  type: string;
  quantity: number;
  status: string;
}

interface Contact {
  id: number;
  project_id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  company: string;
}

interface Finance {
  id: number;
  project_id: number;
  item: string;
  type: string;
  amount: number;
  date: string;
  description: string;
}

interface Task {
  id: number;
  project_id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id || '0');

  const [project, setProject] = useState<Project | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [finances, setFinances] = useState<Finance[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [financeDialogOpen, setFinanceDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);

  // Form states
  const [newContact, setNewContact] = useState({ name: '', role: '', email: '', phone: '', company: '' });
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', due_date: '' });
  const [newFinance, setNewFinance] = useState({ item: '', type: 'expense', amount: 0, date: '', description: '' });
  const [newResource, setNewResource] = useState({ name: '', type: '', quantity: 1, status: 'available' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, resRes, contRes, finRes, taskRes] = await Promise.all([
          client.entities.projects.get({ id: String(projectId) }),
          client.entities.resources.query({ query: { project_id: projectId }, limit: 50 }),
          client.entities.contacts.query({ query: { project_id: projectId }, limit: 50 }),
          client.entities.finances.query({ query: { project_id: projectId }, limit: 50 }),
          client.entities.tasks.query({ query: { project_id: projectId }, limit: 50 }),
        ]);
        setProject(projRes.data);
        setResources(resRes.data.items || []);
        setContacts(contRes.data.items || []);
        setFinances(finRes.data.items || []);
        setTasks(taskRes.data.items || []);
      } catch (err) {
        console.error('Failed to fetch project data:', err);
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchData();
  }, [projectId]);

  const handleAddContact = async () => {
    try {
      await client.entities.contacts.create({
        data: { ...newContact, project_id: projectId },
      });
      const res = await client.entities.contacts.query({ query: { project_id: projectId }, limit: 50 });
      setContacts(res.data.items || []);
      setContactDialogOpen(false);
      setNewContact({ name: '', role: '', email: '', phone: '', company: '' });
      toast.success('Contact added');
    } catch { toast.error('Failed to add contact'); }
  };

  const handleAddTask = async () => {
    try {
      await client.entities.tasks.create({
        data: { ...newTask, project_id: projectId, status: 'pending' },
      });
      const res = await client.entities.tasks.query({ query: { project_id: projectId }, limit: 50 });
      setTasks(res.data.items || []);
      setTaskDialogOpen(false);
      setNewTask({ title: '', priority: 'medium', due_date: '' });
      toast.success('Task added');
    } catch { toast.error('Failed to add task'); }
  };

  const handleAddFinance = async () => {
    try {
      await client.entities.finances.create({
        data: { ...newFinance, project_id: projectId },
      });
      const res = await client.entities.finances.query({ query: { project_id: projectId }, limit: 50 });
      setFinances(res.data.items || []);
      setFinanceDialogOpen(false);
      setNewFinance({ item: '', type: 'expense', amount: 0, date: '', description: '' });
      toast.success('Finance entry added');
    } catch { toast.error('Failed to add finance entry'); }
  };

  const handleAddResource = async () => {
    try {
      await client.entities.resources.create({
        data: { ...newResource, project_id: projectId },
      });
      const res = await client.entities.resources.query({ query: { project_id: projectId }, limit: 50 });
      setResources(res.data.items || []);
      setResourceDialogOpen(false);
      setNewResource({ name: '', type: '', quantity: 1, status: 'available' });
      toast.success('Resource added');
    } catch { toast.error('Failed to add resource'); }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' || task.status === 'done' ? 'pending' : 'completed';
      await client.entities.tasks.update({ id: String(task.id), data: { status: newStatus } });
      const res = await client.entities.tasks.query({ query: { project_id: projectId }, limit: 50 });
      setTasks(res.data.items || []);
      toast.success(`Task marked as ${newStatus}`);
    } catch { toast.error('Failed to update task'); }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const totalIncome = finances.filter((f) => f.type === 'income' || f.type === 'budget').reduce((s, f) => s + f.amount, 0);
  const totalExpense = finances.filter((f) => f.type === 'expense' || f.type === 'cost').reduce((s, f) => s + f.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-bold">{project.name}</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {project.status}
            </Badge>
            <Badge variant="outline" className={priorityColor(project.priority)}>
              {project.priority}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        <div className="w-32">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{project.progress || 0}%</span>
          </div>
          <Progress value={project.progress || 0} className="h-2.5" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="tasks" className="gap-2">
            <ListChecks className="w-4 h-4" /> Tasks
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <Package className="w-4 h-4" /> Resources
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-2">
            <Users className="w-4 h-4" /> Contacts
          </TabsTrigger>
          <TabsTrigger value="finances" className="gap-2">
            <DollarSign className="w-4 h-4" /> Finances
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Task title"
                    />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddTask} className="w-full">Add Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No tasks yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.id} className="cursor-pointer hover:bg-muted/30">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={task.status === 'completed' || task.status === 'done'}
                            onChange={() => toggleTaskStatus(task)}
                            className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary/20"
                          />
                        </TableCell>
                        <TableCell className={task.status === 'completed' || task.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                          {task.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${priorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-muted/50">
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {task.due_date || '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Resource</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newResource.name}
                      onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                      placeholder="Resource name"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Input
                      value={newResource.type}
                      onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                      placeholder="e.g., equipment, software"
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={newResource.quantity}
                      onChange={(e) => setNewResource({ ...newResource, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <Button onClick={handleAddResource} className="w-full">Add Resource</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.length === 0 ? (
              <Card className="border-0 shadow-md col-span-full">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No resources added yet
                </CardContent>
              </Card>
            ) : (
              resources.map((resource) => (
                <Card key={resource.id} className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{resource.name}</h4>
                        <p className="text-sm text-muted-foreground">{resource.type}</p>
                      </div>
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                        {resource.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Qty: {resource.quantity}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input
                      value={newContact.role}
                      onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                      placeholder="e.g., Designer, Developer"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label>Company</Label>
                    <Input
                      value={newContact.company}
                      onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                  <Button onClick={handleAddContact} className="w-full">Add Contact</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.length === 0 ? (
              <Card className="border-0 shadow-md col-span-full">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No contacts added yet
                </CardContent>
              </Card>
            ) : (
              contacts.map((contact) => (
                <Card key={contact.id} className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {contact.name[0]}
                      </div>
                      <div>
                        <h4 className="font-medium">{contact.name}</h4>
                        <p className="text-sm text-muted-foreground">{contact.role}</p>
                      </div>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" /> {contact.email}
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" /> {contact.phone}
                      </div>
                    )}
                    {contact.company && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5" /> {contact.company}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Finances Tab */}
        <TabsContent value="finances" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={financeDialogOpen} onOpenChange={setFinanceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Finance Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Item</Label>
                    <Input
                      value={newFinance.item}
                      onChange={(e) => setNewFinance({ ...newFinance, item: e.target.value })}
                      placeholder="Item description"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={newFinance.type}
                      onChange={(e) => setNewFinance({ ...newFinance, type: e.target.value })}
                    >
                      <option value="income">Income / Budget</option>
                      <option value="expense">Expense / Cost</option>
                    </select>
                  </div>
                  <div>
                    <Label>Amount ($)</Label>
                    <Input
                      type="number"
                      value={newFinance.amount}
                      onChange={(e) => setNewFinance({ ...newFinance, amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newFinance.date}
                      onChange={(e) => setNewFinance({ ...newFinance, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newFinance.description}
                      onChange={(e) => setNewFinance({ ...newFinance, description: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </div>
                  <Button onClick={handleAddFinance} className="w-full">Add Entry</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Finance Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md bg-emerald-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-emerald-600">${totalIncome.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-coral/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-coral">${totalExpense.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-primary' : 'text-coral'}`}>
                  ${(totalIncome - totalExpense).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No finance entries yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    finances.map((fin) => (
                      <TableRow key={fin.id}>
                        <TableCell className="font-medium">{fin.item}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              fin.type === 'income' || fin.type === 'budget'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-coral/10 text-coral border-coral/20'
                            }`}
                          >
                            {fin.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={fin.type === 'income' || fin.type === 'budget' ? 'text-emerald-600' : 'text-coral'}>
                          {fin.type === 'income' || fin.type === 'budget' ? '+' : '-'}${fin.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fin.date || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fin.description || '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}