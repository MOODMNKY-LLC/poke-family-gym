export interface FlowiseNode {
  id: string
  position: {
    x: number
    y: number
  }
  type: string
  data: {
    id: string
    label: string
    name: string
    type: string
    baseClasses: string[]
    category: string
    description: string
    inputParams: any[]
    inputAnchors: any[]
    inputs: Record<string, any>
    outputAnchors: any[]
    outputs: Record<string, any>
  }
  width: number
  height: number
  selected: boolean
  positionAbsolute?: {
    x: number
    y: number
  }
  dragging?: boolean
}

export interface FlowiseEdge {
  source: string
  sourceHandle: string
  target: string
  targetHandle: string
  type: string
  id: string
}

export interface ChatFlow {
  id?: string
  name: string
  flowData: string
  deployed: boolean
  isPublic: boolean
  apikeyid: string | null
  chatbotConfig: string | null
  apiConfig: string | null
  analytic: string | null
  speechToText: string | null
  followUpPrompts: string | null
  category: string | null
  type: string
  createdDate?: string
  updatedDate?: string
}

export interface ChatFlowConfig {
  systemMessage: string
  maxIterations?: number
  tools?: string[]
  temperature?: number
  streaming?: boolean
  maxTokens?: number
  memoryType?: string
  memoryBaseUrl?: string
  memorySessionId?: string
  memoryWindow?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export interface ChatFlowValidation {
  isValid: boolean
  errors: string[]
}

export interface ChatFlowResponse extends ChatFlow {
  id: string
  createdDate: string
  updatedDate: string
}

export interface ChatFlowListResponse {
  chatflows: ChatFlow[]
  total: number
  page: number
  pageSize: number
}

export interface ChatFlowDeleteResponse {
  raw: any[]
  affected: number
}

export interface ChatFlowError {
  message: string
  code: string
  details?: Record<string, any>
}

export interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  status: 'processing' | 'ready' | 'error'
  error?: string
  metadata?: Record<string, any>
}

export interface ProcessingConfig {
  chunkSize: number
  chunkOverlap: number
  splitStrategy: 'token' | 'sentence' | 'paragraph'
  embedModel: string
} 