
'use client';

import React from 'react';
import { Button } from './ui/button';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Image, Video } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onValueChange: (value: string) => void;
  currentValue: string;
}

const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ textareaRef, onValueChange, currentValue }) => {

  const applyFormat = (prefix: string, suffix: string = '', placeholder: string = 'text') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentValue.substring(start, end);

    const newText = 
        currentValue.substring(0, start) +
        prefix +
        (selectedText || placeholder) +
        suffix +
        currentValue.substring(end);

    onValueChange(newText);
    
    // Focus and select placeholder text
    setTimeout(() => {
        textarea.focus();
        if (selectedText) {
            textarea.selectionStart = start + prefix.length;
            textarea.selectionEnd = end + prefix.length;
        } else {
            textarea.selectionStart = start + prefix.length;
            textarea.selectionEnd = start + prefix.length + placeholder.length;
        }
    }, 0);
  };
  
  const applyLineFormat = (prefix: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const text = currentValue;

    // Find the start of the current line
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    
    const newText = text.substring(0, lineStart) + prefix + text.substring(lineStart);
    onValueChange(newText);
    
    setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = start + prefix.length;
    }, 0);
  }

  const buttons = [
    { icon: Bold, tooltip: 'Bold', onClick: () => applyFormat('**', '**', 'bold text') },
    { icon: Italic, tooltip: 'Italic', onClick: () => applyFormat('*', '*', 'italic text') },
    { icon: Heading1, tooltip: 'Heading 1', onClick: () => applyLineFormat('# ') },
    { icon: Heading2, tooltip: 'Heading 2', onClick: () => applyLineFormat('## ') },
    { icon: Heading3, tooltip: 'Heading 3', onClick: () => applyLineFormat('### ') },
    { icon: List, tooltip: 'Bulleted List', onClick: () => applyLineFormat('- ') },
    { icon: ListOrdered, tooltip: 'Numbered List', onClick: () => applyLineFormat('1. ') },
    { icon: Image, tooltip: 'Insert Image', onClick: () => applyFormat('![alt text](', ')', 'image_url') },
    { icon: Video, tooltip: 'Embed Video', onClick: () => applyFormat('<iframe src="', '" width="560" height="315" frameborder="0" allowfullscreen></iframe>', 'video_url') },
  ];

  return (
    <TooltipProvider>
        <div className="flex items-center gap-1 rounded-t-md border border-b-0 border-input p-1 bg-muted flex-wrap">
        {buttons.map(({ icon: Icon, tooltip, onClick }, index) => (
            <Tooltip key={index}>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClick}>
                <Icon className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
            </Tooltip>
        ))}
        </div>
    </TooltipProvider>
  );
};

export default MarkdownToolbar;
