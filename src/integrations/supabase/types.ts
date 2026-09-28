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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          reason: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          reason?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          reason?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      app_notifications: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          title: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          class_id: string | null
          created_at: string
          date: string
          excused: boolean
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          date: string
          excused?: boolean
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          date?: string
          excused?: boolean
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          faculty: string | null
          id: string
          is_global: boolean
          location: string | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string
          faculty?: string | null
          id?: string
          is_global?: boolean
          location?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          faculty?: string | null
          id?: string
          is_global?: boolean
          location?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      class_teachers: {
        Row: {
          class_id: string
          created_at: string
          id: string
          teacher_id: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          teacher_id: string
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          teacher_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          day: number
          end_time: string
          id: string
          notes: string | null
          recurrence: Database["public"]["Enums"]["recurrence_type"]
          room: string | null
          start_time: string
          subject_id: string
          type: Database["public"]["Enums"]["class_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day: number
          end_time: string
          id?: string
          notes?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"]
          room?: string | null
          start_time: string
          subject_id: string
          type?: Database["public"]["Enums"]["class_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: number
          end_time?: string
          id?: string
          notes?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"]
          room?: string | null
          start_time?: string
          subject_id?: string
          type?: Database["public"]["Enums"]["class_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_posts: {
        Row: {
          attachments: Json
          content: string
          created_at: string
          faculty: Database["public"]["Enums"]["faculty_type"] | null
          id: string
          is_pinned: boolean
          is_published: boolean
          scheduled_at: string | null
          semester: number | null
          share_slug: string | null
          tags: string[]
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          attachments?: Json
          content: string
          created_at?: string
          faculty?: Database["public"]["Enums"]["faculty_type"] | null
          id?: string
          is_pinned?: boolean
          is_published?: boolean
          scheduled_at?: string | null
          semester?: number | null
          share_slug?: string | null
          tags?: string[]
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          attachments?: Json
          content?: string
          created_at?: string
          faculty?: Database["public"]["Enums"]["faculty_type"] | null
          id?: string
          is_pinned?: boolean
          is_published?: boolean
          scheduled_at?: string | null
          semester?: number | null
          share_slug?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          context_id: string | null
          context_type: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          context_id?: string | null
          context_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          context_id?: string | null
          context_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          color: string
          created_at: string
          current: number
          id: string
          is_completed: boolean
          target: number
          title: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          current?: number
          id?: string
          is_completed?: boolean
          target?: number
          title: string
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          current?: number
          id?: string
          is_completed?: boolean
          target?: number
          title?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          created_at: string
          date: string
          id: string
          max_score: number
          notes: string | null
          subject_id: string
          term_id: string
          type: Database["public"]["Enums"]["grade_type"]
          updated_at: string
          user_id: string
          value: number
          weight: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          max_score?: number
          notes?: string | null
          subject_id: string
          term_id: string
          type?: Database["public"]["Enums"]["grade_type"]
          updated_at?: string
          user_id: string
          value: number
          weight?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          max_score?: number
          notes?: string | null
          subject_id?: string
          term_id?: string
          type?: Database["public"]["Enums"]["grade_type"]
          updated_at?: string
          user_id?: string
          value?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      import_history: {
        Row: {
          id: string
          imported_at: string
          shared_link_id: string
          user_id: string
        }
        Insert: {
          id?: string
          imported_at?: string
          shared_link_id: string
          user_id: string
        }
        Update: {
          id?: string
          imported_at?: string
          shared_link_id?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          category: string
          condition: string
          created_at: string
          description: string | null
          id: string
          image_urls: string[] | null
          price: number
          seller_faculty: string | null
          seller_name: string | null
          seller_semester: number | null
          seller_username: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          price?: number
          seller_faculty?: string | null
          seller_name?: string | null
          seller_semester?: number | null
          seller_username?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          price?: number
          seller_faculty?: string | null
          seller_name?: string | null
          seller_semester?: number | null
          seller_username?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          category: string | null
          color: string
          content: string | null
          created_at: string
          id: string
          is_pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          color?: string
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          color?: string
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          id: string
          options: Json
          question: string
          share_code: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          options?: Json
          question: string
          share_code?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          options?: Json
          question?: string
          share_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "classroom_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "classroom_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "classroom_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          blood_group: string | null
          class_alert_minutes: number
          class_id: string | null
          created_at: string
          default_class_duration: number
          email: string | null
          faculty: Database["public"]["Enums"]["faculty_type"] | null
          grading_system: Database["public"]["Enums"]["grading_system"]
          headline: string | null
          id: string
          is_shadow_banned: boolean
          is_soft_deleted: boolean
          last_visit_date: string | null
          location: string | null
          name: string
          primary_color: string
          profile_setup_completed: boolean
          reg_number: string | null
          semester: number | null
          show_achievements: boolean
          show_bio: boolean
          show_blood_group: boolean
          show_class_id: boolean
          show_email: boolean
          show_faculty: boolean
          show_headline: boolean
          show_location: boolean
          show_reg_number: boolean
          show_semester: boolean
          show_skills: boolean
          show_social_links: boolean
          show_stats: boolean
          show_weekends: boolean
          skills: Json | null
          social_links: Json | null
          start_of_week: number
          theme: string
          total_visits: number
          updated_at: string
          user_id: string
          username: string | null
          visit_streak: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blood_group?: string | null
          class_alert_minutes?: number
          class_id?: string | null
          created_at?: string
          default_class_duration?: number
          email?: string | null
          faculty?: Database["public"]["Enums"]["faculty_type"] | null
          grading_system?: Database["public"]["Enums"]["grading_system"]
          headline?: string | null
          id?: string
          is_shadow_banned?: boolean
          is_soft_deleted?: boolean
          last_visit_date?: string | null
          location?: string | null
          name?: string
          primary_color?: string
          profile_setup_completed?: boolean
          reg_number?: string | null
          semester?: number | null
          show_achievements?: boolean
          show_bio?: boolean
          show_blood_group?: boolean
          show_class_id?: boolean
          show_email?: boolean
          show_faculty?: boolean
          show_headline?: boolean
          show_location?: boolean
          show_reg_number?: boolean
          show_semester?: boolean
          show_skills?: boolean
          show_social_links?: boolean
          show_stats?: boolean
          show_weekends?: boolean
          skills?: Json | null
          social_links?: Json | null
          start_of_week?: number
          theme?: string
          total_visits?: number
          updated_at?: string
          user_id: string
          username?: string | null
          visit_streak?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blood_group?: string | null
          class_alert_minutes?: number
          class_id?: string | null
          created_at?: string
          default_class_duration?: number
          email?: string | null
          faculty?: Database["public"]["Enums"]["faculty_type"] | null
          grading_system?: Database["public"]["Enums"]["grading_system"]
          headline?: string | null
          id?: string
          is_shadow_banned?: boolean
          is_soft_deleted?: boolean
          last_visit_date?: string | null
          location?: string | null
          name?: string
          primary_color?: string
          profile_setup_completed?: boolean
          reg_number?: string | null
          semester?: number | null
          show_achievements?: boolean
          show_bio?: boolean
          show_blood_group?: boolean
          show_class_id?: boolean
          show_email?: boolean
          show_faculty?: boolean
          show_headline?: boolean
          show_location?: boolean
          show_reg_number?: boolean
          show_semester?: boolean
          show_skills?: boolean
          show_social_links?: boolean
          show_stats?: boolean
          show_weekends?: boolean
          skills?: Json | null
          social_links?: Json | null
          start_of_week?: number
          theme?: string
          total_visits?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          visit_streak?: number
        }
        Relationships: []
      }
      shared_links: {
        Row: {
          created_at: string
          data: Json
          expires_at: string | null
          id: string
          include_classes: boolean
          include_subjects: boolean
          include_teachers: boolean
          share_code: string | null
          title: string
          token: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          data?: Json
          expires_at?: string | null
          id?: string
          include_classes?: boolean
          include_subjects?: boolean
          include_teachers?: boolean
          share_code?: string | null
          title?: string
          token?: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          data?: Json
          expires_at?: string | null
          id?: string
          include_classes?: boolean
          include_subjects?: boolean
          include_teachers?: boolean
          share_code?: string | null
          title?: string
          token?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      study_room_members: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_rooms: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string | null
          is_active: boolean
          max_members: number
          name: string
          updated_at: string
          video_link: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code?: string | null
          is_active?: boolean
          max_members?: number
          name: string
          updated_at?: string
          video_link?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string | null
          is_active?: boolean
          max_members?: number
          name?: string
          updated_at?: string
          video_link?: string | null
        }
        Relationships: []
      }
      subject_teachers: {
        Row: {
          created_at: string
          id: string
          subject_id: string
          teacher_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subject_id: string
          teacher_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subject_id?: string
          teacher_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_teachers_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          room: string | null
          teacher_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          room?: string | null
          teacher_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          room?: string | null
          teacher_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tasks: {
        Row: {
          attachments: Json
          created_at: string
          due_date: string
          due_time: string | null
          id: string
          is_completed: boolean
          notes: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          recurrence_rule: string | null
          subject_id: string | null
          submission_status:
            | Database["public"]["Enums"]["submission_status"]
            | null
          subtasks: Json
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json
          created_at?: string
          due_date: string
          due_time?: string | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          recurrence_rule?: string | null
          subject_id?: string | null
          submission_status?:
            | Database["public"]["Enums"]["submission_status"]
            | null
          subtasks?: Json
          title: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json
          created_at?: string
          due_date?: string
          due_time?: string | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          recurrence_rule?: string | null
          subject_id?: string | null
          submission_status?:
            | Database["public"]["Enums"]["submission_status"]
            | null
          subtasks?: Json
          title?: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          office_hours: string | null
          phone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          office_hours?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          office_hours?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      terms: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_profiles: {
        Row: {
          availability: string | null
          bio: string | null
          created_at: string
          id: string
          is_active: boolean
          rate: string | null
          subjects: string[] | null
          tutor_faculty: string | null
          tutor_name: string | null
          tutor_semester: number | null
          tutor_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          rate?: string | null
          subjects?: string[] | null
          tutor_faculty?: string | null
          tutor_name?: string | null
          tutor_semester?: number | null
          tutor_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          rate?: string | null
          subjects?: string[] | null
          tutor_faculty?: string | null
          tutor_name?: string | null
          tutor_semester?: number | null
          tutor_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_notifications: {
        Row: {
          actor_id: string
          content: string | null
          created_at: string
          id: string
          is_read: boolean
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_by: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "app_notifications"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      admin_search_posts: {
        Args: { _limit?: number; _query: string }
        Returns: {
          author_name: string
          content: string
          created_at: string
          faculty: string
          id: string
          is_pinned: boolean
          semester: number
          user_id: string
        }[]
      }
      block_user: {
        Args: {
          _expires_at?: string
          _reason?: string
          _target_user_id: string
        }
        Returns: undefined
      }
      can_view_classroom_post: {
        Args: {
          _post_faculty: Database["public"]["Enums"]["faculty_type"]
          _post_semester: number
          _user_id: string
        }
        Returns: boolean
      }
      can_view_post_comments: { Args: { _post_id: string }; Returns: boolean }
      cleanup_old_messages: { Args: never; Returns: number }
      demote_from_admin: { Args: { _target_user_id: string }; Returns: boolean }
      demote_from_cr: { Args: { _target_user_id: string }; Returns: boolean }
      get_admin_audit_logs: {
        Args: { _limit?: number; _offset?: number }
        Returns: {
          action: string
          admin_id: string
          admin_name: string
          created_at: string
          details: Json
          id: string
          reason: string
          target_id: string
          target_type: string
        }[]
      }
      get_admin_user_stats: {
        Args: never
        Returns: {
          faculty: Database["public"]["Enums"]["faculty_type"]
          role: Database["public"]["Enums"]["app_role"]
          semester: number
          user_count: number
        }[]
      }
      get_all_users_for_admin: {
        Args: never
        Returns: {
          avatar_url: string
          faculty: Database["public"]["Enums"]["faculty_type"]
          is_blocked: boolean
          is_shadow_banned: boolean
          is_soft_deleted: boolean
          name: string
          role: Database["public"]["Enums"]["app_role"]
          semester: number
          user_id: string
          username: string
        }[]
      }
      get_public_post_by_slug: {
        Args: { _slug: string }
        Returns: {
          attachments: Json
          author_avatar_url: string
          author_headline: string
          author_name: string
          author_role: Database["public"]["Enums"]["app_role"]
          author_username: string
          comment_count: number
          content: string
          created_at: string
          faculty: string
          id: string
          is_pinned: boolean
          reaction_count: number
          semester: number
          share_slug: string
          tags: string[]
          user_id: string
        }[]
      }
      get_public_profile_achievements: {
        Args: { _username: string }
        Returns: {
          achievement_key: string
          unlocked_at: string
        }[]
      }
      get_public_profile_by_username: {
        Args: { _username: string }
        Returns: {
          avatar_url: string
          bio: string
          blood_group: string
          class_id: string
          created_at: string
          email: string
          faculty: Database["public"]["Enums"]["faculty_type"]
          headline: string
          name: string
          reg_number: string
          role: Database["public"]["Enums"]["app_role"]
          semester: number
          skills: Json
          social_links: Json
          user_id: string
          username: string
        }[]
      }
      get_public_profiles: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          bio: string
          faculty: Database["public"]["Enums"]["faculty_type"]
          headline: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          semester: number
          social_links: Json
          user_id: string
          username: string
        }[]
      }
      get_shared_link_by_code: {
        Args: { _code: string }
        Returns: {
          created_at: string
          data: Json
          expires_at: string | null
          id: string
          include_classes: boolean
          include_subjects: boolean
          include_teachers: boolean
          share_code: string | null
          title: string
          token: string
          user_id: string
          view_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "shared_links"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_shared_link_by_token: {
        Args: { _token: string }
        Returns: {
          created_at: string
          data: Json
          expires_at: string | null
          id: string
          include_classes: boolean
          include_subjects: boolean
          include_teachers: boolean
          share_code: string | null
          title: string
          token: string
          user_id: string
          view_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "shared_links"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_faculty: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["faculty_type"]
      }
      get_user_insight: { Args: { _target_user_id: string }; Returns: Json }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_semester: { Args: { _user_id: string }; Returns: number }
      hard_delete_user: {
        Args: { _reason?: string; _target_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_shared_link_view_count: {
        Args: { _token: string }
        Returns: undefined
      }
      is_user_blocked: { Args: { _user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          _action: string
          _details?: Json
          _reason?: string
          _target_id?: string
          _target_type: string
        }
        Returns: undefined
      }
      promote_to_admin: { Args: { _target_user_id: string }; Returns: boolean }
      promote_to_cr: { Args: { _target_user_id: string }; Returns: boolean }
      publish_scheduled_posts: { Args: never; Returns: number }
      shadow_ban_user: {
        Args: { _ban?: boolean; _target_user_id: string }
        Returns: undefined
      }
      soft_delete_user: {
        Args: { _reason?: string; _target_user_id: string }
        Returns: undefined
      }
      toggle_maintenance_mode: {
        Args: { _enabled: boolean }
        Returns: undefined
      }
      unblock_user: { Args: { _target_user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "student" | "cr" | "admin" | "super_admin"
      attendance_status: "present" | "absent" | "tardy" | "left_early"
      class_type: "lecture" | "lab" | "seminar" | "tutorial"
      faculty_type:
        | "Agriculture"
        | "CSE"
        | "FBA"
        | "Fisheries"
        | "ESDM"
        | "NFS"
        | "LLA"
      grade_type: "written" | "oral" | "project" | "participation"
      grading_system: "numeric_10" | "numeric_20" | "numeric_100" | "letter"
      recurrence_type: "weekly" | "biweekly" | "custom"
      submission_status: "pending" | "submitted" | "graded"
      task_priority: "low" | "medium" | "high"
      task_type: "homework" | "exam" | "assignment" | "reminder"
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
      app_role: ["student", "cr", "admin", "super_admin"],
      attendance_status: ["present", "absent", "tardy", "left_early"],
      class_type: ["lecture", "lab", "seminar", "tutorial"],
      faculty_type: [
        "Agriculture",
        "CSE",
        "FBA",
        "Fisheries",
        "ESDM",
        "NFS",
        "LLA",
      ],
      grade_type: ["written", "oral", "project", "participation"],
      grading_system: ["numeric_10", "numeric_20", "numeric_100", "letter"],
      recurrence_type: ["weekly", "biweekly", "custom"],
      submission_status: ["pending", "submitted", "graded"],
      task_priority: ["low", "medium", "high"],
      task_type: ["homework", "exam", "assignment", "reminder"],
    },
  },
} as const
