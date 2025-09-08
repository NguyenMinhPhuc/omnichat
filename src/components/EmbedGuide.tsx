
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Code, Copy, Info, Users2, Settings, Bot, LogOut, User, BookText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


interface EmbedGuideProps {
  chatbotId: string;
}

const getCssCode = () => `
.chat-bubble {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #1F5AA8; /* Example color, can be customized */
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  z-index: 1000;
}
.chat-bubble:hover {
  transform: scale(1.1);
}
.chat-bubble svg {
  width: 32px;
  height: 32px;
  animation: wave-animation 2.5s infinite;
  transform-origin: 70% 70%;
}
.chat-box {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
  display: none;
  flex-direction: column;
  overflow: hidden;
  z-index: 999;
}
.chat-box.open {
    display: flex;
}
@keyframes wave-animation {
  0% { transform: rotate(0deg) translateY(0); }
  10% { transform: rotate(14deg) translateY(-5px); }
  20% { transform: rotate(-8deg) translateY(0); }
  30% { transform: rotate(14deg) translateY(-5px); }
  40% { transform: rotate(-4deg) translateY(0); }
  50% { transform: rotate(10deg) translateY(-5px); }
  60% { transform: rotate(0deg) translateY(0); }
  100% { transform: rotate(0deg) translateY(0); }
}
`.trim();

const getHtmlCode = (chatbotId: string) => {
  const origin = 'https://omnichat.fitlhu.com';
  return `
<!-- Container for the chat window -->
<div class="chat-box" id="omnichat-box">
  <div id="omnichat-container" style="width: 100%; height: 100%;">
    <!-- Chatbot will be loaded here -->
  </div>
</div>

<!-- The chat bubble trigger -->
<div class="chat-bubble" id="omnichat-toggle">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.2.04.36.2.36.4v1.6c0 .28-.22.5-.5.5h-4a.5.5 0 0 1 0-1h3.5v-1.12c0-.22-.1-.42-.26-.56A8.01 8.01 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 2.05-.78 3.92-2.08 5.34-.16.14-.26.34-.26.56V21.5H20a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5v-1.6c0-.2.16-.36.36-.4C19.13 20.17 22 16.42 22 12A10 10 0 0 0 12 2Zm-1 14H9v-2h2v2Zm4 0h-2v-2h2v2Zm-4-4H9V9h2v3Zm4 0h-2V9h2v3Z"/>
  </svg>
</div>

<!-- The script that loads your chatbot -->
<script 
  id="omnichat-embed-script"
  src="${origin}/embed.js" 
  data-chatbot-id="${chatbotId}"
  data-target-id="omnichat-container"
  defer>
<\/script>
    `.trim();
};

const getJsCode = () => `
const chatToggle = document.getElementById("omnichat-toggle");
const chatBox = document.getElementById("omnichat-box");

if (chatToggle && chatBox) {
    chatToggle.addEventListener("click", () => {
        chatBox.classList.toggle("open");
    });
}
`.trim();


export default function EmbedGuide({ chatbotId }: EmbedGuideProps) {
  const { toast } = useToast();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // No need for useEffect or useState for this static content
  const cssCode = getCssCode();
  const htmlCode = getHtmlCode(chatbotId);
  const jsCode = getJsCode();

  const fullHtmlCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OmniChat Demo</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 2rem;
        }
        ${cssCode}
    </style>
</head>
<body>
    <h1>My Website</h1>
    <p>This is a demo page with the OmniChat bubble embedded.</p>

    ${htmlCode}

    <script>
        ${jsCode}
    <\/script>
</body>
</html>
    `.trim();

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };
  
    if (loading || !user) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Code /> Embed Chat Bubble</CardTitle>
          <CardDescription>Follow these steps to add a floating chat bubble to your website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="css-code" className='text-base'>Step 1: Add the CSS</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Add this CSS to your stylesheet or inside a `&lt;style&gt;` tag in your HTML `&lt;head&gt;`.
            </p>
            <div className="relative">
              <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto max-h-60">
                <code>
                  {cssCode}
                </code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => copyToClipboard(cssCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="html-code" className='text-base'>Step 2: Add the HTML</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Paste this HTML snippet just before the closing `&lt;/body&gt;` tag of your page.
            </p>
            <div className="relative">
              <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto max-h-60">
                <code>
                  {htmlCode}
                </code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => copyToClipboard(htmlCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="js-code" className='text-base'>Step 3: Add the JavaScript</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Add this JavaScript code in a `&lt;script&gt;` tag after the HTML from Step 2.
            </p>
            <div className="relative">
              <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto max-h-60">
                <code>
                  {jsCode}
                </code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => copyToClipboard(jsCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="full-html-code" className='text-base'>Step 4: Complete Example (All-in-One)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              For a quick start, you can use this complete HTML file. Just copy, paste, and save it as an `.html` file.
            </p>
            <div className="relative">
              <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto max-h-60">
                <code>
                  {fullHtmlCode}
                </code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => copyToClipboard(fullHtmlCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Important: Testing Locally</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Due to browser security policies, opening your HTML file directly from your computer (e.g., `file:///...`) will not work. You must serve the file from a local web server.
              </p>
              <p>
                An easy way is to use `npx serve`. In your terminal, navigate to the folder with your HTML file and run <code className="bg-muted px-1 py-0.5 rounded-sm font-semibold">npx serve</code>. Then open the `localhost` URL it provides.
              </p>
            </AlertDescription>
          </Alert>

        </CardContent>
      </Card>
  );
}
