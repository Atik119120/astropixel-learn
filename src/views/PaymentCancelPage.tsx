import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-orange-600 dark:text-orange-400">পেমেন্ট বাতিল হয়েছে</h1>
          <p className="text-muted-foreground">
            আপনি পেমেন্ট বাতিল করেছেন। আপনি চাইলে আবার চেষ্টা করতে পারেন।
          </p>
          <div className="flex gap-3 justify-center pt-4">
            <Button onClick={() => navigate('/courses')} variant="outline">
              কোর্স পেজে যান
            </Button>
            <Button onClick={() => navigate('/student')}>
              ড্যাশবোর্ড
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentCancelPage;
