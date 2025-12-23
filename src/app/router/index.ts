import { createRouter, createWebHashHistory } from 'vue-router'

import HomeRedirectPage from '@/pages/home/HomeRedirectPage.vue'
import NewChatPage from '@/pages/chat/NewChatPage.vue'
import ChatPage from '@/pages/chat/ChatPage.vue'
import SettingsPage from '@/pages/settings/SettingsPage.vue'
import NotFoundPage from '@/pages/notFound/NotFoundPage.vue'

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeRedirectPage },
    { path: '/chats/new', name: 'chat-new', component: NewChatPage },
    { path: '/chats/:chatId', name: 'chat', component: ChatPage, props: true },
    { path: '/settings', name: 'settings', component: SettingsPage },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
  ],
})
