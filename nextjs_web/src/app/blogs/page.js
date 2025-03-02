"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { blogAPI } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/use-toast";
import { formatTimeAgo } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UPLOAD_CONFIG } from "@/lib/config";

export default function BlogsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await blogAPI.getBlogs({
        page,
        pageSize,
        keyword,
      });
      setBlogs(response.items || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError("获取博客列表失败");
      console.error("获取博客列表失败:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  // 初始加载和搜索/分页变化时获取数据
  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // 搜索时重置页码到第一页
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleDelete = async (blogId) => {
    if (window.confirm('确定要删除这条博客吗？')) {
      try {
        await blogAPI.deleteBlog({ id: blogId });
        toast({
          title: "删除成功",
          description: "博客已成功删除",
        });
        fetchBlogs();
      } catch (err) {
        toast({
          title: "删除失败",
          description: err.message || "删除博客失败，请稍后重试",
          variant: "destructive",
        });
        console.error('删除博客失败:', err);
      }
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="搜索博客内容..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1"
            />
          </div>
        </form>

        {/* 博客列表 */}
        {loading ? (
          <div className="text-center py-4">加载中...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : blogs.length > 0 ? (
          <div className="space-y-4">
            {blogs.map((blog) => (
              <div key={blog.id} className="border rounded-lg overflow-hidden">
                <div className="border-b p-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500 text-left">
                      {blog.user.familymember}:在 <TooltipProvider><Tooltip><TooltipTrigger><span>{formatTimeAgo(blog.create_time)}前</span></TooltipTrigger><TooltipContent>{new Date(blog.create_time).getFullYear()}年{String(new Date(blog.create_time).getMonth() + 1).padStart(2, '0')}月{String(new Date(blog.create_time).getDate()).padStart(2, '0')}日</TooltipContent></Tooltip></TooltipProvider> 添加了一条{blog.babies && blog.babies.length > 0 ? `关于${blog.babies.map(baby => baby.name).join('、')}` : ''} 数据
                    </div>
                    <div className="flex gap-2">
                      <Button
                      variant="link"
                        size="sm"
                        onClick={() => router.push(`/blogs/edit/${blog.id}`)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleDelete(blog.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className=" text-left">
                    {blog.blog.replace(/<[^>]*>/g, '')}
                  </div>
                  {blog.photos && blog.photos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {blog.photos.map((photo) => (
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
            ))}
          </div>
        ) : (
          <div className="text-center py-4">暂无博客内容</div>
        )}

        {/* 分页 */}
        {!loading && blogs.length > 0 && (
          <div className="flex justify-center mt-6">
            <Pagination
              page={page}
              total={Math.ceil(total / pageSize)}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}