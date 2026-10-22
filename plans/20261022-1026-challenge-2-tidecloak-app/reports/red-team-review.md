# Red Team Review: Challenge 2 plan

Phiên 2026-10-22, 4 reviewer thù địch (Security, Failure Mode, Assumption + judge, Scope) đọc toàn bộ plan bản đầu. **34 phát hiện thô ⇒ 22 sau gộp: 6 Critical, 15 High, 1 Medium.** Disposition: 20 chấp nhận, 2 chấp nhận một phần, 0 bác. Plan đã được viết lại theo các phát hiện này.

Điểm nhìn của judge giả lập (reviewer Assumption), trên bản đầu: Vision 2/5, Trust 2/5, Value 2/5, Why TideCloak 3/5, Prototype 2/5 ⇒ 44/100, **là dự báo chưa phải đo đạc**; nguyên nhân chính: tiền không bị điều khiển bởi thao tác được bảo vệ, bypass quorum qua policy `User`, trùng cơ chế với ví dụ chính thức, nhiều tiền đề chưa kiểm chứng. Các sửa dưới đây nhắm trực tiếp vào các điểm rò điểm này.

| # | Phát hiện (gộp) | Mức | Reviewer | Disposition | Áp dụng vào |
|---|---|---|---|---|---|
| 1 | Bypass quorum: một steward ký policy `User` cho người đã giữ `_tide_decryptor`; fallback U2 vẫn cho phép | Critical | Sec, Ass | Chấp nhận | P01 (không seed `_tide_decryptor`), P03 (release CR cấp 2 role, thí nghiệm U2, tuyên bố theo số đo) |
| 2 | Bên niêm phong biết plaintext; tài liệu payout ≠ tiền; "không ai chuyển hướng được tiền" là quá lời | Critical | Sec, Ass | Chấp nhận | P00 (actor escrow partner, thu hẹp tuyên bố), P03 (escrow mock ràng buộc `sub` + `codeHash`) |
| 3 | Operator phát JS độc thì lấy được plaintext | High | Sec | Chấp nhận (giới hạn nêu rõ, không có fix 6 giờ) | P00 README, P05 docs, P02 security |
| 4 | Quorum chỉ ủy quyền cấp role, không ràng buộc nội dung/số tiền | High | Sec | Chấp nhận | P00 (từ ngữ), plan.md (giới hạn) |
| 5 | Cổng bí mật không soi lịch sử git; mật khẩu dev mặc định trong tài liệu | Medium | Sec | **Một phần:** thêm quét lịch sử + soát `plans/`; **không xoay mật khẩu** (mặc định dev công khai của Tide, bind 127.0.0.1) | P05, P00 |
| 6 | Fallback L0 self-encrypt không chia sẻ được; RA chỉ thử ở phase 3; fallback chưa kiểm chứng | Critical | Sec, Fail, Ass | Chấp nhận | P03 (G1.5 probe 13:50, Plan Z), plan.md |
| 7 | Chu kỳ/lần quay bị tiêu thụ trước khi quay; không có cách reset | Critical | Fail, Scope, Ass | Chấp nhận | P03 (ngân sách c1/c3/c4, dòng 10 tận dụng "người thắng cũ"), P05 (một lượt tổng duyệt) |
| 8 | Gate Bun 11:45 chạy trước adapter; xóa starter trước; đường B không có ngân sách | High | Fail, Scope, Ass | Chấp nhận | P02 (placeholder, adapter sớm, tag `starter-bun`, trần 60 phút), P01 (export sớm) |
| 9 | Flip multiAdmin tạo nút cổ chai người; thiếu đường cứu | High | Fail | Chấp nhận | P01 (flip có người chứng kiến, hạn 15 phút, đường cứu master-realm) |
| 10 | Đo ngưỡng = 1 vẫn "qua" G1; cần `REGEN_ADMIN_POLICY`, phiếu 1 không commit, phiếu 2 commit | High | Ass | Chấp nhận | P01 (bước 9–10), P03 (điều kiện G3) |
| 11 | Nhánh ít người vòng tròn; không có lịch một người | High | Fail, Scope | Chấp nhận | plan.md (nhân sự 1/2/4), P00 |
| 12 | Kiểm ổ đĩa/RAM quá muộn | High | Fail | Chấp nhận | P00 (dọn máy), P02, P05, P06 |
| 13 | Không có kế hoạch phục hồi trạng thái container | High | Fail | Chấp nhận (kiểm mount, cấm `container rm`, ghi chi phí bootstrap lại) | P01 |
| 14 | Phase hardening quá tải, "đệm 30 phút" không tồn tại | High | Fail, Scope | Chấp nhận | P05 (xen kẽ từ 15:15, một lượt tổng duyệt), plan.md |
| 15 | Footage dự phòng không ai quay | High | Fail, Scope | Chấp nhận | P03 bước 8, P06 |
| 16 | Public/form/thông tin nộp bị dồn cuối giờ | Critical | Fail, Scope | Chấp nhận | P00 (thu thông tin), P05/P06 (public + form baseline 15:45) |
| 17 | L2 chứa lời hứa cốt lõi; luật cắt mâu thuẫn | High | Scope | Chấp nhận | plan.md (B0 = lõi quorum, một hạn 15:15) |
| 18 | Hạ tầng generic (API, events, token-bucket, idempotency) trước khi chứng minh | High | Scope | Chấp nhận | P02 (tái dùng mẫu vault; hoãn các mục generic) |
| 19 | Tính năng L3 vẫn bắt buộc trong phase UI | High | Scope | Chấp nhận | P04 (danh sách cắt theo cấp, wireframe A cố định, không drawer) |
| 20 | Master token "chỉ đề xuất" mâu thuẫn tài liệu Tide (AP-G08, master-realm exempt) | Critical | Ass | Chấp nhận | P03 (bỏ master token khỏi runtime; thí nghiệm H-op; đề xuất/duyệt ở Console), P01 |
| 21 | Phép thử âm bị API chặn nên không chứng minh được ORK từ chối | High | Ass | Chấp nhận | P02/P03 (phục vụ policy cho mọi thành viên; dùng policy hợp lệ của người khác) |
| 22 | Khác biệt so với Guild Treasury/Dual-Control mỏng; không được gạt ví dụ chính thức là "không làm được" | High | Ass | **Một phần:** nêu 4 hành vi riêng của hụi và so cùng scope mock; điểm dự báo chỉ là đầu vào | P00 |

## Điều chưa sửa được trong 6 giờ (nói thẳng)

- Client code chân thực và quorum thông đồng là giới hạn của mô hình, không phải lỗi sửa được.
- Hành vi master-realm admin chưa biết trên build này; không tuyên bố gì cho đến khi thí nghiệm H-op có kết quả lặp lại.
- Ngưỡng quorum sống và việc ký policy cần mấy chữ ký là ẩn số tới khi đo (phase 01, 03); tuyên bố trong README bám số đo.
