'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Smartphone, 
  Sprout, 
  ArrowLeft,
  LayoutDashboard,
  Settings,
  Shield,
  Bell,
  Database,
  Key,
  Mail,
  Server,
  Eye,
  EyeOff,
  Info,
  HelpCircle,
  Save,
  Loader2,
  FileText,
  LogOut
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ADMIN_EMAILS = [
  'ricepaddy.contact@gmail.com',
];

interface PageSettings {
  aboutPageVisible: boolean;
  helpPageVisible: boolean;
}

export default function AdminSettings() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    aboutPageVisible: true,
    helpPageVisible: true,
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  useEffect(() => {
    if (user) {
      const isUserAdmin = ADMIN_EMAILS.includes(user.email || '');
      setIsAdmin(isUserAdmin);
      if (isUserAdmin) {
        fetchPageSettings();
      }
    }
    setLoading(false);
  }, [user]);

  const fetchPageSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'pageVisibility'));
      if (settingsDoc.exists()) {
        setPageSettings(settingsDoc.data() as PageSettings);
      }
    } catch (error) {
      console.error('Error fetching page settings:', error);
    }
  };

  const savePageSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'pageVisibility'), pageSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const togglePageVisibility = (page: 'aboutPageVisible' | 'helpPageVisible') => {
    setPageSettings(prev => ({
      ...prev,
      [page]: !prev[page]
    }));
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Smartphone, label: 'Devices', path: '/admin/devices' },
    { icon: Sprout, label: 'Fields', path: '/admin/fields' },
    { icon: FileText, label: 'Content', path: '/admin/content' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 sm:p-8 text-center">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Access Denied</h2>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20 lg:pb-0">
      {/* Admin Navbar */}
      <nav className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <Image src="/icons/rice_logo.png" alt="PadBuddy" width={32} height={32} className="rounded-lg sm:w-9 sm:h-9" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">PadBuddy</h1>
                <p className="text-[10px] sm:text-xs text-green-500 font-medium">Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-slate-400 hidden sm:block truncate max-w-[150px]">{user.email}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/')}
                className="text-slate-400 hover:text-white hover:bg-slate-700 text-xs sm:text-sm px-2 sm:px-3"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-slate-800/50 border-r border-slate-700 p-4 hidden lg:flex lg:flex-col">
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={`w-full justify-start ${
                  pathname === item.path
                    ? 'text-white bg-green-600/20 hover:bg-green-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                onClick={() => router.push(item.path)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            ))}
          </nav>
          
          {/* Sign Out Button */}
          <div className="pt-4 border-t border-slate-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/admin')}
              className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Admin Settings</h1>
              <p className="text-xs sm:text-sm text-slate-400">Configure system settings and preferences</p>
            </div>
          </div>

          {/* Settings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Page Visibility - NEW */}
            <Card className="bg-slate-800/50 border-slate-700 md:col-span-2">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-white text-sm sm:text-base">Page Visibility</CardTitle>
                      <CardDescription className="text-slate-400 text-xs sm:text-sm">Control which pages are visible to users</CardDescription>
                    </div>
                  </div>
                  <Button 
                    onClick={savePageSettings}
                    disabled={saving}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                        <span className="hidden sm:inline">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Save Changes</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* About Page Toggle */}
                  <div 
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border cursor-pointer transition-all ${
                      pageSettings.aboutPageVisible 
                        ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' 
                        : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                    }`}
                    onClick={() => togglePageVisibility('aboutPageVisible')}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center ${
                        pageSettings.aboutPageVisible ? 'bg-green-500/20' : 'bg-slate-600'
                      }`}>
                        <Info className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          pageSettings.aboutPageVisible ? 'text-green-500' : 'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-medium text-white">About Page</p>
                        <p className="text-[10px] sm:text-xs text-slate-400">
                          {pageSettings.aboutPageVisible ? 'Visible to users' : 'Hidden from users'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full relative transition-colors ${
                      pageSettings.aboutPageVisible ? 'bg-green-600' : 'bg-slate-600'
                    }`}>
                      <div className={`absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        pageSettings.aboutPageVisible ? 'right-0.5 sm:right-1' : 'left-0.5 sm:left-1'
                      }`} />
                    </div>
                  </div>

                  {/* Help Page Toggle */}
                  <div 
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border cursor-pointer transition-all ${
                      pageSettings.helpPageVisible 
                        ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' 
                        : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                    }`}
                    onClick={() => togglePageVisibility('helpPageVisible')}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center ${
                        pageSettings.helpPageVisible ? 'bg-green-500/20' : 'bg-slate-600'
                      }`}>
                        <HelpCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          pageSettings.helpPageVisible ? 'text-green-500' : 'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-medium text-white">Help Page</p>
                        <p className="text-[10px] sm:text-xs text-slate-400">
                          {pageSettings.helpPageVisible ? 'Visible to users' : 'Hidden from users'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full relative transition-colors ${
                      pageSettings.helpPageVisible ? 'bg-green-600' : 'bg-slate-600'
                    }`}>
                      <div className={`absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        pageSettings.helpPageVisible ? 'right-0.5 sm:right-1' : 'left-0.5 sm:left-1'
                      }`} />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4">
                  Toggle pages on/off to control what users can see in the app sidebar menu.
                </p>
              </CardContent>
            </Card>

            {/* Admin Access */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-white text-sm sm:text-base">Admin Access</CardTitle>
                    <CardDescription className="text-slate-400 text-xs sm:text-sm">Manage admin privileges</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm text-slate-400">Authorized admin email:</p>
                  {ADMIN_EMAILS.map((email, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 sm:p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-white font-medium truncate">{email}</span>
                    </div>
                  ))}
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-2">
                    To add/remove admins, edit the ADMIN_EMAILS array in all admin page files.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-white text-sm sm:text-base">Notifications</CardTitle>
                    <CardDescription className="text-slate-400 text-xs sm:text-sm">Configure alert settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-white">Device offline alerts</span>
                    <div className="w-10 h-5 sm:w-12 sm:h-6 bg-green-600 rounded-full relative cursor-pointer">
                      <div className="absolute right-0.5 sm:right-1 top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-white">Low NPK alerts</span>
                    <div className="w-10 h-5 sm:w-12 sm:h-6 bg-green-600 rounded-full relative cursor-pointer">
                      <div className="absolute right-0.5 sm:right-1 top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-white">New user alerts</span>
                    <div className="w-10 h-5 sm:w-12 sm:h-6 bg-slate-600 rounded-full relative cursor-pointer">
                      <div className="absolute left-0.5 sm:left-1 top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Database className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-white text-sm sm:text-base">Database</CardTitle>
                    <CardDescription className="text-slate-400 text-xs sm:text-sm">Firebase configuration</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                    <span className="text-xs sm:text-sm text-slate-400">Firestore</span>
                    <span className="text-xs sm:text-sm text-green-500">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                    <span className="text-xs sm:text-sm text-slate-400">Realtime DB</span>
                    <span className="text-xs sm:text-sm text-green-500">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                    <span className="text-xs sm:text-sm text-slate-400">Auth</span>
                    <span className="text-xs sm:text-sm text-green-500">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Server className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-white text-sm sm:text-base">System Info</CardTitle>
                    <CardDescription className="text-slate-400 text-xs sm:text-sm">Application details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                    <span className="text-xs sm:text-sm text-slate-400">Version</span>
                    <span className="text-xs sm:text-sm text-white">1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                    <span className="text-xs sm:text-sm text-slate-400">Framework</span>
                    <span className="text-xs sm:text-sm text-white">Next.js 15</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                    <span className="text-xs sm:text-sm text-slate-400">Environment</span>
                    <span className="text-xs sm:text-sm text-yellow-500">Development</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-800 border-t border-slate-700 lg:hidden">
        <nav className="flex justify-around h-16">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-2 relative transition-all duration-200 ${
                pathname === item.path ? 'text-green-500' : 'text-slate-400'
              }`}
            >
              {pathname === item.path && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-green-500 rounded-b-full" />
              )}
              <item.icon className={`h-5 w-5 transition-transform duration-200 ${
                pathname === item.path ? 'scale-110' : ''
              }`} />
              <span className={`text-[10px] mt-1 transition-all duration-200 ${
                pathname === item.path ? 'font-semibold' : ''
              }`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Logout Confirmation Modal - Dark Theme */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <LogOut className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle className="text-center text-xl text-white">Sign Out</DialogTitle>
            <DialogDescription className="text-center text-slate-400">
              Are you sure you want to sign out from the admin panel?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
