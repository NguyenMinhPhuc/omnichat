
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, GripVertical, Save, CornerDownRight, AlertCircle, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateScenario } from '@/app/actions';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Label } from './ui/label';
import MarkdownEditor from './MarkdownEditor';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export interface ScenarioItem {
  id: string;
  question: string;
  answer: string;
  parentId: string | null;
}

interface ScenarioEditorProps {
  initialScenario: ScenarioItem[];
  setScenario: React.Dispatch<React.SetStateAction<ScenarioItem[]>>;
}

interface RenderItemProps {
  item: ScenarioItem;
  level: number;
}

const DraggableScenarioItem: React.FC<RenderItemProps & { 
    handleInputChange: (id: string, field: 'question' | 'answer', value: string) => void;
    handleAddItem: (parentId: string | null) => void;
    handleRemoveItem: (id: string) => void;
    children: React.ReactNode;
}> = ({ item, level, handleInputChange, handleAddItem, handleRemoveItem, children }) => {
    
    const content = (
        <div className="flex-1 space-y-4">
            {level === 0 && (
                 <div>
                    <Label htmlFor={`question-${item.id}`}>Câu hỏi chính</Label>
                    <Input
                        id={`question-${item.id}`}
                        placeholder="e.g., What are your opening hours?"
                        value={item.question}
                        onChange={e => handleInputChange(item.id, 'question', e.target.value)}
                        className="font-semibold"
                    />
                </div>
            )}
            <div>
                <Label>Câu trả lời</Label>
                <MarkdownEditor 
                    value={item.answer}
                    onValueChange={(value) => handleInputChange(item.id, 'answer', value)}
                    placeholder="e.g., We are open from 9 AM to 5 PM, Monday to Friday."
                />
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleAddItem(item.id)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Thêm câu hỏi phụ
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Xóa
                </Button>
            </div>
        </div>
    );

    const followUpQuestionInput = (
        <div className="w-full pl-8">
            <Label htmlFor={`question-${item.id}`} className="sr-only">Câu hỏi phụ</Label>
            <Input
                id={`question-${item.id}`}
                placeholder="Nhập câu hỏi phụ của người dùng..."
                value={item.question}
                onChange={e => handleInputChange(item.id, 'question', e.target.value)}
            />
        </div>
    );

    if (level > 0) {
        return (
            <div className={cn("ml-4 flex items-start gap-2", level > 1 && "ml-12")}>
                 <CornerDownRight className="mt-2 h-5 w-5 text-muted-foreground" />
                <div className="w-full space-y-4">
                    {followUpQuestionInput}
                    <div className="ml-8 space-y-4">
                        <div>
                            <Label>Câu trả lời cho câu hỏi phụ</Label>
                             <MarkdownEditor 
                                value={item.answer}
                                onValueChange={(value) => handleInputChange(item.id, 'answer', value)}
                                placeholder="e.g., We are open from 9 AM to 5 PM, Monday to Friday."
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleAddItem(item.id)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Thêm câu hỏi phụ
                            </Button>
                             <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Xóa
                            </Button>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Card className="mb-4 overflow-hidden">
             <Accordion type="single" collapsible className="w-full">
                <AccordionItem value={item.id} className="border-b-0">
                    <AccordionTrigger className="flex w-full items-center justify-between p-4 hover:no-underline hover:bg-muted/50">
                       <div className="flex items-center gap-4">
                            <GripVertical className="h-8 w-8 text-muted-foreground cursor-grab" />
                            <div className="text-left">
                                <p className="font-semibold">{item.question || "Câu hỏi mới"}</p>
                                <p className="text-xs text-muted-foreground">Nhấp để mở rộng và chỉnh sửa</p>
                            </div>
                       </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-6 pt-2 border-t">
                            {content}
                            {children && <div className="mt-4 space-y-4 pt-4 border-t">{children}</div>}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}


export default function ScenarioEditor({ initialScenario, setScenario }: ScenarioEditorProps) {
  const [localScenario, setLocalScenario] = useState<ScenarioItem[]>(initialScenario);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalScenario(initialScenario);
  }, [initialScenario]);

  const scenarioMap = useMemo(() => {
    const map = new Map<string, ScenarioItem[]>();
    localScenario.forEach(item => {
      const children = map.get(item.parentId || 'root') || [];
      children.push(item);
      map.set(item.parentId || 'root', children);
    });
    return map;
  }, [localScenario]);

  const handleAddItem = (parentId: string | null = null) => {
    const newItem: ScenarioItem = {
      id: crypto.randomUUID(),
      question: '',
      answer: '',
      parentId,
    };
    setLocalScenario(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    const itemsToRemove = new Set<string>([id]);
    let queue = [id];
    while(queue.length > 0) {
        const currentId = queue.shift()!;
        const children = localScenario.filter(item => item.parentId === currentId);
        children.forEach(child => {
            itemsToRemove.add(child.id);
            queue.push(child.id);
        });
    }
    setLocalScenario(prev => prev.filter(item => !itemsToRemove.has(item.id)));
  };

  const handleInputChange = (id: string, field: 'question' | 'answer', value: string) => {
    setLocalScenario(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to save.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    // Filter out empty questions before saving
    const validScenario = localScenario.filter(item => item.question.trim() !== '');
    const result = await updateScenario(user.uid, validScenario);

    if (result.success) {
      setScenario(validScenario);
      setLocalScenario(validScenario);
      toast({ title: "Success", description: "Scenario saved successfully." });
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsSaving(false);
  };

  const renderItems = (parentId: string | null, level = 0): React.ReactNode => {
    const items = scenarioMap.get(parentId || 'root') || [];
    const sortedItems = items.sort((a,b) => localScenario.indexOf(a) - localScenario.indexOf(b));
    return sortedItems.map(item => (
        <DraggableScenarioItem
            key={item.id}
            item={item}
            level={level}
            handleInputChange={handleInputChange}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
        >
            {renderItems(item.id, level + 1)}
        </DraggableScenarioItem>
    ));
  };

  return (
    <div className="space-y-4">
        <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cách hoạt động</AlertTitle>
            <AlertDescription>
                Tạo một cuộc trò chuyện theo kịch bản cho chatbot của bạn. Thêm các câu hỏi gốc, sau đó là các câu hỏi phụ để xây dựng cây quyết định. Nếu người dùng hỏi điều gì không có trong kịch bản, AI sẽ tự do trả lời.
            </AlertDescription>
        </Alert>
      <div>
        {renderItems(null)}
      </div>
      <div className="flex justify-between items-center">
        <Button onClick={() => handleAddItem(null)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm câu hỏi gốc
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Đang lưu..." : "Lưu kịch bản"}
        </Button>
      </div>
    </div>
  );
}

