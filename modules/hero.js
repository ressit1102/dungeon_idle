// modules/hero.js

import { initialHeroStats } from './data/characters.js';
import { equipSlots } from './data/equips.js';
import { checkQuestProgress } from './quest.js';
const MAX_INVENTORY_SIZE = 20;

export class Hero {
    constructor(name, loadedData = null) {
        
        // 1. Khởi tạo trạng thái cơ bản/mặc định
        this.baseStats = { ...initialHeroStats, name: name || 'Anh Hùng' };
        this.inventory = []; 
    this.upgrades = { attack: 0, defense: 0, maxHP: 0, str: 0, dex: 0, int: 0, lux: 0 };
        this.equipment = {};
        equipSlots.forEach(slot => { this.equipment[slot] = null; });
        
        // 2. TÁI TẠO TRẠNG THÁI TỪ DỮ LIỆU ĐÃ LƯU (Nếu có)
        if (loadedData) {
            // Tải chỉ số cơ bản (Level, Gold, XP)
            this.baseStats = { ...this.baseStats, ...loadedData }; 
			// ✨ BƯỚC QUAN TRỌNG: Đảm bảo HP hiện tại được tải
            this.baseStats.currentHP = loadedData.currentHP !== undefined 
                                     ? loadedData.currentHP 
                                     : loadedData.maxHP || this.baseStats.maxHP;
            // Tải các nâng cấp
            this.upgrades = loadedData.upgrades || this.upgrades;
            // Tải kho đồ
            this.inventory = loadedData.inventory || [];
            // Tải trang bị (Sử dụng 'equipment' hoặc 'equips' để tương thích)
            this.equipment = loadedData.equipment || loadedData.equips || this.equipment; 
            
            // Cần đảm bảo HP hiện tại được tải đúng cách, nếu không, sẽ sử dụng giá trị mặc định
            if (this.baseStats.currentHP > this.baseStats.maxHP) {
                this.baseStats.currentHP = this.baseStats.maxHP;
            }
        }
        
        // 3. Thiết lập class và kỹ năng trước khi tính toán chỉ số (passive skills may modify stats)
        this.baseStats.class = this.baseStats.class || 'Warrior';
        this.skills = { actives: [], passives: [] };
        this.effects = []; // temporary buffs/debuffs during combat
        this.initSkills();

        // 4. Tính toán chỉ số cuối cùng
        this.calculateStats();
    }

    /**
     * Initialize skills based on hero class. Each skill has id, name, cooldown, currentCooldown, and effect descriptor.
     */
    initSkills() {
        const klass = (this.baseStats.class || 'Warrior').toLowerCase();
        const actives = [];
        const passives = [];

        if (klass === 'mage') {
            actives.push({ id: 'fireball', name: 'Fireball', cooldown: 2, currentCooldown: 0, effect: { type: 'damage', multiplier: 2.0 } });
            actives.push({ id: 'frost_nova', name: 'Frost Nova', cooldown: 4, currentCooldown: 0, effect: { type: 'damage', multiplier: 1.2, debuff: { target: 'enemy', attackMult: 0.85, duration: 2 } } });
            actives.push({ id: 'meteor', name: 'Meteor', cooldown: 6, currentCooldown: 0, effect: { type: 'damage', multiplier: 3.2 } });
            passives.push({ id: 'arcane_surge', name: 'Arcane Surge', unlockLevel: 6, applied: false, bonuses: { critChance: 0.06 } });
        } else {
            // Default: Warrior
            actives.push({ id: 'slash', name: 'Slash', cooldown: 2, currentCooldown: 0, effect: { type: 'damage', multiplier: 1.8 } });
            actives.push({ id: 'rage', name: 'Rage', cooldown: 5, currentCooldown: 0, effect: { type: 'buff', buff: { attackMult: 1.4, duration: 3 } } });
            actives.push({ id: 'shield_bash', name: 'Shield Bash', cooldown: 4, currentCooldown: 0, effect: { type: 'damage', multiplier: 1.0, debuff: { target: 'enemy', defenseAdd: -2, duration: 2 } } });
            passives.push({ id: 'iron_skin', name: 'Iron Skin', unlockLevel: 4, applied: false, bonuses: { defense: 4 } });
        }

        this.skills.actives = actives;
        this.skills.passives = passives;
    }

    /**
     * Get active skill by id
     */
    getActiveSkill(id) {
        return this.skills.actives.find(s => s.id === id);
    }

    /**
     * Use a skill if available. Returns the skill object or null if can't use.
     */
    useSkill(skillId) {
        const skill = this.getActiveSkill(skillId);
        if (!skill) return null;
        if (skill.currentCooldown && skill.currentCooldown > 0) return null;
        // set cooldown
        skill.currentCooldown = skill.cooldown;
        return skill;
    }

    /**
     * Called each combat turn to decrement cooldowns and expire effects
     */
    tickTurn() {
        // cooldowns
        for (const s of this.skills.actives) {
            if (s.currentCooldown && s.currentCooldown > 0) s.currentCooldown = Math.max(0, s.currentCooldown - 1);
        }

        // effects durations
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const e = this.effects[i];
            if (e.duration !== undefined) {
                e.duration -= 1;
                if (e.duration <= 0) this.effects.splice(i, 1);
            }
        }
    }

    /**
     * Apply a temporary effect to hero
     */
    addEffect(effect) {
        this.effects.push(Object.assign({}, effect));
    }

    /**
     * Compute attack multiplier from active effects
     */
    getAttackMultiplierFromEffects() {
        let mult = 1;
        for (const e of this.effects) {
            if (e.attackMult) mult *= e.attackMult;
        }
        return mult;
    }

    /**
     * Compute defense additive from passives and active effects
     */
    getDefenseBonusFromPassives() {
        let add = 0;
        for (const p of this.skills.passives) {
            if (p.applied && p.bonuses && p.bonuses.defense) add += p.bonuses.defense;
        }
        for (const e of this.effects) {
            if (e.defenseAdd) add += e.defenseAdd;
        }
        return add;
    }
    
    /**
     * Thêm một vật phẩm vào kho đồ (inventory).
     * @param {object} item - Vật phẩm (object) được tạo bởi generateLoot.
     * @returns {boolean} True nếu thêm thành công, False nếu kho đồ đầy.
     */
    addItemToInventory(item) {
        if (this.inventory.length >= MAX_INVENTORY_SIZE) {
            // Kho đồ đầy
            return false;
        }
        
        // Gán một ID duy nhất cho vật phẩm (để dễ dàng quản lý khi bán/trang bị)
        item.uniqueId = Date.now() + Math.random().toString(36).substring(2, 9); 
        
        this.inventory.push(item);

        // Kích hoạt logic nhiệm vụ 'collect_rare_gear' (nếu cần)
        // checkQuestProgress('collectRareGear', item); 

        return true;
    }

    /**
     * Tính toán chỉ số cuối cùng (Base Stats + Equip Stats)
     */
    calculateStats() {
        // Sao chép baseStats (là chỉ số GỐC đã có Level và Upgrades)
        let totalStats = { ...this.baseStats };

        // Ensure new stats exist on the total object (safety defaults)
        totalStats.str = totalStats.str || 0;
        totalStats.dex = totalStats.dex || 0;
        totalStats.int = totalStats.int || 0;
        totalStats.lux = totalStats.lux || 0;
        totalStats.attackSpeed = totalStats.attackSpeed || 1.0;
        totalStats.critChance = totalStats.critChance || 0.05;
        totalStats.critMultiplier = totalStats.critMultiplier || 1.5;

        // Cộng dồn chỉ số từ trang bị
        for (const slot in this.equipment) {
            const item = this.equipment[slot];
            if (item && item.stats) {
                totalStats.attack += item.stats.attack || 0;
                totalStats.defense += item.stats.defense || 0;
                totalStats.maxHP += item.stats.maxHP || 0;
                // Aggregate new stat types if present on equipment
                totalStats.str += item.stats.str || 0;
                totalStats.dex += item.stats.dex || 0;
                totalStats.int += item.stats.int || 0;
                totalStats.lux += item.stats.lux || 0;
                // Some equipment templates may provide critChance / attackSpeed
                totalStats.attackSpeed += item.stats.attackSpeed || 0;
                totalStats.critChance += item.stats.critChance || 0;
                totalStats.critMultiplier += item.stats.critMultiplier || 0;
            }
        }

        // Áp dụng passive bonuses nếu đã unlock theo level
        if (this.skills && Array.isArray(this.skills.passives)) {
            for (const p of this.skills.passives) {
                if (p.unlockLevel && this.baseStats.level >= p.unlockLevel) {
                    if (!p.applied) p.applied = true;
                }
                if (p.applied && p.bonuses) {
                    // Apply each bonus if present
                    if (p.bonuses.defense) totalStats.defense += p.bonuses.defense;
                    if (p.bonuses.critChance) totalStats.critChance = (totalStats.critChance || 0) + p.bonuses.critChance;
                    if (p.bonuses.attack) totalStats.attack += p.bonuses.attack;
                }
            }
        }

        this.stats = totalStats; 

        // -----------------------------
        // Derive combat helpers from primary stats
        // -----------------------------
        // Attack speed: baseline 1.0, +2% per DEX point
        const dex = Number(this.stats.dex) || 0;
        this.stats.attackSpeed = Math.max(0.1, (Number(this.stats.attackSpeed) || 1.0) + dex * 0.02);

        // Crit chance: base critChance (from gear/base) + 1% per LUX
        const lux = Number(this.stats.lux) || 0;
        this.stats.critChance = Math.min(0.95, (Number(this.stats.critChance) || 0.05) + lux * 0.01);

        // Crit multiplier: base + 5% per STR
        const str = Number(this.stats.str) || 0;
        this.stats.critMultiplier = Math.max(1.0, (Number(this.stats.critMultiplier) || 1.5) + str * 0.05);

        // Đảm bảo HP hiện tại không vượt quá Max HP mới
        this.stats.currentHP = Math.min(this.baseStats.currentHP, this.stats.maxHP);
        
        // ✨ ĐỒNG BỘ: Cập nhật baseStats.currentHP sau khi tính toán để lưu game
        this.baseStats.currentHP = this.stats.currentHP;
    }
    
    /**
     * Nâng cấp một chỉ số cơ bản vĩnh viễn bằng vàng.
     * @param {string} statKey - Chỉ số cần nâng cấp (ví dụ: 'attack').
     * @param {object} upgradeData - Dữ liệu nâng cấp từ data/upgrades.js
     * @returns {boolean} True nếu nâng cấp thành công.
     */
    upgradeStat(statKey, upgradeData) {
        const data = upgradeData[statKey];
        if (!data) return false;

        // Lấy số lần nâng cấp hiện tại (u)
        const u = this.upgrades[statKey] || 0;
        
        // 1. Tính toán Chi phí (Exponential Growth)
        // C(u) = baseCost * (1 + growth) ^ u
        // Lưu ý: Tôi đang giữ lại công thức cũ của bạn.
        const cost = Math.floor(data.baseCost * Math.pow((1 + data.costGrowth), u));

        // 2. Kiểm tra Vàng
        if (this.baseStats.gold < cost) {
            return false; // Không đủ vàng
        }
        
        // 3. Tính toán Lợi ích (Diminishing Gain)
        // Δ(u) = baseGain / (1 + gainDecay * u)
        const gain = Math.floor(data.baseGain / (1 + data.gainDecay * u));
        
        if (gain <= 0) {
            // Tránh nâng cấp nếu lợi ích đã giảm quá nhiều
            return false;
        }

        // 4. Áp dụng Nâng cấp
        this.baseStats.gold -= cost;                 // Trừ vàng
        // Cần đảm bảo statKey trong upgradeList khớp với statKey trong baseStats
        this.baseStats[statKey] += gain;             // Tăng chỉ số cơ bản
        this.upgrades[statKey] = u + 1;              // Tăng số lần nâng cấp

        // 5. Cập nhật chỉ số cuối cùng
        this.calculateStats(); 
        
        // GỌI HÀM THEO DÕI NHIỆM VỤ NÂNG CẤP
        checkQuestProgress('upgradeStat', statKey);  
        
        return true;
    }
    
    // ❌ ĐÃ LOẠI BỎ HÀM applyItemStats VÀ unequipItem ĐẦU TIÊN
    
    /**
     * Trang bị vật phẩm.
     * @param {object} item - Vật phẩm được trang bị.
     * @returns {object|null} Vật phẩm cũ bị thay thế, hoặc null nếu slot trống.
     */
    equipItem(item) {
        const slot = item.slot;
        const oldItem = this.equipment[slot]; // Lưu lại vật phẩm cũ
        
        // 1. Loại bỏ vật phẩm cũ (nếu có)
        if (oldItem) {
            // KHÔNG CẦN applyItemStats(oldItem, false) vì calculateStats sẽ làm việc đó
            this.inventory.push(oldItem);         // Đẩy vật phẩm cũ vào Kho đồ
        }

        // 2. Áp dụng vật phẩm mới
        this.equipment[slot] = item;
        // KHÔNG CẦN applyItemStats(item, true) vì calculateStats sẽ làm việc đó
        
        // 3. Xóa vật phẩm mới khỏi Inventory 
        const index = this.inventory.indexOf(item); 
        if (index !== -1) {
            this.inventory.splice(index, 1);
        }
        
        // 4. Tính toán lại chỉ số cuối cùng
        this.calculateStats();
        
        return oldItem; // Trả về vật phẩm cũ để thông báo
    }

    /**
     * Bỏ trang bị (Unequip) vật phẩm tại slot được chỉ định.
     * @param {string} slot - Slot trang bị cần bỏ (ví dụ: 'mainHand').
     * @returns {object | null} Vật phẩm đã được bỏ hoặc null.
     */
    unequipItem(slot) {
        const itemToUnequip = this.equipment[slot];
        
        if (itemToUnequip) {
            // 1. Xóa khỏi slot trang bị
            this.equipment[slot] = null;
            
            // 2. Chuyển vật phẩm trở lại kho đồ
            this.inventory.push(itemToUnequip); 
            
            // 3. Cập nhật chỉ số (thao tác này sẽ tự động loại bỏ chỉ số cũ)
            this.calculateStats(); 
            
            return itemToUnequip;
        }
        return null;
    }
    
    /**
     * Bán một vật phẩm trong kho đồ để lấy vàng.
     * @param {number} index - Chỉ mục của vật phẩm trong hero.inventory.
     * @returns {{gold: number, item: object}} Số vàng kiếm được và vật phẩm đã bán.
     */
    sellItem(index) {
        // Lấy vật phẩm trước khi xóa
        const itemToSell = this.inventory[index];
        if (!itemToSell) return { gold: 0, item: null };

        // Vật phẩm UNIQUE có sellValue. Vật phẩm thường có sellPrice.
        const goldGained = itemToSell.sellValue || itemToSell.sellPrice || 0; 

        // 1. Xóa vật phẩm khỏi kho đồ
        this.inventory.splice(index, 1);
        
        // 2. Cộng vàng
        this.baseStats.gold += goldGained;
        
        // 3. Cập nhật chỉ số (để cập nhật vàng hiển thị)
        this.calculateStats();

        // 4. Gọi hàm toàn cục để cập nhật tổng vàng và kiểm tra nhiệm vụ
        // Giả định window.updateGoldEarned được gán ở main.js
        if (window.updateGoldEarned) {
            window.updateGoldEarned(goldGained); 
        }

        return { gold: goldGained, item: itemToSell };
    }
    
    /**
     * Kiểm tra xem một vật phẩm (dựa trên tham chiếu) có đang được trang bị không.
     * @param {object} item - Vật phẩm trong kho đồ.
     * @returns {boolean}
     */
    isEquipped(item) {
        if (!item.slot) return false;
        
        // Kiểm tra tất cả các slot có thể của vật phẩm đó
        for (const slot in this.equipment) {
            // So sánh đối tượng trong equipment với đối tượng trong inventory
            if (this.equipment[slot] === item) { 
                return true;
            }
        }
        return false;
    }

    takeDamage(damage) {
        // LƯU Ý: damage ở đây đã là sát thương thực tế (được tính ở combat.js).
        // Không trừ thêm defense ở đây để tránh áp dụng phòng thủ hai lần.
        const actualDamage = Math.max(1, Number(damage) || 0);
        this.stats.currentHP -= actualDamage;
        if (this.stats.currentHP < 0) this.stats.currentHP = 0;
        // ✨ Đồng bộ lại để lưu
        this.baseStats.currentHP = this.stats.currentHP;
        return actualDamage;
    }

    /**
     * Kiểm tra xem Anh hùng còn sống không
     * @returns {boolean} true nếu HP > 0
     */
    isAlive() {
        return this.stats.currentHP > 0;
    }
    
    /**
     * Hero sử dụng một vật phẩm tiêu hao từ kho đồ.
     * @param {number} index - Chỉ mục của vật phẩm trong hero.inventory.
     * @returns {boolean} true nếu vật phẩm được sử dụng thành công.
     */
    useItem(index) {
        const item = this.inventory[index];

        if (!item || item.type !== 'Consumable') {
             // Giả định window.logMessage được gán
             if (window.logMessage) {
                 window.logMessage('⚠️ Vật phẩm không tồn tại hoặc không phải là vật phẩm tiêu hao.', 'warn');
             }
            return false;
        }

        let isUsed = false;
        
        switch (item.effect) {
            case 'healHP':
                // Tính toán lượng HP hồi phục, không thể vượt quá HP tối đa
                const healAmount = item.value;
                const actualHeal = Math.min(healAmount, this.stats.maxHP - this.stats.currentHP);
                
                if (actualHeal > 0) {
                    this.stats.currentHP += actualHeal;
                    // ✨ ĐỒNG BỘ: Cập nhật baseStats.currentHP
                    this.baseStats.currentHP = this.stats.currentHP;
                    
                    if (window.logMessage) {
                         window.logMessage(`🧪 Đã sử dụng **${item.name}**, hồi phục <span class="text-red-400">${actualHeal} HP</span>. (HP: ${this.stats.currentHP}/${this.stats.maxHP})`, 'info');
                    }
                    isUsed = true;
                } else {
                    if (window.logMessage) {
                        window.logMessage(`⚠️ HP đã đầy, không thể sử dụng **${item.name}**.`, 'warn');
                    }
                    return false; // Không tiêu thụ nếu HP đã đầy
                }
                break;
            // Thêm các loại effect khác ở đây
        }

        if (isUsed) {
            // Xóa vật phẩm khỏi kho đồ (tiêu thụ)
            this.inventory.splice(index, 1);
            // Cập nhật chỉ số (dù HP đã sync, vẫn gọi để cập nhật UI)
            this.calculateStats(); 
        }
        
        return isUsed;
    }

    gainXP(amount) {
        this.baseStats.experience += amount;
        let leveledUp = false;
        while (this.baseStats.experience >= this.baseStats.xpToNextLevel) {
            this.baseStats.experience -= this.baseStats.xpToNextLevel;
            this.levelUp();
            leveledUp = true;
        }
        this.calculateStats();
        return leveledUp;
    }

    levelUp() {
        this.baseStats.level++;
        this.baseStats.maxHP += 10;
        this.baseStats.currentHP = this.baseStats.maxHP;
        this.baseStats.attack += 2;
        this.baseStats.defense += 1;
        this.baseStats.xpToNextLevel = Math.floor(this.baseStats.xpToNextLevel * 1.2); 
    }

    heal(amount) {
        // Áp dụng heal lên chỉ số cuối cùng (stats)
        this.stats.currentHP = Math.min(this.stats.maxHP, this.stats.currentHP + amount);
        // Sau đó đồng bộ lại vào baseStats để lưu game
        this.baseStats.currentHP = this.stats.currentHP; 
    }
}