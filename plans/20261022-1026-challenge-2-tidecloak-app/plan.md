---
title: "Challenge 2 (Tide UNLOCKED): Hostless Hụi, vòng hụi không ai tự mở được payout"
description: "Prototype TideCloak cho RMIT Hackathon Challenge 2: gói release của payout hụi được mã hóa E2EE, chỉ mở khi quorum steward duyệt; steward duyệt nhưng không đọc được."
status: pending
priority: P1
effort: 5.75h wall-clock (12:00–17:45, workstreams song song)
branch: main
tags: [feature, frontend, backend, auth, security, experimental]
created: 2026-10-22
---

# Hostless Hụi: a savings circle where no host, platform or single steward can open the payout

## Mục tiêu và hạn

Nộp **trước 17:45 giờ VN** (hạn 18:00, 22/10/2026) qua https://forms.gle/HRHYjnqB86j1LFS97: repo GitHub **public** có code chạy thật với TideCloak, **video 2 phút `.mp4` < 100 MB** trong repo, README mở đầu bằng Project overview **≤ 300 từ** trả lời 5 prompt. Nguồn: https://tide.org/unlocked/ (đọc 22/10/2026).

Chấm điểm: Vision & originality 25% · Trust constraint 20% · Value & impact 20% · Why TideCloak 20% · Prototype & storytelling 15%. Bài test: *"nếu chạy y hệt với ordinary login + backend permissions thì phải phát triển thêm"*. Tránh: login demo, security tool, generic access-control dashboard.

## Ý tưởng (đã thu hẹp sau red team)

Hụi do chủ hụi nắm tiền và quyền quyết định giải ngân; "vỡ hụi" xảy ra khi người đó biến mất hay thiên vị. Mỗi chu kỳ có **gói release** riêng (mã rút tiền ở escrow giả lập) được mã hóa E2EE bằng policy TideCloak: server chỉ giữ ciphertext; **steward duyệt nhưng không đọc được; người thắng đọc được nhưng không tự duyệt được**; quyền giải mã được cấp bằng **đổi role có quorum (IGA)** và chỉ cho đúng một chu kỳ. Tiền và escrow là **mock**; kiểm tra quyền là **thật**. Điểm khác biệt hụi: quyền **xoay vòng theo chu kỳ**, không tích tụ ở một người.

Giới hạn nói thẳng (phải có trong README/docs): giả định client code chân thực (không chống được operator phát JS độc); quorum steward có thể thông đồng; quorum chỉ **ủy quyền truy cập gói release**, không ràng buộc nội dung giao dịch; TideCloak master-realm admin có đường recovery tắt IGA (docs của Tide), ta không tuyên bố gì về nó trừ khi đã đo.

Đồng hồ lúc lập plan: **11:18 giờ VN**. Mốc giờ trong bảng là **cổng cứng** (không dời muộn hơn); bắt đầu phase 00 ngay thì ~40 phút dư ở đầu dành cho enrol (phần chậm nhất, cần người thật) và làm đệm.

## Phases

| # | Phase | Cửa sổ (giờ VN) | Trạng thái | Gate |
|---|---|---|---|---|
| 0 | [Cổng người dùng, idea, nộp bài](phase-00-idea-story-and-gates.md) | 12:00–12:20 | Pending | email licence + T&C + thông tin nộp bài |
| 1 | [Realm TideCloak, enrol, quorum](phase-01-tidecloak-realm-and-enrolment.md) | 12:20–14:00 | Pending | G1 14:00: 3 steward linked, ngưỡng đo được |
| 2 | [Nền app trên Bun](phase-02-app-foundation-on-bun.md) | 12:20–13:40 | Pending | G2b 13:40: login thật + API dưới Bun |
| 3 | [Lõi payout niêm phong](phase-03-sealed-payout-core-spike.md) | 13:45–15:15 | Pending | G1.5 13:50 (RA probe), G3 15:15 |
| 4 | [UI sản phẩm](phase-04-product-ui-and-approvals.md) | 13:40–16:15 | Pending | đóng băng 16:15 |
| 5 | [Hardening, docs, an toàn nộp](phase-05-hardening-docs-rehearsal.md) | 15:15–16:45 (xen kẽ) | Pending | public + form baseline 15:45 |
| 6 | [Video và nộp bài](phase-06-video-and-submission.md) | 16:45–17:45 | Pending | form xác nhận 17:30 |

Nghiên cứu nền: `research/researcher-01..04-*.md`. Red team: `reports/red-team-review.md`. Mirror Tide Raziel ở `.cache/raziel/` (gitignored); gọi `https://mcp.tide.org/mcp` bằng JSON-RPC khi cần bản mới.

## Thang suy giảm (một hạn, một điều kiện đạt)

| Level | Demo thật | Quyết định |
|---|---|---|
| **B0 (cốt lõi, không cắt)** | Một circle cố định, một record: operator chỉ thấy ciphertext; steward và người chưa được cấp bị ORK từ chối; **quorum duyệt trong Tide Console**; người thắng giải mã; redeem escrow giả lập | G3 15:15 |
| B1 | Panel trạng thái đọc-chỉ (số phiếu, CR), thanh stage, UI dark glass đầy đủ | 16:15 |
| B2 (stretch) | Duyệt/đề xuất ngay trong app (REST + enclave), nhiều chu kỳ, i18n | chỉ khi G3 xong trước 14:45 |

Luật cắt: **15:15** chưa qua G3 ⇒ khóa phần đã chứng minh được, sửa README theo số đo (không bịa), chuyển toàn lực sang video; **16:15** đóng băng tính năng; **16:45** quay dù thiếu gì. Nếu G1.5 (RA probe) đỏ lúc 13:50: hỏi Tide ngay tại sự kiện/Discord; **14:30** vẫn đỏ ⇒ Plan Z trong phase 03 (đổi vỏ domain hoặc thu hẹp story).

## Quyết định then chốt

- Bun (runtime + package manager). Đường A: scaffold Tide `nextjs-e2ee-vault` chạy dưới Bun (`bun run --bun dev`); đường B giới hạn **60 phút**: `Bun.serve` + React 19 + `jose` + `verifyDpop.ts`. Giữ starter ở tag `starter-bun` tới khi G2b đạt.
- Realm mới `hui-rmit26`; **không đụng `myrealm`**; không chạy `init-tidecloak.sh` (wipe Docker/H2). **Không dùng master-admin token trong runtime của app** (AP-G08); đề xuất/duyệt ở Tide Console (B0) hoặc bằng token steward (B2).
- Không để ai giữ `_tide_decryptor` thường trực: release CR cấp `_tide_decryptor` + `hui-cN-winner`, kết thúc chu kỳ thì thu hồi.
- Lưu trữ: tái dùng mẫu route vault của scaffold (JSON file qua `node:fs`); không SQLite, không token-bucket/idempotency generic (nếu dư giờ ở phase 05).
- Phong cách UI: dark obsidian + glass + glow; **wireframe A cố định**, tiếng Anh, không cổng chọn.

## Nhân sự (đã chốt 22/10: 4 người; group name `RMIT_SGS_Gay_Hackers_C2` đã được đội xác nhận)

- **4 người:** T (Tide ops, enrol, quorum), B (backend + tích hợp, lái G2b/G3), F (UI), S (README, kịch bản, video, thông tin nộp). 5 tài khoản = 4 người + một người giữ 2 profile.
- **2 người:** [T+B] và [F+S]; F chỉ bắt đầu khi B xong G2b.
- **1 người (lái duy nhất):** P0 → P1a/P2a (xen kẽ chờ enrol) → G2b → G1.5 → G3 → khoác skin UI mỏng trên scaffold (không dựng mock riêng) → README → video. Enrol 5 tài khoản vẫn cần người thật trên browser: tự làm tuần tự (≈ 3–5 phút/tài khoản).
Ownership file: **T** `scripts/tide/**`, `docs/setup-tidecloak.md`; **B** `src/lib/**`, `src/app/api/**`, `next.config.ts`, `public/*.html`; **F** `src/app/**/page.tsx`, `src/components/**`, `src/app/globals.css`; **S** `README.md`, `demo/**`, `docs/**` còn lại. File < 200 dòng, kebab-case.

## Red Team Review

Phiên 2026-10-22: 4 reviewer, 34 phát hiện thô ⇒ **22 sau gộp (6 Critical, 15 High, 1 Medium)**; 20 chấp nhận, 2 chấp nhận một phần, 0 bác. Chi tiết: `reports/red-team-review.md`. Thay đổi lớn: bỏ master token khỏi runtime; không còn quyền giải mã thường trực; thêm probe RA sớm (G1.5); thu hẹp tuyên bố; thêm escrow mock có redeem; ngân sách chu kỳ; public + form baseline 15:45; bỏ hạ tầng generic và tính năng B2 khỏi đường găng.

## Lệnh tiếp tục

`/ck:cook /Users/vominhlong/rmit-hackathon-2026-c2/plans/20261022-1026-challenge-2-tidecloak-app/plan.md`
