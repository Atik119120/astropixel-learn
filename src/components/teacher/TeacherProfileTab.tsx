import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Edit, Save, Camera, Plus, X, KeyRound, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/integrations/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TeacherProfileTabProps {
  language: 'en' | 'bn';
}

const translations = {
  en: {
    title: 'My Profile',
    subtitle: 'Manage your profile information',
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone Number',
    bio: 'Bio',
    bioPlaceholder: 'Tell students about yourself...',
    skills: 'Skills',
    addSkill: 'Add skill',
    save: 'Save Changes',
    saving: 'Saving...',
    changePhoto: 'Change Photo',
    profileUpdated: 'Profile updated successfully',
    updateError: 'Failed to update profile',
    linkedTeamProfile: 'Your profile is linked to the Team page',
    loading: 'Loading...',
    roleTitle: 'Title / Role',
    rolePlaceholder: 'e.g. Founder, Vibe Coding Expert',
  },
  bn: {
    title: 'আমার প্রোফাইল',
    subtitle: 'আপনার প্রোফাইল তথ্য ম্যানেজ করুন',
    fullName: 'পূর্ণ নাম',
    email: 'ইমেইল',
    phone: 'ফোন নম্বর',
    bio: 'বায়ো',
    bioPlaceholder: 'শিক্ষার্থীদের নিজের সম্পর্কে বলুন...',
    skills: 'দক্ষতা',
    addSkill: 'দক্ষতা যোগ করুন',
    save: 'পরিবর্তন সেভ করুন',
    saving: 'সেভ হচ্ছে...',
    changePhoto: 'ছবি পরিবর্তন',
    profileUpdated: 'প্রোফাইল আপডেট হয়েছে',
    updateError: 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে',
    linkedTeamProfile: 'আপনার প্রোফাইল টিম পেজের সাথে লিংক করা আছে',
    loading: 'লোড হচ্ছে...',
    roleTitle: 'টাইটেল / পদবি',
    rolePlaceholder: 'যেমন: Founder, Vibe Coding Expert',
  },
};

export default function TeacherProfileTab({ language }: TeacherProfileTabProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const t = translations[language];

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    bio: '',
    skills: [] as string[],
    role_title: '',
  });
  const [linkedTeamMemberId, setLinkedTeamMemberId] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (profile) {
      loadProfileData();
    }
  }, [profile]);

  const loadProfileData = async () => {
    if (!profile) return;

    try {
      const profileDoc = await getDoc(doc(db, 'profiles', user?.uid as string));
      const data = profileDoc.exists() ? profileDoc.data() : null;
      if (!data) return;

      let roleTitle = '';
      if (data.linked_team_member_id) {
        const tmDoc = await getDoc(doc(db, 'team_members', data.linked_team_member_id));
        roleTitle = tmDoc.exists() ? (tmDoc.data().role || '') : '';
      }

      setLinkedTeamMemberId(data.linked_team_member_id || null);
      setFormData({
        full_name: data.full_name || '',
        phone_number: data.phone_number || '',
        bio: data.bio || '',
        skills: data.skills || [],
        role_title: roleTitle,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);

      await setDoc(doc(db, 'profiles', user?.uid as string), {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        bio: formData.bio,
        skills: formData.skills,
      }, { merge: true });

      // If linked to team member, sync name/bio/role/image
      if (linkedTeamMemberId) {
        await setDoc(doc(db, 'team_members', linkedTeamMemberId), {
          name: formData.full_name,
          bio: formData.bio,
          role: formData.role_title,
          image_url: profile.avatar_url || null,
        }, { merge: true });
      }

      toast({ title: t.profileUpdated });
      setIsEditing(false);
      await refreshProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: t.updateError, description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skillToRemove),
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${user.uid}/${Date.now()}.${fileExt}`;
      
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const publicUrl = await getDownloadURL(storageRef);

      await setDoc(doc(db, 'profiles', user.uid), {
        avatar_url: publicUrl
      }, { merge: true });

      // Sync photo to linked team member card (Instructor profile)
      if (linkedTeamMemberId) {
        await setDoc(doc(db, 'team_members', linkedTeamMemberId), {
          image_url: publicUrl
        }, { merge: true });
      }

      await refreshProfile();
      toast({ title: language === 'bn' ? 'ছবি আপলোড হয়েছে' : 'Photo uploaded' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({ title: t.updateError, description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? t.saving : t.save}
        </Button>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-2xl">
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4 text-primary-foreground" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile.full_name}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              <Badge className="mt-2">{language === 'bn' ? 'টিচার' : 'Teacher'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{language === 'bn' ? 'প্রোফাইল তথ্য' : 'Profile Information'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.fullName}</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              
            />
          </div>

          {linkedTeamMemberId && (
            <div className="space-y-2">
              <Label>{t.roleTitle}</Label>
              <Input
                value={formData.role_title}
                onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                
                placeholder={t.rolePlaceholder}
              />
              <p className="text-xs text-muted-foreground">{t.linkedTeamProfile}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t.email}</Label>
            <Input
              value={profile.email}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>{t.phone}</Label>
            <Input
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              
              placeholder="+880"
            />
          </div>

          <div className="space-y-2">
            <Label>{t.bio}</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              
              placeholder={t.bioPlaceholder}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.skills}</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  {true && (
                    <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {true && (
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder={t.addSkill}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AccountSecurityCard language={language} currentEmail={profile.email} />
    </motion.div>
  );
}

function AccountSecurityCard({ language, currentEmail }: { language: 'en' | 'bn'; currentEmail: string }) {
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const T = language === 'bn'
    ? {
        title: 'অ্যাকাউন্ট সিকিউরিটি',
        emailLabel: 'নতুন ইমেইল',
        emailDesc: 'কনফার্ম লিংক পাঠানো হবে বর্তমান ও নতুন ইমেইলে',
        changeEmail: 'ইমেইল পরিবর্তন',
        newPass: 'নতুন পাসওয়ার্ড',
        confirmPass: 'পাসওয়ার্ড কনফার্ম',
        changePass: 'পাসওয়ার্ড পরিবর্তন',
        emailUpdated: 'ইমেইল আপডেট রিকোয়েস্ট পাঠানো হয়েছে — ইনবক্স চেক করুন',
        passUpdated: 'পাসওয়ার্ড পরিবর্তন হয়েছে',
        mismatch: 'পাসওয়ার্ড মিলছে না',
        tooShort: 'পাসওয়ার্ড অন্তত ৬ অক্ষর হতে হবে',
        error: 'কাজ সম্পন্ন হয়নি',
      }
    : {
        title: 'Account Security',
        emailLabel: 'New Email',
        emailDesc: 'Confirmation link will be sent to both old and new email',
        changeEmail: 'Change Email',
        newPass: 'New Password',
        confirmPass: 'Confirm Password',
        changePass: 'Change Password',
        emailUpdated: 'Email update requested — check your inbox',
        passUpdated: 'Password changed successfully',
        mismatch: 'Passwords do not match',
        tooShort: 'Password must be at least 6 characters',
        error: 'Action failed',
      };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || newEmail === currentEmail) return;
    try {
      setSavingEmail(true);
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast({ title: T.emailUpdated });
      setNewEmail('');
    } catch (e: any) {
      toast({ title: T.error, description: e.message, variant: 'destructive' });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: T.tooShort, variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: T.mismatch, variant: 'destructive' });
      return;
    }
    try {
      setSavingPass(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: T.passUpdated });
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast({ title: T.error, description: e.message, variant: 'destructive' });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          {T.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><AtSign className="w-3.5 h-3.5" />{T.emailLabel}</Label>
          <p className="text-xs text-muted-foreground">{T.emailDesc}</p>
          <div className="flex gap-2">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={currentEmail}
            />
            <Button onClick={handleChangeEmail} disabled={savingEmail || !newEmail.trim()}>
              {T.changeEmail}
            </Button>
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <Label className="flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" />{T.newPass}</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••"
          />
          <Label className="flex items-center gap-1.5 mt-2">{T.confirmPass}</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••"
          />
          <Button onClick={handleChangePassword} disabled={savingPass || !newPassword} className="mt-2">
            {T.changePass}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
