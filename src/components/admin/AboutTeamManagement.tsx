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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Info, Target, Sparkles, Eye, Users, Plus, Trash2, Pencil, Save, CheckCircle2, Shield, HeartHandshake } from "lucide-react";

export interface PlatformFeature {
  id: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  iconName?: string;
}

export interface TeamMemberItem {
  id: string;
  name: string;
  roleBn: string;
  roleEn: string;
  bioBn: string;
  bioEn: string;
  image: string;
}

export interface AboutPageData {
  heroTitleBn: string;
  heroTitleEn: string;
  heroSubtitleBn: string;
  heroSubtitleEn: string;
  missionTitleBn: string;
  missionTitleEn: string;
  missionDescBn: string;
  missionDescEn: string;
  missionPointsBn: string[];
  missionPointsEn: string[];
  visualsTitleBn: string;
  visualsTitleEn: string;
  visualsDescBn: string;
  visualsDescEn: string;
  features: PlatformFeature[];
  teamMembers: TeamMemberItem[];
}

const DEFAULT_ABOUT_DATA: AboutPageData = {
  heroTitleBn: "আমাদের সম্পর্কে",
  heroTitleEn: "About Astropixel Academy",
  heroSubtitleBn: "প্র্যাক্টিক্যাল, জব-রেডি ও AI-পাওয়ার্ড ডিজিটাল স্কিল শেখার ১০০% অনলাইন একাডেমি।",
  heroSubtitleEn: "100% Online-based Academy for Practical, Job-Ready & AI-Powered Digital Skills.",
  missionTitleBn: "আমাদের মিশন",
  missionTitleEn: "Our Mission",
  missionDescBn: "সহজ ও সাশ্রয়ী মূল্যে প্রতিটি শিক্ষার্থীকে গ্লোবাল মার্কেটের জন্য স্কিলড করে গড়ে তোলা।",
  missionDescEn: "Empowering students in Bangladesh with world-class digital skills and career support.",
  missionPointsBn: [
    "১০০% প্র্যাক্টিক্যাল প্রজেক্ট-বেজড লার্নিং",
    "২৪/৭ একটিভ লার্নিং সাপোর্ট ও ডাউট সলভিং",
    "ভেরিফাইড ডিজিটাল সার্টিফিকেট ও পোর্টফোলিও গাইড"
  ],
  missionPointsEn: [
    "100% Practical Project-Based Learning",
    "24/7 Active Learning Support & Doubt Solving",
    "Verifiable Digital Certificate & Portfolio Guidance"
  ],
  visualsTitleBn: "আমাদের কোর ভ্যালু ও ভিজ্যুয়ালস",
  visualsTitleEn: "Our Core Visuals & Values",
  visualsDescBn: "সততা, উদ্ভাবন ও কোয়ালিটি লার্নিং আমাদের মূল ভিত্তি।",
  visualsDescEn: "Integrity, innovation, and quality learning form our foundation.",
  features: [
    {
      id: "feat-1",
      titleBn: "AI-পাওয়ার্ড নো-কোড লার্নিং",
      titleEn: "AI-Powered No-Code Learning",
      descBn: "কোডিং ছাড়া সহজেই ওয়েবসাইট ও ডিজিটাল প্রোডাক্ট বিল্ড করতে শিখুন।",
      descEn: "Learn to build websites & digital products effortlessly using AI tools."
    },
    {
      id: "feat-2",
      titleBn: "লাইফটাইম ড্যাশবোর্ড অ্যাক্সেস",
      titleEn: "Lifetime Dashboard Access",
      descBn: "সব কন্টেন্ট, আপডেট ও ক্লাস লাইফটাইম অ্যাক্সেস করুন।",
      descEn: "Enjoy lifetime access to all course modules, updates & resources."
    }
  ],
  teamMembers: [
    {
      id: "team-1",
      name: "Sofiullah Ahammad",
      roleBn: "ফাভন্ডার ও সিইও",
      roleEn: "Founder & CEO",
      bioBn: "গ্রাফিক্স ডিজাইনার ও ভাইব কোডিং প্রাকটিশনার",
      bioEn: "Graphic Designer & Vibe Coding Practitioner",
      image: "https://nid.edu.bd/wp-content/uploads/2024/05/BBA-web-slider-01-01-01-scaled-e1753431207269.jpg"
    }
  ]
};

export default function AboutTeamManagement() {
  const queryClient = useQueryClient();
  const [aboutData, setAboutData] = useState<AboutPageData>(DEFAULT_ABOUT_DATA);
  const [activeTab, setActiveTab] = useState("mission");

  // Feature Dialog State
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PlatformFeature | null>(null);
  const [featureForm, setFeatureForm] = useState<PlatformFeature>({
    id: "",
    titleBn: "",
    titleEn: "",
    descBn: "",
    descEn: ""
  });

  // Team Dialog State
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMemberItem | null>(null);
  const [teamForm, setTeamForm] = useState<TeamMemberItem>({
    id: "",
    name: "",
    roleBn: "",
    roleEn: "",
    bioBn: "",
    bioEn: "",
    image: ""
  });

  const { data: dbData } = useQuery({
    queryKey: ['page-content-about-full'],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from('page_content')
          .select('content_en')
          .eq('page_name', 'about')
          .eq('content_key', 'about_page_full_json')
          .maybeSingle();

        if (data?.content_en) {
          return JSON.parse(data.content_en) as AboutPageData;
        }
      } catch (e) {
        console.warn('Error reading about page data:', e);
      }
      const local = localStorage.getItem('about_page_full_json');
      if (local) {
        try { return JSON.parse(local) as AboutPageData; } catch {}
      }
      return DEFAULT_ABOUT_DATA;
    }
  });

  useEffect(() => {
    if (dbData) {
      setAboutData(dbData);
    }
  }, [dbData]);

  const saveMutation = useMutation({
    mutationFn: async (updated: AboutPageData) => {
      const jsonStr = JSON.stringify(updated);
      localStorage.setItem('about_page_full_json', jsonStr);

      const { data: existing } = await supabase
        .from('page_content')
        .select('id')
        .eq('page_name', 'about')
        .eq('content_key', 'about_page_full_json')
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
            page_name: 'about',
            content_key: 'about_page_full_json',
            content_en: jsonStr,
            site_scope: 'learn'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-content-about-full'] });
      toast.success("অ্যাবাউট পেজ ও টিম ইনফো সফলভাবে সেভ করা হয়েছে!");
    },
    onError: (err: any) => toast.error(err?.message || "সেভ করতে সমস্যা হয়েছে")
  });

  const handleSaveMain = () => {
    saveMutation.mutate(aboutData);
  };

  // Feature Handlers
  const handleOpenAddFeature = () => {
    setEditingFeature(null);
    setFeatureForm({
      id: Date.now().toString(),
      titleBn: "",
      titleEn: "",
      descBn: "",
      descEn: ""
    });
    setIsFeatureDialogOpen(true);
  };

  const handleOpenEditFeature = (feat: PlatformFeature) => {
    setEditingFeature(feat);
    setFeatureForm({ ...feat });
    setIsFeatureDialogOpen(true);
  };

  const handleSaveFeature = () => {
    if (!featureForm.titleBn.trim()) {
      toast.error("ফিচারের শিরোনাম লিখুন");
      return;
    }
    let updatedList = [...(aboutData.features || [])];
    if (editingFeature) {
      updatedList = updatedList.map(f => (f.id === editingFeature.id ? featureForm : f));
    } else {
      updatedList.push(featureForm);
    }
    const nextData = { ...aboutData, features: updatedList };
    setAboutData(nextData);
    saveMutation.mutate(nextData);
    setIsFeatureDialogOpen(false);
  };

  const handleDeleteFeature = (id: string) => {
    if (confirm("আপনি কি এই ফিচারটি মুছে ফেলতে চান?")) {
      const updatedList = (aboutData.features || []).filter(f => f.id !== id);
      const nextData = { ...aboutData, features: updatedList };
      setAboutData(nextData);
      saveMutation.mutate(nextData);
    }
  };

  // Team Member Handlers
  const handleOpenAddTeam = () => {
    setEditingTeamMember(null);
    setTeamForm({
      id: Date.now().toString(),
      name: "",
      roleBn: "",
      roleEn: "",
      bioBn: "",
      bioEn: "",
      image: "https://nid.edu.bd/wp-content/uploads/2024/05/BBA-web-slider-01-01-01-scaled-e1753431207269.jpg"
    });
    setIsTeamDialogOpen(true);
  };

  const handleOpenEditTeam = (m: TeamMemberItem) => {
    setEditingTeamMember(m);
    setTeamForm({ ...m });
    setIsTeamDialogOpen(true);
  };

  const handleSaveTeamMember = () => {
    if (!teamForm.name.trim()) {
      toast.error("টিম মেম্বারের নাম লিখুন");
      return;
    }
    let updatedList = [...(aboutData.teamMembers || [])];
    if (editingTeamMember) {
      updatedList = updatedList.map(t => (t.id === editingTeamMember.id ? teamForm : t));
    } else {
      updatedList.push(teamForm);
    }
    const nextData = { ...aboutData, teamMembers: updatedList };
    setAboutData(nextData);
    saveMutation.mutate(nextData);
    setIsTeamDialogOpen(false);
  };

  const handleDeleteTeamMember = (id: string) => {
    if (confirm("আপনি কি এই টিম মেম্বারকে ডিলিট করতে চান?")) {
      const updatedList = (aboutData.teamMembers || []).filter(t => t.id !== id);
      const nextData = { ...aboutData, teamMembers: updatedList };
      setAboutData(nextData);
      saveMutation.mutate(nextData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">About Page & Team Management</h2>
            <p className="text-sm text-muted-foreground">
              মিশন, প্ল্যাটফর্ম ফিচার, কোর ভিজ্যুয়াল ও টিম মেম্বারদের তথ্য পরিচালনা করুন
            </p>
          </div>
        </div>

        <Button onClick={handleSaveMain} disabled={saveMutation.isPending} className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
          <Save className="w-4 h-4" />
          পরিবর্তন সেভ করুন
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="mission" className="gap-1.5"><Target className="w-3.5 h-3.5" /> মিশন ও ভিশন</TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" /> প্ল্যাটফর্ম ফিচার</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><Users className="w-3.5 h-3.5" /> আমাদের টিম</TabsTrigger>
        </TabsList>

        {/* Tab 1: Mission & Vision */}
        <TabsContent value="mission" className="space-y-5">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" />
                আমাদের মিশন (Our Mission)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>মিশন শিরোনাম (বাংলা)</Label>
                  <Input
                    value={aboutData.missionTitleBn}
                    onChange={(e) => setAboutData({ ...aboutData, missionTitleBn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mission Title (English)</Label>
                  <Input
                    value={aboutData.missionTitleEn}
                    onChange={(e) => setAboutData({ ...aboutData, missionTitleEn: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>মিশন বর্ণনা (বাংলা)</Label>
                  <Textarea
                    value={aboutData.missionDescBn}
                    onChange={(e) => setAboutData({ ...aboutData, missionDescBn: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mission Description (English)</Label>
                  <Textarea
                    value={aboutData.missionDescEn}
                    onChange={(e) => setAboutData({ ...aboutData, missionDescEn: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4 text-violet-500" />
                কোর ভিজ্যুয়ালস ও ভ্যালু (Core Visuals & Values)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>কোর ভ্যালু শিরোনাম (বাংলা)</Label>
                  <Input
                    value={aboutData.visualsTitleBn}
                    onChange={(e) => setAboutData({ ...aboutData, visualsTitleBn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Core Values Title (English)</Label>
                  <Input
                    value={aboutData.visualsTitleEn}
                    onChange={(e) => setAboutData({ ...aboutData, visualsTitleEn: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>কোর ভ্যালু বর্ণনা (বাংলা)</Label>
                  <Textarea
                    value={aboutData.visualsDescBn}
                    onChange={(e) => setAboutData({ ...aboutData, visualsDescBn: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Core Values Description (English)</Label>
                  <Textarea
                    value={aboutData.visualsDescEn}
                    onChange={(e) => setAboutData({ ...aboutData, visualsDescEn: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Platform Features */}
        <TabsContent value="features" className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">প্ল্যাটফর্ম ফিচারসমূহ</h3>
              <p className="text-xs text-muted-foreground">একাডেমির বিশেষ সুবিধা ও ফিচারগুলো একটি একটি করে ম্যানেজ করুন</p>
            </div>
            <Button size="sm" onClick={handleOpenAddFeature} className="gap-1 bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4" /> নতুন ফিচার যোগ করুন
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(aboutData.features || []).map((feat) => (
              <Card key={feat.id} className="border border-border/50 hover:border-violet-500/40 transition-all">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-base">{feat.titleBn}</h4>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpenEditFeature(feat)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteFeature(feat.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{feat.descBn}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Our Team */}
        <TabsContent value="team" className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">টিম মেম্বারস</h3>
              <p className="text-xs text-muted-foreground">আমাদের টিমের সদস্যদের তথ্য ও ছবি ম্যানেজ করুন</p>
            </div>
            <Button size="sm" onClick={handleOpenAddTeam} className="gap-1 bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4" /> নতুন মেম্বার যোগ করুন
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(aboutData.teamMembers || []).map((member) => (
              <Card key={member.id} className="border border-border/50 hover:border-purple-500/40 transition-all text-center">
                <CardContent className="p-5 flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/20 bg-muted">
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"; }} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-base">{member.name}</h4>
                    <Badge variant="secondary" className="text-[10px]">{member.roleBn || member.roleEn}</Badge>
                    <p className="text-xs text-muted-foreground line-clamp-2">{member.bioBn}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/40 w-full justify-center">
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => handleOpenEditTeam(member)}>
                      <Pencil className="w-3.5 h-3.5" /> এডিট
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive gap-1" onClick={() => handleDeleteTeamMember(member.id)}>
                      <Trash2 className="w-3.5 h-3.5" /> ডিলিট
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Add/Edit Dialog */}
      <Dialog open={isFeatureDialogOpen} onOpenChange={setIsFeatureDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFeature ? "ফিচার এডিট করুন" : "নতুন ফিচার যোগ করুন"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>ফিচার শিরোনাম (বাংলা)</Label>
              <Input value={featureForm.titleBn} onChange={(e) => setFeatureForm({ ...featureForm, titleBn: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Feature Title (English)</Label>
              <Input value={featureForm.titleEn} onChange={(e) => setFeatureForm({ ...featureForm, titleEn: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>ফিচার বর্ণনা (বাংলা)</Label>
              <Textarea value={featureForm.descBn} onChange={(e) => setFeatureForm({ ...featureForm, descBn: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Feature Description (English)</Label>
              <Textarea value={featureForm.descEn} onChange={(e) => setFeatureForm({ ...featureForm, descEn: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeatureDialogOpen(false)}>বাতিল</Button>
            <Button onClick={handleSaveFeature} className="bg-violet-600 hover:bg-violet-700">সেভ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Add/Edit Dialog */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTeamMember ? "টিম মেম্বার এডিট করুন" : "নতুন টিম মেম্বার যোগ করুন"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>পূর্ণ নাম</Label>
              <Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>ছবি (Image URL)</Label>
              <Input value={teamForm.image} onChange={(e) => setTeamForm({ ...teamForm, image: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>পদবি (বাংলা)</Label>
              <Input value={teamForm.roleBn} onChange={(e) => setTeamForm({ ...teamForm, roleBn: e.target.value })} placeholder="ফাভন্ডার ও সিইও" />
            </div>
            <div className="space-y-1">
              <Label>Role / Position (English)</Label>
              <Input value={teamForm.roleEn} onChange={(e) => setTeamForm({ ...teamForm, roleEn: e.target.value })} placeholder="Founder & CEO" />
            </div>
            <div className="space-y-1">
              <Label>বায়ো / ছোট বর্ণনা (বাংলা)</Label>
              <Textarea value={teamForm.bioBn} onChange={(e) => setTeamForm({ ...teamForm, bioBn: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeamDialogOpen(false)}>বাতিল</Button>
            <Button onClick={handleSaveTeamMember} className="bg-purple-600 hover:bg-purple-700">সেভ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
