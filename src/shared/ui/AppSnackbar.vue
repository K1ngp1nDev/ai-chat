<template>
  <v-snackbar
    v-model="uiStore.snackbar.show"
    :color="snackbarColor"
    timeout="2500"
    location="bottom end"
  >
    {{ uiStore.snackbar.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/shared/ui/uiStore'

const uiStore = useUiStore()

const snackbarColor = computed(() => {
  switch (uiStore.snackbar.color) {
    case 'success':
      return 'green'
    case 'warning':
      return 'orange'
    case 'error':
      return 'red'
    default:
      return 'info'
  }
})
</script>
