#!/usr/bin/env node
import { initialHeroStats } from '../modules/data/characters.js';
import { enemyList } from '../modules/data/enemies.js';

function calculateDamage(attackerAttack, defenderDefense, defenseBypassPercent = 0, DEFENSE_EFFECTIVENESS = 0.6, DAMAGE_VARIANCE = 0.12) {
  const effectiveDefenseBase = defenderDefense * DEFENSE_EFFECTIVENESS;
  const bypassedDefense = effectiveDefenseBase * defenseBypassPercent;
  const effectiveDefense = Math.max(0, effectiveDefenseBase - bypassedDefense);
  let rawDamage = attackerAttack - effectiveDefense;
  const variance = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIANCE;
  rawDamage = Math.floor(rawDamage * variance);
  return Math.max(1, rawDamage);
}

function makeHero(level = 1, heroAttackMult = 1.0) {
  const hero = JSON.parse(JSON.stringify(initialHeroStats));
  hero.level = level;
  hero.maxHP = initialHeroStats.maxHP;
  hero.currentHP = initialHeroStats.currentHP;
  hero.attack = Math.floor(initialHeroStats.attack * heroAttackMult);
  hero.defense = initialHeroStats.defense;
  for (let l = 2; l <= level; l++) {
    hero.level = l;
    hero.maxHP += 10;
    hero.currentHP = hero.maxHP;
    hero.attack += Math.floor(2 * heroAttackMult);
    hero.defense += 1;
  }
  hero.str = hero.str || 0; hero.dex = hero.dex || 0; hero.lux = hero.lux || 0;
  const attackSpeed = Math.max(0.1, (hero.attackSpeed || 1.0) + hero.dex * 0.02);
  const critChance = Math.min(0.95, (hero.critChance || 0.05) + hero.lux * 0.01);
  const critMultiplier = Math.max(1.0, (hero.critMultiplier || 1.5) + hero.str * 0.05);
  return { base: hero, stats: { attack: hero.attack, defense: hero.defense, maxHP: hero.maxHP, currentHP: hero.currentHP, attackSpeed, critChance, critMultiplier }, takeDamage(dmg) { const actual = Math.max(1, Number(dmg) || 0); this.stats.currentHP -= actual; if (this.stats.currentHP < 0) this.stats.currentHP = 0; return actual; }, isAlive() { return this.stats.currentHP > 0; } };
}

function makeEnemy(type, level = 1, bossMultiplier = 2.2, isBoss = false) {
  const base = enemyList[type];
  const levelMultiplier = 1 + (level - 1) * 0.12; const bossMult = isBoss ? bossMultiplier : 1;
  const maxHP = Math.floor((base.baseHP || 10) * levelMultiplier * bossMult);
  const attack = Math.floor((base.baseAttack || 5) * levelMultiplier * bossMult);
  const defense = Math.floor((base.baseDefense || 0) * levelMultiplier * bossMult);
  return { baseType: type, stats: { maxHP, currentHP: maxHP, attack, defense, goldDrop: base.goldDrop, xpDrop: base.xpDrop }, takeDamage(rawDamage) { const damage = Number(rawDamage) || 0; const actual = Math.max(1, damage - this.stats.defense); this.stats.currentHP -= actual; if (this.stats.currentHP < 0) this.stats.currentHP = 0; return actual; }, isAlive() { return this.stats.currentHP > 0; } };
}

function runOneFight(heroLevel, enemyType, enemyLevel, opts = {}) {
  const { DEFENSE_EFFECTIVENESS = 0.6, DAMAGE_VARIANCE = 0.12, BOSS_DEFENSE_BYPASS = 0.35, heroAttackMult = 1.0, bossMultiplier = 2.2 } = opts;
  const hero = makeHero(heroLevel, heroAttackMult);
  const enemy = makeEnemy(enemyType, enemyLevel, bossMultiplier, false);
  let rounds = 0;
  while (hero.isAlive() && enemy.isAlive() && rounds < 1000) {
    rounds++;
    const atkSpeed = Number(hero.stats.attackSpeed) || 1.0; let attacks = Math.floor(atkSpeed); if (Math.random() < (atkSpeed - attacks)) attacks += 1;
    for (let a = 0; a < attacks; a++) { let base = Math.max(0, Math.floor(hero.stats.attack || 0)); const critChance = Math.min(0.95, Number(hero.stats.critChance) || 0.05); const isCrit = Math.random() < critChance; const critMult = Math.max(1.0, Number(hero.stats.critMultiplier) || 1.5); let damageThisHit = base; if (isCrit) damageThisHit = Math.floor(damageThisHit * critMult); enemy.takeDamage(damageThisHit); if (!enemy.isAlive()) break; }
    if (!enemy.isAlive()) return true;
    const rawToHero = calculateDamage(enemy.stats.attack, hero.stats.defense, 0, DEFENSE_EFFECTIVENESS, DAMAGE_VARIANCE);
    hero.takeDamage(rawToHero);
    if (!hero.isAlive()) return false;
  }
  return hero.isAlive();
}

(async () => {
  const sims = 1000; const heroLevel = 1; const heroMult = 3.0; const bossMult = 1.4; let wins = 0; const enemyTypes = Object.keys(enemyList).filter(k => Object.prototype.hasOwnProperty.call(enemyList, k));
  for (let i=0;i<sims;i++){
    const types = enemyTypes.slice(0, Math.min(enemyTypes.length, 25)); const type = types[Math.floor(Math.random()*types.length)]; const enemyLevel = Math.max(1, Math.floor(1 + Math.random() * 3) + Math.floor((heroLevel - 1) / 5));
    if (runOneFight(heroLevel, type, enemyLevel, { heroAttackMult: heroMult, bossMultiplier: bossMult })) wins++;
  }
  console.log(`heroMult=${heroMult} bossMult=${bossMult} => Wins: ${wins}/${sims} => ${(wins/sims*100).toFixed(2)}%`);
})();
