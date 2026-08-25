import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Image, Plus, Trash2, Pencil, Save, Sparkles, MoveUp, MoveDown, Layers, Link as LinkIcon, ExternalLink } from "lucide-react";

export interface HeroSlide {
  id: string;
  image: string;
  eyebrowBn: string;
  eyebrowEn: string;
  title1Bn: string;
  title1En: string;
  title2Bn: string;
  title2En: string;
  title3Bn: string;
  title3En: string;
  subtitleBn: string;
  subtitleEn: string;
  ctaBn: string;
  ctaEn: string;
  ctaHref: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: "1",
    image: "https://nid.edu.bd/wp-content/uploads/2024/05/BBA-web-slider-01-01-01-scaled-e1753431207269.jpg",
    eyebrowBn: "ডিজিটাল স্কিল একাডেমি",
    eyebrowEn: "Digital Skill Academy",
    title1Bn: "এক প্ল্যাটফর্ম।",
    title1En: "One platform.",
    title2Bn: "প্রতিটি ডিজিটাল স্কিল।",
    title2En: "every digital skill.",
    title3Bn: "অসীম সম্ভাবনা।",
    title3En: "Endless opportunities.",
    subtitleBn: "AI ও গ্রাফিক ডিজাইন থেকে প্রোগ্রামিং, ওয়েব ডেভেলপমেন্ট, ডিজিটাল মার্কেটিং, ভিডিও এডিটিং এবং ফ্রিল্যান্সিং—সফল ডিজিটাল ক্যারিয়ার গড়তে যা প্রয়োজন সব শিখুন।",
    subtitleEn: "From AI and graphic design to programming, web development, digital marketing, video editing and freelancing — everything you need to build a thriving digital career.",
    ctaBn: "কোর্স দেখুন",
    ctaEn: "Browse Courses",
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

export default function HeroBannerManagement() {
  const queryClient = useQueryClient();
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  const [formData, setFormData] = useState<HeroSlide>({
    id: "",
    image: "",
    eyebrowBn: "",
    eyebrowEn: "",
    title1Bn: "",
    title1En: "",
    title2Bn: "",
    title2En: "",
    title3Bn: "",
    title3En: "",
    subtitleBn: "",
    subtitleEn: "",
    ctaBn: "",
    ctaEn: "",
    ctaHref: "#courses"
  });

  // Fetch from DB or LocalStorage
  const { data: dbContent, isLoading } = useQuery({
    queryKey: ['page-content-hero-banners'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('page_content')
          .select('content_en')
          .eq('page_name', 'home')
          .eq('content_key', 'hero_banners_json')
          .maybeSingle();

        if (data?.content_en) {
          return JSON.parse(data.content_en) as HeroSlide[];
        }
      } catch (e) {
        console.warn('Error reading DB banners:', e);
      }
      const local = localStorage.getItem('hero_banners_json');
      if (local) {
        try {
          return JSON.parse(local) as HeroSlide[];
        } catch {}
      }
      return DEFAULT_SLIDES;
    }
  });

  useEffect(() => {
    if (dbContent && dbContent.length > 0) {
      setSlides(dbContent);
    }
  }, [dbContent]);

  const saveMutation = useMutation({
    mutationFn: async (updatedSlides: HeroSlide[]) => {
      const jsonStr = JSON.stringify(updatedSlides);
      localStorage.setItem('hero_banners_json', jsonStr);

      // Check if row exists
      const { data: existing } = await supabase
        .from('page_content')
        .select('id')
        .eq('page_name', 'home')
        .eq('content_key', 'hero_banners_json')
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from('page_content')
          .update({ content_en: jsonStr })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('page_content')
          .insert({
            page_name: 'home',
            content_key: 'hero_banners_json',
            content_en: jsonStr,
            site_scope: 'learn'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-content-hero-banners'] });
      toast.success("হিরো ব্যানার সফলভাবে সেভ করা হয়েছে!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "সেভ করতে সমস্যা হয়েছে");
    }
  });

  const handleOpenAdd = () => {
    setEditingSlide(null);
    setFormData({
      id: Date.now().toString(),
      image: "https://nid.edu.bd/wp-content/uploads/2024/05/BBA-web-slider-01-01-01-scaled-e1753431207269.jpg",
      eyebrowBn: "ডিজিটাল স্কিল একাডেমি",
      eyebrowEn: "Digital Skill Academy",
      title1Bn: "নতুন ব্যানার শিরোনাম ১",
      title1En: "New Banner Line 1",
      title2Bn: "শিরোনাম ২",
      title2En: "Line 2 Text",
      title3Bn: "শিরোনাম ৩",
      title3En: "Line 3 Text",
      subtitleBn: "কোর্সের সুন্দর বর্ণনা এখানে লিখুন",
      subtitleEn: "Course subtitle description text here",
      ctaBn: "কোর্স দেখুন",
      ctaEn: "View Course",
      ctaHref: "#courses"
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({ ...slide });
    setIsDialogOpen(true);
  };

  const handleSaveSlide = () => {
    if (!formData.image.trim()) {
      toast.error("ব্যানার ইমেজের URL লিখুন");
      return;
    }

    let nextSlides = [...slides];
    if (editingSlide) {
      nextSlides = nextSlides.map(s => (s.id === editingSlide.id ? formData : s));
    } else {
      nextSlides.push(formData);
    }

    setSlides(nextSlides);
    saveMutation.mutate(nextSlides);
    setIsDialogOpen(false);
  };

  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) {
      toast.error("অন্তত ১টি হিরো ব্যানার রাখা আবশ্যক!");
      return;
    }
    if (confirm("আপনি কি নিশ্চিত যে এই ব্যানারটি ডিলিট করতে চান?")) {
      const nextSlides = slides.filter(s => s.id !== id);
      setSlides(nextSlides);
      saveMutation.mutate(nextSlides);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const nextSlides = [...slides];
    const temp = nextSlides[index];
    nextSlides[index] = nextSlides[targetIndex];
    nextSlides[targetIndex] = temp;

    setSlides(nextSlides);
    saveMutation.mutate(nextSlides);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Image className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Hero Banner Management</h2>
            <p className="text-sm text-muted-foreground">
              হোম পেজের হিরো ব্যানার স্লাইড যোগ, পরিবর্তন ও রিমুভ করুন
            </p>
          </div>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
          <Plus className="w-4 h-4" />
          নতুন ব্যানার যোগ করুন
        </Button>
      </div>

      {/* Banner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {slides.map((slide, idx) => (
          <Card key={slide.id} className="overflow-hidden border border-border/50 hover:border-primary/40 transition-all duration-300 shadow-sm">
            <div className="relative h-48 overflow-hidden bg-slate-950">
              <img src={slide.image} alt="" className="w-full h-full object-cover opacity-85" />
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className="bg-black/60 text-white backdrop-blur-md border border-white/20">
                  Slide #{idx + 1}
                </Badge>
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/20">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:text-amber-400" onClick={() => handleMove(idx, 'up')} disabled={idx === 0}>
                  <MoveUp className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:text-amber-400" onClick={() => handleMove(idx, 'down')} disabled={idx === slides.length - 1}>
                  <MoveDown className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">{slide.eyebrowBn || slide.eyebrowEn}</span>
                <h3 className="font-bold text-base leading-snug line-clamp-1">{slide.title1Bn} {slide.title2Bn}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{slide.subtitleBn}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> {slide.ctaHref}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => handleOpenEdit(slide)}>
                    <Pencil className="w-3.5 h-3.5" /> এডিট
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-destructive hover:text-destructive gap-1" onClick={() => handleDeleteSlide(slide.id)}>
                    <Trash2 className="w-3.5 h-3.5" /> ডিলিট
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit / Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {editingSlide ? "হিরো ব্যানার এডিট করুন" : "নতুন হিরো ব্যানার যোগ করুন"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>ব্যানার ছবি (URL)</Label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/banner.jpg"
              />
              {formData.image && (
                <div className="h-28 rounded-lg overflow-hidden border border-border mt-2">
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>আইব্রো ট্যাগ (বাংলা)</Label>
                <Input
                  value={formData.eyebrowBn}
                  onChange={(e) => setFormData({ ...formData, eyebrowBn: e.target.value })}
                  placeholder="ডিজিটাল স্কিল একাডেমি"
                />
              </div>
              <div className="space-y-2">
                <Label>Eyebrow Tag (English)</Label>
                <Input
                  value={formData.eyebrowEn}
                  onChange={(e) => setFormData({ ...formData, eyebrowEn: e.target.value })}
                  placeholder="Digital Skill Academy"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>শিরোনাম লাইন ১ (বাংলা)</Label>
                <Input
                  value={formData.title1Bn}
                  onChange={(e) => setFormData({ ...formData, title1Bn: e.target.value })}
                  placeholder="এক প্ল্যাটফর্ম।"
                />
              </div>
              <div className="space-y-2">
                <Label>Title Line 1 (English)</Label>
                <Input
                  value={formData.title1En}
                  onChange={(e) => setFormData({ ...formData, title1En: e.target.value })}
                  placeholder="One platform."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>শিরোনাম লাইন ২ (বাংলা)</Label>
                <Input
                  value={formData.title2Bn}
                  onChange={(e) => setFormData({ ...formData, title2Bn: e.target.value })}
                  placeholder="প্রতিটি ডিজিটাল স্কিল।"
                />
              </div>
              <div className="space-y-2">
                <Label>Title Line 2 (English)</Label>
                <Input
                  value={formData.title2En}
                  onChange={(e) => setFormData({ ...formData, title2En: e.target.value })}
                  placeholder="every digital skill."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>উপশিরোনাম / ডেসক্রিপশন (বাংলা)</Label>
                <Textarea
                  value={formData.subtitleBn}
                  onChange={(e) => setFormData({ ...formData, subtitleBn: e.target.value })}
                  rows={3}
                  placeholder="কোর্সের বিস্তারিত বর্ণনা"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle / Description (English)</Label>
                <Textarea
                  value={formData.subtitleEn}
                  onChange={(e) => setFormData({ ...formData, subtitleEn: e.target.value })}
                  rows={3}
                  placeholder="Detailed subtitle description"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>বাটন টেক্সট (বাংলা)</Label>
                <Input
                  value={formData.ctaBn}
                  onChange={(e) => setFormData({ ...formData, ctaBn: e.target.value })}
                  placeholder="কোর্স দেখুন"
                />
              </div>
              <div className="space-y-2">
                <Label>Button Text (English)</Label>
                <Input
                  value={formData.ctaEn}
                  onChange={(e) => setFormData({ ...formData, ctaEn: e.target.value })}
                  placeholder="Browse Courses"
                />
              </div>
              <div className="space-y-2">
                <Label>বাটন লিংক URL</Label>
                <Input
                  value={formData.ctaHref}
                  onChange={(e) => setFormData({ ...formData, ctaHref: e.target.value })}
                  placeholder="#courses বা /vibe-coding"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>বাতিল</Button>
            <Button onClick={handleSaveSlide} disabled={saveMutation.isPending} className="gap-2">
              <Save className="w-4 h-4" /> সেভ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
