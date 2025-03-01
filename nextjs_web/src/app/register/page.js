"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authAPI } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData(event.currentTarget);
      const password = formData.get("password");
      const confirmPassword = formData.get("confirmPassword");

      if (password !== confirmPassword) {
        throw new Error("两次输入的密码不一致");
      }

      await authAPI.register({
        username: formData.get("username"),
        password: password,
        familymember: formData.get("familymember") || '默认成员',
        sex: formData.get("sex") || '男',
        is_active: false
      });

      router.push("/login");
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setError('网络连接失败，请确保服务器已启动并且网络连接正常');
      } else {
        setError(error.message || "注册失败，请稍后重试");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">注册账户</h1>
          <p className="text-sm text-muted-foreground">创建您的新账户</p>
        </div>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                name="username"
                placeholder="请输入用户名"
                type="text"
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect="off"
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                placeholder="请输入密码"
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                placeholder="请再次输入密码"
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="familymember">家庭成员</Label>
              <Input
                id="familymember"
                name="familymember"
                placeholder="请输入家庭成员称呼"
                type="text"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sex">性别</Label>
              <select
                id="sex"
                name="sex"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                disabled={isLoading}
              >
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "注册中..." : "注册"}
            </Button>
          </div>
        </form>
        <div className="text-center text-sm">
          已有账户？
          <a
            href="/login"
            className="underline hover:text-primary"
          >
            立即登录
          </a>
        </div>
      </div>
    </div>
  );
}