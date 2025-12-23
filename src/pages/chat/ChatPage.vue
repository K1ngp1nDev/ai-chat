<template>
  <div class="h-100 d-flex flex-column">
    <ChatWindow v-if="chat" :chat-id="chatId" class="flex-grow-1" />

    <div v-else class="h-100 d-flex align-center justify-center pa-6">
      <EmptyState
        title="Chat not found"
        subtitle="The requested chat does not exist (maybe it was deleted)."
        icon="mdi-chat-remove-outline"
      >
        <template #actions>
          <v-btn color="primary" :to="{ name: 'chat-new' }" prepend-icon="mdi-plus">
            Create new chat
          </v-btn>
        </template>
      </EmptyState>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

import ChatWindow from '@/widgets/chatWindow/ChatWindow.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import { useChatStore } from '@/entities/chat/model/chatStore'

const props = defineProps<{
  chatId: string
}>()

const chatStore = useChatStore()

const chat = computed(() => chatStore.chats[props.chatId] ?? null)

watch(
  () => props.chatId,
  (id) => {
    if (chatStore.chats[id]) {
      chatStore.setActiveChat(id)
    }
  },
  { immediate: true },
)
</script>
