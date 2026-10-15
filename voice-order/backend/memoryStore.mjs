// 메모리 저장소 — 테스트와 웹 체험판(브라우저)에서 쓴다. Node 전용 모듈을 쓰지 않는다.
// onChange: 바뀔 때마다 호출 (웹 체험판은 여기서 localStorage에 저장)
export function createMemoryStore(initial = [], onChange = () => {}) {
  const records = [...initial];
  return {
    all: () => records,
    get: (id) => records.find((r) => r.id === id) || null,
    findByOrderId: (orderId) => records.find((r) => r.order_id === orderId) || null,
    insert(r) {
      records.push(r);
      onChange(records);
      return r;
    },
    update(id, patch) {
      const r = records.find((x) => x.id === id);
      if (!r) return null;
      Object.assign(r, patch);
      onChange(records);
      return r;
    },
  };
}
