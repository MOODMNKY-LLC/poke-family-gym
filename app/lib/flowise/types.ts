export interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
  status: 'processing' | 'indexed' | 'failed'
  metadata: {
    chunks: number
    vectors: number
    [key: string]: any
  }
}

export interface VectorConfig {
  type: 'pinecone' | 'supabase' | 'other'
  config: {
    apiKey?: string
    environment?: string
    index?: string
    [key: string]: any
  }
}

export interface ProcessingConfig {
  chunkSize: number
  chunkOverlap: number
  splitStrategy: 'token' | 'sentence' | 'paragraph'
  embedModel: string
  [key: string]: any
} 