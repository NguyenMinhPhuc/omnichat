
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { sendPasswordResetEmail, updateProfile as updateAuthProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { Bot, LogOut, Settings, User, Users, ShieldCheck, Camera, Save, Info, Code, KeyRound, Users2, BookText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MarkdownEditor from './MarkdownEditor';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { uploadFile } from '@/lib/storage';


export default function Profile() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [canManageApiKey, setCanManageApiKey] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
       const userDocRef = doc(db, 'users', user.uid);
       getDoc(userDocRef).then(userDoc => {
         if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            setDisplayName(userData.displayName || '');
            setPhoneNumber(userData.phoneNumber || '');
            setAvatarUrl(userData.avatarUrl || null);
            setKnowledgeBase(userData.knowledgeBase || '');
            setGeminiApiKey(userData.geminiApiKey || '');
            setCanManageApiKey(userData.canManageApiKey || false);
         }
       });
    }
  }, [user, loading, router]);
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const updateData: any = { 
            displayName,
            phoneNumber,
            knowledgeBase,
        };
        
        if (canManageApiKey) {
            updateData.geminiApiKey = geminiApiKey;
        }

        if (avatarUrl) {
            updateData.avatarUrl = avatarUrl;
        }

        await updateDoc(userDocRef, updateData);

        // Also update profile in Firebase Auth
        if(auth.currentUser) {
            await updateAuthProfile(auth.currentUser, {
                displayName,
                photoURL: avatarUrl,
            });
        }

        toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
      const file = e.target.files[0];
      const path = `users/${user.uid}/avatars/avatar.jpg`; // Overwrite avatar for simplicity
      try {
        const downloadURL = await uploadFile(file, path);
        setAvatarUrl(downloadURL);
        toast({ title: "Avatar Updated", description: "Your new avatar is ready. Don't forget to save changes." });
      } catch (error) {
        toast({ title: "Upload Failed", description: "Could not upload your new avatar.", variant: "destructive" });
        console.error("Avatar upload failed:", error);
      }
    }
  };

  const handlePasswordReset = () => {
    if (user && user.email) {
      sendPasswordResetEmail(auth, user.email)
        .then(() => {
          toast({ title: 'Password Reset Email Sent', description: 'Check your inbox to reset your password.' });
        })
        .catch((error) => {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        });
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }
  
  const renderSidebarMenu = () => {
    if (userRole === 'admin') {
      return (
        <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/admin/dashboard">
                  <Users />
                  User Management
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive>
                <Link href="/profile">
                  <User />
                  Profile
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      );
    }
    return (
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
              <SidebarMenuButton asChild>
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
                <Link href="/dashboard/guide">
                  <BookText />
                  Guide
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive>
                    <Link href="/profile">
                    <User />
                    Profile
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
  }

  const renderUserDropdown = () => (
     <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 relative h-10 rounded-full">
            <span className="text-sm font-medium">{displayName || user.email}</span>
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl || ''} alt={displayName || ''} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName || user.email}</p>
              <p className="text-xs leading-none text-muted-foreground capitalize flex items-center gap-1">
                 {userRole === 'admin' && <ShieldCheck className='w-3 h-3 text-primary' />} {userRole}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {userRole === 'admin' && (
            <DropdownMenuItem onClick={() => router.push('/admin/dashboard')}>
                <Users className="mr-2 h-4 w-4" />
                <span>User Management</span>
            </DropdownMenuItem>
          )}
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
  )

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
          {renderSidebarMenu()}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="hidden md:flex" />
              <h1 className="font-semibold text-lg">Profile</h1>
            </div>
            {renderUserDropdown()}
          </div>
        </header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          <form onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                  <Card>
                  <CardHeader>
                      <CardTitle>Account Information</CardTitle>
                      <CardDescription>View and manage your public profile details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="flex items-center gap-4">
                          <div className="relative">
                              <Avatar className="h-24 w-24">
                                  <AvatarImage src={avatarUrl || ''} alt={displayName || ''} />
                                  <AvatarFallback className="text-3xl">
                                      {displayName?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                              </Avatar>
                              <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-secondary text-secondary-foreground rounded-full p-2 cursor-pointer hover:bg-secondary/80">
                                  <Camera className="h-4 w-4" />
                                  <Input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
                              </Label>
                          </div>
                          <div className="space-y-2 flex-1">
                              <Label htmlFor="displayName">Display Name</Label>
                              <Input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                          </div>
                      </div>

                      <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user.email || ''} disabled />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                      </div>

                      <div className="space-y-2">
                          <Label htmlFor="knowledgeBase">About / General Information</Label>
                          <CardDescription>
                              Provide some background information for the AI. This can be about you, your company, or any general context you want the chatbot to know.
                          </CardDescription>
                           <MarkdownEditor
                              value={knowledgeBase}
                              onValueChange={setKnowledgeBase}
                              placeholder="e.g., OmniChat is a leading provider of AI chatbot solutions..."
                              textareaHeightClass="h-32"
                          />
                      </div>
                  </CardContent>
                  </Card>
                  {canManageApiKey && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><KeyRound /> Gemini API Key</CardTitle>
                            <CardDescription>Provide your own Google AI Gemini API key to be used for your chatbot.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="gemini-api-key">Your API Key</Label>
                                <Input id="gemini-api-key" type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} placeholder="Enter your Gemini API key" />
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Where to find your API key?</AlertTitle>
                                    <AlertDescription>
                                        You can create and find your API key in the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-semibold underline">Google AI Studio</a>. Your key is kept private and secure.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </CardContent>
                    </Card>
                  )}
              </div>
              <div className="md:col-span-1 space-y-8">
                   <Card>
                      <CardHeader>
                          <CardTitle>Security</CardTitle>
                          <CardDescription>Manage your security settings.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div>
                              <Label>Change Password</Label>
                              <p className="text-sm text-muted-foreground">
                                  To change your password, click the button below. We will send a password reset link to your email address.
                              </p>
                          </div>
                          <Button type="button" variant="outline" onClick={handlePasswordReset}>Send Password Reset Email</Button>
                      </CardContent>
                   </Card>
                   <Card>
                      <CardHeader>
                          <CardTitle>Save All Changes</CardTitle>
                          <CardDescription>Click the button below to save all changes made on this page.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Button type="submit" disabled={isSaving} className="w-full">
                              <Save className="mr-2 h-4 w-4" />
                              {isSaving ? "Saving..." : "Save Changes"}
                          </Button>
                      </CardContent>
                   </Card>
              </div>
            </div>
          </form>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
