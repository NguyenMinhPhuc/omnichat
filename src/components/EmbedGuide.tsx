
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Code, Copy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EmbedGuideProps {
  chatbotId: string;
}

export default function EmbedGuide({ chatbotId }: EmbedGuideProps) {
  const { toast } = useToast();
  const [embedCode, setEmbedCode] = useState('');
  const [origin, setOrigin] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    const fetchCustomization = async () => {
      if (!chatbotId) return;
      const userDocRef = doc(db, 'users', chatbotId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setPrimaryColor(data.customization?.primaryColor || '#1F5AA8');
        setLogoUrl(data.customization?.logoUrl || '');
      }
    };
    fetchCustomization();
  }, [chatbotId]);

  useEffect(() => {
    if (origin && chatbotId) {
      // Use a unique ID for the script to make it easier to find in the DOM.
      const scriptTag = `<script 
  id="omnichat-embed-script"
  src="${origin}/embed.js" 
  data-chatbot-id="${chatbotId}"
  data-primary-color="${primaryColor}"
  data-logo-url="${logoUrl}"
  defer>
</script>`;
      setEmbedCode(scriptTag);
    }
  }, [origin, chatbotId, primaryColor, logoUrl]);


  const copyToClipboard = () => {
    if (!embedCode) return;
    navigator.clipboard.writeText(embedCode);
    toast({ title: 'Copied to clipboard!' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Code /> Embed on Your Site</CardTitle>
        <CardDescription>Copy and paste this code just before the closing `</body>` tag on your website.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="embed-code">Embed Code</Label>
          <div className="relative">
            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
              <code>
                {embedCode ? embedCode.replace(/ /g, '\u00a0').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Loading...'}
              </code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={copyToClipboard}
              disabled={!embedCode}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
