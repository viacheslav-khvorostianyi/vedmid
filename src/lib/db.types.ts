// Hand-written in the `supabase gen types typescript` format from supabase/migrations/0001_init.sql.
// Replace by running `npm run db:types` once a database is available (local stack or linked project).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string;
          icon: string;
          id: string;
          rule: Json;
          sort: number;
          title: string;
          xp_reward: number;
        };
        Insert: {
          description: string;
          icon?: string;
          id: string;
          rule: Json;
          sort?: number;
          title: string;
          xp_reward?: number;
        };
        Update: {
          description?: string;
          icon?: string;
          id?: string;
          rule?: Json;
          sort?: number;
          title?: string;
          xp_reward?: number;
        };
        Relationships: [];
      };
      answer_log: {
        Row: {
          correct: boolean;
          created_at: string;
          id: number;
          item_id: string | null;
          source: Database['public']['Enums']['answer_source'];
          user_id: string;
          xp_awarded: number;
        };
        Insert: {
          correct: boolean;
          created_at?: string;
          id?: number;
          item_id?: string | null;
          source: Database['public']['Enums']['answer_source'];
          user_id: string;
          xp_awarded?: number;
        };
        Update: {
          correct?: boolean;
          created_at?: string;
          id?: number;
          item_id?: string | null;
          source?: Database['public']['Enums']['answer_source'];
          user_id?: string;
          xp_awarded?: number;
        };
        Relationships: [];
      };
      card_progress: {
        Row: {
          box: number;
          item_id: string;
          last_result: boolean | null;
          reviewed_at: string | null;
          times_known: number;
          times_seen: number;
          user_id: string;
        };
        Insert: {
          box?: number;
          item_id: string;
          last_result?: boolean | null;
          reviewed_at?: string | null;
          times_known?: number;
          times_seen?: number;
          user_id: string;
        };
        Update: {
          box?: number;
          item_id?: string;
          last_result?: boolean | null;
          reviewed_at?: string | null;
          times_known?: number;
          times_seen?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: { id: number; legacy_name: string; name: string; slug: string; sort: number };
        Insert: { id: number; legacy_name: string; name: string; slug: string; sort: number };
        Update: { id?: number; legacy_name?: string; name?: string; slug?: string; sort?: number };
        Relationships: [];
      };
      game_results: {
        Row: {
          created_at: string;
          id: number;
          mode: Database['public']['Enums']['game_mode'];
          score: number;
          total: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          mode: Database['public']['Enums']['game_mode'];
          score: number;
          total: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          mode?: Database['public']['Enums']['game_mode'];
          score?: number;
          total?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      guest_scenarios: {
        Row: {
          avatar: string;
          id: string;
          is_active: boolean;
          options: Json;
          persona: string;
          quote: string;
          sort: number;
        };
        Insert: {
          avatar?: string;
          id: string;
          is_active?: boolean;
          options: Json;
          persona: string;
          quote: string;
          sort?: number;
        };
        Update: {
          avatar?: string;
          id?: string;
          is_active?: boolean;
          options?: Json;
          persona?: string;
          quote?: string;
          sort?: number;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          allergens: string[];
          anchor: string;
          grape_varieties: string | null;
          id: string;
          ingredients: string;
          interesting_fact: string | null;
          is_active: boolean;
          is_bestseller: boolean;
          is_finalist: boolean;
          legacy_id: string | null;
          pairing: string | null;
          photo_path: string | null;
          producer: Json | null;
          sales: string;
          sort: number;
          subcategory_id: number;
          sweetness: string | null;
          taste_profile: Json | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          allergens?: string[];
          anchor?: string;
          grape_varieties?: string | null;
          id?: string;
          ingredients?: string;
          interesting_fact?: string | null;
          is_active?: boolean;
          is_bestseller?: boolean;
          is_finalist?: boolean;
          legacy_id?: string | null;
          pairing?: string | null;
          photo_path?: string | null;
          producer?: Json | null;
          sales?: string;
          sort?: number;
          subcategory_id: number;
          sweetness?: string | null;
          taste_profile?: Json | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          allergens?: string[];
          anchor?: string;
          grape_varieties?: string | null;
          id?: string;
          ingredients?: string;
          interesting_fact?: string | null;
          is_active?: boolean;
          is_bestseller?: boolean;
          is_finalist?: boolean;
          legacy_id?: string | null;
          pairing?: string | null;
          photo_path?: string | null;
          producer?: Json | null;
          sales?: string;
          sort?: number;
          subcategory_id?: number;
          sweetness?: string | null;
          taste_profile?: Json | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      player_stats: {
        Row: {
          correct_answers: number;
          max_streak: number;
          streak: number;
          total_answers: number;
          updated_at: string;
          user_id: string;
          xp: number;
        };
        Insert: {
          correct_answers?: number;
          max_streak?: number;
          streak?: number;
          total_answers?: number;
          updated_at?: string;
          user_id: string;
          xp?: number;
        };
        Update: {
          correct_answers?: number;
          max_streak?: number;
          streak?: number;
          total_answers?: number;
          updated_at?: string;
          user_id?: string;
          xp?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          role: Database['public']['Enums']['staff_role'];
        };
        Insert: {
          created_at?: string;
          display_name?: string;
          id: string;
          role?: Database['public']['Enums']['staff_role'];
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          role?: Database['public']['Enums']['staff_role'];
        };
        Relationships: [];
      };
      subcategories: {
        Row: { category_id: number; id: number; name: string; sort: number };
        Insert: { category_id: number; id?: number; name: string; sort?: number };
        Update: { category_id?: number; id?: number; name?: string; sort?: number };
        Relationships: [];
      };
      user_achievements: {
        Row: { achievement_id: string; unlocked_at: string; user_id: string };
        Insert: { achievement_id: string; unlocked_at?: string; user_id: string };
        Update: { achievement_id?: string; unlocked_at?: string; user_id?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      finish_game: {
        Args: { p_mode: Database['public']['Enums']['game_mode']; p_score: number; p_total: number };
        Returns: undefined;
      };
      is_manager: { Args: Record<PropertyKey, never>; Returns: boolean };
      record_answer: {
        Args: {
          p_correct: boolean;
          p_item_id: string | null;
          p_source: Database['public']['Enums']['answer_source'];
        };
        Returns: {
          level: number;
          max_streak: number;
          new_achievements: string[];
          streak: number;
          xp: number;
        }[];
      };
      set_role: {
        Args: { p_role: Database['public']['Enums']['staff_role']; p_user: string };
        Returns: undefined;
      };
    };
    Enums: {
      answer_source: 'card' | 'quiz' | 'match' | 'recipe' | 'guest';
      game_mode: 'quiz' | 'match' | 'recipe' | 'guest';
      staff_role: 'waiter' | 'manager';
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
