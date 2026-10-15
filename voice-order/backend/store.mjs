// ORDER 저장소 — MVP는 JSON 파일 하나. 향후 GBRICK AI OS의 ORDER 테이블로 교체할 자리.
import fs from 'node:fs';
import path from 'node:path';

export function createJsonStore(filePath) {
  let records = [];
  if (fs.existsSync(filePath)) {
    records = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
  }

  function persist() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(records, null, 2));
    fs.renameSync(tmp, filePath); // 쓰다가 꺼져도 파일이 깨지지 않게
  }

  return {
    all: () => records,
    get: (id) => records.find((r) => r.id === id) || null,
    findByOrderId: (orderId) => records.find((r) => r.order_id === orderId) || null,
    insert(record) {
      records.push(record);
      persist();
      return record;
    },
    update(id, patch) {
      const r = records.find((x) => x.id === id);
      if (!r) return null;
      Object.assign(r, patch);
      persist();
      return r;
    },
  };
}

export { createMemoryStore } from './memoryStore.mjs';
