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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          max_progress: number
          title: string
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          max_progress?: number
          title: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          max_progress?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          content: string
          created_at: string
          data_summary: Json | null
          id: string
          insight_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          data_summary?: Json | null
          id?: string
          insight_type?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          data_summary?: Json | null
          id?: string
          insight_type?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          display_name: string
          id: string
          message: string
          message_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id?: string
          message: string
          message_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          message?: string
          message_type?: string
          user_id?: string
        }
        Relationships: []
      }
      desires: {
        Row: {
          created_at: string
          description: string | null
          fulfilled_at: string | null
          id: string
          is_fulfilled: boolean
          priority: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fulfilled_at?: string | null
          id?: string
          is_fulfilled?: boolean
          priority?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fulfilled_at?: string | null
          id?: string
          is_fulfilled?: boolean
          priority?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dream_entries: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lucidity: number
          mood_after: number | null
          tags: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lucidity?: number
          mood_after?: number | null
          tags?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lucidity?: number
          mood_after?: number | null
          tags?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      heuristic_upvotes: {
        Row: {
          created_at: string
          heuristic_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          heuristic_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          heuristic_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "heuristic_upvotes_heuristic_id_fkey"
            columns: ["heuristic_id"]
            isOneToOne: false
            referencedRelation: "heuristics"
            referencedColumns: ["id"]
          },
        ]
      }
      heuristics: {
        Row: {
          category: string
          created_at: string
          description: string | null
          downloads: number
          id: string
          is_public: boolean
          tags: string[] | null
          title: string
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          downloads?: number
          id?: string
          is_public?: boolean
          tags?: string[] | null
          title: string
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          downloads?: number
          id?: string
          is_public?: boolean
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: []
      }
      inner_drives: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          strength: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          strength?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          strength?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      life_profiles: {
        Row: {
          ai_recommendations: Json | null
          answers: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_recommendations?: Json | null
          answers?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_recommendations?: Json | null
          answers?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mission_completions: {
        Row: {
          bonus_xp: number
          completed_at: string
          id: string
          mission_id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          bonus_xp?: number
          completed_at?: string
          id?: string
          mission_id: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          bonus_xp?: number
          completed_at?: string
          id?: string
          mission_id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "mission_completions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          is_daily: boolean
          title: string
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          is_daily?: boolean
          title: string
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          is_daily?: boolean
          title?: string
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string
          energy_level: number
          id: string
          mood: number
          note: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_level: number
          id?: string
          mood: number
          note?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          energy_level?: number
          id?: string
          mood?: number
          note?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          related_post_id: string | null
          related_user_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          related_post_id?: string | null
          related_user_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          related_post_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
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
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          post_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          post_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          post_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          coins: number
          created_at: string
          display_name: string
          energy: number
          followers_count: number
          following_count: number
          id: string
          last_active_date: string | null
          level: number
          longest_streak: number
          max_energy: number
          posts_count: number
          streak: number
          total_dreams_logged: number
          total_missions_completed: number
          updated_at: string
          user_id: string
          xp: number
          xp_to_next: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          energy?: number
          followers_count?: number
          following_count?: number
          id?: string
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          max_energy?: number
          posts_count?: number
          streak?: number
          total_dreams_logged?: number
          total_missions_completed?: number
          updated_at?: string
          user_id: string
          xp?: number
          xp_to_next?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          energy?: number
          followers_count?: number
          following_count?: number
          id?: string
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          max_energy?: number
          posts_count?: number
          streak?: number
          total_dreams_logged?: number
          total_missions_completed?: number
          updated_at?: string
          user_id?: string
          xp?: number
          xp_to_next?: number
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string
          level: number
          streak: number
          total_dreams_logged: number
          total_missions_completed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string
          level?: number
          streak?: number
          total_dreams_logged?: number
          total_missions_completed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string
          level?: number
          streak?: number
          total_dreams_logged?: number
          total_missions_completed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rewards_log: {
        Row: {
          coins_amount: number
          created_at: string
          description: string | null
          id: string
          reward_type: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          coins_amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reward_type: string
          user_id: string
          xp_amount?: number
        }
        Update: {
          coins_amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reward_type?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
      tribe_challenge_participants: {
        Row: {
          challenge_id: string
          id: string
          joined_at: string
          score: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          joined_at?: string
          score?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          joined_at?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribe_challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "tribe_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      tribe_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          created_by: string
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          title: string
          tribe_id: string
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          created_by: string
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          title: string
          tribe_id: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          created_by?: string
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          title?: string
          tribe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribe_challenges_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
        ]
      }
      tribe_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          tribe_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          tribe_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          tribe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribe_members_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
        ]
      }
      tribes: {
        Row: {
          collective_xp: number
          color: string
          created_at: string
          creator_id: string
          description: string | null
          goal: string | null
          icon: string
          id: string
          is_public: boolean
          members_count: number
          name: string
          updated_at: string
        }
        Insert: {
          collective_xp?: number
          color?: string
          created_at?: string
          creator_id: string
          description?: string | null
          goal?: string | null
          icon?: string
          id?: string
          is_public?: boolean
          members_count?: number
          name: string
          updated_at?: string
        }
        Update: {
          collective_xp?: number
          color?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          goal?: string | null
          icon?: string
          id?: string
          is_public?: boolean
          members_count?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          progress: number
          unlocked: boolean
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          is_recurring: boolean
          linked_mission_id: string | null
          parent_task_id: string | null
          priority: number
          recurrence_rule: string | null
          scheduled_date: string | null
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          is_recurring?: boolean
          linked_mission_id?: string | null
          parent_task_id?: string | null
          priority?: number
          recurrence_rule?: string | null
          scheduled_date?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          is_recurring?: boolean
          linked_mission_id?: string | null
          parent_task_id?: string | null
          priority?: number
          recurrence_rule?: string | null
          scheduled_date?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_linked_mission_id_fkey"
            columns: ["linked_mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "user_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          ai_summary: string | null
          created_at: string
          id: string
          stats: Json
          user_id: string
          week_start: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          id?: string
          stats?: Json
          user_id: string
          week_start: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          id?: string
          stats?: Json
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_energy_decay: { Args: never; Returns: undefined }
      award_activity_xp: {
        Args: { p_activity?: string; p_amount: number }
        Returns: undefined
      }
      complete_mission: { Args: { p_mission_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      send_notification: {
        Args: {
          p_body?: string
          p_related_post_id?: string
          p_related_user_id?: string
          p_target_user_id: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      submit_dream_entry: {
        Args: { p_description?: string; p_lucidity?: number; p_title: string }
        Returns: undefined
      }
      submit_mood_checkin: {
        Args: { p_energy: number; p_mood: number; p_note?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
