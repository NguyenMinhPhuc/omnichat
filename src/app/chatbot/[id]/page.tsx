import LiveChatbot from "@/components/LiveChatbot";

export default function ChatbotPage({ params }: { params: { id: string } }) {
  return <LiveChatbot chatbotId={params.id} />;
}
