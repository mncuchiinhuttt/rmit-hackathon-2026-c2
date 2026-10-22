import { adminApi, clientName, jsonWrite, realmName, savePrivate, serverUrl } from './admin-client';

const DEMO_USERS = ['hanh', 'tuan', 'mai', 'minh', 'bao'] as const;
interface User { id: string; username: string; attributes?: Record<string, string[]> }

function applicationUrl(): string {
  const url = new URL(process.env.TIDE_APP_ORIGIN ?? 'http://localhost:3000');
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Enrollment return URL must be the local application origin');
  }
  return url.href;
}

function checkedLink(value: unknown, userId: string, returnUrl: string): string {
  try {
    if (typeof value !== 'string') throw new Error();
    const url = new URL(value);
    const expected = new URL(`/realms/${realmName}/login-actions/action-token`, serverUrl);
    if (url.origin !== expected.origin || url.pathname !== expected.pathname || url.username || url.password || url.hash) throw new Error();
    const token = url.searchParams.get('key');
    if (!token) throw new Error();
    // Metadata check only: the provider, not this script, authenticates its signed action token.
    const claims = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'));
    if (claims.sub !== userId || claims.azp !== clientName || claims.reduri !== returnUrl) throw new Error();
    return url.href;
  } catch {
    throw new Error('Tide invitation is not bound to the expected user, app client and return URL');
  }
}

export async function refreshEnrollmentLinks(): Promise<void> {
  const returnUrl = applicationUrl();
  const invitations: Record<string, string> = {};
  const linked: string[] = [];
  for (const username of DEMO_USERS) {
    const users = await adminApi<User[]>(`/users?${new URLSearchParams({ username, exact: 'true' })}`);
    const user = users.length === 1 && users[0].username === username ? users[0] : null;
    if (!user?.id) throw new Error(`Prepared account missing or ambiguous: ${username}`);
    if (user.attributes?.tideUserKey?.[0]) {
      linked.push(username);
      console.log(`${username}: already linked; identity preserved`);
      continue;
    }
    const query = new URLSearchParams({
      userId: user.id, lifespan: '43200', client_id: clientName, redirect_uri: returnUrl,
    });
    const value = await adminApi<unknown>(`/tideAdminResources/get-required-action-link?${query}`,
      jsonWrite('POST', ['link-tide-account-action']));
    invitations[username] = checkedLink(value, user.id, returnUrl);
    console.log(`${username}: app-bound invitation refreshed`);
  }
  const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const rows = DEMO_USERS.map(username => linked.includes(username)
    ? `<li>${username}: đã liên kết Tide. Không dùng lại link cũ.</li>`
    : `<li><a href="${escape(invitations[username])}" target="_blank" rel="noreferrer">${username}</a></li>`).join('\n');
  const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><title>Private Tide enrollment</title><body>
<h1>Liên kết tài khoản Tide</h1>
<p>Mỗi người dùng browser profile riêng và hoàn tất trong cùng profile. Không gửi mật khẩu cho agent.
Ba steward hanh, tuan, mai phải dùng ba Tide identity khác nhau. Người nhận: minh; escrow: bao.</p>
<ul>${rows}</ul>
<p>Sau khi liên kết, quay về <a href="${escape(returnUrl)}">Hostless Hui</a> và chọn Sign in with Tide.
Không dùng admin console để đăng nhập webapp; không reload callback hoặc mở lại link đã dùng.</p>
<p>File local riêng tư; không chia sẻ công khai. Chỉ các tài khoản chưa liên kết mới có invitation.</p>
</body></html>`;
  await savePrivate('.cache/tide-enrollment.json', JSON.stringify(invitations, null, 2));
  await savePrivate('.cache/tide-enrollment.html', html);
  console.log(`Linked accounts: ${linked.length}/5. Private invitations: .cache/tide-enrollment.html`);
}

if (import.meta.main) await refreshEnrollmentLinks();
