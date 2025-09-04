'use client';

import React, { useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import MarkdownToolbar from './MarkdownToolbar';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Card } from './ui/card';

interface MarkdownEditorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  textareaHeightClass?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  value, 
  onValueChange, 
  placeholder = "Enter content here...",
  textareaHeightClass = "h-48"
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Tabs defaultValue="write" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <div className="flex flex-col">
            <MarkdownToolbar 
                textareaRef={textareaRef}
                currentValue={value}
                onValueChange={onValueChange}
            />
            <Textarea 
                ref={textareaRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className={`w-full rounded-t-none focus-visible:ring-0 focus-visible:ring-offset-0 ${textareaHeightClass}`}
            />
        </div>
      </TabsContent>
      <TabsContent value="preview">
        <Card className={`prose dark:prose-invert min-h-[240px] p-4 border rounded-md overflow-auto ${textareaHeightClass}`}>
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {value || "*Preview will be shown here...*"}
            </ReactMarkdown>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default MarkdownEditor;
