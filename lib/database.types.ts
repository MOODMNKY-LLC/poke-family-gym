export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chat_flow: {
        Row: {
          id: string
          name: string
          flowData: string
          deployed: boolean | null
          isPublic: boolean | null
          apikeyid: string | null
          chatbotConfig: string | null
          category: string | null
          speechToText: string | null
          type: string | null
          followUpPrompts: string | null
          createdDate: string
          updatedDate: string
          apiConfig: string | null
          analytic: string | null
        }
        Insert: {
          id?: string
          name: string
          flowData: string
          deployed?: boolean | null
          isPublic?: boolean | null
          apikeyid?: string | null
          chatbotConfig?: string | null
          category?: string | null
          speechToText?: string | null
          type?: string | null
          followUpPrompts?: string | null
          createdDate?: string
          updatedDate?: string
          apiConfig?: string | null
          analytic?: string | null
        }
        Update: {
          id?: string
          name?: string
          flowData?: string
          deployed?: boolean | null
          isPublic?: boolean | null
          apikeyid?: string | null
          chatbotConfig?: string | null
          category?: string | null
          speechToText?: string | null
          type?: string | null
          followUpPrompts?: string | null
          createdDate?: string
          updatedDate?: string
          apiConfig?: string | null
          analytic?: string | null
        }
      }
      family_member_chatflows: {
        Row: {
          id: string
          member_id: string
          chatflow_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          chatflow_id: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          chatflow_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      assign_chatflow_to_member: {
        Args: {
          p_member_id: string
          p_chatflow_id: string
          p_role?: string
        }
        Returns: string
      }
    }
  }
} 