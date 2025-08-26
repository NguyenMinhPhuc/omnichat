'use client';

import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import CustomizationPanel from './CustomizationPanel';
import ChatbotPreview from './ChatbotPreview';
import { getAIResponse } from '@/app/actions';
import type { Message } from './ChatbotPreview';

export interface CustomizationState {
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
  font: 'sans' | 'serif' | 'mono';
  logoUrl: string | null;
}

export default function Dashboard() {
  const [customization, setCustomization] = useState<CustomizationState>({
    primaryColor: '#29ABE2',
    backgroundColor: '#F0F8FF',
    accentColor: '#6495ED',
    font: 'sans',
    logoUrl: null,
  });

  const [knowledgeBase, setKnowledgeBase] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Hello! I'm your AI assistant. How can I help you based on the provided documents?",
    },
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsAiTyping(true);

    if (!knowledgeBase) {
        const aiMessage: Message = { sender: 'ai', text: "I haven't been configured with any knowledge. Please upload a document first." };
        setMessages(prev => [...prev, aiMessage]);
        setIsAiTyping(false);
        return;
    }

    const aiResult = await getAIResponse({ query: text, knowledgeBase });
    
    const aiMessage: Message = { sender: 'ai', text: aiResult.response };
    setMessages(prev => [...prev, aiMessage]);
    setIsAiTyping(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-foreground">
              OmniChat
            </h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <CustomizationPanel
              customization={customization}
              setCustomization={setCustomization}
              setKnowledgeBase={setKnowledgeBase}
            />
          </div>
          <div className="lg:col-span-2">
            <ChatbotPreview
              customization={customization}
              messages={messages}
              isAiTyping={isAiTyping}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
