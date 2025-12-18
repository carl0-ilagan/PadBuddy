'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Smartphone, 
  Sprout, 
  ArrowLeft,
  LayoutDashboard,
  Settings,
  Shield,
  FileText,
  Info,
  HelpCircle,
  Save,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCircle,
  ImageIcon,
  LogOut
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ADMIN_EMAILS = ['ricepaddy.contact@gmail.com'];

interface FAQ {
  question: string;
  answer: string;
}

interface ContactMethod {
  title: string;
  description: string;
  contact: string;
}

interface QuickTip {
  emoji: string;
  title: string;
  description: string;
}

interface TeamMember {
  name: string;
  role: string;
  image: string;
}

interface HelpContent {
  faqs: FAQ[];
  contactMethods: ContactMethod[];
  quickTips: QuickTip[];
}

interface AboutContent {
  mission: string;
  features: { title: string; description: string }[];
  benefits: string[];
  team: TeamMember[];
  version: string;
}

export default function AdminContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'help'>('about');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
  
  // About Content
  const [aboutContent, setAboutContent] = useState<AboutContent>({
    mission: 'PadBuddy is dedicated to empowering Filipino rice farmers with smart technology solutions. We provide an intuitive platform that helps farmers monitor their fields, track crop growth, and make data-driven decisions to improve yields and farming efficiency.',
    features: [
      { title: 'Field Management', description: 'Easily create and manage multiple rice fields with detailed information about each field\'s variety, planting date, and status.' },
      { title: 'Device Monitoring', description: 'Connect and monitor IoT devices across your paddies to track real-time sensor data including NPK levels, temperature, and humidity.' },
      { title: 'Growth Tracking', description: 'Track your rice crop\'s growth stages automatically based on planting date and variety, with recommended activities for each stage.' },
      { title: 'Data Analytics', description: 'View comprehensive statistics and trends for your fields, helping you make informed decisions about your farming operations.' }
    ],
    benefits: [
      'Real-time monitoring of your rice fields',
      'Automated growth stage tracking',
      'NPK level monitoring for optimal fertilization',
      'Device status alerts and notifications',
      'Comprehensive field statistics and analytics',
      'Support for multiple rice varieties',
      'Mobile-first design for on-the-go access',
      'Offline capability with PWA support'
    ],
    team: [
      { name: 'Theus Vito', role: 'Full Stack Main Programmer', image: '/Theus Vito.jpg' },
      { name: 'Kai Manguiflor', role: 'Hardware', image: '/Kai Manguiflor.jpg' },
      { name: 'Lester Bruit', role: 'Hardware', image: '/Lester Bruit.jpg' },
      { name: 'Carl Ilagan', role: 'Front End', image: '/Carl Ilagan.jpg' },
      { name: 'Allan Pedraza', role: 'Documentation', image: '/Allan Pedraza.jpg' }
    ],
    version: '1.0.0'
  });

  // Help Content
  const [helpContent, setHelpContent] = useState<HelpContent>({
    faqs: [
      { question: 'How do I add a new field?', answer: 'Click the \'+\' button on the home page, fill in the field details (name, description, rice variety, and start date), then add your paddies and connect devices.' },
      { question: 'How do I connect a device to my field?', answer: 'When adding a new field, you\'ll be prompted to add a paddy and connect a device. Enter the device ID from your physical device to connect it.' },
      { question: 'What rice varieties are supported?', answer: 'PadBuddy supports various rice varieties including IR64, NSIC Rc216, NSIC Rc222, and more. Check the Rice Varieties page for a complete list with detailed information.' },
      { question: 'How do I track my field\'s growth stages?', answer: 'Navigate to your field\'s detail page and check the Overview tab. It shows the current growth stage, progress, and recommended activities based on your rice variety.' }
    ],
    contactMethods: [
      { title: 'Email Support', description: 'Send us an email for assistance', contact: 'support@padbuddy.ph' },
      { title: 'Phone Support', description: 'Call us during business hours', contact: '+63 (2) 1234-5678' },
      { title: 'Live Chat', description: 'Chat with our support team', contact: 'Available 24/7' }
    ],
    quickTips: [
      { emoji: '📱', title: 'Mobile First', description: 'PadBuddy is optimized for mobile devices, making it easy to monitor your fields on the go.' },
      { emoji: '🌾', title: 'Variety Selection', description: 'Choose the right rice variety for your field to get accurate growth stage tracking and recommendations.' },
      { emoji: '📊', title: 'Regular Monitoring', description: 'Check your field statistics regularly to stay on top of NPK levels, temperature, and humidity.' },
      { emoji: '🔔', title: 'Notifications', description: 'Enable notifications to get alerts about important field activities and device status updates.' }
    ]
  });

  // Collapsible sections with animation states
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    mission: true,
    features: false,
    benefits: false,
    team: false,
    faqs: true,
    contact: false,
    tips: false
  });

  // Animation states for items
  const [animatingItems, setAnimatingItems] = useState<{ [key: string]: 'adding' | 'removing' | null }>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (user) {
      const isUserAdmin = ADMIN_EMAILS.includes(user.email || '');
      setIsAdmin(isUserAdmin);
      if (isUserAdmin) {
        fetchContent();
      }
    }
    setLoading(false);
  }, [user]);

  const fetchContent = async () => {
    try {
      // Fetch About Content
      const aboutDoc = await getDoc(doc(db, 'settings', 'aboutContent'));
      if (aboutDoc.exists()) {
        const data = aboutDoc.data() as AboutContent;
        // Ensure team array exists
        if (!data.team) {
          data.team = [
            { name: 'Theus Vito', role: 'Full Stack Main Programmer', image: '/Theus Vito.jpg' },
            { name: 'Kai Manguiflor', role: 'Hardware', image: '/Kai Manguiflor.jpg' },
            { name: 'Lester Bruit', role: 'Hardware', image: '/Lester Bruit.jpg' },
            { name: 'Carl Ilagan', role: 'Front End', image: '/Carl Ilagan.jpg' },
            { name: 'Allan Pedraza', role: 'Documentation', image: '/Allan Pedraza.jpg' }
          ];
        }
        setAboutContent(data);
      }
      
      // Fetch Help Content
      const helpDoc = await getDoc(doc(db, 'settings', 'helpContent'));
      if (helpDoc.exists()) {
        setHelpContent(helpDoc.data() as HelpContent);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'aboutContent'), aboutContent);
      await setDoc(doc(db, 'settings', 'helpContent'), helpContent);
      alert('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Animated add/remove helpers
  const animateAdd = (key: string, callback: () => void) => {
    callback();
    setAnimatingItems(prev => ({ ...prev, [key]: 'adding' }));
    setTimeout(() => {
      setAnimatingItems(prev => ({ ...prev, [key]: null }));
    }, 300);
  };

  const animateRemove = (key: string, callback: () => void) => {
    setAnimatingItems(prev => ({ ...prev, [key]: 'removing' }));
    setTimeout(() => {
      callback();
      setAnimatingItems(prev => ({ ...prev, [key]: null }));
    }, 200);
  };

  // FAQ handlers
  const addFAQ = () => {
    const newIndex = helpContent.faqs.length;
    animateAdd(`faq-${newIndex}`, () => {
      setHelpContent(prev => ({
        ...prev,
        faqs: [...prev.faqs, { question: '', answer: '' }]
      }));
    });
  };

  const removeFAQ = (index: number) => {
    animateRemove(`faq-${index}`, () => {
      setHelpContent(prev => ({
        ...prev,
        faqs: prev.faqs.filter((_, i) => i !== index)
      }));
    });
  };

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    setHelpContent(prev => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => i === index ? { ...faq, [field]: value } : faq)
    }));
  };

  // Feature handlers
  const addFeature = () => {
    const newIndex = aboutContent.features.length;
    animateAdd(`feature-${newIndex}`, () => {
      setAboutContent(prev => ({
        ...prev,
        features: [...prev.features, { title: '', description: '' }]
      }));
    });
  };

  const removeFeature = (index: number) => {
    animateRemove(`feature-${index}`, () => {
      setAboutContent(prev => ({
        ...prev,
        features: prev.features.filter((_, i) => i !== index)
      }));
    });
  };

  const updateFeature = (index: number, field: 'title' | 'description', value: string) => {
    setAboutContent(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? { ...f, [field]: value } : f)
    }));
  };

  // Benefit handlers
  const addBenefit = () => {
    const newIndex = aboutContent.benefits.length;
    animateAdd(`benefit-${newIndex}`, () => {
      setAboutContent(prev => ({
        ...prev,
        benefits: [...prev.benefits, '']
      }));
    });
  };

  const removeBenefit = (index: number) => {
    animateRemove(`benefit-${index}`, () => {
      setAboutContent(prev => ({
        ...prev,
        benefits: prev.benefits.filter((_, i) => i !== index)
      }));
    });
  };

  const updateBenefit = (index: number, value: string) => {
    setAboutContent(prev => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => i === index ? value : b)
    }));
  };

  // Team handlers
  const addTeamMember = () => {
    const newIndex = aboutContent.team.length;
    animateAdd(`team-${newIndex}`, () => {
      setAboutContent(prev => ({
        ...prev,
        team: [...prev.team, { name: '', role: '', image: '' }]
      }));
    });
  };

  const removeTeamMember = (index: number) => {
    animateRemove(`team-${index}`, () => {
      setAboutContent(prev => ({
        ...prev,
        team: prev.team.filter((_, i) => i !== index)
      }));
    });
  };

  const updateTeamMember = (index: number, field: 'name' | 'role' | 'image', value: string) => {
    setAboutContent(prev => ({
      ...prev,
      team: prev.team.map((t, i) => i === index ? { ...t, [field]: value } : t)
    }));
  };

  // Quick Tip handlers
  const addQuickTip = () => {
    const newIndex = helpContent.quickTips.length;
    animateAdd(`tip-${newIndex}`, () => {
      setHelpContent(prev => ({
        ...prev,
        quickTips: [...prev.quickTips, { emoji: '💡', title: '', description: '' }]
      }));
    });
  };

  const removeQuickTip = (index: number) => {
    animateRemove(`tip-${index}`, () => {
      setHelpContent(prev => ({
        ...prev,
        quickTips: prev.quickTips.filter((_, i) => i !== index)
      }));
    });
  };

  const updateQuickTip = (index: number, field: 'emoji' | 'title' | 'description', value: string) => {
    setHelpContent(prev => ({
      ...prev,
      quickTips: prev.quickTips.map((tip, i) => i === index ? { ...tip, [field]: value } : tip)
    }));
  };

  // Contact handlers
  const updateContact = (index: number, field: 'title' | 'description' | 'contact', value: string) => {
    setHelpContent(prev => ({
      ...prev,
      contactMethods: prev.contactMethods.map((c, i) => i === index ? { ...c, [field]: value } : c)
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

  // Get animation class for items
  const getItemAnimationClass = (key: string, index: number) => {
    const state = animatingItems[key];
    if (state === 'adding') {
      return 'animate-in fade-in-0 slide-in-from-top-2 duration-300';
    }
    if (state === 'removing') {
      return 'animate-out fade-out-0 slide-out-to-right-2 duration-200';
    }
    return 'transition-all duration-200';
  };

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
            <Button onClick={() => router.push('/')} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
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
              <Button 
                onClick={saveContent}
                disabled={saving}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                <span className="hidden sm:inline">Save All</span>
              </Button>
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
                className={`w-full justify-start transition-all duration-200 ${
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
              <h1 className="text-lg sm:text-2xl font-bold text-white">Content Management</h1>
              <p className="text-xs sm:text-sm text-slate-400">Edit About & Help page content</p>
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-2 mb-4 sm:mb-6">
            <Button
              variant={activeTab === 'about' ? 'default' : 'outline'}
              onClick={() => setActiveTab('about')}
              className={`transition-all duration-200 ${activeTab === 'about' ? 'bg-green-600 hover:bg-green-700 scale-105' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
            >
              <Info className="h-4 w-4 mr-2" />
              About Page
            </Button>
            <Button
              variant={activeTab === 'help' ? 'default' : 'outline'}
              onClick={() => setActiveTab('help')}
              className={`transition-all duration-200 ${activeTab === 'help' ? 'bg-green-600 hover:bg-green-700 scale-105' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help Page
            </Button>
          </div>

          {/* About Page Content */}
          {activeTab === 'about' && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-left-4 duration-300">
              {/* Mission Section */}
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <CardHeader 
                  className="p-4 cursor-pointer hover:bg-slate-700/30 transition-all duration-200"
                  onClick={() => toggleSection('mission')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-white text-sm sm:text-base">Mission Statement</CardTitle>
                    </div>
                    <div className={`transform transition-transform duration-300 ${expandedSections.mission ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </CardHeader>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.mission ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <CardContent className="p-4 pt-0">
                    <Textarea
                      value={aboutContent.mission}
                      onChange={(e) => setAboutContent(prev => ({ ...prev, mission: e.target.value }))}
                      placeholder="Enter mission statement..."
                      className="bg-slate-700 border-slate-600 text-white min-h-[100px] transition-all duration-200 focus:ring-2 focus:ring-green-500"
                    />
                  </CardContent>
                </div>
              </Card>

              {/* Features Section */}
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <CardHeader 
                  className="p-4 cursor-pointer hover:bg-slate-700/30 transition-all duration-200"
                  onClick={() => toggleSection('features')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-white text-sm sm:text-base">Key Features ({aboutContent.features.length})</CardTitle>
                    </div>
                    <div className={`transform transition-transform duration-300 ${expandedSections.features ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </CardHeader>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.features ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <CardContent className="p-4 pt-0 space-y-3">
                    {aboutContent.features.map((feature, index) => (
                      <div 
                        key={index} 
                        className={`p-3 bg-slate-700/50 rounded-lg space-y-2 ${getItemAnimationClass(`feature-${index}`, index)}`}
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            value={feature.title}
                            onChange={(e) => updateFeature(index, 'title', e.target.value)}
                            placeholder="Feature title..."
                            className="bg-slate-700 border-slate-600 text-white flex-1 transition-all duration-200 focus:ring-2 focus:ring-green-500"
                          />
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => removeFeature(index)} 
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 hover:scale-110"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={feature.description}
                          onChange={(e) => updateFeature(index, 'description', e.target.value)}
                          placeholder="Feature description..."
                          className="bg-slate-700 border-slate-600 text-white text-sm transition-all duration-200 focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    ))}
                    <Button 
                      onClick={addFeature} 
                      variant="outline" 
                      className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-green-500 transition-all duration-200 hover:scale-[1.02]"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Feature
                    </Button>
                  </CardContent>
                </div>
              </Card>

              {/* Benefits Section */}
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <CardHeader 
                  className="p-4 cursor-pointer hover:bg-slate-700/30 transition-all duration-200"
                  onClick={() => toggleSection('benefits')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-white text-sm sm:text-base">Benefits ({aboutContent.benefits.length})</CardTitle>
                    </div>
                    <div className={`transform transition-transform duration-300 ${expandedSections.benefits ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </CardHeader>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.benefits ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <CardContent className="p-4 pt-0 space-y-2">
                    {aboutContent.benefits.map((benefit, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center gap-2 ${getItemAnimationClass(`benefit-${index}`, index)}`}
                      >
                        <Input
                          value={benefit}
                          onChange={(e) => updateBenefit(index, e.target.value)}
                          placeholder="Benefit..."
                          className="bg-slate-700 border-slate-600 text-white flex-1 transition-all duration-200 focus:ring-2 focus:ring-green-500"
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => removeBenefit(index)} 
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 hover:scale-110"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      onClick={addBenefit} 
                      variant="outline" 
                      className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-green-500 transition-all duration-200 hover:scale-[1.02]"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Benefit
                    </Button>
                  </CardContent>
                </div>
              </Card>

              {/* Team Section */}
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <CardHeader 
                  className="p-4 cursor-pointer hover:bg-slate-700/30 transition-all duration-200"
                  onClick={() => toggleSection('team')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5 text-green-500" />
                      <CardTitle className="text-white text-sm sm:text-base">Our Team ({aboutContent.team.length})</CardTitle>
                    </div>
                    <div className={`transform transition-transform duration-300 ${expandedSections.team ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </CardHeader>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.team ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <CardContent className="p-4 pt-0 space-y-3">
                    {aboutContent.team.map((member, index) => (
                      <div 
                        key={index} 
                        className={`p-4 bg-slate-700/50 rounded-lg ${getItemAnimationClass(`team-${index}`, index)}`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Preview */}
                          <div className="flex-shrink-0">
                            {member.image ? (
                              <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-green-500/50">
                                <Image
                                  src={member.image}
                                  alt={member.name || 'Team member'}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-16 w-16 rounded-full bg-slate-600 flex items-center justify-center border-2 border-dashed border-slate-500">
                                <UserCircle className="h-8 w-8 text-slate-400" />
                              </div>
                            )}
                          </div>
                          {/* Form Fields */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                value={member.name}
                                onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                                placeholder="Name..."
                                className="bg-slate-700 border-slate-600 text-white flex-1 transition-all duration-200 focus:ring-2 focus:ring-green-500"
                              />
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => removeTeamMember(index)} 
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 hover:scale-110"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <Input
                              value={member.role}
                              onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                              placeholder="Role (e.g., Full Stack Developer)..."
                              className="bg-slate-700 border-slate-600 text-white transition-all duration-200 focus:ring-2 focus:ring-green-500"
                            />
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              <Input
                                value={member.image}
                                onChange={(e) => updateTeamMember(index, 'image', e.target.value)}
                                placeholder="Image URL (e.g., /Theus Vito.jpg)..."
                                className="bg-slate-700 border-slate-600 text-white text-sm transition-all duration-200 focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button 
                      onClick={addTeamMember} 
                      variant="outline" 
                      className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-green-500 transition-all duration-200 hover:scale-[1.02]"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Team Member
                    </Button>
                  </CardContent>
                </div>
              </Card>

              {/* Version */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-slate-400">App Version:</label>
                    <Input
                      value={aboutContent.version}
                      onChange={(e) => setAboutContent(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="1.0.0"
                      className="bg-slate-700 border-slate-600 text-white w-32 transition-all duration-200 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Help Page Content */}
          {activeTab === 'help' && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              {/* FAQs Section */}
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <CardHeader 
                  className="p-4 cursor-pointer hover:bg-slate-700/30 transition-all duration-200"
                  onClick={() => toggleSection('faqs')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-white text-sm sm:text-base">FAQs ({helpContent.faqs.length})</CardTitle>
                    </div>
                    <div className={`transform transition-transform duration-300 ${expandedSections.faqs ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </CardHeader>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.faqs ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <CardContent className="p-4 pt-0 space-y-3">
                    {helpContent.faqs.map((faq, index) => (
                      <div 
                        key={index} 
                        className={`p-3 bg-slate-700/50 rounded-lg space-y-2 ${getItemAnimationClass(`faq-${index}`, index)}`}
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            value={faq.question}
                            onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                            placeholder="Question..."
                            className="bg-slate-700 border-slate-600 text-white flex-1 transition-all duration-200 focus:ring-2 focus:ring-green-500"
                          />
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => removeFAQ(index)} 
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 hover:scale-110"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={faq.answer}
                          onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                          placeholder="Answer..."
                          className="bg-slate-700 border-slate-600 text-white text-sm transition-all duration-200 focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    ))}
                    <Button 
                      onClick={addFAQ} 
                      variant="outline" 
                      className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-green-500 transition-all duration-200 hover:scale-[1.02]"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add FAQ
                    </Button>
                  </CardContent>
                </div>
              </Card>

              {/* Contact Methods Section */}
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <CardHeader 
                  className="p-4 cursor-pointer hover:bg-slate-700/30 transition-all duration-200"
                  onClick={() => toggleSection('contact')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-white text-sm sm:text-base">Contact Methods</CardTitle>
                    </div>
                    <div className={`transform transition-transform duration-300 ${expandedSections.contact ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </CardHeader>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.contact ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <CardContent className="p-4 pt-0 space-y-3">
                    {helpContent.contactMethods.map((contact, index) => (
                      <div key={index} className="p-3 bg-slate-700/50 rounded-lg space-y-2 transition-all duration-200">
                        <Input
                          value={contact.title}
                          onChange={(e) => updateContact(index, 'title', e.target.value)}
                          placeholder="Title (e.g., Email Support)"
                          className="bg-slate-700 border-slate-600 text-white transition-all duration-200 focus:ring-2 focus:ring-green-500"
                        />
                        <Input
                          value={contact.description}
                          onChange={(e) => updateContact(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="bg-slate-700 border-slate-600 text-white transition-all duration-200 focus:ring-2 focus:ring-green-500"
                        />
                        <Input
                          value={contact.contact}
                          onChange={(e) => updateContact(index, 'contact', e.target.value)}
                          placeholder="Contact info"
                          className="bg-slate-700 border-slate-600 text-white transition-all duration-200 focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    ))}
                  </CardContent>
                </div>
              </Card>

              {/* Quick Tips Section */}
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <CardHeader 
                  className="p-4 cursor-pointer hover:bg-slate-700/30 transition-all duration-200"
                  onClick={() => toggleSection('tips')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-white text-sm sm:text-base">Quick Tips ({helpContent.quickTips.length})</CardTitle>
                    </div>
                    <div className={`transform transition-transform duration-300 ${expandedSections.tips ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </CardHeader>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.tips ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <CardContent className="p-4 pt-0 space-y-3">
                    {helpContent.quickTips.map((tip, index) => (
                      <div 
                        key={index} 
                        className={`p-3 bg-slate-700/50 rounded-lg space-y-2 ${getItemAnimationClass(`tip-${index}`, index)}`}
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            value={tip.emoji}
                            onChange={(e) => updateQuickTip(index, 'emoji', e.target.value)}
                            placeholder="Emoji"
                            className="bg-slate-700 border-slate-600 text-white w-16 text-center transition-all duration-200 focus:ring-2 focus:ring-green-500"
                          />
                          <Input
                            value={tip.title}
                            onChange={(e) => updateQuickTip(index, 'title', e.target.value)}
                            placeholder="Title"
                            className="bg-slate-700 border-slate-600 text-white flex-1 transition-all duration-200 focus:ring-2 focus:ring-green-500"
                          />
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => removeQuickTip(index)} 
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 hover:scale-110"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={tip.description}
                          onChange={(e) => updateQuickTip(index, 'description', e.target.value)}
                          placeholder="Description..."
                          className="bg-slate-700 border-slate-600 text-white text-sm transition-all duration-200 focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    ))}
                    <Button 
                      onClick={addQuickTip} 
                      variant="outline" 
                      className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-green-500 transition-all duration-200 hover:scale-[1.02]"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Quick Tip
                    </Button>
                  </CardContent>
                </div>
              </Card>
            </div>
          )}
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
