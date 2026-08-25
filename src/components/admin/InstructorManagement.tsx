import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Plus, Trash2, Pencil, Save, UserCheck, Star, Award, GraduationCap } from "lucide-react";
import instructorAtik from "@/assets/instructors/Atik.png.asset.json";
import instructorHH from "@/assets/instructors/hh.png.asset.json";
import instructorNayeem from "@/assets/instructors/nayeem.png.asset.json";
import instructorShafiul from "@/assets/instructors/shafiul.png.asset.json";
import instructorPapiya from "@/assets/instructors/papiya.png.asset.json";

export interface InstructorItem {
  id: string;
  name: string;
  qualificationBn: string;
  qualificationEn: string;
  image: string;
  roleTag?: string;
  rating?: number;
}

const DEFAULT_INSTRUCTORS: InstructorItem[] = [
  {
    id: "sofiullah",
    name: "Sofiullah Ahammad",
    qualificationEn: "Graphics Designer, Vibe Coding Expert",
    qualificationBn: "গ্রাফিক্স ডিজাইনার, ভাইব কোডিং এক্সপার্ট",
    image: instructorAtik.url,
    roleTag: "Lead Instructor"
  },
  {
    id: "adib",
    name: "Adib Sarkar",
    qualificationEn: "Lead Designer, Entrepreneur",
    qualificationBn: "লিড ডিজাইনার, উদ্যোক্তা",
    image: instructorHH.url,
    roleTag: "Master Mentor"
  },
  {
    id: "nayeem",
    name: "Md Nayeem Ahmed",
    qualificationEn: "Digital Marketer",
    qualificationBn: "ডিজিটাল মার্কেটার",
    image: instructorNayeem.url,
    roleTag: "Marketing Expert"
  },
  {
    id: "shafiul",
    name: "Md. Shafiul Haque",
    qualificationEn: "Video Editor, Cinematographer",
    qualificationBn: "ভিডিও এডিটর, সিনেমাটোগ্রাফার",
    image: instructorShafiul.url,
    roleTag: "Media Trainer"
  },
  {
    id: "papiya",
    name: "Papia Rahman",
    qualificationEn: "Graphic Designer",
    qualificationBn: "গ্রাফিক ডিজাইনার",
    image: instructorPapiya.url,
    roleTag: "Design Mentor"
  }
];

export default function InstructorManagement() {
  const queryClient = useQueryClient();
  const [instructors, setInstructors] = useState<InstructorItem[]>(DEFAULT_INSTRUCTORS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<InstructorItem | null>(null);

  const [formData, setFormData] = useState<InstructorItem>({
    id: "",
    name: "",
    qualificationBn: "",
    qualificationEn: "",
    image: "",
    roleTag: "Instructor"
  });

  const { data: dbContent } = useQuery({
    queryKey: ['page-content-instructors'],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from('page_content')
          .select('content_en')
          .eq('page_name', 'home')
          .eq('content_key', 'instructors_list_json')
          .maybeSingle();

        if (data?.content_en) {
          return JSON.parse(data.content_en) as InstructorItem[];
        }
      } catch (e) {
        console.warn('Error reading DB instructors:', e);
      }
      const local = localStorage.getItem('instructors_list_json');
      if (local) {
        try { return JSON.parse(local) as InstructorItem[]; } catch {}
      }
      return DEFAULT_INSTRUCTORS;
    }
  });

  useEffect(() => {
    if (dbContent && dbContent.length > 0) {
      setInstructors(dbContent);
    }
  }, [dbContent]);

  const saveMutation = useMutation({
    mutationFn: async (updatedList: InstructorItem[]) => {
      const jsonStr = JSON.stringify(updatedList);
      localStorage.setItem('instructors_list_json', jsonStr);

      const { data: existing } = await supabase
        .from('page_content')
        .select('id')
        .eq('page_name', 'home')
        .eq('content_key', 'instructors_list_json')
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
            content_key: 'instructors_list_json',
            content_en: jsonStr,
            site_scope: 'learn'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-content-instructors'] });
      toast.success("ইনস্ট্রাক্টর তালিকা সফলভাবে আপডেট করা হয়েছে!");
    },
    onError: (err: any) => toast.error(err?.message || "সেভ করতে সমস্যা হয়েছে")
  });

  const handleOpenAdd = () => {
    setEditingInstructor(null);
    setFormData({
      id: Date.now().toString(),
      name: "",
      qualificationBn: "",
      qualificationEn: "",
      image: "https://nid.edu.bd/wp-content/uploads/2024/05/BBA-web-slider-01-01-01-scaled-e1753431207269.jpg",
      roleTag: "Instructor"
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (inst: InstructorItem) => {
    setEditingInstructor(inst);
    setFormData({ ...inst });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("ইনস্ট্রাক্টরের নাম লিখুন");
      return;
    }

    let nextList = [...instructors];
    if (editingInstructor) {
      nextList = nextList.map(i => (i.id === editingInstructor.id ? formData : i));
    } else {
      nextList.push(formData);
    }

    setInstructors(nextList);
    saveMutation.mutate(nextList);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("আপনি কি এই ইনস্ট্রাক্টরকে রিমুভ করতে চান?")) {
      const nextList = instructors.filter(i => i.id !== id);
      setInstructors(nextList);
      saveMutation.mutate(nextList);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Instructors Management</h2>
            <p className="text-sm text-muted-foreground">
              হোম পেজে প্রদর্শিত ট্রেইনার / ইনস্ট্রাক্টরদের তথ্য যোগ ও পরিচালনা করুন
            </p>
          </div>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700">
          <Plus className="w-4 h-4" />
          নতুন ইনস্ট্রাক্টর যোগ করুন
        </Button>
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {instructors.map((inst) => (
          <Card key={inst.id} className="overflow-hidden border border-border/50 hover:border-primary/40 transition-all duration-300 shadow-sm text-center">
            <CardContent className="p-5 flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted shadow-md">
                <img src={inst.image} alt={inst.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"; }} />
              </div>

              <div className="space-y-1">
                <Badge variant="secondary" className="text-[10px] font-semibold">
                  {inst.roleTag || "Instructor"}
                </Badge>
                <h3 className="font-bold text-base line-clamp-1">{inst.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{inst.qualificationBn || inst.qualificationEn}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/40 w-full justify-center">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => handleOpenEdit(inst)}>
                  <Pencil className="w-3.5 h-3.5" /> এডিট
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive gap-1" onClick={() => handleDelete(inst.id)}>
                  <Trash2 className="w-3.5 h-3.5" /> ডিলিট
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit / Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              {editingInstructor ? "ইনস্ট্রাক্টর তথ্য এডিট করুন" : "নতুন ইনস্ট্রাক্টর যোগ করুন"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>ইনস্ট্রাক্টরের নাম</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ইনস্ট্রাক্টরের পূর্ণ নাম"
              />
            </div>

            <div className="space-y-2">
              <Label>ছবি (Image URL)</Label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/photo.png"
              />
            </div>

            <div className="space-y-2">
              <Label>পদবি / যোগ্যতা (বাংলা)</Label>
              <Input
                value={formData.qualificationBn}
                onChange={(e) => setFormData({ ...formData, qualificationBn: e.target.value })}
                placeholder="গ্রাফিক্স ডিজাইনার, ভাইব কোডিং এক্সপার্ট"
              />
            </div>

            <div className="space-y-2">
              <Label>Designation / Qualification (English)</Label>
              <Input
                value={formData.qualificationEn}
                onChange={(e) => setFormData({ ...formData, qualificationEn: e.target.value })}
                placeholder="Graphic Designer, Vibe Coding Expert"
              />
            </div>

            <div className="space-y-2">
              <Label>রোল ট্যাগ (e.g., Master Mentor)</Label>
              <Input
                value={formData.roleTag}
                onChange={(e) => setFormData({ ...formData, roleTag: e.target.value })}
                placeholder="Lead Instructor / Master Mentor"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>বাতিল</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
              <Save className="w-4 h-4" /> সেভ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
