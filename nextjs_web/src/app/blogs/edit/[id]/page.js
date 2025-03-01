"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { babyAPI, blogAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FULL_API_BASE_URL, UPLOAD_CONFIG } from "@/lib/config";

export default function EditBlogPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [babies, setBabies] = useState([]);
  const [selectedBabies, setSelectedBabies] = useState([]);
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blogUpdated, setBlogUpdated] = useState(false);
  const blogUpdatedRef = useRef(false);
  
  // 同步 Ref 与状态
  blogUpdatedRef.current = blogUpdated;

  // 删除已上传的图片
  const deleteUploadedPhotos = async (photos) => {
    if (!photos || photos.length === 0) return;

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      for (const photo of photos) {
        if (!photo || !photo.file_path) continue;
        
        await fetch(`${FULL_API_BASE_URL}/photos/delete_img`, {
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

  // 修改页面卸载时的清理逻辑，只在用户离开页面且博客未更新成功时删除新上传的图片
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (photos.length > 0 && !blogUpdatedRef.current) {
        // 获取新上传的图片（不包括原有图片）
        const newPhotos = photos.filter(photo => !photo.id);
        if (newPhotos.length > 0) {
          deleteUploadedPhotos(newPhotos);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [photos]);

  // 修改取消按钮的处理逻辑，添加图片清理
  const handleCancel = async () => {
    // 获取新上传的图片（不包括原有图片）
    const newPhotos = photos.filter(photo => !photo.id);
    if (newPhotos.length > 0) {
      await deleteUploadedPhotos(newPhotos);
    }
    router.push('/blogs');
  };

  // 获取宝宝列表和博客数据
  useEffect(() => {
    if (!params?.id) return;
    const fetchData = async () => {
      try {
        // 获取宝宝列表
        const babiesData = await babyAPI.getBabies();
        setBabies(babiesData);

        // 获取博客数据
        const blog = await blogAPI.getBlogById(parseInt(params.id));
        if (!blog) {
          throw new Error("博客不存在");
        }

        // 设置表单数据
        setContent(blog.blog);
        setSelectedBabies(blog.babies.map(baby => baby.id));
        setPhotos(blog.photos || []);
      } catch (err) {
        setError(err.message || "获取数据失败");
        console.error("获取数据失败:", err);
      }
    };

    fetchData();
  }, [params.id]);

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
        const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];

        const response = await fetch(`${FULL_API_BASE_URL}/photos/uploadfile`, {
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

  // 删除图片
  const handleDeletePhoto = (photo) => {
    // 只在前端维护已删除图片的状态
    setRemovedPhotoIds([...removedPhotoIds, photo.id]);
    setPhotos(photos.filter(p => p.id !== photo.id));
  };

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
      // 更新博客
      const blogData = {
        id: parseInt(params.id),
        blog: content,
        baby_ids: selectedBabies,
        photo_ids: photos.filter(photo => !removedPhotoIds.includes(photo.id)).map(photo => ({
          id: photo.id,
          file_name: photo.file_name,
          file_path: photo.file_path,
          file_url: photo.file_url
        })),
        removed_photo_ids: removedPhotoIds
      };

      await blogAPI.updateBlog(blogData);
      
      // 博客更新成功
      setBlogUpdated(true);
      setError("博客更新成功！");
      
      // 延迟跳转回列表页
      setTimeout(() => {
        router.push('/blogs');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err.message || "更新博客失败，请稍后重试");
      console.error("更新博客失败:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">编辑日志</h1>

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
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <Dialog key={`dialog-${photo.id}`}>
                      <DialogTrigger className="w-full ">
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
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeletePhoto(photo)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
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

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="outline"
              disabled={loading || uploading}
              className="flex-1"
            >
              {loading ? "保存中..." : "保存修改"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}