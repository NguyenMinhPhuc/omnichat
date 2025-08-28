
'use client';

import React, { useState } from 'react';
import { Upload, Palette, History, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { CustomizationState } from './Dashboard';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ChatHistory from './ChatHistory';
import { handleKnowledgeIngestion } from '@/app/actions';
import { Textarea } from './ui/textarea';

interface CustomizationPanelProps {
  customization: CustomizationState;
  setCustomization: React.Dispatch<React.SetStateAction<CustomizationState>>;
  setKnowledgeBase: (timestamp: any) => void;
  chatbotId: string;
}

export default function CustomizationPanel({
  customization,
  setCustomization,
  setKnowledgeBase,
  chatbotId,
}: CustomizationPanelProps) {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const updateFirestore = async (data: any) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, data, { merge: true });
  };

  const handleSubmit = async () => {
    if (!user) {
        toast({ title: 'Not logged in', description: 'Please log in to update the knowledge base.', variant: 'destructive' });
        return;
    }
    if (!question.trim() || !answer.trim()) {
        toast({ title: 'Missing Information', description: 'Please provide both a question and an answer.', variant: 'destructive' });
        return;
    }
    
    setIsSaving(true);
    
    try {
        const result = await handleKnowledgeIngestion({ 
            userId: user.uid, 
            question: question, 
            answer: answer 
        });

        if (result.success) {
            toast({ title: 'Success', description: 'New knowledge added to your chatbot.' });
            setKnowledgeBase(serverTimestamp()); // Update the parent state with a new timestamp
            // Clear inputs after successful submission
            setQuestion('');
            setAnswer('');
        } else {
            toast({ title: 'Failed to Add Knowledge', description: result.message, variant: 'destructive' });
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCustomization = { ...customization, [e.target.name]: e.target.value };
    setCustomization(newCustomization);
    updateFirestore({ customization: newCustomization });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const logoFile = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoUrl = reader.result as string;
        const newCustomization = { ...customization, logoUrl };
        setCustomization(newCustomization);
        updateFirestore({ customization: newCustomization });
      };
      reader.readAsDataURL(logoFile);
    }
  };

  const isSubmitDisabled = isSaving || !question.trim() || !answer.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Chatbot Configuration</CardTitle>
        <CardDescription>Add knowledge, customize the look, and view history.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">
                <Save className="mr-2 h-4 w-4" /> 
                Content
            </TabsTrigger>
            <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" /> Appearance</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> Chat History</TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="pt-4 space-y-4">
             <p className="text-sm text-muted-foreground">Add question-and-answer pairs to your chatbot's knowledge base. The AI will use this information to answer user queries.</p>
             <div className="space-y-2">
                <Label htmlFor="knowledge-question">Question or Keyword</Label>
                <Input 
                    id="knowledge-question" 
                    type="text" 
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., What are your opening hours?"
                />
             </div>
             <div className="space-y-2">
                <Label htmlFor="knowledge-answer">Answer or Content</Label>
                <Textarea 
                    id="knowledge-answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="e.g., We are open from 9 AM to 5 PM, Monday to Friday."
                    className="min-h-[150px]"
                />
             </div>
            <Button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full mt-4">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save to Knowledge Base'}
            </Button>
          </TabsContent>
          <TabsContent value="appearance" className="pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input id="primaryColor" name="primaryColor" type="color" value={customization.primaryColor} onChange={handleColorChange} className="p-1"/>
                </div>
                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <Input id="accentColor" name="accentColor" type="color" value={customization.accentColor} onChange={handleColorChange} className="p-1"/>
                </div>
              </div>
              <div>
                <Label htmlFor="backgroundColor">Background Color</Label>
                <Input id="backgroundColor" name="backgroundColor" type="color" value={customization.backgroundColor} onChange={handleColorChange} className="p-1"/>
              </div>
              <div>
                <Label htmlFor="logo">Logo</Label>
                <Input id="logo" type="file" onChange={handleLogoChange} accept="image/*" />
              </div>
            </div>
          </TabsContent>
           <TabsContent value="history" className="pt-4">
            <ChatHistory chatbotId={chatbotId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
