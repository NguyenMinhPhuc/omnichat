'use client';

import { Bot } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LogoProps {
  logoUrl: string | null;
}

export default function Logo({ logoUrl }: LogoProps) {
  return (
    <Avatar className="h-10 w-10 border-2 border-white/50">
      {logoUrl ? (
        <AvatarImage src={logoUrl} alt="Chatbot Logo" className='object-cover'/>
      ) : (
        <AvatarFallback className="bg-white/20">
            <Bot className="h-6 w-6 text-primary-foreground" />
        </AvatarFallback>
      )}
    </Avatar>
  );
}
