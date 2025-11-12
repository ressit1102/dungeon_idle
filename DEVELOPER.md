DEVELOPER GUIDE — Dungeon Idle (quick operations)

Mục đích
--------
Tài liệu này cung cấp hướng dẫn nhanh cho lập trình viên: cách chạy bản local, debug, chạy mô phỏng headless để tuning và vị trí các tham số cân bằng chính.

Môi trường
----------
- OS: Linux / macOS / Windows
- Node.js (v16+)
- Git
- Optional: Python3 (để serve tĩnh nhanh) hoặc npm package `http-server` (npx http-server)

Quick start (chạy local)
-------------------------
1) Mở terminal trong thư mục dự án (nơi có `index.html`).

2) Chạy static server tạm:

```bash
# Python3
python3 -m http.server 8000
# hoặc (nếu đã cài):
npx http-server -c-1 -p 8000
```

3) Mở trình duyệt: http://127.0.0.1:8000

File entry: `index.html` (load `main.js` as ES module)

Tệp quan trọng (quick file map)
-------------------------------
- modules/game.js — core state, spawn, cập nhật UI
- modules/hero.js — hero class, tính toán stats, equip/unequip
- modules/enemy.js — enemy class and stat scaling
- modules/combat.js — combat math & constants (DEFENSE_EFFECTIVENESS, DAMAGE_VARIANCE, BOSS_DEFENSE_BYPASS, HERO_ATTACK_MULT)
- modules/loot.js — loot generation and rarity logic
- modules/menu.js — UI renderers (upgrade, dungeon, quest)
- modules/debug.js — debug/test panel (nếu có)
- modules/data/*.js — templates & constants: enemies, items, equips, quests, upgrades
- modules/save.js — save/load to localStorage
- tools/simulate.mjs — headless simulator for win-rate
- tools/sweep.mjs, tools/sweep2.mjs — parameter sweep helpers

Debug & runtime hooks
---------------------
- Global UI handlers used in HTML: `window.updateUI`, `window.handleUnequip`, etc. (set in `main.js`)
- Debug panel (`modules/debug.js`) exposes quick actions to add gold, simulate kills, and set balance via `setCombatBalance`.

Simulator / Balance tools
-------------------------
Tệp: `tools/simulate.mjs`
- Usage: `node tools/simulate.mjs <simulations> <heroLevel>`
- Example: `node tools/simulate.mjs 1000 1` — chạy 1000 fights với hero level 1 và in win rate

Các script sweep (coarse/fine):
- `node tools/sweep.mjs` — sweep trên DEFENSE_EFFECTIVENESS, DAMAGE_VARIANCE, BOSS_DEFENSE_BYPASS (coarse grid)
- `node tools/sweep2.mjs` — sweep hero attack multiplier vs boss multiplier

Gợi ý workflow tuning
----------------------
1. Thay một tham số trong `modules/combat.js` hoặc `modules/enemy.js`.
2. Chạy mô phỏng nhanh: `node tools/simulate.mjs 1000 1` để thu win-rate.
3. Nếu cần sweep tự động, sử dụng `tools/sweep.mjs` / `tools/sweep2.mjs` để tìm candidate.
4. Áp tham số vào code và chơi thử trên trình duyệt.

Các tham số cân bằng chính
---------------------------
- `modules/combat.js`
  - DEFENSE_EFFECTIVENESS: phần trăm phòng thủ thực sự có hiệu lực (0..1)
  - DAMAGE_VARIANCE: biến thiên sát thương (0..1)
  - BOSS_DEFENSE_BYPASS: boss bỏ qua % phòng thủ
  - HERO_ATTACK_MULT: nhân sát thương hero (tùy chỉnh để nhanh đạt target balance)

- `modules/enemy.js`
  - bossMultiplier: multiplier áp cho HP/ATK/DEF của Boss
  - level scaling (ví dụ: 12% per level)

- `modules/loot.js` / `modules/data/items.js`
  - RARITIES: cấu hình rơi đồ
  - ITEM_TEMPLATES: template base stats (bổ sung STR/DEX/LUX, crit% …)

Mẹo debug (browser)
--------------------
- Mở DevTools → Console để xem lỗi. Game log cũng ghi vào DOM `#game-log`.
- Nếu gặp lỗi import hoặc module không load, kiểm tra đường dẫn file và header trả về (dùng `curl -I http://127.0.0.1:8000/main.js`).
- Để test changes nhanh: sửa module, refresh trình duyệt (module caching có thể require hard-refresh).

Thực thi/smoke tests (dev)
--------------------------
Bạn có thể chạy các lệnh dưới đây để kiểm tra nhanh tính năng:

```bash
# Smoke test: run a small simulation
node tools/simulate.mjs 200 1

# Full smoke: 1000 sims
node tools/simulate.mjs 1000 1

# Run sweep (coarse)
node tools/sweep.mjs

# Run sweep2
node tools/sweep2.mjs
```

(Trong repo hiện tại, mình đã hoàn thiện workflow tuning và có file simulate + sweep sẵn.)

Optional: package.json (gợi ý)
------------------------------
Bạn có thể thêm `package.json` để tiện hóa scripts. Gợi ý nhanh:

```json
{
  "name": "dungeon_idle",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "npx http-server -c-1 -p 8000",
    "sim": "node tools/simulate.mjs",
    "sweep": "node tools/sweep.mjs"
  },
  "devDependencies": {
    "http-server": "^14.0.0"
  }
}
```

Contribution notes
------------------
- Fork/branch, code changes, open PR. Keep changes small and focused.
- When tuning, always include the simulation command and output in PR description so reviewers can reproduce.

Known caveats
-------------
- Changing combat constants affects player experience and may make previous saves feel different. Consider versioning if you deploy persisted saves to players.
- Randomness: simulate runs have noise — use >=1000 sims for stable estimates.

If bạn muốn, tôi có thể:
- Thêm `package.json` và commit.
- Thêm GitHub Actions workflow (smoke test run of `node tools/simulate.mjs 200 1`).
- Move developer content into `DEVELOPER.md` (đã làm) and also update `README.md` to link to it.

---
*Created by the development assistant — contact contributor for clarifications.*
