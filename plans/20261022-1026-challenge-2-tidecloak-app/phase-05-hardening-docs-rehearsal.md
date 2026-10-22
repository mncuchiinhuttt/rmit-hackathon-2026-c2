# Phase 05: Hardening, docs, an toàn nộp (xen kẽ với phase 03/04)

## Context Links

- `research/researcher-04-raziel-build-path.md` §8; `.cache/raziel/templates/templates/shared/tide-doctor.sh`; `reports/red-team-review.md`
- `~/.agents/AGENTS.md` (docs roadmap/changelog/architecture, review sau khi code)

## Overview

- Priority: P1 · Status: Pending · rải từ 15:15 đến 16:45 · mọi workstream
- Làm các việc **không nằm trên đường găng** ngay khi có chỗ trống, **mở đường công khai sớm (15:45)** để lỗi cuối giờ không làm mất bài, và đóng băng đúng 16:15.

## Key Insights

- Bài nộp chỉ cần URL repo public: **publish + gửi form baseline lúc ~15:45** (sau rà bí mật), rồi tiếp tục cải thiện; chỉ rủi ro nếu form không cho sửa nội dung, nhưng URL không đổi nên an toàn.
- Rà bí mật phải gồm **lịch sử git** và các thư mục `plans/`, `research/`, `docs/` (sẽ public): trong repo có `.cache/` (ignored) và log lệnh; mật khẩu dev `password` là mặc định công khai của Tide, TideCloak bind `127.0.0.1`. Nếu thấy email licence/invite link/token trong lịch sử: viết lại lịch sử trước khi public hoặc xuất repo sạch.
- Ổ 97% đầy: kiểm dung lượng **trước** clone sạch/build/quay; chuyển quay 720p nếu < 3 GB trống.
- Chỉ test logic thuần có thể hỏng thật (store ghi nguyên tử, parse policy). Không test wiring/UI/mock. Token-bucket/idempotency chỉ làm nếu dư giờ.

## Requirements

- Không `.env`, `tidecloak.json`, mật khẩu, email licence, token, invite link, ciphertext thật trong git (cả lịch sử); `/spike` đã xóa; file mp4 < 100 MB.
- Tài liệu: `docs/setup-tidecloak.md` (đã có từ phase 01 + số đo), `docs/system-architecture.md` (sơ đồ phase 02, proof matrix, giới hạn, đánh đổi), `docs/project-changelog.md` và `docs/development-roadmap.md` (mỗi file ngắn).

## Architecture

Không thêm thành phần. Rà ranh giới tin cậy so với code thật; sửa tài liệu theo code, không sửa code cho khớp tài liệu. Giới hạn bắt buộc có trong docs/README: client code chân thực; quorum thông đồng; không ràng buộc nội dung giao dịch; tiền/escrow mock; hành vi master-admin chưa tuyên bố (hoặc kết quả H-op nếu đã đo).

## Related Code Files

- Xóa: `src/app/spike/page.tsx`, mock/TODO còn sót (**chỉ sau khi** UI thật đã chạy lại trọn luồng một lần trên bản ghi hình)
- Tạo: `docs/system-architecture.md`, `docs/project-changelog.md`, `docs/development-roadmap.md`, (tùy) `src/lib/store/json-store.test.ts`
- Sửa: `README.md` (overview ở đầu, Setup riêng, ảnh chụp, link video)

## Implementation Steps

1. **Ngay khi có chỗ trống (từ 15:15):** viết `docs/system-architecture.md` và README Setup từ các lệnh đã chạy (không viết từ trí nhớ).
2. `bun run build` (một lần, khi không có dev server nặng chạy) và `bun test` nếu có test; `tide-doctor.sh --url http://localhost:3000` đến `RESULT: OK`; kiểm 401/403/200; thử body > giới hạn.
3. **Rà bí mật 15:30:** `git log -p --all | grep -nIE '(TIDE_LICENSE|@gmail|@rmit|invite|get-required-action-link|Bearer )'` (đọc tay), `git ls-files` toàn bộ, `git check-ignore -v .env data/tidecloak.json .cache`; không file > 50 MB trừ video. Review code bằng agent reviewer một lượt, sửa mục cao.
4. **15:45 publish + form baseline** (xem phase 06 bước 6–8): README overview đã đúng số đo tại thời điểm đó, kể cả khi video chưa có (video thay sau).
5. **16:15 đóng băng.** Xóa `/spike` sau khi quay thử trên UI thật; commit.
6. Chạy **một** lượt tổng duyệt trên c3 theo storyboard (không phải hai); bấm giờ; ghi điểm vấp. Đã có footage dự phòng từ phase 03.
7. Đếm lại README overview bằng script (≤ 300 từ); chỉ giữ câu đúng với số đo.

## Todo List

- [ ] Architecture + Setup viết từ lệnh thật
- [ ] build/test/doctor xanh
- [ ] Rà bí mật + lịch sử git sạch
- [ ] Publish + form baseline 15:45
- [ ] `/spike` đã xóa sau khi UI thật chạy trọn luồng
- [ ] README overview ≤ 300 từ

## Success Criteria

- Người ngoài mở repo public thấy README đúng template; clone sạch + `bun install` + `bun run build` thành công; không bí mật trong lịch sử; form đã gửi trước 16:00.

## Risk Assessment

- Lộ bí mật lúc public: rà lịch sử trước 15:45; nếu có, viết lại lịch sử hoặc xuất repo sạch (cho phép mất tối đa 20 phút, đã tính trong cửa sổ).
- Lỗi build muộn: giữ `main` luôn build được; sửa trên nhánh, merge khi xanh.
- Máy quá tải: không chạy build + dev + quay cùng lúc.

## Security Considerations

- OWASP rút gọn: CSP (nêu rõ giới hạn), DPoP, validate input/size, không log bí mật, lỗi không lộ stack. Repo public: không chứa email, token, invite, mật khẩu thật, dữ liệu thật.

## Next Steps

Phase 06 quay từ bản đã đóng băng.
