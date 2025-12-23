<template>
  <div class="d-flex flex-column align-center text-center">
    <v-icon :icon="icon" size="56" class="mb-3" />
    <div class="text-h6">{{ title }}</div>
    <div v-if="subtitle" class="text-body-2 text-medium-emphasis mt-1" style="max-width: 520px">
      {{ subtitle }}
    </div>

    <div class="mt-4">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    icon?: string
  }>(),
  {
    icon: 'mdi-information-outline',
    subtitle: '',
  },
)
</script>
