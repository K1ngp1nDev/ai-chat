import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function formatClockTime(iso: string): string {
  return dayjs(iso).format('HH:mm')
}

export function formatRelativeTime(iso: string): string {
  try {
    return dayjs(iso).fromNow()
  } catch {
    return ''
  }
}
