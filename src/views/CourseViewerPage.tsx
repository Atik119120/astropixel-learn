import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import SecureVideoPlayer from '@/components/SecureVideoPlayer';
import LessonComments from '@/components/student/LessonComments';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Play, Lock, CheckCircle, ArrowLeft, ArrowRight, ChevronLeft,
  FileText, StickyNote, File, Clock, PlayCircle, Maximize2, Minimize2,
  Download, ExternalLink
} from 'lucide-react';
import { CourseWithProgress, VideoWithProgress, VideoMaterial } from '@/types/lms';
import { useStudentCourses, useVideoProgress } from '@/hooks/useCourses';

export default function CourseViewerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const { courses, refetch } = useStudentCourses();
  const isMobile = useIsMobile();

  const [course, setCourse] = useState<CourseWithProgress | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoWithProgress | null>(null);
  const [videoMaterials, setVideoMaterials] = useState<VideoMaterial[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [watchThresholdMet, setWatchThresholdMet] = useState(false);
  const [dailyClassCount, setDailyClassCount] = useState(0);
  const [autoCompleting, setAutoCompleting] = useState(false);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (courses.length > 0 && courseId) {
      const found = courses.find(c => c.id === courseId);
      if (found) {
        setCourse(found);
        if (!selectedVideo) {
          const firstUnwatched = found.videos.find(v => !v.progress?.is_completed && !v.is_locked);
          setSelectedVideo(firstUnwatched || found.videos[0]);
        }
      }
    }
  }, [courses, courseId]);

  useEffect(() => {
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    supabase
      .from('video_progress')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .gte('last_watched_at', today.toISOString())
      .then(({ count }) => setDailyClassCount(count || 0));
  }, [user]);

  useEffect(() => {
    if (selectedVideo) {
      supabase
        .from('video_materials')
        .select('*')
        .eq('video_id', selectedVideo.id)
        .order('order_index', { ascending: true })
        .then(({ data }) => setVideoMaterials((data || []) as VideoMaterial[]));
      setWatchThresholdMet(false);
    }
  }, [selectedVideo?.id]);

  const { updateProgress } = useVideoProgress(selectedVideo?.id || '');

  const handleVideoComplete = useCallback(() => {
    setWatchThresholdMet(true);
  }, []);

  // Auto mark complete when threshold met
  useEffect(() => {
    if (watchThresholdMet && !autoCompleting && selectedVideo && !selectedVideo.progress?.is_completed) {
      setAutoCompleting(true);
      markComplete().finally(() => setAutoCompleting(false));
    }
  }, [watchThresholdMet]);

  const markComplete = async () => {
    if (!selectedVideo || !course || !user) return;
    if (dailyClassCount >= 5) {
      toast.error('আজকের জন্য ক্লাস লিমিট শেষ (সর্বোচ্চ ৫টি)');
      return;
    }
    const result = await updateProgress(100);
    if (result?.error) {
      toast.error('Progress save failed');
      return;
    }
    toast.success('✅ ক্লাস সম্পন্ন!');
    setDailyClassCount(prev => prev + 1);

    const completedCount = course.videos.filter(v => v.progress?.is_completed || v.id === selectedVideo.id).length;
    if (completedCount === course.total_videos) {
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('certificate_id')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .maybeSingle();
      if (!existingCert) {
        const certId = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        await supabase.from('certificates').insert({
          certificate_id: certId, user_id: user.id, course_id: course.id,
          student_name: profile?.full_name || '', course_name: course.title,
        });
        await supabase.from('course_completions').insert({
          user_id: user.id, course_id: course.id, certificate_id: certId,
        });
        toast.success('🎉 কোর্স সম্পন্ন! সার্টিফিকেট তৈরি হয়েছে');
      }
    }
    refetch();
    const currentIdx = course.videos.findIndex(v => v.id === selectedVideo.id);
    if (currentIdx < course.videos.length - 1) {
      setTimeout(() => setSelectedVideo(course.videos[currentIdx + 1]), 1500);
    }
  };

  const goToVideo = (video: VideoWithProgress) => {
    if (video.is_locked) {
      toast.error('আগের ক্লাসটি সম্পন্ন করুন');
      return;
    }
    setSelectedVideo(video);
  };

  const currentIndex = course?.videos.findIndex(v => v.id === selectedVideo?.id) ?? -1;
  const nextVideo = course?.videos[currentIndex + 1];
  const prevVideo = currentIndex > 0 ? course?.videos[currentIndex - 1] : null;
  const videoFrameHeight = isMobile
    ? 'min(56.25vw, 42dvh)'
    : 'min(calc((100vw - 20rem) * 0.5625), calc(100dvh - 11rem))';

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
      case 'doc': return <File className="w-4 h-4 text-blue-500" />;
      case 'note': return <StickyNote className="w-4 h-4 text-amber-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (!user) { navigate('/student/login'); return null; }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const LessonList = () => (
    <div className="divide-y divide-white/5">
      {course.videos.map((video, index) => {
        const isActive = video.id === selectedVideo?.id;
        const isComplete = video.progress?.is_completed;
        const isLocked = video.is_locked;
        return (
          <button
            key={video.id}
            onClick={() => goToVideo(video)}
            disabled={isLocked}
            className={`w-full flex items-center gap-3 p-3 text-left transition-all ${
              isActive ? 'bg-primary/10 border-l-2 border-primary'
              : isComplete ? 'hover:bg-emerald-500/5'
              : isLocked ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-white/5'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isActive ? 'bg-primary text-primary-foreground'
              : isComplete ? 'bg-emerald-500/20 text-emerald-400'
              : isLocked ? 'bg-white/10 text-white/30'
              : 'bg-white/10 text-white/60'
            }`}>
              {isLocked ? <Lock className="w-3.5 h-3.5" />
              : isComplete ? <CheckCircle className="w-3.5 h-3.5" />
              : isActive ? <Play className="w-3.5 h-3.5 fill-current" />
              : <PlayCircle className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium leading-snug break-words whitespace-normal line-clamp-2 ${isActive ? 'text-primary' : isComplete ? 'text-emerald-400' : ''}`}>
                {video.title}
              </p>
              {video.duration_seconds > 0 && (
                <p className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {Math.floor(video.duration_seconds / 60)} min
                </p>
              )}
            </div>
            {isComplete && <Badge className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1.5 py-0 shrink-0">✓</Badge>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`fixed inset-0 h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-950 text-white flex flex-col ${language === 'bn' ? 'font-bengali' : ''}`}>
      {/* Top Bar - always visible */}
      <header className="h-12 md:h-14 border-b border-white/10 flex items-center px-3 md:px-4 gap-2 md:gap-3 shrink-0 bg-slate-900/80 backdrop-blur-sm z-30">
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 shrink-0 w-8 h-8 md:w-9 md:h-9" onClick={() => navigate('/student')}>
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-semibold truncate">{course.title}</p>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <Badge variant="outline" className="text-[9px] md:text-[10px] border-white/20 text-white/60 px-1.5 md:px-2">
            {course.completed_videos}/{course.total_videos}
          </Badge>
          <Progress value={course.progress_percent} className="w-12 md:w-20 h-1.5" />
          <span className="text-[10px] md:text-xs font-bold text-emerald-400">{Math.round(course.progress_percent)}%</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Video Player - fixed, does not scroll */}
          <div
            className="relative w-full bg-black shrink-0 overflow-hidden [&>div]:!h-full [&>div]:!aspect-auto [&>div]:!rounded-none"
            style={{ height: videoFrameHeight }}
          >
            {selectedVideo && user && (
              <SecureVideoPlayer
                videoUrl={selectedVideo.video_url}
                videoType={selectedVideo.video_type}
                videoId={selectedVideo.id}
                userId={user.id}
                onComplete={handleVideoComplete}
                initialPosition={selectedVideo.progress?.last_position || 0}
                maxWatchedSeconds={selectedVideo.progress?.watched_seconds || 0}
                isLessonCompleted={!!selectedVideo.progress?.is_completed}
                posterUrl={course.thumbnail_url || undefined}
                autoPlay={false}
                onThresholdMet={() => setWatchThresholdMet(true)}
              />
            )}

            {!isMobile && (
              <Button
                variant="ghost" size="icon"
                className="absolute top-3 right-3 z-20 text-white/50 hover:text-white hover:bg-white/10"
                onClick={() => { setFocusMode(!focusMode); if (!focusMode) setSidebarOpen(false); else setSidebarOpen(true); }}
              >
                {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}
          </div>

          {/* Below Video Content - scrolls independently */}
          <div className={`shrink-0 overflow-hidden p-3 md:p-6 space-y-3 md:space-y-4 bg-slate-950 ${focusMode && !isMobile ? 'hidden' : ''}`}>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] md:text-xs text-white/40 mb-0.5">Class {currentIndex + 1} of {course.total_videos}</p>
                <h2 className="text-sm md:text-lg font-bold line-clamp-1">{selectedVideo?.title}</h2>
              </div>
              {selectedVideo?.progress?.is_completed && (
                <Badge className="bg-emerald-600 text-white gap-1 shrink-0">
                  <CheckCircle className="w-3 h-3" /> সম্পন্ন
                </Badge>
              )}
              {autoCompleting && (
                <Badge className="bg-primary/20 text-primary gap-1 shrink-0 animate-pulse">
                  <CheckCircle className="w-3 h-3" /> সেভ হচ্ছে...
                </Badge>
              )}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
                  disabled={!prevVideo} onClick={() => prevVideo && goToVideo(prevVideo)}
                  title={prevVideo ? `Previous: ${prevVideo.title}` : 'No previous class'}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
                  disabled={!nextVideo || nextVideo.is_locked} onClick={() => nextVideo && goToVideo(nextVideo)}
                  title={nextVideo ? `Next: ${nextVideo.title}` : 'No next class'}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>


            {isMobile && (
              <Accordion type="single" collapsible className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/50">
                <AccordionItem value="syllabus" className="border-0">
                  <AccordionTrigger className="px-3 py-3 text-xs font-bold hover:no-underline hover:bg-white/5 text-white">
                    <span className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-primary" />
                      কোর্স সিলেবাস ({course.total_videos}টি ক্লাস)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-0 max-h-[calc(100dvh-360px)] overflow-y-auto">
                    <LessonList />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {videoMaterials.length > 0 && (
              <Accordion type="single" collapsible className="border border-white/10 rounded-xl overflow-hidden">
                <AccordionItem value="materials" className="border-0">
                  <AccordionTrigger className="px-3 md:px-4 py-3 text-xs md:text-sm font-semibold hover:no-underline hover:bg-white/5 text-white">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Materials ({videoMaterials.length})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 md:px-4 pb-3 md:pb-4 space-y-2">
                    {videoMaterials.map((mat) => (
                      <div key={mat.id} className="flex items-center gap-3 p-2.5 md:p-3 bg-white/5 rounded-lg border border-white/10">
                        {getMaterialIcon(mat.material_type)}
                        <span className="text-xs md:text-sm flex-1 truncate">{mat.title}</span>
                        {mat.material_type === 'note' && mat.note_content ? (
                          <span className="text-xs text-white/50">Note</span>
                        ) : mat.material_url ? (
                          <div className="flex gap-2">
                            <a href={mat.material_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <a href={mat.material_url} download className="text-white/50 hover:text-white">
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </div>


        {/* Right Sidebar - Desktop Only */}
        {!isMobile && !focusMode && (
          <aside className={`bg-slate-900 border-l border-white/10 transition-all duration-300 shrink-0 ${sidebarOpen ? 'w-72 md:w-80' : 'w-0 overflow-hidden'}`}>
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold">কোর্স সিলেবাস</h3>
                  <p className="text-[10px] text-white/40">{course.total_videos}টি ক্লাস</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400">{Math.round(course.progress_percent)}%</span>
                  <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white">
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <LessonList />
              </ScrollArea>
            </div>
          </aside>
        )}

        {/* Sidebar Toggle (desktop, collapsed) */}
        {!isMobile && !sidebarOpen && !focusMode && (
          <button onClick={() => setSidebarOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-slate-800 border border-white/10 rounded-l-lg p-2 text-white/60 hover:text-white hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
