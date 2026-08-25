import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface StudentNoticesTabProps {
  language: 'en' | 'bn';
}

interface Notice {
  id: string;
  title: string;
  content: string;
  course_id: string | null;
  is_global: boolean;
  created_at: string;
  teacher?: { full_name: string };
  course?: { title: string };
  is_read?: boolean;
}

const translations = {
  en: {
    title: 'Notices',
    noNotices: 'No notices yet',
    checkBack: 'Check back later for updates from your teachers',
    globalNotice: 'Global',
    courseNotice: 'Course',
    from: 'From',
    read: 'Read',
    unread: 'New',
  },
  bn: {
    title: 'নোটিশ',
    noNotices: 'এখনো কোনো নোটিশ নেই',
    checkBack: 'পরে আপনার টিচারদের আপডেটের জন্য দেখুন',
    globalNotice: 'সার্বজনীন',
    courseNotice: 'কোর্স',
    from: 'থেকে',
    read: 'পড়া হয়েছে',
    unread: 'নতুন',
  },
};

export default function StudentNoticesTab({ language }: StudentNoticesTabProps) {
  const { user } = useAuth();
  const t = translations[language];
  
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readNotices, setReadNotices] = useState<Set<string>>(new Set());

  const fetchNotices = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notices')
        .select(`
          *,
          teacher:teacher_id(full_name),
          course:course_id(title)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch read status
      const { data: reads } = await supabase
        .from('notice_reads')
        .select('notice_id')
        .eq('user_id', user.id);
      
      const readIds = new Set<string>((reads?.map((r: any) => r.notice_id as string) || []));
      setReadNotices(readIds);
      
      setNotices(data || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
    
    // Subscribe to real-time notices
    const channel = supabase
      .channel('notices')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notices',
        },
        () => {
          fetchNotices();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAsRead = async (noticeId: string) => {
    if (!user?.id || readNotices.has(noticeId)) return;
    
    try {
      await supabase
        .from('notice_reads')
        .insert({
          notice_id: noticeId,
          user_id: user.id,
        });
      
      setReadNotices(prev => new Set([...prev, noticeId]));
    } catch (err) {
      console.error('Error marking notice as read:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{t.title}</h2>
        {notices.filter(n => !readNotices.has(n.id)).length > 0 && (
          <Badge variant="destructive" className="rounded-full">
            {notices.filter(n => !readNotices.has(n.id)).length}
          </Badge>
        )}
      </div>

      {notices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t.noNotices}</h3>
            <p className="text-muted-foreground text-center">{t.checkBack}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => {
            const isRead = readNotices.has(notice.id);
            
            return (
              <Card 
                key={notice.id}
                className={`cursor-pointer transition-colors ${
                  !isRead ? 'border-primary/30 bg-primary/5' : ''
                }`}
                onClick={() => markAsRead(notice.id)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {!isRead ? (
                        <Badge variant="destructive" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {t.unread}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          {t.read}
                        </Badge>
                      )}
                      <Badge variant={notice.is_global ? 'default' : 'secondary'}>
                        {notice.is_global ? t.globalNotice : t.courseNotice}
                      </Badge>
                      {notice.course && (
                        <Badge variant="outline">{notice.course.title}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{notice.title}</CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notice.created_at), 'PPp')}
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap mb-3">
                    {notice.content}
                  </p>
                  {notice.teacher && (
                    <p className="text-sm text-muted-foreground">
                      {t.from}: <span className="font-medium">{notice.teacher.full_name}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
