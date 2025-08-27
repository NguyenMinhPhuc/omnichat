
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
  const [embedCode, setEmbedCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || !chatbotId) {
      return;
    }
    const origin = window.location.origin;

    // Generate the HTML container code
    const htmlSnippet = `<div id="chatbot-container" style="width: 400px; height: 600px; border: 1px solid #ccc;">
  <!-- The chatbot will be loaded here -->
</div>`;
    setHtmlCode(htmlSnippet);

    // Generate the script tag to be embedded
    const scriptTag = `<script 
  id="omnichat-embed-script"
  src="${origin}/embed.js" 
  data-chatbot-id="${chatbotId}"
  data-target-id="chatbot-container"
  defer>
</script>`;
    setEmbedCode(scriptTag);

  }, [chatbotId]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Code /> Embed on Your Site</CardTitle>
        <CardDescription>Follow these steps to add the chatbot to your website.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="html-code" className='text-base'>Step 1: Add a container element</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Place this HTML snippet where you want the chatbot to appear on your page. You can customize the `id` and `style` attributes.
          </p>
          <div className="relative">
            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
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
          <Label htmlFor="embed-code" className='text-base'>Step 2: Add the script tag</Label>
           <p className="text-sm text-muted-foreground mb-2">
            Paste this script tag just before the closing `&lt;/body&gt;` tag. Ensure `data-target-id` matches the ID of your container from Step 1.
          </p>
          <div className="relative">
            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
              <code>
                {embedCode || 'Loading...'}
              </code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={() => copyToClipboard(embedCode)}
              disabled={!embedCode}
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
