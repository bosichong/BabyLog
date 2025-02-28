"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Pagination } from "@/components/ui/pagination";
import { healthAPI } from "@/lib/api";

export default function HealthRecordsTable({ records, onRecordsChange }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 处理分页变化
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // 处理编辑记录
  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditHeight(record.height.toString());
    setEditWeight(record.weight.toString());
  };

  // 处理更新记录
  const handleUpdate = async () => {
    if (!editingRecord || loading) return;

    setLoading(true);
    try {
      await healthAPI.updateHealthRecord({
        id: editingRecord.id,
        height: parseFloat(editHeight),
        weight: parseFloat(editWeight)
      });

      setEditingRecord(null);
      toast({
        title: "更新成功",
        description: "健康记录已成功更新"
      });
      onRecordsChange && onRecordsChange();
    } catch (err) {
      toast({
        title: "更新失败",
        description: err.message || "更新健康记录失败，请稍后重试",
        variant: "destructive"
      });
      console.error("更新健康记录失败:", err);
    } finally {
      setLoading(false);
    }
  };

  // 删除健康记录
  const handleDelete = async (recordId) => {
    if (!window.confirm('确定要删除这条记录吗？')) return;

    try {
      await healthAPI.deleteHealthRecord({ id: recordId });
      toast({
        title: "删除成功",
        description: "健康记录已成功删除"
      });
      onRecordsChange && onRecordsChange();
    } catch (err) {
      toast({
        title: "删除失败",
        description: err.message || "删除记录失败，请稍后重试",
        variant: "destructive"
      });
      console.error('删除记录失败:', err);
    }
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>宝宝</TableHead>
              <TableHead>身高 (cm)</TableHead>
              <TableHead>体重 (kg)</TableHead>
              <TableHead>记录时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records
              .slice((page - 1) * pageSize, page * pageSize)
              .map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.Baby?.name}</TableCell>
                  <TableCell>{record.height}</TableCell>
                  <TableCell>{record.weight}</TableCell>
                  <TableCell>{formatDate(record.create_time)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-500 hover:text-blue-600 mr-2"
                      onClick={() => handleEdit(record)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(record.id)}
                    >
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  暂无记录
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {records.length > 0 && (
        <div className="flex justify-center mt-6">
          <Pagination
            page={page}
            total={Math.ceil(records.length / pageSize)}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* 编辑对话框 */}
      <Dialog open={!!editingRecord} onOpenChange={() => !loading && setEditingRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑健康记录</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-height">身高 (cm)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  step="0.1"
                  value={editHeight}
                  onChange={(e) => setEditHeight(e.target.value)}
                  placeholder="请输入身高"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-weight">体重 (kg)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  step="0.1"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  placeholder="请输入体重"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)} disabled={loading}>
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}