# AlphaZero Education Platform (alphazero.online)

AlphaZero Education is a 100% independent, standalone LMS (Learning Management System) application powering **alphazero.online**.

## 🌐 Project Domain & Access Points

- **Primary Platform Home**: [https://alphazero.online](https://alphazero.online)
- **Education Admin Panel**: [https://alphazero.online/admin](https://alphazero.online/admin)
- **Student Auth Portal**: [https://alphazero.online/student/login](https://alphazero.online/student/login)
- **Teacher Auth Portal**: [https://alphazero.online/teacher/login](https://alphazero.online/teacher/login)

---

## 🚀 Key Features

- **Course System**: Video lessons, chapter progression, assignment attachments, and category filters.
- **Student Dashboard**: Enrolled courses, course progress tracking, certificates, and settings.
- **Teacher Portal**: Course creation, module/lesson management, student tracking, and withdrawals.
- **Education Admin Panel**: Management of courses, modules, students, teachers, enrollments, UddoktaPay/Bkash payments, coupons, certificates, and CMS pages.
- **Certificate Verification**: Public digital certificate generation and URL verification.

---

## 🛠️ Tech Stack & Setup

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend & Database**: Supabase (Database, Auth, Storage, Edge Functions).

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```
