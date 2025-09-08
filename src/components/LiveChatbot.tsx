
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Check, Zap } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { getAIResponse } from '@/app/actions';
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, arrayUnion, setDoc } from 'firebase/firestore';
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
  chatbotName: string;
  greetingMessage: string;
  chatbotIconUrl: string | null;
}

const defaultCustomization: CustomizationState = {
    primaryColor: '#29ABE2',
    backgroundColor: '#F0F8FF',
    accentColor: '#6495ED',
    logoUrl: null,
    chatbotName: 'AI Assistant',
    greetingMessage: 'Hello! How can I help you?',
    chatbotIconUrl: null,
};

interface LiveChatbotProps {
  chatbotId: string;
}

export default function LiveChatbot({ chatbotId }: LiveChatbotProps) {
  const [customization, setCustomization] = useState<CustomizationState | null>(null);
  const [scenario, setScenario] = useState<ScenarioItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [currentScriptedQuestions, setCurrentScriptedQuestions] = useState<ScenarioItem[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // State to manage the current flow
  const [activeFlow, setActiveFlow] = useState<'intelligent' | 'leadCapture'>('intelligent');
  const [leadCaptureComplete, setLeadCaptureComplete] = useState(false);
  const [capturedLead, setCapturedLead] = useState(null);


  useEffect(() => {
    const fetchChatbotConfig = async () => {
      if (!chatbotId) {
        setError("Invalid chatbot ID.");
        setCustomization(defaultCustomization);
        setMessages([{ sender: 'ai', text: defaultCustomization.greetingMessage }]);
        return;
      }
      try {
        const docRef = doc(db, "users", chatbotId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedCustomization = { ...defaultCustomization, ...data.customization };
          setCustomization(fetchedCustomization);
          setMessages([{ sender: 'ai', text: fetchedCustomization.greetingMessage }]);
          const savedScenario = data.scenario || [];
          setScenario(savedScenario);
          setCurrentScriptedQuestions(savedScenario.filter((item: ScenarioItem) => item.parentId === null));
        } else {
          console.warn(`Chatbot configuration not found for ID: ${chatbotId}. Using default.`);
          setCustomization(defaultCustomization);
          setMessages([{ sender: 'ai', text: defaultCustomization.greetingMessage }]);
        }
      } catch (err) {
        setError("Failed to load chatbot configuration. Using default.");
        setCustomization(defaultCustomization);
        setMessages([{ sender: 'ai', text: defaultCustomization.greetingMessage }]);
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
            flow: activeFlow,
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
  
  const handleLeadCapture = async (currentMessages: Message[]) => {
    setIsAiTyping(true);
    setInputValue('');
    setCurrentScriptedQuestions([]);

    const chatHistoryText = currentMessages.map(m => `${m.sender === 'ai' ? 'AI' : 'User'}: ${m.text}`).join('\n');

    let currentChatId = chatId;
    if (!currentChatId) {
        // This case should not happen if handleSubmit logic is correct, but as a fallback
        currentChatId = await createNewChatSession(currentMessages[currentMessages.length - 1]);
    }

    if (!currentChatId) {
        setIsAiTyping(false);
        return;
    }
    
    const result = await getAIResponse({ 
        query: '', 
        userId: chatbotId, 
        flowName: 'leadCaptureFlow',
        chatHistory: chatHistoryText
    });

    setIsAiTyping(false);

    if (result && result.response) {
        const aiMessage: Message = { sender: 'ai', text: result.response };
        setMessages(prev => [...prev, aiMessage]);
        addMessageToChat(currentChatId, aiMessage);

        if (result.isComplete) {
            setLeadCaptureComplete(true);
            setCapturedLead(result.lead);
            // Save the captured lead to a 'leads' collection
            try {
                const leadDocRef = doc(collection(db, 'leads'));
                await setDoc(leadDocRef, {
                    ...result.lead,
                    chatbotId: chatbotId,
                    chatId: currentChatId,
                    createdAt: serverTimestamp(),
                    status: 'waiting', // Default status
                });
                console.log("Lead saved successfully!");
            } catch (leadError) {
                console.error("Error saving lead: ", leadError);
            }
            // Switch back to the intelligent flow
            setActiveFlow('intelligent');
            // Show root questions to guide the user to continue chatting
            setCurrentScriptedQuestions(scenario.filter(item => item.parentId === null));
        }
    }
  }


  const handleFreeformMessage = async (text: string, currentChatId: string) => {
    setIsAiTyping(true);
    setInputValue('');
    setCurrentScriptedQuestions([]); // Hide suggestions when user types
    
    if (!currentChatId) {
        console.error("Chat ID is missing in handleFreeformMessage");
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
    setActiveFlow('intelligent');
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
    setCurrentScriptedQuestions(nextQuestions.length > 0 ? nextQuestions : scenario.filter(item => item.parentId === null));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !chatbotId) return;

    const userMessage: Message = { sender: 'user', text: inputValue };
    
    let currentChatId = chatId;
    if (!currentChatId) {
        const newChatId = await createNewChatSession(userMessage);
        if (newChatId) {
            setChatId(newChatId);
            currentChatId = newChatId;
        } else {
            setError("Could not save chat session. Please refresh.");
            return;
        }
    } else {
        await addMessageToChat(currentChatId, userMessage);
    }

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    if (activeFlow === 'leadCapture' && !leadCaptureComplete) {
        handleLeadCapture(newMessages);
    } else {
        // Ensure currentChatId is not null before passing
        if (currentChatId) {
            handleFreeformMessage(inputValue, currentChatId);
        } else {
            console.error("handleSubmit could not resolve a valid chatId before calling handler.");
            setError("A session error occurred. Please refresh.");
        }
    }
  };

  const startLeadCaptureFlow = () => {
    setActiveFlow('leadCapture');
    setLeadCaptureComplete(false); // Reset completion state
    setCapturedLead(null);
    const startMessage: Message = { sender: 'ai', text: "Để có thể hỗ trợ tốt nhất, bạn vui lòng cho tôi biết một vài thông tin nhé. Đầu tiên, tên của bạn là gì?" };
    const newMessages = [...messages, startMessage];
    setMessages(newMessages);
    
    // Create a new chat session for this flow or use existing one
    const startInteraction = async () => {
        let currentChatId = chatId;
        if (!currentChatId) {
            currentChatId = await createNewChatSession(startMessage);
        } else {
            await addMessageToChat(currentChatId, startMessage);
            await updateDoc(doc(db, 'chats', currentChatId), { flow: 'leadCapture' });
        }
    }
    startInteraction();
  }

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
                <h2 className="font-bold text-lg font-headline">{customization.chatbotName}</h2>
                <p className="text-xs text-primary-foreground/80">Online</p>
              </div>
            </div>
            <Button onClick={startLeadCaptureFlow} size="sm" variant="secondary" disabled={activeFlow === 'leadCapture' && !leadCaptureComplete}>
                <Zap className="mr-2 h-4 w-4" />
                Tư vấn ngay
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 bg-[--chat-bg-color]">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="p-4 space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className={cn('flex items-end gap-2', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                    {message.sender === 'ai' && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={customization.chatbotIconUrl || ''} alt="Chatbot" />
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
                            <AvatarImage src={customization.chatbotIconUrl || ''} alt="Chatbot" />
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
              {leadCaptureComplete && (
                  <div className="p-4 pt-0">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          <Check className="mr-2 h-4 w-4"/>
                          Cảm ơn bạn! Thông tin đã được ghi nhận.
                      </Badge>
                  </div>
              )}
              {!isAiTyping && activeFlow === 'intelligent' && currentScriptedQuestions.length > 0 && (
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
                placeholder="Nhập tin nhắn của bạn..."
                value={inputValue}
                onChange={handleInputChange}
                className="flex-1"
                autoComplete="off"
                disabled={isAiTyping || (activeFlow === 'leadCapture' && !leadCaptureComplete && isAiTyping)}
              />
              <Button type="submit" size="icon" disabled={!inputValue.trim() || isAiTyping} style={{backgroundColor: customization.primaryColor}}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
    </div>
  );
}
