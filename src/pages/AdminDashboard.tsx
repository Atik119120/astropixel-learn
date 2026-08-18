import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { useCourses } from '@/hooks/useCourses';
import { useStudentCourseManagement, StudentWithCourses } from '@/hooks/useStudentCourses';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  BookOpen, 
  Key, 
  Users, 
  Plus, 
  Trash2, 
  LogOut,
  Copy,
  Check,
  X,
  User,
  Lock,
  Mail,
  Phone,
  UserPlus,
  Search,
  TrendingUp,
  Shield,
  Camera,
  Edit,
  DollarSign,
  Banknote,
  Moon,
  Sun,
  Languages,
  BarChart3,
  PieChart,
  Briefcase,
  UsersRound,
  Wrench,
  Settings,
  FileText,
  Link2,
  GraduationCap,
  Send,
  
  Ticket,
  Sparkles,
  RotateCcw,
  Home,
  Info,
  ChevronRight,
} from 'lucide-react';

import CourseManagement from '@/components/admin/CourseManagement';
import SiteSettingsManagement from '@/components/admin/SiteSettingsManagement';
import PageContentManagement from '@/components/admin/PageContentManagement';
import LearnPagesEditor from '@/components/admin/LearnPagesEditor';
import learnLogoAssetJson from '@/assets/learn-with-alphazero-logo.png.asset.json';
const learnLogo = learnLogoAssetJson.url;
import TeacherManagement from '@/components/admin/TeacherManagement';
import EmailManagement from '@/components/admin/EmailManagement';
import ApiKeyManagement from '@/components/admin/ApiKeyManagement';
import PaymentApiManagement from '@/components/admin/PaymentApiManagement';
import LandingPageManagement from '@/components/admin/LandingPageManagement';
import FeedbackViewer from '@/components/admin/FeedbackViewer';
import CommentManagement from '@/components/admin/CommentManagement';
import CouponManagement from '@/components/admin/CouponManagement';
import AdminAssistant from '@/components/admin/AdminAssistant';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

// Chart colors
const CHART_COLORS = ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#ec4899'];

function AdminDashboardInner() {
  const scope = "learn";
  const { user, profile, signOut, isAdmin, isLoading: authLoading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { courses, isLoading: coursesLoading, refetch: refetchCourses } = useCourses();
  const { 
    students: studentsList, 
    isLoading: studentsLoading, 
    refetch: refetchStudents,
    assignCourse: assignCourseToStudent,
    removeCourse: removeCourseFromStudent,
  } = useStudentCourseManagement();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Assign course dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState<StudentWithCourses | null>(null);
  const [selectedCourseToAssign, setSelectedCourseToAssign] = useState('');

  // Add student form state
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);

  // Admin profile state
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Add admin state
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Edit profile state
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Search state
  const [studentSearch, setStudentSearch] = useState('');

  // Delete students state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [deletingStudents, setDeletingStudents] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Admin list state
  const [admins, setAdmins] = useState<Array<{
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    created_at: string | null;
  }>>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Enrollment requests state
  const [enrollmentRequests, setEnrollmentRequests] = useState<Array<{
    id: string;
    user_id: string;
    course_id: string;
    student_name: string;
    student_email: string;
    status: string;
    message: string | null;
    phone_number: string | null;
    payment_method: string | null;
    transaction_id: string | null;
    created_at: string;
    course?: { title: string };
  }>>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Fetch all admins
  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      // Get all user_ids with admin role
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) {
        console.error('Error fetching admin roles:', rolesError);
        return;
      }

      if (!adminRoles || adminRoles.length === 0) {
        setAdmins([]);
        return;
      }

      const adminUserIds = adminRoles.map(r => r.user_id);

      // Get profiles for these users
      const { data: adminProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, avatar_url, created_at')
        .in('user_id', adminUserIds);

      if (profilesError) {
        console.error('Error fetching admin profiles:', profilesError);
        return;
      }

      setAdmins(adminProfiles || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Fetch enrollment requests
  const fetchEnrollmentRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('enrollment_requests')
        .select(`
          *,
          course:courses(title)
        `)
        .order('created_at', { ascending: false });

      if (!error) {
        setEnrollmentRequests((data || []) as any);
      }
    } catch (error) {
      console.error('Error fetching enrollment requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Approve enrollment request
  const approveEnrollment = async (request: typeof enrollmentRequests[0]) => {
    try {
      toast.loading(language === 'bn' ? 'Approving...' : 'Approving...', { id: 'approve' });
      
      // Call approve-enrollment edge function
      const { data, error } = await supabase.functions.invoke('approve-enrollment', {
        body: { enrollment_id: request.id }
      });

      if (error) {
        console.error('Approve error:', error);
        toast.error(language === 'bn' ? 'Failed to approve' : 'Error approving enrollment', { id: 'approve' });
        return;
      }

      if (data?.error) {
        toast.error(data.error, { id: 'approve' });
        return;
      }

      // Delete the request after successful approval
      await supabase
        .from('enrollment_requests')
        .delete()
        .eq('id', request.id);

      toast.success(language === 'bn' ? 'Approved! Student account created.' : 'Approved! Student account created.', { id: 'approve' });
      fetchEnrollmentRequests();
      refetchStudents();
    } catch (error) {
      console.error('Error approving enrollment:', error);
      toast.error(language === 'bn' ? 'Something went wrong' : 'Error approving enrollment', { id: 'approve' });
    }
  };

  // Reject enrollment request - delete instead of updating status
  const rejectEnrollment = async (requestId: string) => {
    const { error } = await supabase
      .from('enrollment_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      toast.error('Error rejecting request');
    } else {
      toast.success(language === 'bn' ? 'Rejected' : 'Request rejected');
      fetchEnrollmentRequests();
    }
  };

  // Refund UddoktaPay payment
  const refundPayment = async (request: typeof enrollmentRequests[0]) => {
    if (!request.transaction_id || request.payment_method !== 'uddoktapay') {
      toast.error(language === 'bn' ? 'Refund not possible' : 'Cannot refund this payment');
      return;
    }

    const confirmed = window.confirm(
      language === 'bn' 
        ? `Are you sure you want to refund ${request.student_name}?`
        : `Are you sure you want to refund ${request.student_name}?`
    );
    if (!confirmed) return;

    toast.loading(language === 'bn' ? 'Refunding...' : 'Processing refund...', { id: 'refund' });

    try {
      // Extract amount from message (format: "Amount: ৳XXX")
      const amountMatch = request.message?.match(/Amount:\s*৳?([\d,.]+)/);
      const amount = amountMatch ? amountMatch[1].replace(',', '') : '0';
      // Extract payment method from message
      const methodMatch = request.message?.match(/Method:\s*([^\s,]+)/);
      const paymentMethodName = methodMatch ? methodMatch[1] : 'unknown';

      const { data, error } = await supabase.functions.invoke('uddoktapay-refund', {
        body: {
          transaction_id: request.transaction_id,
          payment_method: paymentMethodName,
          amount: amount,
          product_name: (request as any).course?.title || 'Course',
          reason: 'Admin initiated refund',
        },
      });

      if (error || !data?.success) {
        toast.error(language === 'bn' ? 'Refund failed' : 'Refund failed', { id: 'refund' });
        return;
      }

      // Delete the enrollment request after refund
      await supabase.from('enrollment_requests').delete().eq('id', request.id);

      toast.success(language === 'bn' ? 'Refund successful!' : 'Refund successful!', { id: 'refund' });
      fetchEnrollmentRequests();
    } catch (err) {
      console.error('Refund error:', err);
      toast.error(language === 'bn' ? 'Failed to refund' : 'Error processing refund', { id: 'refund' });
    }
  };

  // Fetch admins and enrollment requests on mount
  useEffect(() => {
    if (user && isAdmin) {
      fetchAdmins();
      fetchEnrollmentRequests();
    }
  }, [user, isAdmin]);

  // Filter students by search
  const filteredStudents = studentsList.filter(s => {
    if (!studentSearch.trim()) return true;
    const searchLower = studentSearch.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower) ||
      (s.phone_number && s.phone_number.toLowerCase().includes(searchLower))
    );
  });

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return '';
    const locale = language === 'bn' ? 'bn-BD' : 'en-US';
    return new Date(value).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isRecent = (value: string | null | undefined) => {
    if (!value) return false;
    const created = new Date(value).getTime();
    if (Number.isNaN(created)) return false;
    return Date.now() - created < 24 * 60 * 60 * 1000;
  };

  const unassignedStudents = filteredStudents.filter(s => s.courses.length === 0);
  const assignedStudents = filteredStudents.filter(s => s.courses.length > 0);

  // Calculate course enrollment stats with sales
  const courseEnrollmentStats = courses.map(course => {
    const enrollmentCount = studentsList.filter(s => 
      s.courses.some(c => c.id === course.id)
    ).length;
    const coursePrice = (course as any).price || 0;
    const totalSales = enrollmentCount * coursePrice;
    return {
      ...course,
      enrollmentCount,
      price: coursePrice,
      totalSales
    };
  }).sort((a, b) => b.enrollmentCount - a.enrollmentCount);

  // Calculate total revenue
  const totalRevenue = courseEnrollmentStats.reduce((sum, course) => sum + course.totalSales, 0);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [user, isAdmin, authLoading, navigate]);

  // No loading screen - dashboard loads directly

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Student course assignment handlers
  const openStudentAssignDialog = (student: StudentWithCourses) => {
    setAssigningStudent(student);
    setSelectedCourseToAssign('');
    setShowAssignDialog(true);
  };

  const handleAssignCourse = async () => {
    if (!assigningStudent || !selectedCourseToAssign) return;

    const result = await assignCourseToStudent(assigningStudent.user_id, selectedCourseToAssign);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Course added');
    setShowAssignDialog(false);
  };

  const handleRemoveCourseFromStudent = async (userId: string, courseId: string) => {
    const result = await removeCourseFromStudent(userId, courseId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Course removed');
  };

  const availableCoursesForAssign = assigningStudent 
    ? courses.filter(c => !assigningStudent.courses.some(ac => ac.id === c.id))
    : [];

  // Delete single student
  const handleDeleteStudent = async (profileId: string, studentName: string) => {
    if (!confirm(language === 'bn' 
      ? `Delete "${studentName}"? This cannot be undone.` 
      : `Delete "${studentName}"? This cannot be undone.`)) {
      return;
    }

    try {
      toast.loading(language === 'bn' ? 'Deleting...' : 'Deleting...', { id: 'delete-student' });
      
      const { data, error } = await supabase.functions.invoke('delete-student', {
        body: { student_ids: [profileId] }
      });

      if (error) {
        toast.error(error.message || 'Error deleting student', { id: 'delete-student' });
        return;
      }

      if (data?.deleted_count > 0) {
        toast.success(language === 'bn' ? 'Successfully deleted' : 'Successfully deleted', { id: 'delete-student' });
        refetchStudents();
      } else {
        toast.error(data?.errors?.[0] || 'Failed to delete', { id: 'delete-student' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(language === 'bn' ? 'Something went wrong' : 'Error occurred', { id: 'delete-student' });
    }
  };

  // Bulk delete students
  const handleBulkDeleteStudents = async () => {
    if (selectedStudents.length === 0) return;
    
    setDeletingStudents(true);
    try {
      toast.loading(
        language === 'bn' 
          ? `Deleting ${selectedStudents.length} students...` 
          : `Deleting ${selectedStudents.length} students...`, 
        { id: 'bulk-delete' }
      );

      const { data, error } = await supabase.functions.invoke('delete-student', {
        body: { student_ids: selectedStudents }
      });

      if (error) {
        toast.error(error.message || 'Error deleting students', { id: 'bulk-delete' });
        return;
      }

      toast.success(
        language === 'bn' 
          ? `${data?.deleted_count || 0} students deleted` 
          : `${data?.deleted_count || 0} students deleted`, 
        { id: 'bulk-delete' }
      );
      
      setSelectedStudents([]);
      setShowDeleteConfirm(false);
      refetchStudents();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error(language === 'bn' ? 'Something went wrong' : 'Error occurred', { id: 'bulk-delete' });
    } finally {
      setDeletingStudents(false);
    }
  };

  // Toggle student selection for bulk delete
  const toggleStudentSelection = (profileId: string) => {
    setSelectedStudents(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  // Select all visible students
  const selectAllStudents = () => {
    const allProfileIds = filteredStudents.map(s => s.id);
    
    if (selectedStudents.length === allProfileIds.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(allProfileIds);
    }
  };

  // Add student handler - using Edge Function to avoid session switch
  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentPassword.trim()) {
      toast.error('Provide all information');
      return;
    }

    if (newStudentPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setAddingStudent(true);

    try {
      // Use Edge Function to create student without affecting admin session
      const { data, error } = await supabase.functions.invoke('create-student', {
        body: {
          full_name: newStudentName.trim(),
          email: newStudentEmail.trim(),
          password: newStudentPassword,
          phone_number: newStudentPhone.trim() || undefined,
        },
      });

      if (error) {
        toast.error(error.message || 'Failed to create student');
        setAddingStudent(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setAddingStudent(false);
        return;
      }

      toast.success('Student added successfully!');
      setShowAddStudentDialog(false);
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentPassword('');
      setNewStudentPhone('');
      refetchStudents();
    } catch (error) {
      console.error('Add student error:', error);
      toast.error('Something went wrong');
    } finally {
      setAddingStudent(false);
    }
  };

  // Change password handler
  const handleChangePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Provide all information');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
        setChangingPassword(false);
        return;
      }

      toast.success('Password changed!');
      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setChangingPassword(false);
    }
  };

  // Add admin handler
  const handleAddAdmin = async () => {
    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      toast.error('Provide all information');
      return;
    }

    if (newAdminPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setAddingAdmin(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: {
          full_name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          password: newAdminPassword,
        },
      });

      if (error) {
        toast.error(error.message || 'Failed to create Admin');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('New Admin added successfully!');
      setShowAddAdminDialog(false);
      setNewAdminName('');
      setNewAdminEmail('');
      // Refresh admin list
      fetchAdmins();
      setNewAdminPassword('');
    } catch (error) {
      console.error('Add admin error:', error);
      toast.error('Something went wrong');
    } finally {
      setAddingAdmin(false);
    }
  };

  // Update profile handler
  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      toast.error('Enter name');
      return;
    }

    setUpdatingProfile(true);

    try {
      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim() })
        .eq('user_id', user?.id);

      if (profileError) {
        toast.error(profileError.message);
        return;
      }

      // Update email if changed
      if (editEmail.trim() !== profile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editEmail.trim(),
        });

        if (emailError) {
          toast.error(emailError.message);
          return;
        }
        toast.info('Confirm new email to update email');
      }

      toast.success('Profile updated!');
      setShowEditProfileDialog(false);
      window.location.reload();
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Something went wrong');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Upload image files only');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user?.id);

      if (profileError) {
        toast.error(profileError.message);
        return;
      }

      toast.success('Profile picture uploaded!');
      window.location.reload();
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Something went wrong');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Prepare chart data for enrollment
  const enrollmentChartData = courseEnrollmentStats.slice(0, 6).map(course => ({
    name: course.title.length > 12 ? course.title.slice(0, 12) + '...' : course.title,
    students: course.enrollmentCount,
    sales: course.totalSales
  }));

  // Pie chart data for course distribution
  const pieChartData = courseEnrollmentStats.filter(c => c.enrollmentCount > 0).map((course, index) => ({
    name: course.title,
    value: course.enrollmentCount,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }));

  // Collapsible sidebar state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    lms_core: true,
    lms_more: false,
    cms: true,
    settings: true,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Navigation items - grouped logically
  // scopeTag: 'learn' | 'agency' | 'both' — controls visibility per selected site scope
  const lmsCoreItemsAll = [
    { id: 'courses', icon: BookOpen, label: language === 'bn' ? 'Course' : 'Courses', scopeTag: 'learn' as const },
    { id: 'students', icon: Users, label: language === 'bn' ? 'Student' : 'Students', scopeTag: 'learn' as const },
    { id: 'teachers', icon: GraduationCap, label: language === 'bn' ? 'Teacher' : 'Teachers', scopeTag: 'learn' as const },
    { id: 'requests', icon: Mail, label: language === 'bn' ? 'Request' : 'Requests', badge: enrollmentRequests.filter(r => r.status === 'pending').length, scopeTag: 'learn' as const },
  ];

  const lmsMoreItemsAll: any[] = [];

  const cmsItemsAll = [
    { id: 'homepage', icon: Home, label: language === 'bn' ? 'Homepage' : 'Homepage', scopeTag: 'both' as const },
    { id: 'learnpages', icon: GraduationCap, label: language === 'bn' ? 'Learn Pages' : 'Learn Pages', scopeTag: 'learn' as const },
    { id: 'about', icon: Info, label: 'About', scopeTag: 'both' as const },
    { id: 'services', icon: Wrench, label: language === 'bn' ? 'Service' : 'Services', scopeTag: 'agency' as const },
    { id: 'works', icon: Briefcase, label: language === 'bn' ? 'Works' : 'Works', scopeTag: 'agency' as const },
    { id: 'team', icon: UsersRound, label: language === 'bn' ? 'Team' : 'Team', scopeTag: 'agency' as const },
    { id: 'contact', icon: Phone, label: 'Contact', scopeTag: 'both' as const },
    { id: 'landing', icon: Sparkles, label: language === 'bn' ? 'Landing Page' : 'Landing Page', scopeTag: 'learn' as const },
    { id: 'footer', icon: Link2, label: language === 'bn' ? 'Footer' : 'Footer', scopeTag: 'both' as const },
  ];

  const settingsItemsAll = [
    { id: 'settings', icon: Settings, label: language === 'bn' ? 'Settings' : 'Settings', scopeTag: 'both' as const },
    { id: 'apikeys', icon: Key, label: language === 'bn' ? 'API Key' : 'API Keys', scopeTag: 'both' as const },
    { id: 'paymentapi', icon: Key, label: language === 'bn' ? 'Payment API' : 'Payment API', scopeTag: 'both' as const },
    { id: 'analytics', icon: BarChart3, label: language === 'bn' ? 'Analytics' : 'Analytics', scopeTag: 'both' as const },
    { id: 'email', icon: Send, label: language === 'bn' ? 'Email' : 'Email', scopeTag: 'both' as const },
    { id: 'feedback', icon: FileText, label: language === 'bn' ? 'Feedback' : 'Feedback', scopeTag: 'both' as const },
    { id: 'comments', icon: FileText, label: language === 'bn' ? 'Comment' : 'Comments', scopeTag: 'learn' as const },
    { id: 'coupons', icon: Ticket, label: language === 'bn' ? 'Coupon' : 'Coupons', scopeTag: 'learn' as const },
    { id: 'profile', icon: User, label: language === 'bn' ? 'Admin' : 'Admins', scopeTag: 'both' as const },
  ];

  const inScope = (t: 'learn' | 'agency' | 'both') => t === 'both' || t === scope;
  const lmsCoreItems = lmsCoreItemsAll.filter(i => inScope(i.scopeTag));
  const lmsMoreItems = lmsMoreItemsAll.filter(i => inScope(i.scopeTag));
  const cmsItems = cmsItemsAll.filter(i => inScope(i.scopeTag));
  const settingsItems = settingsItemsAll.filter(i => inScope(i.scopeTag));

  // AI Assistant panel state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const dashboardItem = { id: 'dashboard', icon: LayoutDashboard, label: language === 'bn' ? 'Dashboard' : 'Dashboard' };
  // Hidden settings sub-tabs (accessible only via the Settings hub cards)
  const settingsHubChildren = [
    { id: 'sitesettings', icon: Settings, label: 'Site Settings' },
    { id: 'paymentmethod', icon: Banknote, label: 'Payment Method' },
  ];
  const allNavItems = [dashboardItem, ...lmsCoreItems, ...lmsMoreItems, ...cmsItems, ...settingsItems, ...settingsHubChildren];

  // If active tab isn't visible in current scope, switch to dashboard
  useEffect(() => {
    if (!allNavItems.some(i => i.id === activeTab)) {
      setActiveTab('dashboard');
    }
  }, [scope]);




  // Auto-expand group when its item is active
  useEffect(() => {
    if (lmsMoreItems.some(item => item.id === activeTab) && !expandedGroups.lms_more) {
      setExpandedGroups(prev => ({ ...prev, lms_more: true }));
    }
  }, [activeTab]);

  // Render a nav button
  const renderNavButton = (item: { id: string; icon: any; label: string; badge?: number }, colorClass: string) => (
    <button
      key={item.id}
      onClick={() => setActiveTab(item.id)}
      className={`w-full flex items-center gap-2.5 px-2.5 md:px-3 py-2 md:py-2 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
        activeTab === item.id
          ? `bg-gradient-to-r ${colorClass} text-white shadow-md`
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
      }`}
    >
      <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? '' : 'group-hover:scale-110 transition-transform'}`} />
      <span className="hidden md:inline truncate">{item.label}</span>
      {item.badge && item.badge > 0 && (
        <span className={`absolute top-1 right-1 md:static md:ml-auto min-w-4 h-4 px-1 text-[10px] rounded-full flex items-center justify-center font-bold ${
          activeTab === item.id ? 'bg-white/25 text-white' : 'bg-red-500 text-white animate-pulse'
        }`}>
          {item.badge}
        </span>
      )}
    </button>
  );

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 ${language === 'bn' ? 'font-bengali' : ''}`}>
      {/* Minimal Floating Sidebar */}
      <aside className="fixed left-4 top-4 bottom-4 w-16 md:w-56 bg-white dark:bg-slate-900 rounded-2xl border border-border/50 shadow-xl shadow-black/5 z-50 flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="p-3 md:p-4 border-b border-border/50">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <img
              src={scope === 'learn' ? learnLogo : alphazeroLogoAsset.url}
              alt={scope === 'learn' ? 'Learn with Astropixel' : 'Astropixel Logo'}
              className={`w-auto flex-shrink-0 ${scope === 'learn' ? 'h-9 brightness-0 dark:invert' : 'h-8 brightness-0 dark:invert'}`}
            />
            <div className="hidden md:block">
              <h1 className={`font-bold text-sm bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent ${language === 'bn' ? 'font-[SabinaShorolipi]' : ''}`}>
                {language === 'bn' ? 'আলফা ড্যাশবোর্ড' : 'Alpha Dashboard'}
              </h1>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 md:p-3 space-y-1 overflow-y-auto scrollbar-none">
          {/* Dashboard */}
          <div className="mb-2">
            {renderNavButton(dashboardItem as any, 'from-fuchsia-500 to-pink-500')}
          </div>

          {/* LMS Core */}
          <div className="mb-2">
            <p className="hidden md:block text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest px-2 mb-1.5">
              {language === 'bn' ? 'এলএমএস' : 'LMS'}
            </p>
            <div className="space-y-0.5">
              {lmsCoreItems.map((item) => renderNavButton(item, 'from-sky-500 to-cyan-500'))}
            </div>
          </div>


          {/* CMS Section */}
          <div className="mb-2">
            <p className="hidden md:block text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest px-2 mb-1.5">
              {language === 'bn' ? 'ওয়েবসাইট' : 'Website'}
            </p>
            <div className="space-y-0.5">
              {cmsItems.map((item) => renderNavButton(item, 'from-violet-500 to-purple-500'))}
            </div>
          </div>

          {/* Settings - single entry, opens Settings hub */}
          <div>
            {renderNavButton(
              { id: 'settings', icon: Settings, label: language === 'bn' ? 'সেটিংস' : 'Settings' } as any,
              'from-amber-500 to-orange-500'
            )}
          </div>

        </nav>

        {/* Footer Actions - Language, Theme, Logout */}
        <div className="p-2 md:p-3 border-t border-border/50 space-y-2">
          {/* Language toggle removed — English only */}

          
          {/* Theme toggle removed */}

          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 md:px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-gradient-to-r from-red-500/10 to-rose-500/10 hover:from-red-500/20 hover:to-rose-500/20 border border-red-500/20 text-red-600 dark:text-red-400"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-white" />
            </div>
            <span className="hidden md:inline font-semibold">
              {language === 'bn' ? 'লগ আউট' : 'Logout'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`ml-24 md:ml-64 p-4 md:p-6 min-h-screen transition-all duration-300 ${isAssistantOpen ? 'mr-[380px]' : ''}`}>
        {/* Top Bar with Stats */}
        <div className="mb-6">
          {/* Greeting */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className={`text-2xl font-bold text-foreground ${language === 'bn' ? 'font-[SabinaShorolipi]' : ''}`}>
                  {language === 'bn' ? 'স্বাগতম' : 'Welcome'}, {profile?.full_name?.split(' ')[0]}
                </h1>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                  {scope === 'learn' ? (language === 'bn' ? 'লার্ন সাইট' : 'Learn Site') : (language === 'bn' ? 'এজেন্সি সাইট' : 'Agency Site')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'bn' ? 'আজ ' : 'Today is '}{new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <AdminSiteScopeSwitcher />
            <div className="flex items-center gap-2">
              {/* Alpha AI Button */}
              <button
                onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                className={`h-9 px-3.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all duration-300 group ${
                  isAssistantOpen
                    ? 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.03]'
                }`}
              >
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline tracking-wide">Alpha AI</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
              </button>
              {/* Profile Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowProfileDialog(true)}
                className="gap-2"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {profile?.full_name?.charAt(0)}
                  </div>
                )}
                <span className='hidden sm:inline'>{language === 'bn' ? 'প্রোফাইল' : 'Profile'}</span>
              </Button>
            </div>
          </div>

          {/* Quick Stats - Minimal Cards (Learn scope only) */}
          {scope === 'learn' && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { icon: BookOpen, value: courses.length, label: language === 'bn' ? 'Course' : 'Courses', color: 'text-sky-500' },
                { icon: Users, value: studentsList.length, label: language === 'bn' ? 'Student' : 'Students', color: 'text-emerald-500' },
                { icon: GraduationCap, value: courses.filter(c => c.is_published).length, label: language === 'bn' ? 'প্রকাশিত' : 'Published', color: 'text-violet-500' },
                { icon: Check, value: courses.filter(c => c.is_published).length, label: language === 'bn' ? 'প্রকাশিত' : 'Published', color: 'text-amber-500'}, { icon: Banknote, value: `৳${totalRevenue.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}`, label: language === 'bn' ? 'বিক্রি' : 'Revenue', color: 'text-rose-500' },
              ].map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-border/50 hover:border-border transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className={`text-xs text-muted-foreground mt-0.5 ${language === 'bn' ? 'font-[MahinRafid]' : ''}`}>
                        {stat.label}
                      </p>
                    </div>
                    <stat.icon className={`w-5 h-5 ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Content Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Hidden TabsList - controlled by sidebar */}
          <TabsList className="hidden">
            {allNavItems.map(item => (
              <TabsTrigger key={item.id} value={item.id}>{item.label}</TabsTrigger>
            ))}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {scope === 'agency' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'homepage', icon: Home, label: 'Homepage', desc: 'Landing sections', gradient: 'from-fuchsia-500 to-pink-500' },
                    { id: 'about', icon: Info, label: 'About', desc: 'Story & values', gradient: 'from-indigo-500 to-blue-500' },
                    { id: 'services', icon: Wrench, label: 'Services', desc: 'Offerings & pricing', gradient: 'from-emerald-500 to-teal-500' },
                    { id: 'works', icon: Briefcase, label: 'Works', desc: 'Portfolio & projects', gradient: 'from-violet-500 to-purple-500' },
                    { id: 'team', icon: UsersRound, label: 'Team', desc: 'Members & roles', gradient: 'from-sky-500 to-cyan-500' },
                    { id: 'contact', icon: Phone, label: 'Contact', desc: 'Info & socials', gradient: 'from-amber-500 to-orange-500' },
                    { id: 'footer', icon: Link2, label: 'Footer', desc: 'Links & bottom bar', gradient: 'from-slate-500 to-slate-700' },
                    { id: 'settings', icon: Settings, label: 'Settings', desc: 'Site & SEO config', gradient: 'from-rose-500 to-red-500' },
                  ].map((card) => (
                    <button
                      key={card.id}
                      onClick={() => setActiveTab(card.id)}
                      className="group text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border border-border/50 hover:border-transparent hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                        <card.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{card.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2 rounded-2xl p-5 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent border border-violet-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground mb-1">
                          {language === 'bn' ? 'অ্যাজেন্সি সাইট পরিচালনা' : 'Manage your Agency Site'}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {language === 'bn'
                            ? 'উপরের কার্ড থেকে সরাসরি যেকোনো পেজ এডিট করুন। প্রতিটি পরিবর্তন সাথে সাথে লাইভ হয়ে যাবে।'
                            : 'Jump straight into any page from the cards above. Every change goes live instantly.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAssistantOpen(true)}
                    className="text-left rounded-2xl p-5 bg-gradient-to-br from-primary/10 to-cyan-500/5 border border-primary/20 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-bold">Alpha AI</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'bn' ? 'AI দিয়ে দ্রুত কন্টেন্ট তৈরি করুন।' : 'Generate content instantly with AI.'}
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'courses', icon: BookOpen, label: 'Courses', desc: 'Manage courses', gradient: 'from-sky-500 to-cyan-500' },
                    { id: 'students', icon: Users, label: 'Students', desc: 'Enrolled users', gradient: 'from-emerald-500 to-teal-500' },
                    { id: 'teachers', icon: GraduationCap, label: 'Teachers', desc: 'Instructors', gradient: 'from-violet-500 to-purple-500' },
                    { id: 'requests', icon: Mail, label: 'Requests', desc: 'Enrollment queue', gradient: 'from-amber-500 to-orange-500' },
                    { id: 'analytics', icon: BarChart3, label: 'Analytics', desc: 'Traffic & sales', gradient: 'from-rose-500 to-pink-500' },
                    { id: 'email', icon: Send, label: 'Email', desc: 'Outbound mail', gradient: 'from-indigo-500 to-blue-500' },
                    { id: 'landing', icon: Sparkles, label: 'Landing', desc: 'Learn landing page', gradient: 'from-fuchsia-500 to-pink-500' },
                    { id: 'settings', icon: Settings, label: 'Settings', desc: 'Site config', gradient: 'from-slate-500 to-slate-700' },
                  ].map((card) => (
                    <button
                      key={card.id}
                      onClick={() => setActiveTab(card.id)}
                      className="group text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border border-border/50 hover:border-transparent hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                        <card.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{card.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <CourseManagement 
              courses={courses}
              coursesLoading={coursesLoading}
              refetchCourses={refetchCourses}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-semibold ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                {language === 'bn' ? 'Analytics ড্যাশবোর্ড' : 'Analytics Dashboard'}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Enrollment Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className={`text-lg flex items-center gap-2 ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                    <BarChart3 className="w-5 h-5 text-primary" />
                    {language === 'bn' ? 'Course অনুযায়ী Student' : 'Students by Course'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'bn' ? 'প্রতিটি Courseে কতজন Student এনরোল করেছে' : 'Number of students enrolled in each course'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {enrollmentChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={enrollmentChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10 }} 
                          className="text-muted-foreground"
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      {language === 'bn' ? 'কোনো ডাটা নেই' : 'No data available'}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Course Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className={`text-lg flex items-center gap-2 ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                    <PieChart className="w-5 h-5 text-primary" />
                    {language === 'bn' ? 'Student বন্টন' : 'Student Distribution'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'bn' ? 'কোন Courseে কত শতাংশ Student' : 'Percentage of students per course'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number, name: string) => [
                            `${value} ${language === 'bn' ? 'জন Student' : 'students'}`,
                            name
                          ]}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      {language === 'bn' ? 'কোনো ডাটা নেই' : 'No data available'}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sales Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className={`text-lg flex items-center gap-2 ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                    <Banknote className="w-5 h-5 text-amber-500" />
                    {language === 'bn' ? 'Course অনুযায়ী বিক্রি' : 'Sales by Course'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'bn' ? 'প্রতিটি Course থেকে কত টাকা আয় হয়েছে' : 'Revenue generated from each course'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {enrollmentChartData.some(d => d.sales > 0) ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={enrollmentChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10 }} 
                          className="text-muted-foreground"
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`৳${value.toLocaleString()}`, language === 'bn' ? 'বিক্রি' : 'Sales']}
                        />
                        <Bar dataKey="sales" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground flex-col gap-2">
                      <Banknote className="w-12 h-12 opacity-50" />
                      <p>{language === 'bn' ? 'এখনো কোনো বিক্রি নেই' : 'No sales yet'}</p>
                      <p className='text-xs'>{language === 'bn' ? 'Courseে দাম সেট করুন এবং Student এনরোল করুন' : 'Set course prices and enroll students'}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className={`text-lg flex items-center gap-2 ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    {language === 'bn' ? 'দ্রুত পরিসংখ্যান' : 'Quick Stats'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-primary/10 to-cyan-500/10 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-primary">{studentsList.length}</p>
                      <p className={`text-sm text-muted-foreground ${language === 'bn' ? 'font-[MahinRafid]' : ''}`}>
                        {language === 'bn' ? 'মোট Student' : 'Total Students'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-emerald-600">{courses.filter(c => c.is_published).length}</p>
                      <p className={`text-sm text-muted-foreground ${language === 'bn' ? 'font-[MahinRafid]' : ''}`}>
                        {language === 'bn' ? 'প্রকাশিত Course' : 'Published Courses'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-amber-600">৳{totalRevenue.toLocaleString()}</p>
                      <p className={`text-sm text-muted-foreground ${language === 'bn' ? 'font-[MahinRafid]' : ''}`}>
                        {language === 'bn' ? 'মোট আয়' : 'Total Revenue'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-violet-600">
                        {courses.length > 0 ? Math.round((studentsList.length / Math.max(courses.length, 1)) * 10) / 10 : 0}
                      </p>
                      <p className={`text-sm text-muted-foreground ${language === 'bn' ? 'font-[MahinRafid]' : ''}`}>
                        {language === 'bn' ? 'গড় Student/Course' : 'Avg Students/Course'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Top Courses */}
                  <div className="pt-4 border-t">
                    <h4 className={`text-sm font-medium mb-3 ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                      {language === 'bn' ? 'জনপ্রিয় Course' : 'Top Courses'}
                    </h4>
                    <div className="space-y-2">
                      {courseEnrollmentStats.slice(0, 3).map((course, index) => (
                        <div key={course.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-amber-500 text-white' : 
                              index === 1 ? 'bg-slate-400 text-white' : 
                              'bg-amber-700 text-white'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="text-sm truncate max-w-[150px]">{course.title}</span>
                          </div>
                          <Badge variant='secondary'>{course.enrollmentCount} {language === 'bn' ? 'জন' : ''}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers">
            <TeacherManagement language={language} />
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-semibold ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                {language === 'bn' ? 'এনরোলমেন্ট Request' : 'Enrollment Requests'}
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchEnrollmentRequests}
                disabled={loadingRequests}
                className="gap-2"
              >
                {loadingRequests ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
              </Button>
            </div>

            {loadingRequests ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : enrollmentRequests.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className='text-muted-foreground'>{language === 'bn' ? 'কোনো Request নেই' : 'No enrollment requests'}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {enrollmentRequests.map((request) => (
                  <Card key={request.id} className={`overflow-hidden ${request.status === 'pending' ? 'border-amber-500/50' : request.status === 'approved' ? 'border-green-500/50' : 'border-red-500/50'}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            request.status === 'pending' ? 'bg-amber-500/20' : 
                            request.status === 'approved' ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            <span className={`font-bold ${
                              request.status === 'pending' ? 'text-amber-600' : 
                              request.status === 'approved' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {request.student_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{request.student_name}</CardTitle>
                            <CardDescription className="truncate">{request.student_email}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={request.status === 'pending' ? 'secondary' : request.status === 'approved' ? 'default' : 'destructive'}>
                          {request.status === 'pending' ? (language === 'bn' ? 'পেন্ডিং' : 'Pending') : 
                           request.status === 'approved' ? (language === 'bn' ? 'অনুমোদিত' : 'Approved') : 
                           (language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {/* Course Info */}
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span className='truncate'>{request.course?.title || 'Unknown Course'}</span>
                      </div>

                      {/* Phone Number */}
                      {request.phone_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className='font-medium'>{language === 'bn' ? 'ফোন:' : 'Phone:'}</span>
                          <span>{request.phone_number}</span>
                        </div>
                      )}

                      {/* Payment Method */}
                      {request.payment_method && (
                        <div className="flex items-center gap-2 text-sm">
                          <Banknote className="w-4 h-4 text-muted-foreground" />
                          <span className='font-medium'>{language === 'bn' ? 'পেমেন্ট:' : 'Payment:'}</span>
                          <Badge variant="outline" className="text-xs">
                            {request.payment_method === 'bkash' ? 'বিকাশ' : 'নগদ'}
                          </Badge>
                        </div>
                      )}

                      {/* Transaction ID */}
                      {request.transaction_id && (
                        <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-lg">
                          <span className='font-medium text-primary'>{language === 'bn' ? 'TxID:' : 'TxID:'}</span>
                          <code className="text-xs font-mono flex-1">{request.transaction_id}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(request.transaction_id || '');
                              toast.success(language === 'bn' ? 'কপি হয়েছে' : 'Copied!');
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}

                      {/* Payment Type Message */}
                      {request.message && (
                        <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                          {request.message}
                        </p>
                      )}

                      {/* Date */}
                      <p className="text-xs text-muted-foreground">
                        {language === 'bn' ? 'তারিখ:' : 'Date:'} {formatDateTime(request.created_at)}
                      </p>

                      {/* Action Buttons */}
                      {request.status === 'pending' && (
                        <div className="flex gap-2 pt-2 flex-wrap">
                          <Button 
                            size="sm" 
                            className="flex-1 gap-1"
                            onClick={() => approveEnrollment(request)}
                          >
                            <Check className="w-3 h-3" />
                            {language === 'bn' ? 'অনুমোদন' : 'Approve'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="flex-1 gap-1"
                            onClick={() => rejectEnrollment(request.id)}
                          >
                            <X className="w-3 h-3" />
                            {language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                          </Button>
                          {request.payment_method === 'uddoktapay' && request.transaction_id && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 gap-1 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                              onClick={() => refundPayment(request)}
                            >
                              <RotateCcw className="w-3 h-3" />
                              {language === 'bn' ? 'রিফান্ড' : 'Refund'}
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pass Codes Tab - Removed */}

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className={`text-xl font-semibold ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                {language === 'bn' ? 'Student তালিকা' : 'Student List'}
              </h2>
              <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'bn' ? 'নাম, Email বা ফোন...' : 'Name, email or phone...'}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <Button onClick={() => setShowAddStudentDialog(true)} className="gap-2 whitespace-nowrap">
                  <UserPlus className="w-4 h-4" />
                  <span className='hidden sm:inline'>{language === 'bn' ? 'নতুন Student' : 'New Student'}</span>
                </Button>
              </div>
            </div>

            {/* Bulk Delete Controls */}
            {filteredStudents.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                  onChange={selectAllStudents}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedStudents.length > 0 
                    ? (language === 'bn' ? `${selectedStudents.length} selected` : `${selectedStudents.length} selected`)
                    : (language === 'bn' ? 'সব সিলেক্ট করুন' : 'Select all')}
                </span>
                {selectedStudents.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="gap-2 ml-auto"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deletingStudents}
                  >
                    <Trash2 className="w-4 h-4" />
                    {language === 'bn' ? `Delete ${selectedStudents.length}` : `Delete ${selectedStudents.length}`}
                  </Button>
                )}
              </div>
            )}

            {/* Bulk Delete Confirm Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-destructive">
                    {language === 'bn' ? '⚠️ নিশ্চিত করুন' : '⚠️ Confirm Deletion'}
                  </DialogTitle>
                  <DialogDescription>
                    {language === 'bn' 
                      ? `You are about to delete ${selectedStudents.length} students. This cannot be undone. All their data, progress, and certificates will be permanently removed.`
                      : `You are about to delete ${selectedStudents.length} students. This cannot be undone. All their data, progress, and certificates will be permanently removed.`}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleBulkDeleteStudents}
                    disabled={deletingStudents}
                  >
                    {deletingStudents 
                      ? (language === 'bn' ? 'Deleting...' : 'Deleting...')
                      : (language === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete All')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>


            {/* Course Enrollment & Sales Stats */}
            <Card className="bg-gradient-to-r from-primary/5 to-cyan-500/5 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-base flex items-center gap-2 ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {language === 'bn' ? 'Course এনরোলমেন্ট ও বিক্রি' : 'Course Enrollment & Sales'}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm">
                    <Banknote className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-amber-600">
                      {`Total: ৳${totalRevenue.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {courseEnrollmentStats.slice(0, 10).map((course) => (
                    <div 
                      key={course.id} 
                      className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-2xl font-bold text-primary">{course.enrollmentCount}</p>
                        {course.price > 0 && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            ৳{course.price}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate" title={course.title}>
                        {course.title}
                      </p>
                      {course.totalSales > 0 && (
                        <p className="text-xs font-medium text-amber-600 mt-1">
                          {language === 'bn'? `Sales: ৳${course.totalSales.toLocaleString('bn-BD')}` : `Sales: ৳${course.totalSales.toLocaleString()}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {courseEnrollmentStats.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {language === 'bn' ? 'কোনো Course নেই' : 'No courses'}
                  </p>
                )}
              </CardContent>
            </Card>
            
            {filteredStudents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {studentSearch
                      ? (language === 'bn' ? 'কোনো Student পাওয়া যায়নি' : 'No students found')
                      : (language === 'bn' ? 'কোনো Student নেই' : 'No students')}
                  </p>
                  {!studentSearch && (
                    <Button onClick={() => setShowAddStudentDialog(true)} className="mt-4 gap-2">
                      <UserPlus className="w-4 h-4" />
                      {language === 'bn' ? 'প্রথম Student যোগ করুন' : 'Add First Student'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {studentSearch && (
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn'? `${filteredStudents.length} Students found`
                      : `${filteredStudents.length} students found`}
                  </p>
                )}

                {/* New / Unassigned */}
                {!studentSearch && unassignedStudents.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-semibold ${language === 'bn' ? 'font-[Aloka]' : ''}`}>{language === 'bn' ? 'নতুন / Course দেওয়া হয়নি' : 'New / Unassigned'}</h3>
                      <Badge variant="outline">{unassignedStudents.length}</Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {unassignedStudents.map((student) => (
                        <Card key={student.id} className={`overflow-hidden ring-1 ring-primary/15 bg-primary/5 hover:border-primary/50 transition-colors ${selectedStudents.includes(student.id) ? 'ring-2 ring-destructive' : ''}`}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleStudentSelection(student.id)} className="rounded border-gray-300" onClick={(e) => e.stopPropagation()} />
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">{student.full_name?.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base truncate">{student.full_name}</CardTitle>
                                  {isRecent(student.created_at) && <Badge variant='secondary' className='text-xs'>{language === 'bn' ? 'নতুন' : 'New'}</Badge>}
                                </div>
                                <CardDescription className="truncate">{student.email}</CardDescription>
                              </div>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteStudent(student.id, student.full_name)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-3">
                            {student.phone_number && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {student.phone_number}</p>}
                            <div className="flex items-center justify-between text-sm">
                              <Badge variant='outline' className='text-xs'>{language === 'bn' ? 'Course নেই' : 'No course'}</Badge>
                              <Button variant="outline" size="sm" className="h-6 text-xs gap-1" onClick={() => openStudentAssignDialog(student)}>
                                <Plus className='w-3 h-3' />{language === 'bn' ? 'Course যোগ' : 'Add Course'}
                              </Button>
                            </div>
                            <p className='text-xs text-muted-foreground'>{language === 'bn' ? 'তৈরি:' : 'Created:'} {formatDateTime(student.created_at)}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned */}
                <div className="space-y-3">
                  {!studentSearch && (
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-semibold ${language === 'bn' ? 'font-[Aloka]' : ''}`}>{language === 'bn' ? 'Course দেওয়া আছে' : 'Assigned'}</h3>
                      <Badge variant="outline">{assignedStudents.length}</Badge>
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(studentSearch ? filteredStudents : assignedStudents).map((student) => (
                      <Card key={student.id} className={`overflow-hidden hover:border-primary/50 transition-colors ${selectedStudents.includes(student.id) ? 'ring-2 ring-destructive' : ''}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleStudentSelection(student.id)} className="rounded border-gray-300" onClick={(e) => e.stopPropagation()} />
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">{student.full_name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base truncate">{student.full_name}</CardTitle>
                                {isRecent(student.created_at) && <Badge variant='secondary' className='text-xs'>{language === 'bn' ? 'নতুন' : 'New'}</Badge>}
                              </div>
                              <CardDescription className="truncate">{student.email}</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteStudent(student.id, student.full_name)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          {student.phone_number && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {student.phone_number}</p>}
                          <div className="flex items-center justify-between text-sm">
                            <span className='text-muted-foreground'>{student.courses.length} {language === 'bn' ? 'Course' : 'courses'}</span>
                            <Button variant="outline" size="sm" className="h-6 text-xs gap-1" onClick={() => openStudentAssignDialog(student)}>
                              <Plus className='w-3 h-3' />{language === 'bn' ? 'Course যোগ' : 'Add Course'}
                            </Button>
                          </div>
                          {student.courses.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {student.courses.slice(0, 3).map((course) => (
                                <Badge key={course.id} variant="outline" className="text-xs gap-1">
                                  {course.title.length > 15 ? course.title.slice(0, 15) + '...' : course.title}
                                  <button onClick={() => handleRemoveCourseFromStudent(student.user_id, course.id)} className="ml-0.5 hover:text-destructive"><X className="w-3 h-3" /></button>
                                </Badge>
                              ))}
                              {student.courses.length > 3 && <Badge variant="outline" className="text-xs">+{student.courses.length - 3}</Badge>}
                            </div>
                          )}
                          <p className='text-xs text-muted-foreground'>{language === 'bn' ? 'তৈরি:' : 'Created:'} {formatDateTime(student.created_at)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Works Tab */}
          <TabsContent value="works" className="space-y-6">
            <WorksManagement />
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <TeamManagement />
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <ServicesManagement />
          </TabsContent>

          {/* Homepage Editor */}
          <TabsContent value="homepage" className="space-y-6">
            <HomepageEditor />
          </TabsContent>

          {/* Learn Pages Editor */}
          <TabsContent value="learnpages" className="space-y-6">
            <LearnPagesEditor />
          </TabsContent>


          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <ContactInfoManagement />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <AboutPageEditor />
          </TabsContent>




          {/* Footer Tab */}
          <TabsContent value="footer" className="space-y-6">
            <FooterManagement />
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-6">
            <EmailManagement language={language} />
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <FeedbackViewer />
          </TabsContent>


          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-6">
            <CommentManagement />
          </TabsContent>

          {/* AI Assistant removed from tabs - now a persistent side panel */}

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-6">
            <CouponManagement />
          </TabsContent>

          {/* Settings Hub */}
          <TabsContent value="settings" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{language === 'bn' ? 'অ্যাডমিন প্যানেল সেটিংস' : 'Admin Panel Settings'}</h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'যেকোনো একটি অপশন বেছে নিন' : 'Pick any option below to configure'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { id: 'sitesettings', icon: Settings, label: 'Site Settings', desc: 'Favicon, logo, site name', gradient: 'from-sky-500 to-cyan-500' },
                { id: 'paymentmethod', icon: Banknote, label: 'Payment Method', desc: 'Bkash, Nagad & payment APIs', gradient: 'from-emerald-500 to-teal-500' },
                { id: 'apikeys', icon: Key, label: 'API Keys', desc: 'Third-party service keys', gradient: 'from-violet-500 to-purple-500' },
                { id: 'analytics', icon: BarChart3, label: 'Analytics', desc: 'Traffic & sales', gradient: 'from-rose-500 to-pink-500' },
                { id: 'email', icon: Send, label: 'Email', desc: 'Outbound mail & threads', gradient: 'from-indigo-500 to-blue-500' },
                { id: 'feedback', icon: FileText, label: 'Feedback', desc: 'Student video feedback', gradient: 'from-fuchsia-500 to-pink-500' },
                { id: 'comments', icon: FileText, label: 'Comments', desc: 'Lesson comments & Q&A', scopeTag: 'learn', gradient: 'from-amber-500 to-orange-500' },
                { id: 'coupons', icon: Ticket, label: 'Coupons', desc: 'Discount codes', scopeTag: 'learn', gradient: 'from-yellow-500 to-amber-500' },
                { id: 'profile', icon: User, label: 'Admins', desc: 'Admin accounts', gradient: 'from-slate-500 to-slate-700' },
              ]
                .filter((c: any) => !c.scopeTag || c.scopeTag === scope)
                .map((card) => (
                <button
                  key={card.id}
                  onClick={() => setActiveTab(card.id)}
                  className="group text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border border-border/50 hover:border-transparent hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{card.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Site Settings (general) */}
          <TabsContent value="sitesettings" className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('settings')} className="gap-1.5 -ml-2">
              <ChevronRight className="w-4 h-4 rotate-180" />
              {language === 'bn' ? 'সেটিংসে ফিরে যান' : 'Back to Settings'}
            </Button>
            <SiteSettingsManagement filter="general" />
          </TabsContent>

          {/* Payment Method (Bkash/Nagad + Payment API combined) */}
          <TabsContent value="paymentmethod" className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('settings')} className="gap-1.5 -ml-2">
              <ChevronRight className="w-4 h-4 rotate-180" />
              {language === 'bn' ? 'সেটিংসে ফিরে যান' : 'Back to Settings'}
            </Button>
            <SiteSettingsManagement filter="payment" />
            <div className="pt-2 border-t border-border/50" />
            <PaymentApiManagement />
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="apikeys" className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('settings')} className="gap-1.5 -ml-2">
              <ChevronRight className="w-4 h-4 rotate-180" />
              {language === 'bn' ? 'সেটিংসে ফিরে যান' : 'Back to Settings'}
            </Button>
            <ApiKeyManagement />
          </TabsContent>

          <TabsContent value="landing" className="space-y-6">
            <LandingPageManagement />
          </TabsContent>





          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-semibold ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                {language === 'bn' ? 'Admin প্রোফাইল' : 'Admin Profile'}
              </h2>
              <Button onClick={() => setShowAddAdminDialog(true)} className="gap-2">
                <Shield className="w-4 h-4" />
                {language === 'bn' ? 'নতুন Admin যোগ' : 'Add New Admin'}
              </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Profile Info Card */}
              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle className={`text-lg flex items-center gap-2 ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                    <User className="w-5 h-5" />
                    {language === 'bn' ? 'প্রোফাইল তথ্য' : 'Profile Info'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative group">
                      {(profile as any)?.avatar_url ? (
                        <img 
                          src={(profile as any).avatar_url} 
                          alt={profile?.full_name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
                          <span className="text-3xl font-bold text-white">
                            {profile?.full_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        />
                        {uploadingAvatar ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                        ) : (
                          <Camera className="w-6 h-6 text-white" />
                        )}
                      </label>
                    </div>
                    <div className="mt-4">
                      <p className="font-semibold text-lg">{profile?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                      <Badge className="mt-2 bg-gradient-to-r from-primary to-cyan-600">Admin</Badge>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      setEditName(profile?.full_name || '');
                      setEditEmail(profile?.email || '');
                      setShowEditProfileDialog(true);
                    }} 
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {language === 'bn' ? 'প্রোফাইল এডিট করুন' : 'Edit Profile'}
                  </Button>
                </CardContent>
              </Card>

              {/* Password Change Card */}
              <Card>
                <CardHeader>
                  <CardTitle className={`text-lg flex items-center gap-2 ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                    <Lock className="w-5 h-5" />
                    {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'bn' ? 'অ্যাকাউন্ট সুরক্ষিত রাখতে পাসওয়ার্ড পরিবর্তন করুন' : 'Change password to keep your account secure'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowPasswordDialog(true)} 
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    {language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                  </Button>
                </CardContent>
              </Card>

              {/* Add Admin Card */}
              <Card className="border-dashed border-2">
                <CardHeader>
                  <CardTitle className={`text-lg flex items-center gap-2 ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                    <Shield className="w-5 h-5" />
                    {language === 'bn' ? 'নতুন Admin' : 'New Admin'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'bn' ? 'আরেকজন Admin যোগ করুন যারা সব ম্যানেজ করতে পারবে' : 'Add another admin who can manage everything'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowAddAdminDialog(true)} 
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {language === 'bn' ? 'Admin যোগ করুন' : 'Add Admin'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Admin List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={`text-lg flex items-center gap-2 ${language === 'bn' ? 'font-[Aloka]' : ''}`}>
                      <Shield className="w-5 h-5" />
                      {language === 'bn' ? `All Admins (${admins.length})` : `All Admins (${admins.length})`}
                    </CardTitle>
                    <CardDescription>
                      {language === 'bn' ? 'যারা এই প্ল্যাটফর্ম ম্যানেজ করতে পারে' : 'Those who can manage this platform'}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchAdmins}
                    disabled={loadingAdmins}
                    className="gap-2"
                  >
                    {loadingAdmins ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAdmins ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  </div>
                ) : admins.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{language === 'bn' ? 'কোনো Admin পাওয়া যায়নি' : 'No admins found'}</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {admins.map((admin) => (
                      <div 
                        key={admin.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border ${
                          admin.user_id === user?.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        } transition-colors`}
                      >
                        {admin.avatar_url ? (
                          <img 
                            src={admin.avatar_url} 
                            alt={admin.full_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-white">
                              {admin.full_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate flex items-center gap-2">
                            {admin.full_name}
                            {admin.user_id === user?.id && (
                              <Badge variant="secondary" className="text-xs">
                                {language === 'bn' ? 'আপনি' : 'You'}
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{admin.email}</p>
                          {admin.created_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {language === 'bn' ? 'যোগদান' : 'Joined'}: {new Date(admin.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Assign Course Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'bn' ? 'Course যোগ করুন' : 'Add Course'}</DialogTitle>
            <DialogDescription>
              {language === 'bn' 
                ? <><code className="font-mono bg-muted px-2 py-1 rounded">{assigningStudent?.full_name}</code> Select a course to assign below]</>
                : <>Select a course to assign to <code className="font-mono bg-muted px-2 py-1 rounded">{assigningStudent?.full_name}</code></>
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {availableCoursesForAssign.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'সব Course ইতিমধ্যে অ্যাসাইন করা হয়েছে' : 'All courses are already assigned'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
                {availableCoursesForAssign.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourseToAssign(course.id)}
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all w-full min-w-0 overflow-hidden ${
                      selectedCourseToAssign === course.id 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-16 h-12 rounded-md bg-muted overflow-hidden flex-shrink-0">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{course.title}</p>
                      {course.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{course.description}</p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedCourseToAssign === course.id 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground'
                    }`}>
                      {selectedCourseToAssign === course.id && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button onClick={handleAssignCourse} disabled={!selectedCourseToAssign}>
              {language === 'bn' ? 'যোগ করুন' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              {language === 'bn' ? 'নতুন Student যোগ করুন' : 'Add New Student'}
            </DialogTitle>
            <DialogDescription>
              {language === 'bn' ? 'Studentের তথ্য দিন' : 'Enter student details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor='student-name'>{language === 'bn' ? 'পুরো নাম' : 'Full Name'}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="student-name"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder={language === 'bn' ? 'Studentের নাম' : 'Student name'}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor='student-email'>{language === 'bn' ? 'Email' : 'Email'}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="student-email"
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="student@email.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor='student-password'>{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="student-password"
                  type="password"
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                  placeholder={language === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'At least 6 characters'}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor='student-passcode'>{language === 'bn' ? 'ফোন নম্বর (ঐচ্ছিক)' : 'Phone Number (Optional)'}</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="student-passcode"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  placeholder={language === 'bn' ? 'ফোন নম্বর' : 'Phone number'}
                  className="pl-10 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'bn' ? 'ফোন নম্বর দিলে Student সেটার সাথে লিংক হবে' : 'Enter student phone number'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button onClick={handleAddStudent} disabled={addingStudent}>
              {addingStudent ? (language === 'bn' ? 'যোগ হচ্ছে...' : 'Adding...') : (language === 'bn' ? 'Student যোগ করুন' : 'Add Student')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
            </DialogTitle>
            <DialogDescription>
              {language === 'bn' ? 'নতুন পাসওয়ার্ড দিন' : 'Enter your new password'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor='new-password'>{language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'At least 6 characters'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor='confirm-password'>{language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={language === 'bn' ? 'আবার পাসওয়ার্ড দিন' : 'Re-enter password'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? (language === 'bn' ? 'পরিবর্তন হচ্ছে...' : 'Changing...') : (language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'bn' ? 'Admin প্রোফাইল' : 'Admin Profile'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4">
              {(profile as any)?.avatar_url ? (
                <img 
                  src={(profile as any).avatar_url} 
                  alt={profile?.full_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {profile?.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-semibold text-xl">{profile?.full_name}</p>
                <p className="text-muted-foreground">{profile?.email}</p>
                <Badge className="mt-2">Admin</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setShowProfileDialog(false);
                  setEditName(profile?.full_name || '');
                  setEditEmail(profile?.email || '');
                  setShowEditProfileDialog(true);
                }} 
                variant="outline"
                className="flex-1 gap-2"
              >
                <Edit className="w-4 h-4" />
                {language === 'bn' ? 'এডিট' : 'Edit'}
              </Button>
              <Button 
                onClick={() => {
                  setShowProfileDialog(false);
                  setShowPasswordDialog(true);
                }} 
                variant="outline"
                className="flex-1 gap-2"
              >
                <Lock className="w-4 h-4" />
                {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowProfileDialog(false)}>
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              {language === 'bn' ? 'প্রোফাইল এডিট' : 'Edit Profile'}
            </DialogTitle>
            <DialogDescription>
              {language === 'bn' ? 'আপনার নাম এবং Email পরিবর্তন করুন' : 'Change your name and email'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor='edit-name'>{language === 'bn' ? 'নাম' : 'Name'}</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={language === 'bn' ? 'আপনার নাম' : 'Your name'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor='edit-email'>{language === 'bn' ? 'Email' : 'Email'}</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder={language === 'bn' ? 'আপনার Email' : 'Your email'}
              />
              <p className="text-xs text-muted-foreground">
                {language === 'bn' ? 'Email পরিবর্তন করলে নতুন Emailে confirm করতে হবে' : 'Email change requires confirmation on new email'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProfileDialog(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button onClick={handleUpdateProfile} disabled={updatingProfile}>
              {updatingProfile ? (language === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...') : (language === 'bn' ? 'আপডেট করুন' : 'Update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {language === 'bn' ? 'নতুন Admin যোগ করুন' : 'Add New Admin'}
            </DialogTitle>
            <DialogDescription>
              {language === 'bn' ? 'নতুন Admin এর তথ্য দিন' : 'Enter new admin details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor='admin-name'>{language === 'bn' ? 'নাম' : 'Name'}</Label>
              <Input
                id="admin-name"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder={language === 'bn' ? 'Admin এর নাম' : 'Admin name'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor='admin-email'>{language === 'bn' ? 'Email' : 'Email'}</Label>
              <Input
                id="admin-email"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor='admin-password'>{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</Label>
              <Input
                id="admin-password"
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder={language === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'At least 6 characters'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAdminDialog(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button onClick={handleAddAdmin} disabled={addingAdmin}>
              {addingAdmin ? (language === 'bn' ? 'যোগ হচ্ছে...' : 'Adding...') : (language === 'bn' ? 'Admin যোগ করুন' : 'Add Admin')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Side Panel */}
      <AdminAssistant isOpen={isAssistantOpen} onToggle={() => setIsAssistantOpen(false)} />
    </div>
  );
}

export default AdminDashboardInner;
