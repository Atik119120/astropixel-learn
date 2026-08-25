import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Search, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

const certIdSchema = z.string().min(10, 'Certificate ID কমপক্ষে ১০ অক্ষরের হতে হবে');

export default function VerifyCertificatePage() {
  const [certificateId, setCertificateId] = useState('');
  const navigate = useNavigate();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = certIdSchema.safeParse(certificateId);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    navigate(`/certificate/${certificateId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">

      <div className="w-full max-w-md relative z-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          হোমে ফিরুন
        </Link>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl gradient-text">সার্টিফিকেট যাচাই</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Certificate ID দিয়ে সার্টিফিকেট যাচাই করুন
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cert-id">Certificate ID</Label>
                <Input
                  id="cert-id"
                  type="text"
                  placeholder="CERT-XXXXXXXXXXXX"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value.toUpperCase())}
                  className="text-center font-mono"
                />
              </div>

              <Button type="submit" className="w-full gap-2">
                <Search className="w-4 h-4" />
                যাচাই করুন
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
