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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          admin_user_id: string
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string | null
          viewed_client_id: string
        }
        Insert: {
          admin_user_id: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          viewed_client_id: string
        }
        Update: {
          admin_user_id?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          viewed_client_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_viewed_client_id_fkey"
            columns: ["viewed_client_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_actions: {
        Row: {
          action_data: Json
          action_type: string
          created_at: string
          executed_at: string | null
          executed_by: string | null
          id: string
          message_id: string | null
          status: string | null
          table_name: string
        }
        Insert: {
          action_data: Json
          action_type: string
          created_at?: string
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          message_id?: string | null
          status?: string | null
          table_name: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          created_at?: string
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          message_id?: string | null
          status?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_actions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          company_id: string | null
          context_type: string | null
          conversation_title: string | null
          created_at: string
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          context_type?: string | null
          conversation_title?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          context_type?: string | null
          conversation_title?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          reasoning_content: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reasoning_content?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reasoning_content?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_customers: {
        Row: {
          company_id: string
          created_at: string | null
          customer_name: string
          id: string
          is_active: boolean | null
          location: string
          phone: string
          representative_name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          customer_name: string
          id?: string
          is_active?: boolean | null
          location: string
          phone: string
          representative_name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          customer_name?: string
          id?: string
          is_active?: boolean | null
          location?: string
          phone?: string
          representative_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_suppliers: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          location: string
          phone: string
          representative_name: string
          supplier_name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location: string
          phone: string
          representative_name: string
          supplier_name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string
          phone?: string
          representative_name?: string
          supplier_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      check_in_requests: {
        Row: {
          amended_products: Json | null
          amendment_notes: string | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          rejection_reason: string | null
          request_number: string
          request_type: string | null
          requested_by: string
          requested_products: Json
          required_date: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          supplier_id: string | null
          updated_at: string
          was_amended: boolean | null
        }
        Insert: {
          amended_products?: Json | null
          amendment_notes?: string | null
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          request_number: string
          request_type?: string | null
          requested_by: string
          requested_products?: Json
          required_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
          was_amended?: boolean | null
        }
        Update: {
          amended_products?: Json | null
          amendment_notes?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          request_number?: string
          request_type?: string | null
          requested_by?: string
          requested_products?: Json
          required_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
          was_amended?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "check_in_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "b2b_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      check_out_requests: {
        Row: {
          company_id: string
          created_at: string
          customer_id: string | null
          delivery_date: string | null
          id: string
          notes: string | null
          rejection_reason: string | null
          request_number: string
          request_type: string | null
          requested_by: string
          requested_items: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_id?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          request_number: string
          request_type?: string | null
          requested_by: string
          requested_items?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_id?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          request_number?: string
          request_type?: string | null
          requested_by?: string
          requested_items?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_out_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_out_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "b2b_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      client_activity_logs: {
        Row: {
          activity_description: string
          activity_type: string
          company_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_description: string
          activity_type: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_description?: string
          activity_type?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_allocations: {
        Row: {
          allocated_space: number | null
          assigned_floor_zone_id: string | null
          assigned_row_id: string | null
          company_id: string
          created_at: string | null
          id: string
          location_type: Database["public"]["Enums"]["location_type"]
        }
        Insert: {
          allocated_space?: number | null
          assigned_floor_zone_id?: string | null
          assigned_row_id?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          location_type: Database["public"]["Enums"]["location_type"]
        }
        Update: {
          allocated_space?: number | null
          assigned_floor_zone_id?: string | null
          assigned_row_id?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          location_type?: Database["public"]["Enums"]["location_type"]
        }
        Relationships: [
          {
            foreignKeyName: "client_allocations_assigned_floor_zone_id_fkey"
            columns: ["assigned_floor_zone_id"]
            isOneToOne: false
            referencedRelation: "warehouse_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_allocations_assigned_row_id_fkey"
            columns: ["assigned_row_id"]
            isOneToOne: false
            referencedRelation: "warehouse_rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_allocations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_order_items: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          order_id: string
          product_id: string
          quantity: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          quantity?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "client_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "client_products"
            referencedColumns: ["id"]
          },
        ]
      }
      client_orders: {
        Row: {
          company_id: string
          completed_date: string | null
          created_at: string | null
          id: string
          notes: string | null
          order_number: string
          order_type: Database["public"]["Enums"]["order_type"] | null
          requested_date: string | null
          shipping_address: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_items: number | null
          total_value: number | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          completed_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_number: string
          order_type?: Database["public"]["Enums"]["order_type"] | null
          requested_date?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_items?: number | null
          total_value?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          completed_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          order_type?: Database["public"]["Enums"]["order_type"] | null
          requested_date?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_items?: number | null
          total_value?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_products: {
        Row: {
          company_id: string
          created_at: string | null
          customer_id: string | null
          id: string
          is_active: boolean | null
          name: string
          sku: string | null
          supplier_id: string | null
          updated_at: string | null
          variants: Json | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sku?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          variants?: Json | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sku?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "client_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "b2b_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "b2b_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          assigned_floor_zone_id: string | null
          assigned_row_id: string | null
          billing_address: string | null
          client_code: string | null
          client_sequence_number: number | null
          client_type: string | null
          contact_email: string | null
          contact_phone: string | null
          contract_document_url: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          location_type: Database["public"]["Enums"]["location_type"] | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_floor_zone_id?: string | null
          assigned_row_id?: string | null
          billing_address?: string | null
          client_code?: string | null
          client_sequence_number?: number | null
          client_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contract_document_url?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_floor_zone_id?: string | null
          assigned_row_id?: string | null
          billing_address?: string | null
          client_code?: string | null
          client_sequence_number?: number | null
          client_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contract_document_url?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_companies_floor_zone"
            columns: ["assigned_floor_zone_id"]
            isOneToOne: false
            referencedRelation: "warehouse_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_companies_row"
            columns: ["assigned_row_id"]
            isOneToOne: false
            referencedRelation: "warehouse_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          batch_number: string | null
          company_id: string
          expiry_date: string | null
          id: string
          last_updated: string | null
          location_id: string | null
          product_id: string
          quantity: number
          received_date: string | null
        }
        Insert: {
          batch_number?: string | null
          company_id: string
          expiry_date?: string | null
          id?: string
          last_updated?: string | null
          location_id?: string | null
          product_id: string
          quantity?: number
          received_date?: string | null
        }
        Update: {
          batch_number?: string | null
          company_id?: string
          expiry_date?: string | null
          id?: string
          last_updated?: string | null
          location_id?: string | null
          product_id?: string
          quantity?: number
          received_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "client_products"
            referencedColumns: ["id"]
          },
        ]
      }
      jarde_reports: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          items_with_variance: number | null
          notes: string | null
          report_data: Json
          report_date: string
          start_date: string
          total_products: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          items_with_variance?: number | null
          notes?: string | null
          report_data: Json
          report_date?: string
          start_date: string
          total_products?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          items_with_variance?: number | null
          notes?: string | null
          report_data?: Json
          report_date?: string
          start_date?: string
          total_products?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jarde_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          company_id: string | null
          content: string
          created_at: string | null
          id: string
          message_type: Database["public"]["Enums"]["message_type"] | null
          parent_message_id: string | null
          priority: Database["public"]["Enums"]["message_priority"] | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string | null
          status: string | null
          subject: string
        }
        Insert: {
          company_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          parent_message_id?: string | null
          priority?: Database["public"]["Enums"]["message_priority"] | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          parent_message_id?: string | null
          priority?: Database["public"]["Enums"]["message_priority"] | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
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
      shipment_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          shipment_id: string
          variant_attribute: string | null
          variant_value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          quantity: number
          shipment_id: string
          variant_attribute?: string | null
          variant_value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          shipment_id?: string
          variant_attribute?: string | null
          variant_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "client_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier: string | null
          company_id: string
          created_at: string | null
          destination_address: string
          destination_contact: string | null
          destination_phone: string | null
          id: string
          notes: string | null
          order_id: string | null
          shipment_date: string
          shipment_number: string
          shipped_by: string | null
          status: string
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          carrier?: string | null
          company_id: string
          created_at?: string | null
          destination_address: string
          destination_contact?: string | null
          destination_phone?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          shipment_date?: string
          shipment_number: string
          shipped_by?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier?: string | null
          company_id?: string
          created_at?: string | null
          destination_address?: string
          destination_contact?: string | null
          destination_phone?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          shipment_date?: string
          shipment_number?: string
          shipped_by?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "client_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_shipped_by_fkey"
            columns: ["shipped_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warehouse_rows: {
        Row: {
          assigned_company_id: string | null
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_occupied: boolean | null
          row_number: string
          zone_id: string | null
        }
        Insert: {
          assigned_company_id?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_occupied?: boolean | null
          row_number: string
          zone_id?: string | null
        }
        Update: {
          assigned_company_id?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_occupied?: boolean | null
          row_number?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_warehouse_rows_company"
            columns: ["assigned_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_rows_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "warehouse_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_zones: {
        Row: {
          code: string | null
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          zone_type: string
        }
        Insert: {
          code?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          zone_type: string
        }
        Update: {
          code?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          zone_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_check_in_request_number: { Args: never; Returns: string }
      generate_check_out_request_number: { Args: never; Returns: string }
      generate_client_code: { Args: never; Returns: string }
      generate_shipment_number: { Args: never; Returns: string }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "warehouse_manager"
        | "client"
        | "super_admin"
        | "logistics_coordinator"
        | "client_admin"
        | "client_user"
      location_type: "floor_zone" | "shelf_row"
      message_priority: "low" | "normal" | "high" | "urgent"
      message_type: "general" | "billing" | "inventory" | "support"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      order_type: "inbound" | "outbound"
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
      app_role: [
        "admin",
        "warehouse_manager",
        "client",
        "super_admin",
        "logistics_coordinator",
        "client_admin",
        "client_user",
      ],
      location_type: ["floor_zone", "shelf_row"],
      message_priority: ["low", "normal", "high", "urgent"],
      message_type: ["general", "billing", "inventory", "support"],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      order_type: ["inbound", "outbound"],
    },
  },
} as const
