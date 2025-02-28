"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import { babyAPI, healthAPI } from "@/lib/api";
import AddHealthRecordForm from "@/components/health/add-health-record-form";
import BabyFilter from "@/components/health/baby-filter";
import HealthRecordsTable from "@/components/health/health-records-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function HealthPage() {
  const [babies, setBabies] = useState([]);
  const [selectedBabies, setSelectedBabies] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [error, setError] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 获取宝宝列表
  useEffect(() => {
    const fetchBabies = async () => {
      try {
        const data = await babyAPI.getBabies();
        setBabies(data);
        if (data.length > 0) {
          setSelectedBabies([data[0].id]);
        }
      } catch (err) {
        setError("获取宝宝列表失败");
        console.error("获取宝宝列表失败:", err);
      }
    };

    fetchBabies();
  }, []);

  // 获取健康记录
  useEffect(() => {
    const fetchHealthRecords = async () => {
      try {
        if (selectedBabies.length === 0) {
          setHealthRecords([]);
          return;
        }
        const data = await healthAPI.getHealthRecords({ baby_ids: selectedBabies });
        // 按时间倒序排序，并筛选只显示选中宝宝的记录
        const filteredData = data.filter(record => selectedBabies.includes(record.Baby?.id));
        const sortedData = filteredData.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
        setHealthRecords(sortedData);
      } catch (err) {
        setError("获取健康记录失败");
        console.error("获取健康记录失败:", err);
      }
    };

    fetchHealthRecords();
  }, [selectedBabies]);

  // 刷新健康记录
  const refreshHealthRecords = async () => {
    try {
      const data = await healthAPI.getHealthRecords({ baby_ids: selectedBabies });
      const filteredData = data.filter(record => selectedBabies.includes(record.Baby?.id));
      const sortedData = filteredData.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
      setHealthRecords(sortedData);
    } catch (err) {
      setError("获取健康记录失败");
      console.error("获取健康记录失败:", err);
    }
  };

  // 处理记录添加成功
  const handleRecordAdded = () => {
    setIsCreateDialogOpen(false);
    refreshHealthRecords();
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">健康记录</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>添加记录</Button>
        </div>

        {/* 记录列表筛选 */}
        <BabyFilter
          babies={babies}
          selectedBabies={selectedBabies}
          onBabiesChange={setSelectedBabies}
        />

        {/* 健康记录列表 */}
        <HealthRecordsTable
          records={healthRecords}
          onRecordsChange={refreshHealthRecords}
        />

        {error && <div className="text-red-500 mt-4">{error}</div>}

        {/* 添加记录对话框 */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加健康记录</DialogTitle>
              <DialogDescription>
                为宝宝添加新的身高体重记录
              </DialogDescription>
            </DialogHeader>
            <AddHealthRecordForm babies={babies} onSuccess={handleRecordAdded} />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}