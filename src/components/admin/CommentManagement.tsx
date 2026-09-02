import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { MessageCircle, Send, Trash2, Search, Reply, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CommentRow {
  id: string;
  user_id: string;
  video_id: string;
  course_id: string;
  parent_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  user_name?: string;
  course_title?: string;
  video_title?: string;
}

export default function CommentManagement() {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    // Fetch top-level comments only
    const { data, error } = await supabase
      .from('lesson_comments')
      .select('*')
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load comments');
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    // Fetch user names
    const userIds = [...new Set(data.map((c: any) => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));

    // Fetch course titles
    const courseIds = [...new Set(data.map((c: any) => c.course_id))];
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);
    const courseMap = new Map((courses || []).map((c: any) => [c.id, c.title]));

    // Fetch video titles
    const videoIds = [...new Set(data.map((c: any) => c.video_id))];
    const { data: videos } = await supabase
      .from('videos')
      .select('id, title')
      .in('id', videoIds);
    const videoMap = new Map((videos || []).map((v: any) => [v.id, v.title]));

    const enriched: CommentRow[] = data.map((c: any) => ({
      ...c,
      user_name: profileMap.get(c.user_id) || 'Unknown',
      course_title: courseMap.get(c.course_id) || 'Unknown',
      video_title: videoMap.get(c.video_id) || 'Unknown',
    }));

    setComments(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, []);

  const handleReply = async (comment: CommentRow) => {
    if (!replyText.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from('lesson_comments').insert({
      user_id: user.uid,
      video_id: comment.video_id,
      course_id: comment.course_id,
      parent_id: comment.id,
      message: replyText.trim(),
    });
    if (error) toast.error('Reply failed');
    else {
      toast.success('Reply sent');
      setReplyText('');
      setReplyingTo(null);
      // Mark as read
      await supabase.from('lesson_comments').update({ is_read: true }).eq('id', comment.id);
      fetchComments();
    }
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('lesson_comments').delete().eq('id', id);
    if (error) toast.error('Delete failed');
    else {
      toast.success('Comment deleted');
      fetchComments();
    }
  };

  const filtered = comments.filter(c =>
    !searchQuery ||
    c.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.course_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.video_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Student Comments & Q&A</h2>
        <Badge variant="secondary">{comments.length}</Badge>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by student, course, lesson..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No comments yet</div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {filtered.map((comment) => (
              <div key={comment.id} className="bg-card border rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{comment.user_name}</span>
                      {!comment.is_read && (
                        <Badge className="text-[9px] px-1.5 py-0 bg-blue-500 text-white">New</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{comment.course_title}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{comment.video_title}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                      <Reply className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(comment.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.message}</p>

                {replyingTo === comment.id && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="text-sm min-h-[40px] resize-none"
                      rows={2}
                    />
                    <Button size="sm" className="shrink-0 self-end gap-1" disabled={sending || !replyText.trim()} onClick={() => handleReply(comment)}>
                      {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Send
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
