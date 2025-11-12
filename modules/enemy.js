// modules/enemy.js

import { enemyList } from './data/enemies.js';

export class Enemy { 
    /**
     * @param {string} type - Loại kẻ thù (ví dụ: 'Goblin')
     * @param {number} level - Cấp độ của Dungeon/Kẻ thù
     * @param {boolean} [isBoss=false] - Cờ chỉ định đây có phải là Boss không
     */
    constructor(type, level = 1, isBoss = false) {
        this.baseType = type;
        this.isBoss = isBoss;
        // Ensure effects array exists even if data missing
        this.effects = [];
        
        // 1. Lấy Base Stats
        const baseStats = enemyList[type];

        if (!baseStats) {
            console.error(`Lỗi: Không tìm thấy stats cho loại kẻ thù: ${type}`);
            // Khởi tạo stats mặc định an toàn để tránh lỗi NaN
            this.stats = { currentHP: 1, maxHP: 1, attack: 1, defense: 0, goldDrop: [0,0], xpDrop: 0 };
            // ensure effects is present
            this.effects = [];
            // still set a readable name
            this.type = `${type} (Lv ${level})`;
            return;
        }

        // 2. Tính toán Stats dựa trên Level
    // Tăng nhẹ theo level (12% mỗi level) và boss multiplier nhẹ hơn để cân bằng
    const levelMultiplier = 1 + (level - 1) * 0.12; // ~12% stats mỗi level
    const bossMultiplier = isBoss ? 1.4 : 1; // Boss mạnh hơn ~1.4 lần (reduced for balance)

        // SỬA LỖI NaN: Đảm bảo các chỉ số là số và có giá trị mặc định
    // Sử dụng các khóa đúng từ data/enemies.js (baseHP, baseAttack, baseDefense)
    const baseHP = baseStats.baseHP || 10;
    const baseAttack = baseStats.baseAttack || 5;
    const baseDefense = baseStats.baseDefense || 0;

        // 3. Khởi tạo Final Stats
        this.stats = {
            // Tính toán chỉ số Max HP, Attack, Defense dựa trên cấp độ và Boss multiplier
            maxHP: Math.floor(baseHP * levelMultiplier * bossMultiplier),
            attack: Math.floor(baseAttack * levelMultiplier * bossMultiplier),
            defense: Math.floor(baseDefense * levelMultiplier * bossMultiplier),
            
            // Các chỉ số khác (nếu có)
            goldDrop: Array.isArray(baseStats.goldDrop) ? baseStats.goldDrop : [0,0],
            xpDrop: (typeof baseStats.xpDrop === 'number' ? baseStats.xpDrop : 0) * bossMultiplier,
            
            // Current HP phải bằng Max HP khi khởi tạo
            currentHP: 0, // Sẽ được gán lại ở dòng dưới
        };

        this.stats.currentHP = this.stats.maxHP;
    // Temporary effects (debuffs/buffs) applied during combat
    this.effects = [];
        // Copy any data-driven mechanics from the base definition (boss behavior)
        this.mechanics = baseStats.mechanics || {};
        
        // Cập nhật tên Boss
        if (isBoss) {
            this.type = `BOSS: ${type} (Lv ${level})`;
        } else {
            this.type = `${type} (Lv ${level})`;
        }
    }

    /**
     * Hero gây sát thương lên kẻ thù
     * @param {number} rawDamage - Sát thương thô từ Hero
     * @returns {number} Sát thương thực tế đã chịu
     */
    takeDamage(rawDamage) {
        // Đảm bảo rawDamage là số và tối thiểu là 0
        const damage = Number(rawDamage) || 0; 
        
    // Consider any defense modifiers from effects (e.g., debuffs)
    const defenseModifier = this.getDefenseModifierFromEffects();
    const effectiveDefense = (this.stats.defense || 0) + defenseModifier;
    // Tính toán sát thương thực tế
    let actualDamage = Math.max(1, damage - Math.max(0, effectiveDefense)); 
        
        // Giảm HP
        this.stats.currentHP -= actualDamage;
        
        if (this.stats.currentHP < 0) {
            this.stats.currentHP = 0;
        }
        
        return actualDamage;
    }

    isAlive() {
        return this.stats.currentHP > 0;
    }

    addEffect(effect) {
        this.effects.push(Object.assign({}, effect));
    }

    getDefenseModifierFromEffects() {
        let add = 0;
        for (const e of this.effects) {
            if (e.defenseAdd) add += e.defenseAdd;
        }
        return add;
    }

    getAttackMultiplierFromEffects() {
        let mult = 1;
        for (const e of this.effects) {
            if (e.attackMult) mult *= e.attackMult;
        }
        return mult;
    }

    tickEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const e = this.effects[i];
            if (e.duration !== undefined) {
                e.duration -= 1;
                if (e.duration <= 0) this.effects.splice(i, 1);
            }
        }
    }
}