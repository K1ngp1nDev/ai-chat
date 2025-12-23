import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'

const renderer = new marked.Renderer()

renderer.code = (code: string, infostring: string | undefined) => {
  const lang = (infostring ?? '').match(/\S+/)?.[0] ?? ''
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(code, { language }).value
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
}

marked.setOptions({
  gfm: true,
  breaks: true,
  renderer,
})

export function renderMarkdown(md: string): string {
  const html = marked.parse(md) as string
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}
