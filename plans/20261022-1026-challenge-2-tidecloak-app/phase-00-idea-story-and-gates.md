# Phase 00: Cổng người dùng, idea, thông tin nộp bài

## Context Links

- Đề + rubric: https://tide.org/unlocked/ · Emergent Authority: https://tide.org/blog/emergent-authority-beyond-cybersecurity
- `research/researcher-02-showcase-landscape-and-ideas.md`, `research/researcher-03-raziel-capabilities-and-scenarios.md` (§1, §4, §8), `reports/red-team-review.md`
- Bối cảnh hụi: Nghị định 19/2019/NĐ-CP (https://chinhphu.vn/default.aspx?pageid=27160&docid=196233); bài "giật hụi" Công an TP Cần Thơ (https://congan.cantho.gov.vn/thong-tin-chuyen-de/giat-hui-khong-chi-la-tranh-chap-dan-su-ranh-gioi-mong-manh-giua-no-va-toi-6404.html)

## Overview

- Priority: P1 · Status: Pending · 12:00–12:20
- Thu mọi thứ **chỉ con người cung cấp được** (licence, T&C, thông tin nộp bài, nhân sự), chốt idea đã thu hẹp, và dọn tài nguyên máy.

## Key Insights

- Rubric nặng originality (25%) + bài test "ordinary login". Cấm login demo/security tool/generic access dashboard ⇒ màn dẫn bằng vòng hụi, bằng chứng quyền chỉ là phụ.
- Ranh giới self-service (research-03): custom Forseti không tự deploy; chủ dữ liệu không tự cấp quyền; agent không có Tide identity. Cái **thật làm được**: E2EE policy bằng built-in `RelationshipAttestation:1` (steward ký policy) + IGA quorum cho đổi role. So với ví dụ chính thức (Guild Treasury, Dual-Control Expense, Community Ballot) ta dùng **cùng cơ chế**; **không** được nói những ví dụ đó "không làm được", chỉ nói ta cùng scope mock và khác ở hành vi riêng của hụi (bên dưới).
- Khác biệt hụi, thấy được trên màn hình: (1) quyền **xoay vòng theo chu kỳ** (gói release riêng, quyền giải mã chỉ cho một chu kỳ rồi thu hồi); (2) **tách quyền**: người duyệt ≠ người đọc ≠ host; (3) người thắng chu kỳ trước thử mở chu kỳ sau bị từ chối; (4) escrow giả lập chỉ trả cho người trình đúng mã và đúng danh tính.
- Red team bắt buộc thu hẹp: chỉ nói "quorum ủy quyền truy cập gói release", **không** nói "không ai chuyển hướng được tiền"/"đã trả tiền"; tiền và escrow là mock; escrow đối tác tạo mã nên là bên biết mã, host không phải bên đó.

## Requirements

- Demo B0: seal → refuse (steward, người chưa cấp) → proposal + 2 steward duyệt trong Tide Console → người thắng giải mã → redeem escrow mock.
- README ≤ 300 từ (đếm lại trước khi nộp), 5 prompt; video 2 phút `.mp4` < 100 MB trong repo; dữ liệu tổng hợp.

## Architecture (vai và tài khoản)

| Vai | Tài khoản Tide | Làm được | Không làm được |
|---|---|---|---|
| Steward ×3 (Hạnh, Tuấn, Mai) | `hanh`, `tuan`, `mai` (`tide-realm-admin`) | đề xuất + duyệt CR trong enclave, ký policy | giải mã gói release; không có `_tide_decryptor` thường trực |
| Người thắng (Minh) | `minh` | giải mã **sau** release CR; redeem escrow | tự duyệt; mở chu kỳ khác |
| Escrow partner (Bảo) | `bao` (`_tide_encryptor`) | niêm phong gói release (chỉ ghi), sinh mã | đọc lại; duyệt |
| Host / operator | **không có** tài khoản Tide (chạy server, DB) | thấy ciphertext, thấy metadata | giải mã (không giữ khóa) |

Thật: login Tide, E2EE policy, từ chối của ORK, CR + approvals (Tide Console). Mock: tiền, escrow, đóng góp, bốc hụi. Không tuyên bố: chủ dữ liệu tự cấp quyền, ký theo ngưỡng/số tiền, bảo vệ trước operator phát JS độc, hành vi của master-realm admin.

## README overview (bản nháp EN; đếm lại bằng script trước khi nộp)

```markdown
[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

## Project overview
Hostless Hụi: a savings circle where no host, platform or single steward can open the payout.

### 1. Vision & originality
Hụi (tandas, chit funds, susu elsewhere) lets people without easy bank access save together, but the host holds the pot and decides who releases it. We propose a hostless circle: each cycle has its own sealed release package and winner authority, which opens only when a quorum of elected stewards approves. Power rotates, never accumulates.

### 2. Trust constraint insight
Today the host has unilateral authority over the money and ledger. When a host vanishes or favours a friend (vỡ hụi), members lose everything, so circles stay small and personal. Remove unilateral release authority and strangers can pool money safely. The pot sits with a mocked escrow; we remove the host's authority to release it.

### 3. Value & impact
Students, traders and gig workers already run informal circles. Example: Minh wins cycle 3; his escrow code reaches him only after two of three stewards approve. The host cannot open it, nor can a steward or last cycle's winner.

### 4. Why TideCloak matters
The release package is end-to-end encrypted under a TideCloak policy; our server stores only ciphertext. Decrypt rights come through governed role changes needing steward quorum. Stewards approve but cannot read; the winner reads but cannot approve. With ordinary login and backend permissions, the host or a database admin could read the package and approve anything. We assume authentic client code.

### 5. Prototype & storytelling
Watch cycle 3: the database shows ciphertext; a steward and the winner are refused by the Tide network. One approval is not enough; the second commits, and Minh's browser unseals the code and redeems it at the mock escrow. Money is mocked; every authority check is real.
```

Chỉ giữ câu nào đã build và đo được; nếu ngưỡng đo được là 1 thì sửa "two of three" thành đúng số đo.

## Video storyboard (2:00)

| Giây | Cảnh | Lời |
|---|---|---|
| 0:00–0:15 | vòng thành viên + "Hụi" | The possibility: a circle where nobody can open the payout alone |
| 0:15–0:35 | chữ "vỡ hụi", host giữ sổ và tiền | The constraint: the host holds the authority |
| 0:35–1:30 | app: DB chỉ ciphertext → steward bị từ chối → Minh bị từ chối → 1 phiếu chưa đủ → phiếu 2 commit → Minh mở → redeem (cắt phần chờ, ghi chú "~90 s later") | The prototype and TideCloak's role at each refusal |
| 1:30–1:50 | chu kỳ trước/sau: người thắng cũ bị từ chối ở chu kỳ mới | What changes: authority rotates |
| 1:50–2:00 | logo Built with TideCloak | Authority emerges only when identity, policy and approvals line up |

## Implementation Steps

1. **Đã xác nhận:** 4 người; group name `RMIT_SGS_Gay_Hackers_C2`; email đội và email licence lưu riêng trong `.env`; T&C đã đồng ý và public repo khoảng 15:45 sau rà bí mật được cho phép. Realm `hui-rmit26` và licence free-tier đã tạo/kiểm chứng (xem `docs/setup-tidecloak.md`); enrollment/IGA chưa làm. Còn chốt người gửi form chính + dự phòng; không đưa email vào tài liệu public.
2. Phân vai theo plan.md (tài khoản `hanh`, `tuan`, `mai`, `minh`, `bao`, mỗi người một browser profile).
3. **Dọn máy (8 GB RAM, ổ 97%):** cần ≥ 6 GB trống; đóng Brave/Chrome thừa; xóa `~/.colima` (602 MB) nếu người dùng đồng ý; không cài thêm ngoài `bun install`. Quyết định độ phân giải quay thấp (1280×720) từ đầu.
4. Hỏi Tide: Discord #support (https://discord.gg/XBMd9ny2q5) và nhân viên Tide tại sự kiện: "mạng ORK của `ork1.tideprotocol.com` có `RelationshipAttestation:1` không? ký policy trong multiAdmin cần mấy chữ ký? master-admin có thể ép cấp role bỏ qua IGA không?"
5. Chốt scope B0/B1/B2 (plan.md). Tạo `demo/` và `demo/checklist.md`.

## Todo List

- [x] Email licence + T&C: người dùng đã chọn email và trả lời đồng ý; lưu `.env`
- [x] Email đội, group name, 4 người, đồng ý public sau rà bí mật
- [ ] Người gửi form chính + dự phòng
- [ ] Phân vai 4 người cho 5 tài khoản
- [ ] Dọn máy ≥ 6 GB trống
- [ ] Câu hỏi Tide đã gửi
- [ ] README overview chốt chữ ≤ 300

## Success Criteria

- Có đủ thông tin con người; không còn câu hỏi chặn P1; máy đủ chỗ trống.

## Risk Assessment

- Không đồng ý T&C/không email: không tạo realm; báo rõ sẽ không đạt "TideCloak integrated".
- Trùng ý tưởng: khác biệt nằm ở 4 hành vi riêng của hụi ở trên; nói trong 20 giây đầu video.
- Người dùng vắng lúc cần công khai/nộp: người gửi form dự phòng được chốt từ bây giờ.

## Security Considerations

- Không commit email licence, `.env`, invite link, token. Mật khẩu `password` là mặc định dev công khai của Tide, TideCloak bind `127.0.0.1`; vẫn không đưa vào README. Chỉ dữ liệu tổng hợp.

## Next Steps

Phase 01 và 02 chạy song song ngay khi có licence + T&C.
