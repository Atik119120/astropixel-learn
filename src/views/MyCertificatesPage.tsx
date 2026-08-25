import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Award, Download, LogOut, ArrowLeft, Calendar } from 'lucide-react';
import { Certificate } from '@/types/lms';

export default function MyCertificatesPage() {
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchCertificates();
    }
  }, [user, authLoading]);

  const fetchCertificates = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false });

    if (error) {
      toast.error('সার্টিফিকেট লোড করতে সমস্যা');
    } else {
      setCertificates((data || []) as Certificate[]);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/student')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">আমার সার্টিফিকেট</h1>
              <p className="text-sm text-muted-foreground">{profile?.full_name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            লগ আউট
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {certificates.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">কোনো সার্টিফিকেট নেই</p>
              <p className="text-sm text-muted-foreground mt-2">
                কোর্স সম্পূর্ণ করলে সার্টিফিকেট পাবেন
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/student')}
              >
                কোর্সে যান
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <Card key={cert.id} className="overflow-hidden hover:border-primary transition-all">
                <div className="h-24 bg-gradient-to-r from-primary via-accent to-primary relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Award className="w-12 h-12 text-white/80" />
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{cert.course_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(cert.issued_at).toLocaleDateString('bn-BD')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs">
                      {cert.certificate_id}
                    </Badge>
                  </div>
                  <Button 
                    className="w-full gap-2"
                    onClick={() => navigate(`/certificate/${cert.certificate_id}`)}
                  >
                    <Download className="w-4 h-4" />
                    দেখুন ও ডাউনলোড
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
