import { defineStore } from 'pinia'

import type { Chat, ChatExportPayload, ChatMessage } from './types'
import { createId } from '@/shared/lib/id'
import { storageGet, storageRemove, storageSet } from '@/shared/lib/storage'
import { type CerebrasMessage, chatCompletion, streamChatCompletion } from '@/shared/api/cerebras'
import { useSettingsStore } from '@/entities/settings/model/settingsStore'
import { useUiStore } from '@/shared/ui/uiStore'

const STORAGE_KEY = 'ai-chat/chats/v1'

const DEFAULT_BASE_URL = 'https://api.cerebras.ai/v1'
const DEFAULT_MODEL = import.meta.env.VITE_CEREBRAS_MODEL || 'llama3.1-8b'
const SYSTEM_PROMPT = String(import.meta.env.VITE_CHAT_SYSTEM_PROMPT || '').trim()
const CONTEXT_LIMIT = Number(import.meta.env.VITE_CHAT_CONTEXT_LIMIT || 24) || 24

interface PersistedChatState {
  schemaVersion: 1
  chats: Record<string, Chat>
  activeChatId: string | null
}

interface ChatState extends PersistedChatState {
  generatingChatId: string | null
}

function defaultState(): ChatState {
  return {
    schemaVersion: 1,
    chats: {},
    activeChatId: null,
    generatingChatId: null,
  }
}

let persistTimer: number | null = null
function persist(state: PersistedChatState) {
  if (persistTimer) window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => storageSet(STORAGE_KEY, state), 250)
}

let currentAbort: AbortController | null = null

export const useChatStore = defineStore('chats', {
  state: defaultState,

  getters: {
    orderedChats: (state): Chat[] => {
      return Object.values(state.chats).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },
  },

  actions: {
    hydrate() {
      const saved = storageGet<PersistedChatState>(STORAGE_KEY)
      const defaults = defaultState()

      if (saved && saved.schemaVersion === 1) {
        this.schemaVersion = 1
        this.chats = saved.chats ?? {}
        this.activeChatId = saved.activeChatId ?? null
      } else {
        Object.assign(this, defaults)
      }

      this.ensureAnyChat()

      this.$subscribe(
        (_mutation, state) => {
          const payload: PersistedChatState = {
            schemaVersion: 1,
            chats: state.chats,
            activeChatId: state.activeChatId,
          }
          persist(payload)
        },
        { detached: true },
      )
    },

    ensureAnyChat(): string {
      const ids = Object.keys(this.chats)
      if (ids.length === 0) return this.createChat()

      if (this.activeChatId && this.chats[this.activeChatId]) return this.activeChatId

      const nextId = this.orderedChats[0]?.id ?? ids[0]
      this.activeChatId = nextId
      return nextId
    },

    setActiveChat(chatId: string) {
      if (!this.chats[chatId]) return
      this.activeChatId = chatId
    },

    isChatEmpty(chatId: string): boolean {
      const chat = this.chats[chatId]
      if (!chat) return true
      return !chat.messages || chat.messages.length === 0
    },

    createChatSmart(title = 'New chat'): string {
      if (
        this.activeChatId &&
        this.chats[this.activeChatId] &&
        this.isChatEmpty(this.activeChatId)
      ) {
        return this.activeChatId
      }

      const emptyRecent = this.orderedChats.find((c) => c.messages.length === 0)
      if (emptyRecent) {
        this.activeChatId = emptyRecent.id
        return emptyRecent.id
      }

      return this.createChat(title)
    },

    createChat(title = 'New chat'): string {
      const now = new Date().toISOString()
      const id = createId()

      this.chats[id] = {
        id,
        title,
        createdAt: now,
        updatedAt: now,
        messages: [],
      }
      this.activeChatId = id
      return id
    },

    renameChat(chatId: string, title: string) {
      const chat = this.chats[chatId]
      if (!chat) return
      chat.title = title
      chat.updatedAt = new Date().toISOString()
    },

    deleteChat(chatId: string) {
      if (!this.chats[chatId]) return

      if (this.generatingChatId === chatId) this.abortGeneration()

      delete this.chats[chatId]

      if (this.activeChatId === chatId) {
        this.activeChatId = null
      }
    },

    resetAll() {
      this.abortGeneration()
      storageRemove(STORAGE_KEY)
      Object.assign(this, defaultState())
      this.ensureAnyChat()
    },

    deleteMessage(chatId: string, messageId: string) {
      const chat = this.chats[chatId]
      if (!chat) return

      const idx = chat.messages.findIndex((m) => m.id === messageId)
      if (idx === -1) return

      if (this.generatingChatId === chatId) this.abortGeneration()

      chat.messages.splice(idx, 1)
      chat.updatedAt = new Date().toISOString()
    },

    export(): PersistedChatState {
      return {
        schemaVersion: 1,
        chats: this.chats,
        activeChatId: this.activeChatId,
      }
    },

    import(payload: Partial<PersistedChatState> | null | undefined) {
      if (!payload || payload.schemaVersion !== 1 || !payload.chats) return

      this.abortGeneration()

      this.chats = payload.chats as Record<string, Chat>
      this.activeChatId = payload.activeChatId ?? null

      this.ensureAnyChat()
    },

    exportChat(chatId: string): ChatExportPayload | null {
      const chat = this.chats[chatId]
      if (!chat) return null
      return { schemaVersion: 1, chat }
    },

    isGenerating(chatId: string): boolean {
      return this.generatingChatId === chatId
    },

    abortGeneration() {
      if (currentAbort) {
        currentAbort.abort()
        currentAbort = null
      }
      this.generatingChatId = null
    },

    async sendMessage(chatId: string, content: string) {
      const settings = useSettingsStore()
      const ui = useUiStore()

      if (!settings.apiKey) {
        ui.toast('API key is missing. Please set it in Settings.', 'warning')
        return
      }

      const chat = this.chats[chatId]
      if (!chat) return

      if (this.generatingChatId === chatId) {
        this.abortGeneration()
      }

      const now = new Date().toISOString()

      const userMsg: ChatMessage = {
        id: createId(),
        role: 'user',
        content,
        createdAt: now,
        status: 'sent',
      }

      chat.messages.push(userMsg)
      chat.updatedAt = now

      if (chat.title === 'New chat') {
        chat.title = suggestChatTitle(content)
      }

      await this.generateAssistant(chatId)
    },

    async retryFromMessage(chatId: string, messageId: string) {
      const chat = this.chats[chatId]
      if (!chat) return

      const idx = chat.messages.findIndex((m) => m.id === messageId)
      if (idx === -1) return

      const target = chat.messages[idx]
      if (target.role !== 'assistant') return

      chat.messages.splice(idx)

      await this.generateAssistant(chatId)
    },

    async generateAssistant(chatId: string) {
      const settings = useSettingsStore()
      const ui = useUiStore()

      if (!settings.apiKey) {
        ui.toast('API key is missing. Please set it in Settings.', 'warning')
        return
      }

      const chat = this.chats[chatId]
      if (!chat) return

      if (this.generatingChatId) {
        this.abortGeneration()
      }

      const controller = new AbortController()
      currentAbort = controller
      this.generatingChatId = chatId

      const now = new Date().toISOString()

      const assistantDraft: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: '',
        createdAt: now,
        status: 'streaming',
      }

      chat.messages.push(assistantDraft)
      chat.updatedAt = now

      const assistantMsg = chat.messages[chat.messages.length - 1] as ChatMessage

      const apiMessages = buildApiMessages(chat.messages)

      const cfg = {
        apiKey: settings.apiKey,
        baseUrl: (settings.baseUrl || DEFAULT_BASE_URL).trim(),
      }

      try {
        if (settings.stream) {
          for await (const ev of streamChatCompletion(
            cfg,
            {
              model: DEFAULT_MODEL,
              messages: apiMessages,
              stream: true,
            },
            controller.signal,
          )) {
            if (ev.type === 'delta') {
              assistantMsg.content += ev.delta
              assistantMsg.status = 'streaming'
              chat.updatedAt = new Date().toISOString()
            } else if (ev.type === 'meta') {
              assistantMsg.meta = {
                ...(assistantMsg.meta ?? {}),
                model: ev.model,
                promptTokens: ev.usage?.prompt_tokens,
                completionTokens: ev.usage?.completion_tokens,
                totalTokens: ev.usage?.total_tokens,
                timeInfo: ev.timeInfo
                  ? {
                      queueTime: ev.timeInfo.queue_time,
                      promptTime: ev.timeInfo.prompt_time,
                      completionTime: ev.timeInfo.completion_time,
                      totalTime: ev.timeInfo.total_time,
                    }
                  : undefined,
              }
            } else if (ev.type === 'done') {
              break
            }
          }

          assistantMsg.status = 'sent'
        } else {
          const res = await chatCompletion(
            cfg,
            {
              model: DEFAULT_MODEL,
              messages: apiMessages,
            },
            controller.signal,
          )

          assistantMsg.content = res.choices?.[0]?.message?.content ?? ''
          assistantMsg.status = 'sent'
          assistantMsg.meta = {
            model: res.model,
            promptTokens: res.usage?.prompt_tokens,
            completionTokens: res.usage?.completion_tokens,
            totalTokens: res.usage?.total_tokens,
            timeInfo: res.time_info
              ? {
                  queueTime: res.time_info.queue_time,
                  promptTime: res.time_info.prompt_time,
                  completionTime: res.time_info.completion_time,
                  totalTime: res.time_info.total_time,
                }
              : undefined,
          }
        }
      } catch (e: unknown) {
        const name = getErrorName(e)
        const message = getErrorMessage(e)

        const isAbort =
          name === 'CanceledError' ||
          name === 'AbortError' ||
          (typeof message === 'string' && message.toLowerCase().includes('aborted'))

        assistantMsg.status = 'error'
        assistantMsg.error = isAbort ? 'Cancelled.' : normalizeError(e)

        if (!isAbort) {
          ui.toast('Request failed. See message for details.', 'error')
        }
      } finally {
        this.generatingChatId = null
        currentAbort = null
        chat.updatedAt = new Date().toISOString()
      }
    },
  },
})

function buildApiMessages(messages: ChatMessage[]): CerebrasMessage[] {
  const list: CerebrasMessage[] = []

  if (SYSTEM_PROMPT) {
    list.push({ role: 'system', content: SYSTEM_PROMPT })
  }

  const conversational = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .filter((m) => (m.role === 'assistant' ? m.content.trim().length > 0 : true))

  const slice = CONTEXT_LIMIT > 0 ? conversational.slice(-CONTEXT_LIMIT) : conversational

  for (const m of slice) {
    list.push({ role: m.role, content: m.content })
  }

  return list
}

function suggestChatTitle(firstUserMessage: string): string {
  const cleaned = firstUserMessage.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'New chat'
  return cleaned.length > 40 ? `${cleaned.slice(0, 40)}…` : cleaned
}

function getErrorName(e: unknown): string | undefined {
  if (typeof e !== 'object' || e === null) return undefined
  if (!('name' in e)) return undefined
  const v = (e as Record<string, unknown>).name
  return typeof v === 'string' ? v : undefined
}

function getErrorMessage(e: unknown): string | undefined {
  if (typeof e !== 'object' || e === null) return undefined
  if (!('message' in e)) return undefined
  const v = (e as Record<string, unknown>).message
  return typeof v === 'string' ? v : undefined
}

function normalizeError(e: unknown): string {
  if (!e) return 'Unknown error'
  if (typeof e === 'string') return e

  const msg = getErrorMessage(e)
  if (msg) return msg

  try {
    return JSON.stringify(e)
  } catch {
    return 'Unknown error'
  }
}