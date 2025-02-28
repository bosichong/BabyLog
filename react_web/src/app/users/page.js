"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { userAPI, babyAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable from "@/components/common/data-table";
import DataForm from "@/components/common/data-form";

export default function UsersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("users");

  // 用户管理状态
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    username: "",
    password: "",
    familymember: "",
    sex: "1",
    is_active: true
  });

  // 宝贝管理状态
  const [babies, setBabies] = useState([]);
  const [editingBaby, setEditingBaby] = useState(null);
  const [isEditBabyDialogOpen, setIsEditBabyDialogOpen] = useState(false);
  const [isCreateBabyDialogOpen, setIsCreateBabyDialogOpen] = useState(false);
  const [babyFormData, setBabyFormData] = useState({
    name: "",
    birthday: ""
  });

  // 通用状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await userAPI.getUsers();
      setUsers(data);
    } catch (err) {
      setError("获取用户列表失败");
      console.error("获取用户列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  // 获取宝贝列表
  const fetchBabies = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await babyAPI.getBabies();
      setBabies(data);
    } catch (err) {
      setError("获取宝宝列表失败");
      console.error("获取宝宝列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchBabies();
    }
  }, [activeTab]);

  // 用户管理功能
  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username || "",
      password: "",
      familymember: user.familymember || "",
      sex: user.sex || "1",
      is_active: user.is_active !== undefined ? user.is_active : true
    });
    setIsEditUserDialogOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userAPI.createUser(userFormData);
      toast({
        title: "创建成功",
        description: "用户已成功创建",
      });
      setIsCreateUserDialogOpen(false);
      setUserFormData({
        username: "",
        password: "",
        familymember: "",
        sex: "1",
        is_active: true
      });
      fetchUsers();
    } catch (err) {
      toast({
        title: "创建失败",
        description: err.message || "创建用户失败，请稍后重试",
        variant: "destructive",
      });
      console.error("创建用户失败:", err);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        id: editingUser.id,
        ...userFormData
      };
      await userAPI.updateUser(submitData);
      toast({
        title: "更新成功",
        description: "用户信息已成功更新",
      });
      setIsEditUserDialogOpen(false);
      fetchUsers();
    } catch (err) {
      toast({
        title: "更新失败",
        description: err.message || "更新用户失败，请稍后重试",
        variant: "destructive",
      });
      console.error("更新用户失败:", err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("确定要删除这个用户吗？")) {
      try {
        await userAPI.deleteUser({ id: userId });
        toast({
          title: "删除成功",
          description: "用户已成功删除",
        });
        fetchUsers();
      } catch (err) {
        toast({
          title: "删除失败",
          description: err.message || "删除用户失败，请稍后重试",
          variant: "destructive",
        });
        console.error("删除用户失败:", err);
      }
    }
  };

  // 用户表单字段配置
  const userFormFields = [
    {
      name: "username",
      render: (values) => (
        <div className="grid gap-2">
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            value={values.username}
            onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
            required
          />
        </div>
      ),
    },
    {
      name: "password",
      render: (values) => (
        <div className="grid gap-2">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            value={values.password}
            onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
            placeholder="留空表示不修改密码"
            required={!editingUser}
          />
        </div>
      ),
    },
    {
      name: "familymember",
      render: (values) => (
        <div className="grid gap-2">
          <Label htmlFor="familymember">家庭成员</Label>
          <Input
            id="familymember"
            value={values.familymember}
            onChange={(e) => setUserFormData({ ...userFormData, familymember: e.target.value })}
            required
          />
        </div>
      ),
    },
    {
      name: "sex",
      render: (values) => (
        <div className="grid gap-2">
          <Label htmlFor="sex">性别</Label>
          <select
            id="sex"
            value={values.sex}
            onChange={(e) => setUserFormData({ ...userFormData, sex: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="1">男</option>
            <option value="2">女</option>
          </select>
        </div>
      ),
    },
  ];

  // 宝贝管理功能
  const handleEditBaby = (baby) => {
    setEditingBaby(baby);
    setBabyFormData({
      name: baby.name || "",
      birthday: baby.birthday || ""
    });
    setIsEditBabyDialogOpen(true);
  };

  const handleCreateBaby = async (e) => {
    e.preventDefault();
    try {
      await babyAPI.createBaby(babyFormData);
      toast({
        title: "创建成功",
        description: "宝宝信息已成功创建",
      });
      setIsCreateBabyDialogOpen(false);
      setBabyFormData({
        name: "",
        birthday: ""
      });
      fetchBabies();
    } catch (err) {
      toast({
        title: "创建失败",
        description: err.message || "创建宝宝信息失败，请稍后重试",
        variant: "destructive",
      });
      console.error("创建宝宝信息失败:", err);
    }
  };

  const handleUpdateBaby = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        id: editingBaby.id,
        ...babyFormData
      };
      await babyAPI.updateBaby(submitData);
      toast({
        title: "更新成功",
        description: "宝宝信息已成功更新",
      });
      setIsEditBabyDialogOpen(false);
      fetchBabies();
    } catch (err) {
      toast({
        title: "更新失败",
        description: err.message || "更新宝宝信息失败，请稍后重试",
        variant: "destructive",
      });
      console.error("更新宝宝信息失败:", err);
    }
  };

  const handleDeleteBaby = async (babyId) => {
    if (window.confirm("确定要删除这个宝宝信息吗？")) {
      try {
        await babyAPI.deleteBaby({ id: babyId });
        toast({
          title: "删除成功",
          description: "宝宝信息已成功删除",
        });
        fetchBabies();
      } catch (err) {
        toast({
          title: "删除失败",
          description: err.message || "删除宝宝信息失败，请稍后重试",
          variant: "destructive",
        });
        console.error("删除宝宝信息失败:", err);
      }
    }
  };

  // 宝贝表单字段配置
  const babyFormFields = [
    {
      name: "name",
      render: (values) => (
        <div className="grid gap-2">
          <Label htmlFor="name">姓名</Label>
          <Input
            id="name"
            value={values.name}
            onChange={(e) => setBabyFormData({ ...babyFormData, name: e.target.value })}
            required
          />
        </div>
      ),
    },
    {
      name: "birthday",
      render: (values) => (
        <div className="grid gap-2">
          <Label htmlFor="birthday">出生日期</Label>
          <Input
            id="birthday"
            type="date"
            value={values.birthday}
            onChange={(e) => setBabyFormData({ ...babyFormData, birthday: e.target.value })}
            required
          />
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="babies">宝贝管理</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">用户管理</h1>
              <Button onClick={() => setIsCreateUserDialogOpen(true)}>添加用户</Button>
            </div>

            <DataTable
              columns={[
                { key: "username", title: "用户名" },
                { key: "familymember", title: "家庭成员" },
                { 
                  key: "sex", 
                  title: "性别",
                  render: (value) => value === "1" ? "男" : "女"
                },
                {
                  key: "is_active",
                  title: "状态",
                  render: (value) => (
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {value ? "启用" : "禁用"}
                    </span>
                  )
                }
              ]}
              data={users}
              actions={[
                {
                  label: "编辑",
                  variant: "ghost",
                  onClick: handleEditUser
                },
                {
                  label: "删除",
                  variant: "ghost",
                  className: "text-red-500",
                  onClick: (user) => handleDeleteUser(user.id)
                }
              ]}
              loading={loading}
              error={error}
            />

            {/* 编辑用户对话框 */}
            <DataForm
              title="编辑用户"
              description="修改用户的基本信息"
              fields={userFormFields}
              values={userFormData}
              onSubmit={handleUpdateUser}
              isOpen={isEditUserDialogOpen}
              onOpenChange={setIsEditUserDialogOpen}
            />

            {/* 创建用户对话框 */}
            <DataForm
              title="添加用户"
              description="添加新的用户，填写必要的基本信息"
              fields={userFormFields}
              values={userFormData}
              onSubmit={handleCreateUser}
              isOpen={isCreateUserDialogOpen}
              onOpenChange={setIsCreateUserDialogOpen}
            />
          </TabsContent>

          <TabsContent value="babies">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">宝贝管理</h1>
              <Button onClick={() => setIsCreateBabyDialogOpen(true)}>添加宝贝</Button>
            </div>

            <DataTable
              columns={[
                { key: "name", title: "姓名" },
                { key: "birthday", title: "出生日期" }
              ]}
              data={babies}
              actions={[
                {
                  label: "编辑",
                  variant: "ghost",
                  onClick: handleEditBaby
                },
                {
                  label: "删除",
                  variant: "ghost",
                  className: "text-red-500",
                  onClick: (baby) => handleDeleteBaby(baby.id)
                }
              ]}
              loading={loading}
              error={error}
            />

            {/* 编辑宝贝对话框 */}
            <DataForm
              title="编辑宝贝"
              description="修改宝贝的基本信息"
              fields={babyFormFields}
              values={babyFormData}
              onSubmit={handleUpdateBaby}
              isOpen={isEditBabyDialogOpen}
              onOpenChange={setIsEditBabyDialogOpen}
            />

            {/* 创建宝贝对话框 */}
            <DataForm
              title="添加宝贝"
              description="添加新的宝贝，填写必要的基本信息"
              fields={babyFormFields}
              values={babyFormData}
              onSubmit={handleCreateBaby}
              isOpen={isCreateBabyDialogOpen}
              onOpenChange={setIsCreateBabyDialogOpen}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}