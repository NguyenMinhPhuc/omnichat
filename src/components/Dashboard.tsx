
'use client';

import React, { useState, useEffect } from 'react';
import { Bot, LogOut, Settings, User, ShieldCheck } from 'lucide-react';
import CustomizationPanel from './CustomizationPanel';
import ChatbotPreview from './ChatbotPreview';
import { getAIResponse } from '@/app/actions';
import type { Message } from './ChatbotPreview';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EmbedGuide from './EmbedGuide';
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
import { Card } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';

export interface CustomizationState {
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
  logoUrl: string | null;
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [customization, setCustomization] = useState<CustomizationState>({
    primaryColor: '#29ABE2',
    backgroundColor: '#F0F8FF',
    accentColor: '#6495ED',
    logoUrl: null,
  });
  
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Hello! I'm your AI assistant. How can I help you based on the provided documents?",
    },
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);


  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.customization) {
            setCustomization(data.customization);
          }
           if (data.role === 'admin') {
            router.push('/admin/dashboard');
            return;
          }
          setUserRole(data.role);
          setDisplayName(data.displayName || '');
          setAvatarUrl(data.avatarUrl || null);
          if (data.knowledgeBase) {
            setKnowledgeBase(data.knowledgeBase);
          }
        }
      };
      fetchUserData();
    }
  }, [user, router]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !user) return;

    const userMessage: Message = { sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsAiTyping(true);

    if (!knowledgeBase) {
      const aiMessage: Message = { sender: 'ai', text: "I haven't been configured with any knowledge. Please upload a document first." };
      setMessages(prev => [...prev, aiMessage]);
      setIsAiTyping(false);
      return;
    }

    const aiResult = await getAIResponse({ query: text, userId: user.uid });

    const aiMessage: Message = { sender: 'ai', text: aiResult.response };
    setMessages(prev => [...prev, aiMessage]);
    setIsAiTyping(false);
  };
  
  if (loading || !user) {
    return <div>Loading...</div>; // Or a loading spinner
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
              <SidebarMenuButton asChild isActive>
                <Link href="/dashboard">
                  <Settings />
                  Configuration
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
              <h1 className="font-semibold text-lg">Dashboard</h1>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl || ''} alt={displayName} />
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
                        {userRole === 'admin' ? <ShieldCheck className="w-3 h-3 text-primary" /> : null}
                        {userRole}
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
        <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CustomizationPanel
              customization={customization}
              setCustomization={setCustomization}
              setKnowledgeBase={setKnowledgeBase}
              chatbotId={user.uid}
            />
            <Card>
              <ChatbotPreview
                customization={customization}
                messages={messages}
                isAiTyping={isAiTyping}
                onSendMessage={handleSendMessage}
              />
            </Card>
          </div>
          <div>
              <EmbedGuide chatbotId={user.uid} />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
