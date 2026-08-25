import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import learnLogo from '@/assets/learn-with-alphazero-logo.png.asset.json';
import CoursesFooter from '@/components/CoursesFooter';
import {
  CheckCircle2, Calendar, Clock, Users, GraduationCap,
  PlayCircle, Sparkles, BookOpen, ArrowRight, AlertCircle, Target,
} from 'lucide-react';

import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY as SUPABASE_ANON } from "@/lib/env";

// Extract YouTube video ID from various YouTube URL formats
function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

type Module = { id: string; title: string; description: string | null; order_index: number };
type FAQ = { question: string; answer: string };
type CourseData = {
  course: {
    id: string;
    title: string;
    title_en?: string;
    description?: string;
    description_en?: string;
    short_description?: string;
    short_description_en?: string;
    thumbnail_url?: string;
    price: number;
    course_type?: string;
    landing_slug?: string;
    trainer_name?: string;
    trainer_image?: string;
    trainer_designation?: string;
    trainer_bio?: string;
    trainer_bio_en?: string;
    start_date?: string;
    class_time?: string;
    total_classes?: string;
    duration?: string;
    learning_outcomes?: string[];
    why_learn?: string[];
    intro_video_url?: string | null;
    faqs?: FAQ[];
    instructors?: Array<{ name: string; designation: string | null; image: string | null; bio: string | null }>;
  };
  modules: Module[];
  lesson_count: number;
};

export default function CourseLandingPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ slug: string }>();
  const slug = params.slug || 'vibe-coding';
  const isBn = language === 'bn';
  const [data, setData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/public-course-info?slug=${encodeURIComponent(slug)}`,
          { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } },
        );
        const j = await res.json();
        if (!alive) return;
        if (!res.ok || !j.success) throw new Error(j.error || 'Failed');
        setData(j);
      } catch (e) {
        if (alive) setError((e as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  const c = data?.course;
  const title = isBn ? c?.title : (c?.title_en || c?.title);
  const desc = isBn ? c?.description : (c?.description_en || c?.description);
  const shortDesc = isBn ? c?.short_description : (c?.short_description_en || c?.short_description);
  const bio = isBn ? c?.trainer_bio : (c?.trainer_bio_en || c?.trainer_bio);
  const outcomes = c?.learning_outcomes ?? [];
  const whyLearn = c?.why_learn ?? [];
  const faqs = c?.faqs ?? [];
  const videoId = getYouTubeId(c?.intro_video_url);

  const seoTitle = useMemo(
    () => title ? `${title} | Astropixel` : 'Course | Astropixel',
    [title]
  );
  const seoDesc = (shortDesc || desc || '').slice(0, 155);

  // SEO: set title, meta description, canonical, OG, and JSON-LD without react-helmet
  useEffect(() => {
    if (!c) return;
    document.title = seoTitle;
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
      if (!el) {
        if (selector.startsWith('link')) {
          el = document.createElement('link');
          (el as HTMLLinkElement).rel = 'canonical';
        } else {
          el = document.createElement('meta');
          const m = selector.match(/\[(name|property)="([^"]+)"\]/);
          if (m) el.setAttribute(m[1], m[2]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    setMeta('meta[name="description"]', 'content', seoDesc);
    setMeta('link[rel="canonical"]', 'href', `https://astropixel.tech/courses/${slug}`);
    setMeta('meta[property="og:title"]', 'content', seoTitle);
    setMeta('meta[property="og:description"]', 'content', seoDesc);
    if (c.thumbnail_url) setMeta('meta[property="og:image"]', 'content', c.thumbnail_url);

    const ldId = 'course-landing-jsonld';
    let ld = document.getElementById(ldId) as HTMLScriptElement | null;
    if (!ld) {
      ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.id = ldId;
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: title,
      description: seoDesc,
      provider: { '@type': 'Organization', name: 'Astropixel', sameAs: 'https://astropixel.tech' },
      image: c.thumbnail_url,
      offers: { '@type': 'Offer', price: c.price, priceCurrency: 'BDT' },
    });
  }, [c, seoTitle, seoDesc, title]);


  const loginHref = '/student/login';
  const signupHref = '/student/login?mode=signup';
  const handleEnroll = () => {
    if (user) {
      navigate(`/student?enroll=${c?.id ?? ''}`);
    } else {
      const next = encodeURIComponent(`/student?enroll=${c?.id ?? ''}`);
      navigate(`/student/login?redirect=${next}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg">
        <div className="container mx-auto px-4 py-20 space-y-8">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !c) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center px-4">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="font-display text-2xl">
              {isBn ? 'কোর্স লোড করা যায়নি' : 'Could not load course'}
            </h1>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button asChild><Link to="/courses">{isBn ? 'সব কোর্স দেখুন' : 'Browse Courses'}</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* Minimal top bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/courses'))}
              aria-label={isBn ? 'পিছনে যান' : 'Go back'}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <Link to="/" className="flex items-center" aria-label="Learn with Astropixel">
              <div
                className="h-9 w-36"
                style={{
                  backgroundImage: `linear-gradient(90deg, hsl(var(--gradient-start)), hsl(var(--gradient-mid)), hsl(var(--gradient-end)))`,
                  WebkitMaskImage: `url(${learnLogo.url})`,
                  maskImage: `url(${learnLogo.url})`,
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'left center',
                  maskPosition: 'left center',
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                }}
              />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <a href={loginHref} className="text-sm font-semibold text-slate-700 hover:text-cyan-600 px-3 py-1.5">{isBn ? 'লগইন' : 'Login'}</a>
            <button onClick={handleEnroll} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm">
              {isBn ? 'এনরোল' : 'Enroll'}
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="bg-[#0B1120] text-white py-12 lg:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                  Astropixel Academy
                </span>
                {c.course_type && (
                  <span className="bg-white/5 text-slate-300 border border-white/10 px-3 py-1 rounded-full text-xs font-semibold capitalize">
                    {c.course_type.replace('_', ' ')}
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-tight text-white">
                {title}
              </h1>
              {shortDesc && (
                <p className="text-base md:text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed">
                  {shortDesc}
                </p>
              )}
              <div className="flex flex-wrap gap-6">
                {c.duration && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{isBn ? 'সময়কাল' : 'Duration'}</p>
                      <p className="text-sm font-semibold">{c.duration}</p>
                    </div>
                  </div>
                )}
                {c.total_classes && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{isBn ? 'মোট ক্লাস' : 'Classes'}</p>
                      <p className="text-sm font-semibold">{c.total_classes}</p>
                    </div>
                  </div>
                )}
                {c.start_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{isBn ? 'শুরু' : 'Start'}</p>
                      <p className="text-sm font-semibold">{c.start_date}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-800 border border-white/10 shadow-2xl">
                  {videoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                      title={title || 'Course intro'}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : c.thumbnail_url ? (
                    <img src={c.thumbnail_url} alt={title || 'Course'} className="w-full h-full object-cover" loading="eager" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                      <BookOpen className="h-20 w-20 text-slate-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-8">

            {/* About */}
            {desc && (
              <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <span className="w-2 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
                  {isBn ? 'কোর্স সম্পর্কে' : 'About this Course'}
                </h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{desc}</p>
              </section>
            )}

            {/* Instructors */}
            {(() => {
              const list = (c.instructors && c.instructors.length > 0)
                ? c.instructors
                : (c.trainer_name
                    ? [{
                        name: c.trainer_name,
                        designation: c.trainer_designation || null,
                        image: c.trainer_image || null,
                        bio: bio || null,
                      }]
                    : []);
              if (list.length === 0) return null;
              const isMulti = list.length > 1;
              return (
                <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="w-2 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
                    {isBn ? (isMulti ? 'ইন্সট্রাক্টররা' : 'ইন্সট্রাক্টর') : (isMulti ? 'Instructors' : 'Instructor')}
                  </h2>
                  <div className={isMulti ? 'grid sm:grid-cols-2 gap-5' : 'flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start'}>
                    {list.map((ins, idx) => (
                      <div
                        key={idx}
                        className={
                          isMulti
                            ? 'flex gap-4 items-center p-4 rounded-xl border border-slate-200 bg-slate-50/60'
                            : 'flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start w-full'
                        }
                      >
                        <div className={`${isMulti ? 'w-20 h-20' : 'w-32 h-32 md:w-40 md:h-40'} rounded-2xl overflow-hidden shadow-md shrink-0 bg-gradient-to-br from-cyan-100 to-slate-100 flex items-center justify-center`}>
                          {ins.image ? (
                            <img
                              src={ins.image}
                              alt={ins.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const t = e.currentTarget;
                                t.onerror = null;
                                t.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ins.name)}&background=0d9488&color=fff&size=256&bold=true`;
                              }}
                            />
                          ) : (
                            <span className={`${isMulti ? 'text-2xl' : 'text-4xl'} font-bold text-cyan-700`}>
                              {ins.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className={isMulti ? 'flex-1 min-w-0' : 'text-center md:text-left'}>
                          <h3 className={`${isMulti ? 'text-base md:text-lg' : 'text-xl md:text-2xl'} font-bold text-slate-800 mb-1`}>
                            {ins.name}
                          </h3>
                          {ins.designation && (
                            <p className={`text-cyan-600 font-semibold ${isMulti ? 'text-sm mb-0' : 'mb-3'}`}>
                              {ins.designation}
                            </p>
                          )}
                          {!isMulti && ins.bio && (
                            <p className="text-slate-600 leading-relaxed">{ins.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Why learn */}
            {whyLearn.length > 0 && (
              <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
                  {isBn ? 'কেন এই কোর্স শিখবেন' : 'Why Learn This Course'}
                </h2>
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                  {whyLearn.map((w, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600">{w}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Syllabus / Modules */}
            {data!.modules.length > 0 && (
              <section id="syllabus">
                <h2 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <span className="w-2 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
                  {isBn ? 'কোর্স সিলেবাস' : 'Course Syllabus'}
                </h2>
                <Accordion type="single" collapsible className="space-y-3">
                  {data!.modules.map((m, i) => (
                    <AccordionItem
                      key={m.id}
                      value={`mod-${m.id}`}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden data-[state=open]:border-cyan-500 data-[state=open]:shadow-md"
                    >
                      <AccordionTrigger className="px-5 py-4 hover:bg-slate-50 hover:no-underline data-[state=open]:bg-cyan-50 data-[state=open]:text-cyan-900">
                        <div className="flex items-center gap-3 text-left">
                          <span className="h-8 w-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm font-bold shrink-0">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="font-bold text-slate-800">{m.title}</span>
                        </div>
                      </AccordionTrigger>
                      {m.description && (
                        <AccordionContent className="px-5 pb-5 pt-1 text-slate-600 border-t border-slate-100 whitespace-pre-line">
                          {m.description}
                        </AccordionContent>
                      )}
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            {/* What you'll learn */}
            {outcomes.length > 0 && (
              <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
                  {isBn ? 'এই কোর্স থেকে যা শিখবেন' : "What You'll Learn"}
                </h2>
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                  {outcomes.map((o, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600">{o}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {faqs.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <span className="w-2 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
                  {isBn ? 'সাধারণ প্রশ্ন' : 'Frequently Asked Questions'}
                </h2>
                <Accordion type="single" collapsible className="space-y-3">
                  {faqs.map((f, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="bg-white rounded-xl border border-slate-200 px-5">
                      <AccordionTrigger className="text-left font-semibold hover:no-underline">{f.question}</AccordionTrigger>
                      <AccordionContent className="text-slate-600">{f.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
          </div>

          {/* RIGHT STICKY SIDEBAR */}
          <aside className="lg:col-span-4 lg:sticky lg:top-20">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
              {c.thumbnail_url && !videoId && (
                <img src={c.thumbnail_url} alt="" className="w-full aspect-video object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl md:text-4xl font-black text-slate-900">৳{Number(c.price).toLocaleString()}</span>
                </div>

                <button
                  onClick={handleEnroll}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white py-4 rounded-xl font-bold text-lg mb-6 shadow-lg shadow-cyan-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isBn ? 'কোর্সটি এনরোল করুন' : 'Enroll Now'}
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">
                    {isBn ? 'এই কোর্সে যা যা থাকছে:' : "What's Included:"}
                  </h4>
                  <ul className="space-y-3">
                    {c.total_classes && (
                      <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                        <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center shrink-0">
                          <PlayCircle className="w-4 h-4 text-cyan-600" />
                        </div>
                        {c.total_classes} {isBn ? 'ক্লাস' : 'Classes'}
                      </li>
                    )}
                    {c.duration && (
                      <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                        <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-cyan-600" />
                        </div>
                        {c.duration}
                      </li>
                    )}
                    {c.class_time && (
                      <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                        <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-cyan-600" />
                        </div>
                        {c.class_time}
                      </li>
                    )}
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4 text-cyan-600" />
                      </div>
                      {isBn ? 'কোর্স সার্টিফিকেট' : 'Course Certificate'}
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-cyan-600" />
                      </div>
                      {isBn ? '২৪/৭ সাপোর্ট' : '24/7 Support'}
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100">
                  <a href={signupHref} className="block text-center text-sm font-semibold text-cyan-700 hover:text-cyan-900">
                    {isBn ? 'নতুন? সাইন আপ করুন →' : 'New here? Sign up →'}
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky enroll bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 flex items-center gap-3 z-40 shadow-2xl">
        <div className="flex-1">
          <div className="text-lg font-black text-slate-900 leading-none">৳{Number(c.price).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{isBn ? 'কোর্স ফি' : 'Course Fee'}</div>
        </div>
        <button onClick={handleEnroll} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2">
          {isBn ? 'এনরোল' : 'Enroll'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <CoursesFooter />
    </div>
  );
}
