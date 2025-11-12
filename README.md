GAME DESIGN DOCUMENT – Dungeon Idle RPG (Web)
I. Tổng quan dự án
Tên game (tạm): Dungeon Idle: Endless Depths
Thể loại: Idle RPG / Auto Dungeon / Incremental Adventure
Nền tảng: Web (HTML5 + JavaScript + Canvas)
Phong cách đồ họa: Pixel 2D / Retro Minimal
Mục tiêu: Hero tự động chiến đấu trong dungeon, người chơi tập trung nâng cấp, thu thập và chinh phục độ sâu vô tận.
II. Cốt truyện & bối cảnh
Trong một thế giới bị phong ấn dưới lòng đất, vô số dungeon được sinh ra từ năng lượng hỗn mang. 
Người chơi – một anh hùng đánh mất ký ức – bước vào “Hầm Vĩnh Hằng”, nơi mỗi tầng mở ra một ký ức, một boss, và một phần sức mạnh bị lãng quên.
Càng đi sâu, sức mạnh hỗn loạn càng tăng, nhưng cũng ẩn chứa cơ hội trở thành truyền thuyết bất tử.
III. Nhân vật & chỉ số
Hero có thể chọn Class ban đầu: Warrior, Mage, Rogue. Mỗi class có kỹ năng riêng.
Chỉ số: HP, ATK, DEF, SPD, CRIT, LIFESTEAL, EXP, GOLD.
Khi đạt Lv100 có thể Ascend để reset và tăng chỉ số vĩnh viễn.
IV. Hệ thống chiến đấu
Chiến đấu tự động. Mỗi vòng hero và enemy tấn công dựa theo SPD.
Damage = ATK - (enemy.DEF / 2). CRIT x2 sát thương.
Hero có 3 skill chủ động và 2 bị động.
Boss xuất hiện ở tầng cuối, có cơ chế đặc biệt và drop relic.
V. Dungeon System
Mỗi dungeon có 10 tầng, 3-5 trận/tầng.
Hoàn thành dungeon để mở dungeon mới và nhận Relic.
Các loại dungeon: Cave of Slimes, Crypt of Bones, Inferno Keep, Frost Hollow, Abyss.
Mỗi dungeon có quái và hiệu ứng riêng.
VI. Hệ thống vật phẩm
Trang bị gồm: Weapon, Armor, Ring, Amulet.
Độ hiếm: Common → Legendary. Có thể roll chỉ số ngẫu nhiên.
Relic là phần thưởng boss, tăng chỉ số vĩnh viễn.
Ví dụ: Soul of Flame (+10% Fire Damage), Iron Will (+5% DEF khi chết).
VII. Idle & Meta Progression
Hệ thống Idle nhận vàng/exp khi offline (tối đa 12h).
Prestige: reset toàn bộ dungeon, giữ relic và buff vĩnh viễn.
Base Upgrade: Training Hall, Blacksmith, Alchemy, Archive.
VIII. Kẻ thù (Enemy/Boss)
Ví dụ:
- Slime: HP cao, atk thấp, Poison Hit.
- Skeleton: Crit cao, Bone Slash.
- Goblin King: Boss, gọi minion, Rage Strike.
- Fire Golem: Burn + AoE.
- Frost Lich: Freeze, Ice Nova.
IX. Cấu trúc kỹ thuật
Cấu trúc module:
hero.js – Hero stats & skill
enemy.js – Enemy data
combat.js – Auto battle logic
dungeon.js – Dungeon generation
loot.js – Drop system
save.js – Save/Load progress
ui.js – Overlay & menu
game.js – Render & main loop
X. Kinh tế & Tiến trình
Gold: nâng cấp đồ
Exp: tăng level
Essence: buff vĩnh viễn
Relic: thưởng boss
Material: nâng cấp trang bị
XI. Mở rộng tương lai
- Pet System
- Guild System
- Daily Dungeon
- PVP Ranking
- Story Event
XII. Phong cách hình ảnh & âm thanh
Đồ họa pixel, hiệu ứng light và damage float.
Âm thanh nhẹ nhàng, SFX cho hit, drop, level up.
Phong cách gothic retro.
XIII. Lộ trình phát triển
Alpha v0.1 – Combat + Dungeon cơ bản
Alpha v0.2 – Loot + Level + UI overlay
Beta v0.3 – Relic + Ascension + Save
v1.0 – Full content + Idle system + UI polish
v1.1 – Event Dungeon + Pet system
XIV. Triết lý thiết kế
“Game idle nhưng không nhàm chán.”
Người chơi luôn có điều gì đó để tối ưu: build hero, chọn relic, cân đối trang bị, hoặc lên kế hoạch prestige.
Thưởng thức quá trình phát triển, không chỉ kết quả.

