import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import type { Theme } from '@/lib/theme'

const ORDER: Theme[] = ['light', 'dark', 'system']
const ICONS = { light: Sun, dark: Moon, system: Monitor }
const LABELS = { light: '浅色', dark: '深色', system: '跟随系统' }

interface Props {
  /** 是否显示文字标签（PC 侧边栏用） */
  showLabel?: boolean
  className?: string
}

/** 点一下循环切换：浅色 → 深色 → 跟随系统 */
export default function ThemeToggle({ showLabel = false, className = '' }: Props) {
  const { theme, setTheme } = useTheme()
  const Icon = ICONS[theme]
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`当前：${LABELS[theme]}，点击切换为「${LABELS[next]}」`}
      aria-label={`切换主题，当前${LABELS[theme]}`}
      className={`flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700 ${className}`}
    >
      <Icon size={14} />
      {showLabel && <span>{LABELS[theme]}</span>}
    </button>
  )
}
