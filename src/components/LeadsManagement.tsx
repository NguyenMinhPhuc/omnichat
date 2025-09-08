
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getLeads, updateLeadStatus } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users2, Bot, Settings, Code, User, LogOut, ShieldCheck, MoreHorizontal, CheckCircle, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface Lead {
  id: string;
  customerName: string;
  phoneNumber: string;
  needs: string;
  status: 'waiting' | 'consulted';
  createdAt: string; // Store as ISO string
}

export default function LeadsManagement() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
     if (user) {
      const fetchUserDataAndLeads = async () => {
        setIsLoading(true);
        try {
            const leadsData = await getLeads(user.uid);
            const sortedLeads = (leadsData as Lead[]).sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setLeads(sortedLeads);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast({ title: 'Error', description: 'Could not load leads.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
      };
      fetchUserDataAndLeads();
    }
  }, [user, toast]);

  const handleStatusChange = async (leadId: string, status: 'waiting' | 'consulted') => {
    const result = await updateLeadStatus(leadId, status);
    if (result.success) {
      setLeads(leads.map(lead => lead.id === leadId ? { ...lead, status } : lead));
      toast({ title: 'Success', description: 'Lead status has been updated.' });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  const filteredLeads = useMemo(() => {
    return leads
      .filter(lead => 
        statusFilter === 'all' || lead.status === statusFilter
      )
      .filter(lead => 
        lead.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [leads, searchTerm, statusFilter]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
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
              <SidebarMenuButton asChild>
                <Link href="/dashboard">
                  <Settings />
                  Configuration
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive>
                <Link href="/dashboard/leads">
                  <Users2 />
                  Leads
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/embed">
                  <Code />
                  Embed
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
              <h1 className="font-semibold text-lg">Leads Management</h1>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 relative h-10 rounded-full">
                     <span className="text-sm font-medium">{user.displayName || user.email}</span>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || user.email}</p>
                       <p className="text-xs leading-none text-muted-foreground capitalize flex items-center gap-1">
                        User
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
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
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><Users2 /> Leads List</CardTitle>
                <CardDescription>View and manage collected potential customers.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or phone..."
                        className="w-full md:w-64 pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="waiting">Waiting</SelectItem>
                        <SelectItem value="consulted">Consulted</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Needs</TableHead>
                    <TableHead>Date Captured</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                        </TableRow>
                      ))
                  ) : filteredLeads.length > 0 ? (
                    filteredLeads.map((lead, index) => (
                        <TableRow key={lead.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                                <div className="font-medium">{lead.customerName}</div>
                                <div className="text-sm text-muted-foreground">{lead.phoneNumber}</div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{lead.needs}</TableCell>
                            <TableCell>{format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                            <TableCell>
                                <div className="flex items-center space-x-2 cursor-pointer">
                                    <Switch
                                        id={`status-switch-${lead.id}`}
                                        checked={lead.status === 'consulted'}
                                        onCheckedChange={(checked) => 
                                            handleStatusChange(lead.id, checked ? 'consulted' : 'waiting')
                                        }
                                        aria-label="Lead status"
                                    />
                                    <Badge variant={lead.status === 'consulted' ? 'default' : 'secondary'} className={lead.status === 'consulted' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                        {lead.status === 'waiting' ? 'Waiting' : 'Consulted'}
                                    </Badge>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                  ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No leads found.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
     </SidebarProvider>
  );
}

    
