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
      client_order_items: {
        Row: {
          client_product_id: string
          created_at: string
          id: string
          notes: string | null
          order_id: string
          quantity: number
          unit_value: number | null
        }
        Insert: {
          client_product_id: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          quantity: number
          unit_value?: number | null
        }
        Update: {
          client_product_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          unit_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_order_items_client_product_id_fkey"
            columns: ["client_product_id"]
            isOneToOne: false
            referencedRelation: "client_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "client_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      client_orders: {
        Row: {
          company_id: string
          completed_date: string | null
          created_at: string
          created_by: string
          id: string
          notes: string | null
          order_number: string
          order_type: string
          requested_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_date?: string | null
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          order_number: string
          order_type: string
          requested_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_date?: string | null
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          order_number?: string
          order_type?: string
          requested_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      client_products: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          dimensions_height: number | null
          dimensions_length: number | null
          dimensions_width: number | null
          id: string
          is_active: boolean
          name: string
          sku: string
          storage_requirements: string | null
          unit_value: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          dimensions_height?: number | null
          dimensions_length?: number | null
          dimensions_width?: number | null
          id?: string
          is_active?: boolean
          name: string
          sku: string
          storage_requirements?: string | null
          unit_value?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          dimensions_height?: number | null
          dimensions_length?: number | null
          dimensions_width?: number | null
          id?: string
          is_active?: boolean
          name?: string
          sku?: string
          storage_requirements?: string | null
          unit_value?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          billing_address: string | null
          client_code: string | null
          contact_person: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          max_storage_cubic_feet: number | null
          monthly_fee: number | null
          name: string
          phone: string | null
          storage_plan: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          billing_address?: string | null
          client_code?: string | null
          contact_person?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          max_storage_cubic_feet?: number | null
          monthly_fee?: number | null
          name: string
          phone?: string | null
          storage_plan?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          billing_address?: string | null
          client_code?: string | null
          contact_person?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          max_storage_cubic_feet?: number | null
          monthly_fee?: number | null
          name?: string
          phone?: string | null
          storage_plan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          client_product_id: string
          company_id: string
          created_at: string
          id: string
          last_movement_date: string | null
          location_bin: string | null
          location_code: string | null
          location_row: string | null
          location_zone: string | null
          movement_type: string | null
          notes: string | null
          quantity: number
          updated_at: string
        }
        Insert: {
          client_product_id: string
          company_id: string
          created_at?: string
          id?: string
          last_movement_date?: string | null
          location_bin?: string | null
          location_code?: string | null
          location_row?: string | null
          location_zone?: string | null
          movement_type?: string | null
          notes?: string | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          client_product_id?: string
          company_id?: string
          created_at?: string
          id?: string
          last_movement_date?: string | null
          location_bin?: string | null
          location_code?: string | null
          location_row?: string | null
          location_zone?: string | null
          movement_type?: string | null
          notes?: string | null
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_client_product_id_fkey"
            columns: ["client_product_id"]
            isOneToOne: false
            referencedRelation: "client_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_client_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
    Enums: {},
  },
} as const
