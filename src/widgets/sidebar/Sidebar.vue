<template>
  <v-navigation-drawer
    :model-value="drawerVisible"
    :rail="isDesktop && !open"
    :permanent="isDesktop"
    :temporary="!isDesktop"
    :scrim="!isDesktop"
    width="320"
    rail-width="72"
    class="sidebar"
    @update:model-value="onUpdateDrawerVisible"
  >
    <div class="drawerContent">
      <div class="topBar px-2 py-2 d-flex align-center">
        <v-hover v-slot="{ isHovering, props: hoverProps }">
          <v-btn
            v-bind="hoverProps"
            variant="text"
            icon
            :aria-label="open ? 'Collapse sidebar' : 'Expand sidebar'"
            @click="toggleOpen"
          >
            <v-icon
              :icon="
                open
                  ? 'mdi-chevron-left'
                  : isHovering
                    ? 'mdi-chevron-right'
                    : 'mdi-message-text-outline'
              "
            />
          </v-btn>
        </v-hover>

        <div v-if="open" class="text-subtitle-1 font-weight-medium ms-2">
          Chats
        </div>

        <v-spacer />

        <v-tooltip location="bottom" text="Search">
          <template #activator="{ props: tipProps }">
            <v-btn
              v-bind="tipProps"
              variant="text"
              icon="mdi-magnify"
              aria-label="Search"
              @click="onSearchClick"
            />
          </template>
        </v-tooltip>
      </div>

      <div v-if="open" class="px-3 pb-2">
        <v-text-field
          ref="searchField"
          v-model="query"
          density="comfortable"
          variant="solo-filled"
          hide-details
          clearable
          placeholder="Search chats"
        />
      </div>

      <div class="px-2 pb-2">
        <template v-if="open">
          <v-btn
            block
            color="primary"
            prepend-icon="mdi-plus"
            class="text-none"
            @click="createNewChat"
          >
            New chat
          </v-btn>
        </template>

        <template v-else>
          <div class="d-flex justify-center">
            <v-tooltip location="end" text="New chat">
              <template #activator="{ props: tipProps }">
                <v-btn
                  v-bind="tipProps"
                  color="primary"
                  icon="mdi-plus"
                  variant="flat"
                  aria-label="New chat"
                  @click="createNewChat"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
      </div>

      <v-divider />

      <div class="chatList py-2">
        <template v-if="open">
          <v-list density="compact" nav>
            <v-hover v-for="c in filteredChats" :key="c.id" v-slot="{ isHovering, props: hoverProps }">
              <v-list-item
                v-bind="hoverProps"
                :active="c.id === chatStore.activeChatId"
                class="chatRow"
                @click="goToChat(c.id)"
              >
                <template #prepend>
                  <v-avatar size="28" color="surface-variant">
                    <span class="text-caption">{{ avatarLetter(c.title) }}</span>
                  </v-avatar>
                </template>

                <v-list-item-title class="text-truncate">
                  {{ c.title }}
                </v-list-item-title>

                <v-list-item-subtitle class="text-truncate">
                  {{ lastPreview(c) }}
                </v-list-item-subtitle>

                <template #append>
                  <div class="rowActions" :class="{ show: isDesktop && isHovering }" @click.stop>
                    <v-menu location="bottom end">
                      <template #activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-dots-horizontal"
                          variant="text"
                          density="comfortable"
                          aria-label="Chat actions"
                          @click.stop
                        />
                      </template>

                      <v-list density="compact" nav>
                        <v-list-item
                          title="Rename"
                          prepend-icon="mdi-pencil"
                          @click="openRenameFromSidebar(c.id)"
                        />
                        <v-list-item
                          title="Export (JSON)"
                          prepend-icon="mdi-export"
                          @click="exportChatFromSidebar(c.id)"
                        />
                        <v-divider />
                        <v-list-item
                          title="Delete chat"
                          prepend-icon="mdi-delete"
                          base-color="error"
                          @click="openDeleteFromSidebar(c.id)"
                        />
                      </v-list>
                    </v-menu>
                  </div>
                </template>
              </v-list-item>
            </v-hover>
          </v-list>
        </template>

        <template v-else>
          <div class="d-flex flex-column align-center ga-2 px-2">
            <v-tooltip v-for="c in filteredChats" :key="c.id" location="end" :text="c.title">
              <template #activator="{ props: tipProps }">
                <v-btn
                  v-bind="tipProps"
                  :color="c.id === chatStore.activeChatId ? 'primary' : undefined"
                  :variant="c.id === chatStore.activeChatId ? 'flat' : 'text'"
                  icon
                  class="chatIconBtn"
                  :aria-label="c.title"
                  @click="goToChat(c.id)"
                >
                  <v-avatar size="28" color="surface-variant">
                    <span class="text-caption">{{ avatarLetter(c.title) }}</span>
                  </v-avatar>
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>
      </div>

      <v-divider />

      <div class="bottomBar px-2 py-2">
        <template v-if="open">
          <v-list density="compact" nav>
            <v-list-item
              title="Settings"
              prepend-icon="mdi-cog"
              @click="router.push({ name: 'settings' })"
            />
          </v-list>
        </template>

        <template v-else>
          <div class="d-flex justify-center">
            <v-tooltip location="end" text="Settings">
              <template #activator="{ props: tipProps }">
                <v-btn
                  v-bind="tipProps"
                  variant="text"
                  icon="mdi-cog"
                  aria-label="Settings"
                  @click="router.push({ name: 'settings' })"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
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
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

import { useChatStore } from '@/entities/chat/model/chatStore'
import type { Chat } from '@/entities/chat/model/types'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()

const router = useRouter()
const display = useDisplay()
const chatStore = useChatStore()

const isDesktop = computed(() => display.mdAndUp.value)
const drawerVisible = computed(() => (isDesktop.value ? true : props.open))

const query = ref('')
type Focusable = { focus?: () => void }
const searchField = ref<Focusable | null>(null)

const filteredChats = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = chatStore.orderedChats
  if (!q) return list
  return list.filter((c) => c.title.toLowerCase().includes(q))
})

function onUpdateDrawerVisible(v: boolean) {
  if (!isDesktop.value) emit('update:open', v)
}

function toggleOpen() {
  emit('update:open', !props.open)
}

async function onSearchClick() {
  if (!props.open) {
    emit('update:open', true)
    await nextTick()
  }
  searchField.value?.focus?.()
}

function createNewChat() {
  const id = chatStore.createChatSmart()
  router.push({ name: 'chat', params: { chatId: id } })
}

function goToChat(id: string) {
  chatStore.setActiveChat(id)
  router.push({ name: 'chat', params: { chatId: id } })
}

function avatarLetter(title: string) {
  const t = (title || '').trim()
  return t ? t[0].toUpperCase() : 'C'
}

function lastPreview(chat: Chat) {
  const last = [...(chat.messages || [])].reverse().find((m) => m.content.trim())
  if (!last) return ''
  const text = String(last.content).replace(/\s+/g, ' ').trim()
  return text.length > 60 ? text.slice(0, 60) + '…' : text
}

const renameDialog = ref(false)
const renameValue = ref('')
const renameChatId = ref<string | null>(null)

const deleteDialog = ref(false)
const deleteChatId = ref<string | null>(null)

function openRenameFromSidebar(chatId: string) {
  const c = chatStore.chats[chatId]
  if (!c) return
  renameChatId.value = chatId
  renameValue.value = c.title
  renameDialog.value = true
}

function confirmRename() {
  const id = renameChatId.value
  const title = renameValue.value.trim()
  if (!id || !title) return
  chatStore.renameChat(id, title)
  renameDialog.value = false
}

function exportChatFromSidebar(chatId: string) {
  const data = chatStore.exportChat(chatId)
  if (!data) return

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `chat-${chatId}.json`
  a.click()

  URL.revokeObjectURL(url)
}

function openDeleteFromSidebar(chatId: string) {
  deleteChatId.value = chatId
  deleteDialog.value = true
}

function confirmDelete() {
  const id = deleteChatId.value
  if (!id) return

  chatStore.deleteChat(id)
  deleteDialog.value = false

  const nextId = chatStore.ensureAnyChat()
  router.replace({ name: 'chat', params: { chatId: nextId } })
}
</script>

<style scoped>
.drawerContent {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chatList {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;

  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.topBar,
.bottomBar {
  flex: 0 0 auto;
}

.chatIconBtn {
  width: 44px;
  height: 44px;
}

.rowActions {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.rowActions.show {
  opacity: 1;
  pointer-events: auto;
}

.sidebar {
  position: fixed !important;
  top: 0 !important;
  bottom: 0 !important;
  height: auto !important;
  max-height: 100vh !important;
  overflow: hidden !important;
}

:deep(.sidebar .v-navigation-drawer__content) {
  height: 100% !important;
  max-height: 100% !important;
  overflow: hidden !important;

  display: flex !important;
  flex-direction: column !important;
}
</style>
