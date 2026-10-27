/** 相对时间：3分钟前、2天前 */
export function formatTimeAgo(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)
  const months =
    (now.getFullYear() - then.getFullYear()) * 12 + now.getMonth() - then.getMonth()
  const years = now.getFullYear() - then.getFullYear()

  if (seconds < 60) return `${seconds}秒`
  if (minutes < 60) return `${minutes}分钟`
  if (hours < 24) return `${hours}小时`
  if (days < 30) return `${days}天`
  if (months < 12) return `${months}个月`
  return `${years}年`
}

/** 2026年10月27日 */
export function formatFullDate(date: string | Date): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(
    d.getDate(),
  ).padStart(2, '0')}日`
}

/** 2026/10/27 */
export function formatShortDate(date: string | Date): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** 去掉 HTML 标签，只留纯文本（日志内容存的是 HTML 字符串） */
export function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

/** 计算从出生到今天的年龄 */
export function calcAge(birthday: string) {
  const birth = new Date(birthday)
  const today = new Date()
  const days = Math.floor((today.getTime() - birth.getTime()) / 86400000)
  return {
    days,
    years: Math.floor(days / 365),
  }
}

/** 生成本地时间的 datetime-local 值 */
export function toLocalInput(date: string | Date): string {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}
