'use client'

import LiveChatbot from "@/components/LiveChatbot";
import { Suspense, use } from "react";

// The `params` object is passed automatically by Next.js for dynamic routes.
// It is now a Promise, so we use `use()` to unwrap it.
export default function ChatbotPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: chatbotId } = use(params);

    if (!chatbotId) {
        return (
             <Suspense fallback={<div>Loading...</div>}>
                <div>Chatbot ID is missing.</div>
            </Suspense>
        )
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
           <LiveChatbot chatbotId={chatbotId} />
        </Suspense>
    )
}
