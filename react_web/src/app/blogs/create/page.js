"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { babyAPI, blogAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";

export default function CreateBlogPage() {
  const router = useRouter();
  const [babies, setBabies] = useState([]);
  const [selectedBabies, setSelectedBabies] = useState([]);
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blogCreated, setBlogCreated] = useState(false);
  const blogCreatedRef = useRef(false);
  
  // 同步 Ref 与状态
  blogCreatedRef.current = blogCreated;

  // 获取宝宝列表
  useEffect(() => {
    const fetchBabies = async () => {
      try {
        const data = await babyAPI.getBabies();
        setBabies(data);
      } catch (err) {
        setError("获取宝宝列表失败");
        console.error("获取宝宝列表失败:", err);
      }
    };

    fetchBabies();
  }, []);

  // 处理图片上传
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    setError("");

    try {
      const uploadedPhotos = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        // 获取认证token
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

        const response = await fetch("http://localhost:8887/v1/photos/uploadfile", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`上传失败: ${file.name}`);
        }

        const data = await response.json();
        uploadedPhotos.push(data);
      }

      setPhotos([...photos, ...uploadedPhotos]);
    } catch (err) {
      setError("图片上传失败");
      console.error("图片上传失败:", err);
    } finally {
      setUploading(false);
    }
  };

  // 删除已上传的图片
  const deleteUploadedPhotos = async (photos) => {
    if (!photos || photos.length === 0) return;

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      for (const photo of photos) {
        if (!photo || !photo.file_path) continue;
        
        await fetch("http://localhost:8887/v1/photos/delete_img", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ photo_path: photo.file_path }),
        });
      }
    } catch (err) {
      console.error("删除图片失败:", err);
    }
  };

  // 修改页面卸载时的清理逻辑，只在用户离开页面且博客未创建成功时删除图片
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (photos.length > 0 && !blogCreatedRef.current) {
        deleteUploadedPhotos(photos);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [photos]); // 仅依赖 photos

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!content.trim()) {
      setError("请输入博客内容");
      return;
    }

    if (selectedBabies.length === 0) {
      setError("请选择至少一个宝宝");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 创建博客，确保photo_ids包含完整的图片信息
      const blogData = {
        blog: content,
        baby_ids: selectedBabies,
        photo_ids: photos.map(photo => ({
          id: photo.id,
          file_name: photo.file_name,
          file_path: photo.file_path,
          file_url: photo.file_url
        }))
      };

      await blogAPI.createBlog(blogData);
      
      // 博客创建成功后，立即同步更新状态
      setBlogCreated(true);
      setContent("");
      setSelectedBabies([]);
      setError("");
      setPhotos([]);
      
      // 重置文件选择框
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = "";
      }

      // 显示成功提示
      setError("博客创建成功！");
    } catch (err) {
      setError(err.message || "创建博客失败，请稍后重试");
      console.error("创建博客失败:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">创建新日志</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 图片上传区域 */}
          <div className="space-y-4">
            <Label>上传图片</Label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="cursor-pointer"
            />

            {/* 图片预览 */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <Dialog key={`dialog-${photo.id || index}`}>
                    <DialogTrigger>
                      <img
                        src={`http://localhost:8887/uploads/${photo.file_path}`}
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
                        src={`http://localhost:8887/uploads/${photo.file_path}`}
                        alt={photo.file_name}
                        className="w-full h-auto max-h-[90vh] object-contain"
                      />
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            )}
          </div>

          {/* 宝宝选择 */}
          <div className="space-y-4">
            <Label>选择关联的宝宝</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {babies.map((baby) => (
                <div key={baby.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`baby-${baby.id}`}
                    checked={selectedBabies.includes(baby.id)}
                    onCheckedChange={(checked) => {
                      setSelectedBabies(
                        checked
                          ? [...selectedBabies, baby.id]
                          : selectedBabies.filter((id) => id !== baby.id)
                      );
                    }}
                  />
                  <Label htmlFor={`baby-${baby.id}`}>{baby.name}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* 博客内容 */}
          <div className="space-y-4">
            <Label>日志内容</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你想记录的内容..."
              className="min-h-[200px]"
            />
          </div>

          {error && <div className="text-red-500">{error}</div>}

          <Button
            type="submit"
            disabled={loading || uploading}
            className="w-full"
          >
            {loading ? "保存中..." : "保存日志"}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}