
import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

// Import flows to make them available
import '@/ai/flows/intelligent-ai-responses';
import '@/ai/flows/webpage-ingestion-flow';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Handle different genkit endpoints
        if (request.nextUrl.pathname.includes('/api/genkit/')) {
            return NextResponse.json({ message: 'Genkit endpoint active' });
        }

        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
