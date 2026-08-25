import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Award, Download, CheckCircle, ArrowLeft, Sun, Moon, Globe, Loader2 } from 'lucide-react';
import { Certificate } from '@/types/lms';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Public certificate data (from Edge Function - no student_name for privacy)
interface PublicCertificateData {
  certificate_id: string;
  course_name: string;
  issued_at: string;
  is_valid: boolean;
}

export default function CertificatePage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [publicCertData, setPublicCertData] = useState<PublicCertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCertificate();
  }, [certificateId, user]);

  const fetchCertificate = async () => {
    if (!certificateId) return;

    setIsLoading(true);

    // If user is logged in, try to fetch their own certificate with full details
    if (user) {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('certificate_id', certificateId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setCertificate(data as Certificate);
        setIsVerified(true);
        setIsLoading(false);
        return;
      }
    }

    // For public verification (or if user doesn't own this certificate),
    // use the secure Edge Function that only returns public data
    try {
      const { data, error } = await supabase.functions.invoke('verify-certificate', {
        body: { certificate_id: certificateId }
      });

      if (error) {
        console.error('Verification error:', error);
        toast.error(t('cert.notFound'));
      } else if (data && data.is_valid) {
        setPublicCertData(data as PublicCertificateData);
        setIsVerified(true);
      }
    } catch (err) {
      console.error('Edge function error:', err);
      toast.error(t('cert.notFound'));
    }

    setIsLoading(false);
  };

  const downloadCertificate = async () => {
    if (!certificate || !certificateRef.current) {
      toast.error(t('cert.loginToDownload'));
      return;
    }

    setIsDownloading(true);
    toast.info(t('cert.downloading'));

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate-${certificate.certificate_id}.pdf`);

      toast.success('Certificate downloaded!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  // Format date
  const displayData = certificate || publicCertData;
  const canDownload = !!certificate;
  const studentName = certificate?.student_name;

  const formattedDate = displayData ? new Date(displayData.issued_at).toLocaleDateString(
    language === 'en' ? 'en-US' : 'bn-BD', 
    { year: 'numeric', month: 'long', day: 'numeric' }
  ) : '';

  const issuedDate = displayData ? new Date(displayData.issued_at) : new Date();
  const year = issuedDate.getFullYear();
  const month = String(issuedDate.getMonth() + 1).padStart(2, '0');
  const day = String(issuedDate.getDate()).padStart(2, '0');
  const registrationNumber = displayData ? `AZA-${year}${month}${day}-${displayData.certificate_id.replace('CERT-', '')}` : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            to={user ? '/student' : '/'} 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('cert.back')}
          </Link>

        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {displayData ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Certificate Preview */}
            <div 
              ref={certificateRef}
              className="bg-white relative overflow-hidden shadow-2xl"
              style={{ aspectRatio: '1.414', minHeight: '500px' }}
            >
              {/* Elegant Border */}
              <div className="absolute inset-4 border-2 border-[#1a3a4a]" />
              <div className="absolute inset-6 border border-[#c9a227]" />
              
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-[#1a3a4a]" />
              <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-[#1a3a4a]" />
              <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-[#1a3a4a]" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-[#1a3a4a]" />
              
              {/* Content */}
              <div className="absolute inset-10 flex flex-col items-center justify-between p-4 md:p-8 text-center">
                {/* Header */}
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src="/logo.png" 
                    alt="Astropixel Academy" 
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                    crossOrigin="anonymous"
                  />
                  <h2 className="text-[#1a3a4a] text-sm md:text-base font-semibold tracking-[0.3em] uppercase">
                    Astropixel Academy
                  </h2>
                  <div className="w-24 h-px bg-[#c9a227] mt-1" />
                </div>
                
                {/* Title */}
                <div className="space-y-1">
                  <h1 className="text-3xl md:text-5xl font-bold text-[#1a3a4a] tracking-wider" style={{ fontFamily: 'serif' }}>
                    CERTIFICATE
                  </h1>
                  <p className="text-[#c9a227] text-lg md:text-xl italic">of Completion</p>
                </div>
                
                {/* Main Content */}
                <div className="space-y-3 max-w-md">
                  <p className="text-xs md:text-sm text-gray-500 uppercase tracking-widest">
                    {language === 'en' ? 'This is to certify that' : 'প্রত্যয়ন করা হচ্ছে যে'}
                  </p>
                  
                  <h2 className="text-2xl md:text-4xl font-bold text-[#1a3a4a] border-b-2 border-[#c9a227] pb-2" style={{ fontFamily: 'serif' }}>
                    {studentName || t('cert.holder')}
                  </h2>
                  
                  <p className="text-xs md:text-sm text-gray-600">
                    {language === 'en' ? 'has successfully completed' : 'সফলভাবে সম্পন্ন করেছেন'}
                  </p>
                  
                  <h3 className="text-lg md:text-2xl font-semibold text-[#1a3a4a]">
                    {displayData.course_name}
                  </h3>
                </div>
                
                {/* Footer */}
                <div className="w-full flex justify-between items-end text-xs md:text-sm">
                  <div className="text-center">
                    <div className="w-24 md:w-32 h-px bg-[#1a3a4a] mb-1" />
                    <p className="text-gray-500 uppercase tracking-wider text-[10px] md:text-xs">
                      {t('cert.instructor')}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-[10px] md:text-xs text-gray-500">{t('cert.issued')}: {formattedDate}</p>
                    <p className="text-[10px] md:text-xs text-[#1a3a4a] font-mono mt-1">{displayData.certificate_id}</p>
                    <p className="text-[8px] md:text-[10px] text-[#c9a227] border border-[#c9a227] px-2 py-0.5 mt-1 inline-block">
                      {registrationNumber}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-24 md:w-32 h-px bg-[#1a3a4a] mb-1" />
                    <p className="text-gray-500 uppercase tracking-wider text-[10px] md:text-xs">
                      {t('cert.director')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Verified Badge */}
              <div className="absolute bottom-4 right-4 w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-[#c9a227] flex flex-col items-center justify-center bg-white">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[#c9a227]" />
                <span className="text-[6px] md:text-[8px] text-[#c9a227] uppercase tracking-wider">Verified</span>
              </div>
            </div>
            
            {/* Verification Status */}
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-foreground font-medium">{t('cert.verified')}</span>
            </div>
            
            {/* Download Button */}
            {canDownload ? (
              <Button 
                onClick={downloadCertificate} 
                disabled={isDownloading}
                className="w-full gap-2 bg-[#1a3a4a] hover:bg-[#2d5a6a] text-white"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('cert.downloading')}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {t('cert.download')}
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                <p>{t('cert.loginToDownload')}</p>
              </div>
            )}
          </div>
        ) : (
          <Card className="max-w-md mx-auto border-dashed">
            <CardContent className="py-12 text-center">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium">{t('cert.notFound')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('cert.checkId')}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}