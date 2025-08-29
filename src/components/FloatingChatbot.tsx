'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

export default function FloatingChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure this component only renders on the client-side
    // to prevent hydration mismatches with window/document access.
    setIsClient(true);
  }, []);

  if (!isClient || !user) {
    return null;
  }

  const chatbotUrl = `/chatbot/${user.uid}`;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isOpen ? 'w-[400px] h-[600px] opacity-100' : 'w-0 h-0 opacity-0'
      )}>
        {isOpen && (
            <Card className="h-full w-full flex flex-col shadow-2xl">
                 <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-primary text-primary-foreground">
                    <div className="flex items-center gap-2">
                        <Bot className="h-6 w-6" />
                        <h2 className="font-bold text-lg">AI Assistant</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-primary/80">
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                   <iframe
                        src={chatbotUrl}
                        className="w-full h-full border-0"
                        title="Chatbot"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                </CardContent>
            </Card>
        )}
      </div>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
            "rounded-full w-16 h-16 shadow-lg flex items-center justify-center transition-transform duration-200 hover:scale-110",
            isOpen && "opacity-0 scale-0"
        )}
      >
        <MessageSquare className="h-8 w-8" />
      </Button>
    </div>
  );
}
