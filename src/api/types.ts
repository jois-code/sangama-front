
export interface Club {
  id: number;
  name: string;
  description?: string;
  url?: string;
  logo_url?: string;
  tagline?: string;
  founded?: string;
  campus?: string;
  department?: string;
  member_count?: string;
  event_count?: string;
  social_links?: string;
  people_preview?: string;
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  date_time: string;
  location: string | null;
  banner_url: string | null;
  club_id: number | null;
  form_id: string | null;
  form?: {
    closes_at?: string | null;
  } | null;
}


export interface CapstoneTeam {
  id: number;
  title: string;
  description: string;
  looking_for?: string;
  creator_id: number;
}

interface CustomCourseNote {
  id: number;
  title: string;
  content: string;
  author_id: number;
  course_id?: number;
  unit_id?: number;
  class_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface CourseMaterial {
  id: number;
  class_id: number;
  type: string;
  name?: string;
  title?: string;
  extension?: string;
  uuid?: string;
  download_url?: string;
  github_url?: string;
  provider?: string;
  video_id?: string;
  video_url?: string;
  faculty?: string;
}

interface CourseClass {
  id: number;
  unit_id: number;
  title: string;
  order: number;
  folder_name?: string;
  path?: string;
  materials: CourseMaterial[];
  custom_notes: CustomCourseNote[];
}

interface CourseUnit {
  id: number;
  course_id: number;
  title: string;
  path?: string;
  classes: CourseClass[];
  custom_notes: CustomCourseNote[];
}

export interface Course {
  id: number;
  course_code: string;
  course_title: string;
  semester_name: string;
  units: CourseUnit[];
  custom_notes: CustomCourseNote[];
}

export interface FormAnswer {
  id: string;
  field_id: string;
  value: unknown;
}

export interface FormResponse {
  id: string;
  form_id: string;
  respondent_id: number | null;
  respondent?: {
    name: string;
    email: string;
    srn?: string;
  } | null;
  submitted_at: string;
  answers: FormAnswer[];
}

export interface YearbookUser {
  id: number;
  name: string;
  srn: string;
  program?: string;
  branch?: string;
  semester?: string;
  campus?: string;
  photo?: string;
}

export interface YearbookEntry {
  id: number;
  quote: string;
  display_name_override?: string | null;
  photo_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  instagram_url?: string | null;
  personal_site_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  campus?: string | null;
  graduation_year?: number | null;
  department?: string | null;
  created_at?: string;
  updated_at?: string;
  approved_at?: string;
  user: YearbookUser;
}
