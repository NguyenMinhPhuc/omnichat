
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, getCountFromServer } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bot, LogOut, ShieldCheck, Trash2, User, Users, KeyRound, MessageSquare } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';
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
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Skeleton } from './ui/skeleton';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'admin' | 'user';
  status: 'active' | 'pending' | 'banned';
  geminiApiKey?: string;
  canManageApiKey?: boolean;
  chatCount?: number;
}

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // State for API Key management dialog
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [currentUserApiKey, setCurrentUserApiKey] = useState('');
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then(userDoc => {
         if (!userDoc.exists() || userDoc.data().role !== 'admin') {
             router.push('/dashboard');
         } else {
            const userData = userDoc.data();
            setUserRole(userData.role);
            setDisplayName(userData.displayName || '');
            fetchUsersAndChatCounts();
         }
      });
    }
  }, [user, loading, router]);
  
  const fetchUsersAndChatCounts = async () => {
    setIsLoadingUsers(true);
    try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const userListPromises = userSnapshot.docs.map(async (userDoc) => {
            const userData = { id: userDoc.id, ...userDoc.data() } as UserData;
            
            // Fetch chat count for each user
            const chatsQuery = query(collection(db, 'chats'), where('chatbotId', '==', userDoc.id));
            const countSnapshot = await getCountFromServer(chatsQuery);
            userData.chatCount = countSnapshot.data().count;

            return userData;
        });

        const userList = await Promise.all(userListPromises);
        setUsers(userList);
    } catch (error) {
        console.error("Error fetching users:", error);
        toast({ title: 'Error', description: 'Could not fetch user data.', variant: 'destructive'});
    } finally {
        setIsLoadingUsers(false);
    }
  };
  
  const handleRoleChange = async (userId: string, role: 'admin' | 'user') => {
    const userDoc = doc(db, 'users', userId);
    await updateDoc(userDoc, { role });
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
    toast({ title: 'Success', description: 'User role updated.' });
  };
  
  const handleStatusChange = async (userId: string, status: 'active' | 'pending' | 'banned') => {
    const userDoc = doc(db, 'users', userId);
    await updateDoc(userDoc, { status });
    setUsers(users.map(u => u.id === userId ? { ...u, status } : u));
    toast({ title: 'Success', description: 'User status updated.' });
  }

  const handleDeleteUser = async (userId: string) => {
    try {
        await deleteDoc(doc(db, "users", userId));
        // Note: Deleting from Firebase Auth requires a server-side environment (e.g., Cloud Functions)
        // This implementation only deletes the user from Firestore.
        fetchUsersAndChatCounts();
        toast({ title: 'User Deleted', description: 'User has been removed from Firestore.' });
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
        toast({
            title: 'Password Reset Email Sent',
            description: `An email has been sent to ${email} with instructions to reset their password.`
        });
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive'});
    }
  }

  const handleManageApiKey = (userToManage: UserData) => {
    setSelectedUser(userToManage);
    setCurrentUserApiKey(userToManage.geminiApiKey || '');
    setIsApiKeyDialogOpen(true);
  };

  const handleSaveApiKey = async () => {
    if (!selectedUser) return;
    setIsSavingApiKey(true);
    try {
        const userDoc = doc(db, 'users', selectedUser.id);
        await updateDoc(userDoc, { geminiApiKey: currentUserApiKey });
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, geminiApiKey: currentUserApiKey } : u));
        toast({ title: 'Success', description: `API key for ${selectedUser.email} has been updated.` });
        setIsApiKeyDialogOpen(false);
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive'});
    } finally {
        setIsSavingApiKey(false);
    }
  };

  const handlePermissionChange = async (userId: string, checked: boolean) => {
    try {
        const userDoc = doc(db, 'users', userId);
        await updateDoc(userDoc, { canManageApiKey: checked });
        setUsers(users.map(u => u.id === userId ? { ...u, canManageApiKey: checked } : u));
        toast({ title: 'Success', description: 'Permission updated successfully.' });
    } catch (error: any) {
        toast({ title: 'Error updating permission', description: error.message, variant: 'destructive' });
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
                  <Button variant="ghost" className="flex items-center gap-2 relative h-10 rounded-full">
                    <span className="text-sm font-medium">{displayName || user.email}</span>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || user.email || ''} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground capitalize flex items-center gap-1">
                         <ShieldCheck className='w-3 h-3 text-primary' /> {userRole}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/admin/dashboard')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>User Management</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingUsers ? (
                            <Skeleton className="h-8 w-1/4" />
                        ) : (
                            <div className="text-2xl font-bold">{users.length}</div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            All registered users in the system
                        </p>
                    </CardContent>
                </Card>
            </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users /> User Management</CardTitle>
               <CardDescription>View, manage users and their permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Chat History</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-10 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-10 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-10 w-24" /></TableCell>
                        </TableRow>
                      ))
                  ) : (
                    users.map((u) => (
                        <TableRow key={u.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={u.avatarUrl || ''} alt={u.displayName} />
                                <AvatarFallback>{u.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{u.displayName}</div>
                                <div className="text-sm text-muted-foreground">{u.email}</div>
                            </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Select value={u.role} onValueChange={(value: 'admin' | 'user') => handleRoleChange(u.id, value)} disabled={u.id === user.uid}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                                </Select>
                                {u.geminiApiKey && <Badge variant="secondary" className="whitespace-nowrap">API Key</Badge>}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Select value={u.status} onValueChange={(value: 'active' | 'pending' | 'banned') => handleStatusChange(u.id, value)} disabled={u.id === user.uid}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active"><Badge className="bg-green-500 hover:bg-green-600">Active</Badge></SelectItem>
                                <SelectItem value="pending"><Badge variant="secondary">Pending</Badge></SelectItem>
                                <SelectItem value="banned"><Badge variant="destructive">Banned</Badge></SelectItem>
                            </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className='flex items-center space-x-2'>
                                        <Switch
                                            id={`api-key-permission-${u.id}`}
                                            checked={u.canManageApiKey}
                                            onCheckedChange={(checked) => handlePermissionChange(u.id, checked)}
                                            disabled={u.id === user.uid}
                                        />
                                        <Label htmlFor={`api-key-permission-${u.id}`} className="text-sm text-muted-foreground">API Key</Label>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Allow user to add/edit their own Gemini API Key.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-1">
                             <MessageSquare className="h-4 w-4 text-muted-foreground" />
                             <span className="font-medium">{u.chatCount ?? 0}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleManageApiKey(u)}>
                                <KeyRound className="h-4 w-4" />
                                <span className="sr-only">Manage API Key</span>
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="icon" disabled={u.id === user.uid}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail-key"><path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="M15.5 22a2.5 2.5 0 0 0 2.5-2.5V17a2.5 2.5 0 0 0-5 0v2.5a2.5 2.5 0 0 0 2.5 2.5Z"/><path d="M20 17h2"/></svg>
                                        <span className="sr-only">Reset Password</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will send a password reset link to {u.email}. The user will be able to set a new password.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handlePasswordReset(u.email)}>
                                            Send Email
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" disabled={u.id === user.uid}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete User</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the user's data from Firestore, but not from Firebase Authentication.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u.id)}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            </div>
                        </TableCell>
                        </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>

      {/* API Key Management Dialog */}
      <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Manage API Key for {selectedUser?.email}</DialogTitle>
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
                    Leave blank to delete the key. The change will be saved for this user.
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
