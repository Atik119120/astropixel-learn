import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { Moon, Sun, Globe, GraduationCap, ArrowLeft, Eye, EyeOff, Loader2, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const translations = {
  en: {
    title: 'Teacher Portal',
    subtitle: 'Access your teaching dashboard',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    loggingIn: 'Logging in...',
    forgotPassword: 'Forgot password?',
    notTeacher: 'Not a teacher?',
    studentLogin: 'Student Login',
    applyTeacher: 'Apply as Teacher',
    backToHome: 'Back to Home',
    invalidCredentials: 'Invalid email or password',
    notApproved: 'Your teacher account is pending approval',
    notTeacherRole: 'This account does not have teacher access',
    success: 'Login successful!',
  },
  bn: {
    title: 'টিচার পোর্টাল',
    subtitle: 'আপনার টিচিং ড্যাশবোর্ডে প্রবেশ করুন',
    email: 'ইমেইল',
    password: 'পাসওয়ার্ড',
    login: 'লগইন',
    loggingIn: 'লগইন হচ্ছে...',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    notTeacher: 'টিচার নন?',
    studentLogin: 'স্টুডেন্ট লগইন',
    applyTeacher: 'টিচার হিসেবে আবেদন করুন',
    backToHome: 'হোমে ফিরে যান',
    invalidCredentials: 'ভুল ইমেইল বা পাসওয়ার্ড',
    notApproved: 'আপনার টিচার অ্যাকাউন্ট অনুমোদনের অপেক্ষায় আছে',
    notTeacherRole: 'এই অ্যাকাউন্টে টিচার এক্সেস নেই',
    success: 'সফলভাবে লগইন হয়েছে!',
  },
};

export default function TeacherLoginPage() {
  const { user, role, isLoading, signIn, signInAsRole, profile } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const t = translations[language];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);

  useEffect(() => {
    if (!isLoading && user && role === 'admin') {
      navigate('/admin');
    }
    if (!isLoading && user && role === 'teacher' && !loginAttempted) {
      const isApproved = (profile as any)?.teacher_approved === true;
      if (isApproved) {
        navigate('/teacher');
      }
    }
  }, [user, role, isLoading, profile, navigate, loginAttempted]);

  useEffect(() => {
    if (loginAttempted && !isLoading && user) {
      if (role === 'admin') {
        navigate('/admin');
        return;
      }
      if (role !== 'teacher') {
        toast.error(t.notTeacherRole);
        supabase.auth.signOut();
        setIsSubmitting(false);
        setLoginAttempted(false);
        return;
      }
      
      const isApproved = (profile as any)?.teacher_approved === true;
      if (!isApproved) {
        toast.error(t.notApproved);
        supabase.auth.signOut();
        setIsSubmitting(false);
        setLoginAttempted(false);
        return;
      }
      
      navigate('/teacher');
    }
  }, [loginAttempted, isLoading, user, role, profile, navigate, t]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginAttempted(false);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast.error(t.invalidCredentials);
        setIsSubmitting(false);
        return;
      }

      setLoginAttempted(true);
      toast.success(t.success);
    } catch (err) {
      toast.error(t.invalidCredentials);
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>



      <div className="w-full max-w-sm relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          {t.backToHome}
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Icon */}
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-5"
            >
              <BookOpen className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="text-3xl font-display font-bold mb-2">{t.title}</h1>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>

          {/* Form */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t.email}</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@example.com"
                    className="h-12 rounded-xl bg-background/50 border-border/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">{t.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-11 h-12 rounded-xl bg-background/50 border-border/50"
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">{t.forgotPassword}</Link>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{t.loggingIn}</>
                ) : (
                  <><GraduationCap className="w-4 h-4" />{t.login}</>
                )}
              </Button>
            </form>
          </div>

          {/* Footer links */}
          <div className="mt-6 space-y-3 text-center text-sm">
            <p className="text-muted-foreground">
              {t.notTeacher}{' '}
              <Link to="/student/login" className="text-primary hover:underline font-medium">{t.studentLogin}</Link>
            </p>
            <p className="text-muted-foreground">
              <Link to="/student/login?tab=teacher" className="text-primary hover:underline font-medium">{t.applyTeacher}</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
