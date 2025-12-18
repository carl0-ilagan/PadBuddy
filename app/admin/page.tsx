'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Smartphone, 
  Sprout, 
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  LayoutDashboard,
  Settings,
  Database,
  Shield,
  Menu,
  X,
  FileText,
  LogOut,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Admin emails - authorized admin access
const ADMIN_EMAILS = [
  'ricepaddy.contact@gmail.com',
];

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFields: 0,
    totalDevices: 0,
    activeDevices: 0,
    offlineDevices: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

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
    // Check if user is admin
    if (user) {
      const isUserAdmin = ADMIN_EMAILS.includes(user.email || '');
      setIsAdmin(isUserAdmin);
      
      if (isUserAdmin) {
        fetchAdminStats();
      }
    }
    setLoading(false);
  }, [user]);

  const fetchAdminStats = async () => {
    try {
      // Fetch all users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      let totalFields = 0;
      let totalDevices = 0;
      const users: any[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = { id: userDoc.id, ...userDoc.data() };
        users.push(userData);

        // Count fields for each user
        const fieldsRef = collection(db, 'users', userDoc.id, 'fields');
        const fieldsSnapshot = await getDocs(fieldsRef);
        totalFields += fieldsSnapshot.size;

        // Count devices (paddies) for each field
        for (const fieldDoc of fieldsSnapshot.docs) {
          const paddiesRef = collection(db, 'users', userDoc.id, 'fields', fieldDoc.id, 'paddies');
          const paddiesSnapshot = await getDocs(paddiesRef);
          totalDevices += paddiesSnapshot.size;
        }
      }

      setStats({
        totalUsers: usersSnapshot.size,
        totalFields,
        totalDevices,
        activeDevices: 0, // TODO: Calculate from RTDB heartbeats
        offlineDevices: totalDevices // Placeholder
      });

      // Sort users by createdAt (latest first) and get top 5
      const sortedUsers = users.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const dateB = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      
      setRecentUsers(sortedUsers.slice(0, 5));
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 sm:p-8 text-center">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400 mb-6 text-sm sm:text-base">Please sign in to access the admin panel.</p>
            <Button 
              onClick={() => router.push('/auth')}
              className="bg-green-600 hover:bg-green-700"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 sm:p-8 text-center">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400 mb-4 sm:mb-6 text-sm sm:text-base">You don't have admin privileges.</p>
            <p className="text-xs text-slate-500 mb-4 sm:mb-6 truncate">Signed in as: {user.email}</p>
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

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Smartphone, label: 'Devices', path: '/admin/devices' },
    { icon: Sprout, label: 'Fields', path: '/admin/fields' },
    { icon: FileText, label: 'Content', path: '/admin/content' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

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
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Total Users */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400">Total Users</p>
                    <p className="text-xl sm:text-3xl font-bold text-white">{stats.totalUsers}</p>
                  </div>
                  <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2">Registered farmers</p>
              </CardContent>
            </Card>

            {/* Total Fields */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400">Total Fields</p>
                    <p className="text-xl sm:text-3xl font-bold text-white">{stats.totalFields}</p>
                  </div>
                  <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Sprout className="h-4 w-4 sm:h-6 sm:w-6 text-green-500" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2">Active rice fields</p>
              </CardContent>
            </Card>

            {/* Total Devices */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400">Total Devices</p>
                    <p className="text-xl sm:text-3xl font-bold text-white">{stats.totalDevices}</p>
                  </div>
                  <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Smartphone className="h-4 w-4 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2">Connected sensors</p>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400">System Status</p>
                    <p className="text-base sm:text-xl font-bold text-green-500">Online</p>
                  </div>
                  <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-green-500" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2">All systems operational</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-base sm:text-lg">Quick Actions</CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">Common admin tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
                <Button 
                  className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white text-sm"
                  onClick={() => router.push('/admin/users')}
                >
                  <Users className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  Manage Users
                </Button>
                <Button 
                  className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white text-sm"
                  onClick={() => router.push('/admin/devices')}
                >
                  <Smartphone className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  View All Devices
                </Button>
                <Button 
                  className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white text-sm"
                  onClick={() => router.push('/test/create-rtdb-devices')}
                >
                  <Database className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  Create Test Device
                </Button>
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-base sm:text-lg">Recent Users</CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">Latest registered farmers</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                {recentUsers.length === 0 ? (
                  <p className="text-slate-500 text-center py-4 text-sm">No users found</p>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {recentUsers.map((recentUser, index) => (
                      <div key={index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                        {/* Profile Image */}
                        {recentUser.photoURL ? (
                          <img 
                            src={recentUser.photoURL} 
                            alt={recentUser.displayName || recentUser.email || 'User'} 
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover flex-shrink-0 border-2 border-green-500/30"
                            onError={(e) => {
                              // Fallback to initials if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 ${recentUser.photoURL ? 'hidden' : ''}`}
                        >
                          <span className="text-white font-semibold text-xs sm:text-base">
                            {(recentUser.displayName || recentUser.email || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-white truncate">
                            {recentUser.displayName || recentUser.email?.split('@')[0] || 'Unknown'}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-400 truncate">{recentUser.email}</p>
                        </div>
                        {/* Registration date */}
                        {recentUser.createdAt && (
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-slate-500">
                              {(() => {
                                const date = recentUser.createdAt?.toDate?.() || new Date(recentUser.createdAt);
                                const now = new Date();
                                const diff = now.getTime() - date.getTime();
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                if (days === 0) return 'Today';
                                if (days === 1) return 'Yesterday';
                                if (days < 7) return `${days} days ago`;
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              })()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Device Status Overview */}
          <Card className="bg-slate-800/50 border-slate-700 mt-4 sm:mt-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white text-base sm:text-lg">Device Status Overview</CardTitle>
              <CardDescription className="text-slate-400 text-xs sm:text-sm">Real-time device health monitoring</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-white">{stats.activeDevices}</p>
                    <p className="text-xs sm:text-sm text-slate-400">Online Devices</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-white">{stats.offlineDevices}</p>
                    <p className="text-xs sm:text-sm text-slate-400">Offline Devices</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-white">--</p>
                    <p className="text-xs sm:text-sm text-slate-400">Avg. Response Time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-800 border-t border-slate-700 lg:hidden">
        <nav className="flex justify-around h-16">
          {navItems.slice(0, 5).map((item) => (
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
