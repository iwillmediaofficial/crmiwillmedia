export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          bucket_name: string
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size_bytes: number
          id: string
          mime_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          bucket_name: string
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size_bytes?: number
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          bucket_name?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_occurrences: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          currency: string
          due_date: string
          id: string
          paid_date: string | null
          period_end_date: string
          period_start_date: string
          recurring_bill_id: string
          remarks: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          paid_date?: string | null
          period_end_date: string
          period_start_date: string
          recurring_bill_id: string
          remarks?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          paid_date?: string | null
          period_end_date?: string
          period_start_date?: string
          recurring_bill_id?: string
          remarks?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_occurrences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_occurrences_recurring_bill_id_fkey"
            columns: ["recurring_bill_id"]
            isOneToOne: false
            referencedRelation: "recurring_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_records: {
        Row: {
          amount: number
          assigned_staff_id: string | null
          bill_title: string
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          due_date: string
          id: string
          paid_date: string | null
          recurring_occurrence_id: string | null
          remarks: string | null
          status: string
          updated_at: string
          work_item_id: string | null
        }
        Insert: {
          amount: number
          assigned_staff_id?: string | null
          bill_title: string
          client_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date: string
          id?: string
          paid_date?: string | null
          recurring_occurrence_id?: string | null
          remarks?: string | null
          status?: string
          updated_at?: string
          work_item_id?: string | null
        }
        Update: {
          amount?: number
          assigned_staff_id?: string | null
          bill_title?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string
          id?: string
          paid_date?: string | null
          recurring_occurrence_id?: string | null
          remarks?: string | null
          status?: string
          updated_at?: string
          work_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_records_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_recurring_occurrence_id_fkey"
            columns: ["recurring_occurrence_id"]
            isOneToOne: false
            referencedRelation: "billing_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          company_name: string
          contact_person: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          logo_url: string | null
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_person: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_person?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_staff_id: string | null
          campaign_details: string | null
          created_at: string
          created_by: string | null
          email: string | null
          follow_up_date: string | null
          id: string
          lead_source: string
          name: string
          phone: string
          remarks: string | null
          status: string
          updated_at: string
          converted_client_id: string | null
        }
        Insert: {
          assigned_staff_id?: string | null
          campaign_details?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          follow_up_date?: string | null
          id?: string
          lead_source?: string
          name: string
          phone: string
          remarks?: string | null
          status?: string
          updated_at?: string
          converted_client_id?: string | null
        }
        Update: {
          assigned_staff_id?: string | null
          campaign_details?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          follow_up_date?: string | null
          id?: string
          lead_source?: string
          name?: string
          phone?: string
          remarks?: string | null
          status?: string
          updated_at?: string
          converted_client_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link_url: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          department: string | null
          designation: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      recurring_bills: {
        Row: {
          amount: number
          assigned_staff_id: string | null
          bill_name: string
          billing_day: number
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          frequency: string
          id: string
          is_active: boolean
          remarks: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          amount: number
          assigned_staff_id?: string | null
          bill_name: string
          billing_day: number
          client_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          frequency?: string
          id?: string
          is_active?: boolean
          remarks?: string | null
          start_date?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          assigned_staff_id?: string | null
          bill_name?: string
          billing_day?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          frequency?: string
          id?: string
          is_active?: boolean
          remarks?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_bills_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_items: {
        Row: {
          assigned_date: string
          assigned_staff_id: string
          billing_status: string
          is_billable: boolean
          billable_amount: number
          currency: string
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          pending_expected_resume_date: string | null
          pending_reason: string | null
          priority: string
          remarks: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_date?: string
          assigned_staff_id: string
          billing_status?: string
          is_billable?: boolean
          billable_amount?: number
          currency?: string
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          pending_expected_resume_date?: string | null
          pending_reason?: string | null
          priority?: string
          remarks?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_date?: string
          assigned_staff_id?: string
          billing_status?: string
          is_billable?: boolean
          billable_amount?: number
          currency?: string
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          pending_expected_resume_date?: string | null
          pending_reason?: string | null
          priority?: string
          remarks?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_items_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_time_entries: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          remarks: string | null
          staff_id: string
          started_at: string
          stopped_at: string | null
          work_item_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          remarks?: string | null
          staff_id: string
          started_at?: string
          stopped_at?: string | null
          work_item_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          remarks?: string | null
          staff_id?: string
          started_at?: string
          stopped_at?: string | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_time_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_time_entries_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
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

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type WorkItem = Database['public']['Tables']['work_items']['Row']
export type WorkTimeEntry = Database['public']['Tables']['work_time_entries']['Row']
export type RecurringBill = Database['public']['Tables']['recurring_bills']['Row']
export type BillingOccurrence = Database['public']['Tables']['billing_occurrences']['Row']
export type BillingRecord = Database['public']['Tables']['billing_records']['Row']
export type Attachment = Database['public']['Tables']['attachments']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type AppSetting = Database['public']['Tables']['app_settings']['Row']
