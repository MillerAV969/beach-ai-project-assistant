import { useState, useEffect } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Bell, Palette, Shield, Waves, LogOut } from 'lucide-react';

const client = createClient();

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    email: true,
    taskReminders: true,
    projectUpdates: true,
    weeklyReport: false,
  });
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await client.auth.me();
        setUser(res.data);
      } catch {
        // Not logged in
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await client.auth.logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user?.email || 'User'}</p>
              <p className="text-sm text-muted-foreground">BeachPlan Member</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Display Name</Label>
              <Input placeholder="Your name" defaultValue={user?.email?.split('@')[0] || ''} />
            </div>
            <div>
              <Label>Email</Label>
              <Input placeholder="email@example.com" value={user?.email || ''} disabled />
            </div>
          </div>

          <Button variant="outline" className="gap-2">
            <Waves className="w-4 h-4" /> Update Profile
          </Button>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-primary" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, email: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Task Reminders</p>
              <p className="text-sm text-muted-foreground">Get reminded about upcoming deadlines</p>
            </div>
            <Switch
              checked={notifications.taskReminders}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, taskReminders: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Project Updates</p>
              <p className="text-sm text-muted-foreground">Notifications about project changes</p>
            </div>
            <Switch
              checked={notifications.projectUpdates}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, projectUpdates: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Report</p>
              <p className="text-sm text-muted-foreground">Receive a weekly summary email</p>
            </div>
            <Switch
              checked={notifications.weeklyReport}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, weeklyReport: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5 text-primary" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-3 block">Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Beach Light', desc: 'Warm sandy tones' },
                { id: 'ocean', label: 'Ocean Blue', desc: 'Cool ocean vibes' },
                { id: 'sunset', label: 'Sunset', desc: 'Warm coral hues' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    theme === t.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border/50 hover:border-primary/30'
                  }`}
                >
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Authentication</p>
              <p className="text-sm text-muted-foreground">Managed via Atoms Cloud</p>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
              Secured
            </Badge>
          </div>
          <Separator />
          <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}