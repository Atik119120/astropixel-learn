import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/integrations/firebase/config';
import { toast } from 'sonner';
import { Camera, Loader2, User } from 'lucide-react';
import { Profile } from '@/types/lms';

import { useAuth } from '@/contexts/AuthContext';

interface ProfilePhotoUploadProps {
  profile: Profile;
  onPhotoUpdated: (newUrl: string) => void;
}

export default function ProfilePhotoUpload({ profile, onPhotoUpdated }: ProfilePhotoUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${user?.uid}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const publicUrl = await getDownloadURL(storageRef);

      // Update profile
      await setDoc(doc(db, 'profiles', user?.uid as string), {
        avatar_url: publicUrl
      }, { merge: true });

      onPhotoUpdated(publicUrl);
      toast.success('Profile photo updated!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="w-28 h-28 border-4 border-primary/20">
          <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name} />
          <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-purple-600 text-white">
            {profile.full_name?.charAt(0) || <User className="w-10 h-10" />}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            Change Photo
          </>
        )}
      </Button>
    </div>
  );
}
