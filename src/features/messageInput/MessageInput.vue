<template>
  <v-card rounded="lg" variant="outlined">
    <v-card-text class="py-3">
      <v-textarea
        v-model="text"
        :disabled="disabled"
        :placeholder="disabled ? 'Add an API key in Settings to start chatting…' : 'Type a message…'"
        auto-grow
        rows="2"
        max-rows="8"
        hide-details
        density="comfortable"
        variant="solo-filled"
        @keydown="onKeydown"
      />
    </v-card-text>

    <v-divider />

    <v-card-actions class="py-2 px-3">
      <span class="text-caption text-medium-emphasis">
        Enter — send. Shift+Enter — newline.
      </span>

      <v-spacer />

      <v-btn
        v-if="isGenerating"
        color="error"
        variant="tonal"
        prepend-icon="mdi-stop"
        @click="$emit('stop')"
      >
        Stop
      </v-btn>

      <v-btn
        v-else
        color="primary"
        prepend-icon="mdi-send"
        :disabled="disabled || !canSend"
        @click="send"
      >
        Send
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  disabled?: boolean
  isGenerating?: boolean
}>()

const emit = defineEmits<{
  (e: 'send', text: string): void
  (e: 'stop'): void
}>()

const text = ref('')

const canSend = computed(() => text.value.trim().length > 0)

function send() {
  const t = text.value.trim()
  if (!t) return
  emit('send', t)
  text.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (!props.isGenerating) {
      send()
    }
  }
}
</script>
