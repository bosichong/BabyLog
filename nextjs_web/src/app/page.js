"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import { babyAPI, blogAPI } from "@/lib/api";
import { UPLOAD_CONFIG } from "@/lib/config";
import GrowthChart from "@/components/health/GrowthChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Home() {
  const [babies, setBabies] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取宝宝信息
        const data = await babyAPI.getBabies();
        const babiesWithBlogCount = await Promise.all(
          data.map(async (baby) => {
            try {
              const count = await babyAPI.getBlogCountByBabyId({ babyId: baby.id });
              return { ...baby, records_count: count };
            } catch (err) {
              console.error(`获取宝宝${baby.name}的博客数量失败:`, err);
              return { ...baby, records_count: 0 };
            }
          })
        );
        setBabies(babiesWithBlogCount);

        // 获取往年今日的回忆
        const memoriesData = await blogAPI.getMemoriesToday();
        setMemories(memoriesData);
      } catch (err) {
        setError("获取数据失败");
        console.error("获取数据失败:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">欢迎使用 BabyLog</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          记录您宝宝的每一个精彩时刻
        </p>

        {loading ? (
          <div className="text-center py-4">加载中...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <>
            {/* 宝宝信息 */}
            {babies.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 mb-8 max-w-5xl mx-auto w-full">
                {babies.map((baby) => {
                  const birthDate = new Date(baby.birthday);
                  const today = new Date();
                  const ageInMilliseconds = today - birthDate;
                  const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
                  const ageInYears = Math.floor(ageInDays / 365);

                  return (
                    <Card key={baby.id}>
                      <CardHeader>
                        <CardTitle>Baby: {baby.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-gray-600 dark:text-gray-400 space-y-1">
                          <p>出生于: {baby.birthday}, 年龄: {ageInYears}岁</p>
                          <p>您的孩纸已经出生: {ageInDays}天</p>
                          <p>系统中共有{baby.records_count || 0}条关于ta的记录</p>
                        </div>
                      </CardContent>
                      <GrowthChart babyId={baby.id} babyName={baby.name} />
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-left py-4 mb-8">暂无宝宝信息</div>
            )}

            {/* 往年今日 */}
            <div className="w-full mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-left">往年今日</h2>
              {memories && memories.length > 0 ? (
                <div className="space-y-4">
                  {memories.map((memory) => {
                    const postDate = new Date(memory.create_time);
                    const yearsAgo = !isNaN(postDate.getTime()) ? new Date().getFullYear() - postDate.getFullYear() : 0;
                    return (
                      <div key={memory.id} className=" border rounded-lg overflow-hidden">
                        <div className=" border-b p-3">
                          <div className=" flex justify-between items-center">
                            <div className=" text-sm text-gray-500 text-left">
                              {memory.user.familymember}:在 <TooltipProvider><Tooltip><TooltipTrigger><span>{yearsAgo}年前</span></TooltipTrigger><TooltipContent>{postDate.getFullYear()}年{String(postDate.getMonth() + 1).padStart(2, '0')}月{String(postDate.getDate()).padStart(2, '0')}日</TooltipContent></Tooltip></TooltipProvider> 添加了一条{memory.babies && memory.babies.length > 0 ? `关于${memory.babies.map(baby => baby.name).join('、')}` : ''} 数据
                            </div>
                          </div>
                        </div>
                        <div className=" p-3">
                          <div className=" text-left">
                            {memory.blog.replace(/<[^>]*>/g, '')}
                          </div>
                          {memory.photos && memory.photos.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                              {memory.photos.map((photo) => (
                                <Dialog key={photo.id}>
                                  <DialogTrigger>
                                    <img
                                      src={UPLOAD_CONFIG.getFileUrl(photo.file_path)}
                                      alt={photo.file_name}
                                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-0">
                                    <DialogTitle className="sr-only">图片预览</DialogTitle>
                                    <DialogDescription className="sr-only">
                                      查看上传的图片大图，按ESC键关闭预览
                                    </DialogDescription>
                                    <img
                                      src={UPLOAD_CONFIG.getFileUrl(photo.file_path)}
                                      alt={photo.file_name}
                                      className="w-full h-auto max-h-[90vh] object-contain"
                                    />
                                  </DialogContent>
                                </Dialog>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">往年的今天还没有数据，不如现在添加一条吧！</p>
                  <Button 
                    onClick={() => window.location.href = '/blogs/create'}
                    className="bg-primary hover:bg-primary/90"
                  >
                    添加日志
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
