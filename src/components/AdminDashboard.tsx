"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getJSON, patchJSON, del, postJSON } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  LogOut,
  ShieldCheck,
  Trash2,
  User,
  Users,
  KeyRound,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Phone,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "./ui/badge";
import bcrypt from "bcryptjs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Skeleton } from "./ui/skeleton";
import { getUsersWithUsageData } from "@/app/actions";

interface UserData {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  avatarUrl: string | null;
  role: "admin" | "user";
  status: "active" | "pending" | "banned";
  geminiApiKey?: string;
  canManageApiKey?: boolean;
  chatCount?: number;
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  chatRequests?: number;
}

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>("displayName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // State for API Key management dialog
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [currentUserApiKey, setCurrentUserApiKey] = useState("");
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  // Add user dialog state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserDisplayName, setNewUserDisplayName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    // This function will be executed by useEffect.
    const checkAdminStatusAndFetchData = async () => {
      // If auth is still loading, wait.
      if (loading) {
        return;
      }

      // If no user is logged in, redirect to login page.
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const resp = await getJSON(
          `/api/users/${encodeURIComponent(user.uid)}`
        );
        if (resp && resp.userId) {
          const userData = resp as any;
          if (userData.role === "admin") {
            setUserRole(userData.role);
            setDisplayName(userData.displayName || "");
            await fetchUsersAndUsageData();
          } else {
            router.push("/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast({
          title: "Error",
          description: "Failed to verify user role.",
          variant: "destructive",
        });
        // On error, redirect to a safe page.
        router.push("/");
      }
    };

    checkAdminStatusAndFetchData();
  }, [user, loading, router]);

  const fetchUsersAndUsageData = async () => {
    setIsLoadingUsers(true);
    try {
      const userList = (await getUsersWithUsageData({
        search: searchTerm || null,
        role: roleFilter || null,
        sortBy: sortBy || null,
        sortDir: sortDir || null,
        page,
        pageSize,
      })) as any[];
      const normalized = userList.map((u) => ({
        ...u,
        id: u.id || u.userId || u.uid,
        email: u.email || u.emailAddress || null,
        displayName: u.displayName || u.name || "",
      }));
      setUsers(normalized as UserData[]);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Could not fetch user data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsersAndUsageData();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter, sortBy, sortDir, page, pageSize]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      users: users.filter((u) => u.role === "user").length,
      active: users.filter((u) => u.status === "active").length,
      pending: users.filter((u) => u.status === "pending").length,
      banned: users.filter((u) => u.status === "banned").length,
      withApiKey: users.filter(
        (u) => u.geminiApiKey && u.geminiApiKey.trim() !== ""
      ).length,
    };
  }, [users]);

  // Server returns filtered/paged list; use directly
  const filteredUsers = users;

  const handleRoleChange = async (userId: string, role: "admin" | "user") => {
    try {
      await patchJSON(`/api/users/${encodeURIComponent(userId)}`, { role });
      setUsers(users.map((u) => (u.id === userId ? { ...u, role } : u)));
      const target = users.find((u) => u.id === userId);
      toast({
        title: "User updated",
        description: `${
          target?.displayName || target?.email || userId
        } role set to ${role}.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Could not update role",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    userId: string,
    status: "active" | "pending" | "banned"
  ) => {
    try {
      await patchJSON(`/api/users/${encodeURIComponent(userId)}`, { status });
      setUsers(users.map((u) => (u.id === userId ? { ...u, status } : u)));
      const target = users.find((u) => u.id === userId);
      toast({
        title: "User updated",
        description: `${
          target?.displayName || target?.email || userId
        } status set to ${status}.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Could not update status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await del(`/api/users/${encodeURIComponent(userId)}`);
      // Refresh list
      await fetchUsersAndUsageData();
      toast({ title: "User Deleted", description: "User has been removed." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePasswordReset = async (email: string) => {
    // Password reset via auth provider is not implemented in the new backend.
    toast({
      title: "Not Implemented",
      description: "Password reset must be handled via backend admin tools.",
      variant: "destructive",
    });
  };

  const handleManageApiKey = (userToManage: UserData) => {
    setSelectedUser(userToManage);
    setCurrentUserApiKey(userToManage.geminiApiKey || "");
    setIsApiKeyDialogOpen(true);
  };

  const handleSaveApiKey = async () => {
    if (!selectedUser) return;
    setIsSavingApiKey(true);
    try {
      await patchJSON(`/api/users/${encodeURIComponent(selectedUser.id)}`, {
        geminiApiKey: currentUserApiKey,
      });
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? { ...u, geminiApiKey: currentUserApiKey }
            : u
        )
      );
      toast({
        title: "Success",
        description: `API key for ${selectedUser.email} has been updated.`,
      });
      setIsApiKeyDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserId) {
      toast({
        title: "Validation",
        description: "User ID is required",
        variant: "destructive",
      });
      return;
    }
    setIsCreatingUser(true);
    try {
      const payload: any = {
        userId: newUserId,
        email: newUserEmail || null,
        displayName: newUserDisplayName || null,
        role: newUserRole,
        status: "active",
      };
      if (newUserPassword) {
        payload.passwordHash = bcrypt.hashSync(newUserPassword, 12);
      }
      await postJSON("/api/users", payload);
      toast({
        title: "User Created",
        description: `${newUserId} created successfully.`,
      });
      setIsAddUserOpen(false);
      // reset form
      setNewUserId("");
      setNewUserEmail("");
      setNewUserDisplayName("");
      setNewUserPassword("");
      setNewUserRole("user");
      await fetchUsersAndUsageData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handlePermissionChange = async (userId: string, checked: boolean) => {
    try {
      await patchJSON(`/api/users/${encodeURIComponent(userId)}`, {
        canManageApiKey: checked,
      });
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, canManageApiKey: checked } : u
        )
      );
      const target = users.find((u) => u.id === userId);
      toast({
        title: "User updated",
        description: `${
          target?.displayName || target?.email || userId
        } permission for API Key ${checked ? "granted" : "revoked"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating permission",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || !user || !userRole) {
    return <div>Loading...</div>;
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 font-headline">
              <Bot className="h-8 w-8 text-primary shrink-0" />
              <h1 className="text-2xl font-bold text-foreground group-data-[collapsible=icon]:hidden">
                OmniChat
              </h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive>
                  <Link href="/admin/dashboard">
                    <Users />
                    User Management
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/profile">
                    <User />
                    Profile
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="hidden md:flex" />
                <h1 className="font-semibold text-lg">Admin Panel</h1>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 relative h-10 rounded-full"
                  >
                    <span className="text-sm font-medium">
                      {displayName || user.email}
                    </span>
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.photoURL || ""}
                        alt={user.displayName || user.email || ""}
                      />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground capitalize flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-primary" />{" "}
                        {userRole}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/admin/dashboard")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>User Management</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <Skeleton className="h-8 w-1/4" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.total}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admins</CardTitle>
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <Skeleton className="h-8 w-1/4" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.admins}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <Skeleton className="h-8 w-1/4" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.users}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <Skeleton className="h-8 w-1/4" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.active}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <Skeleton className="h-8 w-1/4" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.pending}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Banned</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <Skeleton className="h-8 w-1/4" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.banned}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    With API Key
                  </CardTitle>
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <Skeleton className="h-8 w-1/4" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.withApiKey}</div>
                  )}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users /> User Management
                  </CardTitle>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsAddUserOpen(true)}
                    >
                      Add User
                    </Button>
                  </div>
                  <CardDescription>
                    View, manage users and their permissions.
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    className="w-full md:w-80 pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-40">
                    <Select
                      value={roleFilter ?? "all"}
                      onValueChange={(v) => {
                        setRoleFilter(v === "all" ? null : v);
                        setPage(1);
                        fetchUsersAndUsageData();
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Label>Page</Label>
                    <Input
                      type="number"
                      value={page}
                      onChange={(e) => {
                        const p = Math.max(
                          1,
                          parseInt(e.target.value || "1", 10)
                        );
                        setPage(p);
                      }}
                      className="w-20"
                    />
                    <Button
                      onClick={() => {
                        fetchUsersAndUsageData();
                      }}
                    >
                      Go
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setPage((s) => Math.max(1, s - 1));
                        setTimeout(fetchUsersAndUsageData, 0);
                      }}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setPage((s) => s + 1);
                        setTimeout(fetchUsersAndUsageData, 0);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          className="inline-flex items-center gap-2"
                          onClick={() => {
                            const nextDir =
                              sortBy === "displayName" && sortDir === "asc"
                                ? "desc"
                                : "asc";
                            setSortBy("displayName");
                            setSortDir(nextDir);
                            setPage(1);
                            fetchUsersAndUsageData();
                          }}
                        >
                          User
                          <span className="text-xs text-muted-foreground">
                            {sortBy === "displayName"
                              ? sortDir === "asc"
                                ? "↑"
                                : "↓"
                              : ""}
                          </span>
                        </button>
                      </TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Tokens (Monthly)</TableHead>
                      <TableHead>Requests (Monthly)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-10 w-48" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-10 w-28" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-10 w-28" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-12" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-12" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-10 w-24 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={u.avatarUrl || ""}
                                  alt={u.displayName}
                                />
                                <AvatarFallback>
                                  {u.displayName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {u.displayName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {u.email}
                                </div>
                                {u.phoneNumber && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" />
                                    {u.phoneNumber}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={u.role}
                                onValueChange={(value: "admin" | "user") =>
                                  handleRoleChange(u.id, value)
                                }
                                disabled={u.id === user.uid}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                              </Select>
                              {u.geminiApiKey && (
                                <Badge
                                  variant="secondary"
                                  className="whitespace-nowrap"
                                >
                                  API Key
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={u.status}
                              onValueChange={(
                                value: "active" | "pending" | "banned"
                              ) => handleStatusChange(u.id, value)}
                              disabled={u.id === user.uid}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">
                                  <Badge className="bg-green-500 hover:bg-green-600">
                                    Active
                                  </Badge>
                                </SelectItem>
                                <SelectItem value="pending">
                                  <Badge variant="secondary">Pending</Badge>
                                </SelectItem>
                                <SelectItem value="banned">
                                  <Badge variant="destructive">Banned</Badge>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`api-key-permission-${u.id}`}
                                    checked={u.canManageApiKey}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(u.id, checked)
                                    }
                                    disabled={u.id === user.uid}
                                  />
                                  <Label
                                    htmlFor={`api-key-permission-${u.id}`}
                                    className="text-sm text-muted-foreground"
                                  >
                                    API Key
                                  </Label>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Allow user to add/edit their own Gemini API
                                  Key.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">
                                {u.totalTokens ?? 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">
                                {u.chatRequests ?? 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleManageApiKey(u)}
                              >
                                <KeyRound className="h-4 w-4" />
                                <span className="sr-only">Manage API Key</span>
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={u.id === user.uid}
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
                                      className="lucide lucide-mail-key"
                                    >
                                      <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
                                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                      <path d="M15.5 22a2.5 2.5 0 0 0 2.5-2.5V17a2.5 2.5 0 0 0-5 0v2.5a2.5 0 0 0 2.5 2.5Z" />
                                      <path d="M20 17h2" />
                                    </svg>
                                    <span className="sr-only">
                                      Reset Password
                                    </span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will send a password reset link to{" "}
                                      {u.email}. The user will be able to set a
                                      new password.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handlePasswordReset(u.email)
                                      }
                                    >
                                      Send Email
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    disabled={u.id === user.uid}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete User</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will
                                      permanently delete the user's data from
                                      Firestore, but not from Firebase
                                      Authentication.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(u.id)}
                                    >
                                      Continue
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>

        {/* API Key Management Dialog */}
        {/* Add User Dialog */}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <div>
                <Label htmlFor="new-user-id">User ID</Label>
                <Input
                  id="new-user-id"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="unique-user-id"
                />
              </div>
              <div>
                <Label htmlFor="new-user-email">Email</Label>
                <Input
                  id="new-user-email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="new-user-display">Display Name</Label>
                <Input
                  id="new-user-display"
                  value={newUserDisplayName}
                  onChange={(e) => setNewUserDisplayName(e.target.value)}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <Label htmlFor="new-user-password">Password (optional)</Label>
                <Input
                  id="new-user-password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Set a password"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  onValueChange={(v) => setNewUserRole(v as any)}
                  value={newUserRole}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                {isCreatingUser ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Manage API Key for {selectedUser?.email}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="api-key-input">Gemini API Key</Label>
              <Input
                id="api-key-input"
                type="password"
                value={currentUserApiKey}
                onChange={(e) => setCurrentUserApiKey(e.target.value)}
                placeholder="Paste user's Gemini API key here"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to delete the key. The change will be saved for this
                user.
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveApiKey} disabled={isSavingApiKey}>
                {isSavingApiKey ? "Saving..." : "Save API Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </TooltipProvider>
  );
}
