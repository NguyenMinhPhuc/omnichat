
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Palette, History, MessageCircleQuestion, Database, Save, PlusCircle, Trash2, Pencil, BookOpen, Type, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CustomizationState, ScenarioItem, KnowledgeSource } from './Dashboard';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ChatHistory from './ChatHistory';
import ScenarioEditor from './ScenarioEditor';
import { Button } from './ui/button';
import { addKnowledgeSource, updateKnowledgeSource, deleteKnowledgeSource } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import MarkdownEditor from './MarkdownEditor';
import { uploadFile } from '@/lib/storage';
import { Bot } from 'lucide-react';


interface CustomizationPanelProps {
  customization: CustomizationState;
  setCustomization: React.Dispatch<React.SetStateAction<CustomizationState>>;
  scenario: ScenarioItem[];
  setScenario: React.Dispatch<React.SetStateAction<ScenarioItem[]>>;
  knowledgeSources: KnowledgeSource[];
  setKnowledgeSources: React.Dispatch<React.SetStateAction<KnowledgeSource[]>>;
  chatbotId: string;
}

export default function CustomizationPanel({
  customization,
  setCustomization,
  scenario,
  setScenario,
  knowledgeSources,
  setKnowledgeSources,
  chatbotId,
}: CustomizationPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSource, setCurrentSource] = useState<Partial<KnowledgeSource> | null>(null);
  const [activeTab, setActiveTab] = useState("appearance");
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomization({ ...customization, [name]: value });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomization({ ...customization, [name]: value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'chatbotIconUrl') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to upload files.", variant: "destructive" });
        return;
      }
      const path = `users/${user.uid}/customization/${field}_${Date.now()}`;
      try {
        const downloadURL = await uploadFile(file, path);
        setCustomization(prev => ({ ...prev, [field]: downloadURL }));
        toast({ title: "Upload Successful", description: "Image has been updated. Remember to save changes." });
      } catch (error) {
        console.error('Upload or update error', error);
        toast({ title: "Error", description: "File upload failed.", variant: "destructive"});
      }
    }
  };

  const handleSaveCustomization = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
            'customization': customization
        });
        toast({ title: "Success", description: "Customization settings saved." });
    } catch (e) {
        const error = e as Error;
        toast({ title: "Error", description: `Failed to save settings: ${error.message}`, variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  };

  const handleOpenDialog = (source: Partial<KnowledgeSource> | null = null) => {
    setCurrentSource(source || { title: '', content: '' });
    setIsDialogOpen(true);
  };
  
  const handleSaveKnowledgeSource = async () => {
    if (!user || !currentSource || !currentSource.title || !currentSource.content) {
        toast({ title: "Error", description: "Title and content are required.", variant: "destructive"});
        return;
    }
    setIsSaving(true);
    try {
        if (currentSource.id) { // Editing existing source
            const result = await updateKnowledgeSource(user.uid, currentSource as KnowledgeSource);
            if (result.success) {
                setKnowledgeSources(prev => prev.map(s => s.id === currentSource.id ? (currentSource as KnowledgeSource) : s));
                toast({ title: "Success", description: "Knowledge source updated." });
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive"});
            }
        } else { // Adding new source
            const newSource: Omit<KnowledgeSource, 'id'> = { title: currentSource.title, content: currentSource.content };
            const result = await addKnowledgeSource(user.uid, newSource);
            if (result.success && result.newSource) {
                setKnowledgeSources(prev => [...prev, result.newSource!]);
                toast({ title: "Success", description: "Knowledge source added." });
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive"});
            }
        }
        setIsDialogOpen(false);
    } catch(e) {
        const error = e as Error;
        toast({ title: "Error", description: error.message, variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (sourceId: string) => {
    if (!user) return;
    const result = await deleteKnowledgeSource(user.uid, sourceId);
    if (result.success) {
        setKnowledgeSources(prev => prev.filter(s => s.id !== sourceId));
        toast({ title: "Success", description: "Knowledge source deleted." });
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive"});
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Chatbot Configuration</CardTitle>
        <CardDescription>Customize the look, behavior, and knowledge of your chatbot.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" /> Appearance</TabsTrigger>
            <TabsTrigger value="scenario"><MessageCircleQuestion className="mr-2 h-4 w-4" /> Scenario</TabsTrigger>
            <TabsTrigger value="knowledge"><Database className="mr-2 h-4 w-4" /> Knowledge</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> History</TabsTrigger>
          </TabsList>
          <TabsContent value="appearance" className="pt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="chatbotName" className="flex items-center gap-2"><Type className="w-4 h-4"/> Chatbot Display Name</Label>
                    <Input id="chatbotName" name="chatbotName" value={customization.chatbotName} onChange={handleInputChange} placeholder="e.g., Support Pro" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="greetingMessage">Greeting Message</Label>
                    <Textarea id="greetingMessage" name="greetingMessage" value={customization.greetingMessage} onChange={handleInputChange} placeholder="Hello! How can I help you today?" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="aiPersona">AI Persona</Label>
                    <Textarea id="aiPersona" name="aiPersona" value={customization.aiPersona} onChange={handleInputChange} placeholder="You are a friendly and helpful assistant." rows={4}/>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Branding &amp; Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <Input id="primaryColor" name="primaryColor" type="color" value={customization.primaryColor} onChange={handleColorChange} className="p-1 h-10"/>
                  </div>
                  <div>
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <Input id="accentColor" name="accentColor" type="color" value={customization.accentColor} onChange={handleColorChange} className="p-1 h-10"/>
                  </div>
                   <div>
                    <Label htmlFor="backgroundColor">Background Color</Label>
                    <Input id="backgroundColor" name="backgroundColor" type="color" value={customization.backgroundColor} onChange={handleColorChange} className="p-1 h-10"/>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Logo</Label>
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={customization.logoUrl || ''} alt="Logo Preview" />
                                <AvatarFallback><Bot /></AvatarFallback>
                            </Avatar>
                            <Input id="logo" type="file" onChange={(e) => handleFileChange(e, 'logoUrl')} accept="image/*" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Bot className="w-4 h-4"/> Chatbot Icon</Label>
                         <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={customization.chatbotIconUrl || ''} alt="Chatbot Icon Preview" />
                                <AvatarFallback><Bot /></AvatarFallback>
                            </Avatar>
                            <Input id="chatbotIcon" type="file" onChange={(e) => handleFileChange(e, 'chatbotIconUrl')} accept="image/*" />
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
             <div className="flex justify-end">
                  <Button onClick={handleSaveCustomization} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4"/>
                    {isSaving ? 'Saving Appearance...' : 'Save Appearance'}
                  </Button>
                </div>
          </TabsContent>
          <TabsContent value="scenario" className="pt-4">
            <ScenarioEditor initialScenario={scenario} setScenario={setScenario} />
          </TabsContent>
           <TabsContent value="knowledge" className="pt-4 space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>Knowledge Base</AlertTitle>
                <AlertDescription>
                    Add, edit, or remove structured knowledge sources. The AI will use this information to answer questions not covered by the scripted scenario.
                </AlertDescription>
              </Alert>
              <div className="border rounded-md">
                {knowledgeSources.length > 0 ? (
                    <ul className="divide-y">
                        {knowledgeSources.map(source => (
                            <li key={source.id} className="p-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="h-5 w-5 text-primary"/>
                                    <span className="font-medium">{source.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(source)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action will permanently delete the knowledge source titled "{source.title}".
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(source.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-muted-foreground p-6">No knowledge sources yet. Add one to get started.</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Knowledge Source
                </Button>
              </div>
          </TabsContent>
          <TabsContent value="history" className="pt-4">
            <ChatHistory chatbotId={chatbotId} />
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                  <DialogTitle>{currentSource?.id ? 'Edit' : 'Add'} Knowledge Source</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div>
                      <Label htmlFor="ks-title">Title</Label>
                      <Input 
                        id="ks-title" 
                        placeholder="e.g., Return Policy" 
                        value={currentSource?.title || ''}
                        onChange={(e) => setCurrentSource(prev => ({ ...prev, title: e.target.value }))}
                      />
                  </div>
                  <div>
                      <Label htmlFor="ks-content">Content</Label>
                       <MarkdownEditor
                            value={currentSource?.content || ''}
                            onValueChange={(value) => setCurrentSource(prev => ({ ...prev, content: value }))}
                            placeholder="Enter all information related to this topic. You can use Markdown for formatting."
                        />
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSaveKnowledgeSource} disabled={isSaving}>
                      <Save className="mr-2 h-4 w-4"/>
                      {isSaving ? 'Saving...' : 'Save'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </Card>
  );
}
