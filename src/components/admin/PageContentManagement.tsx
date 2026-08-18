import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Home, Info, Phone, Plus, Save, Loader2, Trash2, Pencil, Briefcase, Users, Wrench, Globe, Languages, Search, X, CheckCircle2, HelpCircle, Tag, DollarSign, UserPlus, BookOpen, Eye, EyeOff } from "lucide-react";
import AdminSiteScopeSwitcher from "@/components/admin/AdminSiteScopeSwitcher";

interface PageContent {
  id: string;
  page_name: string;
  content_key: string;
  content_en: string | null;
}


// Human-readable labels and descriptions for content keys
const CONTENT_KEY_INFO: Record<string, Record<string, { label: string; labelEn: string; description: string }>> = {
  home: {
    'hero.title': { label: '🏠 Hero Title', labelEn: 'Hero Title', description: 'Home page\'s main top title' },
    'hero.subtitle': { label: '🔖 Hero Subtitle', labelEn: 'Hero Subtitle', description: 'Small tagline above the title' },
    'hero.description': { label: '📝 Hero Description', labelEn: 'Hero Description', description: 'Paragraph text for the hero section' },
    'hero.tagline': { label: '⚡ Tagline', labelEn: 'Tagline', description: 'Short brand tagline' },
    'hero.cta1': { label: '🔗 Primary Button', labelEn: 'Primary CTA', description: 'Text for the hero\'s first button' },
    'hero.cta2': { label: '🔗 Secondary Button', labelEn: 'Secondary CTA', description: 'Text for the hero\'s second button' },
    'services.title': { label: '🛠️ Service Title', labelEn: 'Services Section Title', description: 'Heading for the home page service section' },
    'services.subtitle': { label: '🛠️ Service Subtitle', labelEn: 'Services Subtitle', description: 'Short description for the service section' },
    'stats.projects': { label: '📊 Project Count', labelEn: 'Projects Count', description: 'Number of projects (e.g., 50+)' },
    'stats.projects_label': { label: '📊 Project Label', labelEn: 'Projects Label', description: 'Text below project count' },
    'stats.clients': { label: '👥 Client Count', labelEn: 'Clients Count', description: 'Number of clients (e.g., 30+)' },
    'stats.clients_label': { label: '👥 Client Label', labelEn: 'Clients Label', description: 'Text below client count' },
    'stats.years': { label: '📅 Years Count', labelEn: 'Years Count', description: 'Years of experience (e.g., 3+)' },
    'stats.years_label': { label: '📅 Years Label', labelEn: 'Years Label', description: 'Text below years count' },
    'stats.satisfaction': { label: '✅ Satisfaction %', labelEn: 'Satisfaction %', description: 'Client satisfaction (e.g., 100%)' },
    'stats.satisfaction_label': { label: '✅ Satisfaction Label', labelEn: 'Satisfaction Label', description: 'Text below satisfaction percentage' },
    'why.title': { label: '❓ Why Us Title', labelEn: 'Why Choose Us Title', description: 'Heading for the \'Why choose us\' section' },
    'testimonials.title': { label: '💬 Testimonial Title', labelEn: 'Testimonials Title', description: 'Heading for the review section' },
    'cta.title': { label: '📢 CTA Title', labelEn: 'CTA Title', description: 'Title for the page\'s bottom CTA section' },
    'cta.description': { label: '📢 CTA Description', labelEn: 'CTA Description', description: 'Details for the CTA section' },
    'cta.button': { label: '📢 CTA Button', labelEn: 'CTA Button Text', description: 'Text for the CTA button' },
  },
  about: {
    'hero.title': { label: '🏢 Hero Title', labelEn: 'Hero Title', description: 'About page\'s main title' },
    'hero.subtitle': { label: '🔖 Subtitle', labelEn: 'Subtitle', description: 'Small tag above the title' },
    'hero.description': { label: '📝 Description', labelEn: 'Description', description: 'Paragraph for the hero section' },
    'story.title': { label: '📖 Story Title', labelEn: 'Story Title', description: 'Heading for the \'Our Story\' section' },
    'story.description': { label: '📖 Story Description', labelEn: 'Story Description', description: 'Details for the story section' },
    'story.content': { label: '📖 Story Content', labelEn: 'Story Content', description: 'Main text of the story' },
    'values.title': { label: '💎 Value Title', labelEn: 'Values Title', description: 'Heading for the Core Values section' },
    'values.creativity': { label: '🎨 Creativity', labelEn: 'Creativity Value', description: 'Title for the Creativity value card' },
    'values.creativity_desc': { label: '🎨 Creativity Description', labelEn: 'Creativity Desc', description: 'Details for creativity' },
    'values.quality': { label: '⭐ Quality', labelEn: 'Quality Value', description: 'Quality value card' },
    'values.quality_desc': { label: '⭐ Quality description', labelEn: 'Quality Desc', description: 'Quality details' },
    'values.integrity': { label: '🛡️ Integrity', labelEn: 'Integrity Value', description: 'Integrity value card' },
    'values.integrity_desc': { label: '🛡️ Integrity description', labelEn: 'Integrity Desc', description: 'Integrity details' },
    'location.title': { label: '📍 Location title', labelEn: 'Location Title', description: 'Location section heading' },
    'location.description': { label: '📍 Location description', labelEn: 'Location Description', description: 'Address details below' },
    'cta.title': { label: '📢 CTA Title', labelEn: 'CTA Title', description: 'Title for the CTA section below' },
    'cta.button': { label: '📢 CTA Button', labelEn: 'CTA Button', description: 'Text for the CTA button' },
  },
  contact: {
    'hero.title': { label: '📞 Hero title', labelEn: 'Hero Title', description: 'Contact page main title' },
    'hero.subtitle': { label: '🔖 Subtitle', labelEn: 'Subtitle', description: 'Small tag above the title' },
    'hero.description': { label: '📝 Description', labelEn: 'Description', description: 'Paragraph for the hero section' },
    'info.phone': { label: '📱 Phone number', labelEn: 'Phone Number', description: 'Contact phone number' },
    'info.phone_label': { label: '📱 Phone label', labelEn: 'Phone Label', description: '\'Phone\' text' },
    'info.email': { label: '✉️ Email', labelEn: 'Email', description: 'Contact email address' },
    'info.email_label': { label: '✉️ Email label', labelEn: 'Email Label', description: '\'Email\' text' },
    'info.address': { label: '🏠 Address', labelEn: 'Address', description: 'Office address' },
    'info.address_label': { label: '🏠 Address label', labelEn: 'Address Label', description: '\'Address\' text' },
    'info.hours': { label: '🕐 Business hours', labelEn: 'Working Hours', description: 'Office working hours' },
    'info.hours_label': { label: '🕐 Business hours label', labelEn: 'Hours Label', description: '\'Business hours\' text' },
    'info.whatsapp': { label: '💬 WhatsApp link', labelEn: 'WhatsApp Link', description: 'WhatsApp number/link' },
    'info.whatsapp_display': { label: '💬 WhatsApp displayed number', labelEn: 'WhatsApp Display', description: 'Number displayed on WhatsApp button' },
    'form.title': { label: '📋 Form title', labelEn: 'Form Title', description: 'Contact form heading' },
    'form.name': { label: '📋 Name field', labelEn: 'Name Field', description: 'Name input label' },
    'form.email': { label: '📋 Email field', labelEn: 'Email Field', description: 'Email input label' },
    'form.subject': { label: '📋 Subject field', labelEn: 'Subject Field', description: 'Subject input label' },
    'form.message': { label: '📋 Message field', labelEn: 'Message Field', description: 'Message input label' },
    'form.submit': { label: '📋 Submit button', labelEn: 'Submit Button', description: 'Form submit button text' },
    'quick.email_btn': { label: '⚡ Email button', labelEn: 'Quick Email Btn', description: 'Quick email button text' },
    'quick.whatsapp_btn': { label: '⚡ WhatsApp button', labelEn: 'Quick WhatsApp Btn', description: 'Quick WhatsApp button text' },
  },
  services: {
    'hero.title': { label: '🛠️ Hero title', labelEn: 'Hero Title', description: 'Services page main title' },
    'hero.subtitle': { label: '🔖 Subtitle', labelEn: 'Subtitle', description: 'Small tag above the title' },
    'hero.description': { label: '📝 Description', labelEn: 'Description', description: 'Paragraph for the hero section' },
    'process.title': { label: '🔄 Process title', labelEn: 'Process Title', description: '\'How we work\' section heading' },
    'cta.title': { label: '📢 CTA Title', labelEn: 'CTA Title', description: 'Title for the CTA section below' },
    'cta.button': { label: '📢 CTA Button', labelEn: 'CTA Button', description: 'Text for the CTA button' },
  },
  work: {
    'hero.subtitle': { label: '🔖 Hero Badge (top small text)', labelEn: 'Hero Badge', description: 'Small uppercase badge above title (e.g., Creative Portfolio)' },
    'hero.title': { label: '💼 Hero Title', labelEn: 'Hero Title', description: 'Main hero title. Wrap the highlighted words with | | (e.g., Our Creative |Works & Projects|)' },
    'hero.description': { label: '📝 Hero Description', labelEn: 'Hero Description', description: 'Paragraph text under the hero title' },
    'hero.badge': { label: '🏷️ Hero Bottom Chip', labelEn: 'Hero Bottom Chip', description: 'Text after project count (e.g., Projects • Graphic Design • Web • Video)' },
    'web.title': { label: '🌐 Web title', labelEn: 'Web Section Title', description: 'Web category heading' },
    'graphics.title': { label: '🎨 Graphics title', labelEn: 'Graphics Section Title', description: 'Graphics category heading' },
    'video.title': { label: '🎬 Video Title', labelEn: 'Video Section Title', description: 'Video category heading' },
    'cta.title': { label: '📢 CTA Title', labelEn: 'CTA Title', description: 'Title for the CTA section below' },
    'cta.button': { label: '📢 CTA Button', labelEn: 'CTA Button', description: 'Text for the CTA button' },
  },
  team: {
    'hero.title': { label: '👥 Hero Title', labelEn: 'Hero Title', description: 'Team page main title' },
    'hero.subtitle': { label: '🔖 Subtitle', labelEn: 'Subtitle', description: 'Small tag above the title' },
    'hero.description': { label: '📝 Description', labelEn: 'Description', description: 'Paragraph for the hero section' },
    'join.title': { label: '🤝 Join Title', labelEn: 'Join Section Title', description: 'Join us section heading' },
    'join.description': { label: '🤝 Join description', labelEn: 'Join Description', description: 'Join section details' },
    'join.cta1': { label: '🔗 Join Button 1', labelEn: 'Join CTA 1', description: 'First CTA button text' },
    'join.cta2': { label: '🔗 Join Button 2', labelEn: 'Join CTA 2', description: 'Second CTA button text' },
  },
  pricing: {
    'hero.title': { label: '💰 Hero Title', labelEn: 'Hero Title', description: 'Pricing page main title' },
    'hero.subtitle': { label: '🔖 Subtitle', labelEn: 'Subtitle', description: 'Small tag above the title' },
    'hero.description': { label: '📝 Description', labelEn: 'Description', description: 'Paragraph for the hero section' },
  },
  courses: {
    'hero.title': { label: '📚 Hero Title', labelEn: 'Hero Title', description: 'Courses page main title' },
    'hero.subtitle': { label: '🔖 Subtitle', labelEn: 'Subtitle', description: 'Small tag above the title' },
    'hero.description': { label: '📝 Description', labelEn: 'Description', description: 'Paragraph for the hero section' },
  },
  'join-team': {
    'hero.title': { label: '🤝 Hero Title', labelEn: 'Hero Title', description: 'Join Team page main title' },
    'hero.subtitle': { label: '🔖 Subtitle', labelEn: 'Subtitle', description: 'Small tag above the title' },
    'hero.description': { label: '📝 Description', labelEn: 'Description', description: 'Paragraph for the hero section' },
  },
};

const PAGES = [
  { id: 'home', label: 'Home', labelEn: 'Home', icon: Home, color: 'from-sky-500 to-blue-600', description: 'All text for homepage' },
  { id: 'about', label: 'About', labelEn: 'About', icon: Info, color: 'from-violet-500 to-purple-600', description: 'About Us page' },
  { id: 'contact', label: 'Contact', labelEn: 'Contact', icon: Phone, color: 'from-emerald-500 to-teal-600', description: 'Contact info & form' },
  { id: 'services', label: 'Services', labelEn: 'Services', icon: Wrench, color: 'from-amber-500 to-orange-600', description: 'Our Services page' },
  { id: 'work', label: 'Work', labelEn: 'Work', icon: Briefcase, color: 'from-rose-500 to-pink-600', description: 'Portfolio page' },
  { id: 'team', label: 'Team', labelEn: 'Team', icon: Users, color: 'from-cyan-500 to-sky-600', description: 'Our Team page' },
  { id: 'pricing', label: 'Pricing', labelEn: 'Pricing', icon: DollarSign, color: 'from-green-500 to-emerald-600', description: 'Pricing page' },
  { id: 'courses', label: 'Course', labelEn: 'Courses', icon: BookOpen, color: 'from-indigo-500 to-blue-600', description: 'Course List page' },
  { id: 'join-team', label: 'Join Team', labelEn: 'Join Team', icon: UserPlus, color: 'from-fuchsia-500 to-pink-600', description: 'Join Team page' },
];

const PageContentManagement = ({ lockedPage }: { lockedPage?: string } = {}) => {
  const queryClient = useQueryClient();
  const scope = "learn";
  const [selectedPage, setSelectedPage] = useState(lockedPage ?? "home");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [formData, setFormData] = useState({
    content_key: '',
    content_en: ''
  });
  const [editData, setEditData] = useState<Record<string, { content_en: string }>>({});


  const { data: contents, isLoading } = useQuery({
    queryKey: ['page-content', scope],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('site_scope', scope)
        .order('page_name')
        .order('content_key');
      if (error) throw error;
      return data as PageContent[];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (data: Omit<PageContent, 'id'>) => {
      const { error } = await supabase.from('page_content').insert([{ ...data, site_scope: scope }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-content'] });
      toast.success('New content added!');
      setIsAddDialogOpen(false);
      setFormData({ content_key: '', content_en: '' });
    },
    onError: () => toast.error('Failed to add content')
  });


  const updateMutation = useMutation({
    mutationFn: async ({ id, content_en }: { id: string; content_en: string | null }) => {
      const { error } = await supabase.from('page_content').update({ content_en }).eq('id', id);
      if (error) throw error;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-content'] });
      toast.success('Content updated!');
      setEditingId(null);
    },
    onError: () => toast.error('Failed to update')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('page_content').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-content'] });
      toast.success('Content deleted!');
    },
    onError: () => toast.error('Failed to delete')
  });

  const handleAdd = () => {
    if (!formData.content_key.trim()) {
      toast.error('Enter Content Key');
      return;
    }
    addMutation.mutate({
      page_name: selectedPage,
      content_key: formData.content_key,
      content_en: formData.content_en || null
    });
  };

  const startEdit = (content: PageContent) => {
    setEditingId(content.id);
    setEditData(prev => ({
      ...prev,
      [content.id]: {
        content_en: content.content_en || ''
      }
    }));
  };

  const saveEdit = (id: string) => {
    const data = editData[id];
    if (!data) return;
    updateMutation.mutate({
      id,
      content_en: data.content_en || null
    });
  };


  const selectedPageInfo = PAGES.find(p => p.id === selectedPage);
  const pageKeyInfo = CONTENT_KEY_INFO[selectedPage] || {};

  const getKeyInfo = (key: string) => {
    return pageKeyInfo[key] || { label: key, labelEn: key, description: '' };
  };

  const filteredContents = (contents || []).filter(c => {
    if (c.page_name !== selectedPage) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const info = getKeyInfo(c.content_key);
    return (
      c.content_key.toLowerCase().includes(q) ||
      info.label.toLowerCase().includes(q) ||
      (c.content_en || '').toLowerCase().includes(q)
    );

  });

  // Group by section prefix
  const grouped = filteredContents.reduce((acc, c) => {
    const section = c.content_key.split('.')[0] || 'general';
    if (!acc[section]) acc[section] = [];
    acc[section].push(c);
    return acc;
  }, {} as Record<string, PageContent[]>);

  const sectionLabels: Record<string, string> = {
    hero: '🎯 Hero Section',
    services: '🛠️ Service Section',
    stats: '📊 Statistics',
    why: '❓ Why Us',
    testimonials: '💬 Reviews',
    cta: '📢 CTA (Call to Action)',
    story: '📖 Our Story',
    values: '💎 Values',
    location: '📍 Location',
    info: '📋 Information',
    form: '📝 Form Fields',
    quick: '⚡ Quick Actions',
    join: '🤝 Join Section',
    process: '🔄 Process',
    web: '🌐 Web',
    graphics: '🎨 Graphics',
    video: '🎬 Video',
    general: '📄 General',
  };

  const totalForPage = (contents || []).filter(c => c.page_name === selectedPage).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedPageInfo?.color || 'from-primary to-primary'} flex items-center justify-center`}>
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Page Content</h2>
            <p className="text-sm text-muted-foreground">
              {scope === 'learn' ? 'Learn Site' : 'Agency Site'} — Change each page's text from here
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AdminSiteScopeSwitcher />

          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 text-xs"
            onClick={() => setShowDescriptions(!showDescriptions)}
          >
            {showDescriptions ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showDescriptions ? 'Hide description' : 'Show description'}
          </Button>
        </div>
      </div>


      {/* How it works info */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary">How does it work?</h3>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Select any page from below, then you'll see the text of that page</p>
          <p>• Next to each item <strong>Where it shows</strong> is written — so you'll understand what's what</p>
          <p>• Click the ✏️ button to edit both English and Bengali</p>
          <p>• Saving will instantly change it on the website ⚡</p>
        </div>
      </div>

      {/* Page Selector Cards */}
      {!lockedPage && (
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {PAGES.map(page => {
          const count = (contents || []).filter(c => c.page_name === page.id).length;
          const Icon = page.icon;
          const isActive = selectedPage === page.id;
          return (
            <button
              key={page.id}
              onClick={() => { setSelectedPage(page.id); setSearchQuery(''); }}
              className={`relative p-3 rounded-xl text-center transition-all duration-200 border ${
                isActive
                  ? 'border-primary/50 bg-primary/5 shadow-sm'
                  : 'border-border/50 hover:border-primary/30 hover:bg-muted/50'
              }`}
            >
              <div className={`w-8 h-8 mx-auto mb-1.5 rounded-lg flex items-center justify-center ${
                isActive ? `bg-gradient-to-br ${page.color} text-white` : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {page.labelEn}
              </p>
              {count > 0 && (
                <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
                  {count}
                </Badge>
              )}
              {count === 0 && (
                <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 text-orange-500 border-orange-500/30">
                  Empty
                </Badge>
              )}
            </button>
          );
        })}
      </div>
      )}


      {/* Selected page description */}
      {selectedPageInfo && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2.5 rounded-lg">
          <Tag className="w-4 h-4 text-primary" />
          <span>{selectedPageInfo.description}</span>
          <span className="text-xs">•</span>
          <span className="text-xs">{totalForPage} Item</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search on ${selectedPageInfo?.label} page...`}
          className="pl-9 h-9"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className='absolute right-3 top-1/2 -translate-y-1/2'>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Content Cards grouped by section */}
      {filteredContents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="space-y-3">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/30" />
              {searchQuery ? (
                <p>No results found</p>
              ) : (
                <div>
                  <p className="font-medium">This page has no content yet</p>
                  <p className="text-xs mt-1">Click the "New" button above to add new content</p>
                  <p className="text-xs mt-1 text-primary">Or ask AI Assistant to create content for this page!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([section, items]) => (
          <div key={section} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <h3 className="text-sm font-semibold">
                {sectionLabels[section] || `📄 ${section}`}
              </h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(content => {
                const isEditing = editingId === content.id;
                const ed = editData[content.id];
                const keyInfo = getKeyInfo(content.content_key);
                return (
                  <Card key={content.id} className={`transition-all ${isEditing ? 'ring-2 ring-primary/30' : 'hover:border-primary/20'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{keyInfo.label}</span>
                            <code className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {content.content_key}
                            </code>
                          </div>
                          {showDescriptions && keyInfo.description && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              📍 {keyInfo.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                          {isEditing ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2 text-xs">
                                Cancel
                              </Button>
                              <Button size="sm" onClick={() => saveEdit(content.id)} disabled={updateMutation.isPending} className="h-7 px-2 text-xs gap-1">
                                {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                Save
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(content)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(content.id); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {isEditing && ed ? (
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1 text-muted-foreground"><Globe className="w-3 h-3" /> English</Label>
                          <Textarea
                            value={ed.content_en}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              [content.id]: { ...prev[content.id], content_en: e.target.value }
                            }))}
                            rows={3}
                            className="text-sm"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                            <Globe className="w-3 h-3" /> English
                          </p>
                          <p className="text-sm bg-muted/40 p-2.5 rounded-lg min-h-[44px] leading-relaxed">
                            {content.content_en || <span className="text-muted-foreground italic text-xs">Empty</span>}
                          </p>
                        </div>
                      )}

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PageContentManagement;
