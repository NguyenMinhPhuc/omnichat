
'use client';

import React, { useState } from 'react';
import { Upload, Palette, FileText, History, Link as LinkIcon, Loader2, Text } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { CustomizationState } from './Dashboard';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ChatHistory from './ChatHistory';
import { handleDocumentIngestion } from '@/app/actions';
import { Textarea } from './ui/textarea';

interface CustomizationPanelProps {
  customization: CustomizationState;
  setCustomization: React.Dispatch<React.SetStateAction<CustomizationState>>;
  setKnowledgeBase: (kb: string) => void;
  chatbotId: string;
}

type IngestionSource = 'file' | 'url' | 'text';

export default function CustomizationPanel({
  customization,
  setCustomization,
  setKnowledgeBase,
  chatbotId,
}: CustomizationPanelProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileList | null>(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const [ingestionSource, setIngestionSource] = useState<IngestionSource>('file');

  const updateFirestore = async (data: any) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, data, { merge: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };
  
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!user) {
        toast({ title: 'Not logged in', description: 'Please log in to update the knowledge base.', variant: 'destructive' });
        return;
    }
    
    setIsUploading(true);
    let totalSuccess = 0;
    let totalFailed = 0;
    let lastErrorMessage = '';

    try {
        if (ingestionSource === 'file' && files) {
            for (const file of Array.from(files)) {
                try {
                    const dataUri = await readFileAsDataURL(file);
                    const result = await handleDocumentIngestion({ userId: user.uid, source: { type: 'dataUri', content: dataUri }});
                    if (result.success) {
                        totalSuccess++;
                    } else {
                        totalFailed++;
                        lastErrorMessage = result.message;
                    }
                } catch (fileError) {
                    totalFailed++;
                    lastErrorMessage = fileError instanceof Error ? fileError.message : 'An unknown error occurred while processing a file.';
                }
            }
             if (totalSuccess > 0) {
                toast({ title: 'Ingestion Complete', description: `Successfully ingested ${totalSuccess} file(s). Failed: ${totalFailed}.` });
                setKnowledgeBase(`Processed ${totalSuccess} file(s).`);
            }
            if (totalFailed > 0) {
                 toast({ title: 'Ingestion Failed for Some Files', description: `Could not process ${totalFailed} file(s). Last error: ${lastErrorMessage}`, variant: 'destructive' });
            }

        } else if (ingestionSource === 'url' && url) {
            const result = await handleDocumentIngestion({ userId: user.uid, source: { type: 'url', content: url }});
             if (result.success) {
                toast({ title: 'Ingestion Successful', description: result.message });
                if (result.knowledgeBase) setKnowledgeBase(result.knowledgeBase);
            } else {
                toast({ title: 'Ingestion Failed', description: result.message, variant: 'destructive' });
            }
        } else if (ingestionSource === 'text' && text) {
             const dataUri = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
             const result = await handleDocumentIngestion({ userId: user.uid, source: { type: 'dataUri', content: dataUri }});
             if (result.success) {
                toast({ title: 'Ingestion Successful', description: result.message });
                if (result.knowledgeBase) setKnowledgeBase(result.knowledgeBase);
            } else {
                toast({ title: 'Ingestion Failed', description: result.message, variant: 'destructive' });
            }
        } else {
            toast({ title: 'No source selected', description: 'Please select a file, enter a URL, or provide text.', variant: 'destructive' });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast({ title: 'Ingestion Failed', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsUploading(false);
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

  const isSubmitDisabled = isUploading || (ingestionSource === 'file' && !files) || (ingestionSource === 'url' && !url) || (ingestionSource === 'text' && !text);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Chatbot Configuration</CardTitle>
        <CardDescription>Upload content, customize the look, and view history.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content"><FileText className="mr-2 h-4 w-4" /> Content</TabsTrigger>
            <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" /> Appearance</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> Chat History</TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="pt-4">
            <Tabs defaultValue={ingestionSource} onValueChange={(value) => setIngestionSource(value as IngestionSource)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="file"><Upload className="mr-2 h-4 w-4" />Upload Files</TabsTrigger>
                    <TabsTrigger value="url"><LinkIcon className="mr-2 h-4 w-4" />From Website</TabsTrigger>
                    <TabsTrigger value="text"><Text className="mr-2 h-4 w-4" />From Text</TabsTrigger>
                </TabsList>
                <TabsContent value="file" className="pt-4 space-y-4">
                    <Label htmlFor="knowledge-base-file">Knowledge Files</Label>
                    <p className="text-sm text-muted-foreground">Upload files (.txt, .pdf, .doc, .docx, .xls, .xlsx, .png, .jpg) to provide context. You can select multiple files.</p>
                    <Input 
                        id="knowledge-base-file" 
                        type="file" 
                        onChange={handleFileChange} 
                        multiple
                        accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,image/png,image/jpeg"
                    />
                </TabsContent>
                <TabsContent value="url" className="pt-4 space-y-4">
                    <Label htmlFor="knowledge-base-url">Website URL</Label>
                    <p className="text-sm text-muted-foreground">Enter a URL to scrape the website content for context.</p>
                    <Input 
                        id="knowledge-base-url" 
                        type="url" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                    />
                </TabsContent>
                 <TabsContent value="text" className="pt-4 space-y-4">
                    <Label htmlFor="knowledge-base-text">Paste Text</Label>
                    <p className="text-sm text-muted-foreground">Copy and paste any text content directly into the box below.</p>
                    <Textarea 
                        id="knowledge-base-text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your content here..."
                        className="min-h-[150px]"
                    />
                </TabsContent>
            </Tabs>
            <Button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full mt-4">
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isUploading ? 'Ingesting...' : 'Upload & Ingest'}
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

    