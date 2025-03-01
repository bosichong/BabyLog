"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ModeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export default function MainLayout({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    localStorage.removeItem('access_token');
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <a href="/" className="text-xl font-bolde">BabyLog</a>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="/" className="inline-flex items-center px-1 pt-1">
                  首页
                </a>
                <a href="/blogs" className="inline-flex items-center px-1 pt-1">
                  日志
                </a>
                <a href="/blogs/create" className="inline-flex items-center px-1 pt-1">
                  添加日志
                </a>
                <a href="/health" className="inline-flex items-center px-1 pt-1">
                  健康
                </a>
                <a href="/users" className="inline-flex items-center px-1 pt-1">
                  管理
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ModeToggle />
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
              >
                <LogOut className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">退出登录</span>
              </Button>
              {/* 移动端菜单按钮 */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="sm:hidden"
                  >
                    <Menu className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">打开菜单</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[240px] sm:hidden">
                  <SheetTitle className="text-lg font-semibold">导航菜单</SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground">选择要访问的页面</SheetDescription>
                  <nav className="flex flex-col space-y-4">
                    <a
                      href="/"
                      className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent"
                    >
                      首页
                    </a>
                    <a
                      href="/blogs"
                      className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent"
                    >
                      日志
                    </a>
                    <a
                      href="/blogs/create"
                      className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent"
                    >
                      添加日志
                    </a>
                    <a
                      href="/health"
                      className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent"
                    >
                      健康
                    </a>
                    <a
                      href="/users"
                      className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent"
                    >
                      管理
                    </a>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}