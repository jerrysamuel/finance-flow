import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';
import {
  User,
  Moon,
  Sun,
  LogOut,
  Trash2,
  Loader2,
  Save,
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { full_name: string }) => userAPI.updateProfile(data),
    onSuccess: () => {
      refreshUser();
      toast({ title: 'Profile updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating profile',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ full_name: fullName });
  };

  const handleToggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="card-elevated p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending || fullName === user?.full_name}
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="card-elevated p-6 space-y-6">
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <Moon className="h-5 w-5 text-primary" />
            ) : (
              <Sun className="h-5 w-5 text-primary" />
            )}
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark theme
              </p>
            </div>
            <Switch
              checked={isDarkMode}
              onCheckedChange={handleToggleTheme}
            />
          </div>
        </div>

        {/* Account Actions Section */}
        <div className="card-elevated p-6 space-y-6">
          <h2 className="text-lg font-semibold">Account Actions</h2>

          <Separator />

          <div className="space-y-4">
            {/* Logout */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-muted-foreground">
                  Sign out of your account on this device
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>

            <Separator />

            {/* Delete Account */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        toast({
                          title: 'Feature not available',
                          description: 'Account deletion is not yet implemented.',
                        });
                      }}
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="text-sm text-muted-foreground">
          <p>
            Account created:{' '}
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : 'Unknown'}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
