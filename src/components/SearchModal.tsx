import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Layout, Users, Briefcase, Phone, BookOpen, Info, Sparkles, Loader2, GraduationCap, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, query as fsQuery, where } from 'firebase/firestore';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  path: string;
  icon: React.ElementType;
  keywords: string[];
  category?: string;
}

// Team members data for search
const teamMembers = [
  {
    name: "Sofiullah Ahammad",
    nameBn: "সফিউল্লাহ আহাম্মদ",
    role: "Founder, Graphics Designer, Vibe Coding Expert, Freelance Photographer",
    roleBn: "প্রতিষ্ঠাতা, গ্রাফিক ডিজাইনার, ভাইব কোডিং এক্সপার্ট",
    keywords: ["sofiullah", "ahammad", "atik", "founder", "graphics", "designer", "photographer", "সফিউল্লাহ", "আতিক", "ফাউন্ডার", "ডিজাইনার"]
  },
  {
    name: "Adib Sarkar",
    nameBn: "আদিব সরকার",
    role: "Founder, Lead Designer, Entrepreneur",
    roleBn: "প্রতিষ্ঠাতা, লিড ডিজাইনার, উদ্যোক্তা",
    keywords: ["adib", "sarkar", "founder", "lead", "designer", "entrepreneur", "আদিব", "সরকার", "লিড", "উদ্যোক্তা"]
  },
  {
    name: "Md.Kamrul Hasan",
    nameBn: "মো. কামরুল হাসান",
    role: "Founder, Microsoft Office Expert, Graphics Designer",
    roleBn: "প্রতিষ্ঠাতা, মাইক্রোসফট অফিস এক্সপার্ট, গ্রাফিক ডিজাইনার",
    keywords: ["kamrul", "hasan", "microsoft", "office", "excel", "word", "powerpoint", "কামরুল", "হাসান", "মাইক্রোসফট", "অফিস"]
  },
  {
    name: "Md.Shafiul Haque",
    nameBn: "মো. শফিউল হক",
    role: "Web Designer, Video Editor, Content Creator, Cinematographer",
    roleBn: "ওয়েব ডিজাইনার, ভিডিও এডিটর, কন্টেন্ট ক্রিয়েটর",
    keywords: ["shafiul", "haque", "shaurav", "web", "video", "editor", "cinematographer", "content", "শফিউল", "হক", "ভিডিও", "এডিটর"]
  },
  {
    name: "Prantik Saha",
    nameBn: "প্রান্তিক সাহা",
    role: "Graphics Designer, Microsoft Office Expert, IT Support",
    roleBn: "গ্রাফিক ডিজাইনার, মাইক্রোসফট অফিস এক্সপার্ট, আইটি সাপোর্ট",
    keywords: ["prantik", "saha", "graphics", "it", "support", "প্রান্তিক", "সাহা", "আইটি", "সাপোর্ট"]
  },
];

// Static pages data
const staticPages: SearchItem[] = [
  {
    title: "Home",
    titleBn: "হোম",
    description: "Welcome to Astropixel - Creative Design Agency",
    descriptionBn: "Astropixel-এ স্বাগতম - ক্রিয়েটিভ ডিজাইন এজেন্সি",
    path: "/",
    icon: Layout,
    keywords: ["home", "main", "landing", "welcome", "alphazero", "alpha", "zero", "agency", "এজেন্সি", "হোম", "প্রধান", "স্বাগতম", "আলফাজিরো", "আলফা"],
    category: "page"
  },
  {
    title: "About Us",
    titleBn: "আমাদের সম্পর্কে",
    description: "Learn about Astropixel's journey, mission, vision and values",
    descriptionBn: "Astropixel-এর যাত্রা, মিশন, ভিশন এবং মূল্যবোধ সম্পর্কে জানুন",
    path: "/about",
    icon: Info,
    keywords: ["about", "story", "values", "mission", "vision", "history", "company", "who", "we", "are", "journey", "আমাদের", "সম্পর্কে", "গল্প", "মিশন", "ভিশন", "কোম্পানি", "যাত্রা", "ইতিহাস"],
    category: "page"
  },
  {
    title: "Our Services",
    titleBn: "আমাদের সেবাসমূহ",
    description: "Graphic Design, Web Development, Video Editing, Digital Marketing, Logo, Branding",
    descriptionBn: "গ্রাফিক ডিজাইন, ওয়েব ডেভেলপমেন্ট, ভিডিও এডিটিং, ডিজিটাল মার্কেটিং, লোগো, ব্র্যান্ডিং",
    path: "/services",
    icon: Briefcase,
    keywords: ["services", "service", "design", "web", "website", "seo", "marketing", "digital", "graphic", "video", "editing", "development", "developer", "logo", "branding", "brand", "poster", "banner", "flyer", "social", "media", "thumbnail", "youtube", "facebook", "instagram", "সেবা", "ডিজাইন", "ওয়েব", "ওয়েবসাইট", "মার্কেটিং", "লোগো", "ব্র্যান্ডিং", "গ্রাফিক", "ভিডিও", "এডিটিং", "ডেভেলপমেন্ট", "পোস্টার", "ব্যানার", "থাম্বনেইল", "ফেসবুক", "ইউটিউব", "motion", "animation", "ui", "ux", "app", "mobile", "responsive"],
    category: "page"
  },
  {
    title: "Our Work",
    titleBn: "আমাদের কাজ",
    description: "View our portfolio, completed projects and case studies",
    descriptionBn: "আমাদের পোর্টফোলিও, সম্পন্ন প্রজেক্ট এবং কেস স্টাডি দেখুন",
    path: "/work",
    icon: Layout,
    keywords: ["work", "portfolio", "projects", "project", "case", "study", "gallery", "showcase", "examples", "sample", "কাজ", "পোর্টফোলিও", "প্রজেক্ট", "গ্যালারি", "নমুনা", "উদাহরণ"],
    category: "page"
  },
  {
    title: "Our Team",
    titleBn: "আমাদের টিম",
    description: "Meet the creative minds behind Astropixel - Designers, Developers",
    descriptionBn: "Astropixel-এর পেছনের ক্রিয়েটিভ মানুষদের সাথে পরিচিত হন",
    path: "/about#team",
    icon: Users,
    keywords: ["team", "members", "people", "staff", "founder", "ceo", "designer", "developer", "employee", "crew", "join", "career", "টিম", "সদস্য", "মানুষ", "ফাউন্ডার", "ডিজাইনার", "ডেভেলপার", "কর্মী", "trainer", "instructor", "ট্রেইনার"],
    category: "page"
  },
  {
    title: "Courses",
    titleBn: "কোর্সসমূহ",
    description: "Learn design and development skills - Graphic Design, Web Development courses",
    descriptionBn: "ডিজাইন এবং ডেভেলপমেন্ট শিখুন - গ্রাফিক ডিজাইন, ওয়েব ডেভেলপমেন্ট কোর্স",
    path: "/courses",
    icon: BookOpen,
    keywords: ["courses", "course", "training", "learn", "learning", "class", "tutorial", "education", "skill", "study", "enroll", "admission", "certificate", "কোর্স", "ট্রেনিং", "শিখুন", "শেখা", "ক্লাস", "টিউটোরিয়াল", "শিক্ষা", "ভর্তি", "সার্টিফিকেট", "photoshop", "illustrator", "figma", "canva"],
    category: "page"
  },
  {
    title: "Contact Us",
    titleBn: "যোগাযোগ করুন",
    description: "Get in touch - Email: contact@astropixel.tech, Phone: +880 1779-277603",
    descriptionBn: "যোগাযোগ করুন - ইমেইল, ফোন: +৮৮০ ১৭৭৯-২৭৭৬০৩, হোয়াটসঅ্যাপ",
    path: "/contact",
    icon: Phone,
    keywords: ["contact", "email", "phone", "whatsapp", "message", "call", "reach", "location", "address", "help", "support", "inquiry", "quote", "price", "যোগাযোগ", "ইমেইল", "ফোন", "হোয়াটসঅ্যাপ", "মেসেজ", "কল", "ঠিকানা", "লোকেশন", "সাহায্য", "দাম", "01779277603", "1779277603", "০১৭৭৯২৭৭৬০৩"],
    category: "page"
  },
  {
    title: "Join Our Team",
    titleBn: "টিমে যোগ দিন",
    description: "Career opportunities at Astropixel - Apply now",
    descriptionBn: "Astropixel-তে ক্যারিয়ারের সুযোগ - এখনই আবেদন করুন",
    path: "/join-team",
    icon: Users,
    keywords: ["join", "career", "job", "jobs", "apply", "hiring", "work", "opportunity", "vacancy", "recruitment", "যোগ", "চাকরি", "আবেদন", "নিয়োগ", "ক্যারিয়ার", "সুযোগ"],
    category: "page"
  },
  {
    title: "Student Login",
    titleBn: "স্টুডেন্ট লগইন",
    description: "Login to access your courses and dashboard",
    descriptionBn: "আপনার কোর্স এবং ড্যাশবোর্ড অ্যাক্সেস করতে লগইন করুন",
    path: "/student-login",
    icon: BookOpen,
    keywords: ["student", "login", "signin", "sign", "account", "dashboard", "my", "courses", "স্টুডেন্ট", "লগইন", "একাউন্ট", "ড্যাশবোর্ড", "আমার"],
    category: "page"
  },
  {
    title: "Verify Certificate",
    titleBn: "সার্টিফিকেট যাচাই",
    description: "Verify your Astropixel certificate authenticity",
    descriptionBn: "আপনার Astropixel সার্টিফিকেটের সত্যতা যাচাই করুন",
    path: "/verify-certificate",
    icon: BookOpen,
    keywords: ["verify", "certificate", "check", "validate", "authenticity", "সার্টিফিকেট", "যাচাই", "চেক", "ভেরিফাই"],
    category: "page"
  },
];

// Highlight matching text
const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;
  
  try {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-primary/40 text-foreground font-semibold rounded px-0.5">
          {part}
        </mark>
      ) : part
    );
  } catch {
    return text;
  }
};

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [dynamicData, setDynamicData] = useState<SearchItem[]>([]);
  const navigate = useNavigate();
  const { language } = useLanguage();

  // Load courses from database and combine with team members
  useEffect(() => {
    const loadDynamicData = async () => {
      try {
        const searchQ = fsQuery(
          collection(db, 'courses'),
          where('is_published', '==', true)
        );
        const snapshot = await getDocs(searchQ);
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

        const dynamicItems: SearchItem[] = [];

        // Add courses
        if (courses && courses.length > 0) {
          courses.forEach(course => {
            dynamicItems.push({
              title: course.title,
              titleBn: course.title,
              description: course.description || "Learn with Astropixel",
              descriptionBn: course.description || "Astropixel-এর সাথে শিখুন",
              path: "/courses",
              icon: GraduationCap,
              keywords: [course.title.toLowerCase(), "course", "কোর্স", "training", "ট্রেনিং"],
              category: "course"
            });
          });
        }

        // Add team members
        teamMembers.forEach(member => {
          dynamicItems.push({
            title: member.name,
            titleBn: member.nameBn,
            description: member.role,
            descriptionBn: member.roleBn,
            path: "/about#team",
            icon: User,
            keywords: [...member.keywords, "team", "member", "trainer", "টিম", "ট্রেইনার", "মেম্বার"],
            category: "team"
          });
        });

        setDynamicData(dynamicItems);
      } catch (error) {
        console.error('Error loading dynamic data:', error);
      }
    };

    if (isOpen) {
      loadDynamicData();
    }
  }, [isOpen]);

  // Combined search data
  const allSearchData = useMemo(() => [...staticPages, ...dynamicData], [dynamicData]);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return staticPages.slice(0, 7); // Show first 7 pages when empty
    
    const searchTerm = query.toLowerCase().trim();
    const terms = searchTerm.split(/\s+/);
    
    return allSearchData.filter(item => {
      const searchableText = [
        item.title.toLowerCase(),
        item.titleBn.toLowerCase(),
        item.description.toLowerCase(),
        item.descriptionBn.toLowerCase(),
        ...item.keywords.map(k => k.toLowerCase())
      ].join(' ');
      
      // Check if all terms are found
      return terms.every(term => searchableText.includes(term));
    }).slice(0, 10); // Limit to 10 results
  }, [query, allSearchData]);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery("");
    setAiSuggestion(null);
  };

  // AI-powered search suggestion
  const getAiSuggestion = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setAiSuggestion(null);
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: `User is searching for "${searchQuery}" on Astropixel website. Astropixel is a creative design agency offering: Graphic Design, Web Development, Video Editing, Digital Marketing, Logo Design, Branding, and also provides courses. Contact: +880 1779-277603.
          
Based on their search, suggest which page they should visit in 1 short sentence. Available pages: Home, About Us, Services, Our Work/Portfolio, Team, Courses, Contact, Join Team, Student Login, Verify Certificate.

Reply in ${language === 'bn' ? 'Bengali' : 'English'} only. Keep it very short (under 15 words).`
        })
      });

      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      setAiSuggestion(data?.response || null);
    } catch (error) {
      console.error('AI suggestion error:', error);
      setAiSuggestion(null);
    } finally {
      setIsAiLoading(false);
    }
  }, [language]);

  // Debounced AI suggestion
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3 && filteredResults.length === 0) {
        getAiSuggestion(query);
      } else {
        setAiSuggestion(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, filteredResults.length, getAiSuggestion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setAiSuggestion(null);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Pure blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] backdrop-blur-xl bg-background/40"
          />

          {/* Modal - Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed inset-x-4 top-[12%] md:top-[10%] md:left-1/2 md:-translate-x-1/2 md:inset-x-auto z-[101] w-auto md:w-full md:max-w-lg"
          >
            <div className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input with AI Badge */}
              <div className="flex items-center gap-3 p-4 border-b border-border bg-secondary/30">
                <div className="relative">
                  <Search size={20} className="text-primary" />
                  <Sparkles size={10} className="absolute -top-1 -right-1 text-primary animate-pulse" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={language === "bn" ? "পেজ, কোর্স, টিম মেম্বার খুঁজুন..." : "Search pages, courses, team..."}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* AI Suggestion Banner */}
              <AnimatePresence>
                {(isAiLoading || aiSuggestion) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-primary/10 border-b border-primary/20 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-4 py-3">
                      {isAiLoading ? (
                        <>
                          <Loader2 size={16} className="text-primary animate-spin" />
                          <span className="text-sm text-primary">
                            {language === "bn" ? "AI ভাবছে..." : "AI thinking..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} className="text-primary shrink-0" />
                          <span className="text-sm text-foreground">{aiSuggestion}</span>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results */}
              <div className="max-h-[350px] overflow-y-auto p-2">
                {query.trim() && (
                  <div className="px-3 py-1.5 text-xs text-muted-foreground">
                    {language === "bn" 
                      ? `"${query}" এর জন্য ${filteredResults.length}টি ফলাফল` 
                      : `${filteredResults.length} results for "${query}"`}
                  </div>
                )}
                
                {filteredResults.length > 0 ? (
                  filteredResults.map((item, index) => (
                    <motion.button
                      key={`${item.path}-${index}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/70 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon size={20} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground truncate">
                            {highlightMatch(language === "bn" ? item.titleBn : item.title, query)}
                          </h4>
                          {item.category === "course" && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full shrink-0">
                              {language === "bn" ? "কোর্স" : "Course"}
                            </span>
                          )}
                          {item.category === "team" && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full shrink-0">
                              {language === "bn" ? "টিম মেম্বার" : "Team"}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {highlightMatch(language === "bn" ? item.descriptionBn : item.description, query)}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </motion.button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="mb-2">{language === "bn" ? "কোনো ফলাফল পাওয়া যায়নি" : "No results found"}</p>
                    <p className="text-xs opacity-70">
                      {language === "bn" ? "AI আপনাকে সাহায্য করছে..." : "AI is helping you..."}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="p-3 border-t border-border bg-secondary/30">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles size={12} className="text-primary" />
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "AI-পাওয়ার্ড সার্চ • Esc বন্ধ করতে" : "AI-Powered Search • Esc to close"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
