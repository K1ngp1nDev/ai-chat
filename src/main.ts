import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/app/App.vue'
import { router } from '@/app/router'
import { vuetify } from '@/app/plugins/vuetify'
import '@/app/styles/main.scss'
import 'highlight.js/styles/github.css'

import { useChatStore } from '@/entities/chat/model/chatStore'
import { useSettingsStore } from '@/entities/settings/model/settingsStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

const settingsStore = useSettingsStore(pinia)
settingsStore.hydrate()

const chatStore = useChatStore(pinia)
chatStore.hydrate()

app.mount('#app')
