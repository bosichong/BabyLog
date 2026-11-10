import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import {
  subscribeErrorNotifications,
  type ErrorNotification,
} from '@/lib/error-notification'

/** 全局接口失败弹窗，确保错误原因不会被页面内的小字提示淹没。 */
export default function ErrorDialog() {
  const [notification, setNotification] = useState<ErrorNotification | null>(null)

  useEffect(() => subscribeErrorNotifications(setNotification), [])

  if (!notification) return null

  const close = () => setNotification(null)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-message"
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-red-50 p-2 text-red-600 dark:bg-red-950 dark:text-red-400">
              <AlertCircle size={20} />
            </span>
            <h2 id="error-dialog-title" className="text-base font-semibold">
              操作失败
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="关闭错误提示"
          >
            <X size={18} />
          </button>
        </div>

        <p
          id="error-dialog-message"
          className="whitespace-pre-wrap break-words text-sm leading-6 text-neutral-700 dark:text-neutral-300"
        >
          {notification.message}
        </p>

        <button
          type="button"
          onClick={close}
          className="mt-5 w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white active:bg-red-700"
        >
          知道了
        </button>
      </div>
    </div>
  )
}
