"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { healthAPI } from "@/lib/api";

export default function AddHealthRecordForm({ babies, onSuccess }) {
  const { toast } = useToast();
  const [selectedBaby, setSelectedBaby] = useState(babies[0]?.id || null);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!selectedBaby) {
      toast({
        title: "验证失败",
        description: "请选择宝宝",
        variant: "destructive"
      });
      return;
    }

    if (!height.trim() || !weight.trim()) {
      toast({
        title: "验证失败",
        description: "请输入身高和体重",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await healthAPI.createHealthRecord({
        baby_id: selectedBaby,
        height: parseFloat(height),
        weight: parseFloat(weight)
      });

      // 重置表单
      setHeight("");
      setWeight("");
      toast({
        title: "添加成功",
        description: "健康记录已成功添加"
      });

      // 通知父组件刷新数据
      onSuccess && onSuccess();
    } catch (err) {
      toast({
        title: "添加失败",
        description: err.message || "添加健康记录失败，请稍后重试",
        variant: "destructive"
      });
      console.error("添加健康记录失败:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>选择宝宝</Label>
          <RadioGroup
            value={selectedBaby}
            onValueChange={setSelectedBaby}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {babies.map((baby) => (
              <div key={baby.id} className="flex items-center space-x-2">
                <RadioGroupItem value={baby.id} id={`baby-${baby.id}`} />
                <Label htmlFor={`baby-${baby.id}`}>{baby.name}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="height">身高 (cm)</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="请输入身高"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">体重 (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="请输入体重"
            />
          </div>
        </div>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "添加中..." : "添加记录"}
      </Button>
    </form>
  );
}