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
      analytics_events: {
        Row: {
          created_at: string | null
          id: number
          name: string
          portal_user_id: string | null
          props: Json | null
          session_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          portal_user_id?: string | null
          props?: Json | null
          session_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          portal_user_id?: string | null
          props?: Json | null
          session_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string
          company_name: string
          created_at: string
          email: string | null
          id: string
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cnpj: string
          company_name: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cnpj?: string
          company_name?: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_main_contact: boolean | null
          percentage: number | null
          person_id: string
          role: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_main_contact?: boolean | null
          percentage?: number | null
          person_id: string
          role: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_main_contact?: boolean | null
          percentage?: number | null
          person_id?: string
          role?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      consumers: {
        Row: {
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          consumer_id: string
          created_at: string | null
          current_value: number | null
          id: string
          number: string
          original_value: number | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          consumer_id: string
          created_at?: string | null
          current_value?: number | null
          id?: string
          number: string
          original_value?: number | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          consumer_id?: string
          created_at?: string | null
          current_value?: number | null
          id?: string
          number?: string
          original_value?: number | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          amount: number
          contract_id: string
          created_at: string | null
          due_date: string | null
          id: string
          meta: Json | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          meta?: Json | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          meta?: Json | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      persons: {
        Row: {
          cpf: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      portal_authentications: {
        Row: {
          attempted_at: string
          auth_channel: string | null
          auth_method: string
          failure_reason: string | null
          id: string
          identifier: string | null
          metadata: Json | null
          portal_user_id: string | null
          session_id: string | null
          success: boolean
          tenant_id: string
        }
        Insert: {
          attempted_at?: string
          auth_channel?: string | null
          auth_method: string
          failure_reason?: string | null
          id?: string
          identifier?: string | null
          metadata?: Json | null
          portal_user_id?: string | null
          session_id?: string | null
          success?: boolean
          tenant_id: string
        }
        Update: {
          attempted_at?: string
          auth_channel?: string | null
          auth_method?: string
          failure_reason?: string | null
          id?: string
          identifier?: string | null
          metadata?: Json | null
          portal_user_id?: string | null
          session_id?: string | null
          success?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_authentications_portal_user_id_fkey"
            columns: ["portal_user_id"]
            isOneToOne: false
            referencedRelation: "portal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_authentications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "portal_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_authentications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_configs: {
        Row: {
          login_methods: Json
          payments: Json
          tenant_id: string
          tokens: Json
          type: string
          updated_at: string | null
        }
        Insert: {
          login_methods: Json
          payments: Json
          tenant_id: string
          tokens: Json
          type: string
          updated_at?: string | null
        }
        Update: {
          login_methods?: Json
          payments?: Json
          tenant_id?: string
          tokens?: Json
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_sessions: {
        Row: {
          auth_method: string | null
          ended_at: string | null
          id: string
          ip_address: unknown | null
          is_authenticated: boolean | null
          last_activity_at: string
          pages_visited: Json | null
          portal_user_id: string | null
          session_id: string
          started_at: string
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          auth_method?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_authenticated?: boolean | null
          last_activity_at?: string
          pages_visited?: Json | null
          portal_user_id?: string | null
          session_id: string
          started_at?: string
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          auth_method?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_authenticated?: boolean | null
          last_activity_at?: string
          pages_visited?: Json | null
          portal_user_id?: string | null
          session_id?: string
          started_at?: string
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_sessions_portal_user_id_fkey"
            columns: ["portal_user_id"]
            isOneToOne: false
            referencedRelation: "portal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_settings: {
        Row: {
          created_at: string | null
          custom_domain: string | null
          login_modes: Json | null
          mode: string | null
          subdomain: string | null
          subpath: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_domain?: string | null
          login_modes?: Json | null
          mode?: string | null
          subdomain?: string | null
          subpath?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_domain?: string | null
          login_modes?: Json | null
          mode?: string | null
          subdomain?: string | null
          subpath?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_users: {
        Row: {
          auth_method: string | null
          cnpj: string | null
          company_id: string | null
          company_name: string | null
          contract_number: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          is_authenticated: boolean | null
          last_login_at: string | null
          legal_representative_name: string | null
          metadata: Json | null
          name: string | null
          person_id: string | null
          phone: string | null
          tenant_id: string
          updated_at: string
          user_type: string | null
        }
        Insert: {
          auth_method?: string | null
          cnpj?: string | null
          company_id?: string | null
          company_name?: string | null
          contract_number?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_authenticated?: boolean | null
          last_login_at?: string | null
          legal_representative_name?: string | null
          metadata?: Json | null
          name?: string | null
          person_id?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          auth_method?: string | null
          cnpj?: string | null
          company_id?: string | null
          company_name?: string | null
          contract_number?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_authenticated?: boolean | null
          last_login_at?: string | null
          legal_representative_name?: string | null
          metadata?: Json | null
          name?: string | null
          person_id?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_users_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: number
          key: string
          name: string
        }
        Insert: {
          id?: number
          key: string
          name: string
        }
        Update: {
          id?: number
          key?: string
          name?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          cnpj: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          nome: string
          site_oficial: string | null
          site_url: string | null
          slug: string
          theme: Json | null
          updated_at: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          nome: string
          site_oficial?: string | null
          site_url?: string | null
          slug: string
          theme?: Json | null
          updated_at?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          nome?: string
          site_oficial?: string | null
          site_url?: string | null
          slug?: string
          theme?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          role_id: number
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role_id: number
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          role_id?: number
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_clients: {
        Row: {
          id: string
          wallet_id: string
          document: string
          type: string
          created_at: string | null
        }
        Insert: {
          id?: string
          wallet_id: string
          document: string
          type: string
          created_at?: string | null
        }
        Update: {
          id?: string
          wallet_id?: string
          document?: string
          type?: string
          created_at?: string | null
        }
        Relationships: []
      },
      wallets: {
        Row: {
          id: string
          name: string
          type: string
          tenant_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          tenant_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          tenant_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { _role: string; _tenant_id?: string; _user_id: string }
        Returns: boolean
      }
      reset_demo_data: {
        Args: { _tenant_id: string }
        Returns: undefined
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
