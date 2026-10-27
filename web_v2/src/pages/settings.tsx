import { useState } from 'react'
import UsersTab from '@/components/settings/users-tab'
import BabiesTab from '@/components/settings/babies-tab'
import HealthTab from '@/components/settings/health-tab'

const TABS = [
  { key: 'users', label: '用户' },
  { key: 'babies', label: '宝贝' },
  { key: 'health', label: '健康数据' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('users')

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">管理</h1>

      {/* Tab 切换 */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-200/60 dark:bg-neutral-800/60 p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'babies' && <BabiesTab />}
      {tab === 'health' && <HealthTab />}
    </div>
  )
}
