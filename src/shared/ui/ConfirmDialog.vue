<template>
  <v-dialog v-model="model" max-width="520">
    <v-card rounded="lg">
      <v-card-title>{{ title }}</v-card-title>
      <v-divider />
      <v-card-text class="pt-4">
        <div class="text-body-2">{{ description }}</div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="model = false">Cancel</v-btn>
        <v-btn :color="confirmColor" @click="confirm">{{ confirmText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    description: string
    confirmText?: string
    confirmColor?: string
  }>(),
  {
    confirmText: 'Confirm',
    confirmColor: 'primary',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

function confirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>
