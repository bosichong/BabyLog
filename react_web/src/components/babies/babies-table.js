"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function BabiesTable({ babies, onEdit, onDelete, loading, error }) {
  if (loading) {
    return <div className="text-center py-4">加载中...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">姓名</TableHead>
            <TableHead className="text-left">出生日期</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {babies.map((baby) => (
            <TableRow key={baby.id}>
              <TableCell className="whitespace-nowrap">{baby.name}</TableCell>
              <TableCell className="whitespace-nowrap">{baby.birthday}</TableCell>
              <TableCell className="whitespace-nowrap text-right">
                <Button
                  variant="ghost"
                  className="mr-2"
                  onClick={() => onEdit(baby)}
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => onDelete(baby.id)}
                >
                  删除
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}