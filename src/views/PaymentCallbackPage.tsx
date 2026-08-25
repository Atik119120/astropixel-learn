import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

type PaymentStatus = 'verifying' | 'success' | 'failed';

const PaymentCallbackPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [message, setMessage] = useState('পেমেন্ট ভেরিফাই করা হচ্ছে...');

  useEffect(() => {
    const verifyPayment = async () => {
      const invoiceId = searchParams.get('invoice_id');
      const paymentType = searchParams.get('type');

      if (!invoiceId) {
        setStatus('failed');
        setMessage('পেমেন্ট তথ্য পাওয়া যায়নি।');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('uddoktapay-verify', {
          body: { invoice_id: invoiceId },
        });

        if (error || !data?.success) {
          setStatus('failed');
          setMessage('পেমেন্ট ভেরিফিকেশন ব্যর্থ হয়েছে।');
          return;
        }

        if (data.status === 'COMPLETED') {
          if (paymentType === 'course') {
            const metadata = data.metadata || {};
            const courseId = metadata.course_id;
            const userId = metadata.user_id;
            const studentName = metadata.student_name;
            const studentEmail = metadata.student_email;

            if (courseId && userId) {
              // Directly assign course to the student (auto-approve)
              const { data: existing } = await supabase
                .from('student_courses')
                .select('id')
                .eq('user_id', userId)
                .eq('course_id', courseId)
                .maybeSingle();

              if (!existing) {
                await supabase.from('student_courses').insert({
                  user_id: userId,
                  course_id: courseId,
                  is_active: true,
                });
              }

              // Send notification
              try {
                await supabase.functions.invoke('student-enrollment-notify', {
                  body: {
                    studentName: studentName || 'Student',
                    studentEmail: studentEmail || '',
                    courseName: metadata.course_name || 'Course',
                    coursePrice: data.amount,
                    paymentMethod: 'uddoktapay',
                    transactionId: data.transaction_id || invoiceId,
                  },
                });
              } catch {}
            }
          }

          setStatus('success');
          setMessage('পেমেন্ট সফল হয়েছে! আপনার কোর্স এখন অ্যাক্সেসযোগ্য।');
          toast.success('পেমেন্ট সফল!');
        } else {
          setStatus('failed');
          setMessage(`পেমেন্ট ${data.status === 'PENDING' ? 'পেন্ডিং আছে' : 'ব্যর্থ হয়েছে'}।`);
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('failed');
        setMessage('পেমেন্ট ভেরিফিকেশনে সমস্যা হয়েছে।');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {status === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
              <h1 className="text-2xl font-bold">{message}</h1>
              <p className="text-muted-foreground">অনুগ্রহ করে অপেক্ষা করুন...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">পেমেন্ট সফল!</h1>
              <p className="text-muted-foreground">{message}</p>
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={() => navigate('/courses')} variant="outline">
                  কোর্স পেজে যান
                </Button>
                <Button onClick={() => navigate('/student/dashboard')}>
                  ড্যাশবোর্ড
                </Button>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">পেমেন্ট ব্যর্থ</h1>
              <p className="text-muted-foreground">{message}</p>
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={() => navigate('/courses')} variant="outline">
                  আবার চেষ্টা করুন
                </Button>
                <Button onClick={() => navigate('/contact')}>
                  যোগাযোগ করুন
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PaymentCallbackPage;
