export type AppRole = 'admin' | 'student' | 'teacher';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  pass_code: string | null;
  is_active: boolean;
  is_teacher: boolean;
  teacher_approved: boolean;
  linked_team_member_id: string | null;
  phone_number: string | null;
  bio: string | null;
  skills: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Course {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  price: number;
  category?: string | null;
  trainer_name?: string | null;
  trainer_image?: string | null;
  trainer_designation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  course_id: string;
  title: string;
  video_url: string;
  video_type: string;
  duration_seconds: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface VideoProgress {
  id: string;
  user_id: string;
  video_id: string;
  progress_percent: number;
  is_completed: boolean;
  last_watched_at: string;
  watched_seconds?: number;
  last_position?: number;
}

export interface CourseCompletion {
  id: string;
  user_id: string;
  course_id: string;
  completed_at: string;
  certificate_id: string;
}

export interface Certificate {
  id: string;
  certificate_id: string;
  user_id: string;
  course_id: string;
  student_name: string;
  course_name: string;
  issued_at: string;
}

// Extended types with relations
export interface CourseWithVideos extends Course {
  videos: Video[];
}
export interface VideoWithProgress extends Video {
  progress?: VideoProgress;
  is_locked: boolean;
}

export interface CourseWithProgress extends Course {
  videos: VideoWithProgress[];
  total_videos: number;
  completed_videos: number;
  progress_percent: number;
  is_completed: boolean;
}

export interface VideoMaterial {
  id: string;
  video_id: string;
  title: string;
  material_type: 'pdf' | 'doc' | 'note';
  material_url: string | null;
  note_content: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface VideoWithMaterials extends Video {
  materials: VideoMaterial[];
}
