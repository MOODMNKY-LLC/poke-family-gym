import { createClient } from '@/lib/supabase/client'

export interface DocumentStore {
  id: string
  name: string
  description?: string
  loaders?: string
  whereUsed?: string
  status: string
  createdDate: string
  updatedDate: string
  vectorStoreConfig?: string
  embeddingConfig?: string
  recordManagerConfig?: string
}

export const DocumentStoreAPI = {
  // Get all document stores
  async getDocumentStores(): Promise<DocumentStore[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('document_store')
        .select('*')
        .order('createdDate', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching document stores:', error)
      throw error
    }
  },

  // Create a new document store
  async createDocumentStore(store: Omit<DocumentStore, 'id' | 'createdDate' | 'updatedDate'>): Promise<DocumentStore> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('document_store')
        .insert([{
          ...store,
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating document store:', error)
      throw error
    }
  },

  // Update a document store
  async updateDocumentStore(id: string, store: Partial<DocumentStore>): Promise<DocumentStore> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('document_store')
        .update({
          ...store,
          updatedDate: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating document store:', error)
      throw error
    }
  },

  // Delete a document store
  async deleteDocumentStore(id: string): Promise<void> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('document_store')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting document store:', error)
      throw error
    }
  }
} 