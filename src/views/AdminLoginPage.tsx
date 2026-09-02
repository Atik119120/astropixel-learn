import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, Fingerprint } from 'lucide-react';
import { z } from 'zod';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
});

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { user, role, isLoading: authLoading, signIn, signInAsRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      if (role === 'admin') {
        navigate('/admin');
      } else {
        // Fallback query to verify user_roles directly
        import('firebase/firestore').then(({ getDoc, doc }) => {
          import('@/integrations/firebase/config').then(({ db }) => {
            getDoc(doc(db, 'user_roles', user.uid)).then((docSnap) => {
              if (docSnap.exists() && docSnap.data().role === 'admin') {
                navigate('/admin');
              } else if (role === 'teacher' || (docSnap.exists() && docSnap.data().role === 'teacher')) {
                navigate('/teacher');
              }
            });
          });
        });
      }
    }
  }, [user, role, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('ইমেইল বা পাসওয়ার্ড ভুল');
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success('সফলভাবে লগইন হয়েছে!');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      {/* Subtle background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-destructive/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          হোমে ফিরুন
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Icon */}
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/20 flex items-center justify-center mb-5"
            >
              <Shield className="w-10 h-10 text-destructive" />
            </motion.div>
            <h1 className="text-3xl font-display font-bold mb-2">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">শুধুমাত্র অ্যাডমিনদের জন্য</p>
          </div>

          {/* Form */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">ইমেইল</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-background/50 border-border/50 focus:border-destructive/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">পাসওয়ার্ড</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 rounded-xl bg-background/50 border-border/50 focus:border-destructive/50"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-semibold bg-destructive hover:bg-destructive/90 gap-2" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    লগইন হচ্ছে...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    Admin লগইন
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Security badge */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/5 border border-destructive/10">
              <Shield className="w-3 h-3 text-destructive" />
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Restricted Access Zone</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
