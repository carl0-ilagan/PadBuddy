'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, Timestamp, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
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
  Loader2,
  BookOpen
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
  const [adminVarieties, setAdminVarieties] = useState<any[]>([]);
  const [staticVarieties, setStaticVarieties] = useState<any[]>([]);
  const [isAddVarietyModalOpen, setIsAddVarietyModalOpen] = useState(false);
  const [isViewVarietyModalOpen, setIsViewVarietyModalOpen] = useState(false);
  const [selectedVariety, setSelectedVariety] = useState<any>(null);
  const [varietiesPage, setVarietiesPage] = useState(1);
  const varietiesPerPage = 10;
  const [varietyName, setVarietyName] = useState('');
  const [varietyAliases, setVarietyAliases] = useState('');
  const [varietyBreeder, setVarietyBreeder] = useState('');
  const [varietyMaturityRange, setVarietyMaturityRange] = useState('');
  const [varietyMaturityNotes, setVarietyMaturityNotes] = useState('');
  const [varietyN, setVarietyN] = useState('');
  const [varietyP2O5, setVarietyP2O5] = useState('');
  const [varietyK2O, setVarietyK2O] = useState('');
  const [varietyApplicationTiming, setVarietyApplicationTiming] = useState('');
  const [varietyNotes, setVarietyNotes] = useState('');
  const [isAddingVariety, setIsAddingVariety] = useState(false);

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
        fetchStaticVarieties();
      }
    }
    setLoading(false);
  }, [user]);

  const fetchStaticVarieties = async () => {
    try {
      const response = await fetch('/variety_information/rice');
      if (!response.ok) {
        throw new Error('Failed to fetch static rice varieties');
      }
      const text = await response.text();
      const data = JSON.parse(text);
      setStaticVarieties(data.varieties || []);
    } catch (error) {
      console.error('Error fetching static varieties:', error);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    
    try {
      const varietiesRef = collection(db, 'riceVarieties');
      const unsubscribe = onSnapshot(varietiesRef, (snapshot) => {
        const varieties = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAdminVarieties(varieties);
        setVarietiesPage(1); // Reset to first page when varieties change
      }, (error) => {
        console.error('Error fetching admin varieties:', error);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up varieties listener:', error);
    }
  }, [isAdmin]);

  const handleAddVariety = async () => {
    if (!varietyName.trim() || !varietyBreeder.trim()) {
      alert('Please fill in all required fields (Name and Breeder)');
      return;
    }

    setIsAddingVariety(true);
    try {
      const varietiesRef = collection(db, 'riceVarieties');
      
      // Parse aliases from comma-separated string
      const aliases = varietyAliases.trim()
        ? varietyAliases.split(',').map(a => a.trim()).filter(a => a)
        : [];
      
      // Parse application timing from newline-separated string
      const applicationTiming = varietyApplicationTiming.trim()
        ? varietyApplicationTiming.split('\n').map(t => t.trim()).filter(t => t)
        : [];
      
      await addDoc(varietiesRef, {
        name: varietyName.trim(),
        aliases: aliases.length > 0 ? aliases : [varietyName.trim()],
        breeder: varietyBreeder.trim(),
        maturity_days: {
          typical_range: varietyMaturityRange.trim() || 'Not specified',
          notes: varietyMaturityNotes.trim() || undefined
        },
        recommended_npk_per_ha: {
          N: varietyN.trim() || 'Not specified',
          P2O5: varietyP2O5.trim() || 'Not specified',
          K2O: varietyK2O.trim() || 'Not specified',
          application_timing: applicationTiming.length > 0 ? applicationTiming : ['Not specified']
        },
        notes: varietyNotes.trim() || undefined,
        createdAt: serverTimestamp(),
        addedBy: user?.email || 'admin',
        source: 'admin'
      });

      // Reset form
      setVarietyName('');
      setVarietyAliases('');
      setVarietyBreeder('');
      setVarietyMaturityRange('');
      setVarietyMaturityNotes('');
      setVarietyN('');
      setVarietyP2O5('');
      setVarietyK2O('');
      setVarietyApplicationTiming('');
      setVarietyNotes('');
      setIsAddVarietyModalOpen(false);
      
      // Redirect to varieties page
      router.push('/varieties');
    } catch (error) {
      console.error('Error adding variety:', error);
      alert('Failed to add variety. Please try again.');
    } finally {
      setIsAddingVariety(false);
    }
  };

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
        <aside className="w-64 bg-slate-800/50 border-r border-slate-700 p-4 hidden lg:flex lg:flex-col fixed left-0 top-16 h-[calc(100vh-4rem)]">
          <nav className="space-y-2 flex-1 overflow-y-auto">
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
          <div className="pt-4 border-t border-slate-700 flex-shrink-0">
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
        <main className="flex-1 p-3 sm:p-6 lg:ml-64">
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
                <Button 
                  className="w-full justify-start bg-green-600 hover:bg-green-700 text-white text-sm"
                  onClick={() => setIsAddVarietyModalOpen(true)}
                >
                  <Sprout className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  Add Rice Variety
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

          {/* All Rice Varieties (Static + Admin-Added) */}
          <Card className="bg-slate-800/50 border-slate-700 mt-4 sm:mt-6">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-white text-base sm:text-lg">Rice Varieties</CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm">
                    {staticVarieties.length} static varieties • {adminVarieties.length} admin-added
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddVarietyModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                >
                  <Sprout className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              {(() => {
                const allVarieties = [
                  ...staticVarieties.map((v, i) => ({ ...v, id: `static-${i}`, source: 'static' })),
                  ...adminVarieties.map(v => ({ ...v, source: 'admin' }))
                ];
                const totalPages = Math.ceil(allVarieties.length / varietiesPerPage);
                const startIndex = (varietiesPage - 1) * varietiesPerPage;
                const endIndex = startIndex + varietiesPerPage;
                const paginatedVarieties = allVarieties.slice(startIndex, endIndex);

                if (allVarieties.length === 0) {
                  return <p className="text-slate-500 text-center py-4 text-sm">No varieties found</p>;
                }

                return (
                  <>
                    <div className="space-y-2 sm:space-y-3">
                      {paginatedVarieties.map((variety) => (
                        <div 
                          key={variety.id} 
                          className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-3 rounded-lg hover:bg-slate-700 transition-colors border ${
                            variety.source === 'static' 
                              ? 'bg-slate-700/30 border-slate-600/50' 
                              : 'bg-slate-700/50 border-green-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${
                              variety.source === 'static' 
                                ? 'from-blue-500 to-blue-600' 
                                : 'from-green-500 to-emerald-600'
                            }`}>
                              {variety.source === 'static' ? (
                                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                              ) : (
                                <Sprout className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                                <p className="text-xs sm:text-sm font-medium text-white truncate">
                                  {variety.name}
                                </p>
                                <span className={`px-1.5 py-0.5 text-[10px] rounded border flex-shrink-0 ${
                                  variety.source === 'static'
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                    : 'bg-green-500/20 text-green-300 border-green-500/30'
                                }`}>
                                  {variety.source === 'static' ? 'Static' : 'Admin'}
                                </span>
                              </div>
                              <p className="text-[10px] sm:text-xs text-slate-400 break-words">
                                <span className="hidden sm:inline">Breeder: {variety.breeder} • </span>
                                <span className="sm:hidden">Breeder: {variety.breeder}</span>
                                <span className="sm:hidden block mt-0.5">Maturity: {variety.maturity_days?.typical_range || variety.maturity_days || 'Not specified'}</span>
                                <span className="hidden sm:inline">Maturity: {variety.maturity_days?.typical_range || variety.maturity_days || 'Not specified'}</span>
                              </p>
                              {variety.aliases && variety.aliases.length > 0 && (
                                <p className="text-[10px] text-slate-500 break-words mt-0.5">
                                  Aliases: {Array.isArray(variety.aliases) ? variety.aliases.join(', ') : variety.aliases}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedVariety(variety);
                              setIsViewVarietyModalOpen(true);
                            }}
                            className={`w-full sm:w-auto flex-shrink-0 ${
                              variety.source === 'static' 
                                ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                                : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                            }`}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-700">
                        <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
                          Showing {startIndex + 1} to {Math.min(endIndex, allVarieties.length)} of {allVarieties.length} varieties
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setVarietiesPage(prev => Math.max(1, prev - 1))}
                            disabled={varietiesPage === 1}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 text-xs sm:text-sm px-2 sm:px-3"
                          >
                            <span className="hidden sm:inline">Previous</span>
                            <span className="sm:hidden">Prev</span>
                          </Button>
                          
                          {/* Page Numbers */}
                          <div className="flex items-center gap-1">
                            {(() => {
                              const maxPages = 5;
                              const pagesToShow = Math.min(maxPages, totalPages);
                              let startPage = 1;
                              if (totalPages > maxPages) {
                                if (varietiesPage <= 3) {
                                  startPage = 1;
                                } else if (varietiesPage >= totalPages - 2) {
                                  startPage = totalPages - maxPages + 1;
                                } else {
                                  startPage = varietiesPage - 2;
                                }
                              }
                              
                              return Array.from({ length: pagesToShow }, (_, i) => {
                                const pageNum = startPage + i;
                                return (
                                  <Button
                                    key={pageNum}
                                    size="sm"
                                    variant={varietiesPage === pageNum ? "default" : "outline"}
                                    onClick={() => setVarietiesPage(pageNum)}
                                    className={`text-xs sm:text-sm px-2 sm:px-3 ${
                                      varietiesPage === pageNum
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                  >
                                    {pageNum}
                                  </Button>
                                );
                              });
                            })()}
                          </div>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setVarietiesPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={varietiesPage === totalPages}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 text-xs sm:text-sm px-2 sm:px-3"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>

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

      {/* Add Rice Variety Modal */}
      <Dialog open={isAddVarietyModalOpen} onOpenChange={setIsAddVarietyModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Sprout className="h-6 w-6 text-green-500" />
            </div>
            <DialogTitle className="text-center text-xl text-white">Add Rice Variety</DialogTitle>
            <DialogDescription className="text-center text-slate-400">
              Add a new rice variety to the system. You'll be redirected to the varieties page after adding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Basic Information */}
            <div className="border-b border-slate-700 pb-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Variety Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={varietyName}
                    onChange={(e) => setVarietyName(e.target.value)}
                    placeholder="e.g., NSIC Rc 222"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isAddingVariety}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Aliases (Optional, comma-separated)
                  </label>
                  <input
                    type="text"
                    value={varietyAliases}
                    onChange={(e) => setVarietyAliases(e.target.value)}
                    placeholder="e.g., Rc222, RC222"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isAddingVariety}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Breeder <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={varietyBreeder}
                    onChange={(e) => setVarietyBreeder(e.target.value)}
                    placeholder="e.g., PhilRice, IRRI, NSIC"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isAddingVariety}
                  />
                </div>
              </div>
            </div>

            {/* Maturity Days */}
            <div className="border-b border-slate-700 pb-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Maturity Days</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Typical Range (Optional)
                  </label>
                  <input
                    type="text"
                    value={varietyMaturityRange}
                    onChange={(e) => setVarietyMaturityRange(e.target.value)}
                    placeholder="e.g., 120 - 135"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isAddingVariety}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={varietyMaturityNotes}
                    onChange={(e) => setVarietyMaturityNotes(e.target.value)}
                    placeholder="Additional notes about maturity days..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    disabled={isAddingVariety}
                  />
                </div>
              </div>
            </div>

            {/* NPK Recommendations */}
            <div className="border-b border-slate-700 pb-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Recommended NPK per Hectare</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Nitrogen (N) (Optional)
                  </label>
                  <input
                    type="text"
                    value={varietyN}
                    onChange={(e) => setVarietyN(e.target.value)}
                    placeholder="e.g., 90 - 120 kg/ha"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isAddingVariety}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Phosphorus (P2O5) (Optional)
                  </label>
                  <input
                    type="text"
                    value={varietyP2O5}
                    onChange={(e) => setVarietyP2O5(e.target.value)}
                    placeholder="e.g., 30 - 60 kg/ha"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isAddingVariety}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Potassium (K2O) (Optional)
                  </label>
                  <input
                    type="text"
                    value={varietyK2O}
                    onChange={(e) => setVarietyK2O(e.target.value)}
                    placeholder="e.g., 30 - 60 kg/ha"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isAddingVariety}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Application Timing (Optional, one per line)
                </label>
                <textarea
                  value={varietyApplicationTiming}
                  onChange={(e) => setVarietyApplicationTiming(e.target.value)}
                  placeholder="e.g., Basal: basal compound at transplanting&#10;Split N: first split at tillering"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  disabled={isAddingVariety}
                />
              </div>
            </div>

            {/* General Notes */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">General Notes (Optional)</h3>
              <textarea
                value={varietyNotes}
                onChange={(e) => setVarietyNotes(e.target.value)}
                placeholder="Additional notes about this variety..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                disabled={isAddingVariety}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddVarietyModalOpen(false);
                setVarietyName('');
                setVarietyAliases('');
                setVarietyBreeder('');
                setVarietyMaturityRange('');
                setVarietyMaturityNotes('');
                setVarietyN('');
                setVarietyP2O5('');
                setVarietyK2O('');
                setVarietyApplicationTiming('');
                setVarietyNotes('');
              }}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              disabled={isAddingVariety}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddVariety}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={isAddingVariety}
            >
              {isAddingVariety ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Sprout className="mr-2 h-4 w-4" />
                  Add Variety
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Rice Variety Modal */}
      <Dialog open={isViewVarietyModalOpen} onOpenChange={setIsViewVarietyModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
              <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${
                selectedVariety?.source === 'static'
                  ? 'from-blue-500 to-blue-600'
                  : 'from-green-500 to-emerald-600'
              }`}>
                {selectedVariety?.source === 'static' ? (
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                ) : (
                  <Sprout className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl text-white break-words">{selectedVariety?.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs rounded flex-shrink-0 ${
                    selectedVariety?.source === 'static'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-green-500/20 text-green-300 border border-green-500/30'
                  }`}>
                    {selectedVariety?.source === 'static' ? 'Static Data' : 'Admin-Added'}
                  </span>
                </div>
              </div>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-slate-400">
              Complete information about this rice variety
            </DialogDescription>
          </DialogHeader>
          
          {selectedVariety && (
            <div className="space-y-4 mt-4">
              {/* Basic Information */}
              <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4 border border-slate-600/50">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Breeder</p>
                    <p className="text-xs sm:text-sm text-white break-words">{selectedVariety.breeder || 'Not specified'}</p>
                  </div>
                  {selectedVariety.aliases && selectedVariety.aliases.length > 0 && (
                    <div className="sm:col-span-1">
                      <p className="text-xs text-slate-400 mb-1">Aliases</p>
                      <p className="text-xs sm:text-sm text-white break-words">
                        {Array.isArray(selectedVariety.aliases) 
                          ? selectedVariety.aliases.join(', ') 
                          : selectedVariety.aliases}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Maturity Days */}
              <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4 border border-slate-600/50">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3">Maturity Days</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Typical Range</p>
                    <p className="text-xs sm:text-sm text-white break-words">
                      {selectedVariety.maturity_days?.typical_range || selectedVariety.maturity_days || 'Not specified'}
                    </p>
                  </div>
                  {selectedVariety.maturity_days?.notes && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Notes</p>
                      <p className="text-xs sm:text-sm text-slate-300 break-words">{selectedVariety.maturity_days.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* NPK Recommendations */}
              {selectedVariety.recommended_npk_per_ha && (
                <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4 border border-slate-600/50">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3">Recommended NPK per Hectare</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Nitrogen (N)</p>
                      <p className="text-xs sm:text-sm text-white break-words">{selectedVariety.recommended_npk_per_ha.N || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Phosphorus (P2O5)</p>
                      <p className="text-xs sm:text-sm text-white break-words">{selectedVariety.recommended_npk_per_ha.P2O5 || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Potassium (K2O)</p>
                      <p className="text-xs sm:text-sm text-white break-words">{selectedVariety.recommended_npk_per_ha.K2O || 'Not specified'}</p>
                    </div>
                  </div>
                  {selectedVariety.recommended_npk_per_ha.application_timing && 
                   selectedVariety.recommended_npk_per_ha.application_timing.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Application Timing</p>
                      <ul className="list-disc list-inside space-y-1">
                        {Array.isArray(selectedVariety.recommended_npk_per_ha.application_timing) 
                          ? selectedVariety.recommended_npk_per_ha.application_timing.map((timing: string, idx: number) => (
                              <li key={idx} className="text-xs sm:text-sm text-slate-300 break-words">{timing}</li>
                            ))
                          : <li className="text-xs sm:text-sm text-slate-300 break-words">{selectedVariety.recommended_npk_per_ha.application_timing}</li>
                        }
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Growth Stages */}
              {selectedVariety.growth_stages_start_days && Object.keys(selectedVariety.growth_stages_start_days).length > 0 && (
                <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4 border border-slate-600/50">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3">Growth Stages</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedVariety.growth_stages_start_days).map(([stage, days]) => (
                      <div key={stage} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-600/30 last:border-0 gap-1">
                        <p className="text-xs text-slate-400 capitalize break-words">{stage.replace(/_/g, ' ')}</p>
                        <p className="text-xs sm:text-sm text-white break-words">{days as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agronomic Stats */}
              {selectedVariety.agronomic_stats && Object.keys(selectedVariety.agronomic_stats).length > 0 && (
                <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4 border border-slate-600/50">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3">Agronomic Statistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(selectedVariety.agronomic_stats).map(([key, value]) => (
                      key !== 'notes' && (
                        <div key={key}>
                          <p className="text-xs text-slate-400 mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="text-xs sm:text-sm text-white break-words">{value as string}</p>
                        </div>
                      )
                    ))}
                    {selectedVariety.agronomic_stats.notes && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-400 mb-1">Notes</p>
                        <p className="text-xs sm:text-sm text-slate-300 break-words">{selectedVariety.agronomic_stats.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Disease and Pest Reaction */}
              {selectedVariety.disease_and_pest_reaction && Object.keys(selectedVariety.disease_and_pest_reaction).length > 0 && (
                <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4 border border-slate-600/50">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3">Disease and Pest Reaction</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedVariety.disease_and_pest_reaction).map(([disease, reaction]) => (
                      disease !== 'source' && (
                        <div key={disease} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-600/30 last:border-0 gap-1">
                          <p className="text-xs text-slate-400 capitalize break-words">{disease.replace(/_/g, ' ')}</p>
                          <p className="text-xs sm:text-sm text-white break-words">{reaction as string}</p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* General Notes */}
              {selectedVariety.notes && (
                <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4 border border-slate-600/50">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3">Notes</h3>
                  <p className="text-xs sm:text-sm text-slate-300 break-words">{selectedVariety.notes}</p>
                </div>
              )}

              {/* Admin Info */}
              {selectedVariety.source === 'admin' && selectedVariety.addedBy && (
                <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4 border border-slate-600/50">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3">Admin Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Added By</p>
                      <p className="text-xs sm:text-sm text-white break-words">{selectedVariety.addedBy}</p>
                    </div>
                    {selectedVariety.createdAt && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Date Added</p>
                        <p className="text-xs sm:text-sm text-white break-words">
                          {selectedVariety.createdAt?.toDate 
                            ? selectedVariety.createdAt.toDate().toLocaleString()
                            : new Date(selectedVariety.createdAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsViewVarietyModalOpen(false)}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
