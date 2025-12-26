# OmniChat System Blueprint

This document outlines the technical architecture, features, and data flows of the OmniChat application.

## 1. Overview

OmniChat is a multi-tenant AI chatbot platform built with Next.js and Firebase. It allows registered users (business owners) to create, customize, and deploy AI-powered chatbots on their own websites. The system includes a comprehensive admin dashboard for user management and a user-facing dashboard for chatbot configuration.

## 2. Core Features

- **User & Role Management**:
    - **Admin Role**: Manages all users, can approve new sign-ups, change user roles/statuses, and manage user API keys.
    - **User Role**: Manages their own chatbot, profile, and collected leads.
    - **Sign-up Approval System**: New users are in a "pending" state and must be approved by an admin before they can log in.

- **Chatbot Configuration (User Dashboard)**:
    - **Appearance**: Customize colors, chatbot name, logo, and icon.
    - **Behavior**: Define the AI's persona and initial greeting message.
    - **Scenario (Scripted Flow)**: A tree-based editor to create guided, question-and-answer conversation flows.
    - **Knowledge Base**: Users can add unstructured knowledge from two sources:
        1.  **Manual Entry**: Directly write or paste content (Markdown supported).
        2.  **From URL**: Paste a webpage URL, and an AI flow will automatically extract and summarize the content into a new knowledge source.

- **Lead Capture Flow**:
    - End-users can initiate a "Get Consultation" flow from within the chat.
    - An AI agent takes over to conversationally collect the end-user's name, needs, and phone number.
    - Leads are stored in Firestore and are viewable in the user's "Manage Leads" dashboard.

- **Lead Management**:
    - Users can view a table of all leads collected by their chatbot.
    - They can track and update the status of each lead (e.g., from "Waiting" to "Consulted").

- **Admin Dashboard**:
    - A centralized panel for admins to view and manage the entire user base.
    - Key actions include approving/banning users, changing roles, and managing API key permissions.
    - Displays monthly AI usage metrics for each user (tokens, requests).

- **Embeddable Chatbot**:
    - Users are provided with a simple HTML/CSS/JS snippet to embed a chat bubble on any external website.
    - The chat bubble launches the chatbot in an iframe, pointing to the `/chatbot/[id]` page.

## 3. System Architecture & Technology

- **Framework**: **Next.js** with **App Router**.
- **Language**: **TypeScript**.
- **UI Components**: **ShadCN UI** library, styled with **Tailwind CSS**.
- **State Management**: React Context (`AuthContext`) for authentication state, supplemented by `useState` and `useEffect` for component-level state.
- **Backend Logic**: **Next.js Server Actions** (`src/app/actions.ts`) are used for all server-side logic, eliminating the need for traditional REST API endpoints.
- **Database**: **Cloud Firestore** for all data storage, including user profiles, chatbot configurations, chat logs, and leads.
- **Authentication**: **Firebase Authentication** for user sign-up and login.
- **File Storage**: **Firebase Storage** for user-uploaded files (logos, icons, avatars).
- **AI/Generative AI**: **Genkit** is the framework used to define and manage AI flows.
    - **Model**: **Google Gemini 1.5 Flash** is used for all text generation, summarization, and conversational AI tasks.
- **Deployment**: The project is configured for deployment on Firebase App Hosting.

## 4. Key Data Flows

### 4.1. User Authentication Flow

1.  **Sign-up (`/signup`)**:
    - A new user fills out the form.
    - A Firebase Auth user is created.
    - A corresponding document is created in the `users` collection in Firestore with `status: 'pending'` and `role: 'user'`.
    - The user is logged out and redirected to the login page with a message that their account needs approval.
2.  **Admin Approval (`/admin/dashboard`)**:
    - The admin logs in and sees the pending user.
    - The admin changes the user's status from "pending" to "active".
3.  **Login (`/`)**:
    - The user enters their credentials.
    - Firebase Auth verifies them.
    - The app fetches the user document from Firestore to check the `status`.
    - If `status` is "active", the login is successful. The user is redirected to `/dashboard` or `/admin/dashboard` based on their `role`.
    - If `status` is "pending" or "banned", login is denied, and a relevant message is shown.

### 4.2. Chat Interaction Flow

1.  **Initiation**: An end-user opens the chatbot on an embedded site or in the dashboard preview.
2.  **Greeting**: The chatbot loads the owner's configuration from the `users/{userId}` document and displays the custom greeting message.
3.  **User Input**: The end-user clicks a scripted question or types a free-form message.
4.  **AI Response Logic (`getAIResponse` server action)**:
    - The user's query and the chatbot owner's `userId` are sent to the server.
    - The action retrieves all of that user's knowledge:
        - `knowledgeBase` (general info from their profile).
        - `scenario` (the Q&A pairs).
        - `knowledgeSources` (manual and URL-imported documents).
    - All knowledge is compiled into a single context string.
    - This context and the user's query are passed to the `intelligentAIResponseFlow`.
    - The Genkit flow sends the combined prompt to the Gemini model.
    - The model's response is returned to the client and displayed in the chat.
    - The entire conversation is saved to the `chats` collection in Firestore.

### 4.3. URL Ingestion Flow

1.  **User Action**: In the dashboard, the user navigates to `Knowledge -> Add Knowledge Source -> From URL` and enters a webpage URL.
2.  **Server Action (`ingestWebpageAction`)**:
    - The URL and `userId` are sent to the server.
    - The action calls the `ingestWebpage` wrapper function.
3.  **AI Flow (`webpage-ingestion-flow.ts`)**:
    - The server fetches the URL's HTML content using a browser-like `User-Agent` to minimize blocking.
    - `jsdom` is used to parse the HTML and extract clean text content.
    - The text is passed to the Gemini model with a prompt instructing it to generate a title and summary **in the original language of the text**.
    - The flow returns the generated `{ title, content }` object.
4.  **UI Update**: The returned title and content auto-populate the form fields on the "Manual" tab, where the user can review, edit, and save the new knowledge source.

## 5. Firestore Data Model

- **`users/{userId}`**: Stores all data related to a single user/chatbot owner.
    - `email`, `displayName`, `phoneNumber`, `avatarUrl`
    - `role`: 'admin' | 'user'
    - `status`: 'active' | 'pending' | 'banned'
    - `geminiApiKey`: Optional user-provided API key.
    - `canManageApiKey`: Boolean permission set by admin.
    - `customization`: Object containing appearance settings (colors, logo, etc.).
    - `knowledgeBase`: String for general "About" text.
    - `scenario`: Array of `ScenarioItem` objects for the scripted flow.
    - `knowledgeSources`: Array of `KnowledgeSource` objects.

- **`chats/{chatId}`**: Stores a single conversation session.
    - `chatbotId`: `userId` of the chatbot owner.
    - `createdAt`: Timestamp when the chat started.
    - `messages`: Array of `{ sender, text }` objects.
    - `flow`: The active AI flow in the chat (e.g., 'intelligent', 'leadCapture').

- **`leads/{leadId}`**: Stores a single lead collected by the chatbot.
    - `chatbotId`: `userId` of the chatbot owner.
    - `chatId`: The `chatId` where the lead was collected.
    - `customerName`, `phoneNumber`, `needs`
    - `status`: 'waiting' | 'consulted'
    - `createdAt`: Timestamp.

- **`monthlyUsage/{usageId}`**: Stores aggregated monthly AI usage for each user (Managed by a separate process, but queried by the admin dashboard).
    - `userId`, `monthYear`, `totalTokens`, `chatRequests`, etc.
