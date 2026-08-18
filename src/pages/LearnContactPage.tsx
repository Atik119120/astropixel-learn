import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Phone, MessageCircle, Send, GraduationCap, HelpCircle, BookOpen, Clock, MapPin, Sparkles, ArrowUpRight } from "lucide-react";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFooterContent } from "@/hooks/useFooterData";
import { usePageContent } from "@/hooks/usePageContent";

const LearnContactPage = () => {
  const { language } = useLanguage();
  const { data: footerContents } = useFooterContent();
  const { getContent: getPageContent } = usePageContent("learn-contact", "learn");
  const [formData, setFormData] = useState({ name: "", email: "", topic: "general", message: "" });
  const isBn = language === "bn";
  const t = (bn: string, en: string) => (isBn ? bn : en);
  const cms = (bnKey: string, enKey: string, bnFb: string, enFb: string) =>
    isBn ? (getPageContent(bnKey) || bnFb) : (getPageContent(enKey) || enFb);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Learn contact form:", formData);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getFooterContent = (key: string) => {
    const c = footerContents?.find((i) => i.content_key === key);
    if (!c) return null;
    return c.content_en;
  };
  const phone = getPageContent("learn.phone") || getFooterContent("phone") || "+880 1344-497808";
  const rawEmail = (getPageContent("learn.email") || "hello@astropixel.tech").trim();
  const email = (!rawEmail || rawEmail.includes("alphazero") || rawEmail.includes("contact@") || rawEmail.includes("support@learn")) ? "hello@astropixel.tech" : rawEmail;
  const address = cms("learn.address", "learn.address.en", "ঢাকা, বাংলাদেশ", "Dhaka, Bangladesh");
  const waNumber = phone.replace(/\D/g, "");

  const topics = [
    { value: "general", label: t("সাধারণ প্রশ্ন", "General Question") },
    { value: "enrollment", label: t("কোর্স এনরোলমেন্ট", "Course Enrollment") },
    { value: "payment", label: t("পেমেন্ট সহায়তা", "Payment Help") },
    { value: "technical", label: t("টেকনিক্যাল ইস্যু", "Technical Issue") },
    { value: "certificate", label: t("সার্টিফিকেট", "Certificate") },
  ];

  const quickHelp = [
    { icon: BookOpen, title: t("কোর্স ব্রাউজ", "Browse Courses"), desc: t("আমাদের সমস্ত কোর্স দেখুন", "Explore all our courses"), href: "/courses" },
    { icon: HelpCircle, title: t("সাধারণ প্রশ্ন", "FAQ"), desc: t("দ্রুত উত্তর পান", "Get quick answers"), href: "/learn-about" },
    { icon: GraduationCap, title: t("স্টুডেন্ট লগইন", "Student Login"), desc: t("আপনার ড্যাশবোর্ডে প্রবেশ করুন", "Access your dashboard"), href: "/student/login" },
  ];

  return (
    <Layout>
      <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative pt-28 pb-8 lg:pt-36 lg:pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.05] via-background to-background" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-4 shadow-sm shadow-primary/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <GraduationCap size={14} className="text-primary" />
              <span className="text-xs font-bold tracking-[0.15em] uppercase text-primary">
                {cms("hero.badge.bn", "hero.badge.en", "লার্ন সাপোর্ট", "Learn Support")}
              </span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-3xl lg:text-5xl font-display font-bold mb-3 leading-[1.1] tracking-tight">
              {cms("hero.title.bn", "hero.title.en", "শিখতে চান? ", "Learning? ")}
              <span className="bg-gradient-to-r from-cyan-400 via-primary to-blue-500 bg-clip-text text-transparent">
                {cms("hero.title2.bn", "hero.title2.en", "আমরা সাহায্য করব", "We're here to help")}
              </span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {cms("hero.description.bn", "hero.description.en",
                "কোর্স, এনরোলমেন্ট বা পেমেন্ট সংক্রান্ত যেকোনো প্রশ্ন — আমাদের একাডেমী টিম ২৪ ঘন্টার মধ্যে উত্তর দেবে।",
                "Any question about courses, enrollment or payment — our academy team responds within 24 hours."
              )}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1.5"><Clock size={12} className="text-primary" /> {t("২৪ ঘন্টায় জবাব", "24h response")}</div>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <div className="inline-flex items-center gap-1.5"><MessageCircle size={12} className="text-primary" /> {t("লাইভ WhatsApp", "Live WhatsApp")}</div>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <div className="inline-flex items-center gap-1.5"><Sparkles size={12} className="text-primary" /> {t("বিশেষজ্ঞ টিম", "Expert team")}</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick help cards */}
      <section className="pb-4">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
            {quickHelp.map((item, i) => (
              <motion.a key={i} href={item.href}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group relative p-6 rounded-2xl glass-card border border-border/60 hover:border-primary/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <item.icon size={22} className="text-primary" />
                    </div>
                    <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>


      {/* Contact form + Info */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-1 gap-8">
            {/* Info sidebar */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="space-y-4">

              <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25">
                <h3 className="font-display font-bold text-lg mb-4">{t("দ্রুত যোগাযোগ", "Quick Contact")}</h3>
                <div className="space-y-3">
                  <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-background/40 hover:bg-background/70 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <MessageCircle size={18} className="text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">WhatsApp</div>
                      <div className="text-sm font-medium truncate">{phone}</div>
                    </div>
                  </a>
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-background/40 hover:bg-background/70 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Phone size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">{t("কল করুন", "Call")}</div>
                      <div className="text-sm font-medium truncate">{phone}</div>
                    </div>
                  </a>
                  <a href={`mailto:${email}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-background/40 hover:bg-background/70 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Mail size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="text-sm font-medium truncate">{email}</div>
                    </div>
                  </a>
                </div>
              </div>

              <div className="p-6 rounded-3xl glass-card space-y-4">
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("সাপোর্ট সময়", "Support Hours")}</div>
                    <div className="text-sm font-medium">{cms("info.hours.bn", "info.hours.en", "শনি — বৃহস্পতি, ১০টা — ১০টা", "Sat — Thu, 10am — 10pm")}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("ঠিকানা", "Location")}</div>
                    <div className="text-sm font-medium">{address}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      </main>
    </Layout>
  );
};

export default LearnContactPage;
