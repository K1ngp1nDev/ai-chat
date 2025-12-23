export const ENV = {
  cerebras: {
    baseUrl: (import.meta.env.VITE_CEREBRAS_BASE_URL as string | undefined) ?? 'https://api.cerebras.ai/v1',
    apiKey: (import.meta.env.VITE_CEREBRAS_API_KEY as string | undefined) ?? '',
  },
} as const
