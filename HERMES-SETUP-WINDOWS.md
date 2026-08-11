# HERMES-SETUP-WINDOWS — 노트북에 헤르메스 설치하고 디스코드로 일 시키기

> 작성 2026-08-11 · 대상: 대표님 Windows 노트북 · 소요 **약 40분**
>
> 이 문서의 모든 명령어와 설정값은 **공식 저장소를 직접 받아 확인**했다.
> 출처: `github.com/NousResearch/hermes-agent` (MIT 라이선스, 확인 커밋 `69ae247`, 2026-08-11)
> 추측으로 쓴 명령어는 하나도 없다. 확인하지 못한 것은 §7에 따로 적었다.

---

## 0. 먼저 아셔야 할 것

**제가 대신 설치해 드릴 수 없습니다.** 제 작업 환경은 클라우드의 임시 컨테이너라 대표님 노트북에 접근할 방법이 없습니다. 대신 **복사·붙여넣기만 하면 되도록** 전부 준비했습니다. 대표님이 하실 일은 붙여넣기와 화면에서 버튼 몇 번 누르는 것입니다.

**헤르메스는 대표님 노트북에서 명령을 실행할 수 있는 프로그램입니다.** 파일을 읽고 쓰고, 코드를 돌리고, 브라우저를 조작합니다. 그래서 §1의 설치 경로와 §3의 접근 제한을 반드시 그대로 따라주세요.

**노트북을 꺼두면 헤르메스도 멈춥니다.** 로그인할 때 자동으로 켜지도록 설정하지만(§5), 노트북이 꺼져 있으면 디스코드에서 말을 걸어도 대답하지 않습니다. 24시간 대기가 필요하면 나중에 VPS로 옮기면 됩니다.

---

## 1. 설치 (5분)

**PowerShell**을 열고 아래 한 줄을 붙여넣습니다. 관리자 권한 필요 없습니다.

```powershell
iex (irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1)
```

> ⚠️ **이 주소만 씁니다.** 검색하면 `hermes-agent.org`, `hermesagents.net`, `hermesagent.agency` 같은 **공식을 흉내 낸 사이트가 여럿** 나옵니다. 헤르메스는 노트북에서 코드를 실행하는 프로그램이라, 가짜를 설치하면 노트북이 통째로 넘어갑니다. 위 주소는 공식 GitHub 저장소의 원본 파일 경로입니다.

설치되는 것: Python 3.11, Node.js, ripgrep, ffmpeg, 휴대용 Git(약 45MB) — 전부 자동입니다.
설치 위치: `%LOCALAPPDATA%\hermes\`

**설치가 끝나면 PowerShell 창을 닫고 새로 엽니다.** (PATH가 새 창에만 적용됩니다.)

확인:

```powershell
hermes
```

터미널 화면이 뜨면 성공입니다.

---

## 2. 모델 정하기 (5분) — 비용이 여기서 갈립니다

```powershell
hermes model
```

세 가지 중 하나를 고르시면 됩니다.

| 선택 | 비용 | 성능 | 언제 |
|---|---|---|---|
| **로컬 Ollama** | **0원** | 낮음 | 일단 감을 잡을 때. 노트북 사양을 탑니다. |
| **OpenRouter** | 종량 과금 | 높음(모델 선택 자유) | 여러 모델을 바꿔가며 쓰고 싶을 때 |
| **Anthropic / OpenAI 직접** | 종량 과금 | 높음 | 한 회사 모델만 쓸 때 |

**권고: 로컬 Ollama로 먼저 켜보시고, 답답하면 유료로 옮기세요.** 설치가 제대로 됐는지, 디스코드 연결이 되는지를 0원으로 먼저 확인할 수 있습니다. 모델 교체는 `hermes model` 한 번이면 됩니다.

> 💰 **유료 선택은 CEO-CHARTER §16-B 승인 대상 2건**(비용 발생 · 외부 서비스 가입)에 해당합니다. 대표님 본인 결정이므로 여기서 바로 진행하셔도 됩니다. 추정 월 3만~15만원이며 **실측이 아닌 개략치**입니다 — 자율 작업을 많이 맡길수록 늘어납니다.

---

## 3. 디스코드 봇 만들기 (15분)

### 3-1. 애플리케이션 생성

1. [Discord Developer Portal](https://discord.com/developers/applications) 접속 → 로그인
2. 우측 상단 **New Application**
3. 이름 입력(예: `GBRICK 헤르메스`) → 약관 동의 → **Create**
4. **General Information** 화면의 **Application ID**를 메모해 둡니다

### 3-2. 봇 만들기

1. 왼쪽 메뉴 **Bot** 클릭
2. **Authorization Flow** 항목:
   - **Public Bot** → **OFF** ← 대표님 혼자 쓰실 것이므로 꺼둡니다(아무나 초대 못 하게)
   - **Require OAuth2 Code Grant** → **OFF**

### 3-3. ⚠️ 가장 중요한 단계 — Intents 켜기

같은 **Bot** 화면을 아래로 내려 **Privileged Gateway Intents**를 찾습니다.

| 항목 | 설정 |
|---|---|
| **Server Members Intent** | **ON** ← 반드시 |
| **Message Content Intent** | **ON** ← 반드시 |
| Presence Intent | 꺼두셔도 됩니다 |

맨 아래 **Save Changes** 클릭.

> **봇이 온라인인데 대답을 안 하는 원인 1위가 이것입니다.** Message Content Intent가 꺼져 있으면 봇은 메시지가 왔다는 것만 알고 **내용을 읽지 못합니다.** 대표님이 뭘 쓰셨는지 글자를 못 봅니다.

### 3-4. 토큰 받기

1. 같은 화면 **Token** 항목 → **Reset Token**
2. 2단계 인증을 쓰신다면 인증코드 입력
3. 화면에 뜬 토큰을 **즉시 복사**

> ⚠️ **토큰은 이 한 번만 보입니다.** 놓치면 다시 Reset해야 합니다. 메모장이나 비밀번호 관리자에 잠깐 붙여두세요. **누구에게도 보내지 마세요** — 이 토큰을 가진 사람은 봇을 완전히 조종할 수 있습니다.

### 3-5. 서버에 초대하기

Public Bot을 OFF로 했으므로 **아래 주소를 직접 만들어** 씁니다. `여기에_Application_ID`를 3-1에서 메모한 숫자로 바꾸세요.

```
https://discord.com/oauth2/authorize?client_id=여기에_Application_ID&scope=bot+applications.commands&permissions=274878286912
```

이 주소를 브라우저에 붙여넣고 → 서버 선택 → **Continue** → **Authorize**.

> 뒤의 `274878286912`는 권한 묶음입니다: 채널 보기, 메시지 보내기, 링크 첨부, 파일 첨부, 기록 읽기, 스레드에서 답하기, 이모지 반응.

### 3-6. 대표님 디스코드 ID 알아내기

1. 디스코드 → **설정** → **고급** → **개발자 모드** **ON**
2. 설정을 닫고, 본인 이름에 **우클릭** → **사용자 ID 복사**
3. `284102345871466496` 같은 긴 숫자가 복사됩니다

---

## 4. 헤르메스에 디스코드 연결 (5분)

```powershell
hermes gateway setup
```

**Discord**를 고르고, 3-4의 토큰과 3-6의 사용자 ID를 붙여넣으면 끝입니다.

수동으로 하시려면 `%LOCALAPPDATA%\hermes\.env` 파일에 아래 두 줄을 넣으셔도 됩니다.

```bash
DISCORD_BOT_TOKEN=3-4에서_복사한_토큰
DISCORD_ALLOWED_USERS=3-6에서_복사한_숫자
```

> 🔒 `DISCORD_ALLOWED_USERS`에 **대표님 ID만** 넣으세요. 이 값이 비어 있으면 헤르메스는 **모두를 차단합니다**(안전한 기본값). 여기에 적힌 사람만 노트북에서 명령을 실행시킬 수 있습니다.

이제 켭니다.

```powershell
hermes gateway
```

몇 초 안에 디스코드에서 봇이 온라인으로 바뀝니다. **DM으로 말을 걸어보세요** — DM에서는 `@멘션` 없이 아무 말이나 하면 대답합니다. 서버 채널에서는 기본적으로 `@봇이름`을 붙여야 반응합니다.

---

## 5. 로그인할 때 자동으로 켜지게 (5분)

```powershell
hermes gateway install
```

Windows **작업 스케줄러**에 로그인 시 자동 실행으로 등록됩니다. 관리자 권한도, UAC 창도 뜨지 않습니다.

관리 명령:

```powershell
hermes gateway status      # 지금 켜져 있나
hermes gateway start       # 켜기
hermes gateway stop        # 끄기
hermes gateway restart     # 다시 켜기
hermes gateway uninstall   # 자동 실행 해제
```

---

## 6. GBRICK 업무 시키기 (5분)

여기까지는 "똑똑한 비서"입니다. 우리 회사 일을 시키려면 **회사 사정을 알려줘야** 합니다.

이 저장소의 [`hermes-skills/gbrick-hq/SKILL.md`](hermes-skills/gbrick-hq/SKILL.md)를 노트북의 아래 위치로 복사하세요.

```
%LOCALAPPDATA%\hermes\skills\gbrick-hq\SKILL.md
```

PowerShell로 한 번에:

```powershell
$dst = "$env:LOCALAPPDATA\hermes\skills\gbrick-hq"
New-Item -ItemType Directory -Force -Path $dst
Copy-Item "<이_저장소_경로>\hermes-skills\gbrick-hq\SKILL.md" $dst
```

이 스킬이 헤르메스에게 알려주는 것:

- GBRICK/디자인포비가 **무엇을 공개하고 무엇을 상담에서만 말하는지**(CLAUDE.md §0-5)
- 지어내면 안 되는 것 — 가맹점 수, 평균 매출, 폐점 매장
- **아침 브리핑을 어디서 받아오는지**(전령 API)
- 매일 아침 7시에 브리핑을 대표님께 보내는 예약

복사한 뒤 디스코드에서 이렇게 말해보세요.

> 오늘 아침 브리핑 보여줘

---

## 7. 확인하지 못한 것 (정직 기록)

CLAUDE.md §0-2 원칙 7에 따라 적습니다.

- **실제 설치를 해보지 않았습니다.** 위 절차는 공식 저장소 문서를 읽고 옮긴 것이며, 대표님 노트북에서 실행해 검증한 것이 아닙니다. 막히는 지점이 있으면 알려주세요.
- **§6의 아침 브리핑 API는 아직 배포되지 않았습니다.** `/api/hq/courier/morning`은 현재 작업 브랜치(`claude/hermes-agent-build-bga5ts`)에만 있고 `main`에 병합되지 않아 `www.fobee.co.kr`에서 아직 응답하지 않습니다. 병합·배포 후 동작합니다. 그전까지 스킬의 브리핑 부분은 실패합니다(회사 규칙 부분은 정상 동작).
- **`N8N_SERVICE_TOKEN`이 운영 환경에 설정돼 있는지 확인하지 못했습니다.** 브리핑 API 호출에 필요합니다. Vercel 환경변수에 없으면 헤르메스가 401을 받습니다.
- **비용은 추정입니다**(§2). 실제 청구액은 사용량에 따라 달라집니다.

---

## 8. 문제가 생기면

| 증상 | 원인 | 해결 |
|---|---|---|
| 봇이 온라인인데 대답을 안 함 | **Message Content Intent 꺼짐** (원인 1위) | §3-3 다시 |
| 봇이 계속 오프라인 | 게이트웨이가 안 돌고 있음 | `hermes gateway status` → `hermes gateway start` |
| "권한이 없습니다" | `DISCORD_ALLOWED_USERS`에 내 ID가 없음 | §4의 `.env` 확인 |
| `hermes` 명령을 못 찾음 | PATH 미적용 | PowerShell 창을 닫고 새로 열기 |
| 브리핑이 401/404 | API 미배포 또는 토큰 없음 | §7 참조 |

공식 문서: `github.com/NousResearch/hermes-agent` → `website/docs/`
