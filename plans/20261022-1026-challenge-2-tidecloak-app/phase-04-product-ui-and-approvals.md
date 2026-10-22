# Phase 04: UI sản phẩm

## Context Links

- Skill `ui-ux`: `references/design-process.md` (nhánh U), `styles.md` (P3, P8 glass, P10 tối), `tailwind-v4-traps.md`, `components/*.md`, probe `~/.agents/skills/ui-ux/scripts/probe.mjs`; skill `aesthetic-taste-ui`.
- `.cache/raziel/canon/ux-states.md` (trạng thái UX của Tide).

## Overview

- Priority: P1 · Status: Pending · 13:40–16:15 (đóng băng 16:15) · Workstream **F**
- Một **màn hero có vai** (Circle) + modal mở + thanh trạng thái; dựng **trực tiếp trên scaffold** với dữ liệu seed, nối luồng thật khi phase 03 xong (~15:00). Không dựng bản mock riêng.

## Key Insights

- Sức thuyết phục là **tương phản**: "thành viên thấy gì" cạnh "nền tảng lưu gì". Khoảnh khắc **bị từ chối** phải thiết kế (đỏ + thông điệp contract + ai bị từ chối), không phải toast.
- Tránh "generic access-control dashboard": màn dẫn bằng vòng hụi, chu kỳ, người thắng, escrow; bảng quyền chỉ là bằng chứng.
- Phong cách **dark + glass** (áp P8 + P10). Bẫy: kính trên nền phẳng chỉ là card xám ⇒ luôn có radial glow; blur chỉ ≤ 4 vùng (header + card hero); `text-white/50` trên kính trượt tương phản ⇒ dùng token đã đo.
- Mỗi cấp có **danh sách cắt** (red team): B0 không có drawer duyệt, không i18n, không animation phức tạp, không cổng chọn wireframe.
- User requirement: use **shadcn/ui** for standard controls; compose product components from Button, Card, Dialog, Alert, Badge, Skeleton and Progress. Follow `AGENTS.md`: no emoji, no generic AI-template visuals, restrained gradients and visible keyboard focus. Install/configure only during UI implementation, not realm provisioning.

## Brief và việc chính (U1, U2 rút gọn)

Current audit: Bun 1.4 + React 19 starter; Tailwind/shadcn are not installed. Next 16 is a planned scaffold option, not current code. User requires dark/glass direction and shadcn/ui for future UI work.

| Màn | Đến để làm gì | Quyết định bằng | Hành động cuối |
|---|---|---|---|
| Circle (hero, wireframe A cố định) | Biết chu kỳ này trả ai, gói release đã niêm phong chưa, ai bị từ chối | trạng thái gói, số phiếu duyệt, vai đang đăng nhập | Thử mở / Mở / Redeem |
| Modal mở | Người thắng nhận mã | role đã vào token chưa (propagating) | Mở, Redeem escrow |

```
+----------------------------------+-----------------------------------+
| Bạn thấy gì (vai: Minh)          | Nền tảng lưu gì                   |
| Cycle 3 of 6 · pot 6,000,000 VND | payout-c3 · 412 B ciphertext      |
| (synthetic) · người nhận: Minh   | 9fA2..Qx   khóa giữ bởi: không ai |
| [SEALED] stage: Sealed>Proposed  | [Thử mở với tư cách steward] -> từ chối (ORK)
| >Approved>Unsealed   0/2 duyệt   | [Thử mở với tư cách Minh]     -> từ chối (ORK)
| [Mở Tide Console] [Mở] [Redeem]  | chu kỳ trước: Minh giữ role c1 -> c3 từ chối
+----------------------------------+-----------------------------------+
| Sổ sự kiện (từ CR thật): đề xuất . duyệt Hạnh . duyệt Tuấn . committed|
+----------------------------------------------------------------------+
```

Phương án B (stepper dọc) và C (tab theo vai) bị loại: video cần cảnh đối chiếu trong một khung hình; nêu lại nếu người dùng muốn đổi.

## Ngôn ngữ hình ảnh (token đã đo tương phản)

| Token | Giá trị | Tối thiểu đo được |
|---|---|---|
| `--page` / `--surface` / `--raised` | `#090a0f` / `#0d0f17` / `#141827` | không dùng `#000` |
| `--glass` | `rgba(255,255,255,.05–.12)`, viền `rgba(255,255,255,.08)`, `backdrop-blur-xl` | fallback `supports-[backdrop-filter]` |
| `--text` / `--text-2` / `--muted` | `#eef1f8` / `#aab3c8` / `#8b94ab` | ≥ 13,1 / ≥ 7,06 / ≥ 4,89 |
| trang trí (cấm cho chữ) | `#6f7891` | 3,37–4,49 |
| `--sealed` hổ phách | `#fbbf24` | ≥ 8,88 |
| `--approved` xanh ngọc | `#34d399` (chữ trên nút `#052e22` = 7,69) | ≥ 7,71 |
| `--refused` hồng | `#fb7185` | ≥ 5,51 |
| nút chính | nền `#f4f6fb`, chữ `#090a0f` | 18,29 |

Chữ Geist Variable + Geist Mono (ciphertext); icon `lucide-react`, **không emoji**; easing `cubic-bezier(0.16,1,0.3,1)`; `prefers-reduced-motion`. Font, glow, viền theo con trỏ là **B1**, bỏ được.

## Danh sách việc theo cấp

- **B0 (bắt buộc):** token + nền glow tối thiểu; màn Circle (A) với 2 khung; nút "thử mở" gọi ORK thật bằng policy hợp lệ của người khác; trạng thái refused/pending/propagating/committed/unsealed; modal mở + redeem; liên kết "Open Tide Console"; số liệu tiền ghi "synthetic".
- **B1:** đọc trạng thái CR và số phiếu bằng token của người dùng (chỉ đọc), thanh stage, probe 1280/375 sạch, ảnh chụp cho README.
- **B2 (chỉ nếu G3 xong trước 14:45):** đề xuất/duyệt trong app bằng token steward trực tiếp tới TideCloak (`POST …/approve {}` ⇒ `requestModel` ⇒ enclave ⇒ `POST … {requestModel}`), nhiều chu kỳ, i18n VI. **Không** để nút Approve không hoạt động nằm trong bản nộp.

## Related Code Files

- Tạo (F): `src/app/globals.css`, `src/app/page.tsx`, `src/components/{sealed-card,proof-panel,stage-stepper,unseal-dialog,refusal-banner}.tsx`
- Sửa: `src/app/layout.tsx` (nền, font)
- Dùng (B): `src/lib/tide/{seal,iga-read}.ts`, route payouts/policies/escrow

## Implementation Steps

1. Đọc `AGENTS.md` và `tailwind-v4-traps.md`; cấu hình shadcn/ui theo framework đã qua gate, tái dùng primitive và `cn()`, dựng token + nền (30').
2. Màn Circle A với dữ liệu seed (có ca biên: tên dài, số 9 chữ số, 0 phiếu) (60').
3. Probe 1280 và 375 bằng `probe.mjs`; sửa tới khi sạch (B1).
4. Nối thật từ ~15:00; chụp ảnh các trạng thái cho README.
5. **16:15 đóng băng.** Chỉ sửa lỗi.

## Todo List

- [ ] Token + nền
- [ ] Màn Circle A đủ trạng thái
- [ ] "Thử mở" gọi ORK thật
- [ ] Modal mở + redeem
- [ ] Probe sạch (B1) + ảnh chụp

## Success Criteria

- Người lạ hiểu "gói bị khóa, ai bị từ chối, ai duyệt, ai mở" trong 20 giây; không cuộn ngang ở 375px; tương phản ≥ 4,5:1 ở chỗ tệ nhất; không emoji; mọi số hiển thị lấy từ store/CR thật hoặc ghi "synthetic".

## Risk Assessment

- Làm đẹp quá giờ: luật 16:15; mọi thứ ngoài hero = cắt.
- Blur nặng trên máy 8 GB: ≤ 4 vùng.
- F không có luồng thật tới 15:00: dùng seed và trạng thái cứng nhưng **không** quay trên đó.

## Security Considerations

- Ẩn/hiện nút chỉ là UX; API là ranh giới. Render ciphertext/plaintext thành text (không `dangerouslySetInnerHTML`); `code` chỉ hiện sau khi mở, không lưu `localStorage`.

## Next Steps

Phase 05/06 dùng UI này để chụp ảnh và quay.
