"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Palette,
  History,
  MessageCircleQuestion,
  Database,
  Save,
  PlusCircle,
  Trash2,
  Pencil,
  BookOpen,
  Type,
  Image as ImageIcon,
  Link2,
  Bot,
  Loader2,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  CustomizationState,
  ScenarioItem,
  KnowledgeSource,
} from "./Dashboard";
import { useAuth } from "@/context/AuthContext";
import { putJSON } from "@/lib/api";
import ChatHistory from "./ChatHistory";
import ScenarioEditor from "./ScenarioEditor";
import { Button } from "./ui/button";
import {
  addKnowledgeSource,
  updateKnowledgeSource,
  deleteKnowledgeSource,
  ingestWebpageAction,
} from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import MarkdownEditor from "./MarkdownEditor";

interface CustomizationPanelProps {
  customization: CustomizationState;
  setCustomization: React.Dispatch<React.SetStateAction<CustomizationState>>;
  scenario: ScenarioItem[];
  setScenario: React.Dispatch<React.SetStateAction<ScenarioItem[]>>;
  knowledgeSources: KnowledgeSource[];
  setKnowledgeSources: React.Dispatch<React.SetStateAction<KnowledgeSource[]>>;
  chatbotId: string;
}

export default function CustomizationPanel({
  customization,
  setCustomization,
  scenario,
  setScenario,
  knowledgeSources,
  setKnowledgeSources,
  chatbotId,
}: CustomizationPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSource, setCurrentSource] =
    useState<Partial<KnowledgeSource> | null>(null);
  const [activeTab, setActiveTab] = useState("appearance");

  // State for URL ingestion
  const [ingestionUrl, setIngestionUrl] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionError, setIngestionError] = useState<{
    isBlocked: boolean;
    message: string;
  } | null>(null);
  const [dialogActiveTab, setDialogActiveTab] = useState("manual");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCustomization((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomization((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logoUrl" | "chatbotIconUrl"
  ) => {
    // Server-side file upload endpoint not implemented yet.
    // For now, ask users to paste a public URL instead of uploading files.
    toast({
      title: "Upload Disabled",
      description:
        "Server-side uploads are disabled. Please paste an image URL into the field instead.",
      variant: "default",
    });
  };

  const handleSaveCustomization = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await putJSON(`/api/customization/${encodeURIComponent(user.uid)}`, {
        data: customization,
      });
      toast({ title: "Success", description: "Customization settings saved." });
    } catch (e) {
      const error = e as Error;
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDialog = (source: Partial<KnowledgeSource> | null = null) => {
    setCurrentSource(source || { title: "", content: "" });
    setIngestionUrl("");
    setDialogActiveTab("manual");
    setIngestionError(null);
    setIsDialogOpen(true);
  };

  const handleSaveKnowledgeSource = async () => {
    if (
      !user ||
      !currentSource ||
      !currentSource.title ||
      !currentSource.content
    ) {
      toast({
        title: "Error",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      if (currentSource.id) {
        // Editing existing source
        const result = await updateKnowledgeSource(
          user.uid,
          currentSource as KnowledgeSource
        );
        if (result.success) {
          setKnowledgeSources((prev) =>
            prev.map((s) =>
              s.id === currentSource.id ? (currentSource as KnowledgeSource) : s
            )
          );
          toast({ title: "Success", description: "Knowledge source updated." });
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      } else {
        // Adding new source
        const newSource: Omit<KnowledgeSource, "id"> = {
          title: currentSource.title,
          content: currentSource.content,
        };
        const result = await addKnowledgeSource(user.uid, newSource);
        if (result.success && result.newSource) {
          setKnowledgeSources((prev) => [...prev, result.newSource!]);
          toast({ title: "Success", description: "Knowledge source added." });
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      }
      setIsDialogOpen(false);
    } catch (e) {
      const error = e as Error;
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sourceId: string) => {
    if (!user) return;
    const result = await deleteKnowledgeSource(user.uid, sourceId);
    if (result.success) {
      setKnowledgeSources((prev) => prev.filter((s) => s.id !== sourceId));
      toast({ title: "Success", description: "Knowledge source deleted." });
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleIngestUrl = async () => {
    if (!user || !ingestionUrl) {
      toast({
        title: "Error",
        description: "URL is required.",
        variant: "destructive",
      });
      return;
    }
    setIsIngesting(true);
    setIngestionError(null);
    try {
      const result = await ingestWebpageAction({
        url: ingestionUrl,
        userId: user.uid,
      });
      if (result.success && result.data) {
        setCurrentSource((prev) => ({
          ...prev,
          title: result.data!.title,
          content: result.data!.content,
        }));
        toast({
          title: "Content Generated",
          description:
            "Title and content have been populated. Review and save.",
        });
        setDialogActiveTab("manual"); // Switch to manual tab to show the results
      } else {
        const isBlocked = result.message?.startsWith("BLOCKED::");
        const message = isBlocked
          ? result.message!.replace("BLOCKED::", "")
          : result.message!;
        setIngestionError({ isBlocked: !!isBlocked, message: message });
        if (!isBlocked) {
          // Show toast for generic errors, but not for blockages (alert is shown instead)
          toast({
            title: "Ingestion Failed",
            description: message,
            variant: "destructive",
          });
        }
      }
    } catch (e) {
      const error = e as Error;
      setIngestionError({ isBlocked: false, message: error.message });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDialogTabChange = async (tab: string) => {
    setDialogActiveTab(tab);
    if (tab === "from-url") {
      if (navigator.clipboard?.readText) {
        try {
          const text = await navigator.clipboard.readText();
          // Basic URL validation
          if (text.startsWith("http://") || text.startsWith("https://")) {
            setIngestionUrl(text);
            toast({
              title: "Pasted from clipboard",
              description: "URL has been pasted automatically.",
            });
          }
        } catch (err) {
          console.warn("Could not read from clipboard:", err);
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Chatbot Configuration</CardTitle>
        <CardDescription>
          Customize the look, behavior, and knowledge of your chatbot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appearance">
              <Palette className="mr-2 h-4 w-4" /> Appearance
            </TabsTrigger>
            <TabsTrigger value="scenario">
              <MessageCircleQuestion className="mr-2 h-4 w-4" /> Scenario
            </TabsTrigger>
            <TabsTrigger value="knowledge">
              <Database className="mr-2 h-4 w-4" /> Knowledge
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" /> History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="appearance" className="pt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="chatbotName"
                    className="flex items-center gap-2"
                  >
                    <Type className="w-4 h-4" /> Chatbot Display Name
                  </Label>
                  <Input
                    id="chatbotName"
                    name="chatbotName"
                    value={customization.chatbotName}
                    onChange={handleInputChange}
                    placeholder="e.g., Support Pro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="greetingMessage">Greeting Message</Label>
                  <Textarea
                    id="greetingMessage"
                    name="greetingMessage"
                    value={customization.greetingMessage}
                    onChange={handleInputChange}
                    placeholder="Hello! How can I help you today?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aiPersona">AI Persona</Label>
                  <Textarea
                    id="aiPersona"
                    name="aiPersona"
                    value={customization.aiPersona}
                    onChange={handleInputChange}
                    placeholder="You are a friendly and helpful assistant."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Branding &amp; Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      value={customization.primaryColor}
                      onChange={handleColorChange}
                      className="p-1 h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <Input
                      id="accentColor"
                      name="accentColor"
                      type="color"
                      value={customization.accentColor}
                      onChange={handleColorChange}
                      className="p-1 h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="backgroundColor">Background Color</Label>
                    <Input
                      id="backgroundColor"
                      name="backgroundColor"
                      type="color"
                      value={customization.backgroundColor}
                      onChange={handleColorChange}
                      className="p-1 h-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Logo URL
                    </Label>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          src={customization.logoUrl || ""}
                          alt="Logo Preview"
                        />
                        <AvatarFallback>
                          <Bot />
                        </AvatarFallback>
                      </Avatar>
                      <Input
                        id="logoUrl"
                        name="logoUrl"
                        type="text"
                        placeholder="Paste image URL here"
                        value={customization.logoUrl || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Bot className="w-4 h-4" /> Chatbot Icon URL
                    </Label>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          src={customization.chatbotIconUrl || ""}
                          alt="Chatbot Icon Preview"
                        />
                        <AvatarFallback>
                          <Bot />
                        </AvatarFallback>
                      </Avatar>
                      <Input
                        id="chatbotIconUrl"
                        name="chatbotIconUrl"
                        type="text"
                        placeholder="Paste icon URL here"
                        value={customization.chatbotIconUrl || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={handleSaveCustomization} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving Appearance..." : "Save Appearance"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="scenario" className="pt-4">
            <ScenarioEditor
              initialScenario={scenario}
              setScenario={setScenario}
            />
          </TabsContent>
          <TabsContent value="knowledge" className="pt-4 space-y-4">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>Knowledge Base</AlertTitle>
              <AlertDescription>
                Add, edit, or remove structured knowledge sources. The AI will
                use this information to answer questions not covered by the
                scripted scenario.
              </AlertDescription>
            </Alert>
            <div className="border rounded-md">
              {knowledgeSources.length > 0 ? (
                <ul className="divide-y">
                  {knowledgeSources.map((source) => (
                    <li
                      key={source.id}
                      className="p-3 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="font-medium">{source.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(source)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will permanently delete the
                                knowledge source titled "{source.title}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(source.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground p-6">
                  No knowledge sources yet. Add one to get started.
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Knowledge Source
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="history" className="pt-4">
            <ChatHistory chatbotId={chatbotId} />
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) {
            setIngestionError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentSource?.id ? "Edit" : "Add"} Knowledge Source
            </DialogTitle>
          </DialogHeader>
          <Tabs
            value={dialogActiveTab}
            onValueChange={handleDialogTabChange}
            className="w-full pt-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">
                <Pencil className="mr-2 h-4 w-4" /> Manual
              </TabsTrigger>
              <TabsTrigger value="from-url">
                <Link2 className="mr-2 h-4 w-4" /> From URL
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="pt-4 space-y-4">
              <div>
                <Label htmlFor="ks-title">Title</Label>
                <Input
                  id="ks-title"
                  placeholder="e.g., Return Policy"
                  value={currentSource?.title || ""}
                  onChange={(e) =>
                    setCurrentSource((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="ks-content">Content (Markdown supported)</Label>
                <MarkdownEditor
                  value={currentSource?.content || ""}
                  onValueChange={(value) =>
                    setCurrentSource((prev) => ({ ...prev, content: value }))
                  }
                  placeholder="Enter all information related to this topic."
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSaveKnowledgeSource} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Source"}
                </Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="from-url" className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ingest-url">Webpage URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="ingest-url"
                    placeholder="https://example.com/about-us"
                    value={ingestionUrl}
                    onChange={(e) => setIngestionUrl(e.target.value)}
                  />
                  <Button
                    onClick={handleIngestUrl}
                    disabled={isIngesting || !ingestionUrl}
                  >
                    {isIngesting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="mr-2 h-4 w-4" />
                    )}
                    {isIngesting ? "Generating..." : "Generate Content"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The AI will read the page and generate a title and content
                  summary for you.
                </p>
              </div>

              {ingestionError && (
                <Alert
                  variant={ingestionError.isBlocked ? "destructive" : "default"}
                >
                  <Info className="h-4 w-4" />
                  <AlertTitle>
                    {ingestionError.isBlocked
                      ? "Webpage Blocked"
                      : "Ingestion Failed"}
                  </AlertTitle>
                  <AlertDescription>
                    {ingestionError.message}
                    {ingestionError.isBlocked && (
                      <p className="mt-2 text-xs">
                        For websites with strong anti-bot protection, using a
                        specialized third-party scraping API (e.g., Browserless,
                        ScraperAPI) is recommended.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How it works</AlertTitle>
                <AlertDescription>
                  After generation, you will be taken to the "Manual" tab to
                  review and save the new knowledge source.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
