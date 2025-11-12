// modules/loot.js

import { hero } from './game.js'; // Cần để biết cấp độ Hero
import { RARITIES, EQUIPMENT_TEMPLATES, ITEM_TYPES } from './data/items.js'; 
import { uniqueItems } from './data/uniqueItems.js'; // ✨ IMPORT MỚI: Dữ liệu vật phẩm unique
import { dungeonList } from './data/dungeons.js'; // ✨ IMPORT MỚI: Dữ liệu dungeon

/**
 * 1. Chọn độ hiếm ngẫu nhiên dựa trên xác suất.
 * @returns {string} ID của độ hiếm (ví dụ: 'Rare').
 */
function chooseRarity(isBoss = false) {
    // Rarity weights tuned so that Rare+/Epic/Legendary only appear from bosses
    if (!isBoss) {
        return Math.random() < 0.85 ? 'Common' : 'Uncommon';
    }

    // Boss rarity weights (sums to 1)
    const weights = [
        ['Common', 0.60],
        ['Uncommon', 0.25],
        ['Rare', 0.10],
        ['Epic', 0.04],
        ['Legendary', 0.01]
    ];

    let r = Math.random();
    for (const [key, w] of weights) {
        if (r < w) return key;
        r -= w;
    }
    return 'Common';
}

/**
 * 2. Tạo một vật phẩm mới.
 * @param {number} heroLevel - Cấp độ hiện tại của Hero.
 * @param {boolean} [isBoss=false] - Cờ chỉ định có phải đang rơi vật phẩm Boss không.
 * @param {object} [currentDungeon=null] - Đối tượng Dungeon hiện tại.
 * @returns {object|null} Vật phẩm đã tạo (Unique hoặc ngẫu nhiên), hoặc null nếu không rơi.
 */
export function generateLoot(heroLevel, isBoss = false, currentDungeon = null) {
    
    // =======================================================
    // A. LOGIC RƠI VẬT PHẨM UNIQUE TỪ BOSS
    // =======================================================
    if (isBoss && currentDungeon) {
        const uniqueItemId = currentDungeon.bossItemDrop;
        // Tỷ lệ rơi vật phẩm unique (ví dụ: 50%)
        const dropChance = 0.5; 
        
        if (uniqueItemId && uniqueItems[uniqueItemId] && Math.random() < dropChance) {
            // Trả về bản sao của vật phẩm unique
            return { ...uniqueItems[uniqueItemId], rarity: 'Unique' };
        }
        
        // Nếu không rơi Unique, có thể rơi vật phẩm thường (boss có ưu thế)
    }

    // =======================================================
    // B. LOGIC RƠI VẬT PHẨM NGẪU NHIÊN (Kẻ thù thường hoặc Boss thất bại khi rơi Unique)
    // =======================================================
    
    // Tỷ lệ KHÔNG rơi đồ (boss ít khi không rơi, thường có drop)
    const NO_DROP_CHANCE = isBoss ? 0.35 : 0.7; // Non-boss: 70% no-drop, Boss: 35% no-drop
    if (Math.random() < NO_DROP_CHANCE) {
        return null;
    }
    
    // --- BƯỚC 1: XÁC ĐỊNH LOẠI VÀ ĐỘ HIẾM ---\
    
    const itemType = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    const template = EQUIPMENT_TEMPLATES[itemType];
    
    if (!template) return null;

    const itemRarityId = chooseRarity(isBoss);
    const rarity = RARITIES[itemRarityId];
    
    // Hệ số nhân ngẫu nhiên (dao động nhỏ)
    const variance = (Math.random() * 0.2) + 0.9; // Từ 0.9 đến 1.1

    // --- BƯỚC 2: TÍNH TOÁN CHỈ SỐ ---\
    
    let stats = {};
    const baseValue = heroLevel * 5; // Giá trị cơ sở tính theo cấp độ
    
    for (const stat in template.baseStats) {
        // Giá trị cơ sở của item + (Giá trị theo cấp độ * Hệ số Rarity * Dao động)
        let raw = template.baseStats[stat] + (baseValue * rarity.multiplier * variance);

        // Các chỉ số 'primary' như str/dex/int/lux nên nhỏ hơn: áp dụng hệ số tỉ lệ
        const smallStatScale = { str: 0.12, dex: 0.12, int: 0.12, lux: 0.08 };

        if (stat in smallStatScale) {
            stats[stat] = Math.max(0, Math.round(raw * smallStatScale[stat]));
            continue;
        }

        // Các hệ số như critChance / attackSpeed / critMultiplier giữ giá trị thập phân
        if (stat.toLowerCase().includes('chance') || stat.toLowerCase().includes('multiplier') || stat.toLowerCase().includes('speed')) {
            // nhỏ hơn, lấy 2 chữ số thập phân
            stats[stat] = Number((raw * 0.01).toFixed(2));
            continue;
        }

        // Mặc định: làm tròn số nguyên
        stats[stat] = Math.round(raw);
    }
    
    // --- BƯỚC 3: TẠO VẬT PHẨM HOÀN CHỈNH ---\
    
    // Tên ngẫu nhiên
    const prefix = template.namePrefixes[Math.floor(Math.random() * template.namePrefixes.length)];
    const itemName = `${prefix} [Lv.${heroLevel}]`;

    // Chọn ngẫu nhiên một slot từ template (vì 1 loại item có thể có nhiều slot)
    const slot = template.slots[Math.floor(Math.random() * template.slots.length)];
    
    // Giá trị bán: Level * Rarity Multiplier * 20 (ví dụ)
    const sellValue = Math.round(heroLevel * rarity.multiplier * 20);

    return {
        id: itemName,
        name: itemName,
        type: itemType,
        slot: slot,
        rarity: itemRarityId, // use key (Common, Rare, etc.)
        stats: stats,
        sellValue: sellValue, // Giá trị bán
    };
}