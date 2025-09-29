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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          created_at: string
          efficiency_score: number | null
          fuel_cost: number | null
          id: string
          maintenance_cost: number | null
          total_revenue: number | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          efficiency_score?: number | null
          fuel_cost?: number | null
          id?: string
          maintenance_cost?: number | null
          total_revenue?: number | null
          trip_id: string
        }
        Update: {
          created_at?: string
          efficiency_score?: number | null
          fuel_cost?: number | null
          id?: string
          maintenance_cost?: number | null
          total_revenue?: number | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      maintenance: {
        Row: {
          cost: number
          created_at: string
          description: string
          id: string
          maintenance_date: string
          trip_id: string | null
          truck_id: string
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          description: string
          id?: string
          maintenance_date?: string
          trip_id?: string | null
          truck_id: string
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          description?: string
          id?: string
          maintenance_date?: string
          trip_id?: string | null
          truck_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_verified: boolean
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          customer_id: string
          destination: string
          distance: number | null
          driver_id: string
          duration: number | null
          FUEL: number | null
          id: string
          MILEAGE: number | null
          origin: string
          RATE: number | null
          "ROAD TOLLS": number | null
          SALARY: number | null
          scheduled_date: string
          status: Database["public"]["Enums"]["trip_status"]
          truck_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          destination: string
          distance?: number | null
          driver_id: string
          duration?: number | null
          FUEL?: number | null
          id?: string
          MILEAGE?: number | null
          origin: string
          RATE?: number | null
          "ROAD TOLLS"?: number | null
          SALARY?: number | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["trip_status"]
          truck_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          destination?: string
          distance?: number | null
          driver_id?: string
          duration?: number | null
          FUEL?: number | null
          id?: string
          MILEAGE?: number | null
          origin?: string
          RATE?: number | null
          "ROAD TOLLS"?: number | null
          SALARY?: number | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["trip_status"]
          truck_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      trucks: {
        Row: {
          assigned_driver_id: string | null
          capacity: number | null
          created_at: string
          id: string
          model: string
          plate_number: string
          status: Database["public"]["Enums"]["truck_status"]
          updated_at: string
        }
        Insert: {
          assigned_driver_id?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          model: string
          plate_number: string
          status?: Database["public"]["Enums"]["truck_status"]
          updated_at?: string
        }
        Update: {
          assigned_driver_id?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          model?: string
          plate_number?: string
          status?: Database["public"]["Enums"]["truck_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trucks_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      trip_status: "scheduled" | "ongoing" | "completed" | "cancelled"
      truck_status: "active" | "inactive" | "maintenance"
      user_role: "admin" | "dispatcher" | "driver"
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
      trip_status: ["scheduled", "ongoing", "completed", "cancelled"],
      truck_status: ["active", "inactive", "maintenance"],
      user_role: ["admin", "dispatcher", "driver"],
    },
  },
} as const
