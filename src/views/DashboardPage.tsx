import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
// No loading UI on this route; it only redirects based on auth state.

export default function DashboardPage() {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate('/student/login');
      return;
    }

    // Redirect based on role
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  }, [user, role, isLoading, navigate]);

  return null;
}
