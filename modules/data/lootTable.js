// modules/data/lootTable.js

// Định nghĩa xác suất rơi vật phẩm cho từng kẻ thù
export const lootTable = {
    "Slime": [
        { itemId: "Rusty Sword", chance: 0.10 },   // 10% cơ hội rơi
        { itemId: "Cloth Hat", chance: 0.05 },     // 5% cơ hội rơi
    ],
    "Goblin": [
        { itemId: "Iron Axe", chance: 0.08 },
        { itemId: "Leather Vest", chance: 0.05 },
        { itemId: "Wooden Shield", chance: 0.15 },
    ],
    // Mặc định: xác suất 0 nếu không có trong bảng
};