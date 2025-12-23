<template>
  <v-app>
    <AppSnackbar />

    <v-layout class="appLayout">
      <Sidebar v-model:open="drawerOpen" />

      <v-app-bar class="appBarSticky" flat density="comfortable">
        <v-app-bar-nav-icon class="d-md-none" @click="drawerOpen = !drawerOpen" />
        <v-toolbar-title class="text-truncate">AI Chat</v-toolbar-title>

        <v-spacer />

        <v-btn variant="text" icon="mdi-cog" :to="{ name: 'settings' }" aria-label="Settings" />
      </v-app-bar>

      <v-main>
        <RouterView />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDisplay, useTheme } from 'vuetify'

import Sidebar from '@/widgets/sidebar/Sidebar.vue'
import AppSnackbar from '@/shared/ui/AppSnackbar.vue'
import { useSettingsStore } from '@/entities/settings/model/settingsStore'

const display = useDisplay()
const theme = useTheme()
const settingsStore = useSettingsStore()

const drawerOpen = ref(true)

watch(
  () => display.mdAndUp.value,
  (isDesktop) => {
    drawerOpen.value = isDesktop
  },
  { immediate: true },
)

watch(
  () => settingsStore.effectiveTheme,
  (t) => {
    theme.change(t)
  },
  { immediate: true },
)
</script>

<style scoped>
.appLayout {
  min-height: 100vh;
}

:deep(.v-app-bar.appBarSticky) {
  position: fixed !important;
  top: 0;
  left: var(--v-layout-left, 0px);
  right: var(--v-layout-right, 0px);
  z-index: 2000;
}

:deep(.v-main) {
  padding-top: var(--v-layout-top, 64px) !important;
}
</style>

