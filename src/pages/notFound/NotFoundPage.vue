<template>
  <div class="h-100 d-flex align-center justify-center pa-6">
    <EmptyState
      title="Page not found"
      subtitle="The page you are looking for does not exist."
      icon="mdi-alert-circle-outline"
    >
      <template #actions>
        <v-btn color="primary" :to="{ name: 'home' }" prepend-icon="mdi-home">Go home</v-btn>
      </template>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import EmptyState from '@/shared/ui/EmptyState.vue'
</script>
