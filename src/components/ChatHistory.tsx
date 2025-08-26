'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, DocumentData, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';
import { format } from 'date-fns';

interface ChatHistoryProps {
  chatbotId: string;
}

interface ChatSession extends DocumentData {
  id: string;
  createdAt: any;
  messages: { sender: 'user' | 'ai'; text: string }[];
}

export default function ChatHistory({ chatbotId }: ChatHistoryProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatHistory = async () => {
      setLoading(true);
      const q = query(collection(db, 'chats'), where('chatbotId', '==', chatbotId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ChatSession));
      setChatSessions(sessions);
      setLoading(false);
    };

    if (chatbotId) {
      fetchChatHistory();
    }
  }, [chatbotId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><MessageSquare /> Chat History</CardTitle>
        <CardDescription>Review past conversations with your chatbot.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {loading ? (
            <p>Loading chat history...</p>
          ) : chatSessions.length === 0 ? (
            <p className="text-muted-foreground">No chat history found.</p>
          ) : (
            <div className="space-y-2">
              {chatSessions.map(session => (
                <Dialog key={session.id}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      Chat from {format(session.createdAt.toDate(), 'PPP p')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Chat Transcript</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                      <div className="p-4 space-y-4">
                        {session.messages.map((message, index) => (
                          <div key={index} className={cn('flex items-end gap-2', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                             {message.sender === 'ai' && (
                                <Avatar className="h-8 w-8 bg-primary">
                                    <AvatarFallback>
                                        <Bot className="text-primary-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                             )}
                             <div className={cn('max-w-md rounded-xl px-4 py-2 text-sm shadow', message.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none border')}>
                               <p>{message.text}</p>
                             </div>
                             {message.sender === 'user' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                        <User />
                                    </AvatarFallback>
                                </Avatar>
                             )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
