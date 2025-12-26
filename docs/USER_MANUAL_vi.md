
# Hướng dẫn sử dụng Hệ thống OmniChat

Chào mừng bạn đến với OmniChat! Tài liệu này sẽ hướng dẫn bạn cách sử dụng các tính năng của hệ thống một cách hiệu quả nhất, dù bạn là Quản trị viên (Admin) hay Người dùng (User).

## Mục lục
1.  [Giới thiệu](#1-giới-thiệu)
2.  [Bắt đầu](#2-bắt-đầu)
    *   [Đăng ký tài khoản](#đăng-ký-tài-khoản)
    *   [Đăng nhập](#đăng-nhập)
3.  [Dành cho Người dùng (Chủ sở hữu Chatbot)](#3-dành-cho-người-dùng-chủ-sở-hữu-chatbot)
    *   [Tổng quan Bảng điều khiển (Dashboard)](#tổng-quan-bảng-điều-khiển-dashboard)
    *   [Cấu hình Chatbot (Tab Configuration)](#cấu-hình-chatbot-tab-configuration)
    *   [Quản lý Khách hàng Tiềm năng (Tab Leads)](#quản-lý-khách-hàng-tiềm-năng-tab-leads)
    *   [Nhúng Chatbot lên Website (Tab Embed)](#nhúng-chatbot-lên-website-tab-embed)
    *   [Quản lý Hồ sơ cá nhân (Trang Profile)](#quản-lý-hồ-sơ-cá-nhân-trang-profile)
4.  [Dành cho Quản trị viên (Admin)](#4-dành-cho-quản-trị-viên-admin)
    *   [Tổng quan Bảng điều khiển Admin](#tổng-quan-bảng-điều-khiển-admin)
    *   [Quản lý người dùng](#quản-lý-người-dùng)

---

## 1. Giới thiệu

OmniChat là một nền tảng cho phép bạn tạo, tùy chỉnh và triển khai chatbot AI trên trang web của mình. Chatbot có thể trả lời câu hỏi của khách hàng dựa trên cơ sở tri thức bạn cung cấp và thu thập thông tin khách hàng tiềm năng một cách tự động.

## 2. Bắt đầu

### Đăng ký tài khoản
1.  Truy cập trang `/signup`.
2.  Điền các thông tin cần thiết: Tên hiển thị, Email, Số điện thoại, và Mật khẩu.
3.  Nhấn nút **Sign Up**.
4.  **Quan trọng**: Sau khi đăng ký, tài khoản của bạn sẽ ở trạng thái "Chờ phê duyệt". Bạn cần chờ Quản trị viên (Admin) kích hoạt tài khoản trước khi có thể đăng nhập.

### Đăng nhập
1.  Truy cập trang đăng nhập (trang chủ).
2.  Nhập Email và Mật khẩu đã đăng ký.
3.  Nhấn nút **Login**.
    *   Nếu tài khoản đã được Admin phê duyệt, bạn sẽ được chuyển đến Bảng điều khiển tương ứng với vai trò của mình.
    *   Nếu tài khoản chưa được phê duyệt hoặc đã bị khóa, hệ thống sẽ hiển thị thông báo.

## 3. Dành cho Người dùng (Chủ sở hữu Chatbot)

### Tổng quan Bảng điều khiển (Dashboard)
Sau khi đăng nhập, bạn sẽ thấy giao diện chính gồm 2 phần:
*   **Bên trái (Customization Panel):** Nơi bạn thiết lập mọi thứ cho chatbot của mình.
*   **Bên phải (Chatbot Preview):** Nơi bạn có thể xem trước và trò chuyện thử với chatbot để kiểm tra các thay đổi.

### Cấu hình Chatbot (Tab Configuration)

Đây là khu vực chính để bạn "dạy" và tùy chỉnh chatbot.

#### Tab Appearance (Giao diện)
*   **General (Chung):**
    *   **Chatbot Display Name:** Tên chatbot sẽ hiển thị cho khách hàng.
    *   **Greeting Message:** Câu chào mừng đầu tiên khi khách hàng mở cửa sổ chat.
    *   **AI Persona:** Mô tả tính cách cho AI (ví dụ: "Bạn là một trợ lý ảo thân thiện và chuyên nghiệp"). Điều này ảnh hưởng đến văn phong của chatbot.
*   **Branding & Colors (Thương hiệu & Màu sắc):**
    *   Tùy chỉnh màu sắc chính, màu nền, màu nhấn cho cửa sổ chat.
    *   Tải lên **Logo** và **Chatbot Icon** (biểu tượng của chatbot trong cuộc trò chuyện).
*   **Lưu ý:** Sau khi thay đổi, nhấn nút **Save Appearance** để áp dụng.

#### Tab Scenario (Kịch bản)
Đây là nơi bạn tạo ra một luồng hội thoại có sẵn (giống như cây quyết định).
1.  Nhấn **Add Root Question** để thêm một câu hỏi gốc (câu hỏi đầu tiên khách hàng có thể chọn).
2.  Với mỗi câu hỏi, bạn cần nhập **câu trả lời** tương ứng.
3.  Để tạo các câu hỏi nối tiếp, nhấn **Add Follow-up Question** bên dưới một câu trả lời.
4.  Bạn có thể xóa bất kỳ câu hỏi nào bằng cách nhấn vào biểu tượng thùng rác.
5.  Sau khi hoàn tất, nhấn **Save Scenario** để lưu lại toàn bộ kịch bản.

#### Tab Knowledge (Cơ sở tri thức)
Đây là nơi bạn cung cấp kiến thức để AI có thể trả lời các câu hỏi không có trong kịch bản.
1.  Nhấn **Add Knowledge Source**. Một hộp thoại sẽ hiện ra.
2.  Bạn có 2 cách để thêm kiến thức:
    *   **Tab Manual (Thủ công):**
        *   **Title:** Nhập tiêu đề cho nguồn kiến thức (ví dụ: "Chính sách bảo hành").
        *   **Content:** Nhập nội dung chi tiết. Bạn có thể sử dụng định dạng Markdown để văn bản đẹp hơn.
    *   **Tab From URL:**
        *   Dán một đường link (URL) của một trang web vào ô.
        *   Nhấn **Generate Content**. AI sẽ tự động đọc trang web đó, tạo ra **Title** và **Content** tóm tắt.
        *   Sau khi AI tạo xong, hệ thống sẽ chuyển bạn về tab **Manual** để bạn xem lại, chỉnh sửa nếu cần và lưu lại.
3.  Nhấn **Save Source** để hoàn tất.

#### Tab History (Lịch sử)
Xem lại lịch sử các cuộc trò chuyện giữa khách hàng và chatbot của bạn.

### Quản lý Khách hàng Tiềm năng (Tab Leads)
1.  Điều hướng đến trang **Leads** từ thanh menu bên trái.
2.  Trang này hiển thị một bảng danh sách tất cả các khách hàng đã để lại thông tin (tên, số điện thoại, nhu cầu) qua chatbot.
3.  Bạn có thể tìm kiếm và lọc khách hàng theo trạng thái.
4.  Thay đổi trạng thái của một lead từ "Waiting" (Đang chờ) sang "Consulted" (Đã tư vấn) bằng cách gạt công tắc tương ứng.

### Nhúng Chatbot lên Website (Tab Embed)
1.  Điều hướng đến trang **Embed**.
2.  Trang này cung cấp các đoạn mã (HTML, CSS, JS) để bạn chèn vào website của mình.
3.  Làm theo hướng dẫn 3 bước:
    *   **Step 1:** Chép mã CSS vào file stylesheet của bạn.
    *   **Step 2:** Chép mã HTML vào trước thẻ đóng `</body>`.
    *   **Step 3:** Chép mã JavaScript vào ngay sau đoạn mã HTML ở bước 2.
4.  Trang cũng cung cấp một file HTML mẫu hoàn chỉnh để bạn dễ dàng thử nghiệm.

### Quản lý Hồ sơ cá nhân (Trang Profile)
*   **Cập nhật thông tin:** Thay đổi Tên hiển thị, Số điện thoại, và ảnh đại diện (Avatar).
*   **About / General Information:** Đây là một nguồn kiến thức chung quan trọng cho AI (tương tự như một Knowledge Source). Hãy điền thông tin giới thiệu về công ty hoặc sản phẩm của bạn ở đây.
*   **Gemini API Key:** Nếu được Admin cho phép, bạn có thể tự cung cấp khóa API Gemini của riêng mình để chatbot sử dụng.
*   **Đổi mật khẩu:** Nhấn nút để nhận email hướng dẫn đặt lại mật khẩu.
*   Nhấn **Save Changes** để lưu lại tất cả các thay đổi.

---

## 4. Dành cho Quản trị viên (Admin)

### Tổng quan Bảng điều khiển Admin
Sau khi đăng nhập với tài khoản Admin, bạn sẽ được chuyển đến trang quản lý người dùng.
*   Giao diện hiển thị các thẻ thống kê nhanh về số lượng người dùng, trạng thái tài khoản, v.v.
*   Bên dưới là bảng danh sách chi tiết tất cả người dùng trong hệ thống.

### Quản lý người dùng
Trong bảng danh sách người dùng, bạn có thể thực hiện các hành động sau cho mỗi tài khoản:
*   **Thay đổi vai trò (Role):** Chuyển đổi một tài khoản giữa "Admin" và "User".
*   **Thay đổi trạng thái (Status):**
    *   **Pending:** Tài khoản mới đăng ký, đang chờ duyệt.
    *   **Active:** Kích hoạt tài khoản, cho phép người dùng đăng nhập.
    *   **Banned:** Khóa tài khoản, không cho phép đăng nhập.
*   **Quản lý quyền API Key:** Bật/tắt quyền cho phép người dùng tự quản lý khóa Gemini API của họ.
*   **Xem chỉ số sử dụng:** Theo dõi tổng số tokens và số lượng yêu cầu AI mà người dùng đã sử dụng trong tháng.
*   **Các hành động khác:**
    *   **Manage API Key:** Trực tiếp thêm, sửa hoặc xóa API key cho người dùng.
    *   **Reset Password:** Gửi email đặt lại mật khẩu cho người dùng.
    *   **Delete:** Xóa bản ghi của người dùng khỏi cơ sở dữ liệu Firestore (lưu ý: hành động này không xóa tài khoản khỏi hệ thống xác thực Firebase).
