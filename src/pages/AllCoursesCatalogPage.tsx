import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePublicCourses } from "@/hooks/usePublicCourses";
import { useAuth } from "@/contexts/AuthContext";
import CourseEnrollmentModal from "@/components/student/CourseEnrollmentModal";
import { 
  Code, Palette, Bot, TrendingUp, Search, Sparkles, BookOpen, Clock, 
  ArrowRight, CheckCircle2, Star, Monitor, Video, Wrench, Shield, GraduationCap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Course } from "@/types/lms";

const categoryList = [
  { id: "all", labelBn: "সব কোর্স", labelEn: "All Courses", icon: BookOpen },
  { id: "web", labelBn: "ওয়েব ডেভেলপমেন্ট", labelEn: "Web Development", icon: Code, match: /web|code|vibe|react|next|javascript|dev/i },
  { id: "design", labelBn: "গ্রাফিক ও UI/UX", labelEn: "Graphic & UI/UX", icon: Palette, match: /design|graphic|figma|ui|ux|photoshop|motion/i },
  { id: "ai", labelBn: "এআই ও অটোমেশন", labelEn: "AI & Automation", icon: Bot, match: /ai|prompt|automation|chatgpt/i },
  { id: "freelancing", labelBn: "ফ্রীল্যান্সিং", labelEn: "Freelancing", icon: TrendingUp, match: /market|fiverr|freelanc|seo|product/i },
];

const courseIconMap: Record<string, any> = {
  web: Code,
  design: Palette,
  ai: Bot,
  freelancing: TrendingUp,
};

const AllCoursesCatalogPage = () => {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const { user, profile } = useAuth();
  const { courses, loading: coursesLoading } = usePublicCourses();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [enrollmentCourse, setEnrollmentCourse] = useState<Course | null>(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState<boolean>(false);

  // Filter courses based on search query and active category
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const titleBn = c.titleBn || "";
      const titleEn = c.titleEn || "";
      const matchesSearch = 
        !searchQuery.trim() || 
        titleBn.toLowerCase().includes(searchQuery.toLowerCase()) || 
        titleEn.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeCategory === "all") return true;

      const catObj = categoryList.find((cat) => cat.id === activeCategory);
      if (!catObj || !catObj.match) return true;

      return catObj.match.test(titleEn) || catObj.match.test(titleBn);
    });
  }, [courses, activeCategory, searchQuery]);

  // Group courses by skill category when "all" is active
  const groupedCourses = useMemo(() => {
    const cats = categoryList.filter((c) => c.id !== "all");
    const seen = new Set<string>();
    
    return cats.map((cat) => {
      const matchedItems = courses.filter((c) => {
        const titleBn = c.titleBn || "";
        const titleEn = c.titleEn || "";
        const matchesCat = cat.match!.test(titleEn) || cat.match!.test(titleBn);
        if (matchesCat && !seen.has(c.id)) {
          seen.add(c.id);
          return true;
        }
        return false;
      });
      return {
        ...cat,
        items: matchedItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [courses]);

  const handleEnrollClick = (course: Course) => {
    setEnrollmentCourse(course);
    setShowEnrollmentModal(true);
  };

  const renderCourseCard = (course: Course, index: number) => {
    const coursePrice = course.price || 0;
    const isFree = coursePrice === 0;
    const landingHref = (course as any).landing_slug ? `/courses/${(course as any).landing_slug}` : null;
    const CategoryIcon = courseIconMap[course.category || "web"] || BookOpen;

    return (
      <div 
        key={course.id} 
        className="group relative flex flex-col h-full rounded-[24px] bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 p-3"
      >
        {/* Card Header Thumbnail / Gradient */}
        {landingHref ? (
          <Link to={landingHref} className="block overflow-hidden rounded-[18px] relative h-48 bg-muted">
            {course.thumbnail_url ? (
              <img 
                src={course.thumbnail_url} 
                alt={isBn ? course.titleBn : course.titleEn}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-primary/10 flex items-center justify-center">
                <CategoryIcon className="w-10 h-10 text-primary opacity-80" />
              </div>
            )}
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/90 backdrop-blur-md text-primary-foreground text-[10px] font-bold shadow-md">
                {isBn ? "প্র্যাক্টিক্যাল কোর্স" : "Practical Course"}
              </span>
            </div>
          </Link>
        ) : (
          <div className="overflow-hidden rounded-[18px] relative h-48 bg-muted">
            {course.thumbnail_url ? (
              <img 
                src={course.thumbnail_url} 
                alt={isBn ? course.titleBn : course.titleEn}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-primary/10 flex items-center justify-center">
                <CategoryIcon className="w-10 h-10 text-primary opacity-80" />
              </div>
            )}
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/90 backdrop-blur-md text-primary-foreground text-[10px] font-bold shadow-md">
                {isBn ? "প্র্যাক্টিক্যাল কোর্স" : "Practical Course"}
              </span>
            </div>
          </div>
        )}

        {/* Card Body */}
        <div className="flex flex-col flex-1 p-3 pt-4 gap-2">
          {landingHref ? (
            <Link to={landingHref}>
              <h3 className="text-base font-display font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {isBn ? course.titleBn : course.titleEn}
              </h3>
            </Link>
          ) : (
            <h3 className="text-base font-display font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {isBn ? course.titleBn : course.titleEn}
            </h3>
          )}

          {course.trainer_name && (
            <p className="text-xs text-muted-foreground">{course.trainer_name}</p>
          )}

          <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between gap-3">
            <span className="text-lg font-display font-bold text-primary">
              {isFree ? (isBn ? "ফ্রি" : "Free") : `৳${coursePrice.toLocaleString(isBn ? 'bn-BD' : 'en-US')}`}
            </span>

            <Button 
              onClick={() => handleEnrollClick(course)}
              size="sm"
              className="rounded-full bg-primary text-primary-foreground font-semibold px-4 hover:opacity-90 transition-opacity gap-1.5"
            >
              <span>{isBn ? "এনরোল করুন" : "Enroll Now"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <Helmet>
        <title>{isBn ? "সকল কোর্সসমূহ — Learn with AlphaZero" : "All Courses — Learn with AlphaZero"}</title>
        <meta name="description" content="ওয়েব ডেভেলপমেন্ট, গ্রাফিক ডিজাইন, ইউআই/ইউএক্স, এআই ও ডিজিটাল মার্কেটিং কোর্সসমূহ।" />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        {/* Dedicated Page Hero Banner */}
        <section className="relative pt-6 pb-10 border-b border-border/40 bg-gradient-to-b from-primary/[0.05] via-transparent to-transparent">
          <div className="container mx-auto px-5 sm:px-6 text-center max-w-4xl">

            <h1 className="text-3xl sm:text-5xl font-display font-bold leading-tight mb-4 gradient-text">
              {isBn ? "আমাদের সকল প্র্যাক্টিক্যাল কোর্সসমূহ" : "Explore All Practical Courses"}
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8">
              {isBn 
                ? "ওয়েব ডেভেলপমেন্ট, ভাইব কোডিং, গ্রাফিক ডিজাইন, এআই অটোমেশন ও ফ্রীল্যান্সিং-এর উপর বাস্তব প্রজেক্টভিত্তিক কোর্সগুলো এক জায়গায় অর্গানাইজড।"
                : "Web development, vibe coding, UI/UX design, AI automation, and digital freelancing courses organized neatly in one catalog."}
            </p>

            {/* Interactive Search Bar */}
            <div className="relative max-w-xl mx-auto mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={isBn ? "কোর্সের নাম লিখে খুঁজুন..." : "Search courses by keyword..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-12 rounded-full border-border/60 bg-card shadow-sm text-sm focus-visible:ring-primary"
              />
            </div>

            {/* Skill Category Filter Pills - Styled in 1 clean line */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar max-w-full py-1 px-2 flex-nowrap sm:flex-nowrap">
              {categoryList.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-300 border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card hover:bg-muted text-foreground border-border/50"
                    }`}
                  >
                    <Icon size={13} />
                    <span>{isBn ? cat.labelBn : cat.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Course Catalog Grid View */}
        <section className="container mx-auto px-5 sm:px-6 pt-12">
          {coursesLoading ? (
            <div className="py-20 text-center text-muted-foreground">
              {isBn ? "কোর্স লোড হচ্ছে..." : "Loading courses catalog..."}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-20 text-center glass-card rounded-3xl max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-1">{isBn ? "কোনো কোর্স পাওয়া যায়নি" : "No courses found"}</h3>
              <p className="text-sm text-muted-foreground">{isBn ? "অন্য কোনো কি-ওয়ার্ড দিয়ে খুঁজে দেখুন।" : "Try searching with a different keyword."}</p>
            </div>
          ) : activeCategory !== "all" || searchQuery.trim() ? (
            /* Flattened Filtered Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {filteredCourses.map((c, idx) => renderCourseCard(c, idx))}
            </div>
          ) : (
            /* Organized Skill-Based Grouped Sections */
            <div className="space-y-16 max-w-7xl mx-auto">
              {groupedCourses.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.id} className="space-y-6">
                    {/* Section Header */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                          <GroupIcon size={20} />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-display font-bold">
                            {isBn ? group.labelBn : group.labelEn}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {group.items.length} {isBn ? "টি প্র্যাক্টিক্যাল কোর্স" : "courses available"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section Course Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {group.items.map((c, idx) => renderCourseCard(c, idx))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

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

export default AllCoursesCatalogPage;
