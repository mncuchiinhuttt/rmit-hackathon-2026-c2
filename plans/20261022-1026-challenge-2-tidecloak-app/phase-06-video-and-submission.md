# Phase 06: Video và nộp bài

## Context Links

- Đề: https://tide.org/unlocked/#submit (video 2 phút, `.mp4` trong repo, < 100 MB; repo **public**; form https://forms.gle/HRHYjnqB86j1LFS97)
- `phase-00-idea-story-and-gates.md` (storyboard, README), `phase-05-hardening-docs-rehearsal.md` (public sớm)

## Overview

- Priority: P1 · Status: Pending · 16:45–17:45 (hạn chính thức 18:00 giờ VN)
- Quay lại bản chất lượng, nén, commit; README final; đổi chắc chắn repo public; gửi form (nếu chưa gửi baseline lúc 15:45 thì gửi ngay bây giờ).

## Key Insights

- Giám khảo chấm từ README overview + video. Bài test "ordinary login" phải được trả lời **trong video** bằng cảnh ORK từ chối thật (steward, Minh, người thắng chu kỳ trước) và cảnh "một phiếu chưa đủ, phiếu hai commit".
- Cấu trúc video của đề: possibility → constraint → prototype (vai trò TideCloak) → what changes. Kịch bản ở phase 00.
- Repo hiện **private**; form đòi **public**. Quy trình: publish sớm (15:45) rồi cập nhật; phần này chỉ **thay video/README bản cuối**.
- Footage dự phòng đã quay ở phase 03; video cuối là bản thay thế, không phải bản đầu tiên.
- GitHub chặn file > 100 MB; `ffmpeg` có ở `/usr/local/bin`; 2 phút 1080p H.264 CRF 26 thường 20–40 MB.

## Requirements

- Video 2:00 ± 5 s, voiceover EN (phụ đề nếu kịp), `.mp4` < 100 MB, `demo.mp4` ở gốc repo, link từ README.
- README: overview đầu file đúng template (badge + 5 prompt) ≤ 300 từ; Setup riêng; ảnh chụp; giới hạn thật.
- Form: group name (đã xác nhận ở phase 00), email đội, URL repo; người gửi chính + dự phòng đã chốt.

## Architecture

Không có thành phần mới. Luồng: bản baseline đã public + form đã gửi (15:45) ⇒ video cuối thay thế ⇒ kiểm như người ngoài ⇒ chụp xác nhận.

## Related Code Files

- Tạo: `demo.mp4`, `demo/script.md` (lời + cảnh + giờ), `demo/checklist.md`
- Sửa: `README.md`

## Implementation Steps

1. **16:45** chuẩn bị quay: kiểm ổ ≥ 3 GB trống; đóng ứng dụng thừa; Do Not Disturb; 1280×720 (hoặc 1920×1080 nếu máy chịu được); popup enclave đã cho phép; đăng nhập sẵn các vai ở profile riêng; **c3 đã niêm phong, c4 dự phòng**; footage dự phòng nằm sẵn.
2. Quay theo `demo/script.md`, từng cảnh một take; cắt phần chờ propagation (≤ 120 s) và chú thích "~90 s later" trên màn hình để trung thực. Nếu ORK/mạng sập: dùng footage dự phòng và ghi rõ nếu là bản ghi lại.
3. Dựng + nén: `ffmpeg -i raw.mov -vf scale=1280:-2 -c:v libx264 -crf 26 -preset medium -c:a aac -b:a 128k -movflags +faststart demo.mp4`; `ffprobe` thời lượng ≈ 120 s; `ls -lh` < 100 MB; nghe lại toàn bộ.
4. README final: overview đúng số đo; đếm từ ≤ 300; link `demo.mp4`; ảnh chụp.
5. Commit + push; `git status` sạch; rà bí mật lần cuối trên diff (phase 05 bước 3).
6. **Xác nhận repo public** (người dùng quyết, không hoàn tác được): `gh repo edit mncuchiinhuttt/rmit-hackathon-2026-c2 --visibility public --accept-visibility-change-consequences` (đã làm ở 15:45 thì chỉ kiểm lại).
7. Kiểm như người ngoài: `curl -sI https://github.com/mncuchiinhuttt/rmit-hackathon-2026-c2` (200 không login), mở README + phát video trên GitHub, clone sạch vào `/tmp` rồi `bun install`.
8. **Form:** người gửi chính điền group name, email, URL repo; không nhập mật khẩu; chụp màn hình xác nhận (lưu ngoài repo nếu có email). Dự phòng: người thứ hai gửi nếu người chính vắng.
9. **17:30** form phải xong; 17:45 hạn nội bộ; không thêm tính năng sau 16:45.

## Todo List

- [ ] Kịch bản + checklist quay
- [ ] Video cuối quay, nén, < 100 MB, ≈ 2:00
- [ ] README final, đếm từ ≤ 300
- [ ] Repo public, kiểm ẩn danh
- [ ] Form đã gửi + ảnh xác nhận (≤ 17:30)

## Success Criteria

- Người ngoài mở repo thấy README đúng template, phát được `demo.mp4`, chạy được Setup; form đã gửi trước 17:30.

## Risk Assessment

- Video > 100 MB: tăng CRF 28–30 hoặc hạ 720p; không dùng Git LFS (đề yêu cầu file trong repo).
- Quay hỏng vì propagation/popup: quay c4 hoặc ghép take; nói trung thực trong lời.
- Quên public/README sai: đã làm sớm ở 15:45; bước 6–7 chỉ kiểm lại.
- ORK sập lúc quay: footage dự phòng có sẵn.

## Security Considerations

- Rà màn hình quay: không lộ email licence, invite link, mật khẩu, token, tab cá nhân. Form Google: không nhập mật khẩu. Repo public: chạy lại rà bí mật trên bản cuối.

## Next Steps

Sau khi nộp: giữ máy ở trạng thái quay được đến khi có thông báo; không sửa repo sau hạn trừ khi ban tổ chức cho phép.
