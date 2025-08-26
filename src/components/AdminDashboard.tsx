'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bot, LogOut, Trash2, Users } from 'lucide-react';
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

interface UserData {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      getDocs(collection(db, 'users')).then(snapshot => {
         const userDoc = snapshot.docs.find(d => d.id === user.uid);
         if (userDoc?.data().role !== 'admin') {
             router.push('/dashboard');
         }
      });
    }
  }, [user, loading, router]);
  
  const fetchUsers = async () => {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
    setUsers(userList);
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleRoleChange = async (userId: string, role: 'admin' | 'user') => {
    const userDoc = doc(db, 'users', userId);
    await updateDoc(userDoc, { role });
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
    toast({ title: 'Success', description: 'User role updated.' });
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
            await deleteDoc(doc(db, "users", userId));
            // Note: Deleting from Firebase Auth requires a server-side environment (e.g., Cloud Functions)
            // This implementation only deletes the user from Firestore.
            fetchUsers();
            toast({ title: 'User Deleted', description: 'User has been removed from Firestore.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 font-headline">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
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
          </SidebarMenu>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
          <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="hidden md:flex" />
              <h1 className="font-semibold text-lg">Welcome, {user.email}</h1>
            </div>
            <div className="flex-1" />
            <button onClick={logout} className="flex items-center gap-2 text-sm text-foreground hover:text-primary">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users /> User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Select value={u.role} onValueChange={(value: 'admin' | 'user') => handleRoleChange(u.id, value)} disabled={u.id === user.uid}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(u.id)} disabled={u.id === user.uid}>
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
