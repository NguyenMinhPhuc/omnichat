
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Code, Copy, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EmbedGuideProps {
  chatbotId: string;
}

export default function EmbedGuide({ chatbotId }: EmbedGuideProps) {
  const { toast } = useToast();
  const [cssCode, setCssCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const [fullHtmlCode, setFullHtmlCode] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || !chatbotId) {
      return;
    }
    const origin = window.location.origin;

    const cssSnippet = `
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
    `;
    setCssCode(cssSnippet.trim());

    const htmlSnippet = `
<!-- Container for the chat window -->
<div class="chat-box" id="omnichat-box">
  <div id="omnichat-container" style="width: 100%; height: 100%;">
    <!-- Chatbot will be loaded here -->
  </div>
</div>

<!-- The chat bubble trigger -->
<div class="chat-bubble" id="omnichat-toggle">
  <!-- You can use an SVG icon or an <img> tag -->
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7.75 2.5a.75.75 0 0 0-1.5 0v1.563c-1.43.41-2.65 1.2-3.645 2.247a.75.75 0 0 0 1.04 1.082A7.493 7.493 0 0 1 8 5.563V4a.75.75 0 0 0-.25-.5Z"/><path fill-rule="evenodd" d="M12 1.25a.75.75 0 0 1 .75.75v18.5a.75.75 0 0 1-1.5 0V2a.75.75 0 0 1 .75-.75ZM16.25 4a.75.75 0 0 0-.25.5v1.563a7.493 7.493 0 0 1 4.355 1.784.75.75 0 0 0 1.04-1.082c-.994-1.046-2.215-1.838-3.645-2.247V2.5a.75.75 0 0 0-1.5 0v1.5ZM4.645 7.39a.75.75 0 0 0-1.04 1.082 9.003 9.003 0 0 0 0 7.056.75.75 0 1 0 1.04 1.082A7.503 7.503 0 0 1 3 12a7.503 7.503 0 0 1 1.645-4.61ZM19.355 7.39A7.503 7.503 0 0 1 21 12a7.503 7.503 0 0 1-1.645 4.61.75.75 0 1 0 1.04 1.082 9.003 9.003 0 0 0 0-7.056.75.75 0 1 0-1.04 1.082Z"/></svg>
</div>

<!-- The script that loads your chatbot -->
<script 
  id="omnichat-embed-script"
  src="${origin}/embed.js" 
  data-chatbot-id="${chatbotId}"
  data-target-id="omnichat-container"
  defer>
<\/script>
    `;
    setHtmlCode(htmlSnippet.trim());

    const jsSnippet = `
const chatToggle = document.getElementById("omnichat-toggle");
const chatBox = document.getElementById("omnichat-box");

if (chatToggle && chatBox) {
    chatToggle.addEventListener("click", () => {
        chatBox.classList.toggle("open");
    });
}
    `;
    setJsCode(jsSnippet.trim());
    
    const fullCode = `
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
        ${cssSnippet.trim()}
    </style>
</head>
<body>
    <h1>My Website</h1>
    <p>This is a demo page with the OmniChat bubble embedded.</p>

    ${htmlSnippet.trim()}

    <script>
        ${jsSnippet.trim()}
    <\/script>
</body>
</html>
    `;
    setFullHtmlCode(fullCode.trim());


  }, [chatbotId]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

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
                {cssCode || 'Loading...'}
              </code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={() => copyToClipboard(cssCode)}
              disabled={!cssCode}
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
                {htmlCode || 'Loading...'}
              </code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={() => copyToClipboard(htmlCode)}
              disabled={!htmlCode}
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
                {jsCode || 'Loading...'}
              </code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={() => copyToClipboard(jsCode)}
              disabled={!jsCode}
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
                {fullHtmlCode || 'Loading...'}
              </code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={() => copyToClipboard(fullHtmlCode)}
              disabled={!fullHtmlCode}
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
