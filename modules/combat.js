// modules/combat.js

import { Logger } from './logger.js';

const logger = new Logger();

/**
 * Tính toán sát thương thực tế với các hệ số cân bằng:
 * - Defense chỉ có hiệu lực một phần (DEFENSE_EFFECTIVENESS)
 * - Thêm biến thiên nhỏ (DAMAGE_VARIANCE)
 * - Hỗ trợ bỏ qua phòng thủ (defenseBypassPercent) cho Boss
 */
let DEFENSE_EFFECTIVENESS = 0.5; // Phần trăm phòng thủ thực sự có hiệu lực (tuned down)
let DAMAGE_VARIANCE = 0.12;     // Biến thiên sát thương ±12%
let BOSS_DEFENSE_BYPASS = 0.35; // Boss bỏ qua ~35% phòng thủ (mặc định)
// Multiplier applied to hero attack to help balance (tunable)
let HERO_ATTACK_MULT = 3.0;

/**
 * Điều chỉnh tham số cân bằng trong runtime (dùng bởi Debug UI)
 */
export function setCombatBalance({ defenseEffectiveness, damageVariance, bossDefenseBypass } = {}) {
    if (defenseEffectiveness !== undefined) DEFENSE_EFFECTIVENESS = Number(defenseEffectiveness) || DEFENSE_EFFECTIVENESS;
    if (damageVariance !== undefined) DAMAGE_VARIANCE = Number(damageVariance) || DAMAGE_VARIANCE;
    if (bossDefenseBypass !== undefined) BOSS_DEFENSE_BYPASS = Number(bossDefenseBypass) || BOSS_DEFENSE_BYPASS;
    // allow adjusting hero attack mult via debug if needed
    if (arguments[0] && arguments[0].heroAttackMult !== undefined) HERO_ATTACK_MULT = Number(arguments[0].heroAttackMult) || HERO_ATTACK_MULT;
}

function calculateDamage(attackerAttack, defenderDefense, defenseBypassPercent = 0) {
    // 1. Phòng thủ được quy về hiệu quả
    const effectiveDefenseBase = defenderDefense * DEFENSE_EFFECTIVENESS;
    const bypassedDefense = effectiveDefenseBase * defenseBypassPercent;
    const effectiveDefense = Math.max(0, effectiveDefenseBase - bypassedDefense);

    // 2. Sát thương thô trước biến thiên
    let rawDamage = attackerAttack - effectiveDefense;

    // 3. Thêm biến thiên nhỏ để gameplay thú vị hơn
    const variance = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIANCE; // trong khoảng [1-D, 1+D]
    rawDamage = Math.floor(rawDamage * variance);

    // 4. Đảm bảo sát thương tối thiểu là 1
    return Math.max(1, rawDamage);
}

/**
 * Xử lý một lượt chiến đấu
 * @param {object} hero - Đối tượng Hero
 * @param {object} enemy - Đối tượng Enemy
 * @param {boolean} isBossFight - Cờ chỉ định có phải là trận đấu Boss hay không
 * @returns {boolean} true nếu combat kết thúc
 */
export function processCombatTurn(hero, enemy, isBossFight) {
    // 1. Anh hùng hành động (có thể dùng kỹ năng)
    // Kẻ thù không có phòng thủ phức tạp ở đây; ta sẽ sử dụng attackSpeed + crit
    // Determine number of attacks this turn based on attackSpeed
    const atkSpeed = Number(hero.stats.attackSpeed) || 1.0;
    let attacks = Math.floor(atkSpeed);
    if (Math.random() < (atkSpeed - attacks)) attacks += 1; // fractional chance for an extra attack

    // Attempt to use a skill if available/requested
    let usedSkill = null;
    try {
        if (typeof window !== 'undefined' && window.requestedSkillId) {
            usedSkill = hero.useSkill(window.requestedSkillId);
            // clear requested skill to avoid repeated uses
            try { delete window.requestedSkillId; } catch (e) { window.requestedSkillId = null; }
        }
    } catch (e) {
        usedSkill = null;
    }

    // If no explicit skill requested, auto-use a sensible one against bosses
    if (!usedSkill) {
        for (const s of hero.skills.actives) {
            if (!s.currentCooldown || s.currentCooldown === 0) {
                // prefer buffs if boss, else prefer damage skills
                if (isBossFight && s.effect && s.effect.type === 'buff') {
                    usedSkill = hero.useSkill(s.id);
                    break;
                }
                if (!isBossFight && s.effect && s.effect.type === 'damage') {
                    usedSkill = hero.useSkill(s.id);
                    break;
                }
            }
        }
    }

    // If usedSkill is a damage skill we will use it instead of regular attacks this turn
    if (usedSkill && usedSkill.effect && usedSkill.effect.type === 'damage') {
        const eff = usedSkill.effect;
        // compute base with hero effects included
        let base = Math.max(0, Math.floor((hero.stats.attack || 0) * hero.getAttackMultiplierFromEffects() * HERO_ATTACK_MULT));
        base = Math.floor(base * (eff.multiplier || 1));

        const defenseModifier = enemy.getDefenseModifierFromEffects ? enemy.getDefenseModifierFromEffects() : 0;
        const defenseBypass = isBossFight ? BOSS_DEFENSE_BYPASS : 0;
        const damage = calculateDamage(base, (enemy.stats.defense || 0) + defenseModifier, defenseBypass);
        const dealt = enemy.takeDamage(damage);
        logger.log(`<span class="text-blue-400">Anh hùng</span> sử dụng <strong>${usedSkill.name}</strong> gây <span class="font-bold">${dealt}</span> sát thương! (HP địch: ${enemy.stats.currentHP}/${enemy.stats.maxHP})`);
        // apply any debuff on the skill
        if (eff.debuff && enemy.addEffect) {
            enemy.addEffect(Object.assign({}, eff.debuff));
            logger.log(`<span class="text-yellow-300">Kỹ năng đã áp dụng debuff lên ${enemy.type}.</span>`);
        }

        // If enemy died
        if (!enemy.isAlive()) {
            logger.log(`🎉 <span class="text-green-400 font-bold">Anh hùng đã đánh bại ${enemy.type}!</span>`);
            // tick cooldowns/effects
            hero.tickTurn();
            if (enemy.tickEffects) enemy.tickEffects();
            return true;
        }
        // Skip regular attacks for this turn when using a damage skill
        // proceed to enemy's turn
    } else {
        for (let a = 0; a < attacks; a++) {
        // Base damage is hero.attack (already includes str/weapon contributions)
        // Apply global hero attack multiplier and any hero attack effects
        let base = Math.max(0, Math.floor((hero.stats.attack || 0) * HERO_ATTACK_MULT * hero.getAttackMultiplierFromEffects()));

        // Critical roll
        const critChance = Math.min(0.95, Number(hero.stats.critChance) || 0.05);
        const isCrit = Math.random() < critChance;

        // Crit multiplier (allowing str/int to modify it previously aggregated)
        const critMult = Math.max(1.0, Number(hero.stats.critMultiplier) || 1.5);

        let damageThisHit = base;
        if (isCrit) {
            damageThisHit = Math.floor(damageThisHit * critMult);
        }

    const enemyDamageTaken = enemy.takeDamage(damageThisHit);

        logger.log(`<span class="text-blue-400">Anh hùng</span> tấn công <span class="text-red-400">${enemy.type}</span> gây <span class="font-bold">${enemyDamageTaken}</span> sát thương.${isCrit ? ' <span class="text-yellow-300">(CRIT!)</span>' : ''} (HP địch: ${enemy.stats.currentHP}/${enemy.stats.maxHP})`);

        if (!enemy.isAlive()) {
            logger.log(`🎉 <span class="text-green-400 font-bold">Anh hùng đã đánh bại ${enemy.type}!</span>`);
            // tick cooldowns/effects
            hero.tickTurn();
            if (enemy.tickEffects) enemy.tickEffects();
            return true; 
        }
    }

    if (!enemy.isAlive()) {
        logger.log(`🎉 <span class="text-green-400 font-bold">Anh hùng đã đánh bại ${enemy.type}!</span>`);
        return true; 
    }

    // 2. Kẻ thù tấn công Anh hùng (chỉ khi còn sống)
    let defenseBypass = 0;
    let attackMessage = "";


    if (isBossFight) {
        defenseBypass = BOSS_DEFENSE_BYPASS;
        attackMessage = `(Boss bỏ qua ${Math.round(BOSS_DEFENSE_BYPASS * 100)}% Phòng thủ)`;
    }

    // Boss special mechanics (small chance each turn to perform special actions)
    // Boss special mechanics: use data-driven mechanics on the enemy instance if present
    if (isBossFight && enemy && enemy.isBoss) {
        const mech = enemy.mechanics || {};

        // Heal mechanic: defined as { chance, minPct, maxPct }
        if (mech.heal && Math.random() < (mech.heal.chance || 0)) {
            const minPct = mech.heal.minPct || 0.06;
            const maxPct = mech.heal.maxPct || (minPct + 0.06);
            const pct = minPct + Math.random() * (maxPct - minPct);
            const healAmount = Math.max(1, Math.floor(enemy.stats.maxHP * pct));
            enemy.stats.currentHP = Math.min(enemy.stats.maxHP, (enemy.stats.currentHP || 0) + healAmount);
            logger.log(`<span class="text-purple-300">${enemy.type} hồi phục <strong>${healAmount}</strong> HP!</span>`);
        }

        // Summon-like mechanic: simulated by applying a temporary attack multiplier
        if (mech.summon && Math.random() < (mech.summon.chance || 0)) {
            if (enemy.addEffect) {
                const attackMult = mech.summon.attackMult || 1.12;
                const duration = mech.summon.duration || 3;
                enemy.addEffect({ attackMult, duration });
                logger.log(`<span class="text-purple-300">${enemy.type} triệu hồi phụ tá (tăng sát thương tạm thời)!</span>`);
            }
        }

        // Anti-crit / brace: apply temporary defenseAdd if defined
        if (mech.antiCrit && Math.random() < (mech.antiCrit.chance || 0)) {
            if (enemy.addEffect) {
                const defAdd = mech.antiCrit.defenseAdd || 3;
                const duration = mech.antiCrit.duration || 3;
                enemy.addEffect({ defenseAdd: defAdd, duration });
                logger.log(`<span class="text-purple-300">${enemy.type} phòng thủ cao hơn tạm thời!</span>`);
            }
        }
    }

    // Tính toán sát thương thực tế mà Hero phải chịu
    // Allow enemy effects to modify attack/defense
    const enemyAttackMult = enemy.getAttackMultiplierFromEffects ? enemy.getAttackMultiplierFromEffects() : 1;
    const enemyAttack = Math.max(0, Math.floor((enemy.stats.attack || 0) * enemyAttackMult));

    const heroDefense = (hero.stats.defense || 0) + (hero.getDefenseBonusFromPassives ? hero.getDefenseBonusFromPassives() : 0);

    const rawDamageToHero = calculateDamage(enemyAttack, heroDefense, defenseBypass);

    let heroDamageTaken = hero.takeDamage(rawDamageToHero);

    logger.log(`<span class="text-red-400">${enemy.type}</span> tấn công <span class="text-blue-400">Anh hùng</span> gây <span class="font-bold">${heroDamageTaken}</span> sát thương. ${attackMessage} (HP Hero: ${hero.stats.currentHP}/${hero.stats.maxHP})`);

    if (hero.stats.currentHP <= 0) {
        logger.log(`💀 <span class="text-red-600 font-bold">Anh hùng đã bị ${enemy.type} đánh bại!</span>`);
        return true; 
    }

    // End of turn: tick cooldowns and effect durations
    hero.tickTurn();
    if (enemy.tickEffects) enemy.tickEffects();

    return false; 
}

// extra safety closing brace (balances edits adding nested blocks)
}