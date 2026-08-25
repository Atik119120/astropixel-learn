import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Users, Award, PlayCircle, Sparkles, Target, Rocket, Globe, CheckCircle, ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import learnLogoAssetJson from "@/assets/learn-with-alphazero-logo.png.asset.json";
const learnLogo = learnLogoAssetJson.url;
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageContent } from "@/hooks/usePageContent";
import instructorHH from "@/assets/instructors/hh.png.asset.json";
import instructorNayeem from "@/assets/instructors/nayeem.png.asset.json";
import instructorAtik from "@/assets/instructors/Atik.png.asset.json";
import instructorShafiul from "@/assets/instructors/shafiul.png.asset.json";
import instructorPapiya from "@/assets/instructors/papiya.png.asset.json";
import instructorPrantik from "@/assets/instructors/prantik.png.asset.json";

const STATIC_TRAINERS = [
  { name: "Sofiullah Ahammad", roleEn: "Graphics Designer, Vibe Coding Expert", roleBn: "গ্রাফিক্স ডিজাইনার, ভাইব কোডিং এক্সপার্ট", image: instructorAtik.url },
  { name: "Adib Sarkar", roleEn: "Lead Designer, Entrepreneur", roleBn: "লিড ডিজাইনার, উদ্যোক্তা", image: instructorHH.url },
  { name: "Md Nayeem Ahmed", roleEn: "Digital Marketer", roleBn: "ডিজিটাল মার্কেটার", image: instructorNayeem.url },
  { name: "Md. Shafiul Haque", roleEn: "Video Editor, Cinematographer", roleBn: "ভিডিও এডিটর, সিনেমাটোগ্রাফার", image: instructorShafiul.url },
  { name: "Prantik Saha", roleEn: "Microsoft Office Expert, IT Support", roleBn: "মাইক্রোসফট অফিস এক্সপার্ট, আইটি সাপোর্ট", image: instructorPrantik.url },
  { name: "Papia Rahman", roleEn: "Graphic Designer", roleBn: "গ্রাফিক ডিজাইনার", image: instructorPapiya.url },
  { name: "Rashadul Islam Naime", roleEn: "Digital Marketer, SEO Expert", roleBn: "ডিজিটাল মার্কেটার, এসইও এক্সপার্ট", image: "https://res.cloudinary.com/de348sqlb/image/upload/v1784827649/alphazero-assets/team/rashadul-islam-naime.png" },
];

const LearnAboutPage = () => {
  const { language } = useLanguage();
  const teamMembers = null;
  const isBn = language === "bn";
  const { getContent: getPageContent } = usePageContent("learn-about", "learn");

  const t = (bn: string, en: string) => (isBn ? bn : en);
  const cms = (bnKey: string, enKey: string, bnFb: string, enFb: string) =>
    isBn ? (getPageContent(bnKey) || bnFb) : (getPageContent(enKey) || enFb);

  const features = [
    {
      icon: PlayCircle,
      title: t("প্রিমিয়াম ভিডিও লেসন", "Premium Video Lessons"),
      desc: t(
        "নিরাপদ ভিডিও প্লেয়ার, চ্যাপ্টার-ভিত্তিক পাঠ এবং প্রগ্রেস ট্র্যাকিং সহ প্রফেশনাল কোর্স।",
        "Professional courses with a secure video player, chapter-based lessons, and progress tracking."
      ),
    },
    {
      icon: BookOpen,
      title: t("প্র্যাকটিকাল কারিকুলাম", "Practical Curriculum"),
      desc: t(
        "রিয়েল প্রজেক্ট, ডাউনলোডযোগ্য রিসোর্স এবং ইন্ডাস্ট্রি-স্ট্যান্ডার্ড ওয়ার্কফ্লো।",
        "Real projects, downloadable resources, and industry-standard workflows."
      ),
    },
    {
      icon: Users,
      title: t("এক্সপার্ট ইনস্ট্রাক্টর", "Expert Instructors"),
      desc: t(
        "Learn with AlphaZero-র অভিজ্ঞ ক্রিয়েটর ও ডেভেলপারদের কাছ থেকে সরাসরি শিখুন।",
        "Learn directly from Learn with AlphaZero's experienced creators and developers."
      ),
    },
    {
      icon: Award,
      title: t("ভেরিফায়েড সার্টিফিকেট", "Verified Certificates"),
      desc: t(
        "কোর্স শেষে যাচাইযোগ্য সার্টিফিকেট, যা আপনার প্রোফাইলে যোগ করা যায়।",
        "Verifiable certificates upon completion that you can add to your profile."
      ),
    },
    {
      icon: MessageCircle,
      title: t("লাইভ Q&A ও কমেন্ট", "Live Q&A & Comments"),
      desc: t(
        "প্রতিটি লেসনে প্রশ্ন করুন, ইনস্ট্রাক্টর ও কমিউনিটি থেকে দ্রুত উত্তর পান।",
        "Ask questions on every lesson and get quick replies from instructors and the community."
      ),
    },
    {
      icon: Globe,
      title: t("দ্বিভাষিক অভিজ্ঞতা", "Bilingual Experience"),
      desc: t(
        "সম্পূর্ণ প্ল্যাটফর্ম বাংলা ও ইংরেজিতে — আপনার ভাষায় শিখুন।",
        "The entire platform in Bangla and English — learn in your language."
      ),
    },
  ];

  const values = [
    {
      icon: Target,
      title: t("ফলাফল-কেন্দ্রিক শিক্ষা", "Outcome-Focused Learning"),
      desc: t(
        "আমরা এমন স্কিল শেখাই যা সরাসরি ক্যারিয়ার বা ব্যবসায় প্রয়োগ করা যায়।",
        "We teach skills that translate directly into a career or business."
      ),
    },
    {
      icon: Rocket,
      title: t("জিরো থেকে প্রো", "Zero to Pro"),
      desc: t(
        "একদম বেসিক থেকে অ্যাডভান্স — প্রতিটি লেভেলের শিক্ষার্থীর জন্য কোর্স।",
        "From absolute basics to advanced — courses for every level of learner."
      ),
    },
    {
      icon: Sparkles,
      title: t("ক্রিয়েটিভ + টেকনিক্যাল", "Creative + Technical"),
      desc: t(
        "ডিজাইন, ফটোগ্রাফি, ওয়েব ডেভেলপমেন্ট ও AI — সব এক ছাদের নিচে।",
        "Design, photography, web development and AI — all under one roof."
      ),
    },
  ];

  const whyChoose = [
    t("এক্সপার্ট Astropixel ইনস্ট্রাক্টর", "Expert Astropixel instructors"),
    t("লাইফটাইম কোর্স অ্যাক্সেস", "Lifetime course access"),
    t("বাংলা ও ইংরেজি ভাষা সাপোর্ট", "Bangla & English language support"),
    t("রিয়েল প্রজেক্ট ও অ্যাসাইনমেন্ট", "Real projects and assignments"),
    t("ভেরিফায়েড ডিজিটাল সার্টিফিকেট", "Verified digital certificates"),
  ];

  return (
    <Layout>
      <div className="overflow-x-hidden bg-background">
        {/* Hero */}
        <section className="pt-12 pb-16 lg:pt-16 lg:pb-20 relative overflow-hidden">
          <div className="absolute inset-0 mesh-bg" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">

              <motion.img
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                src={learnLogo}
                alt="Learn with Astropixel"
                className="h-16 md:h-20 w-auto mx-auto mb-8 brightness-0 dark:invert"
              />

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-4xl lg:text-6xl font-display font-bold mb-6 leading-tight"
              >
                {cms("hero.title.bn", "hero.title.en", "শিখুন ", "Learn with ")}
                <span className="gradient-text">Astropixel</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-xl text-muted-foreground max-w-2xl mx-auto"
              >
                {cms("hero.description.bn", "hero.description.en",
                  "Astropixel-এর নিজস্ব লার্নিং প্ল্যাটফর্ম — যেখানে ডিজাইন, ডেভেলপমেন্ট, ফটোগ্রাফি ও ডিজিটাল ক্রিয়েটিভ স্কিল শেখানো হয় প্র্যাকটিকাল ও প্রফেশনাল উপায়ে।",
                  "Astropixel's very own learning platform — teaching design, development, photography, and digital creative skills the practical, professional way."
                )}
              </motion.p>
            </div>
          </div>
        </section>

        {/* What is Learn with Astropixel */}
        <section className="py-12 lg:py-16 relative">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl glass-card p-10 text-center"
              >
                <img
                  src={learnLogo}
                  alt="Learn with Astropixel Logo"
                  className="h-24 md:h-32 w-auto mx-auto brightness-0 dark:invert mb-6"
                />
                <p className="text-primary text-lg font-semibold tracking-wide">
                  {cms("mission.tagline.bn", "mission.tagline.en", "শেখো • তৈরি করো • এগিয়ে যাও", "Learn • Create • Grow")}
                </p>
                <div className="flex justify-center gap-3 mt-4">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-medium text-xs">
                    {t("লার্নিং প্ল্যাটফর্ম", "Learning Platform")}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-secondary border border-border font-medium text-xs">
                    🇧🇩 Bangladesh
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-5"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/[0.06]">
                  <Rocket size={14} className="text-primary" />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary">
                    {cms("mission.badge.bn", "mission.badge.en", "আমাদের মিশন", "Our Mission")}
                  </span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-display font-bold leading-tight">
                  {cms("mission.title.bn", "mission.title.en", "বাংলাদেশের ক্রিয়েটরদের জন্য একটি ", "A modern learning home for ")}
                  <span className="gradient-text">
                    {cms("mission.title2.bn", "mission.title2.en", "আধুনিক শিক্ষা প্ল্যাটফর্ম", "Bangladeshi creators")}
                  </span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {cms("mission.desc.bn", "mission.desc.en",
                    "Learn with Astropixel হলো Astropixel এজেন্সির লার্নিং শাখা। এখানে আমরা এমন কোর্স তৈরি করি যা শুধু থিওরি নয় — আসল ক্লায়েন্ট প্রজেক্টে ব্যবহৃত টুলস, প্রসেস ও ওয়ার্কফ্লো শেখায়। শিক্ষার্থীরা শেখেন, তৈরি করেন এবং সরাসরি পোর্টফোলিও গড়ে তোলেন।",
                    "Learn with Astropixel is the education arm of the Astropixel agency. We build courses that go beyond theory — teaching the exact tools, processes, and workflows used on real client projects. Students learn, build, and grow a portfolio at the same time."
                  )}
                </p>

                <div className="p-5 rounded-2xl glass-card">
                  <h4 className="text-base font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    {cms("mission.whyTitle.bn", "mission.whyTitle.en", "কেন Learn with Astropixel?", "Why Learn with Astropixel?")}
                  </h4>
                  <div className="space-y-2.5">
                    {whyChoose.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 lg:py-16 relative mesh-bg">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/[0.06] mb-6">
                  <Sparkles size={14} className="text-primary" />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary">
                    {cms("features.badge.bn", "features.badge.en", "প্ল্যাটফর্ম ফিচার", "Platform Features")}
                  </span>
                </div>
                <h2 className="text-3xl lg:text-5xl font-display font-bold">
                  {cms("features.title.bn", "features.title.en", "যা যা পাচ্ছেন এই ", "Everything you get on ")}
                  <span className="gradient-text">Learn</span>
                  {cms("features.title2.bn", "features.title2.en", " প্ল্যাটফর্মে", " platform")}
                </h2>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {features.map((f, index) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ y: -6 }}
                    className="group relative p-7 rounded-2xl glass-card overflow-hidden"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/[0.08] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <f.icon size={24} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-display font-bold mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-12 lg:py-16 relative">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/[0.06] mb-6">
                  <Target size={14} className="text-primary" />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary">
                    {cms("values.badge.bn", "values.badge.en", "আমাদের মূল্যবোধ", "Core Values")}
                  </span>
                </div>
                <h2 className="text-3xl lg:text-5xl font-display font-bold">
                  {cms("values.title.bn", "values.title.en", "যে নীতিতে আমরা কোর্স তৈরি করি", "The principles behind every course")}
                </h2>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-5">
                {values.map((v, i) => (
                  <motion.div
                    key={v.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -6 }}
                    className="group relative p-7 rounded-2xl glass-card overflow-hidden"
                  >
                    <span className="absolute -bottom-4 -right-2 text-[7rem] font-display font-bold text-muted-foreground/[0.04] leading-none select-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="w-14 h-14 rounded-2xl bg-primary/[0.08] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <v.icon size={24} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-display font-bold mb-2">{v.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Instructors */}
        <section id="instructors" className="py-12 lg:py-16 relative border-t border-border/40">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/[0.06] mb-6">
                  <Users size={14} className="text-primary" />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary">
                    {cms("linstructors.badge.bn", "linstructors.badge.en", "আমাদের টিম", "Our Team")}
                  </span>
                </div>
                <h2 className="text-3xl lg:text-5xl font-display font-bold">
                  {cms("linstructors.title.bn", "linstructors.title.en", "এক্সপার্ট ", "Expert ")}
                  <span className="gradient-text">{cms("linstructors.title2.bn", "linstructors.title2.en", "ইনস্ট্রাক্টর", "Instructors")}</span>
                </h2>
                <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
                  {cms("linstructors.desc.bn", "linstructors.desc.en",
                    "ইন্ডাস্ট্রি এক্সপার্টদের কাছ থেকে সরাসরি শিখুন।",
                    "Learn directly from industry experts."
                  )}
                </p>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {(() => {
                  const dbList = (teamMembers || []).filter(
                    (m: any) => !m.site_scope || m.site_scope === "learn"
                  );
                  const norm = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
                  const seen = new Set<string>();
                  const merged: { name: string; role: string; image: string | null; id: string }[] = [];
                  // Static first (guaranteed images + order matches Learn carousel)
                  STATIC_TRAINERS.forEach((tr) => {
                    const k = norm(tr.name);
                    if (seen.has(k)) return;
                    seen.add(k);
                    merged.push({ id: `s-${k}`, name: tr.name, role: isBn ? tr.roleBn : tr.roleEn, image: tr.image });
                  });
                  dbList.forEach((m: any) => {
                    const k = norm(m.name);
                    if (!k || seen.has(k)) return;
                    seen.add(k);
                    merged.push({ id: m.id, name: m.name, role: m.role, image: m.image_url || null });
                  });
                  return merged.map((tr, i) => (
                    <motion.div
                      key={tr.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="group"
                    >
                      <div className="rounded-2xl overflow-hidden border border-border/40 bg-card hover:border-primary/40 transition-all hover:-translate-y-1 flex flex-col h-full">
                        <div className="relative aspect-[4/5] w-full overflow-hidden">

                          {tr.image ? (
                            <img
                              src={tr.image}
                              alt={tr.name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-4xl font-display font-bold text-primary/60">
                              {(tr.name || "?").charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="p-4 text-center">
                          <h3 className="font-display font-bold text-sm mb-1 group-hover:text-primary transition-colors">
                            {tr.name}
                          </h3>
                          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                            {tr.role}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ));
                })()}
              </div>

            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
};

export default LearnAboutPage;
