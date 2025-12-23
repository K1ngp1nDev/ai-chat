import { defineStore } from 'pinia'

import { ENV } from '@/shared/config/env'
import { storageGet, storageRemove, storageSet } from '@/shared/lib/storage'
import type { SettingsState } from './types'

const STORAGE_KEY = 'ai-chat/settings/v1'

function defaultState(): SettingsState {
  return {
    schemaVersion: 1,
    apiKey: ENV.cerebras.apiKey ?? '',
    baseUrl: ENV.cerebras.baseUrl ?? 'https://api.cerebras.ai/v1',
    stream: true,
    theme: 'system',
  }
}

export const useSettingsStore = defineStore('settings', {
  state: defaultState,

  getters: {
    effectiveTheme: (state): 'light' | 'dark' => {
      if (state.theme === 'light' || state.theme === 'dark') return state.theme
      if (typeof window === 'undefined' || !window.matchMedia) return 'light'
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    },
  },

  actions: {
    hydrate() {
      const saved = storageGet<SettingsState>(STORAGE_KEY)
      const defaults = defaultState()

      if (saved && saved.schemaVersion === 1) {
        this.$state = {
          ...defaults,
          ...saved,
          apiKey: saved.apiKey || defaults.apiKey,
          baseUrl: saved.baseUrl || defaults.baseUrl,
        }
      } else {
        this.$state = defaults
      }

      this.$subscribe(
        (_mutation, state) => {
          storageSet(STORAGE_KEY, state as SettingsState)
        },
        { detached: true },
      )
    },

    export(): SettingsState {
      return { ...(this.$state as SettingsState) }
    },

    import(payload: Partial<SettingsState> | null | undefined) {
      if (!payload) return
      const defaults = defaultState()

      this.$state = {
        ...defaults,
        schemaVersion: 1,
        apiKey: typeof payload.apiKey === 'string' ? payload.apiKey : defaults.apiKey,
        baseUrl: typeof payload.baseUrl === 'string' ? payload.baseUrl : defaults.baseUrl,
        stream: typeof payload.stream === 'boolean' ? payload.stream : defaults.stream,
        theme:
          payload.theme === 'system' || payload.theme === 'light' || payload.theme === 'dark'
            ? payload.theme
            : defaults.theme,
      }
    },

    resetAll() {
      storageRemove(STORAGE_KEY)
      this.$state = defaultState()
    },
  },
})
