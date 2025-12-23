<template>
  <div class="pa-4 pa-md-6">
    <v-container class="pa-0" style="max-width: 900px">
      <h1 class="text-h5 mb-2">Settings</h1>
      <p class="text-body-2 mb-6">
        All settings are saved to <strong>LocalStorage</strong> (per the test task requirement).
      </p>

      <v-alert
        v-if="!settingsStore.apiKey"
        type="warning"
        variant="tonal"
        class="mb-6"
        title="Missing API key"
        text="To use the chat, provide your Cerebras API key below or via .env.local."
      />

      <v-card rounded="lg" class="mb-6">
        <v-card-title>API</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="apiKeyLocal"
                label="Cerebras API key"
                type="password"
                autocomplete="off"
                hint="Stored locally in your browser. Prefer using .env.local when possible."
                persistent-hint
                prepend-inner-icon="mdi-key"
                @blur="saveApiKey"
                @keyup.enter="saveApiKey"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="settingsStore.baseUrl"
                label="Base URL"
                hint="Default: https://api.cerebras.ai/v1"
                persistent-hint
                prepend-inner-icon="mdi-web"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card rounded="lg" class="mb-6">
        <v-card-title>General</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-switch
                v-model="settingsStore.stream"
                label="Stream response (typing)"
                inset
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="settingsStore.theme"
                :items="themeOptions"
                label="Theme"
                prepend-inner-icon="mdi-theme-light-dark"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card rounded="lg">
        <v-card-title>Data</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="4">
              <v-btn block variant="tonal" prepend-icon="mdi-export" @click="exportAll">
                Export all data (JSON)
              </v-btn>
            </v-col>
            <v-col cols="12" md="4">
              <v-btn block variant="tonal" prepend-icon="mdi-import" @click="importDialog = true">
                Import data (JSON)
              </v-btn>
            </v-col>
            <v-col cols="12" md="4">
              <v-btn
                block
                color="error"
                variant="tonal"
                prepend-icon="mdi-delete"
                @click="resetDialog = true"
              >
                Reset all data
              </v-btn>
            </v-col>
          </v-row>

          <v-dialog v-model="importDialog" max-width="700">
            <v-card rounded="lg">
              <v-card-title>Import data</v-card-title>
              <v-divider />
              <v-card-text class="pt-4">
                <v-textarea
                  v-model="importJson"
                  label="Paste exported JSON here"
                  auto-grow
                  rows="8"
                />
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="importDialog = false">Cancel</v-btn>
                <v-btn color="primary" @click="importAll">Import</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <ConfirmDialog
            v-model="resetDialog"
            title="Reset all data?"
            description="This will delete ALL chats and settings from LocalStorage."
            confirm-text="Reset"
            confirm-color="error"
            @confirm="resetAll"
          />
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/entities/settings/model/settingsStore'
import { useChatStore } from '@/entities/chat/model/chatStore'
import { useUiStore } from '@/shared/ui/uiStore'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'

const settingsStore = useSettingsStore()
const chatStore = useChatStore()
const uiStore = useUiStore()

const themeOptions = [
  { title: 'System', value: 'system' },
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' },
]

const apiKeyLocal = ref(settingsStore.apiKey)

function saveApiKey() {
  settingsStore.apiKey = apiKeyLocal.value.trim()
}

const resetDialog = ref(false)

function resetAll() {
  chatStore.resetAll()
  settingsStore.resetAll()
  uiStore.toast('All data has been reset.')
}

function exportAll() {
  const payload = {
    settings: settingsStore.export(),
    chats: chatStore.export(),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `ai-chat-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()

  URL.revokeObjectURL(url)
}

const importDialog = ref(false)
const importJson = ref('')

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

type SettingsExport = ReturnType<typeof settingsStore.export>
type ChatsExport = ReturnType<typeof chatStore.export>

function importAll() {
  try {
    const raw: unknown = JSON.parse(importJson.value)

    if (!isRecord(raw)) {
      throw new Error('Invalid import payload')
    }

    const settings = raw.settings
    const chats = raw.chats

    settingsStore.import(isRecord(settings) ? (settings as Partial<SettingsExport>) : null)
    chatStore.import(isRecord(chats) ? (chats as Partial<ChatsExport>) : null)

    uiStore.toast('Import completed.')
    importDialog.value = false
    importJson.value = ''
  } catch {
    uiStore.toast('Invalid JSON. Import failed.', 'error')
  }
}
</script>
