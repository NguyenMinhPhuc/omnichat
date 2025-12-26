"use client";

import { useEffect, useState } from "react";
import { getJSON, putJSON } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Bot,
  User,
  Calendar as CalendarIcon,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { addDays, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";

interface ChatHistoryProps {
  chatbotId: string;
}

interface ChatSession {
  id: string;
  createdAt: string;
  messages: { sender: "user" | "ai"; text: string }[];
  isRead?: boolean;
}

export default function ChatHistory({ chatbotId }: ChatHistoryProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  useEffect(() => {
    const fetchChatHistory = async () => {
      setLoading(true);
      try {
        const res = await getJSON(
          `/api/chats/by-chatbot/${encodeURIComponent(chatbotId)}`
        );
        let sessions: ChatSession[] = res.chats ?? [];
        // Client-side date filtering
        if (date?.from) {
          const from = new Date(date.from);
          sessions = sessions.filter((s) => new Date(s.createdAt) >= from);
        }
        if (date?.to) {
          const to = new Date(date.to);
          to.setHours(23, 59, 59, 999);
          sessions = sessions.filter((s) => new Date(s.createdAt) <= to);
        }
        setChatSessions(sessions);
      } catch (err) {
        console.error("Failed to fetch chat history", err);
        setChatSessions([]);
      }
      setLoading(false);
    };

    if (chatbotId) {
      fetchChatHistory();
    }
  }, [chatbotId, date]);

  const handleMarkAsRead = async (sessionId: string) => {
    try {
      await putJSON(`/api/chats/${encodeURIComponent(sessionId)}`, {});
    } catch (err) {
      console.error("Failed to mark read", err);
    }
    // Update local state to reflect the change immediately
    setChatSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId ? { ...session, isRead: true } : session
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="font-headline flex items-center gap-2">
              <MessageSquare /> Chat History
            </CardTitle>
            <CardDescription>
              Review past conversations with your chatbot.
            </CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {loading ? (
            <p>Loading chat history...</p>
          ) : chatSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No chat history found for the selected period.
            </p>
          ) : (
            <div className="space-y-2">
              {chatSessions.map((session) => (
                <Dialog
                  key={session.id}
                  onOpenChange={(open) => {
                    if (open && !session.isRead) {
                      handleMarkAsRead(session.id);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-2"
                    >
                      <div className="flex items-center gap-2 text-left">
                        {!session.isRead && (
                          <span
                            className="h-2 w-2 rounded-full bg-primary"
                            title="Unread"
                          ></span>
                        )}
                        <div className={cn(!session.isRead && "font-bold")}>
                          Chat from{" "}
                          {format(session.createdAt.toDate(), "PPP p")}
                        </div>
                      </div>
                      {session.isRead && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Chat Transcript</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 pr-4 -mx-6 px-6">
                      <div className="space-y-4">
                        {session.messages.map((message, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex items-end gap-2",
                              message.sender === "user"
                                ? "justify-end"
                                : "justify-start"
                            )}
                          >
                            {message.sender === "ai" && (
                              <Avatar className="h-8 w-8 bg-primary">
                                <AvatarFallback>
                                  <Bot className="text-primary-foreground" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={cn(
                                "max-w-md rounded-xl px-4 py-2 text-sm shadow",
                                message.sender === "user"
                                  ? "bg-primary text-primary-foreground rounded-br-none"
                                  : "bg-card text-card-foreground rounded-bl-none border"
                              )}
                            >
                              <p>{message.text}</p>
                            </div>
                            {message.sender === "user" && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  <User />
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
