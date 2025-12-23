export type ThemeMode = 'system' | 'light' | 'dark'

export interface SettingsState {
  schemaVersion: 1
  apiKey: string
  baseUrl: string
  stream: boolean
  theme: ThemeMode
}
