export interface UserEntity {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  passwordHash?: string | null;
  role?: string | null;
  status?: string | null;
  geminiApiKey?: string | null;
  knowledgeBase?: string | null;
  canManageApiKey?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface KnowledgeSourceEntity {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScenarioEntity {
  id: string;
  userId: string;
  question: string;
  answer: string;
  parentId?: string | null;
  createdAt?: Date;
}

export interface LeadEntity {
  id: string;
  chatbotId: string;
  customerName?: string | null;
  phoneNumber?: string | null;
  needs?: string | null;
  status: "waiting" | "consulted";
  createdAt?: Date;
}

export interface ChatEntity {
  id: string;
  chatbotId: string;
  messages: string; // JSON string
  isRead: boolean;
  createdAt?: Date;
}

export interface MonthlyUsageEntity {
  id: string;
  userId: string;
  monthYear: string; // YYYY-MM
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  chatRequests: number;
  createdAt?: Date;
  updatedAt?: Date;
}
