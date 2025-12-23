<template>
  <div class="d-flex" :class="wrapperClass">
    <v-hover v-slot="{ isHovering, props: hoverProps }">
      <v-card
        v-bind="hoverProps"
        :class="cardClass"
        rounded="lg"
        variant="tonal"
        :max-width="860"
      >
        <v-card-text class="py-3">
          <div v-if="message.role === 'assistant'" class="markdown-content" v-html="rendered" />
          <div v-else class="text-body-1" style="white-space: pre-wrap">{{ message.content }}</div>

          <v-alert
            v-if="message.status === 'error'"
            type="error"
            variant="tonal"
            class="mt-3"
            density="compact"
          >
            {{ message.error ?? 'Request failed.' }}
          </v-alert>

          <div v-if="message.status === 'streaming'" class="mt-3">
            <v-progress-linear indeterminate height="3" />
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="py-1 px-3">
          <span class="text-caption text-medium-emphasis">{{ metaLine }}</span>

          <v-spacer />

          <v-fade-transition>
            <div v-if="isHovering" class="d-flex ga-1">
              <v-btn
                size="small"
                variant="text"
                icon="mdi-content-copy"
                :title="'Copy'"
                @click="$emit('copy', message.content)"
              />
              <v-btn
                size="small"
                variant="text"
                icon="mdi-delete"
                :title="'Delete'"
                @click="$emit('delete')"
              />
              <v-btn
                v-if="message.status === 'error'"
                size="small"
                variant="text"
                icon="mdi-replay"
                :title="'Retry from here'"
                @click="$emit('retry')"
              />
            </div>
          </v-fade-transition>
        </v-card-actions>
      </v-card>
    </v-hover>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { ChatMessage } from '@/entities/chat/model/types'
import { renderMarkdown } from '@/shared/lib/markdown'
import { formatClockTime } from '@/shared/lib/time'

const props = defineProps<{
  message: ChatMessage
}>()

defineEmits<{
  (e: 'copy', text: string): void
  (e: 'delete'): void
  (e: 'retry'): void
}>()

const wrapperClass = computed(() => {
  if (props.message.role === 'user') return 'justify-end'
  if (props.message.role === 'assistant') return 'justify-start'
  return 'justify-center'
})

const cardClass = computed(() => {
  if (props.message.role === 'user') return 'bg-primary'
  if (props.message.role === 'assistant') return 'bg-surface'
  return 'bg-surface-variant'
})

const rendered = computed(() => {
  if (props.message.role !== 'assistant') return ''
  return renderMarkdown(props.message.content)
})

const metaLine = computed(() => {
  const t = formatClockTime(props.message.createdAt)
  if (props.message.role === 'user') return `You • ${t}`
  if (props.message.role === 'assistant') return `Assistant • ${t}`
  return `System • ${t}`
})
</script>

<style scoped>
.bg-primary :deep(*) {
  color: rgb(var(--v-theme-on-primary));
}

.bg-primary :deep(a) {
  color: rgb(var(--v-theme-on-primary));
  text-decoration: underline;
}
</style>
