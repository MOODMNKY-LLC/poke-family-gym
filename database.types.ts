export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          created_at: string
          details: Json
          family_id: string
          id: string
          member_id: string
          timestamp: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: Json
          family_id: string
          id?: string
          member_id: string
          timestamp?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: Json
          family_id?: string
          id?: string
          member_id?: string
          timestamp?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "family_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      apikey: {
        Row: {
          apiKey: string
          apiSecret: string
          id: string
          keyName: string
          updatedDate: string
        }
        Insert: {
          apiKey: string
          apiSecret: string
          id?: string
          keyName: string
          updatedDate?: string
        }
        Update: {
          apiKey?: string
          apiSecret?: string
          id?: string
          keyName?: string
          updatedDate?: string
        }
        Relationships: []
      }
      assistant: {
        Row: {
          createdDate: string
          credential: string
          details: string
          iconSrc: string | null
          id: string
          type: string | null
          updatedDate: string
        }
        Insert: {
          createdDate?: string
          credential: string
          details: string
          iconSrc?: string | null
          id?: string
          type?: string | null
          updatedDate?: string
        }
        Update: {
          createdDate?: string
          credential?: string
          details?: string
          iconSrc?: string | null
          id?: string
          type?: string | null
          updatedDate?: string
        }
        Relationships: []
      }
      chat_flow: {
        Row: {
          analytic: string | null
          apiConfig: string | null
          apikeyid: string | null
          category: string | null
          chatbotConfig: string | null
          createdDate: string
          deployed: boolean | null
          flowData: string
          followUpPrompts: string | null
          id: string
          isPublic: boolean | null
          name: string
          speechToText: string | null
          type: string | null
          updatedDate: string
        }
        Insert: {
          analytic?: string | null
          apiConfig?: string | null
          apikeyid?: string | null
          category?: string | null
          chatbotConfig?: string | null
          createdDate?: string
          deployed?: boolean | null
          flowData: string
          followUpPrompts?: string | null
          id?: string
          isPublic?: boolean | null
          name: string
          speechToText?: string | null
          type?: string | null
          updatedDate?: string
        }
        Update: {
          analytic?: string | null
          apiConfig?: string | null
          apikeyid?: string | null
          category?: string | null
          chatbotConfig?: string | null
          createdDate?: string
          deployed?: boolean | null
          flowData?: string
          followUpPrompts?: string | null
          id?: string
          isPublic?: boolean | null
          name?: string
          speechToText?: string | null
          type?: string | null
          updatedDate?: string
        }
        Relationships: []
      }
      chat_message: {
        Row: {
          action: string | null
          agentReasoning: string | null
          artifacts: string | null
          chatflowid: string
          chatId: string
          chatType: string
          content: string
          createdDate: string
          fileAnnotations: string | null
          fileUploads: string | null
          followUpPrompts: string | null
          id: string
          leadEmail: string | null
          memoryType: string | null
          role: string
          sessionId: string | null
          sourceDocuments: string | null
          usedTools: string | null
        }
        Insert: {
          action?: string | null
          agentReasoning?: string | null
          artifacts?: string | null
          chatflowid: string
          chatId: string
          chatType?: string
          content: string
          createdDate?: string
          fileAnnotations?: string | null
          fileUploads?: string | null
          followUpPrompts?: string | null
          id?: string
          leadEmail?: string | null
          memoryType?: string | null
          role: string
          sessionId?: string | null
          sourceDocuments?: string | null
          usedTools?: string | null
        }
        Update: {
          action?: string | null
          agentReasoning?: string | null
          artifacts?: string | null
          chatflowid?: string
          chatId?: string
          chatType?: string
          content?: string
          createdDate?: string
          fileAnnotations?: string | null
          fileUploads?: string | null
          followUpPrompts?: string | null
          id?: string
          leadEmail?: string | null
          memoryType?: string | null
          role?: string
          sessionId?: string | null
          sourceDocuments?: string | null
          usedTools?: string | null
        }
        Relationships: []
      }
      chat_message_feedback: {
        Row: {
          chatflowid: string
          chatId: string
          content: string | null
          createdDate: string
          id: string
          messageId: string
          rating: string
        }
        Insert: {
          chatflowid: string
          chatId: string
          content?: string | null
          createdDate?: string
          id?: string
          messageId: string
          rating: string
        }
        Update: {
          chatflowid?: string
          chatId?: string
          content?: string | null
          createdDate?: string
          id?: string
          messageId?: string
          rating?: string
        }
        Relationships: []
      }
      credential: {
        Row: {
          createdDate: string
          credentialName: string
          encryptedData: string
          id: string
          name: string
          updatedDate: string
        }
        Insert: {
          createdDate?: string
          credentialName: string
          encryptedData: string
          id?: string
          name: string
          updatedDate?: string
        }
        Update: {
          createdDate?: string
          credentialName?: string
          encryptedData?: string
          id?: string
          name?: string
          updatedDate?: string
        }
        Relationships: []
      }
      custom_template: {
        Row: {
          badge: string | null
          createdDate: string
          description: string | null
          flowData: string
          framework: string | null
          id: string
          name: string
          type: string | null
          updatedDate: string
          usecases: string | null
        }
        Insert: {
          badge?: string | null
          createdDate?: string
          description?: string | null
          flowData: string
          framework?: string | null
          id?: string
          name: string
          type?: string | null
          updatedDate?: string
          usecases?: string | null
        }
        Update: {
          badge?: string | null
          createdDate?: string
          description?: string | null
          flowData?: string
          framework?: string | null
          id?: string
          name?: string
          type?: string | null
          updatedDate?: string
          usecases?: string | null
        }
        Relationships: []
      }
      document_store: {
        Row: {
          createdDate: string
          description: string | null
          embeddingConfig: string | null
          id: string
          loaders: string | null
          name: string
          recordManagerConfig: string | null
          status: string
          updatedDate: string
          vectorStoreConfig: string | null
          whereUsed: string | null
        }
        Insert: {
          createdDate?: string
          description?: string | null
          embeddingConfig?: string | null
          id?: string
          loaders?: string | null
          name: string
          recordManagerConfig?: string | null
          status: string
          updatedDate?: string
          vectorStoreConfig?: string | null
          whereUsed?: string | null
        }
        Update: {
          createdDate?: string
          description?: string | null
          embeddingConfig?: string | null
          id?: string
          loaders?: string | null
          name?: string
          recordManagerConfig?: string | null
          status?: string
          updatedDate?: string
          vectorStoreConfig?: string | null
          whereUsed?: string | null
        }
        Relationships: []
      }
      document_store_file_chunk: {
        Row: {
          chunkNo: number
          docId: string
          id: string
          metadata: string | null
          pageContent: string | null
          storeId: string
        }
        Insert: {
          chunkNo: number
          docId: string
          id?: string
          metadata?: string | null
          pageContent?: string | null
          storeId: string
        }
        Update: {
          chunkNo?: number
          docId?: string
          id?: string
          metadata?: string | null
          pageContent?: string | null
          storeId?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id: string
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      family_admins: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_member_chatflows: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          chatflow_id: string
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          id: number
          is_active: boolean
          member_id: string
          role: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          chatflow_id: string
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: never
          is_active?: boolean
          member_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          chatflow_id?: string
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: never
          is_active?: boolean
          member_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          avatar_url: string | null
          badges_earned: number | null
          birth_date: string | null
          chatflow_id: string | null
          created_at: string
          current_status: string | null
          display_name: string
          experience_points: number | null
          family_id: string
          favorite_color: string | null
          full_name: string
          id: string
          personal_motto: string | null
          pin: string | null
          role_id: number
          starter_pokemon_form_id: number | null
          starter_pokemon_friendship: number | null
          starter_pokemon_move_1: string | null
          starter_pokemon_move_2: string | null
          starter_pokemon_move_3: string | null
          starter_pokemon_move_4: string | null
          starter_pokemon_nature: string | null
          starter_pokemon_nickname: string | null
          starter_pokemon_obtained_at: string | null
          starter_pokemon_ribbons: string[] | null
          token_balance: number | null
          trainer_class: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          badges_earned?: number | null
          birth_date?: string | null
          chatflow_id?: string | null
          created_at?: string
          current_status?: string | null
          display_name: string
          experience_points?: number | null
          family_id: string
          favorite_color?: string | null
          full_name: string
          id?: string
          personal_motto?: string | null
          pin?: string | null
          role_id: number
          starter_pokemon_form_id?: number | null
          starter_pokemon_friendship?: number | null
          starter_pokemon_move_1?: string | null
          starter_pokemon_move_2?: string | null
          starter_pokemon_move_3?: string | null
          starter_pokemon_move_4?: string | null
          starter_pokemon_nature?: string | null
          starter_pokemon_nickname?: string | null
          starter_pokemon_obtained_at?: string | null
          starter_pokemon_ribbons?: string[] | null
          token_balance?: number | null
          trainer_class?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          badges_earned?: number | null
          birth_date?: string | null
          chatflow_id?: string | null
          created_at?: string
          current_status?: string | null
          display_name?: string
          experience_points?: number | null
          family_id?: string
          favorite_color?: string | null
          full_name?: string
          id?: string
          personal_motto?: string | null
          pin?: string | null
          role_id?: number
          starter_pokemon_form_id?: number | null
          starter_pokemon_friendship?: number | null
          starter_pokemon_move_1?: string | null
          starter_pokemon_move_2?: string | null
          starter_pokemon_move_3?: string | null
          starter_pokemon_move_4?: string | null
          starter_pokemon_nature?: string | null
          starter_pokemon_nickname?: string | null
          starter_pokemon_obtained_at?: string | null
          starter_pokemon_ribbons?: string[] | null
          token_balance?: number | null
          trainer_class?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_chatflow_id_fkey"
            columns: ["chatflow_id"]
            isOneToOne: false
            referencedRelation: "chat_flow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "family_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_starter_pokemon_form_id_fkey"
            columns: ["starter_pokemon_form_id"]
            isOneToOne: false
            referencedRelation: "pokemon_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      family_pokedex: {
        Row: {
          caught_count: number | null
          created_at: string | null
          family_id: string | null
          first_caught_at: string
          id: number
          is_favorite: boolean | null
          nickname: string | null
          notes: string | null
          pokemon_form_id: number | null
          updated_at: string | null
        }
        Insert: {
          caught_count?: number | null
          created_at?: string | null
          family_id?: string | null
          first_caught_at: string
          id?: number
          is_favorite?: boolean | null
          nickname?: string | null
          notes?: string | null
          pokemon_form_id?: number | null
          updated_at?: string | null
        }
        Update: {
          caught_count?: number | null
          created_at?: string | null
          family_id?: string | null
          first_caught_at?: string
          id?: number
          is_favorite?: boolean | null
          nickname?: string | null
          notes?: string | null
          pokemon_form_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_pokedex_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "family_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_pokedex_pokemon_form_id_fkey"
            columns: ["pokemon_form_id"]
            isOneToOne: false
            referencedRelation: "pokemon_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      family_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          family_motto: string | null
          family_name: string
          id: string
          locale: string
          settings: Json | null
          theme_color: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          family_motto?: string | null
          family_name: string
          id: string
          locale?: string
          settings?: Json | null
          theme_color?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          family_motto?: string | null
          family_name?: string
          id?: string
          locale?: string
          settings?: Json | null
          theme_color?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          created_at: string | null
          id: number
          main_region_id: number | null
          name: string
          release_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: number
          main_region_id?: number | null
          name: string
          release_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          main_region_id?: number | null
          name?: string
          release_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      languages: {
        Row: {
          created_at: string | null
          id: number
          iso3166: string | null
          iso639: string | null
          name: string
          official: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: number
          iso3166?: string | null
          iso639?: string | null
          name: string
          official: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          iso3166?: string | null
          iso639?: string | null
          name?: string
          official?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      lead: {
        Row: {
          chatflowid: string
          chatId: string
          createdDate: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
        }
        Insert: {
          chatflowid: string
          chatId: string
          createdDate?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
        }
        Update: {
          chatflowid?: string
          chatId?: string
          createdDate?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          id: number
          name: string
          timestamp: number
        }
        Insert: {
          id?: number
          name: string
          timestamp: number
        }
        Update: {
          id?: number
          name?: string
          timestamp?: number
        }
        Relationships: []
      }
      ollama_documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id: string
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      pokeball_transactions: {
        Row: {
          amount: number
          created_at: string
          details: Json
          family_id: string
          id: string
          member_id: string
          reason: string
        }
        Insert: {
          amount: number
          created_at?: string
          details?: Json
          family_id: string
          id?: string
          member_id: string
          reason: string
        }
        Update: {
          amount?: number
          created_at?: string
          details?: Json
          family_id?: string
          id?: string
          member_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "pokeball_transactions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "family_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pokeball_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      pokemon_forms: {
        Row: {
          created_at: string | null
          form_name: string | null
          id: number
          is_default: boolean | null
          name: string
          species_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          form_name?: string | null
          id: number
          is_default?: boolean | null
          name: string
          species_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          form_name?: string | null
          id?: number
          is_default?: boolean | null
          name?: string
          species_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pokemon_forms_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "pokemon_species"
            referencedColumns: ["id"]
          },
        ]
      }
      pokemon_species: {
        Row: {
          created_at: string | null
          generation_id: number | null
          habitat: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          generation_id?: number | null
          habitat?: string | null
          id: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          generation_id?: number | null
          habitat?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pokemon_species_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      starter_pokemon_config: {
        Row: {
          created_at: string
          generation_id: number
          id: number
          is_active: boolean
          is_legendary: boolean | null
          pokemon_form_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          generation_id: number
          id?: never
          is_active?: boolean
          is_legendary?: boolean | null
          pokemon_form_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          generation_id?: number
          id?: never
          is_active?: boolean
          is_legendary?: boolean | null
          pokemon_form_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "starter_pokemon_config_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starter_pokemon_config_pokemon_form_id_fkey"
            columns: ["pokemon_form_id"]
            isOneToOne: false
            referencedRelation: "pokemon_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      task_history: {
        Row: {
          completed_at: string
          completed_by: string
          details: Json
          id: string
          pokeballs_earned: number
          task_id: string
        }
        Insert: {
          completed_at?: string
          completed_by: string
          details?: Json
          id?: string
          pokeballs_earned: number
          task_id: string
        }
        Update: {
          completed_at?: string
          completed_by?: string
          details?: Json
          id?: string
          pokeballs_earned?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_history_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          due_date: string | null
          family_id: string
          id: string
          pokeball_reward: number
          recurring_details: Json | null
          recurring_type: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          family_id: string
          id?: string
          pokeball_reward?: number
          recurring_details?: Json | null
          recurring_type?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          family_id?: string
          id?: string
          pokeball_reward?: number
          recurring_details?: Json | null
          recurring_type?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "family_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          family_member_id: string
          id: number
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          family_member_id: string
          id?: never
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          family_member_id?: string
          id?: never
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_transactions_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tool: {
        Row: {
          color: string
          createdDate: string
          description: string
          func: string | null
          iconSrc: string | null
          id: string
          name: string
          schema: string | null
          updatedDate: string
        }
        Insert: {
          color: string
          createdDate?: string
          description: string
          func?: string | null
          iconSrc?: string | null
          id?: string
          name: string
          schema?: string | null
          updatedDate?: string
        }
        Update: {
          color?: string
          createdDate?: string
          description?: string
          func?: string | null
          iconSrc?: string | null
          id?: string
          name?: string
          schema?: string | null
          updatedDate?: string
        }
        Relationships: []
      }
      upsert_history: {
        Row: {
          chatflowid: string
          date: string
          flowData: string
          id: string
          result: string
        }
        Insert: {
          chatflowid: string
          date?: string
          flowData: string
          id?: string
          result: string
        }
        Update: {
          chatflowid?: string
          date?: string
          flowData?: string
          id?: string
          result?: string
        }
        Relationships: []
      }
      variable: {
        Row: {
          createdDate: string
          id: string
          name: string
          type: string | null
          updatedDate: string
          value: string
        }
        Insert: {
          createdDate?: string
          id?: string
          name: string
          type?: string | null
          updatedDate?: string
          value: string
        }
        Update: {
          createdDate?: string
          id?: string
          name?: string
          type?: string | null
          updatedDate?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      akeys: {
        Args: {
          "": unknown
        }
        Returns: string[]
      }
      assign_chatflow_to_member: {
        Args: {
          p_member_id: string
          p_chatflow_id: string
          p_role?: string
        }
        Returns: {
          assigned_at: string
          assigned_by: string | null
          chatflow_id: string
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          id: number
          is_active: boolean
          member_id: string
          role: string
          updated_at: string
        }
      }
      avals: {
        Args: {
          "": unknown
        }
        Returns: string[]
      }
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      each: {
        Args: {
          hs: unknown
        }
        Returns: Record<string, unknown>[]
      }
      ghstore_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ghstore_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ghstore_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ghstore_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      ghstore_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hstore:
        | {
            Args: {
              "": string[]
            }
            Returns: unknown
          }
        | {
            Args: {
              "": Record<string, unknown>
            }
            Returns: unknown
          }
      hstore_hash: {
        Args: {
          "": unknown
        }
        Returns: number
      }
      hstore_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hstore_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hstore_recv: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hstore_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hstore_subscript_handler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hstore_to_array: {
        Args: {
          "": unknown
        }
        Returns: string[]
      }
      hstore_to_json: {
        Args: {
          "": unknown
        }
        Returns: Json
      }
      hstore_to_json_loose: {
        Args: {
          "": unknown
        }
        Returns: Json
      }
      hstore_to_jsonb: {
        Args: {
          "": unknown
        }
        Returns: Json
      }
      hstore_to_jsonb_loose: {
        Args: {
          "": unknown
        }
        Returns: Json
      }
      hstore_to_matrix: {
        Args: {
          "": unknown
        }
        Returns: string[]
      }
      hstore_version_diag: {
        Args: {
          "": unknown
        }
        Returns: number
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      match_ollama_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      skeys: {
        Args: {
          "": unknown
        }
        Returns: string[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      svals: {
        Args: {
          "": unknown
        }
        Returns: string[]
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

