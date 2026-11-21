"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ON_SITE_PAYMENT_NOTICE } from "@/lib/gbrick/launch";
import { NAME_MAX, type GroupLine } from "@/lib/gbrick/groupOrder";
import { loadGroupLocal, loadGroupName, saveGroupLocal, saveGroupName, setGroupMode, type GroupLocal } from "@/lib/gbrick/groupClient";

interface Participant { id: string; name: string; items: GroupLine[]; subtotal: number }
interface Room {
  code: string; storeId: string; storeName: string; hostName: string;
  status: "OPEN" | "ORDERING" | "ORDERED"; orderId: string | null; participants: Participant[]; total: number;
}

const optionText = (l: GroupLine) => l.options.map(o => o.optionName).join(", ");

export default function GroupPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [local, setLocal] = useState<GroupLocal>({});
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => { setLocal(loadGroupLocal(code)); setName(loadGroupName()); }, [code]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/gbrick/group/${code}`, { cache: "no-store" });
      const data = await res.json();
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error(data.error);
      setRoom(data.room);
      setError("");
    } catch {
      setError("불러오지 못했어요. 잠시 후 자동으로 다시 시도해요");
    }
  }, [code]);

  // 친구들이 담는 것을 보여 주기 위해 5초마다 새로 읽는다 (화면이 보일 때만)
  useEffect(() => {
    refresh();
    const timer = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  // 주문이 끝난 방에서는 "함께오더에 담는 중" 상태를 풀어, 다음 주문이 일반 주문으로 되게 한다
  useEffect(() => { if (room && room.status !== "OPEN") setGroupMode(null); }, [room]);

  const flash = (message: string) => { setToast(message); setTimeout(() => setToast(""), 2500); };
  const isHost = !!local.hostSecret;
  const mine = room?.participants.find(p => p.id === local.pid);
  const nameOk = name.trim().length > 0;

  async function invite() {
    const url = `${location.origin}/gbrick/group/${code}`;
    const text = `${room?.hostName ?? "친구"}님이 지브릭커피 함께오더에 초대했어요. 메뉴를 골라 주세요!`;
    try {
      if (navigator.share) { await navigator.share({ title: "지브릭커피 함께오더", text, url }); return; }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // 고객이 공유 창을 닫음
    }
    try { await navigator.clipboard.writeText(`${text}\n${url}`); flash("초대 링크를 복사했어요. 카카오톡에 붙여 넣어 보내세요"); }
    catch { flash("링크를 복사하지 못했어요. 주소창의 주소를 직접 보내 주세요"); }
  }

  function goPick() {
    if (!room || !nameOk) return;
    saveGroupName(name.trim());
    setGroupMode(code);
    // 이미 올린 메뉴가 있으면 장바구니에 미리 채워 고칠 수 있게 한다
    const items = (mine?.items ?? []).map(i => ({ menuId: i.menuId, menuName: i.menuName, quantity: i.quantity, unitPrice: i.unitPrice, options: i.options }));
    try { sessionStorage.setItem("gbrick_cart", JSON.stringify({ storeId: room.storeId, items })); } catch { /* ignore */ }
    router.push(`/gbrick/stores/${room.storeId}/menu`);
  }

  async function removeMine() {
    if (!local.pid || !local.secret) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/gbrick/group/${code}/items`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: local.pid, secret: local.secret, name: name.trim() || "손님", items: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      saveGroupLocal(code, { pid: undefined, secret: undefined }); setLocal(loadGroupLocal(code));
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "빼지 못했어요"); }
    finally { setBusy(false); }
  }

  async function orderAll() {
    if (!room || !local.hostSecret) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/gbrick/group/${code}/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostSecret: local.hostSecret }),
      });
      const data = await res.json();
      if (res.status === 409 && data.orderId) { router.push(`/gbrick/orders/${data.orderId}`); return; }
      if (!res.ok) throw new Error(data.error ?? "주문 실패");
      setGroupMode(null);
      router.push(`/gbrick/orders/${data.order.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : "주문 실패"); }
    finally { setBusy(false); }
  }

  const header = (
    <header className="flex items-center px-4 bg-white border-b border-stone-100" style={{ height: 56, paddingTop: "env(safe-area-inset-top)" }}>
      <Link href="/gbrick" className="p-1 mr-2" aria-label="홈으로">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      </Link>
      <span className="font-bold text-base" style={{ color: "#2C1A0E" }}>함께오더</span>
    </header>
  );

  if (notFound) {
    return (
      <main className="flex flex-col min-h-screen" style={{ background: "#FAF8F5" }}>{header}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="font-bold text-stone-800 text-lg">함께오더를 찾을 수 없어요</p>
          <p className="text-sm text-stone-500">링크가 만료됐거나 잘못됐어요. 방장에게 새 링크를 받아 주세요.</p>
          <Link href="/gbrick/stores" className="px-6 py-3 rounded-2xl text-sm font-bold text-white" style={{ background: "#2C1A0E" }}>매장 보러 가기</Link>
        </div>
      </main>
    );
  }
  if (!room) return <main className="min-h-screen" style={{ background: "#FAF8F5" }}>{header}<p className="text-center text-stone-400 py-16">{error || "불러오는 중..."}</p></main>;

  const ordered = room.status !== "OPEN";
  return (
    <main className="flex flex-col min-h-screen pb-40" style={{ background: "#FAF8F5" }}>
      {header}
      <div className="px-4 pt-4 flex flex-col gap-3">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-4">
          <p className="text-xs text-stone-500">주문 매장</p>
          <p className="font-bold text-stone-800 text-lg">{room.storeName}</p>
          <p className="text-sm text-stone-500 mt-1">방장 {room.hostName} · {room.participants.length}명이 담았어요</p>
        </div>

        {ordered ? (
          <div className="rounded-2xl px-4 py-4" style={{ background: "#E8F5E9", color: "#1B5E20" }}>
            <p className="font-bold">방장이 주문을 접수했어요 🎉</p>
            <p className="text-sm mt-1">{ON_SITE_PAYMENT_NOTICE}</p>
            {room.orderId && <Link href={`/gbrick/orders/${room.orderId}`} className="inline-block mt-2 text-sm font-bold underline">주문 상태 보기</Link>}
          </div>
        ) : (
          <>
            <button onClick={invite} className="w-full py-3.5 rounded-2xl text-sm font-bold text-stone-900" style={{ background: "#FEE500" }}>
              친구 초대하기 (카카오톡 등으로 링크 보내기)
            </button>
            <p className="text-xs text-stone-500 -mt-1 px-1">앱이 없는 친구도 링크로 들어와 메뉴를 고를 수 있어요. 로그인은 필요 없어요.</p>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3">
              <label htmlFor="gname" className="text-xs text-stone-500">내 이름 (친구들에게 보여요)</label>
              <input id="gname" value={name} maxLength={NAME_MAX} onChange={e => setName(e.target.value)} onBlur={() => nameOk && saveGroupName(name.trim())}
                placeholder="예: 대성" className="w-full mt-1 text-base outline-none" style={{ fontSize: 16 }} />
            </div>
          </>
        )}

        {room.participants.length === 0 && !ordered && (
          <p className="text-sm text-stone-400 text-center py-6">아직 담은 메뉴가 없어요. 내 메뉴를 먼저 담아 보세요.</p>
        )}

        {room.participants.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3" style={p.id === local.pid ? { borderColor: "#C8873A" } : undefined}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-stone-800">{p.name}{p.id === local.pid && <span className="ml-1 text-xs font-semibold" style={{ color: "#C8873A" }}>(나)</span>}</p>
              <p className="text-sm font-bold" style={{ color: "#2C1A0E" }}>{p.subtotal.toLocaleString()}원</p>
            </div>
            <ul className="mt-1.5 text-sm text-stone-600">
              {p.items.map((l, i) => <li key={i}>{l.menuName} × {l.quantity}{l.options.length > 0 && <span className="text-stone-400"> · {optionText(l)}</span>}</li>)}
            </ul>
          </div>
        ))}

        {error && <p role="alert" className="text-sm px-3 py-2 rounded-xl" style={{ background: "#FEF3F2", color: "#B42318" }}>{error}</p>}
        {toast && <p role="status" className="text-sm px-3 py-2 rounded-xl text-center" style={{ background: "#FFF6E5", color: "#5A3E22" }}>{toast}</p>}
      </div>

      {!ordered && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white border-t border-stone-100 px-4 pt-3 pb-24" style={{ maxWidth: 480 }}>
          <div className="flex gap-2">
            <button onClick={goPick} disabled={!nameOk || busy} className="flex-1 py-3.5 rounded-2xl text-sm font-bold disabled:opacity-40"
              style={{ background: "#F4C430", color: "#1A0E05" }}>{mine ? "내 메뉴 고치기" : "내 메뉴 담기"}</button>
            {mine && <button onClick={removeMine} disabled={busy} className="px-4 py-3.5 rounded-2xl text-sm font-semibold border border-stone-200 text-stone-600">빼기</button>}
          </div>
          {isHost ? (
            <button onClick={orderAll} disabled={busy || room.participants.length === 0} className="w-full mt-2 py-3.5 rounded-2xl text-white text-sm font-bold disabled:opacity-40" style={{ background: "#2C1A0E" }}>
              {busy ? "주문 중..." : `함께 주문하기 · ${room.total.toLocaleString()}원`}
            </button>
          ) : (
            <p className="text-xs text-stone-500 text-center mt-2">방장이 주문하면 이 화면에 알려드려요.</p>
          )}
          {isHost && <p className="text-xs text-stone-500 text-center mt-1.5">{ON_SITE_PAYMENT_NOTICE} (방장이 한 번에 결제)</p>}
        </div>
      )}
    </main>
  );
}
