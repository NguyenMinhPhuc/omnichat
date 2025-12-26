"use client";

import { useState } from "react";
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
import { postJSON } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    try {
      const res = await postJSON("/api/auth/login", { email, password });
      const user = res.user as {
        userId: string;
        email?: string;
        displayName?: string;
        role?: string | null;
        status?: string | null;
      };

      if (!user || !user.userId) {
        throw new Error("Invalid login response");
      }

      login({
        uid: user.userId,
        email: user.email ?? null,
        displayName: user.displayName ?? null,
        role: user.role ?? null,
        status: user.status ?? null,
      });

      if (user.status && user.status !== "active") {
        toast({
          title: "Login Failed",
          description: `Account status is ${user.status}`,
          variant: "destructive",
        });
        setErrorMessage(`Account status is ${user.status}`);
        return;
      }

      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      const message = error?.message || "Login failed. Please try again.";
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
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
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Log in to manage your chatbot</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              />
            </div>
            {errorMessage && (
              <p className="text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
