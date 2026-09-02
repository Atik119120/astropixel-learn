import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Folder, FolderOpen, Play, Video, Calendar, ChevronRight, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Props { language: 'en' | 'bn' }

interface Recorded {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  youtube_video_id: string;
  video_url: string;
  recorded_at: string;
}

interface CourseFolder {
  id: string;
  title: string;
  thumbnail_url: string | null;
  classes: Recorded[];
}

const T = {
  en: {
    title: 'Recorded Classes', subtitle: 'Every class you missed — organized by course',
    empty: 'No recorded classes yet', emptyHint: 'Recordings will appear here after your live classes.',
    classes: 'classes', noClasses: 'No recordings in this course yet.', back: 'Back to folders',
  },
  bn: {
    title: 'রেকর্ডেড ক্লাস', subtitle: 'প্রতিটি মিস করা ক্লাস — কোর্স অনুযায়ী সাজানো',
    empty: 'এখনও কোনো রেকর্ডিং নেই', emptyHint: 'লাইভ ক্লাসের পর রেকর্ডিং এখানে চলে আসবে।',
    classes: 'টি ক্লাস', noClasses: 'এই কোর্সে এখনও কোনো রেকর্ডিং নেই।', back: 'ফোল্ডারে ফিরুন',
  },
};

export default function StudentRecordedClassesTab({ language }: Props) {
  const { user } = useAuth();
  const t = T[language];
  const [folders, setFolders] = useState<CourseFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFolder, setOpenFolder] = useState<CourseFolder | null>(null);
  const [playing, setPlaying] = useState<Recorded | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      setLoading(true);
      const { data: enrolls } = await supabase
        .from('student_courses').select('course_id')
        .eq('user_id', user.uid).eq('is_active', true);
      const courseIds = (enrolls || []).map(e => e.course_id);
      if (!courseIds.length) { setFolders([]); setLoading(false); return; }

      const { data: courses } = await supabase
        .from('courses').select('id, title, thumbnail_url').in('id', courseIds);
      const { data: recs } = await supabase
        .from('recorded_classes').select('*').in('course_id', courseIds)
        .order('recorded_at', { ascending: false });

      const map = new Map<string, CourseFolder>();
      (courses || []).forEach(c => map.set(c.id, { id: c.id, title: c.title, thumbnail_url: c.thumbnail_url, classes: [] }));
      (recs || []).forEach(r => { map.get(r.course_id)?.classes.push(r as Recorded); });
      setFolders(Array.from(map.values()));
      setLoading(false);
    })();
  }, [user?.uid]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
          <Video className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg">{t.title}</h2>
          <p className="text-xs text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      ) : folders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-border p-12 text-center">
          <Folder className="w-14 h-14 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold">{t.empty}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {folders.map(f => (
            <button key={f.id} onClick={() => setOpenFolder(f)}
              className="group text-left bg-white dark:bg-slate-900 rounded-2xl border border-border/50 shadow-lg shadow-black/5 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  <Folder className="w-7 h-7 text-white fill-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-1">{f.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <PlayCircle className="w-3 h-3" />
                    {f.classes.length} {t.classes}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Folder contents dialog */}
      <Dialog open={!!openFolder} onOpenChange={(o) => !o && setOpenFolder(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base">{openFolder?.title}</DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {openFolder?.classes.length || 0} {t.classes}
                </p>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {openFolder?.classes.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">{t.noClasses}</div>
            ) : (
              <div className="p-3 space-y-1.5">
                {openFolder?.classes.map((c, idx) => (
                  <button key={c.id} onClick={() => setPlaying(c)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/70 transition-colors text-left group">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-cyan-500/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {String(openFolder.classes.length - idx).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{c.title}</p>
                      {c.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{c.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(c.recorded_at), 'PP')}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Player dialog - split view: video left, class list right */}
      <Dialog open={!!playing} onOpenChange={(o) => !o && setPlaying(null)}>
        <DialogContent className="max-w-6xl p-0 overflow-hidden">
          <div className="flex flex-col md:flex-row max-h-[85vh]">
            {/* Left: Video */}
            <div className="flex-1 flex flex-col bg-black min-w-0">
              <div className="aspect-video bg-black">
                {playing && (
                  <iframe
                    src={`https://www.youtube.com/embed/${playing.youtube_video_id}?rel=0&modestbranding=1&autoplay=1`}
                    title={playing.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
              <div className="p-4 bg-background border-t border-border/50">
                <DialogHeader>
                  <DialogTitle className="text-base leading-snug">{playing?.title}</DialogTitle>
                </DialogHeader>
                {playing && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(playing.recorded_at), 'PPp')}
                  </p>
                )}
                {playing?.description && (
                  <p className="text-sm text-muted-foreground mt-2">{playing.description}</p>
                )}
              </div>
            </div>

            {/* Right: Class list */}
            <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border/50 bg-background flex flex-col">
              <div className="p-4 border-b border-border/50 shrink-0">
                <p className="text-xs text-muted-foreground">{openFolder?.title}</p>
                <p className="text-sm font-bold mt-0.5">
                  {openFolder?.classes.length || 0} {t.classes}
                </p>
              </div>
              <ScrollArea className="flex-1 max-h-[300px] md:max-h-none">
                <div className="p-2 space-y-1">
                  {openFolder?.classes.map((c, idx) => {
                    const isActive = c.id === playing?.id;
                    return (
                      <button key={c.id} onClick={() => setPlaying(c)}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors ${
                          isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/70 border border-transparent'
                        }`}>
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                        }`}>
                          {String((openFolder?.classes.length || 0) - idx).padStart(2, '0')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium leading-snug break-words whitespace-normal line-clamp-2 ${isActive ? 'text-primary' : ''}`}>
                            {c.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {format(new Date(c.recorded_at), 'PP')}
                          </p>
                        </div>
                        {isActive && <Play className="w-3 h-3 fill-current text-primary shrink-0 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </aside>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
