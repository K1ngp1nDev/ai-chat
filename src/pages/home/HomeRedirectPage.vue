<template>
  <div class="h-100 d-flex align-center justify-center pa-6">
    <v-progress-circular indeterminate />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/entities/chat/model/chatStore'

const router = useRouter()
const chatStore = useChatStore()

onMounted(() => {
  const chatId = chatStore.ensureAnyChat()
  router.replace({ name: 'chat', params: { chatId } })
})
</script>
