import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { healthAPI } from '@/lib/api'
import { useTheme } from '@/lib/theme'

interface Props {
  babyId: number
}

interface Point {
  date: string
  height: number | null
  weight: number | null
}

export default function GrowthChart({ babyId }: Props) {
  const { resolved } = useTheme()
  const dark = resolved === 'dark'
  const [data, setData] = useState<Point[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const records = await healthAPI.list([babyId])
        if (cancelled) return
        const points = records
          .map((r) => {
            const d = new Date(r.created_at)
            return {
              ts: d.getTime(),
              date: `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
                d.getDate(),
              ).padStart(2, '0')}`,
              height: r.height,
              weight: r.weight,
            }
          })
          .sort((a, b) => a.ts - b.ts)
          .map(({ date, height, weight }) => ({ date, height, weight }))
        setData(points)
      } catch {
        if (!cancelled) setError('获取生长记录失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (babyId) load()
    return () => {
      cancelled = true
    }
  }, [babyId])

  if (loading) return <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">加载中...</div>
  if (error) return <div className="py-8 text-center text-sm text-red-500 dark:text-red-400">{error}</div>
  if (data.length === 0)
    return <div className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">暂无生长记录数据</div>

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#3f3f46' : '#e5e5e5'} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: dark ? '#a1a1aa' : '#737373' }}
            tickMargin={8}
            stroke={dark ? '#52525b' : '#d4d4d4'}
          />
          <YAxis
            yAxisId="height"
            orientation="left"
            tick={{ fontSize: 11, fill: dark ? '#a1a1aa' : '#737373' }}
            width={44}
            stroke={dark ? '#52525b' : '#d4d4d4'}
            label={{ value: '身高 (cm)', angle: -90, position: 'insideLeft', fontSize: 11, fill: dark ? '#a1a1aa' : '#737373' }}
          />
          <YAxis
            yAxisId="weight"
            orientation="right"
            tick={{ fontSize: 11, fill: dark ? '#a1a1aa' : '#737373' }}
            width={44}
            stroke={dark ? '#52525b' : '#d4d4d4'}
            label={{ value: '体重 (kg)', angle: 90, position: 'insideRight', fontSize: 11, fill: dark ? '#a1a1aa' : '#737373' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: dark ? '#18181b' : '#ffffff',
              border: `1px solid ${dark ? '#3f3f46' : '#e5e5e5'}`,
              borderRadius: 10,
              fontSize: 12,
              color: dark ? '#f4f4f5' : '#171717',
            }}
            labelStyle={{ color: dark ? '#a1a1aa' : '#525252' }}
          />
          <Legend verticalAlign="top" height={32} iconType="circle" />
          <Line
            yAxisId="height"
            type="monotone"
            dataKey="height"
            name="身高"
            stroke={dark ? '#a5a0f5' : '#8884d8'}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weight"
            name="体重"
            stroke={dark ? '#4ade80' : '#22c55e'}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
