# Voiceover translation and timing

## 0:00–0:25 — The possibility

Chúng tôi xây dựng Hostless Hui: một nhóm tiết kiệm xoay vòng, nơi vận hành ứng dụng không tự động cho phép một người đọc mã giải ngân. Các thành viên cùng góp quỹ, và lượt nhận thay đổi theo kỳ. Chúng tôi tách ba quyền: vận hành nền tảng, duyệt quyền truy cập, và nhận khoản giải ngân.

## 0:25–0:50 — The constraint

Trong ứng dụng thông thường, người kiểm soát máy chủ thường có thể sửa quyền hoặc xem dữ liệu bí mật được lưu trữ. Màn hình đăng nhập không loại bỏ quyền lực đó. Với nhóm hụi, câu hỏi là: nhóm có thể duyệt quyền truy cập mà không giao mọi quyết định cho một chủ hụi hay không?

## 0:50–1:40 — The prototype

Bản mẫu hoạt động này dùng danh tính và quản trị được ghi rõ là mô phỏng. Bảo nhận kỳ bốn. Operator thử mở và bị từ chối. Xin quyền tạo một đề xuất pending, chưa cấp quyền. Hạnh duyệt một lần; quyền đọc vẫn bị chặn. Tuấn duyệt độc lập thì thay đổi mới committed. Operator đọc được gói mẫu nhưng không được redeem lượt của Bảo. Chỉ người nhận theo lịch được redeem một lần. TideCloak là lớp bảo vệ mật mã dự kiến: policy ký cho từng record và giải mã qua ORK sẽ thực thi quyền bên ngoài máy chủ ứng dụng. Mã tích hợp đã có, nhưng mã hóa, giải mã và quorum thật vẫn cần kiểm chứng.

## 1:40–2:00 — What changes

Điều trở nên khả thi là nhóm chia sẻ quyền giám sát mà không trao toàn quyền lâu dài cho một người vận hành. Quyền truy cập xoay vòng, việc duyệt được nhìn thấy, và gia hạn hoặc thu hồi cần được xem xét. Bản mẫu mô hình hóa quyền đọc, không giữ tiền thật. Bằng chứng mật mã Tide thật là bước nghiệm thu tiếp theo.
