import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import learnOgImage from "@/assets/learn-og-image.jpg.asset.json";
import coursesHeroBgAssetJson from "@/assets/courses-hero-bg.png.asset.json";
const coursesHeroBg = coursesHeroBgAssetJson.url;
import instructorHH from "@/assets/instructors/hh.png.asset.json";
import heroIllustration from "@/assets/hero-illustration.png.asset.json";
import instructorNayeem from "@/assets/instructors/nayeem.png.asset.json";
import instructorAtik from "@/assets/instructors/Atik.png.asset.json";
import instructorShafiul from "@/assets/instructors/shafiul.png.asset.json";
import instructorPapiya from "@/assets/instructors/papiya.png.asset.json";
import instructorPrantik from "@/assets/instructors/prantik.png.asset.json";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, Monitor, Palette, Video, Camera, TrendingUp, Code, Sparkles, Bot, Globe,
  CheckCircle2, BookOpen, Star, Zap, Target, Award, Clock, Wrench, Lock, Loader2, LucideIcon,
  ArrowRight, ArrowLeft, Users, Play, ChevronLeft, ChevronRight
} from "lucide-react";
import Layout from "@/components/Layout";
import learnLogoAssetJson from "@/assets/learn-with-alphazero-logo.png.asset.json";
const learnLogo = learnLogoAssetJson.url;
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppSwiper } from "@/components/ui/app-swiper";
import { useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePublicCourses } from "@/hooks/usePublicCourses";
import { usePageContent } from "@/hooks/usePageContent";
import CourseEnrollmentModal from "@/components/student/CourseEnrollmentModal";
import { Course } from "@/types/lms";

// Trainers based on existing team members with images
const trainers = {
  sofiullah: {
    name: "Sofiullah Ahammad",
    qualificationEn: "Graphics Designer, Vibe Coding Expert",
    qualificationBn: "গ্রাফিক্স ডিজাইনার, ভাইব কোডিং এক্সপার্ট",
    image: instructorAtik.url
  },
  adib: {
    name: "Adib Sarkar",
    qualificationEn: "Lead Designer, Entrepreneur",
    qualificationBn: "লিড ডিজাইনার, উদ্যোক্তা",
    image: instructorHH.url
  },
  nayeem: {
    name: "Md Nayeem Ahmed",
    qualificationEn: "Digital Marketer",
    qualificationBn: "ডিজিটাল মার্কেটার",
    image: instructorNayeem.url
  },
  shafiul: {
    name: "Md. Shafiul Haque",
    qualificationEn: "Video Editor, Cinematographer",
    qualificationBn: "ভিডিও এডিটর, সিনেমাটোগ্রাফার",
    image: instructorShafiul.url
  },
  prantik: {
    name: "Prantik Saha",
    qualificationEn: "Microsoft Office Expert, IT Support",
    qualificationBn: "মাইক্রোসফট অফিস এক্সপার্ট, আইটি সাপোর্ট",
    image: instructorPrantik.url
  },
  papiya: {
    name: "Papia Rahman",
    qualificationEn: "Graphic Designer",
    qualificationBn: "গ্রাফিক ডিজাইনার",
    image: instructorPapiya.url
  },
  rashadul: {
    name: "Rashadul Islam Naime",
    qualificationEn: "Digital Marketer, SEO Expert",
    qualificationBn: "ডিজিটাল মার্কেটার, এসইও এক্সপার্ট",
    image: "https://res.cloudinary.com/de348sqlb/image/upload/v1784827649/alphazero-assets/team/rashadul-islam-naime.png"
  }
};


interface CourseMetadata {
  icon: LucideIcon;
  color: string;
  trainer: typeof trainers.sofiullah | null;
  featuresBn: string[];
  featuresEn: string[];
  isSpecial?: boolean;
  isUpcoming?: boolean;
  specialContentBn?: { title: string; points: string[] };
  specialContentEn?: { title: string; points: string[] };
}

const getCourseMetadata = (title: string): CourseMetadata => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('google') || lowerTitle.includes('knowledge')) {
    return { icon: Globe, color: "from-blue-500 to-cyan-500", trainer: trainers.sofiullah,
      featuresBn: ["গুগল সার্চ অপ্টিমাইজেশন", "ব্র্যান্ড ভেরিফিকেশন", "উইকিপিডিয়া এন্ট্রি গাইড", "সোশ্যাল প্রোফাইল সেটআপ"],
      featuresEn: ["Google Search Optimization", "Brand Verification", "Wikipedia Entry Guide", "Social Profile Setup"] };
  }
  if (lowerTitle.includes('microsoft') || lowerTitle.includes('office')) {
    return { icon: Monitor, color: "from-orange-500 to-red-500", trainer: trainers.prantik,
      featuresBn: ["MS Word মাস্টারি", "Excel ফর্মুলা ও ডাটা এনালাইসিস", "PowerPoint প্রেজেন্টেশন", "অফিস অটোমেশন"],
      featuresEn: ["MS Word Mastery", "Excel Formulas & Data Analysis", "PowerPoint Presentations", "Office Automation"] };
  }
  if (lowerTitle.includes('graphic') || lowerTitle.includes('গ্রাফিক')) {
    return { icon: Palette, color: "from-purple-500 to-pink-500", trainer: trainers.papiya,
      featuresBn: ["Adobe Photoshop", "Adobe Illustrator", "লোগো ও ব্র্যান্ডিং", "সোশ্যাল মিডিয়া ডিজাইন"],
      featuresEn: ["Adobe Photoshop", "Adobe Illustrator", "Logo & Branding", "Social Media Design"] };
  }
  if (lowerTitle.includes('video') || lowerTitle.includes('ভিডিও')) {
    return { icon: Video, color: "from-red-500 to-orange-500", trainer: trainers.shafiul,
      featuresBn: ["Adobe Premiere Pro", "কালার গ্রেডিং", "সাউন্ড ডিজাইন", "সোশ্যাল মিডিয়া ভিডিও"],
      featuresEn: ["Adobe Premiere Pro", "Color Grading", "Sound Design", "Social Media Videos"] };
  }
  if (lowerTitle.includes('photo') || lowerTitle.includes('ফটো')) {
    return { icon: Camera, color: "from-amber-500 to-yellow-500", trainer: trainers.sofiullah,
      featuresBn: ["ক্যামেরা বেসিক", "লাইটিং টেকনিক", "ফটো এডিটিং", "পোর্টফোলিও বিল্ডিং"],
      featuresEn: ["Camera Basics", "Lighting Techniques", "Photo Editing", "Portfolio Building"] };
  }
  if (lowerTitle.includes('seo') || lowerTitle.includes('marketing')) {
    return { icon: TrendingUp, color: "from-green-500 to-emerald-500", trainer: trainers.sofiullah,
      featuresBn: ["অন-পেজ ও অফ-পেজ SEO", "গুগল অ্যাডস", "ফেসবুক ও ইনস্টাগ্রাম মার্কেটিং", "এনালিটিক্স ও রিপোর্টিং"],
      featuresEn: ["On-Page & Off-Page SEO", "Google Ads", "Facebook & Instagram Marketing", "Analytics & Reporting"],
      isUpcoming: true };
  }
  if (lowerTitle.includes('web') && (lowerTitle.includes('coding') || lowerTitle.includes('html'))) {
    return { icon: Code, color: "from-cyan-500 to-blue-500", trainer: null,
      featuresBn: ["HTML5 ফান্ডামেন্টালস", "CSS3 ও Flexbox", "JavaScript বেসিক", "রেস্পন্সিভ ডিজাইন"],
      featuresEn: ["HTML5 Fundamentals", "CSS3 & Flexbox", "JavaScript Basics", "Responsive Design"],
      isUpcoming: true, isSpecial: true,
      specialContentBn: { title: "ওয়েব কোডিং কেন শিখবেন?", points: ["নিজের হাতে প্রফেশনাল ওয়েবসাইট বানান", "ফ্রিল্যান্সিং ও জব মার্কেটে সবচেয়ে চাহিদাসম্পন্ন স্কিল", "ওয়েব ডেভেলপার হিসেবে ক্যারিয়ার শুরু করুন"] },
      specialContentEn: { title: "Why Learn Web Coding?", points: ["Build professional websites with your own hands", "Most in-demand skill in freelancing & job market", "Start your career as a web developer"] } };
  }
  if (lowerTitle.includes('motion') || lowerTitle.includes('after effects')) {
    return { icon: Sparkles, color: "from-violet-500 to-purple-500", trainer: trainers.shafiul,
      featuresBn: ["After Effects বেসিক", "কীফ্রেম অ্যানিমেশন", "টেক্সট অ্যানিমেশন", "ভিজ্যুয়াল ইফেক্টস"],
      featuresEn: ["After Effects Basics", "Keyframe Animation", "Text Animation", "Visual Effects"],
      isSpecial: true,
      specialContentBn: { title: "মোশন গ্রাফিক্স কেন শিখবেন?", points: ["YouTube, Facebook, TikTok-এর জন্য প্রো-লেভেল ভিডিও বানান", "ব্র্যান্ডের জন্য লোগো অ্যানিমেশন ও ইন্ট্রো তৈরি করুন", "ফ্রিল্যান্সিং ও জব মার্কেটে হাই-ডিমান্ড স্কিল"] },
      specialContentEn: { title: "Why Learn Motion Graphics?", points: ["Create pro-level videos for YouTube, Facebook, TikTok", "Make logo animations & intros for brands", "High-demand skill in freelancing & job market"] } };
  }
  if (lowerTitle.includes('vibe') || lowerTitle.includes('ভাইব')) {
    return { icon: Zap, color: "from-pink-500 to-rose-500", trainer: trainers.sofiullah,
      featuresBn: ["AI ওয়েবসাইট বিল্ডার", "প্রম্পট টু ডিজাইন", "নো-কোড ডেভেলপমেন্ট", "হোস্টিং ও পাবলিশিং"],
      featuresEn: ["AI Website Builder", "Prompt to Design", "No-Code Development", "Hosting & Publishing"],
      isSpecial: true,
      specialContentBn: { title: "ভাইব কোডিং কি?", points: ["কোডিং না জেনেও সম্পূর্ণ ওয়েবসাইট তৈরি করুন", "AI টুলস ব্যবহার করে HTML, CSS, ডিজাইন জেনারেট করুন", "আইডিয়া → প্রম্পট → ওয়েবসাইট - এই সিম্পল ওয়ার্কফ্লো শিখুন"] },
      specialContentEn: { title: "What is Vibe Coding?", points: ["Create complete websites without knowing coding", "Generate HTML, CSS, design using AI tools", "Learn the simple workflow: Idea → Prompt → Website"] } };
  }
  if (lowerTitle.includes('ai') || lowerTitle.includes('prompt')) {
    return { icon: Bot, color: "from-indigo-500 to-blue-500", trainer: trainers.sofiullah,
      featuresBn: ["প্রম্পট স্ট্রাকচার", "রোল প্রম্পটিং", "টাস্ক-বেজড প্রম্পট", "AI অটোমেশন"],
      featuresEn: ["Prompt Structure", "Role Prompting", "Task-Based Prompts", "AI Automation"],
      isSpecial: true,
      specialContentBn: { title: "AI প্রম্পট ইঞ্জিনিয়ারিং কি শেখায়?", points: ["AI টুলসের জন্য ইফেক্টিভ প্রম্পট লেখা শিখুন", "ডিজাইন, কোডিং, মার্কেটিং, কন্টেন্টে AI ব্যবহার", "ChatGPT, Claude, Midjourney সব AI মাস্টার করুন"] },
      specialContentEn: { title: "What does AI Prompt Engineering teach?", points: ["Learn to write effective prompts for AI tools", "Use AI for design, coding, marketing, content", "Master all AI tools: ChatGPT, Claude, Midjourney"] } };
  }
  if (lowerTitle.includes('it') || lowerTitle.includes('support') || lowerTitle.includes('সাপোর্ট')) {
    return { icon: Wrench, color: "from-slate-500 to-zinc-600", trainer: trainers.prantik,
      featuresBn: ["কম্পিউটার ট্রাবলশুটিং", "নেটওয়ার্ক সেটআপ", "হার্ডওয়্যার মেইনটেন্যান্স", "সফটওয়্যার ইনস্টলেশন"],
      featuresEn: ["Computer Troubleshooting", "Network Setup", "Hardware Maintenance", "Software Installation"],
      isSpecial: true,
      specialContentBn: { title: "আইটি সাপোর্ট কেন শিখবেন?", points: ["যেকোনো অফিস বা প্রতিষ্ঠানে IT সাপোর্ট জব পান", "নিজের কম্পিউটার ও নেটওয়ার্ক সমস্যা সমাধান করুন", "ফ্রিল্যান্স টেক সাপোর্ট সার্ভিস দিন"] },
      specialContentEn: { title: "Why Learn IT Support?", points: ["Get IT support jobs in any office or organization", "Solve your own computer & network problems", "Provide freelance tech support services"] } };
  }
  return { icon: BookOpen, color: "from-primary to-purple-500", trainer: null,
    featuresBn: ["অনলাইন ক্লাস", "সার্টিফিকেট", "লাইফটাইম অ্যাক্সেস", "সাপোর্ট"],
    featuresEn: ["Online Classes", "Certificate", "Lifetime Access", "Support"] };
};

const translations = {
  en: {
    badge: "100% Online-Based Courses", title: "Learn with Astropixel",
    subtitle: "Learn practical, job-ready and AI-powered skills. Build websites, brands and digital careers without deep technical knowledge.",
    beginnerFriendly: "Beginner-Friendly", certificate: "Certificate Provided", expertTrainer: "Expert Trainers",
    aboutTitle: "About", aboutDesc: "Learn with Astropixel teaches practical, job-ready and AI-powered skills so students can build websites, brands, and digital careers without needing deep technical knowledge. All courses are 100% online-based, designed for beginners and affordable for Bangladesh market.",
    ourCourses: "Our", coursesTitle: "Courses", coursesSubtitle: "Professional Online Courses - Start Your Career Today",
    popularCourses: "Courses",
    coursesDesc: "We have designed our courses with the most demanding professional skills. The knowledge, experience, and expertise gained through the program will ensure your desired career in the global market. From the list below you can enroll in any online or offline course at any time.",
    catAll: "All Course", catGraphic: "Graphic & Multimedia", catWeb: "Web & Software", catMarketing: "Digital Marketing", cat3D: "3D Animation & Visualization",
    special: "Special", upcoming: "Coming Soon", trainer: "Trainer", courseFee: "Course Fee",
    enrollNow: "Enroll Now", free: "Free", readMore: "Read More", readLess: "Show Less",
    startCareer: "Start Your Digital Career", startToday: "Today",
    ctaSubtitle: "100% Online Courses • Beginner-Friendly • Certificate Provided • Expert Trainers",
    enrollButton: "Enroll Now", whatsappContact: "WhatsApp Contact",
    noCourses: "No courses available yet", noCoursesDesc: "Please check back later for new courses.", loading: "Loading courses...",
    loginFirst: "Please login first to enroll",
  },
  bn: {
    badge: "১০০% অনলাইন-ভিত্তিক কোর্স", title: "Learn with Astropixel",
    subtitle: "প্র্যাক্টিক্যাল, জব-রেডি ও AI-পাওয়ার্ড স্কিল শিখুন। কোনো টেকনিক্যাল জ্ঞান ছাড়াই ওয়েবসাইট, ব্র্যান্ড ও ডিজিটাল ক্যারিয়ার গড়ুন।",
    beginnerFriendly: "বিগিনার-ফ্রেন্ডলি", certificate: "সার্টিফিকেট প্রদান", expertTrainer: "এক্সপার্ট ট্রেইনার",
    aboutTitle: "সম্পর্কে", aboutDesc: "Learn with Astropixel প্র্যাক্টিক্যাল, জব-রেডি এবং AI-পাওয়ার্ড স্কিল শেখায় যাতে শিক্ষার্থীরা গভীর টেকনিক্যাল জ্ঞান ছাড়াই ওয়েবসাইট, ব্র্যান্ড এবং ডিজিটাল ক্যারিয়ার গড়ে তুলতে পারে। আমাদের সব কোর্স ১০০% অনলাইন-ভিত্তিক, বিগিনার ও আধুনিক শিক্ষার্থীদের জন্য ডিজাইন করা এবং বাংলাদেশের বাজারের জন্য সাশ্রয়ী মূল্যে।",
    ourCourses: "আমাদের", coursesTitle: "কোর্সসমূহ", coursesSubtitle: "প্রফেশনাল অনলাইন কোর্স - আপনার ক্যারিয়ার শুরু করুন আজই",
    popularCourses: "কোর্স",
    coursesDesc: "আমরা সবচেয়ে চাহিদাসম্পন্ন প্রফেশনাল স্কিল দিয়ে আমাদের কোর্সগুলো সাজিয়েছি। এই প্রোগ্রাম থেকে অর্জিত জ্ঞান, অভিজ্ঞতা ও দক্ষতা গ্লোবাল মার্কেটে আপনার কাঙ্ক্ষিত ক্যারিয়ার নিশ্চিত করবে। নিচের তালিকা থেকে যেকোনো সময় অনলাইন বা অফলাইন কোর্সে ভর্তি হতে পারবেন।",
    catAll: "সব কোর্স", catGraphic: "গ্রাফিক ও মাল্টিমিডিয়া", catWeb: "ওয়েব ও সফটওয়্যার", catMarketing: "ডিজিটাল মার্কেটিং", cat3D: "৩ডি অ্যানিমেশন",
    special: "স্পেশাল", upcoming: "আসছে শীঘ্রই", trainer: "ট্রেইনার", courseFee: "কোর্স ফি",
    enrollNow: "এখনই ভর্তি হন", free: "ফ্রি", readMore: "আরো দেখুন", readLess: "কম দেখুন",
    startCareer: "আপনার ডিজিটাল ক্যারিয়ার", startToday: "শুরু করুন আজই",
    ctaSubtitle: "১০০% অনলাইন কোর্স • বিগিনার-ফ্রেন্ডলি • সার্টিফিকেট প্রদান • এক্সপার্ট ট্রেইনার",
    enrollButton: "এখনই ভর্তি হন", whatsappContact: "WhatsApp-এ যোগাযোগ",
    noCourses: "এখনো কোনো কোর্স নেই", noCoursesDesc: "নতুন কোর্সের জন্য পরে আবার দেখুন।", loading: "কোর্স লোড হচ্ছে...",
    loginFirst: "এনরোল করতে আগে লগইন করুন",
  }
};

const CoursesPage = () => {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isBn = language === "bn";
  const t = isBn ? translations.bn : translations.en;
  const { getContent: getPageContent } = usePageContent("courses", "learn");
  const cms = (bnKey: string, enKey: string, bnFb: string, enFb: string) =>
    isBn ? (getPageContent(bnKey) || bnFb) : (getPageContent(enKey) || enFb);
  const { courses: dbCourses, isLoading: coursesLoading } = usePublicCourses();
  const routeLoc = useLocation();
  const isAllCoursesRoute = routeLoc.pathname === "/courses/all";

  // Enrollment modal state
  const [enrollmentCourse, setEnrollmentCourse] = useState<Course | null>(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("all");
  

  const categories = useMemo(() => ([
    { id: "all", label: t.catAll, match: null as RegExp | null },
    { id: "graphic", label: t.catGraphic, match: /graphic|multimedia|photo|design|ui|ux|brand/i },
    { id: "web", label: t.catWeb, match: /web|software|code|coding|vibe|develop|program/i },
    { id: "marketing", label: t.catMarketing, match: /market|seo|social|digital market|facebook|ad/i },
    { id: "3d", label: t.cat3D, match: /3d|animation|motion|video|vfx|render/i },
  ]), [t]);

  const toggleExpand = (courseId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const allMapped = useMemo(() => (
    dbCourses.map(course => ({
      ...course,
      titleBn: course.title,
      titleEn: course.title_en || course.title,
      descriptionBn: course.description || '',
      descriptionEn: course.description_en || course.description || '',
    }))
  ), [dbCourses]);

  const displayCourses = useMemo(() => {
    const activeCat = categories.find(c => c.id === activeCategory);
    if (!activeCat?.match) return allMapped;
    return allMapped.filter(c => activeCat.match!.test(c.titleEn));
  }, [allMapped, activeCategory, categories]);

  const handleEnrollClick = (course: typeof displayCourses[0]) => {
    const metadata = getCourseMetadata(course.titleEn);
    if (metadata.isUpcoming) return;

    // If not logged in, redirect to student login
    if (!user) {
      toast.info(t.loginFirst);
      window.open('/student/login', '_blank', 'noopener,noreferrer');
      return;
    }

    const isFree = !course.price || course.price === 0;

    if (isFree) {
      // Instant free enrollment
      handleFreeEnrollment(course);
    } else {
      // Show payment modal
      setEnrollmentCourse(course as Course);
      setShowEnrollmentModal(true);
    }
  };

  const handleFreeEnrollment = async (course: typeof displayCourses[0]) => {
    if (!user || !profile) return;
    try {
      // Check existing
      const { data: existing } = await supabase
        .from('enrollment_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .eq('status', 'pending')
        .maybeSingle();
      if (existing) {
        toast.info(isBn ? 'ইতিমধ্যে রিকুয়েস্ট করা হয়েছে' : 'Already requested');
        return;
      }

      const { error } = await supabase.from('enrollment_requests').insert({
        user_id: user.id,
        course_id: course.id,
        student_name: profile.full_name,
        student_email: profile.email,
        payment_method: 'free',
        transaction_id: 'FREE',
        message: 'Free Course Enrollment',
        status: 'pending',
      });
      if (error) throw error;

      // Notify admin
      try {
        await supabase.functions.invoke('student-enrollment-notify', {
          body: {
            studentName: profile.full_name, studentEmail: profile.email,
            courseName: course.title, coursePrice: 0,
            paymentMethod: 'free', transactionId: 'FREE',
          }
        });
      } catch {}

      toast.success(isBn ? 'ফ্রি কোর্সে এনরোলমেন্ট রিকুয়েস্ট পাঠানো হয়েছে!' : 'Free course enrollment request sent!');
    } catch (err) {
      toast.error(isBn ? 'সমস্যা হয়েছে' : 'Something went wrong');
    }
  };

  const heroRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Dynamic Hero Carousel Slides definition
  const dynamicBannersContent = getPageContent("hero_banners_json");
  const heroSlides = useMemo(() => {
    if (dynamicBannersContent) {
      try {
        const parsed = JSON.parse(dynamicBannersContent);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('hero_banners_json');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return [
      {
        id: "1",
        image: "https://nid.edu.bd/wp-content/uploads/2024/05/BBA-web-slider-01-01-01-scaled-e1753431207269.jpg",
        eyebrowBn: getPageContent("hero.eyebrow.bn") || "ডিজিটাল স্কিল একাডেমি",
        eyebrowEn: getPageContent("hero.eyebrow.en") || "Digital Skill Academy",
        title1Bn: getPageContent("hero.title1.bn") || "এক প্ল্যাটফর্ম।",
        title1En: getPageContent("hero.title1.en") || "One platform.",
        title2Bn: getPageContent("hero.title2.bn") || "প্রতিটি ডিজিটাল স্কিল।",
        title2En: getPageContent("hero.title2.en") || "every digital skill.",
        title3Bn: getPageContent("hero.title3.bn") || "অসীম সম্ভাবনা।",
        title3En: getPageContent("hero.title3.en") || "Endless opportunities.",
        subtitleBn: getPageContent("hero.subtitle.bn") || "AI ও গ্রাফিক ডিজাইন থেকে প্রোগ্রামিং, ওয়েব ডেভেলপমেন্ট, ডিজিটাল মার্কেটিং, ভিডিও এডিটিং এবং ফ্রিল্যান্সিং—সফল ডিজিটাল ক্যারিয়ার গড়তে যা প্রয়োজন সব শিখুন।",
        subtitleEn: getPageContent("hero.subtitle.en") || "From AI and graphic design to programming, web development, digital marketing, video editing and freelancing — everything you need to build a thriving digital career.",
        ctaBn: getPageContent("hero.cta.bn") || "কোর্স দেখুন",
        ctaEn: getPageContent("hero.cta.en") || "Browse Courses",
        ctaHref: "#courses"
      },
      {
        id: "2",
        image: "https://nid.edu.bd/wp-content/uploads/2024/04/Diploma-course-web-slider-01-01-scaled.jpg",
        eyebrowBn: "AI ও ভাইব কোডিং মাস্টারি",
        eyebrowEn: "AI & Vibe Coding Mastery",
        title1Bn: "কোডিং ছাড়া",
        title1En: "Build apps",
        title2Bn: "স্মার্ট ওয়েবসাইট বানান।",
        title2En: "without coding.",
        title3Bn: "প্রম্পট টু প্রফেশনাল ডেভেলপমেন্ট।",
        title3En: "Prompt to Production.",
        subtitleBn: "AI টুলস ব্যবহার করে খুব সহজে নো-কোড ও প্রম্পট ইঞ্জিনিয়ারিংয়ের মাধ্যমে রেসপন্সিভ ওয়েবসাইট ও প্রজেক্ট বিল্ড করা শিখুন।",
        subtitleEn: "Learn to build responsive websites & web apps using cutting-edge AI tools, no-code platforms, and prompt engineering.",
        ctaBn: "ভাইব কোডিং কোর্স",
        ctaEn: "Vibe Coding Course",
        ctaHref: "/vibe-coding"
      }
    ];
  }, [dynamicBannersContent, getPageContent]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 12000); // 12s per banner slide (slower!)
    return () => clearInterval(slideTimer);
  }, [heroSlides.length]);

  const nextHeroSlide = () => setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
  const prevHeroSlide = () => setCurrentSlideIndex((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  const activeSlide = heroSlides[currentSlideIndex];
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  // Rotating headline words
  const rotatingTitles = useMemo(
    () => isBn
      ? [
          getPageContent("hero.rotating1.bn") || "অসাধারণ",
          getPageContent("hero.rotating2.bn") || "নতুন",
          getPageContent("hero.rotating3.bn") || "চমৎকার",
        ]
      : [
          getPageContent("hero.rotating1.en") || "amazing",
          getPageContent("hero.rotating2.en") || "new",
          getPageContent("hero.rotating3.en") || "wonderful",
        ],
    [isBn, getPageContent]
  );
  const [titleNumber, setTitleNumber] = useState(0);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((n) => (n === rotatingTitles.length - 1 ? 0 : n + 1));
    }, 5000); // 5s per rotating text (slower!)
    return () => clearTimeout(timeoutId);
  }, [titleNumber, rotatingTitles]);

  // Redirect to learn subdomain when accessed from main site
  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.hostname.startsWith("learn.") && window.location.hostname.includes("astropixel.tech")) {
      window.location.replace("https://learn.astropixel.tech" + window.location.pathname.replace(/^\/courses/, "") + window.location.search);
    }
  }, []);

  // Scroll to the section matching the current route
  const location = useLocation();
  useEffect(() => {
    const map: Record<string, string> = {
      "/instructors": "instructors",
      "/contact": "contact",
      "/courses": "courses",
    };
    const targetId = map[location.pathname];
    if (targetId) {
      // Wait for content mount before scrolling
      const t = setTimeout(() => {
        const el = document.getElementById(targetId);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => clearTimeout(t);
    } else if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  const renderCourseCard = (course: typeof allMapped[0], index: number) => {
    const metadata = getCourseMetadata(course.titleEn);
    const CourseIcon = metadata.icon;
    const coursePrice = course.price || 0;
    const isFree = coursePrice === 0;
    const trainerName = course.trainer_name || metadata.trainer?.name;
    const trainerImage = course.trainer_image || metadata.trainer?.image;
    const trainerDesig = course.trainer_designation || (isBn ? metadata.trainer?.qualificationBn : metadata.trainer?.qualificationEn);
    const thumbnailUrl = course.thumbnail_url;
    const landingHref = (course as any).landing_slug ? `/courses/${(course as any).landing_slug}` : null;
    return (
      <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ delay: index * 0.04 }} className="group h-full">
        <div className={`relative flex flex-col h-full rounded-[28px] overflow-hidden bg-card border border-border/40 hover:border-primary/40 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/[0.12] p-2.5 ${metadata.isUpcoming ? 'ring-1 ring-amber-500/20' : ''}`}>
          {landingHref ? (
            thumbnailUrl ? (
              <Link to={landingHref} className="block">
                <div className="relative h-44 overflow-hidden rounded-[20px]">
                  <img src={thumbnailUrl} alt={isBn ? course.titleBn : course.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {metadata.isSpecial && (
                      <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-3 h-3" />{t.special}
                      </span>
                    )}
                    {metadata.isUpcoming && (
                      <span className="px-3 py-1.5 rounded-full bg-amber-500 text-primary-foreground text-[10px] font-bold flex items-center gap-1 shadow-lg">
                        <Clock className="w-3 h-3" />{t.upcoming}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ) : (
              <Link to={landingHref} className="block">
                <div className={`relative h-44 bg-gradient-to-br ${metadata.color} overflow-hidden rounded-[20px]`}>
                  <div className="absolute top-1/2 left-5 -translate-y-1/2">
                    <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                      <CourseIcon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          ) : (
            thumbnailUrl ? (
              <div className="relative h-44 overflow-hidden rounded-[20px]">
                <img src={thumbnailUrl} alt={isBn ? course.titleBn : course.titleEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            ) : (
              <div className={`relative h-44 bg-gradient-to-br ${metadata.color} overflow-hidden rounded-[20px]`}>
                <div className="absolute top-1/2 left-5 -translate-y-1/2">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <CourseIcon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            )
          )}
          <div className="flex flex-col flex-1 px-3 pt-4 pb-3 gap-2">
            {landingHref ? (
              <Link to={landingHref}>
                <h3 className="text-[15px] font-display font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
                  {isBn ? course.titleBn : course.titleEn}
                </h3>
              </Link>
            ) : (
              <h3 className="text-[15px] font-display font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
                {isBn ? course.titleBn : course.titleEn}
              </h3>
            )}
            {trainerName && (
              <p className="text-xs text-muted-foreground truncate">{trainerName}</p>
            )}
            <div className="h-px bg-border/40 mt-auto" />
            <div className="flex items-center gap-3 pt-1">
              <span className={`text-lg font-display font-bold bg-clip-text text-transparent ${isFree ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-[hsl(var(--gradient-start))] via-[hsl(var(--gradient-mid))] to-[hsl(var(--gradient-end))]'}`}>
                {isFree ? t.free : `৳${coursePrice.toLocaleString(isBn ? 'bn-BD' : 'en-US')}`}
              </span>
              <button
                onClick={() => handleEnrollClick(course)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold text-xs transition-all duration-300 ${
                  metadata.isUpcoming
                    ? 'bg-amber-500/10 text-amber-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[hsl(var(--gradient-start))] via-[hsl(var(--gradient-mid))] to-[hsl(var(--gradient-end))] text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02]'
                }`}
                disabled={metadata.isUpcoming}
              >
                {metadata.isUpcoming ? (
                  <><Clock className="w-3.5 h-3.5" />{t.upcoming}</>
                ) : (
                  <><ArrowRight className="w-3.5 h-3.5" />{t.enrollNow}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Layout flushTop={true}>


      <Helmet>
        <title>Learn with AlphaZero — Graphic Design, Web Development, AI & Digital Marketing</title>
        <meta name="description" content="Learn with AlphaZero — Bangla & English online courses on graphic design, web development, vibe coding, digital marketing, AI automation, prompt engineering, motion graphics, Figma & freelancing." />
        <meta name="keywords" content="Learn with AlphaZero, AlphaZero Learn, graphic design course Bangla, web development Bangla, vibe coding, digital marketing Bangla, AI automation, prompt engineering, online course Bangladesh" />
        <meta name="author" content="Learn with AlphaZero" />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        <meta property="og:site_name" content="Learn with AlphaZero" />
        <meta property="og:title" content="Learn with AlphaZero — Design, Web Dev, AI & Digital Marketing" />
        <meta property="og:description" content="Bangla online courses on graphic design, web development, vibe coding, digital marketing, AI automation, prompt engineering, motion graphics, Figma & freelancing." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="bn_BD" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:image" content={learnOgImage.url} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Learn with AlphaZero" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Learn with AlphaZero — Design, Web Dev, AI & Digital Marketing" />
        <meta name="twitter:description" content="Bangla courses on graphic design, web development, vibe coding, digital marketing, AI automation, prompt engineering, motion graphics, Figma & freelancing." />
        <meta name="twitter:image" content={learnOgImage.url} />
        <meta name="twitter:image:alt" content="Learn with AlphaZero" />

        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "Learn with AlphaZero",
          "alternateName": ["Learn with AlphaZero", "AlphaZero LMS"],
          "description": "Learn with AlphaZero — Online learning platform teaching graphic design, web development, vibe coding, digital marketing, AI automation, prompt engineering, motion graphics, Figma & freelancing.",
          "url": "https://learn.astropixel.tech/",
          "logo": "https://astropixel.tech/logo.png",
          "sameAs": [
            "https://astropixel.tech",
            "https://www.facebook.com/share/1Zm7yMhPtk/",
            "https://www.youtube.com/@astropixel_tech"
          ],
          "areaServed": "BD",
          "inLanguage": ["bn", "en"],
          "knowsAbout": [
            "Graphic Design", "Web Development", "Vibe Coding", "Digital Marketing",
            "AI Automation", "Prompt Engineering", "Motion Graphics", "Figma",
            "Fiverr Freelancing", "Digital Products"
          ]
        })}</script>

        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Astropixel Academy",
          "alternateName": "Learn with Astropixel",
          "url": "https://learn.astropixel.tech/",
          "inLanguage": ["bn", "en"],
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://learn.astropixel.tech/?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}</script>

        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Astropixel Academy Courses",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Graphic Design Course (Bangla)" },
            { "@type": "ListItem", "position": 2, "name": "Web Development Course (Bangla)" },
            { "@type": "ListItem", "position": 3, "name": "Vibe Coding Course" },
            { "@type": "ListItem", "position": 4, "name": "Digital Marketing Course (Bangla)" },
            { "@type": "ListItem", "position": 5, "name": "AI Automation Course" },
            { "@type": "ListItem", "position": 6, "name": "Prompt Engineering Course" },
            { "@type": "ListItem", "position": 7, "name": "Motion Graphics Course" },
            { "@type": "ListItem", "position": 8, "name": "Figma UI/UX Design Course" },
            { "@type": "ListItem", "position": 9, "name": "Fiverr Freelancing Course" },
            { "@type": "ListItem", "position": 10, "name": "Digital Product Course" }
          ]
        })}</script>
      </Helmet>
      {/* Hero - logo-forward editorial */}
      {/* Hero Carousel - Pure Full-Bleed Page Image Slider Banner */}
      {!isAllCoursesRoute && (
      <section id="home" ref={heroRef} className="relative flex items-center justify-center overflow-hidden mt-[64px] h-[450px] sm:h-[550px] lg:h-[650px] w-full">
        {/* Full-width Animated Carousel Background Image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${activeSlide.image})` }}
          />
        </AnimatePresence>

        {/* Bottom Dots Pagination Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 z-20">
          {heroSlides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlideIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                currentSlideIndex === idx
                  ? "w-8 h-2.5 bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))]"
                  : "w-2.5 h-2.5 bg-foreground/40 hover:bg-foreground/80 backdrop-blur-sm"
              }`}
            />
          ))}
        </div>
      </section>
      )}

      {/* Courses Grid */}
      <section className="pt-4 pb-14 border-t border-border/40" id="courses">
        <div className="container mx-auto px-6">
          {!isAllCoursesRoute && (<>
          {/* Centered header — Popular Courses */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-5">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-2">
              {(() => {
                const text = cms("grid.title.bn", "grid.title.en", "জনপ্রিয় কোর্স", t.popularCourses);
                const idx = text.toLowerCase().indexOf(isBn ? "কোর্স" : "course");
                if (idx === -1) return text;
                return (
                  <>
                    <span>{text.slice(0, idx)}</span>
                    <span className="bg-gradient-to-r from-[hsl(var(--gradient-start))] via-[hsl(var(--gradient-mid))] to-[hsl(var(--gradient-end))] bg-clip-text text-transparent">
                      {text.slice(idx)}
                    </span>
                  </>
                );
              })()}
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              {isBn ? "পছন্দের স্কিল বেছে নিন এবং আজই প্র্যাক্টিক্যাল প্রজেক্টে যুক্ত হন" : "Pick your desired skill and jump into practical projects today"}
            </p>
          </motion.div>

          {/* Category pills */}
          <div className="max-w-5xl mx-auto mb-6">
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`relative px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all duration-300 ${
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground border border-border/50 hover:border-border"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeCatPill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(var(--gradient-start))] via-[hsl(var(--gradient-mid))] to-[hsl(var(--gradient-end))] shadow-lg shadow-primary/30"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          </>)}

          {isAllCoursesRoute && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto mb-10 text-center">
              <h1 className="text-3xl md:text-5xl font-display font-bold mb-3">
                <span className="bg-gradient-to-r from-[hsl(var(--gradient-start))] via-[hsl(var(--gradient-mid))] to-[hsl(var(--gradient-end))] bg-clip-text text-transparent">
                  {isBn ? "ওয়েব ও প্র্যাক্টিক্যাল কোর্সসমূহ" : "Web & Practical Courses"}
                </span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                {isBn ? "ওয়েব ডেভেলপমেন্ট, ভাইব কোডিং, এআই ও ডিজিটাল ক্যারিয়ার কোর্সসমূহ" : "Web Development, Vibe Coding, AI & Digital Career Courses"}
              </p>
            </motion.div>
          )}



          {coursesLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">{t.loading}</p>
            </div>
          )}

          {!coursesLoading && displayCourses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t.noCourses}</h3>
              <p className="text-muted-foreground">{t.noCoursesDesc}</p>
            </div>
          )}

          {!coursesLoading && displayCourses.length > 0 && !isAllCoursesRoute && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
                {displayCourses.map((course, index) => renderCourseCard(course, index))}
              </div>

              {/* View All Courses Catalog Button - Centered below course cards */}
              <div className="flex justify-center mt-10">
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-bold text-sm shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 group"
                >
                  <span>{isBn ? "সকল কোর্সসমূহ দেখুন" : "View All Courses Catalog"}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </>
          )}

          {!coursesLoading && allMapped.length > 0 && isAllCoursesRoute && (
            <div className="max-w-7xl mx-auto space-y-14">
              {(() => {
                const cats = categories.filter(c => c.id !== 'all');
                const seen = new Set<string>();
                const sections = cats.map(cat => {
                  const items = allMapped.filter(c => {
                    if (!cat.match!.test(c.titleEn)) return false;
                    if (seen.has(c.id)) return false;
                    seen.add(c.id);
                    return true;
                  });
                  return { cat, items };
                });
                const others = allMapped.filter(c => !seen.has(c.id));
                if (others.length) sections.push({ cat: { id: 'others', label: isBn ? 'অন্যান্য' : 'Others', match: null } as any, items: others });
                return sections.map(({ cat, items }) => items.length === 0 ? null : (
                  <div key={cat.id}>
                    <div className="flex items-end justify-between mb-5 px-1">
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">
                        {cat.label}
                      </h2>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        ({items.length} {isBn ? 'কোর্স' : items.length === 1 ? 'course' : 'courses'})
                      </span>
                    </div>
                    <div className="flex gap-4 md:gap-5 overflow-x-auto pb-4 snap-x snap-mandatory -mx-6 px-6 scroll-smooth [scrollbar-width:thin]">
                      {items.map((course, index) => (
                        <div key={course.id} className="snap-start shrink-0 w-[260px] sm:w-[280px] md:w-[310px]">
                          {renderCourseCard(course, index)}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>)}
        </div>
      </section>






      {/* Instructors section */}
      {!isAllCoursesRoute && (
      <section id="instructors" className="py-10 border-t border-border/40 relative overflow-hidden">

        {/* Decorative background */}
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          }}
        />
        <div className="container mx-auto px-6 relative z-10">

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-6 max-w-3xl mx-auto">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3 block">
              {cms("instructors.badge.bn", "instructors.badge.en", "আমাদের টিম", "Our Team")}
            </span>
            <h2 className="text-3xl lg:text-5xl font-display font-bold leading-tight">
              {cms("instructors.title1.bn", "instructors.title1.en", "এক্সপার্ট", "Expert")}{" "}
              <span className="gradient-text">{cms("instructors.title2.bn", "instructors.title2.en", "ইনস্ট্রাক্টর", "Instructors")}</span>
            </h2>
            <p className="text-muted-foreground mt-4">
              {cms("instructors.desc.bn", "instructors.desc.en", "ইন্ডাস্ট্রি এক্সপার্টদের কাছ থেকে সরাসরি শিখুন।", "Learn directly from industry experts.")}
            </p>
          </motion.div>
          <div className="max-w-7xl mx-auto relative overflow-hidden trainers-swiper py-3">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
            <AppSwiper
              variant="marquee"
              speed={14000}
              autoplayDelay={0}
              loop
              items={Object.values(trainers)}
              keyExtractor={(tr) => tr.name}
              slideClassName="!w-[200px] sm:!w-[220px]"
              renderItem={(tr) => (
                <div className="group shrink-0 py-1">
                  <div className="glass-card rounded-2xl p-3 text-center shadow-none hover:shadow-none hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
                    <div className="relative aspect-square w-full mb-3 overflow-hidden rounded-xl">
                      <img src={tr.image} alt={tr.name} loading="lazy"
                        className="relative w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                    </div>
                    <h3 className="font-display font-bold text-sm mb-1 group-hover:text-primary transition-colors">{tr.name}</h3>
                    <p className="text-[10px] text-muted-foreground leading-snug line-clamp-3">
                      {isBn ? tr.qualificationBn : tr.qualificationEn}
                    </p>
                  </div>
                </div>
              )}
            />
          </div>



        </div>
      </section>
      )}


      {/* Student Feedback Section */}
      {!isAllCoursesRoute && (
      <section id="feedback" className="py-16 relative overflow-hidden border-t border-border/40">
        <div className="absolute inset-0 mesh-bg opacity-50" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-10"
          >
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3 block">
              {isBn ? "স্টুডেন্ট রিভিউ" : "Student Reviews"}
            </span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold">
              {isBn ? "আমাদের শিক্ষার্থীরা কী " : "What our students "}
              <span className="gradient-text">{isBn ? "বলছেন" : "say"}</span>
            </h2>
            <p className="text-muted-foreground mt-3">
              {isBn
                ? "সত্যিকারের অভিজ্ঞতা, সত্যিকারের ফলাফল।"
                : "Real experiences, real results from our learners."}
            </p>
          </motion.div>

          {(() => {
            const feedbacks = [
              {
                name: isBn ? "রাফিদ হাসান" : "Rafid Hasan",
                role: isBn ? "গ্রাফিক ডিজাইন শিক্ষার্থী" : "Graphic Design Student",
                quote: isBn
                  ? "ইনস্ট্রাক্টররা অনেক হেল্পফুল। প্র্যাকটিকাল প্রজেক্টগুলো ক্যারিয়ার গড়তে সাহায্য করেছে।"
                  : "The instructors are super helpful. The practical projects genuinely helped me start freelancing.",
              },
              {
                name: isBn ? "সাদিয়া আক্তার" : "Sadia Akter",
                role: isBn ? "ডিজিটাল মার্কেটিং" : "Digital Marketing",
                quote: isBn
                  ? "কোর্সের কারিকুলাম একদম আপডেটেড। SEO আর মেটা মার্কেটিং একদম হাতে-কলমে শিখেছি।"
                  : "The curriculum is up-to-date. I learned SEO and Meta marketing hands-on, step by step.",
              },
              {
                name: isBn ? "তানভীর আহমেদ" : "Tanvir Ahmed",
                role: isBn ? "ভাইব কোডিং" : "Vibe Coding",
                quote: isBn
                  ? "Astropixel-এর টিচিং স্টাইল অসাধারণ। প্রথম মাসেই নিজে একটা ওয়েবসাইট বানাতে পেরেছি।"
                  : "Astropixel's teaching style is amazing. I built my own website within the first month.",
              },
              {
                name: isBn ? "মেহেদী হাসান" : "Mehedi Hasan",
                role: isBn ? "ওয়েব ডেভেলপমেন্ট" : "Web Development",
                quote: isBn
                  ? "লাইভ ক্লাস আর রেকর্ডেড ভিডিও—দুইটাই দারুণ কম্বিনেশন। যেকোনো সময় রিভিশন দিতে পারি।"
                  : "Live classes plus recorded videos is a perfect combo. I can revise anytime I want.",
              },
              {
                name: isBn ? "নুসরাত জাহান" : "Nusrat Jahan",
                role: isBn ? "ফটোগ্রাফি" : "Photography",
                quote: isBn
                  ? "মেন্টররা প্রতিটা কাজে ফিডব্যাক দেয়। এখন নিজেই ক্লায়েন্ট শুট করছি।"
                  : "Mentors review every assignment. I'm now shooting for real clients on my own.",
              },
              {
                name: isBn ? "ইমরান খান" : "Imran Khan",
                role: isBn ? "ভিডিও এডিটিং" : "Video Editing",
                quote: isBn
                  ? "শর্টফর্ম আর লংফর্ম দুইটাই শিখেছি। ইউটিউবে নিজের চ্যানেল দাঁড় করাতে পেরেছি।"
                  : "Learned both short-form and long-form editing. I built my own YouTube channel from scratch.",
              },
            ];
            const loop = [...feedbacks, ...feedbacks];
            return (
              <div className="relative max-w-6xl mx-auto px-4 md:px-16 reviews-swiper">
                <AppSwiper
                  items={feedbacks}
                  keyExtractor={(_, i) => i}
                  variant="cards"
                  showNavigation={false}
                  showPagination={true}
                  loop
                  autoplayDelay={4000}
                  speed={700}
                  spaceBetween={24}
                  breakpoints={{
                    0: { slidesPerView: 1 },
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                  }}
                  slideClassName="h-auto"
                  renderItem={(f) => (
                    <div className="glass-card rounded-2xl p-6 flex flex-col hover:border-primary/40 transition-all h-full">
                      <div className="flex gap-1 mb-4 text-primary">
                        {"★★★★★".split("").map((s, idx) => (
                          <span key={idx} className="text-sm">{s}</span>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                        "{f.quote}"
                      </p>
                      <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-display font-bold text-primary">
                          {f.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{f.name}</p>
                          <p className="text-[11px] text-muted-foreground">{f.role}</p>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
            );
          })()}

        </div>
      </section>
      )}



      {/* Enrollment Modal */}
      {enrollmentCourse && user && profile && (
        <CourseEnrollmentModal
          isOpen={showEnrollmentModal}
          onClose={() => { setShowEnrollmentModal(false); setEnrollmentCourse(null); }}
          course={enrollmentCourse}
          userId={user.id}
          userEmail={profile.email}
          userName={profile.full_name}
          onSuccess={() => { setShowEnrollmentModal(false); setEnrollmentCourse(null); }}
          language={language}
        />
      )}
    </Layout>
  );
};

export default CoursesPage;
