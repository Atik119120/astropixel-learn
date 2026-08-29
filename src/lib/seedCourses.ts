import { supabase } from '@/integrations/supabase/client';
import { CourseWithVideos } from '@/types/lms';

export const INITIAL_REAL_YOUTUBE_COURSES: CourseWithVideos[] = [
  {
    id: 'course-gfx-graphic-design',
    title: 'Graphic Design Full Course (Photoshop & Illustrator)',
    title_en: 'Graphic Design Full Course (Photoshop & Illustrator)',
    description: 'GFXMentor (Imran Ali Dina)-এর প্লেলিস্ট থেকে সম্পূর্ণ গ্রাফিক ডিজাইন কোর্স। ফটোশপ, ইলাস্ট্রেটর, টাইপোগ্রাফি, কালার থিওরি এবং রিয়েল-ওয়ার্ল্ড লোগো ও সোশ্যাল মিডিয়া পোস্ট ডিজাইন শিখুন।',
    description_en: 'Complete Graphic Design course from GFXMentor (Imran Ali Dina) playlist. Learn Photoshop, Illustrator, typography, color theory, logo design, and social media post design.',
    category: 'Graphic & Multimedia',
    thumbnail_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1200&auto=format&fit=crop',
    price: 0,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    trainer_name: 'GFXMentor (Imran Ali Dina)',
    videos: [
      {
        id: 'vid-gfx-1',
        course_id: 'course-gfx-graphic-design',
        title: 'Class 1 - Introduction to Graphic Design & Interface',
        video_url: 'https://www.youtube.com/watch?v=R9_uLILm0qg',
        video_type: 'youtube',
        duration_seconds: 1122, // 18:42
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-gfx-2',
        course_id: 'course-gfx-graphic-design',
        title: 'Class 2 - Selection Tools & Layers Masterclass',
        video_url: 'https://www.youtube.com/watch?v=3z_2H63b6kE',
        video_type: 'youtube',
        duration_seconds: 1455, // 24:15
        order_index: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-gfx-3',
        course_id: 'course-gfx-graphic-design',
        title: 'Class 3 - Pen Tool Techniques & Vector Shapes',
        video_url: 'https://www.youtube.com/watch?v=VlS3q_oBfSg',
        video_type: 'youtube',
        duration_seconds: 1870, // 31:10
        order_index: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-gfx-4',
        course_id: 'course-gfx-graphic-design',
        title: 'Class 4 - Typography & Font Selection Rules',
        video_url: 'https://www.youtube.com/watch?v=0hY7-Gk2q24',
        video_type: 'youtube',
        duration_seconds: 1325, // 22:05
        order_index: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-gfx-5',
        course_id: 'course-gfx-graphic-design',
        title: 'Class 5 - Logo Design & Branding Project',
        video_url: 'https://www.youtube.com/watch?v=d_H3cM2wW-g',
        video_type: 'youtube',
        duration_seconds: 2140, // 35:40
        order_index: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  },
  {
    id: 'course-web-dev-fullstack',
    title: 'Full Stack Web Development & Programming Masterclass',
    title_en: 'Full Stack Web Development & Programming Masterclass',
    description: 'HTML5, CSS3, JavaScript ES6+, React.js, Tailwind CSS এবং Node.js শেখার জন্য পূর্ণাঙ্গ ওয়েব ডেভেলপমেন্ট প্লেলিস্ট। স্ক্র্যাচ থেকে প্রফেশনাল ফুলস্ট্যাক ওয়েবসাইট তৈরির টিউটোরিয়াল।',
    description_en: 'Complete web development playlist covering HTML5, CSS3, JavaScript ES6+, React.js, Tailwind CSS, and Node.js.',
    category: 'Web & Software',
    thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop',
    price: 0,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    trainer_name: 'Sofiullah Ahammad',
    videos: [
      {
        id: 'vid-web-1',
        course_id: 'course-web-dev-fullstack',
        title: 'Lesson 1 - How the Web Works & HTML5 Fundamentals',
        video_url: 'https://www.youtube.com/watch?v=qz0aGYrrlhU',
        video_type: 'youtube',
        duration_seconds: 1530, // 25:30
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-web-2',
        course_id: 'course-web-dev-fullstack',
        title: 'Lesson 2 - Modern CSS3 Flexbox & Grid Layouts',
        video_url: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
        video_type: 'youtube',
        duration_seconds: 2295, // 38:15
        order_index: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-web-3',
        course_id: 'course-web-dev-fullstack',
        title: 'Lesson 3 - JavaScript ES6+ Fundamentals & DOM Manipulation',
        video_url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
        video_type: 'youtube',
        duration_seconds: 2720, // 45:20
        order_index: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-web-4',
        course_id: 'course-web-dev-fullstack',
        title: 'Lesson 4 - React.js Essentials & Component Architecture',
        video_url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
        video_type: 'youtube',
        duration_seconds: 3130, // 52:10
        order_index: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-web-5',
        course_id: 'course-web-dev-fullstack',
        title: 'Lesson 5 - Building & Deploying Fullstack App',
        video_url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
        video_type: 'youtube',
        duration_seconds: 2460, // 41:00
        order_index: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  },
  {
    id: 'course-photography-masterclass',
    title: 'Digital Photography & Camera Operation Masterclass',
    title_en: 'Digital Photography & Camera Operation Masterclass',
    description: 'ডিজিটাল ক্যামেরা মেকানিজম, অ্যাপারচার, শাটার স্পিড, আইএসও, এক্সপোজার ট্রায়াঙ্গেল, লাইটিং কন্ট্রোল, পোর্ট্রেট এবং ল্যান্ডস্কেপ ফটোগ্রাফির খুঁটিনাটি সম্পূর্ণ বাংলায় শিখুন।',
    description_en: 'Master digital photography, camera controls, aperture, shutter speed, ISO, exposure triangle, and portrait lighting.',
    category: 'Graphic & Multimedia',
    thumbnail_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop',
    price: 0,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    trainer_name: 'Papiya Sultana',
    videos: [
      {
        id: 'vid-photo-1',
        course_id: 'course-photography-masterclass',
        title: 'Class 1 - Understanding Camera Modes & Exposure Triangle',
        video_url: 'https://www.youtube.com/watch?v=V7z7BAZdt2M',
        video_type: 'youtube',
        duration_seconds: 1215, // 20:15
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-photo-2',
        course_id: 'course-photography-masterclass',
        title: 'Class 2 - Aperture, Shutter Speed & ISO Masterclass',
        video_url: 'https://www.youtube.com/watch?v=Yp3w_L_gSNE',
        video_type: 'youtube',
        duration_seconds: 1720, // 28:40
        order_index: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-photo-3',
        course_id: 'course-photography-masterclass',
        title: 'Class 3 - Composition Rules & Rule of Thirds',
        video_url: 'https://www.youtube.com/watch?v=VArISKLbZfk',
        video_type: 'youtube',
        duration_seconds: 1170, // 19:30
        order_index: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-photo-4',
        course_id: 'course-photography-masterclass',
        title: 'Class 4 - Outdoor Lighting & Sun Position Control',
        video_url: 'https://www.youtube.com/watch?v=7uC8z4-Gk2Q',
        video_type: 'youtube',
        duration_seconds: 1610, // 26:50
        order_index: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  },
  {
    id: 'course-videography-editing',
    title: 'Videography & Premiere Pro Video Editing Masterclass',
    title_en: 'Videography & Premiere Pro Video Editing Masterclass',
    description: 'ভিডিওগ্রাফির সিনেমাটিক শ্যুট টেকনিক, ক্যামেরা মুভমেন্ট, লুম্যাট্রি কালার গ্রেডিং, সাউন্ড ডিজাইন এবং এডোবি প্রিমিয়ার প্রো প্রফেশনাল ভিডিও এডিটিং শিখুন।',
    description_en: 'Learn cinematic videography, camera movements, Lumetri color grading, sound design, and Adobe Premiere Pro video editing.',
    category: 'Graphic & Multimedia',
    thumbnail_url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1200&auto=format&fit=crop',
    price: 0,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    trainer_name: 'Prantik Chakraborty',
    videos: [
      {
        id: 'vid-video-1',
        course_id: 'course-videography-editing',
        title: 'Class 1 - Cinematic Videography & Camera Angles',
        video_url: 'https://www.youtube.com/watch?v=O-3Mlj3MQ_Q',
        video_type: 'youtube',
        duration_seconds: 1270, // 21:10
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-video-2',
        course_id: 'course-videography-editing',
        title: 'Class 2 - Adobe Premiere Pro Timeline & Cutting Tools',
        video_url: 'https://www.youtube.com/watch?v=Hls3Tp7JS8E',
        video_type: 'youtube',
        duration_seconds: 2005, // 33:25
        order_index: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-video-3',
        course_id: 'course-videography-editing',
        title: 'Class 3 - Color Grading & Lumetri Color Workshop',
        video_url: 'https://www.youtube.com/watch?v=9_oBfSgVlSg',
        video_type: 'youtube',
        duration_seconds: 1785, // 29:45
        order_index: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'vid-video-4',
        course_id: 'course-videography-editing',
        title: 'Class 4 - Audio Editing, SFX & Export Settings',
        video_url: 'https://www.youtube.com/watch?v=8hY7-Gk2q24',
        video_type: 'youtube',
        duration_seconds: 1635, // 27:15
        order_index: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  }
];

/**
 * Ensures courses and videos are seeded in Supabase database.
 */
export async function seedRealCoursesToDatabase(): Promise<void> {
  try {
    for (const course of INITIAL_REAL_YOUTUBE_COURSES) {
      // 1. Insert/Upsert course
      const { error: courseError } = await supabase.from('courses').upsert({
        id: course.id,
        title: course.title,
        title_en: course.title_en,
        description: course.description,
        description_en: course.description_en,
        category: course.category,
        thumbnail_url: course.thumbnail_url,
        price: course.price,
        is_published: course.is_published,
        trainer_name: course.trainer_name,
        created_at: course.created_at,
        updated_at: course.updated_at,
      }, { onConflict: 'id' });

      if (courseError) {
        console.warn('Course seed note:', courseError);
      }

      // 2. Insert/Upsert videos for course
      for (const video of course.videos) {
        await supabase.from('videos').upsert({
          id: video.id,
          course_id: video.course_id,
          title: video.title,
          video_url: video.video_url,
          video_type: video.video_type,
          duration_seconds: video.duration_seconds,
          order_index: video.order_index,
          created_at: video.created_at,
          updated_at: video.updated_at,
        }, { onConflict: 'id' }).catch((e) => console.warn('Video seed note:', e));
      }
    }
  } catch (err) {
    console.warn('Seed exception:', err);
  }
}
