// Chatflow interfaces
export interface ChatFlow {
  id: string
  name: string
  flowData: string
  deployed: boolean
  isPublic: boolean
  apikeyid?: string
  chatbotConfig?: string
  createdDate: string
  updatedDate: string
  apiConfig?: string
  analytic?: string
  category?: string
  speechToText?: string
  type?: string
  followUpPrompts?: string
}

// Chat message interfaces
export interface ChatMessage {
  id: string
  role: string
  chatflowid: string
  content: string
  sourceDocuments?: string
  createdDate: string
  chatType: string
  chatId: string
  memoryType?: string
  sessionId?: string
  usedTools?: string
  fileAnnotations?: string
  fileUploads?: string
  leadEmail?: string
  agentReasoning?: string
  action?: string
  artifacts?: string
  followUpPrompts?: string
  rating?: string
}

export interface ChatMessageFeedback {
  id: string
  chatflowid: string
  content?: string
  chatId: string
  messageId: string
  rating: string
  createdDate: string
}

// File upload interfaces
export interface FileUpload {
  id: string
  chatflowid: string
  filename: string
  mimetype: string
  size: number
  path: string
  createdDate: string
}

// Analytics interfaces
export interface AnalyticsMetrics {
  messages: number
  ratings: number
  positiveRatings: number
  negativeRatings: number
  users: Set<string>
  averageResponseTime: number
  totalResponseTime: number
  responseCount: number
}

export interface AnalyticsResult {
  period: string
  metrics: Omit<AnalyticsMetrics, 'users'> & {
    users: number
  }
}

export interface AnalyticsSummary {
  totalMessages: number
  uniqueUsers: number
  totalRatings: number
  positiveRatings: number
  negativeRatings: number
  averageResponseTime: number
  messagesByRole: Record<string, number>
  messagesByType: Record<string, number>
  popularChatflows: Record<string, number>
}

// API request/response interfaces
export interface ChatRequest {
  chatflowId: string
  message: string
  history?: ChatMessage[]
  overrideConfig?: Record<string, any>
  files?: File[]
}

export interface ChatResponse {
  response: string
  sourceDocuments?: any[]
  fileAnnotations?: any[]
  usedTools?: any[]
  agentReasoning?: string
  action?: string
  artifacts?: any[]
  followUpPrompts?: string[]
}

export interface DeploymentStatus {
  success: boolean
  message?: string
  error?: string
}

// Error interfaces
export interface FlowiseError {
  message: string
  status: number
  details?: any
}

// Configuration interfaces
export interface FlowiseConfig {
  apiUrl: string
  apiKey: string
}

export interface ChatbotConfig {
  theme?: Record<string, any>
  initialMessages?: string[]
  showTitle?: boolean
  title?: string
  description?: string
  showAvatar?: boolean
  avatarUrl?: string
  chatWindowStyles?: Record<string, any>
} 