import { BookOpen, Code2, Coffee, ExternalLink, Heart } from 'lucide-react'

const LINKS = [
  {
    label: 'Gitee',
    url: 'https://gitee.com/J_Sky/babylog',
    icon: Code2,
  },
  {
    label: 'GitHub',
    url: 'https://github.com/bosichong/BabyLog',
    icon: Code2,
  },
] as const

const cardClass =
  'rounded-2xl bg-white p-4 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800'

export default function AboutTab() {
  return (
    <div className="space-y-3">
      <section className={cardClass}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
            <Heart size={19} fill="currentColor" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">关于 BabyLog</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {'BabyLog 是一个开源宝贝日记程序，不只可以记录孩子的成长点滴，也可以用来记录宠物宝贝的日常。支持文字、图片和视频日志，以及多宝贝、多家庭成员共同记录、那年今天、成长曲线和关键字搜索。'}
            </p>
            <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
              版本 3.1.0 · Apache License 2.0
            </p>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-sm font-semibold">开源地址</h2>
        <div className="mt-2 space-y-1.5">
          {LINKS.map(({ label, url, icon: Icon }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <Icon size={17} className="shrink-0 text-neutral-400 dark:text-neutral-500" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {url}
                </span>
              </span>
              <ExternalLink size={14} className="shrink-0 text-neutral-400 dark:text-neutral-500" />
            </a>
          ))}
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-sm font-semibold">作者</h2>
        <a
          href="https://www.suiyan.cc"
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          <BookOpen size={17} className="shrink-0 text-neutral-400 dark:text-neutral-500" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">J.sky 的博客</span>
            <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
              https://www.suiyan.cc
            </span>
          </span>
          <ExternalLink size={14} className="shrink-0 text-neutral-400 dark:text-neutral-500" />
        </a>
      </section>

      <section className={cardClass}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Coffee size={16} className="text-amber-600 dark:text-amber-400" />
          请喝咖啡
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          如果 BabyLog 对你有帮助，欢迎打赏请作者喝杯咖啡。
        </p>
        <a
          href="/donate.jpg"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block overflow-hidden rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-700"
          aria-label="查看打赏图片"
        >
          <img
            src="/donate.jpg"
            alt="请作者喝咖啡打赏图片"
            width={510}
            height={510}
            loading="lazy"
            className="h-44 w-44 object-cover"
          />
        </a>
        <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
          点击图片可查看原图并保存
        </p>
      </section>
    </div>
  )
}
