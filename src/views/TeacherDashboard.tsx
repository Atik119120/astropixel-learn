import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LayoutDashboard, BookOpen, Users, DollarSign, Briefcase, 
  MessageSquare, User, LogOut, Home, Moon, Sun, Globe,
  TrendingUp, PlayCircle, Video, Gift, Wallet, ChevronRight,
  Clock, CheckCircle, AlertCircle, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import learnLogoAssetJson from '@/assets/learn-with-alphazero-logo.png.asset.json';
const learnLogo = learnLogoAssetJson.url;
import { 
  useTeacherStats, 
  useTeacherCourses, 
  useTeacherStudents, 
  useTeacherRevenue,
  useTeacherPaidWorks,
  useTeacherTickets,
  useWithdrawals
} from '@/hooks/useTeacherData';

// Import tab components
import TeacherCoursesTab from '@/components/teacher/TeacherCoursesTab';
import TeacherStudentsTab from '@/components/teacher/TeacherStudentsTab';
import TeacherEarningsTab from '@/components/teacher/TeacherEarningsTab';
import TeacherPaidWorksTab from '@/components/teacher/TeacherPaidWorksTab';
import TeacherTicketsTab from '@/components/teacher/TeacherTicketsTab';
import TeacherProfileTab from '@/components/teacher/TeacherProfileTab';
import TeacherNoticesTab from '@/components/teacher/TeacherNoticesTab';
import TeacherChatTab from '@/components/teacher/TeacherChatTab';
import TeacherLiveClassesTab from '@/components/teacher/TeacherLiveClassesTab';
import TeacherLandingPagesTab from '@/components/teacher/TeacherLandingPagesTab';
import { Sparkles } from 'lucide-react';

const translations = {
  en: {
    dashboard: 'Dashboard',
    courses: 'My Courses',
    students: 'Students',
    earnings: 'Earnings',
    paidWorks: 'Paid Works',
    support: 'Support',
    profile: 'Profile',
    logout: 'Logout',
    home: 'Home',
    totalCourses: 'Total Courses',
    totalStudents: 'Enrolled Students',
    totalEarnings: 'Total Earnings',
    availableBalance: 'Available Balance',
    recordedCourses: 'Recorded Courses',
    liveCourses: 'Live Classes',
    freeCourses: 'Free Courses',
    recordedEarnings: 'Recorded Course Earnings',
    liveEarnings: 'Live Class Earnings',
    paidWorkEarnings: 'Paid Work Earnings',
    pendingWithdrawal: 'Pending Withdrawal',
    recentActivity: 'Recent Activity',
    quickStats: 'Quick Stats',
    welcomeBack: 'Welcome back',
    teacherPanel: 'Teacher Panel',
    loading: 'Loading...',
    noData: 'No data available',
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    courses: 'আমার কোর্স',
    students: 'শিক্ষার্থীরা',
    earnings: 'আয়',
    paidWorks: 'পেইড ওয়ার্ক',
    support: 'সাপোর্ট',
    profile: 'প্রোফাইল',
    logout: 'লগআউট',
    home: 'হোম',
    totalCourses: 'মোট কোর্স',
    totalStudents: 'এনরোল্ড শিক্ষার্থী',
    totalEarnings: 'মোট আয়',
    availableBalance: 'উপলব্ধ ব্যালেন্স',
    recordedCourses: 'রেকর্ডেড কোর্স',
    liveCourses: 'লাইভ ক্লাস',
    freeCourses: 'ফ্রি কোর্স',
    recordedEarnings: 'রেকর্ডেড কোর্স আয়',
    liveEarnings: 'লাইভ ক্লাস আয়',
    paidWorkEarnings: 'পেইড ওয়ার্ক আয়',
    pendingWithdrawal: 'পেন্ডিং উত্তোলন',
    recentActivity: 'সাম্প্রতিক কার্যকলাপ',
    quickStats: 'দ্রুত পরিসংখ্যান',
    welcomeBack: 'স্বাগতম',
    teacherPanel: 'টিচার প্যানেল',
    loading: 'লোড হচ্ছে...',
    noData: 'কোন ডাটা নেই',
  },
};

export default function TeacherDashboard() {
  const { user, profile, role, isLoading: authLoading, signOut } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = translations[language];

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Fetch all data
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useTeacherStats();
  const { courses, isLoading: coursesLoading, refetch: refetchCourses } = useTeacherCourses();
  const { students, isLoading: studentsLoading, refetch: refetchStudents } = useTeacherStudents();
  const { revenue, isLoading: revenueLoading, refetch: refetchRevenue } = useTeacherRevenue();
  const { works, isLoading: worksLoading, refetch: refetchWorks, updateWorkStatus } = useTeacherPaidWorks();
  const { tickets, isLoading: ticketsLoading, refetch: refetchTickets, updateTicketStatus, sendMessage } = useTeacherTickets();
  const { withdrawals, isLoading: withdrawalsLoading, refetch: refetchWithdrawals, createWithdrawal } = useWithdrawals();

  // Auth check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/student/login');
        return;
      }
      if (role !== 'teacher') {
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
        toast({
          title: 'Access Denied',
          description: 'You do not have teacher access.',
          variant: 'destructive',
        });
      }
    }
  }, [user, role, authLoading, navigate, toast]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'courses', icon: BookOpen, label: t.courses },
    { id: 'landing', icon: Sparkles, label: language === 'bn' ? 'ল্যান্ডিং পেজ' : 'Landing Pages' },
    { id: 'liveClasses', icon: Video, label: language === 'bn' ? 'লাইভ ক্লাস' : 'Live Classes' },
    { id: 'students', icon: Users, label: t.students },
    { id: 'notices', icon: MessageSquare, label: language === 'bn' ? 'নোটিশ' : 'Notices' },
    { id: 'chat', icon: MessageSquare, label: language === 'bn' ? 'চ্যাট' : 'Chat' },
    { id: 'earnings', icon: DollarSign, label: t.earnings },
    { id: 'paidWorks', icon: Briefcase, label: t.paidWorks },
    { id: 'support', icon: MessageSquare, label: t.support },
    { id: 'profile', icon: User, label: t.profile },
  ];

  if (authLoading || !user || role !== 'teacher') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed left-4 top-4 bottom-4 w-64 bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Logo + Profile */}
        <div className="p-3 border-b border-border/50 space-y-3">
          <div className="flex items-center gap-2">
            <img src={learnLogo} alt="Learn with Astropixel" className="h-8 w-auto object-contain dark:brightness-0 dark:invert" />
            <div>
              <p className="text-[10px] text-muted-foreground">Teacher Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-cyan-600 text-white text-[10px] font-bold">
                {profile?.full_name?.charAt(0) || 'T'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{profile?.full_name}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Teacher
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.id === 'support' && tickets.filter(t => t.status === 'open').length > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  {tickets.filter(t => t.status === 'open').length}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-border/50 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4" />
            {t.home}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {t.logout}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="ml-72 p-6 min-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Welcome Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {t.welcomeBack}, {profile?.full_name?.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-muted-foreground">{t.quickStats}</p>
                </div>
                <Button onClick={() => setActiveTab('courses')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {language === 'bn' ? 'নতুন কোর্স' : 'New Course'}
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.totalCourses}</p>
                        <p className="text-2xl font-bold">{stats?.totalCourses || 0}</p>
                      </div>
                      <BookOpen className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="text-green-500">{stats?.recordedCourses || 0} Recorded</span>
                      <span className="text-purple-500">{stats?.liveCourses || 0} Live</span>
                      <span className="text-gray-500">{stats?.freeCourses || 0} Free</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.totalStudents}</p>
                        <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                      </div>
                      <Users className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.totalEarnings}</p>
                        <p className="text-2xl font-bold">৳{stats?.totalEarnings?.toLocaleString() || 0}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.availableBalance}</p>
                        <p className="text-2xl font-bold">৳{stats?.availableBalance?.toLocaleString() || 0}</p>
                      </div>
                      <Wallet className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Earnings Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t.recordedEarnings}</p>
                        <p className="text-lg font-bold">৳{stats?.recordedEarnings?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">40% share</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Video className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t.liveEarnings}</p>
                        <p className="text-lg font-bold">৳{stats?.liveEarnings?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">70% share</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t.paidWorkEarnings}</p>
                        <p className="text-lg font-bold">৳{stats?.paidWorkEarnings?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">80% share</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Courses */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">{language === 'bn' ? 'সাম্প্রতিক কোর্স' : 'Recent Courses'}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('courses')}>
                    {language === 'bn' ? 'সব দেখুন' : 'View All'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {coursesLoading ? (
                    <p className="text-muted-foreground">{t.loading}</p>
                  ) : courses.length === 0 ? (
                    <p className="text-muted-foreground">{t.noData}</p>
                  ) : (
                    <div className="space-y-3">
                      {courses.slice(0, 3).map((course) => (
                        <div key={course.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{language === 'bn' ? course.title : course.title_en || course.title}</p>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                <span>{course.enrolled_students} students</span>
                                <span>•</span>
                                <span>৳{course.total_revenue?.toLocaleString() || 0}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={course.is_approved ? 'default' : 'secondary'}>
                            {course.is_approved ? (language === 'bn' ? 'প্রকাশিত' : 'Published') : (language === 'bn' ? 'পেন্ডিং' : 'Pending')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'courses' && (
            <TeacherCoursesTab 
              courses={courses} 
              isLoading={coursesLoading} 
              refetch={refetchCourses}
              language={language}
            />
          )}

          {activeTab === 'students' && (
            <TeacherStudentsTab 
              students={students} 
              isLoading={studentsLoading}
              language={language}
            />
          )}

          {activeTab === 'notices' && (
            <TeacherNoticesTab 
              courses={courses}
              language={language}
            />
          )}

          {activeTab === 'chat' && (
            <TeacherChatTab 
              courses={courses}
              language={language}
            />
          )}

          {activeTab === 'earnings' && (
            <TeacherEarningsTab 
              stats={stats}
              revenue={revenue}
              withdrawals={withdrawals}
              isLoading={revenueLoading || withdrawalsLoading}
              createWithdrawal={createWithdrawal}
              refetch={() => { refetchRevenue(); refetchWithdrawals(); }}
              language={language}
            />
          )}

          {activeTab === 'paidWorks' && (
            <TeacherPaidWorksTab 
              works={works} 
              isLoading={worksLoading}
              updateWorkStatus={updateWorkStatus}
              refetch={refetchWorks}
              language={language}
            />
          )}

          {activeTab === 'support' && (
            <TeacherTicketsTab 
              tickets={tickets}
              isLoading={ticketsLoading}
              updateTicketStatus={updateTicketStatus}
              sendMessage={sendMessage}
              refetch={refetchTickets}
              language={language}
            />
          )}

          {activeTab === 'liveClasses' && (
            <TeacherLiveClassesTab courses={courses} language={language} />
          )}

          {activeTab === 'landing' && (
            <TeacherLandingPagesTab />
          )}

          {activeTab === 'profile' && (
            <TeacherProfileTab language={language} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
