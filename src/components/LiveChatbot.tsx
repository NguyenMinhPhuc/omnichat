
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { getAIResponse } from '@/app/actions';
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from './ui/badge';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface ScenarioItem {
    id: string;
    question: string;
    answer: string;
    parentId: string | null;
}

interface CustomizationState {
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
  logoUrl: string | null;
}

const defaultCustomization: CustomizationState = {
    primaryColor: '#29ABE2',
    backgroundColor: '#F0F8FF',
    accentColor: '#6495ED',
    logoUrl: null,
};

interface LiveChatbotProps {
  chatbotId: string;
}

export default function LiveChatbot({ chatbotId }: LiveChatbotProps) {
  const [customization, setCustomization] = useState<CustomizationState | null>(null);
  const [scenario, setScenario] = useState<ScenarioItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Hello! How can I help you?",
    },
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [currentScriptedQuestions, setCurrentScriptedQuestions] = useState<ScenarioItem[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChatbotConfig = async () => {
      if (!chatbotId) {
        setError("Invalid chatbot ID.");
        setCustomization(defaultCustomization);
        return;
      }
      try {
        const docRef = doc(db, "users", chatbotId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCustomization(data.customization || defaultCustomization);
          const savedScenario = data.scenario || [];
          setScenario(savedScenario);
          setCurrentScriptedQuestions(savedScenario.filter((item: ScenarioItem) => item.parentId === null));
        } else {
          console.warn(`Chatbot configuration not found for ID: ${chatbotId}. Using default.`);
          setCustomization(defaultCustomization);
        }
      } catch (err) {
        setError("Failed to load chatbot configuration. Using default.");
        setCustomization(defaultCustomization);
        console.error(err);
      }
    };
    fetchChatbotConfig();
  }, [chatbotId]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isAiTyping, currentScriptedQuestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const createNewChatSession = async (initialMessage: Message) => {
    try {
        const chatCollectionRef = collection(db, 'chats');
        const docRef = await addDoc(chatCollectionRef, {
            chatbotId: chatbotId,
            createdAt: serverTimestamp(),
            messages: [initialMessage],
        });
        setChatId(docRef.id);
        return docRef.id;
    } catch(e) {
        console.error("Error creating chat session: ", e);
        setError("Could not start a new chat session.");
        return null;
    }
  }

  const addMessageToChat = async (chatSessionId: string, message: Message) => {
    const chatDocRef = doc(db, 'chats', chatSessionId);
    await updateDoc(chatDocRef, {
      messages: arrayUnion(message)
    });
  }

  const handleFreeformMessage = async (text: string) => {
    setIsAiTyping(true);
    setInputValue('');
    setCurrentScriptedQuestions([]); // Hide suggestions when user types
    
    let currentChatId = chatId;
    const userMessage: Message = { sender: 'user', text };
    if (!currentChatId) {
        currentChatId = await createNewChatSession(userMessage);
    } else {
        await addMessageToChat(currentChatId, userMessage);
    }

    if (!currentChatId) {
        setIsAiTyping(false);
        return;
    }

    const aiResult = await getAIResponse({ query: text, userId: chatbotId });
    const aiMessage: Message = { sender: 'ai', text: aiResult.response };
    setMessages(prev => [...prev, aiMessage]);
    await addMessageToChat(currentChatId, aiMessage);

    // After AI response, show the root questions again to guide the user back to a scenario
    setCurrentScriptedQuestions(scenario.filter(item => item.parentId === null));
    setIsAiTyping(false);
  };

  const handleScriptedMessage = async (item: ScenarioItem) => {
    const userMessage: Message = { sender: 'user', text: item.question };
    const aiMessage: Message = { sender: 'ai', text: item.answer };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    
    let currentChatId = chatId;
    if (!currentChatId) {
        currentChatId = await createNewChatSession(userMessage);
        if(currentChatId) await addMessageToChat(currentChatId, aiMessage);
    } else {
        await addMessageToChat(currentChatId, userMessage);
        await addMessageToChat(currentChatId, aiMessage);
    }

    const nextQuestions = scenario.filter(child => child.parentId === item.id);
    // If there are follow-up questions, show them. Otherwise, show the root questions.
    setCurrentScriptedQuestions(nextQuestions.length > 0 ? nextQuestions : scenario.filter(item => item.parentId === null));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !chatbotId) return;
    const userMessage: Message = { sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    handleFreeformMessage(inputValue);
  };

  if (error && !customization) {
    return <div className="flex items-center justify-center h-full w-full bg-red-100 text-red-700">{error}</div>;
  }
  
  if (!customization) {
    return <div className="flex items-center justify-center h-full w-full">Loading chatbot...</div>;
  }
  
  const customStyles = {
    '--chat-bg-color': customization.backgroundColor,
    '--chat-primary-color': customization.primaryColor,
    '--chat-accent-color': customization.accentColor,
  } as React.CSSProperties;

  return (
    <div className="h-full w-full bg-transparent">
        <Card className="h-full w-full flex flex-col shadow-lg" style={customStyles}>
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-[--chat-primary-color] text-primary-foreground rounded-t-lg">
            <div className="flex items-center space-x-3">
              <Logo logoUrl={customization.logoUrl} />
              <div className="flex flex-col">
                <h2 className="font-bold text-lg font-headline">AI Assistant</h2>
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
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{message.text}</ReactMarkdown>
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
              {!isAiTyping && currentScriptedQuestions.length > 0 && (
                <div className="p-4 pt-0 flex flex-wrap gap-2 justify-start">
                    {currentScriptedQuestions.map(item => (
                        <Badge 
                            key={item.id} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => handleScriptedMessage(item)}
                        >
                            {item.question}
                        </Badge>
                    ))}
                </div>
              )}
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
        </Card>
    </div>
  );
}
