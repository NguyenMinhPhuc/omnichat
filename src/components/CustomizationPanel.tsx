'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Palette, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { handleDocumentIngestion } from '@/app/actions';
import type { CustomizationState } from './Dashboard';

interface CustomizationPanelProps {
  customization: CustomizationState;
  setCustomization: React.Dispatch<React.SetStateAction<CustomizationState>>;
  setKnowledgeBase: (kb: string) => void;
}

export default function CustomizationPanel({
  customization,
  setCustomization,
  setKnowledgeBase,
}: CustomizationPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const readFileAsDataURI = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please choose a file to upload.', variant: 'destructive' });
      return;
    }
    
    if (file.type !== 'text/plain') {
        toast({ title: 'Invalid File Type', description: 'For this demo, please upload a .txt file.', variant: 'destructive' });
        return;
    }

    setIsUploading(true);
    try {
      const [dataUri, textContent] = await Promise.all([
        readFileAsDataURI(file),
        readFileAsText(file),
      ]);
      
      const result = await handleDocumentIngestion({ documentDataUri: dataUri });

      if (result.success) {
        setKnowledgeBase(textContent);
        toast({ title: 'Upload Successful', description: 'Knowledge base has been updated.' });
      } else {
        toast({ title: 'Upload Failed', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to read or upload file.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomization(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const logoFile = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomization(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(logoFile);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Chatbot Configuration</CardTitle>
        <CardDescription>Upload content and customize the look of your chatbot.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content"><FileText className="mr-2 h-4 w-4" /> Content</TabsTrigger>
            <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" /> Appearance</TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="pt-4">
            <div className="space-y-4">
              <Label htmlFor="knowledge-base-file">Knowledge Base (txt)</Label>
              <p className="text-sm text-muted-foreground">Upload a text file to provide context for the chatbot.</p>
              <Input id="knowledge-base-file" type="file" onChange={handleFileChange} accept=".txt" />
              <Button onClick={handleUpload} disabled={isUploading || !file} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload & Ingest'}
              </Button>
            </div>
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
        </Tabs>
      </CardContent>
    </Card>
  );
}
