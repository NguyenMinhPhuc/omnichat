# Sơ đồ Hệ thống OmniChat

Tài liệu này mô tả kiến trúc kỹ thuật, các tính năng và luồng dữ liệu của ứng dụng OmniChat.

## 1. Tổng quan

OmniChat là một nền tảng chatbot AI đa người dùng (multi-tenant) được xây dựng với Next.js và Firebase. Nó cho phép người dùng đã đăng ký (chủ doanh nghiệp) tạo, tùy chỉnh và triển khai các chatbot được hỗ trợ bởi AI trên trang web của riêng họ. Hệ thống bao gồm một bảng quản trị toàn diện để quản lý người dùng và một bảng điều khiển dành cho người dùng để cấu hình chatbot.

## 2. Các tính năng cốt lõi

- **Quản lý Người dùng & Vai trò**:
    - **Vai trò Admin**: Quản lý tất cả người dùng, có thể phê duyệt đăng ký mới, thay đổi vai trò/trạng thái người dùng và quản lý khóa API của người dùng.
    - **Vai trò User**: Quản lý chatbot, hồ sơ và các khách hàng tiềm năng (leads) đã thu thập của chính họ.
    - **Hệ thống Phê duyệt Đăng ký**: Người dùng mới sẽ ở trạng thái "chờ xử lý" (pending) và phải được quản trị viên phê duyệt trước khi có thể đăng nhập.

- **Cấu hình Chatbot (Bảng điều khiển người dùng)**:
    - **Giao diện**: Tùy chỉnh màu sắc, tên chatbot, logo và biểu tượng.
    - **Hành vi**: Xác định tính cách (persona) của AI và tin nhắn chào mừng ban đầu.
    - **Kịch bản (Luồng có kịch bản)**: Một trình chỉnh sửa dạng cây để tạo ra các luồng hội thoại có hướng dẫn theo dạng câu hỏi-câu trả lời.
    - **Cơ sở Tri thức**: Người dùng có thể thêm kiến thức phi cấu trúc từ hai nguồn:
        1.  **Nhập thủ công**: Trực tiếp viết hoặc dán nội dung (hỗ trợ Markdown).
        2.  **Từ URL**: Dán một URL trang web, và một luồng AI sẽ tự động trích xuất và tóm tắt nội dung thành một nguồn kiến thức mới.

- **Luồng Thu thập Khách hàng tiềm năng (Lead)**:
    - Người dùng cuối có thể bắt đầu luồng "Nhận tư vấn" ngay trong cuộc trò chuyện.
    - Một tác nhân AI sẽ tiếp quản để thu thập thông tin tên, nhu cầu và số điện thoại của người dùng cuối một cách tự nhiên qua hội thoại.
    - Các khách hàng tiềm năng được lưu trữ trong Firestore và có thể xem được trong bảng điều khiển "Quản lý Leads" của người dùng.

- **Quản lý Leads**:
    - Người dùng có thể xem một bảng danh sách tất cả các lead được chatbot của họ thu thập.
    - Họ có thể theo dõi và cập nhật trạng thái của mỗi lead (ví dụ: từ "Đang chờ" sang "Đã tư vấn").

- **Bảng điều khiển Admin**:
    - Một bảng điều khiển tập trung cho quản trị viên để xem và quản lý toàn bộ cơ sở người dùng.
    - Các hành động chính bao gồm phê duyệt/cấm người dùng, thay đổi vai trò và quản lý quyền sử dụng khóa API.
    - Hiển thị các chỉ số sử dụng AI hàng tháng của từng người dùng (số tokens, số yêu cầu).

- **Chatbot có thể nhúng**:
    - Người dùng được cung cấp một đoạn mã HTML/CSS/JS đơn giản để nhúng một bong bóng chat lên bất kỳ trang web bên ngoài nào.
    - Bong bóng chat sẽ khởi chạy chatbot trong một iframe, trỏ đến trang `/chatbot/[id]`.

## 3. Kiến trúc Hệ thống & Công nghệ

- **Framework**: **Next.js** với **App Router**.
- **Ngôn ngữ**: **TypeScript**.
- **Thành phần UI**: Thư viện **ShadCN UI**, tạo kiểu với **Tailwind CSS**.
- **Quản lý Trạng thái**: React Context (`AuthContext`) cho trạng thái xác thực, bổ sung bằng `useState` và `useEffect` cho trạng thái ở cấp component.
- **Logic Backend**: **Next.js Server Actions** (`src/app/actions.ts`) được sử dụng cho tất cả logic phía máy chủ, loại bỏ nhu cầu về các API endpoint REST truyền thống.
- **Cơ sở dữ liệu**: **Cloud Firestore** cho tất cả việc lưu trữ dữ liệu, bao gồm hồ sơ người dùng, cấu hình chatbot, nhật ký trò chuyện và leads.
- **Xác thực**: **Firebase Authentication** cho việc đăng ký và đăng nhập của người dùng.
- **Lưu trữ Tệp**: **Firebase Storage** cho các tệp người dùng tải lên (logo, biểu tượng, ảnh đại diện).
- **AI/Generative AI**: **Genkit** là framework được sử dụng để định nghĩa và quản lý các luồng AI.
    - **Mô hình**: **Google Gemini 1.5 Flash** được sử dụng cho tất cả các tác vụ tạo văn bản, tóm tắt và hội thoại AI.
- **Triển khai**: Dự án được cấu hình để triển khai trên Firebase App Hosting.

## 4. Các Luồng Dữ liệu Chính

### 4.1. Luồng Xác thực Người dùng

1.  **Đăng ký (`/signup`)**:
    - Người dùng mới điền vào biểu mẫu.
    - Một người dùng Firebase Auth được tạo.
    - Một tài liệu tương ứng được tạo trong collection `users` trong Firestore với `status: 'pending'` và `role: 'user'`.
    - Người dùng bị đăng xuất và chuyển hướng đến trang đăng nhập với thông báo rằng tài khoản của họ cần được phê duyệt.
2.  **Admin Phê duyệt (`/admin/dashboard`)**:
    - Admin đăng nhập và thấy người dùng đang chờ xử lý.
    - Admin thay đổi trạng thái của người dùng từ "pending" thành "active".
3.  **Đăng nhập (`/`)**:
    - Người dùng nhập thông tin đăng nhập.
    - Firebase Auth xác minh chúng.
    - Ứng dụng lấy tài liệu người dùng từ Firestore để kiểm tra `status`.
    - Nếu `status` là "active", đăng nhập thành công. Người dùng được chuyển hướng đến `/dashboard` hoặc `/admin/dashboard` dựa trên `role` của họ.
    - Nếu `status` là "pending" hoặc "banned", đăng nhập bị từ chối và một thông báo liên quan được hiển thị.

### 4.2. Luồng Tương tác Chat

1.  **Khởi tạo**: Người dùng cuối mở chatbot trên một trang web đã nhúng hoặc trong phần xem trước trên bảng điều khiển.
2.  **Chào mừng**: Chatbot tải cấu hình của chủ sở hữu từ tài liệu `users/{userId}` và hiển thị tin nhắn chào mừng tùy chỉnh.
3.  **Đầu vào của Người dùng**: Người dùng cuối nhấp vào một câu hỏi trong kịch bản hoặc gõ một tin nhắn tự do.
4.  **Logic Phản hồi AI (server action `getAIResponse`)**:
    - Truy vấn của người dùng và `userId` của chủ chatbot được gửi đến máy chủ.
    - Action này lấy tất cả kiến thức của người dùng đó:
        - `knowledgeBase` (thông tin chung từ hồ sơ của họ).
        - `scenario` (các cặp Hỏi & Đáp).
        - `knowledgeSources` (các tài liệu nhập thủ công và từ URL).
    - Tất cả kiến thức được tổng hợp thành một chuỗi ngữ cảnh duy nhất.
    - Ngữ cảnh này và truy vấn của người dùng được chuyển đến luồng `intelligentAIResponseFlow`.
    - Luồng Genkit gửi prompt đã kết hợp đến mô hình Gemini.
    - Phản hồi của mô hình được trả về cho client và hiển thị trong cuộc trò chuyện.
    - Toàn bộ cuộc hội thoại được lưu vào collection `chats` trong Firestore.

### 4.3. Luồng Nhập dữ liệu từ URL

1.  **Hành động của Người dùng**: Trong bảng điều khiển, người dùng điều hướng đến `Knowledge -> Add Knowledge Source -> From URL` và nhập một URL trang web.
2.  **Server Action (`ingestWebpageAction`)**:
    - URL và `userId` được gửi đến máy chủ.
    - Action này gọi hàm bao (wrapper) `ingestWebpage`.
3.  **Luồng AI (`webpage-ingestion-flow.ts`)**:
    - Máy chủ tìm nạp nội dung HTML của URL bằng `User-Agent` giống như của trình duyệt để giảm thiểu việc bị chặn.
    - `jsdom` được sử dụng để phân tích HTML và trích xuất nội dung văn bản sạch.
    - Văn bản được chuyển đến mô hình Gemini với một prompt hướng dẫn nó tạo ra một tiêu đề và tóm tắt **bằng ngôn ngữ gốc của văn bản**.
    - Luồng trả về đối tượng `{ title, content }` đã được tạo ra.
4.  **Cập nhật UI**: Tiêu đề và nội dung trả về sẽ tự động điền vào các trường biểu mẫu của tab "Manual", nơi người dùng có thể xem lại, chỉnh sửa và lưu nguồn kiến thức mới.

## 5. Mô hình Dữ liệu Firestore

- **`users/{userId}`**: Lưu trữ tất cả dữ liệu liên quan đến một người dùng/chủ sở hữu chatbot.
    - `email`, `displayName`, `phoneNumber`, `avatarUrl`
    - `role`: 'admin' | 'user'
    - `status`: 'active' | 'pending' | 'banned'
    - `geminiApiKey`: Khóa API tùy chọn do người dùng cung cấp.
    - `canManageApiKey`: Quyền boolean do admin thiết lập.
    - `customization`: Đối tượng chứa các cài đặt giao diện (màu sắc, logo, v.v.).
    - `knowledgeBase`: Chuỗi cho văn bản "Giới thiệu" chung.
    - `scenario`: Mảng các đối tượng `ScenarioItem` cho luồng theo kịch bản.
    - `knowledgeSources`: Mảng các đối tượng `KnowledgeSource`.

- **`chats/{chatId}`**: Lưu trữ một phiên hội thoại duy nhất.
    - `chatbotId`: `userId` của chủ sở hữu chatbot.
    - `createdAt`: Dấu thời gian khi cuộc trò chuyện bắt đầu.
    - `messages`: Mảng các đối tượng `{ sender, text }`.
    - `flow`: Luồng AI đang hoạt động trong cuộc trò chuyện (ví dụ: 'intelligent', 'leadCapture').

- **`leads/{leadId}`**: Lưu trữ một khách hàng tiềm năng duy nhất do chatbot thu thập.
    - `chatbotId`: `userId` của chủ sở hữu chatbot.
    - `chatId`: `chatId` nơi lead được thu thập.
    - `customerName`, `phoneNumber`, `needs`
    - `status`: 'waiting' | 'consulted'
    - `createdAt`: Dấu thời gian.

- **`monthlyUsage/{usageId}`**: Lưu trữ tổng hợp việc sử dụng AI hàng tháng cho mỗi người dùng (Được quản lý bởi một quy trình riêng, nhưng được truy vấn bởi bảng điều khiển admin).
    - `userId`, `monthYear`, `totalTokens`, `chatRequests`, v.v.
