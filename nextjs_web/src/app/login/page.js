"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authAPI, userAPI } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData(event.currentTarget);
      const data = await authAPI.login({
        username: formData.get("username"),
        password: formData.get("password")
      });
      
      // 将token同时存储到localStorage和cookie中
      localStorage.setItem("access_token", data.access_token);
      document.cookie = `token=${data.access_token}; path=/`;
      router.push("/");
      router.refresh();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setError('网络连接失败，请确保服务器已启动并且网络连接正常');
      } else if (error.error === 'INVALID_PASSWORD') {
        setError('密码错误');
      } else if (error.error === 'ACCOUNT_DISABLED') {
        setError('账户已被禁用');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("登录失败，请稍后重试");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">登录账户</h1>
          <p className="text-sm text-muted-foreground">输入您的用户名和密码登录</p>
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
                autoComplete="current-password"
                disabled={isLoading}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "登录中..." : "登录"}
            </Button>
          </div>
        </form>
        <div className="text-center text-sm">
          还没有账户？
          <a
            href="/register"
            className="underline hover:text-primary"
          >
            注册新账户
          </a>
        </div>
      </div>
    </div>
  );
}