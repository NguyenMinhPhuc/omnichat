'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CustomizationState } from './Dashboard';
import Logo from './Logo';

export interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface ChatbotPreviewProps {
  customization: CustomizationState;
  messages: Message[];
  isAiTyping: boolean;
  onSendMessage: (text: string) => void;
}

export default function ChatbotPreview({
  customization,
  messages,
  isAiTyping,
  onSendMessage,
}: ChatbotPreviewProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isAiTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const customStyles = {
    '--chat-bg-color': customization.backgroundColor,
    '--chat-primary-color': customization.primaryColor,
    '--chat-accent-color': customization.accentColor,
  } as React.CSSProperties;

  return (
    <div className="h-[70vh] flex flex-col" style={customStyles}>
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-[--chat-primary-color] text-primary-foreground rounded-t-lg">
        <div className="flex items-center space-x-3">
          <Logo logoUrl={customization.logoUrl} />
          <div className="flex flex-col">
            <h2 className="font-bold text-lg font-headline">OmniChat Assistant</h2>
            <p className="text-xs text-primary-foreground/80">Online</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 bg-[--chat-bg-color]">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={cn('flex items-end gap-2', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                {message.sender === 'ai' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback style={{backgroundColor: customization.accentColor}}>
                        <Bot className="text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2 text-sm shadow',
                    message.sender === 'user'
                      ? 'bg-[--chat-primary-color] text-primary-foreground rounded-br-none'
                      : 'bg-card text-card-foreground rounded-bl-none'
                  )}
                >
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
             {isAiTyping && (
                <div className="flex items-end gap-2 justify-start">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback style={{backgroundColor: customization.accentColor}}>
                            <Bot className="text-white" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="bg-card text-card-foreground rounded-xl px-4 py-2 text-sm shadow rounded-bl-none flex items-center space-x-2">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-0"></span>
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150"></span>
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-300"></span>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={handleInputChange}
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim()} style={{backgroundColor: customization.primaryColor}}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </div>
  );
}
