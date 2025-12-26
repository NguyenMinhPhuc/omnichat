"use client";

import { useState } from "react";
import { postJSON } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Bot } from "lucide-react";
import bcrypt from "bcryptjs";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const passwordHash = await bcrypt.hash(password, 12);

      await postJSON("/api/users", {
        userId: crypto.randomUUID(),
        email,
        displayName,
        phoneNumber,
        role: "user",
        status: "pending",
        geminiApiKey: "",
        canManageApiKey: false,
        knowledgeBase: "",
        passwordHash,
      });

      toast({
        title: "Signup Successful",
        description:
          "Your account has been created and is awaiting approval from an administrator. You will be able to log in once approved.",
      });

      router.push("/"); // Redirect to login page after showing the message
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error?.message || "Could not create account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex items-center gap-2 justify-center mb-4">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-foreground">
              OmniChat
            </h1>
          </div>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Get started with your own AI chatbot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="e.g., John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g., john.doe@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., 0909123456"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full">
              Sign Up
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
