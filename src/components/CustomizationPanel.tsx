
'use client';

import React, { useState } from 'react';
import { Palette, History, MessageCircleQuestion, Database, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CustomizationState, ScenarioItem } from './Dashboard';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ChatHistory from './ChatHistory';
import ScenarioEditor from './ScenarioEditor';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { updateKnowledgeBase } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


interface CustomizationPanelProps {
  customization: CustomizationState;
  setCustomization: React.Dispatch<React.SetStateAction<CustomizationState>>;
  scenario: ScenarioItem[];
  setScenario: React.Dispatch<React.SetStateAction<ScenarioItem[]>>;
  knowledgeBase: string;
  setKnowledgeBase: React.Dispatch<React.SetStateAction<string>>;
  chatbotId: string;
}

export default function CustomizationPanel({
  customization,
  setCustomization,
  scenario,
  setScenario,
  knowledgeBase,
  setKnowledgeBase,
  chatbotId,
}: CustomizationPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [localKnowledgeBase, setLocalKnowledgeBase] = useState(knowledgeBase);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setLocalKnowledgeBase(knowledgeBase);
  }, [knowledgeBase]);

  const updateFirestoreCustomization = async (data: any) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, data, { merge: true });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCustomization = { ...customization, [e.target.name]: e.target.value };
    setCustomization(newCustomization);
    updateFirestoreCustomization({ customization: newCustomization });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const logoFile = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoUrl = reader.result as string;
        const newCustomization = { ...customization, logoUrl };
        setCustomization(newCustomization);
        updateFirestoreCustomization({ customization: newCustomization });
      };
      reader.readAsDataURL(logoFile);
    }
  };

  const handleSaveKnowledgeBase = async () => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to save.", variant: "destructive"});
        return;
    }
    setIsSaving(true);
    const result = await updateKnowledgeBase(user.uid, localKnowledgeBase);
    if(result.success) {
        setKnowledgeBase(localKnowledgeBase);
        toast({ title: "Success", description: "Knowledge base saved successfully." });
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive"});
    }
    setIsSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Chatbot Configuration</CardTitle>
        <CardDescription>Customize the look, behavior, and knowledge of your chatbot.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="appearance">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" /> Appearance</TabsTrigger>
            <TabsTrigger value="scenario"><MessageCircleQuestion className="mr-2 h-4 w-4" /> Scenario</TabsTrigger>
            <TabsTrigger value="knowledge"><Database className="mr-2 h-4 w-4" /> Knowledge</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> History</TabsTrigger>
          </TabsList>
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
          <TabsContent value="scenario" className="pt-4">
            <ScenarioEditor initialScenario={scenario} setScenario={setScenario} />
          </TabsContent>
          <TabsContent value="knowledge" className="pt-4 space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>General Knowledge Base</AlertTitle>
                <AlertDescription>
                    Provide any general information, context, or data you want the AI to know. This will be used to answer questions that are not covered by the scripted scenario.
                </AlertDescription>
              </Alert>
              <Textarea 
                placeholder="Enter company information, product details, FAQs, etc."
                className="h-64"
                value={localKnowledgeBase}
                onChange={(e) => setLocalKnowledgeBase(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handleSaveKnowledgeBase} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Knowledge Base"}
                </Button>
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
