import { defineStore } from 'pinia'

export type ToastColor = 'success' | 'info' | 'warning' | 'error'

export const useUiStore = defineStore('ui', {
  state: () => ({
    snackbar: {
      show: false,
      text: '' as string,
      color: 'info' as ToastColor,
    },
  }),
  actions: {
    toast(text: string, color: ToastColor = 'info') {
      this.snackbar.text = text
      this.snackbar.color = color
      this.snackbar.show = true
    },
  },
})
