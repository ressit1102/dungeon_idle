#!/usr/bin/env node
// tools/sweep_bosses.mjs
// Sweep a multiplier for boss stats and report win rates in a simple headless simulator.

import { enemyList } from '../modules/data/enemies.js';
import { initialHeroStats } from '../modules/data/characters.js';

function calculateDamage(attackerAttack, defenderDefense, defenseBypassPercent = 0, DEFENSE_EFFECTIVENESS = 0.5, DAMAGE_VARIANCE = 0.12) {
  const effectiveDefenseBase = defenderDefense * DEFENSE_EFFECTIVENESS;
  const bypassedDefense = effectiveDefenseBase * defenseBypassPercent;
  const effectiveDefense = Math.max(0, effectiveDefenseBase - bypassedDefense);
  let rawDamage = attackerAttack - effectiveDefense;
  const variance = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIANCE;
  rawDamage = Math.floor(rawDamage * variance);
  return Math.max(1, rawDamage);
}

function makeHero(level = 1) {
  const h = JSON.parse(JSON.stringify(initialHeroStats));
  h.level = level;
  for (let l = 2; l <= level; l++) {
    h.maxHP += 10; h.attack += 2; h.defense += 1; h.currentHP = h.maxHP;
  }
  return {
    stats: {
      attack: h.attack,
      defense: h.defense,
      maxHP: h.maxHP,
      currentHP: h.currentHP,
      attackSpeed: h.attackSpeed || 1.0,
      critChance: h.critChance || 0.05,
      critMultiplier: h.critMultiplier || 1.5,
    },
    takeDamage(d) { const a = Math.max(1, Number(d) || 0); this.stats.currentHP -= a; if (this.stats.currentHP < 0) this.stats.currentHP = 0; return a; },
    isAlive() { return this.stats.currentHP > 0; }
  };
}

function makeEnemy(type, level = 1, isBoss = false, bossStatMultiplier = 1.0) {
  const base = enemyList[type];
  if (!base) throw new Error('Unknown enemy: ' + type);
  const levelMultiplier = 1 + (level - 1) * 0.12;
  const bossMultiplier = isBoss ? 1.4 * bossStatMultiplier : 1;
  const maxHP = Math.floor((base.baseHP || 10) * levelMultiplier * bossMultiplier);
  const attack = Math.floor((base.baseAttack || 5) * levelMultiplier * bossMultiplier);
  const defense = Math.floor((base.baseDefense || 0) * levelMultiplier * bossMultiplier);
  return {
    baseType: type,
    stats: { maxHP, currentHP: maxHP, attack, defense },
    mechanics: base.mechanics || {},
    effects: [],
    addEffect(e) { this.effects.push(Object.assign({}, e)); },
    getAttackMultiplierFromEffects() { let m = 1; for (const e of this.effects) if (e.attackMult) m *= e.attackMult; return m; },
    getDefenseModifierFromEffects() { let add = 0; for (const e of this.effects) if (e.defenseAdd) add += e.defenseAdd; return add; },
    tickEffects() { for (let i = this.effects.length-1;i>=0;i--){ const e=this.effects[i]; if (e.duration!==undefined){ e.duration--; if (e.duration<=0) this.effects.splice(i,1); } } },
    takeDamage(raw) { const dmg = Number(raw)||0; const def = (this.stats.defense||0)+this.getDefenseModifierFromEffects(); const actual = Math.max(1, dmg - Math.max(0, def)); this.stats.currentHP -= actual; if (this.stats.currentHP<0) this.stats.currentHP=0; return actual; },
    isAlive() { return this.stats.currentHP>0; }
  };
}

function runOneFight(heroLevel, bossType, bossLevel, bossStatMultiplier, debug=false) {
  const hero = makeHero(heroLevel);
  const enemy = makeEnemy(bossType, bossLevel, true, bossStatMultiplier);

  const HERO_ATTACK_MULT = 3.0;
  const DEFENSE_EFFECTIVENESS = 0.5;
  const DAMAGE_VARIANCE = 0.12;
  const BOSS_DEFENSE_BYPASS = 0.35;

  let rounds = 0;
  while (hero.isAlive() && enemy.isAlive() && rounds < 1000) {
    rounds++;
    // Hero attacks (simple single-attack model for sweep)
    const atkSpeed = hero.stats.attackSpeed || 1.0;
    let attacks = Math.floor(atkSpeed);
    if (Math.random() < (atkSpeed - attacks)) attacks += 1;
    for (let a=0;a<attacks;a++){
      let base = Math.max(0, Math.floor((hero.stats.attack || 0) * HERO_ATTACK_MULT));
      const critChance = Math.min(0.95, Number(hero.stats.critChance)||0.05);
      const isCrit = Math.random() < critChance;
      const critMult = Math.max(1.0, Number(hero.stats.critMultiplier)||1.5);
      let damageThisHit = base;
      if (isCrit) damageThisHit = Math.floor(damageThisHit * critMult);
      enemy.takeDamage(damageThisHit);
      if (!enemy.isAlive()) break;
    }
    if (!enemy.isAlive()) return true;

    // Boss mechanics: apply data-driven behaviors
    const mech = enemy.mechanics || {};
    // heal
    if (mech.heal && Math.random() < (mech.heal.chance || 0)){
      const minPct = mech.heal.minPct || 0.06; const maxPct = mech.heal.maxPct || (minPct+0.06);
      const pct = minPct + Math.random()*(maxPct-minPct);
      const heal = Math.max(1, Math.floor(enemy.stats.maxHP * pct));
      enemy.stats.currentHP = Math.min(enemy.stats.maxHP, (enemy.stats.currentHP||0)+heal);
      if (debug) console.log(`${enemy.baseType} healed ${heal}`);
    }
    // summon -> attack buff
    if (mech.summon && Math.random() < (mech.summon.chance || 0)){
      const attackMult = mech.summon.attackMult || 1.12; const dur = mech.summon.duration || 3;
      enemy.addEffect({ attackMult, duration: dur });
      if (debug) console.log(`${enemy.baseType} gained summon attack buff x${attackMult} (${dur} turns)`);
    }
    // antiCrit -> defense add
    if (mech.antiCrit && Math.random() < (mech.antiCrit.chance || 0)){
      const defAdd = mech.antiCrit.defenseAdd || 3; const dur = mech.antiCrit.duration || 3;
      enemy.addEffect({ defenseAdd: defAdd, duration: dur });
      if (debug) console.log(`${enemy.baseType} gained defense ${defAdd} for ${dur}`);
    }

    // Enemy hits
    const enemyAttackMult = enemy.getAttackMultiplierFromEffects();
    const enemyAttack = Math.max(0, Math.floor((enemy.stats.attack||0) * enemyAttackMult));
    const heroDefense = (hero.stats.defense||0);
    const rawToHero = calculateDamage(enemyAttack, heroDefense, BOSS_DEFENSE_BYPASS, DEFENSE_EFFECTIVENESS, DAMAGE_VARIANCE);
    hero.takeDamage(rawToHero);
    if (!hero.isAlive()) return false;

    // Tick effects
    enemy.tickEffects();
  }
  return hero.isAlive();
}

async function runSweep({ bossType = null, simsPer = 200, heroLevel = 1, min = 0.7, max = 1.6, step = 0.1 } = {}) {
  const bossCandidates = bossType ? [bossType] : Object.keys(enemyList).filter(k => k.toLowerCase().includes('king') || k.toLowerCase().includes('lord') || k.toLowerCase().includes('tyrant') || k.toLowerCase().includes('emperor'));
  if (bossCandidates.length === 0) {
    console.error('No boss candidates found in enemyList'); process.exit(1);
  }

  for (const b of bossCandidates) {
    console.log(`\n== Sweeping boss: ${b} (sims each: ${simsPer}) ==`);
    for (let mult = min; mult <= max + 1e-9; mult = Math.round((mult + step) * 100) / 100) {
      let wins = 0;
      for (let i = 0; i < simsPer; i++) {
        if (runOneFight(heroLevel, b, Math.max(1, heroLevel), mult)) wins++;
      }
      const rate = (wins / simsPer) * 100;
      console.log(`mult=${mult.toFixed(2)} -> wins=${wins}/${simsPer} (${rate.toFixed(2)}%)`);
    }
  }
}

// CLI
(async () => {
  const args = process.argv.slice(2);
  const sims = parseInt(args[0]) || 200;
  const heroLevel = parseInt(args[1]) || 1;
  const min = parseFloat(args[2]) || 0.7;
  const max = parseFloat(args[3]) || 1.6;
  const step = parseFloat(args[4]) || 0.1;
  const boss = args[5] || null;
  console.log(`Starting boss stat sweep: sims=${sims}, heroLevel=${heroLevel}, range=${min}-${max} step=${step}`);
  await runSweep({ bossType: boss, simsPer: sims, heroLevel, min, max, step });
})();
