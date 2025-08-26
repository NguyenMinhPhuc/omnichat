'use client'

import LiveChatbot from "@/components/LiveChatbot";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ChatbotPageContent() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chatId');

  return <LiveChatbot chatbotId={chatId!} />;
}

export default function ChatbotPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ChatbotPageContent />
        </Suspense>
    )
}
