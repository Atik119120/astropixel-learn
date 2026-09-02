import { useState, useRef, useEffect, useCallback } from 'react';
import { db } from '@/integrations/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, CheckCircle, Loader2, Settings
} from 'lucide-react';

// Declare global YT types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Load YouTube IFrame API once
let ytApiLoaded = false;
let ytApiLoadPromise: Promise<void> | null = null;
function loadYouTubeAPI(): Promise<void> {
  if (ytApiLoaded && window.YT?.Player) return Promise.resolve();
  if (ytApiLoadPromise) return ytApiLoadPromise;
  ytApiLoadPromise = new Promise((resolve) => {
    if (window.YT?.Player) { ytApiLoaded = true; resolve(); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(tag, firstScript);
    window.onYouTubeIframeAPIReady = () => { ytApiLoaded = true; resolve(); };
  });
  return ytApiLoadPromise;
}

function extractYouTubeId(url: string): string {
  if (url.includes('youtu.be')) return url.split('/').pop()?.split('?')[0] || url;
  if (url.includes('v=')) return url.split('v=')[1]?.split('&')[0] || url;
  return url;
}

const YT_COMPLETION_THRESHOLD = 0.90;
const YT_PROGRESS_SAVE_INTERVAL = 5000;

interface YouTubeCustomPlayerProps {
  videoUrl: string;
  videoId: string;
  userId: string;
  onComplete: () => void;
  initialPosition?: number;
  maxWatchedSeconds?: number;
  isLessonCompleted?: boolean;
  posterUrl?: string;
  autoPlay?: boolean;
  onThresholdMet?: () => void;
}

function YouTubeCustomPlayer({
  videoUrl, videoId, userId, onComplete,
  initialPosition = 0, maxWatchedSeconds = 0,
  isLessonCompleted = false, posterUrl, autoPlay = false, onThresholdMet,
}: YouTubeCustomPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [highestWatched, setHighestWatched] = useState(maxWatchedSeconds);
  const [isCompleted, setIsCompleted] = useState(isLessonCompleted);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showPoster, setShowPoster] = useState(!autoPlay);
  const [showIntro, setShowIntro] = useState(autoPlay);
  const [thresholdNotified, setThresholdNotified] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const hideControlsTimer = useRef<ReturnType<typeof setTimeout>>();

  // Disable right-click
  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  // Load progress from DB
  useEffect(() => {
    const loadProgress = async () => {
      const progressRef = doc(db, 'video_progress', `${userId}_${videoId}`);
      const progressSnap = await getDoc(progressRef);
      if (progressSnap.exists()) {
        const data = progressSnap.data();
        const maxW = Math.max(data.watched_seconds || 0, data.last_position || 0, maxWatchedSeconds);
        setHighestWatched(maxW);
        if (data.is_completed) setIsCompleted(true);
      }
    };
    loadProgress();
  }, [videoId, userId, maxWatchedSeconds]);

  // Intro splash
  useEffect(() => {
    if (!showIntro) return;
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showIntro]);

  // Initialize YouTube player
  useEffect(() => {
    if (showPoster || showIntro) return;

    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !playerDivRef.current) return;
      const ytId = extractYouTubeId(videoUrl);
      playerRef.current = new window.YT.Player(playerDivRef.current, {
        videoId: ytId,
        playerVars: {
          controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3,
          disablekb: 1, fs: 0, playsinline: 1, showinfo: 0,
          cc_load_policy: 0, origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            setPlayerReady(true);
            setDuration(e.target.getDuration());
            setIsLoading(false);
            if (initialPosition > 0) e.target.seekTo(initialPosition, true);
            if (autoPlay) { e.target.playVideo(); setIsPlaying(true); }
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) { setIsPlaying(true); setIsLoading(false); }
            else if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
            else if (e.data === window.YT.PlayerState.BUFFERING) setIsLoading(true);
            else if (e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              setIsCompleted(true);
              saveProgress(playerRef.current?.getDuration() || duration, true);
              onComplete();
            }
          },
        },
      });
    });

    return () => { cancelled = true; playerRef.current?.destroy?.(); };
  }, [showPoster, showIntro, videoUrl]);

  // Poll time updates
  useEffect(() => {
    if (!playerReady || !isPlaying) { if (pollRef.current) clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      const ct = p.getCurrentTime();
      setCurrentTime(ct);
      if (ct > highestWatched) setHighestWatched(ct);

      const dur = p.getDuration();
      if (dur > 0 && ct / dur >= YT_COMPLETION_THRESHOLD && !thresholdNotified) {
        setThresholdNotified(true);
        onThresholdMet?.();
      }

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveProgress(Math.max(ct, highestWatched), isCompleted);
      }, YT_PROGRESS_SAVE_INTERVAL);
    }, 500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [playerReady, isPlaying, highestWatched, thresholdNotified, isCompleted]);

  const saveProgress = useCallback(async (seconds: number, completed: boolean) => {
    const dur = playerRef.current?.getDuration?.() || duration;
    const percent = dur > 0 ? Math.round((seconds / dur) * 100) : 0;
    const progressRef = doc(db, 'video_progress', `${userId}_${videoId}`);
    await setDoc(progressRef, {
      user_id: userId, video_id: videoId,
      progress_percent: Math.min(percent, 100), is_completed: completed,
      last_watched_at: new Date().toISOString(),
      watched_seconds: Math.round(Math.max(seconds, highestWatched)),
      last_position: Math.round(seconds),
    }, { merge: true });
  }, [userId, videoId, duration, highestWatched]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) { p.pauseVideo(); } else { p.playVideo(); }
  };

  const handleSeek = (value: number[]) => {
    const p = playerRef.current;
    if (!p) return;
    const seekTo = value[0];
    if (isCompleted) { p.seekTo(seekTo, true); setCurrentTime(seekTo); return; }
    if (seekTo > highestWatched + 2) {
      toast.error('আপনি এখনো এই অংশ পর্যন্ত দেখেননি');
      p.seekTo(highestWatched, true);
      return;
    }
    p.seekTo(seekTo, true);
    setCurrentTime(seekTo);
  };

  const skipBack = () => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(Math.max(0, (p.getCurrentTime() || 0) - 10), true);
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted()) { p.unMute(); setIsMuted(false); } else { p.mute(); setIsMuted(true); }
  };

  const changeVolume = (value: number[]) => {
    const p = playerRef.current;
    if (!p) return;
    p.setVolume(value[0]);
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const changePlaybackRate = () => {
    const p = playerRef.current;
    if (!p) return;
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = rates.indexOf(playbackRate);
    const next = rates[(idx + 1) % rates.length];
    p.setPlaybackRate(next);
    setPlaybackRate(next);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const startFromPoster = () => {
    setShowPoster(false);
  };

  if (showPoster) {
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group" onClick={startFromPoster} onContextMenu={e => e.preventDefault()}>
        {posterUrl ? <img src={posterUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-950" />}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
            <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative aspect-video bg-black rounded-lg overflow-hidden select-none" onMouseMove={handleMouseMove} onContextMenu={e => e.preventDefault()}>
      {/* Logo Intro */}
      {showIntro && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center animate-pulse">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 mx-auto mb-3 dark:invert" />
            <p className="text-white/80 text-sm font-medium">Astropixel Academy</p>
          </div>
        </div>
      )}

      {/* YouTube Player (hidden controls) */}
      <div ref={playerDivRef} className="w-full h-full absolute inset-0" />

      {/* Overlay to capture clicks (prevents YouTube controls) */}
      <div className="absolute inset-0 z-10" onClick={togglePlay} />

      {/* Center Play Button */}
      {!isPlaying && !isLoading && !showIntro && playerReady && (
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center z-20 group">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
            <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
          </div>
        </button>
      )}

      {/* Loading */}
      {isLoading && !showIntro && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Controls */}
      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 md:p-4 transition-opacity duration-300 z-30 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="mb-2 md:mb-3">
          <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={handleSeek} className="cursor-pointer" />
          {!isCompleted && highestWatched > 0 && duration > 0 && (
            <div className="relative h-0.5 -mt-2 mb-2 pointer-events-none">
              <div className="absolute h-full bg-emerald-500/40 rounded" style={{ width: `${(highestWatched / duration) * 100}%` }} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2 text-white">
          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20" onClick={togglePlay}>
            {isPlaying ? <Pause className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Play className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20" onClick={skipBack}>
            <SkipBack className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Button>
          <span className="text-[10px] md:text-xs tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex-1" />

          <Button variant="ghost" size="sm" className="h-6 md:h-7 text-[10px] md:text-xs text-white hover:bg-white/20 px-1.5 md:px-2" onClick={changePlaybackRate}>
            {playbackRate}x
          </Button>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            </Button>
            <div className="w-16 hidden md:block">
              <Slider value={[isMuted ? 0 : volume]} max={100} step={1} onValueChange={changeVolume} />
            </div>
          </div>

          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Maximize className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          </Button>
        </div>
      </div>

      {/* Threshold Indicator */}
      {thresholdNotified && !isCompleted && (
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs flex items-center gap-1 animate-bounce z-30">
          <CheckCircle className="w-3 h-3" /> Ready to complete!
        </div>
      )}
      {isCompleted && (
        <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 z-30">
          <CheckCircle className="w-3 h-3" /> Completed
        </div>
      )}
    </div>
  );
}
interface SecureVideoPlayerProps {
  videoUrl: string;
  videoType?: string;
  videoId: string;
  userId: string;
  onComplete: () => void;
  initialPosition?: number;
  maxWatchedSeconds?: number;
  isLessonCompleted?: boolean;
  posterUrl?: string;
  autoPlay?: boolean;
  onThresholdMet?: () => void;
}

const COMPLETION_THRESHOLD = 0.90; // 90%
const PROGRESS_SAVE_INTERVAL = 5000; // 5 seconds

export default function SecureVideoPlayer({
  videoUrl,
  videoType,
  videoId,
  userId,
  onComplete,
  initialPosition = 0,
  maxWatchedSeconds = 0,
  isLessonCompleted = false,
  posterUrl,
  autoPlay = false,
  onThresholdMet,
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [highestWatched, setHighestWatched] = useState(maxWatchedSeconds);
  const [isCompleted, setIsCompleted] = useState(isLessonCompleted);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showPoster, setShowPoster] = useState(!autoPlay);
  const [showIntro, setShowIntro] = useState(autoPlay);
  const [thresholdNotified, setThresholdNotified] = useState(false);
  const [showResMenu, setShowResMenu] = useState(false);
  const [selectedRes, setSelectedRes] = useState('auto');
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const progressSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Disable right-click
  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  // Load existing progress from DB
  useEffect(() => {
    const loadProgress = async () => {
      const progressRef = doc(db, 'video_progress', `${userId}_${videoId}`);
      const progressSnap = await getDoc(progressRef);
      if (progressSnap.exists()) {
        const data = progressSnap.data();
        const maxW = Math.max(data.watched_seconds || 0, data.last_position || 0, maxWatchedSeconds);
        setHighestWatched(maxW);
        if (data.is_completed) {
          setIsCompleted(true);
        }
      }
    };
    loadProgress();
  }, [videoId, userId, maxWatchedSeconds]);

  // Intro splash (3s) then auto-play
  useEffect(() => {
    if (!showIntro) return;
    const timer = setTimeout(() => {
      setShowIntro(false);
      if (autoPlay && videoRef.current) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [autoPlay, showIntro]);

  // Set initial position
  useEffect(() => {
    if (videoRef.current && initialPosition > 0 && !showIntro && !showPoster) {
      videoRef.current.currentTime = initialPosition;
    }
  }, [initialPosition, showIntro, showPoster]);

  // Save progress to DB
  const saveProgress = useCallback(async (seconds: number, completed: boolean) => {
    const percent = duration > 0 ? Math.round((seconds / duration) * 100) : 0;
    const progressRef = doc(db, 'video_progress', `${userId}_${videoId}`);
    await setDoc(progressRef, {
      user_id: userId,
      video_id: videoId,
      progress_percent: Math.min(percent, 100),
      is_completed: completed,
      last_watched_at: new Date().toISOString(),
      watched_seconds: Math.round(Math.max(seconds, highestWatched)),
      last_position: Math.round(seconds),
    }, { merge: true });
  }, [userId, videoId, duration, highestWatched]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    
    setCurrentTime(video.currentTime);
    
    if (video.currentTime > highestWatched) {
      setHighestWatched(video.currentTime);
    }

    // Check 90% threshold
    if (duration > 0 && video.currentTime / duration >= COMPLETION_THRESHOLD && !thresholdNotified) {
      setThresholdNotified(true);
      onThresholdMet?.();
    }

    // Periodic save (every 5s)
    if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
    progressSaveTimer.current = setTimeout(() => {
      saveProgress(Math.max(video.currentTime, highestWatched), isCompleted);
    }, PROGRESS_SAVE_INTERVAL);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTo = value[0];
    // For completed lessons: allow full seeking
    if (isCompleted) {
      video.currentTime = seekTo;
      setCurrentTime(seekTo);
      return;
    }
    // For new lessons: can't seek beyond maxWatchedTime
    if (seekTo > highestWatched + 2) {
      toast.error('আপনি এখনো এই অংশ পর্যন্ত দেখেননি');
      video.currentTime = highestWatched;
      return;
    }
    video.currentTime = seekTo;
    setCurrentTime(seekTo);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsCompleted(true);
    saveProgress(duration, true);
    onComplete();
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const startFromPoster = () => {
    setShowPoster(false);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 100);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const changeVolume = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value[0];
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const changePlaybackRate = () => {
    const video = videoRef.current;
    if (!video) return;
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = rates.indexOf(playbackRate);
    const next = rates[(idx + 1) % rates.length];
    video.playbackRate = next;
    setPlaybackRate(next);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const skipBack = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const resolutions = [
    { label: 'Auto', value: 'auto' },
    { label: '1080p', value: '1080' },
    { label: '720p', value: '720' },
    { label: '480p', value: '480' },
    { label: '360p', value: '360' },
  ];

  const getVideoUrl = () => {
    if (selectedRes === 'auto' || !videoUrl.includes('cloudinary')) return videoUrl;
    return videoUrl.replace('/upload/', `/upload/q_auto,h_${selectedRes}/`);
  };

  const changeResolution = (res: string) => {
    const video = videoRef.current;
    const time = video?.currentTime || 0;
    const wasPlaying = !video?.paused;
    setSelectedRes(res);
    setShowResMenu(false);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        if (wasPlaying) videoRef.current.play();
      }
    }, 100);
  };


  // YouTube custom player using IFrame API
  if (videoType === 'youtube') {
    return (
      <YouTubeCustomPlayer
        videoUrl={videoUrl}
        videoId={videoId}
        userId={userId}
        onComplete={onComplete}
        initialPosition={initialPosition}
        maxWatchedSeconds={maxWatchedSeconds}
        isLessonCompleted={isLessonCompleted}
        posterUrl={posterUrl}
        autoPlay={autoPlay}
        onThresholdMet={onThresholdMet}
      />
    );
  }

  // Vimeo iframe fallback for legacy videos
  if (videoType === 'vimeo') {
    const vimeoId = videoUrl.split('/').pop();
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden" onContextMenu={e => e.preventDefault()}>
        <iframe src={`https://player.vimeo.com/video/${vimeoId}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }

  // Poster/thumbnail screen
  if (showPoster) {
    return (
      <div
        className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group"
        onClick={startFromPoster}
        onContextMenu={e => e.preventDefault()}
      >
        {posterUrl ? (
          <img src={posterUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
            <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Logo Intro Splash */}
      {showIntro && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center animate-pulse">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 mx-auto mb-3 dark:invert" />
            <p className="text-white/80 text-sm font-medium">Astropixel Academy</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={getVideoUrl()}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setIsLoading(false);
          }
        }}
        onEnded={handleEnded}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onClick={togglePlay}
        controlsList="nodownload"
        disablePictureInPicture
        playsInline
      />

      {/* Center Play Button */}
      {!isPlaying && !isLoading && !showIntro && (
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center z-10 group">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
            <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
          </div>
        </button>
      )}

      {/* Loading */}
      {isLoading && !showIntro && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Controls */}
      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 md:p-4 transition-opacity duration-300 z-30 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="mb-2 md:mb-3">
          <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={handleSeek} className="cursor-pointer" />
          {!isCompleted && highestWatched > 0 && duration > 0 && (
            <div className="relative h-0.5 -mt-2 mb-2 pointer-events-none">
              <div className="absolute h-full bg-emerald-500/40 rounded" style={{ width: `${(highestWatched / duration) * 100}%` }} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2 text-white">
          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20" onClick={togglePlay}>
            {isPlaying ? <Pause className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Play className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20" onClick={skipBack}>
            <SkipBack className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Button>
          <span className="text-[10px] md:text-xs tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex-1" />

          {/* Resolution */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="h-6 md:h-7 text-[10px] md:text-xs text-white hover:bg-white/20 px-1.5 md:px-2 gap-1" onClick={() => setShowResMenu(!showResMenu)}>
              <Settings className="w-3 h-3" />
              {selectedRes === 'auto' ? 'Auto' : `${selectedRes}p`}
            </Button>
            {showResMenu && (
              <div className="absolute bottom-full right-0 mb-1 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg py-1 min-w-[100px] z-50">
                {resolutions.map(res => (
                  <button key={res.value} onClick={() => changeResolution(res.value)}
                    className={`w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 ${selectedRes === res.value ? 'text-primary font-semibold' : 'text-white/80'}`}>
                    {res.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button variant="ghost" size="sm" className="h-6 md:h-7 text-[10px] md:text-xs text-white hover:bg-white/20 px-1.5 md:px-2" onClick={changePlaybackRate}>
            {playbackRate}x
          </Button>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            </Button>
            <div className="w-16 hidden md:block">
              <Slider value={[isMuted ? 0 : volume]} max={1} step={0.01} onValueChange={changeVolume} />
            </div>
          </div>

          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-white hover:bg-white/20" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Maximize className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          </Button>
        </div>
      </div>

      {/* Threshold Indicator */}
      {thresholdNotified && !isCompleted && (
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs flex items-center gap-1 animate-bounce z-30">
          <CheckCircle className="w-3 h-3" /> Ready to complete!
        </div>
      )}

      {isCompleted && (
        <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 z-30">
          <CheckCircle className="w-3 h-3" /> Completed
        </div>
      )}
    </div>
  );
}
