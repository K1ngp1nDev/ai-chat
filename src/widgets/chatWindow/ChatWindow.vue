<template>
  <div class="chatRoot">
    <v-container style="max-width: 980px; padding: 16px 8px 12px 8px">
      <div class="d-flex align-center">
        <div class="flex-grow-1 min-w-0">
          <div class="text-h6 text-truncate">{{ chat?.title }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ chat?.messages.length ?? 0 }} messages
          </div>
        </div>

        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" />
          </template>

          <v-list density="compact" nav>
            <v-list-item title="Rename" prepend-icon="mdi-pencil" @click="openRename" />
            <v-list-item title="Export (JSON)" prepend-icon="mdi-export" @click="exportChat" />
            <v-divider />
            <v-list-item
              title="Delete chat"
              prepend-icon="mdi-delete"
              base-color="error"
              @click="deleteDialog = true"
            />
          </v-list>
        </v-menu>
      </div>
    </v-container>

    <v-divider />

    <v-container class="chatBody" style="max-width: 980px">
      <v-alert
        v-if="!settingsStore.apiKey"
        type="warning"
        variant="tonal"
        class="my-4"
        title="API key required"
      >
        Go to <RouterLink :to="{ name: 'settings' }">Settings</RouterLink> and provide your Cerebras
        API key.
      </v-alert>

      <div class="messages" :style="{ paddingBottom: `${composerHeight}px` }">
        <div v-if="!chat || chat.messages.length === 0" class="py-10">
          <EmptyState
            title="Start a conversation"
            subtitle="Send your first message below."
            icon="mdi-message-plus-outline"
          />
        </div>

        <div v-else class="d-flex flex-column ga-3 py-4">
          <MessageBubble
            v-for="m in chat.messages"
            :key="m.id"
            :message="m"
            @copy="copyMessage"
            @delete="deleteMessage(m.id)"
            @retry="retryFrom(m.id)"
          />
        </div>

        <div
          ref="bottomRef"
          class="bottomAnchor"
          :style="{ scrollMarginBottom: `${composerHeight}px` }"
        />
      </div>
    </v-container>

    <div ref="composerRef" class="composerBar">
      <div class="composerInner">
        <MessageInput
          :disabled="!settingsStore.apiKey"
          :is-generating="chatStore.isGenerating(chatId)"
          @send="onSend"
          @stop="chatStore.abortGeneration"
        />
      </div>
    </div>

    <v-dialog v-model="renameDialog" max-width="520">
      <v-card rounded="lg">
        <v-card-title>Rename chat</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-text-field v-model="renameValue" label="Title" autofocus @keyup.enter="confirmRename" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="renameDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmRename">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmDialog
      v-model="deleteDialog"
      title="Delete this chat?"
      description="This will remove the chat and all its messages."
      confirm-text="Delete"
      confirm-color="error"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import MessageInput from '@/features/messageInput/MessageInput.vue'
import MessageBubble from '@/widgets/chatWindow/MessageBubble.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

import { useChatStore } from '@/entities/chat/model/chatStore'
import { useSettingsStore } from '@/entities/settings/model/settingsStore'
import { useUiStore } from '@/shared/ui/uiStore'

const props = defineProps<{ chatId: string }>()

const router = useRouter()
const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const uiStore = useUiStore()

const chatId = computed(() => props.chatId)
const chat = computed(() => chatStore.chats[props.chatId] ?? null)

const bottomRef = ref<HTMLElement | null>(null)

const composerRef = ref<HTMLElement | null>(null)
const composerHeight = ref(160)

let ro: ResizeObserver | null = null

function updateComposerHeight() {
  const el = composerRef.value
  if (!el) return
  composerHeight.value = Math.ceil(el.getBoundingClientRect().height) + 12
}

// eslint-disable-next-line no-undef
function scrollToBottom(behavior: ScrollBehavior = 'auto') {
  bottomRef.value?.scrollIntoView({ behavior, block: 'end' })
}

watch(
  () => chat.value?.messages.map((m) => `${m.id}:${m.content}`).join('\n'),
  async () => {
    await nextTick()
    updateComposerHeight()
    scrollToBottom('smooth')
  },
)

onMounted(async () => {
  await nextTick()
  updateComposerHeight()
  scrollToBottom('auto')

  if (composerRef.value && 'ResizeObserver' in window) {
    ro = new ResizeObserver(() => updateComposerHeight())
    ro.observe(composerRef.value)
  }

  window.addEventListener('resize', updateComposerHeight)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
  window.removeEventListener('resize', updateComposerHeight)
})

async function onSend(text: string) {
  await chatStore.sendMessage(props.chatId, text)
}

async function copyMessage(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    uiStore.toast('Copied to clipboard.')
  } catch {
    uiStore.toast('Copy failed.', 'error')
  }
}

function deleteMessage(messageId: string) {
  chatStore.deleteMessage(props.chatId, messageId)
}

function retryFrom(messageId: string) {
  chatStore.retryFromMessage(props.chatId, messageId)
}

const renameDialog = ref(false)
const renameValue = ref('')

function openRename() {
  renameValue.value = chat.value?.title ?? ''
  renameDialog.value = true
}

function confirmRename() {
  const title = renameValue.value.trim()
  if (!title) return
  chatStore.renameChat(props.chatId, title)
  renameDialog.value = false
}

const deleteDialog = ref(false)

function confirmDelete() {
  chatStore.deleteChat(props.chatId)
  deleteDialog.value = false
  const nextId = chatStore.ensureAnyChat()
  router.replace({ name: 'chat', params: { chatId: nextId } })
}

function exportChat() {
  const data = chatStore.exportChat(props.chatId)
  if (!data) return
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `chat-${props.chatId}.json`
  a.click()

  URL.revokeObjectURL(url)
  uiStore.toast('Chat exported.')
}
</script>

<style scoped>
.chatBody {
  padding: 0 8px;
}

.bottomAnchor {
  height: 1px;
}

.composerBar {
  position: fixed;
  bottom: 0;
  z-index: 20;

  left: var(--v-layout-left);
  right: var(--v-layout-right);

  padding: 12px 0 calc(12px + env(safe-area-inset-bottom));
  background: rgba(var(--v-theme-surface), 0.92);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.composerInner {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 8px;
}
</style>
