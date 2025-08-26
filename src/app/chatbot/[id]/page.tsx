'use client'

import LiveChatbot from "@/components/LiveChatbot";
import { Suspense } from "react";

// The `params` object is passed automatically by Next.js for dynamic routes.
export default function ChatbotPage({ params }: { params: { id: string } }) {
    const chatbotId = params.id;

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
