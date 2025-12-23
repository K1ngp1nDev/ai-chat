export type ChatRole = 'system' | 'user' | 'assistant'

export type MessageStatus = 'sent' | 'streaming' | 'error'

export interface ChatMessageMeta {
  model?: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  timeInfo?: {
    queueTime?: number
    promptTime?: number
    completionTime?: number
    totalTime?: number
  }
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  status?: MessageStatus
  error?: string
  meta?: ChatMessageMeta
}

export interface Chat {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

export interface ChatExportPayload {
  schemaVersion: 1
  chat: Chat
}
