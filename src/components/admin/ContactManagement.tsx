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
import { Phone, Mail, MapPin, Clock, MessageSquare, Plus, Trash2, Pencil, Save, Building2, Globe, Share2 } from "lucide-react";

export interface CustomContactItem {
  id: string;
  type: 'phone' | 'email' | 'address' | 'whatsapp' | 'social' | 'branch';
  titleBn: string;
  titleEn: string;
  valueBn: string;
  valueEn: string;
  iconName?: string;
}

export interface ContactPageData {
  heroTitleBn: string;
  heroTitleEn: string;
  heroSubtitleBn: string;
  heroSubtitleEn: string;
  mainAddressBn: string;
  mainAddressEn: string;
  mainPhoneBn: string;
  mainPhoneEn: string;
  mainEmailBn: string;
  mainEmailEn: string;
  whatsappBn: string;
  whatsappEn: string;
  businessHoursBn: string;
  businessHoursEn: string;
  customContacts: CustomContactItem[];
}

const DEFAULT_CONTACT_DATA: ContactPageData = {
  heroTitleBn: "যোগাযোগ করুন",
  heroTitleEn: "Get in Touch with Us",
  heroSubtitleBn: "যেকোনো সাহায্য, প্রশ্ন বা মতামত জানাতে সরাসরি যোগাযোগ করুন।",
  heroSubtitleEn: "Have any questions or need assistance? We are here to help.",
  mainAddressBn: "মিরপুর, ঢাকা - ১২১৬, বাংলাদেশ",
  mainAddressEn: "Mirpur, Dhaka - 1216, Bangladesh",
  mainPhoneBn: "+880 1700-000000",
  mainPhoneEn: "+880 1700-000000",
  mainEmailBn: "support@astropixel.online",
  mainEmailEn: "support@astropixel.online",
  whatsappBn: "+880 1700-000000",
  whatsappEn: "+880 1700-000000",
  businessHoursBn: "শনিবার - বৃহস্পতিবার: সকাল ১০:০০ - রাত ৮:০০",
  businessHoursEn: "Saturday - Thursday: 10:00 AM - 8:00 PM",
  customContacts: [
    {
      id: "branch-1",
      type: "branch",
      titleBn: "চট্টগ্রাম শাখা অফিস",
      titleEn: "Chittagong Branch Office",
      valueBn: "জিইসি মোড়, চট্টগ্রাম",
      valueEn: "GEC Circle, Chittagong"
    },
    {
      id: "sales-phone",
      type: "phone",
      titleBn: "এডমিশন ও হেল্পলাইন",
      titleEn: "Admission Helpline",
      valueBn: "+880 1800-112233",
      valueEn: "+880 1800-112233"
    }
  ]
};

export default function ContactManagement() {
  const queryClient = useQueryClient();
  const [contactData, setContactData] = useState<ContactPageData>(DEFAULT_CONTACT_DATA);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [editingCustomItem, setEditingCustomItem] = useState<CustomContactItem | null>(null);

  const [customItemForm, setCustomItemForm] = useState<CustomContactItem>({
    id: "",
    type: "phone",
    titleBn: "",
    titleEn: "",
    valueBn: "",
    valueEn: ""
  });

  const { data: dbData } = useQuery({
    queryKey: ['page-content-contact-full'],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from('page_content')
          .select('content_en')
          .eq('page_name', 'contact')
          .eq('content_key', 'contact_page_full_json')
          .maybeSingle();

        if (data?.content_en) {
          return JSON.parse(data.content_en) as ContactPageData;
        }
      } catch (e) {
        console.warn('Error reading contact page content:', e);
      }
      const local = localStorage.getItem('contact_page_full_json');
      if (local) {
        try { return JSON.parse(local) as ContactPageData; } catch {}
      }
      return DEFAULT_CONTACT_DATA;
    }
  });

  useEffect(() => {
    if (dbData) {
      setContactData(dbData);
    }
  }, [dbData]);

  const saveMutation = useMutation({
    mutationFn: async (updated: ContactPageData) => {
      const jsonStr = JSON.stringify(updated);
      localStorage.setItem('contact_page_full_json', jsonStr);

      const { data: existing } = await supabase
        .from('page_content')
        .select('id')
        .eq('page_name', 'contact')
        .eq('content_key', 'contact_page_full_json')
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
            page_name: 'contact',
            content_key: 'contact_page_full_json',
            content_en: jsonStr,
            site_scope: 'learn'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-content-contact-full'] });
      toast.success("কন্টাক্ট পেজ ও কাস্টম কন্টাক্ট তথ্য সেভ করা হয়েছে!");
    },
    onError: (err: any) => toast.error(err?.message || "সেভ করতে সমস্যা হয়েছে")
  });

  const handleSaveMainContact = () => {
    saveMutation.mutate(contactData);
  };

  const handleOpenAddCustom = () => {
    setEditingCustomItem(null);
    setCustomItemForm({
      id: Date.now().toString(),
      type: "phone",
      titleBn: "",
      titleEn: "",
      valueBn: "",
      valueEn: ""
    });
    setIsCustomDialogOpen(true);
  };

  const handleOpenEditCustom = (item: CustomContactItem) => {
    setEditingCustomItem(item);
    setCustomItemForm({ ...item });
    setIsCustomDialogOpen(true);
  };

  const handleSaveCustomItem = () => {
    if (!customItemForm.titleBn.trim() || !customItemForm.valueBn.trim()) {
      toast.error("কাস্টম কন্টাক্ট শিরোনাম ও ভ্যালু লিখুন");
      return;
    }

    let updatedList = [...(contactData.customContacts || [])];
    if (editingCustomItem) {
      updatedList = updatedList.map(i => (i.id === editingCustomItem.id ? customItemForm : i));
    } else {
      updatedList.push(customItemForm);
    }

    const updatedData = { ...contactData, customContacts: updatedList };
    setContactData(updatedData);
    saveMutation.mutate(updatedData);
    setIsCustomDialogOpen(false);
  };

  const handleDeleteCustomItem = (id: string) => {
    if (confirm("আপনি কি এই কাস্টম কন্টাক্ট আইটেমটি মুছে ফেলতে চান?")) {
      const updatedList = (contactData.customContacts || []).filter(i => i.id !== id);
      const updatedData = { ...contactData, customContacts: updatedList };
      setContactData(updatedData);
      saveMutation.mutate(updatedData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Contact Management & Multiple Contacts</h2>
            <p className="text-sm text-muted-foreground">
              মূল যোগাযোগ তথ্য ও অতিরিক্ত অনলিমিটেড কাস্টম কন্টাক্ট/ব্রাঞ্চ পরিচালনা করুন
            </p>
          </div>
        </div>

        <Button onClick={handleSaveMainContact} disabled={saveMutation.isPending} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
          <Save className="w-4 h-4" />
          মূল কন্টাক্ট পরিবর্তন সেভ করুন
        </Button>
      </div>

      {/* Main Core Contacts Card */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-500" />
            প্রধান কন্টাক্ট ইনফরমেশন (Primary Contacts)
          </CardTitle>
          <CardDescription>কন্টাক্ট পেজের মেইন হেডলাইন ও প্রাইমারি যোগাযোগের তথ্য</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>পেজ শিরোনাম (বাংলা)</Label>
              <Input
                value={contactData.heroTitleBn}
                onChange={(e) => setContactData({ ...contactData, heroTitleBn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Page Title (English)</Label>
              <Input
                value={contactData.heroTitleEn}
                onChange={(e) => setContactData({ ...contactData, heroTitleEn: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>প্রধান ঠিকানা (বাংলা)</Label>
              <Input
                value={contactData.mainAddressBn}
                onChange={(e) => setContactData({ ...contactData, mainAddressBn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Main Address (English)</Label>
              <Input
                value={contactData.mainAddressEn}
                onChange={(e) => setContactData({ ...contactData, mainAddressEn: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>ফোন নম্বর</Label>
              <Input
                value={contactData.mainPhoneBn}
                onChange={(e) => setContactData({ ...contactData, mainPhoneBn: e.target.value, mainPhoneEn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>ইমেইল এড্রেস</Label>
              <Input
                value={contactData.mainEmailBn}
                onChange={(e) => setContactData({ ...contactData, mainEmailBn: e.target.value, mainEmailEn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>হোয়াটসঅ্যাপ নম্বর</Label>
              <Input
                value={contactData.whatsappBn}
                onChange={(e) => setContactData({ ...contactData, whatsappBn: e.target.value, whatsappEn: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>কর্মঘণ্টা (বাংলা)</Label>
              <Input
                value={contactData.businessHoursBn}
                onChange={(e) => setContactData({ ...contactData, businessHoursBn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Business Hours (English)</Label>
              <Input
                value={contactData.businessHoursEn}
                onChange={(e) => setContactData({ ...contactData, businessHoursEn: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Multiple Custom Contacts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-500" />
              অতিরিক্ত কন্টাক্ট ও ব্রাঞ্চসমূহ (Multiple Custom Contacts)
            </h3>
            <p className="text-xs text-muted-foreground">অন্যান্য শাখা অফিস, হেল্পলাইন, আলাদা মোবাইল বা ইমেইল যোগ করুন</p>
          </div>
          <Button size="sm" onClick={handleOpenAddCustom} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> নতুন কন্টাক্ট আইটেম যোগ করুন
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(contactData.customContacts || []).map((item) => (
            <Card key={item.id} className="border border-border/50 hover:border-emerald-500/40 transition-all shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 border-emerald-500/30">
                    {item.type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpenEditCustom(item)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteCustomItem(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm">{item.titleBn}</h4>
                  <p className="text-xs text-muted-foreground font-mono">{item.valueBn}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit / Add Custom Contact Dialog */}
      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" />
              {editingCustomItem ? "কাস্টম কন্টাক্ট এডিট করুন" : "নতুন কাস্টম কন্টাক্ট যোগ করুন"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>কন্টাক্ট টাইপ</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={customItemForm.type}
                onChange={(e: any) => setCustomItemForm({ ...customItemForm, type: e.target.value })}
              >
                <option value="phone">📞 ফোন নম্বর / হেল্পলাইন</option>
                <option value="email">✉️ ইমেইল এড্রেস</option>
                <option value="branch">🏢 শাখা অফিস (Branch)</option>
                <option value="address">📍 ঠিকানা</option>
                <option value="whatsapp">💬 হোয়াটসঅ্যাপ</option>
                <option value="social">🌐 সোশ্যাল লিংক</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>শিরোনাম (বাংলা)</Label>
              <Input
                value={customItemForm.titleBn}
                onChange={(e) => setCustomItemForm({ ...customItemForm, titleBn: e.target.value })}
                placeholder="e.g. চট্টগ্রাম শাখা অফিস বা সেলস হেল্পলাইন"
              />
            </div>

            <div className="space-y-2">
              <Label>Title (English)</Label>
              <Input
                value={customItemForm.titleEn}
                onChange={(e) => setCustomItemForm({ ...customItemForm, titleEn: e.target.value })}
                placeholder="e.g. Chittagong Branch or Sales Support"
              />
            </div>

            <div className="space-y-2">
              <Label>ভ্যালু / নম্বর / এড্রেস (বাংলা)</Label>
              <Input
                value={customItemForm.valueBn}
                onChange={(e) => setCustomItemForm({ ...customItemForm, valueBn: e.target.value })}
                placeholder="e.g. জিইসি মোড়, চট্টগ্রাম বা +8801800000000"
              />
            </div>

            <div className="space-y-2">
              <Label>Value / Number / Address (English)</Label>
              <Input
                value={customItemForm.valueEn}
                onChange={(e) => setCustomItemForm({ ...customItemForm, valueEn: e.target.value })}
                placeholder="e.g. GEC Circle, Chittagong or +8801800000000"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>বাতিল</Button>
            <Button onClick={handleSaveCustomItem} disabled={saveMutation.isPending} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4" /> সেভ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
