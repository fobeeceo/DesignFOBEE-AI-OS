// 인터넷 공유: 매장 PC의 음성 주문을 밖에서 휴대폰으로 열 수 있게 한다.
// Cloudflare 무료 임시 터널(가입 불필요) → https://xxxx.trycloudflare.com 주소가 생긴다.
// 진짜 HTTPS라 아이폰에서도 인증서 경고 없이 마이크가 된다. 이 창을 닫으면 주소도 사라진다.
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 3100);

function findCloudflared() {
  if (process.env.CLOUDFLARED) return process.env.CLOUDFLARED;
  const candidates = [
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe', // winget 설치 위치
    'C:\\Program Files\\cloudflared\\cloudflared.exe',
    path.join(ROOT, 'cloudflared.exe'),
  ];
  return candidates.find((p) => fs.existsSync(p)) || 'cloudflared';
}

const shareKey = process.env.SHARE_KEY || crypto.randomBytes(4).toString('hex');
const children = [];
const stopAll = () => children.forEach((c) => c.kill());
process.on('SIGINT', () => { stopAll(); process.exit(0); });
process.on('exit', stopAll);

// 예전 서버가 켜져 있으면 새 서버가 못 켜지고 예전 화면이 공유된다 → 먼저 알려준다
try {
  await fetch(`http://localhost:${PORT}/api/health`, { signal: AbortSignal.timeout(1500) });
  console.log(`
[안내] 이미 다른 주문 서버가 켜져 있습니다 (${PORT}번).
예전에 켠 검은 서버 창을 모두 닫고 다시 실행하세요.
또는 PowerShell에: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT} -State Listen).OwningProcess
`);
  process.exit(1);
} catch {
  // 비어 있음 → 계속
}

// 인터넷에 열리는 주소이므로 항상 TEST(연습 주문)로만 켠다 — 실제 주문(PRODUCTION)은 공유하지 않는다
const server = spawn(process.execPath, [path.join(ROOT, 'server.mjs')], {
  cwd: ROOT,
  env: { ...process.env, SHARE_KEY: shareKey, VOICE_ORDER_MODE: 'test' },
  stdio: 'inherit',
});
children.push(server);

const tunnel = spawn(findCloudflared(), ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`], { cwd: ROOT });
children.push(tunnel);

tunnel.on('error', () => {
  console.log(`
[안내] 인터넷 공유 프로그램(cloudflared)이 없습니다. PowerShell에서 한 번만 설치하세요:

    winget install --id Cloudflare.cloudflared --source winget

설치 후 PowerShell을 새로 열고 다시 npm run share 하세요.
(매장 안 Wi-Fi에서만 쓸 때는 npm start 로 충분합니다)
`);
  stopAll();
  process.exit(1);
});

let shown = false;
const onOutput = (buf) => {
  const m = String(buf).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (!m || shown) return;
  shown = true;
  const line = '='.repeat(64);
  console.log(`\n${line}\n 인터넷 공유 켜짐 — 밖에서도 휴대폰으로 열 수 있습니다 (TEST 연습 주문)\n${line}`);
  console.log(` ★ 휴대폰 바리스타 주문 : ${m[0]}/store/GBRICK_MAIN`);
  console.log(`   (주문은 이 PC 카운터 화면 http://localhost:${PORT}/counter/GBRICK_MAIN 에 들어옵니다)`);
  console.log(` 체험판(매장에 안 감) : ${m[0]}`);
  console.log(` 대시보드(키 포함): ${m[0]}/dashboard?key=${shareKey}`);
  console.log(`\n · 주소를 카카오톡 '나와의 채팅'으로 보내 휴대폰에서 누르세요`);
  console.log(` · 이 창을 닫으면 주소가 사라집니다. 다시 켜면 주소가 바뀝니다`);
  console.log(` · 주문 화면 주소를 아는 사람은 누구나 테스트 주문을 할 수 있습니다. 시연이 끝나면 창을 닫으세요\n${line}\n`);
};
tunnel.stdout.on('data', onOutput);
tunnel.stderr.on('data', (buf) => {
  onOutput(buf);
  if (/failed|error/i.test(String(buf)) && !shown) process.stderr.write(`[cloudflared] ${buf}`);
});
tunnel.on('exit', (code) => {
  if (!shown) console.log(`\n[안내] 인터넷 공유 주소를 만들지 못했습니다 (코드 ${code}). 인터넷 연결을 확인하고 다시 시도하세요.`);
  stopAll();
  process.exit(code || 0);
});
