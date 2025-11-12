// modules/data/items.js

/**
 * Định nghĩa Độ hiếm (Rarity) và Hệ số nhân/Xác suất rơi của chúng.
 */
export const RARITIES = {
    'Common': { name: 'Thường', multiplier: 1.0, color: 'text-gray-500', baseChance: 0.65 }, // 65%
    'Uncommon': { name: 'Hiếm', multiplier: 1.2, color: 'text-green-500', baseChance: 0.25 }, // 25%
    'Rare': { name: 'Siêu Hiếm', multiplier: 1.5, color: 'text-blue-500', baseChance: 0.08 }, // 8%
    'Epic': { name: 'Sử Thi', multiplier: 2.0, color: 'text-purple-500', baseChance: 0.019 }, // 1.9%
    'Legendary': { name: 'Huyền Thoại', multiplier: 3.0, color: 'text-yellow-500', baseChance: 0.001 } // 0.1%
};

/**
 * Định nghĩa các loại Slot mà Anh hùng CÓ THỂ sử dụng.
 * Lưu ý: Danh sách này cần đồng nhất với equipSlots trong data/equips.js
 */
export const EQUIP_SLOTS = ["mainHand", "offHand", "chest", "head", "amulet", "ring1", "ring2"];

/**
 * Định nghĩa TEMPLATE cho các loại Trang bị:
 * - slots: Các slot mà item loại này có thể chiếm giữ.
 * - baseStats: Các chỉ số cơ bản luôn xuất hiện trên loại item này.
 */
export const EQUIPMENT_TEMPLATES = {
    'Weapon': {
        slots: ['mainHand'],
        // Weapons may grant small STR or DEX bonuses and base crit chance
    baseStats: { attack: 1, critChance: 0.01, str: 0, dex: 0, critMultiplier: 0, attackSpeed: 0 },
        namePrefixes: ['Kiếm', 'Rìu', 'Chùy', 'Cây Đũa', 'Cung'],
    },
    'Shield': {
        slots: ['offHand'], // Hoặc offHand nếu Hero có thể cầm Khiên
        baseStats: { defense: 2, maxHP: 0 },
        namePrefixes: ['Khiên Gỗ', 'Khiên Sắt', 'Tấm Chắn'],
    },
    'Armor': {
        slots: ['chest', 'legs'], // Ví dụ thêm slot Legs
        baseStats: { defense: 1, maxHP: 5 },
        namePrefixes: ['Áo Giáp', 'Áo Da', 'Áo Vải'],
    },
    'Head': {
        slots: ['head'],
        baseStats: { defense: 0.5, maxHP: 2 },
        namePrefixes: ['Mũ', 'Mão', 'Mũ Giáp'],
    },
    'Accessory': {
        slots: ['ring1', 'ring2', 'amulet'],
        // Accessories are a good place for LUX and small stat bumps
        baseStats: { attack: 0.5, maxHP: 2, defense: 0.5, lux: 0, str: 0, dex: 0 },
        namePrefixes: ['Nhẫn', 'Mặt Dây', 'Bùa Hộ Mệnh'],
    }
};

/**
 * Danh sách các loại vật phẩm có thể rơi ra (Chỉ dùng cho logic generateLoot).
 * ✨ ĐÃ SỬA: Thêm 'Consumable' vào danh sách.
 */
export const ITEM_TYPES = ['Weapon', 'Shield', 'Armor', 'Head', 'Accessory', 'Consumable']; 

/**
 * Định nghĩa TEMPLATE cho các loại Vật phẩm Tiêu hao (Potions):
 * - effect: Tác dụng chính của vật phẩm (để hero.js xử lý).
 * - value: Giá trị của tác dụng (ví dụ: 50 HP).
 * ✨ ĐÃ THÊM: Định nghĩa Consumable Templates
 */
export const CONSUMABLE_TEMPLATES = {
    'Health Potion': {
        id: 'Health Potion',
        type: 'Consumable',
        name: 'Bình Máu Nhỏ',
        description: 'Hồi phục một lượng nhỏ Máu.',
        effect: 'healHP',
        value: 50, // Hồi 50 HP
        buyPrice: 100, // Giá mua tại Shop
        sellValue: 20 // Giá bán lại
    },
    'Greater Health Potion': {
        id: 'Greater Health Potion',
        type: 'Consumable',
        name: 'Bình Máu Lớn',
        description: 'Hồi phục một lượng lớn Máu.',
        effect: 'healHP',
        value: 200, // Hồi 200 HP
        buyPrice: 500, 
        sellValue: 100
    }
};