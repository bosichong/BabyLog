"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { healthAPI } from '@/lib/api';

export default function GrowthChart({ babyId, babyName }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const records = await healthAPI.getHealthRecords({ baby_id: babyId });
        // 处理数据，按日期排序
        const processedData = records
          .filter(record => record.baby_id === babyId)
          .map(record => ({
            date: new Date(record.create_time).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }),
            height: record.height,
            weight: record.weight
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setData(processedData);
      } catch (err) {
        setError("获取生长记录失败");
        console.error("获取生长记录失败:", err);
      } finally {
        setLoading(false);
      }
    };

    if (babyId) {
      fetchData();
    }
  }, [babyId]);

  if (loading) return <div className="text-center py-4">加载中...</div>;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
  if (data.length === 0) return <div className="text-center py-4">暂无生长记录数据</div>;

  return (

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 50, left: 30, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="height" orientation="left" label={{ value: '身高 (cm)', angle: -90, position: 'insideLeft', offset: -15 }} />
              <YAxis yAxisId="weight" orientation="right" label={{ value: '体重 (kg)', angle: 90, position: 'insideRight', offset: 15 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Line yAxisId="height" type="monotone" dataKey="height" stroke="#8884d8" name="身高" dot={{ r: 4 }} />
              <Line yAxisId="weight" type="monotone" dataKey="weight" stroke="#82ca9d" name="体重" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
  );
}