
import fs from 'fs/promises';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import UserGuideLayout from '@/components/UserGuideLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function GuidePage() {
  // Read the markdown file from the project root
  const filePath = path.join(process.cwd(), 'USER_MANUAL_vi.md');
  let markdownContent = '';
  try {
      markdownContent = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
      console.error("Could not read user manual file:", error);
      markdownContent = '# Hướng dẫn sử dụng\n\nKhông thể tải tệp hướng dẫn sử dụng. Vui lòng liên hệ quản trị viên.';
  }

  return (
    <UserGuideLayout>
        <Card>
            <CardContent className="p-6">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                        {markdownContent}
                    </ReactMarkdown>
                </div>
            </CardContent>
        </Card>
    </UserGuideLayout>
  );
}
