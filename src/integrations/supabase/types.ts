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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          project_id: string | null
          project_name: string | null
          status: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          project_id?: string | null
          project_name?: string | null
          status?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          project_id?: string | null
          project_name?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          column_count: number
          columns: Json
          created_at: string
          file_size: number
          id: string
          name: string
          preview_rows: Json
          project_id: string
          row_count: number
          target_column: string | null
          user_id: string
        }
        Insert: {
          column_count?: number
          columns?: Json
          created_at?: string
          file_size?: number
          id?: string
          name: string
          preview_rows?: Json
          project_id: string
          row_count?: number
          target_column?: string | null
          user_id: string
        }
        Update: {
          column_count?: number
          columns?: Json
          created_at?: string
          file_size?: number
          id?: string
          name?: string
          preview_rows?: Json
          project_id?: string
          row_count?: number
          target_column?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "datasets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deployments: {
        Row: {
          created_at: string
          endpoint: string
          experiment_id: string | null
          id: string
          name: string
          project_id: string
          status: string
          user_id: string
          version: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          experiment_id?: string | null
          id?: string
          name: string
          project_id: string
          status?: string
          user_id: string
          version?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          experiment_id?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: string
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          algorithm: string
          confusion_matrix: Json | null
          created_at: string
          dataset_name: string | null
          duration_ms: number
          engine: string
          feature_names: Json
          hyperparameters: Json
          id: string
          metrics: Json
          name: string
          preprocessing: Json
          problem_type: string
          project_id: string
          status: string
          target_column: string | null
          user_id: string
        }
        Insert: {
          algorithm: string
          confusion_matrix?: Json | null
          created_at?: string
          dataset_name?: string | null
          duration_ms?: number
          engine?: string
          feature_names?: Json
          hyperparameters?: Json
          id?: string
          metrics?: Json
          name: string
          preprocessing?: Json
          problem_type: string
          project_id: string
          status?: string
          target_column?: string | null
          user_id: string
        }
        Update: {
          algorithm?: string
          confusion_matrix?: Json | null
          created_at?: string
          dataset_name?: string | null
          duration_ms?: number
          engine?: string
          feature_names?: Json
          hyperparameters?: Json
          id?: string
          metrics?: Json
          name?: string
          preprocessing?: Json
          problem_type?: string
          project_id?: string
          status?: string
          target_column?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_apps: {
        Row: {
          created_at: string
          deployment_id: string | null
          description: string | null
          fields: Json
          id: string
          name: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deployment_id?: string | null
          description?: string | null
          fields?: Json
          id?: string
          name: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          deployment_id?: string | null
          description?: string | null
          fields?: Json
          id?: string
          name?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_apps_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "deployments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_apps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      model_configs: {
        Row: {
          algorithm: string
          created_at: string
          hyperparameters: Json
          id: string
          preprocessing: Json
          project_id: string
          train_split: number
          updated_at: string
          user_id: string
        }
        Insert: {
          algorithm: string
          created_at?: string
          hyperparameters?: Json
          id?: string
          preprocessing?: Json
          project_id: string
          train_split?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          algorithm?: string
          created_at?: string
          hyperparameters?: Json
          id?: string
          preprocessing?: Json
          project_id?: string
          train_split?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_configs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_problem_type: string
          default_split: number
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          default_problem_type?: string
          default_split?: number
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          default_problem_type?: string
          default_split?: number
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_demo: boolean
          name: string
          problem_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          name: string
          problem_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          problem_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
