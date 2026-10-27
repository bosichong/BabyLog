interface Props {
  full?: boolean
}

/** 页面级加载占位 */
export default function PageLoading({ full }: Props) {
  return (
    <div
      className={`flex items-center justify-center ${
        full ? 'min-h-dvh' : 'min-h-[50vh]'
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 dark:border-neutral-700 border-t-blue-600" />
        <span className="text-xs text-neutral-400 dark:text-neutral-500">加载中</span>
      </div>
    </div>
  )
}
