#!/usr/bin/env node
// tools/simulate.mjs
// Headless simulator for many 1v1 combats to compute win rate.

import { initialHeroStats } from '../modules/data/characters.js';
import { enemyList } from '../modules/data/enemies.js';

// Simulation tuning (keep in sync with modules/combat.js defaults)
let DEFENSE_EFFECTIVENESS = 0.5;
let DAMAGE_VARIANCE = 0.12;
let BOSS_DEFENSE_BYPASS = 0.35;
let HERO_ATTACK_MULT = 3.0;

function calculateDamage(attackerAttack, defenderDefense, defenseBypassPercent = 0) {
  const effectiveDefenseBase = defenderDefense * DEFENSE_EFFECTIVENESS;
  const bypassedDefense = effectiveDefenseBase * defenseBypassPercent;
  const effectiveDefense = Math.max(0, effectiveDefenseBase - bypassedDefense);
  let rawDamage = attackerAttack - effectiveDefense;
  const variance = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIANCE;
  rawDamage = Math.floor(rawDamage * variance);
  return Math.max(1, rawDamage);
}

function makeHero(level = 1) {
  // clone base
  const hero = JSON.parse(JSON.stringify(initialHeroStats));
  hero.level = level;
  // Reset baseStats like constructor: apply level ups from level 1 to target
  hero.maxHP = initialHeroStats.maxHP;
  hero.currentHP = initialHeroStats.currentHP;
  hero.attack = initialHeroStats.attack;
  hero.defense = initialHeroStats.defense;

  for (let l = 2; l <= level; l++) {
    hero.level = l;
    hero.maxHP += 10;
    hero.currentHP = hero.maxHP;
    hero.attack += 2;
    hero.defense += 1;
  }

  // Use stats object similar to game
  return {
    base: hero,
    stats: {
      attack: hero.attack,
      defense: hero.defense,
      maxHP: hero.maxHP,
      currentHP: hero.currentHP,
      // include new stats default
      str: hero.str || 0,
      dex: hero.dex || 0,
      int: hero.int || 0,
      lux: hero.lux || 0,
      attackSpeed: hero.attackSpeed || 1.0,
      critChance: hero.critChance || 0.05,
      critMultiplier: hero.critMultiplier || 1.5,
    },
    takeDamage(dmg) {
      // In-game hero.takeDamage assumes damage already includes defense handling
      const actual = Math.max(1, Number(dmg) || 0);
      this.stats.currentHP -= actual;
      if (this.stats.currentHP < 0) this.stats.currentHP = 0;
      return actual;
    },
    isAlive() { return this.stats.currentHP > 0; }
  };
}

function makeEnemy(type, level = 1, isBoss = false) {
  const base = enemyList[type];
  if (!base) throw new Error('Unknown enemy type: ' + type);
  const levelMultiplier = 1 + (level - 1) * 0.12;
  const bossMultiplier = isBoss ? 1.4 : 1;
  const maxHP = Math.floor((base.baseHP || 10) * levelMultiplier * bossMultiplier);
  const attack = Math.floor((base.baseAttack || 5) * levelMultiplier * bossMultiplier);
  const defense = Math.floor((base.baseDefense || 0) * levelMultiplier * bossMultiplier);
  return {
    baseType: type,
    stats: { maxHP, currentHP: maxHP, attack, defense, goldDrop: base.goldDrop, xpDrop: base.xpDrop },
    takeDamage(rawDamage) {
      const damage = Number(rawDamage) || 0;
      const actual = Math.max(1, damage - this.stats.defense);
      this.stats.currentHP -= actual;
      if (this.stats.currentHP < 0) this.stats.currentHP = 0;
      return actual;
    },
    isAlive() { return this.stats.currentHP > 0; }
  };
}

function runOneFight(heroLevel, enemyType, enemyLevel, isBoss = false) {
  const hero = makeHero(heroLevel);
  const enemy = makeEnemy(enemyType, enemyLevel, isBoss);

  // fight loop: hero attacks first
  let rounds = 0;
  while (hero.isAlive() && enemy.isAlive() && rounds < 1000) {
    rounds++;
    // hero may perform multiple attacks per round based on attackSpeed
    const atkSpeed = Number(hero.stats.attackSpeed) || 1.0;
    let attacks = Math.floor(atkSpeed);
    if (Math.random() < (atkSpeed - attacks)) attacks += 1;
    for (let a = 0; a < attacks; a++) {
      let base = Math.max(0, Math.floor((hero.stats.attack || 0) * HERO_ATTACK_MULT));
      const critChance = Math.min(0.95, Number(hero.stats.critChance) || 0.05);
      const isCrit = Math.random() < critChance;
      const critMult = Math.max(1.0, Number(hero.stats.critMultiplier) || 1.5);
      let damageThisHit = base;
      if (isCrit) damageThisHit = Math.floor(damageThisHit * critMult);
      enemy.takeDamage(damageThisHit);
      if (!enemy.isAlive()) break;
    }
    if (!enemy.isAlive()) return true;
    // enemy hits
    const rawToHero = calculateDamage(enemy.stats.attack, hero.stats.defense, isBoss ? BOSS_DEFENSE_BYPASS : 0);
    hero.takeDamage(rawToHero);
    if (!hero.isAlive()) return false;
  }
  return hero.isAlive();
}

// Runner
async function runSimulations({ sims = 1000, heroLevel = 1, dungeon = null } = {}) {
  const enemyTypes = Object.keys(enemyList).filter(k => !k.includes('Boss') && !k.includes('King') && !k.includes('Titan') && Object.prototype.hasOwnProperty.call(enemyList, k));
  let wins = 0;
  for (let i = 0; i < sims; i++) {
    // pick random enemy from list (first 50 small ones)
    const types = enemyTypes.slice(0, Math.min(enemyTypes.length, 25));
    const type = types[Math.floor(Math.random() * types.length)];
    // enemy level roughly dungeon.level or hero-influenced
    const enemyLevel = Math.max(1, Math.floor(1 + Math.random() * 3) + Math.floor((heroLevel - 1) / 5));
    const win = runOneFight(heroLevel, type, enemyLevel, false);
    if (win) wins++;
  }
  return { sims, wins, winRate: (wins / sims) };
}

// CLI
(async () => {
  const args = process.argv.slice(2);
  const simsArg = parseInt(args[0]) || 1000;
  const heroLevel = parseInt(args[1]) || 1;
  console.log(`Running ${simsArg} simulations vs random enemies at hero level ${heroLevel}...`);
  const res = await runSimulations({ sims: simsArg, heroLevel });
  console.log(`Wins: ${res.wins}/${res.sims} — Win rate: ${(res.winRate * 100).toFixed(2)}%`);
})();
