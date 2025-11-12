// data/uniqueItems.js

// Vật phẩm UNIQUE có sellValue cao hơn vật phẩm thường (ví dụ: 50 Vàng)
export const uniqueItems = {
    "Goblin Crown": {
        id: "Goblin Crown",
        slot: "head",
        rarity: "Unique",
        sellValue: 50,
        stats: {
            attack: 5,
            defense: 5,
            maxHP: 20
        }
    },
    "Beast Hide Armor": {
        id: "Beast Hide Armor",
        slot: "chest",
        rarity: "Unique",
        sellValue: 120,
        stats: {
            attack: 0,
            defense: 15,
            maxHP: 50
        }
    }
    // Thêm các vật phẩm unique khác
};