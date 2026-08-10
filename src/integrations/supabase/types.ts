export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      application_activity: {
        Row: {
          actor: string | null
          application_id: string
          created_at: string
          event: string
          id: string
          metadata: Json
          notes: string | null
        }
        Insert: {
          actor?: string | null
          application_id: string
          created_at?: string
          event: string
          id?: string
          metadata?: Json
          notes?: string | null
        }
        Update: {
          actor?: string | null
          application_id?: string
          created_at?: string
          event?: string
          id?: string
          metadata?: Json
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_activity_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          doc_type: string
          file_name: string
          file_path: string
          id: string
          mime_type: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scan_status: string
          size_bytes: number
          status: string
          updated_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          application_id: string
          created_at?: string
          doc_type: string
          file_name: string
          file_path: string
          id?: string
          mime_type: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scan_status?: string
          size_bytes?: number
          status?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          application_id?: string
          created_at?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scan_status?: string
          size_bytes?: number
          status?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          age: number
          assigned_recruiter: string | null
          attribution: Json
          campaign: string | null
          cohort: string | null
          created_at: string
          education: string
          email: string | null
          fitness_level: string
          full_name: string
          id: string
          location: string
          notes: string | null
          phone: string
          prior_experience: string | null
          program: string | null
          reference_number: string | null
          source: string | null
          stage: string
          status: string
          tags: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          age: number
          assigned_recruiter?: string | null
          attribution?: Json
          campaign?: string | null
          cohort?: string | null
          created_at?: string
          education: string
          email?: string | null
          fitness_level: string
          full_name: string
          id?: string
          location: string
          notes?: string | null
          phone: string
          prior_experience?: string | null
          program?: string | null
          reference_number?: string | null
          source?: string | null
          stage?: string
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          age?: number
          assigned_recruiter?: string | null
          attribution?: Json
          campaign?: string | null
          cohort?: string | null
          created_at?: string
          education?: string
          email?: string | null
          fitness_level?: string
          full_name?: string
          id?: string
          location?: string
          notes?: string | null
          phone?: string
          prior_experience?: string | null
          program?: string | null
          reference_number?: string | null
          source?: string | null
          stage?: string
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor: string | null
          actor_email: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json
          new_value: Json | null
          previous_value: Json | null
          reason: string | null
          request_id: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          actor_email?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          request_id?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          actor_email?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          request_id?: string | null
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          application_id: string | null
          attempts: number
          channel: string
          created_at: string
          id: string
          idempotency_key: string
          last_error: string | null
          payload: Json
          response: Json | null
          status: string
          updated_at: string
          workflow: string
        }
        Insert: {
          application_id?: string | null
          attempts?: number
          channel?: string
          created_at?: string
          id?: string
          idempotency_key: string
          last_error?: string | null
          payload?: Json
          response?: Json | null
          status?: string
          updated_at?: string
          workflow: string
        }
        Update: {
          application_id?: string | null
          attempts?: number
          channel?: string
          created_at?: string
          id?: string
          idempotency_key?: string
          last_error?: string | null
          payload?: Json
          response?: Json | null
          status?: string
          updated_at?: string
          workflow?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_code: string
          course_id: string
          course_title: string
          id: string
          issued_at: string
          recipient_name: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          certificate_code: string
          course_id: string
          course_title: string
          id?: string
          issued_at?: string
          recipient_name: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          certificate_code?: string
          course_id?: string
          course_title?: string
          id?: string
          issued_at?: string
          recipient_name?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          archived: boolean
          completion_criteria: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          duration_weeks: number | null
          id: string
          objectives: Json
          order_index: number
          published: boolean
          required_tier: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          completion_criteria?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_weeks?: number | null
          id?: string
          objectives?: Json
          order_index?: number
          published?: boolean
          required_tier?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          completion_criteria?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_weeks?: number | null
          id?: string
          objectives?: Json
          order_index?: number
          published?: boolean
          required_tier?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      deployments: {
        Row: {
          application_id: string | null
          created_at: string
          firm_name: string
          id: string
          monthly_salary_kobo: number | null
          role_title: string
          start_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          firm_name: string
          id?: string
          monthly_salary_kobo?: number | null
          role_title: string
          start_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          firm_name?: string
          id?: string
          monthly_salary_kobo?: number | null
          role_title?: string
          start_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          active: boolean
          created_at: string
          id: string
          order_id: string | null
          tier: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          order_id?: string | null
          tier: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          order_id?: string | null
          tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          duration_minutes: number
          id: string
          interview_type: string
          interviewer: string | null
          location: string | null
          meeting_link: string | null
          notes: string | null
          outcome: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          round: number
          scheduled_at: string
          score: number | null
          scorecard: Json
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          interview_type?: string
          interviewer?: string | null
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          outcome?: string
          reminder_sent_at?: string | null
          rescheduled_from?: string | null
          round?: number
          scheduled_at: string
          score?: number | null
          scorecard?: Json
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          interview_type?: string
          interviewer?: string | null
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          outcome?: string
          reminder_sent_at?: string | null
          rescheduled_from?: string | null
          round?: number
          scheduled_at?: string
          score?: number | null
          scorecard?: Json
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          id: string
          last_seen_at: string
          lesson_id: string
          seconds_spent: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          id?: string
          last_seen_at?: string
          lesson_id: string
          seconds_spent?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          id?: string
          last_seen_at?: string
          lesson_id?: string
          seconds_spent?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          body_markdown: string
          checklist: Json
          created_at: string
          estimated_minutes: number
          exercises: Json
          id: string
          is_preview: boolean
          module_id: string
          order_index: number
          published: boolean
          resources: Json
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body_markdown?: string
          checklist?: Json
          created_at?: string
          estimated_minutes?: number
          exercises?: Json
          id?: string
          is_preview?: boolean
          module_id: string
          order_index?: number
          published?: boolean
          resources?: Json
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          checklist?: Json
          created_at?: string
          estimated_minutes?: number
          exercises?: Json
          id?: string
          is_preview?: boolean
          module_id?: string
          order_index?: number
          published?: boolean
          resources?: Json
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          estimated_minutes: number
          id: string
          order_index: number
          published: boolean
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          estimated_minutes?: number
          id?: string
          order_index?: number
          published?: boolean
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          estimated_minutes?: number
          id?: string
          order_index?: number
          published?: boolean
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          body: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json
          read_at: string | null
          recipient: string | null
          title: string
          type: string
        }
        Insert: {
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          recipient?: string | null
          title: string
          type: string
        }
        Update: {
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          recipient?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          access_code: string | null
          amount_kobo: number
          authorization_url: string | null
          created_at: string
          currency: string
          email: string
          id: string
          paystack_response: Json | null
          reference: string
          referral_code: string | null
          status: string
          tier: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_code?: string | null
          amount_kobo: number
          authorization_url?: string | null
          created_at?: string
          currency?: string
          email: string
          id?: string
          paystack_response?: Json | null
          reference: string
          referral_code?: string | null
          status?: string
          tier: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_code?: string | null
          amount_kobo?: number
          authorization_url?: string | null
          created_at?: string
          currency?: string
          email?: string
          id?: string
          paystack_response?: Json | null
          reference?: string
          referral_code?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          course_id: string
          created_at: string
          id: string
          passed: boolean
          quiz_id: string
          score_percent: number
          user_id: string
        }
        Insert: {
          answers?: Json
          course_id: string
          created_at?: string
          id?: string
          passed: boolean
          quiz_id: string
          score_percent: number
          user_id: string
        }
        Update: {
          answers?: Json
          course_id?: string
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score_percent?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          choices: Json
          correct_index: number
          explanation: string | null
          id: string
          order_index: number
          question: string
          quiz_id: string
        }
        Insert: {
          choices: Json
          correct_index: number
          explanation?: string | null
          id?: string
          order_index?: number
          question: string
          quiz_id: string
        }
        Update: {
          choices?: Json
          correct_index?: number
          explanation?: string | null
          id?: string
          order_index?: number
          question?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          is_final: boolean
          lesson_id: string | null
          module_id: string | null
          pass_percent: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_final?: boolean
          lesson_id?: string | null
          module_id?: string | null
          pass_percent?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_final?: boolean
          lesson_id?: string | null
          module_id?: string | null
          pass_percent?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_tasks: {
        Row: {
          application_id: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          details: string | null
          due_at: string | null
          id: string
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiters: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          affiliate_id: string
          commission_kobo: number
          created_at: string
          id: string
          order_id: string | null
          referred_email: string | null
          referred_user_id: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          commission_kobo?: number
          created_at?: string
          id?: string
          order_id?: string | null
          referred_email?: string | null
          referred_user_id?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          commission_kobo?: number
          created_at?: string
          id?: string
          order_id?: string | null
          referred_email?: string | null
          referred_user_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_application: {
        Args: { _app: string; _user: string }
        Returns: boolean
      }
      has_course_access: {
        Args: { _course: string; _user: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_recruiter: { Args: { _user: string }; Returns: boolean }
      issue_certificate: {
        Args: { _course: string }
        Returns: {
          certificate_code: string
          course_id: string
          course_title: string
          id: string
          issued_at: string
          recipient_name: string
          revoked_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "certificates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      recruitment_ops_stats: { Args: never; Returns: Json }
      recruitment_stats: { Args: never; Returns: Json }
      resolve_referral: { Args: { _code: string }; Returns: string }
      verify_certificate: {
        Args: { _code: string }
        Returns: {
          certificate_code: string
          course_title: string
          issued_at: string
          recipient_name: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "affiliate" | "student" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "affiliate", "student", "customer"],
    },
  },
} as const
