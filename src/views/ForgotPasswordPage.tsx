import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Mail, KeyRound, Lock, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('সঠিক ইমেইল দিন');

type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendOtp = async () => {
    const v = emailSchema.safeParse(email);
    if (!v.success) return toast.error(v.error.errors[0].message);
    setIsLoading(true);
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { email: email.trim().toLowerCase(), name: 'User', purpose: 'password_reset' },
    });
    setIsLoading(false);
    if (error || (data as any)?.error || (data as any)?.success === false) {
      return toast.error((data as any)?.error || 'OTP পাঠাতে সমস্যা হয়েছে');
    }
    toast.success('আপনার ইমেইলে OTP পাঠানো হয়েছে');
    setStep('otp');
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) return toast.error('৬ ডিজিটের OTP দিন');
    setIsLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-otp', {
      body: { email: email.trim().toLowerCase(), otp },
    });
    setIsLoading(false);
    if (error || !(data as any)?.success) {
      return toast.error((data as any)?.error || 'OTP ভুল');
    }
    toast.success('OTP ভেরিফাইড');
    setStep('password');
  };

  const resetPassword = async () => {
    if (newPassword.length < 6) return toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের');
    if (newPassword !== confirmPassword) return toast.error('পাসওয়ার্ড মিলছে না');
    setIsLoading(true);
    const { data, error } = await supabase.functions.invoke('reset-password-with-otp', {
      body: { email: email.trim().toLowerCase(), otp, newPassword },
    });
    setIsLoading(false);
    if (error || !(data as any)?.success) {
      return toast.error((data as any)?.error || 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে');
    }
    toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে! এখন লগইন করুন।');
    setTimeout(() => { window.location.href = '/student/login'; }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/student/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> লগইনে ফিরুন
        </Link>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              {step === 'email' && <KeyRound className="w-8 h-8 text-primary" />}
              {step === 'otp' && <ShieldCheck className="w-8 h-8 text-primary" />}
              {step === 'password' && <Lock className="w-8 h-8 text-primary" />}
            </div>
            <div>
              <CardTitle className="text-2xl">
                {step === 'email' && 'পাসওয়ার্ড ভুলে গেছেন?'}
                {step === 'otp' && 'OTP ভেরিফাই করুন'}
                {step === 'password' && 'নতুন পাসওয়ার্ড দিন'}
              </CardTitle>
              <CardDescription className="mt-2">
                {step === 'email' && 'আপনার ইমেইল দিন, আমরা OTP পাঠাবো'}
                {step === 'otp' && `${email} এ পাঠানো ৬ ডিজিটের কোড দিন`}
                {step === 'password' && 'একটি নতুন পাসওয়ার্ড সেট করুন'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {step === 'email' && (
              <form onSubmit={(e) => { e.preventDefault(); sendOtp(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">ইমেইল</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="your@email.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />পাঠানো হচ্ছে...</> : 'OTP পাঠান'}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={(e) => { e.preventDefault(); verifyOtp(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP কোড</Label>
                  <Input id="otp" inputMode="numeric" maxLength={6} placeholder="------"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-[0.5em] font-mono" required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />ভেরিফাই হচ্ছে...</> : 'ভেরিফাই করুন'}
                </Button>
                <div className="flex justify-between text-xs">
                  <button type="button" onClick={() => setStep('email')} className="text-muted-foreground hover:text-foreground">← ইমেইল পরিবর্তন</button>
                  <button type="button" onClick={sendOtp} disabled={isLoading} className="text-primary hover:underline">আবার পাঠান</button>
                </div>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={(e) => { e.preventDefault(); resetPassword(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="np">নতুন পাসওয়ার্ড</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="np" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cp">পাসওয়ার্ড কনফার্ম</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="cp" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />সেভ হচ্ছে...</> : 'পাসওয়ার্ড পরিবর্তন করুন'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
