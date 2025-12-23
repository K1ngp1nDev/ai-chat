import axios from 'axios'

export type CerebrasRole = 'system' | 'user' | 'assistant'

export interface CerebrasMessage {
  role: CerebrasRole
  content: string
}

export interface CerebrasChatCompletionRequest {
  model: string
  messages: CerebrasMessage[]
  temperature?: number
  top_p?: number
  max_completion_tokens?: number
  stream?: boolean
  reasoning_effort?: 'low' | 'medium' | 'high'
}

export interface CerebrasUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface CerebrasTimeInfo {
  queue_time?: number
  prompt_time?: number
  completion_time?: number
  total_time?: number
}

export interface CerebrasChatCompletionResponse {
  id: string
  object: string
  model: string
  created: number
  choices: Array<{
    index: number
    finish_reason: string | null
    message?: { role: 'assistant'; content: string; reasoning?: string }
    delta?: { role?: 'assistant'; content?: string; reasoning?: string }
  }>
  usage?: CerebrasUsage
  time_info?: CerebrasTimeInfo
}

export interface CerebrasClientConfig {
  baseUrl: string
  apiKey: string
}

export async function chatCompletion(
  config: CerebrasClientConfig,
  body: CerebrasChatCompletionRequest,
  signal?: AbortSignal,
): Promise<CerebrasChatCompletionResponse> {
  const client = axios.create({
    baseURL: config.baseUrl,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  const res = await client.post<CerebrasChatCompletionResponse>('/chat/completions', body, { signal })
  return res.data
}

export type StreamEvent =
  | { type: 'delta'; delta: string }
  | { type: 'meta'; usage?: CerebrasUsage; timeInfo?: CerebrasTimeInfo; model?: string }
  | { type: 'done' }

export async function* streamChatCompletion(
  config: CerebrasClientConfig,
  body: CerebrasChatCompletionRequest,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent, void, unknown> {
  const res = await fetch(`${stripTrailingSlash(config.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  })

  if (!res.ok) {
    const text = await safeReadText(res)
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
  }

  const reader = res.body?.getReader()
  if (!reader) {
    throw new Error('ReadableStream not supported in this browser.')
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue
      if (!line.startsWith('data:')) continue

      const data = line.slice('data:'.length).trim()
      if (!data) continue

      if (data === '[DONE]') {
        yield { type: 'done' }
        return
      }

      let json: CerebrasChatCompletionResponse
      try {
        json = JSON.parse(data) as CerebrasChatCompletionResponse
      } catch {
        continue
      }

      const choice = json.choices?.[0]
      const delta =
        choice?.delta?.content ??
        choice?.message?.content ??
        ''

      if (delta) {
        yield { type: 'delta', delta }
      }

      if (json.usage || json.time_info) {
        yield {
          type: 'meta',
          usage: json.usage,
          timeInfo: json.time_info,
          model: json.model,
        }
      }
    }
  }

  yield { type: 'done' }
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text()
  } catch {
    return ''
  }
}
