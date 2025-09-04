
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, GripVertical, Save, CornerDownRight, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateScenario } from '@/app/actions';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Label } from './ui/label';
import MarkdownEditor from './MarkdownEditor';

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
    
    return (
        <div className="ml-4" style={{ marginLeft: `${level * 2}rem` }}>
            <Card className="mb-4 relative overflow-visible">
                {level > 0 && <CornerDownRight className="absolute -left-6 top-10 h-6 w-6 text-muted-foreground" />}
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                    <GripVertical className="h-8 w-8 text-muted-foreground mt-8 cursor-grab" />
                    <div className="flex-1 space-y-4">
                        <div>
                        <Label htmlFor={`question-${item.id}`}>Question</Label>
                        <Input
                            id={`question-${item.id}`}
                            placeholder="e.g., What are your opening hours?"
                            value={item.question}
                            onChange={e => handleInputChange(item.id, 'question', e.target.value)}
                        />
                        </div>
                        <div>
                        <Label>Answer</Label>
                        <MarkdownEditor 
                            value={item.answer}
                            onValueChange={(value) => handleInputChange(item.id, 'answer', value)}
                            placeholder="e.g., We are open from 9 AM to 5 PM, Monday to Friday."
                        />
                        </div>
                        <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleAddItem(item.id)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Follow-up
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </Button>
                        </div>
                    </div>
                    </div>
                </CardContent>
            </Card>
            {children}
        </div>
    )
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

  const renderItems = (parentId: string | null, level = 0) => {
    const items = scenarioMap.get(parentId || 'root') || [];
    return items.map(item => (
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
            <AlertTitle>How it works</AlertTitle>
            <AlertDescription>
                Create a scripted conversation for your chatbot. Add root questions, and then follow-up questions to build a decision tree. If a user asks something not in the script, the AI will answer freely.
            </AlertDescription>
        </Alert>
      {renderItems(null)}
      <div className="flex justify-between items-center">
        <Button onClick={() => handleAddItem(null)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Root Question
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Scenario"}
        </Button>
      </div>
    </div>
  );
}
