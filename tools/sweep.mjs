#!/usr/bin/env node
// tools/sweep.mjs
// Parameter sweep for combat tuning. Runs headless fights for combinations of parameters

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

function makeHero(level = 1) {
  const hero = JSON.parse(JSON.stringify(initialHeroStats));
  hero.level = level;
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

  // derive combat helpers
  hero.str = hero.str || 0;
  hero.dex = hero.dex || 0;
  hero.lux = hero.lux || 0;
  const attackSpeed = Math.max(0.1, (hero.attackSpeed || 1.0) + hero.dex * 0.02);
  const critChance = Math.min(0.95, (hero.critChance || 0.05) + hero.lux * 0.01);
  const critMultiplier = Math.max(1.0, (hero.critMultiplier || 1.5) + hero.str * 0.05);

  return {
    base: hero,
    stats: {
      attack: hero.attack,
      defense: hero.defense,
      maxHP: hero.maxHP,
      currentHP: hero.currentHP,
      attackSpeed,
      critChance,
      critMultiplier
    },
    takeDamage(dmg) {
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
  const bossMultiplier = isBoss ? 2.2 : 1;
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

function runOneFight(heroLevel, enemyType, enemyLevel, isBoss = false, params = {}) {
  const { DEFENSE_EFFECTIVENESS = 0.6, DAMAGE_VARIANCE = 0.12, BOSS_DEFENSE_BYPASS = 0.35 } = params;
  const hero = makeHero(heroLevel);
  const enemy = makeEnemy(enemyType, enemyLevel, isBoss);

  let rounds = 0;
  while (hero.isAlive() && enemy.isAlive() && rounds < 1000) {
    rounds++;
    // hero attacks (multiple)
    const atkSpeed = Number(hero.stats.attackSpeed) || 1.0;
    let attacks = Math.floor(atkSpeed);
    if (Math.random() < (atkSpeed - attacks)) attacks += 1;
    for (let a = 0; a < attacks; a++) {
      let base = Math.max(0, Math.floor(hero.stats.attack || 0));
      const critChance = Math.min(0.95, Number(hero.stats.critChance) || 0.05);
      const isCrit = Math.random() < critChance;
      const critMult = Math.max(1.0, Number(hero.stats.critMultiplier) || 1.5);
      let damageThisHit = base;
      if (isCrit) damageThisHit = Math.floor(damageThisHit * critMult);
      enemy.takeDamage(damageThisHit);
      if (!enemy.isAlive()) break;
    }
    if (!enemy.isAlive()) return true;

    // enemy attacks
    const rawToHero = calculateDamage(enemy.stats.attack, hero.stats.defense, isBoss ? BOSS_DEFENSE_BYPASS : 0, DEFENSE_EFFECTIVENESS, DAMAGE_VARIANCE);
    hero.takeDamage(rawToHero);
    if (!hero.isAlive()) return false;
  }
  return hero.isAlive();
}

async function runSimulations({ sims = 200, heroLevel = 1, params = {} } = {}) {
  const enemyTypes = Object.keys(enemyList).filter(k => Object.prototype.hasOwnProperty.call(enemyList, k));
  let wins = 0;
  for (let i = 0; i < sims; i++) {
    const types = enemyTypes.slice(0, Math.min(enemyTypes.length, 25));
    const type = types[Math.floor(Math.random() * types.length)];
    const enemyLevel = Math.max(1, Math.floor(1 + Math.random() * 3) + Math.floor((heroLevel - 1) / 5));
    const win = runOneFight(heroLevel, type, enemyLevel, false, params);
    if (win) wins++;
  }
  return { sims, wins, winRate: (wins / sims) };
}

// Sweep runner
(async () => {
  const simsPerCombo = 300;
  const heroLevel = 1;

  const defenseGrid = [0.35, 0.5, 0.6, 0.7];
  const varianceGrid = [0.0, 0.08, 0.12, 0.18];
  const bossBypassGrid = [0.15, 0.3, 0.4, 0.55];

  let best = [];
  console.log(`Running sweep: ${defenseGrid.length}x${varianceGrid.length}x${bossBypassGrid.length} combos, ${simsPerCombo} sims each...`);

  for (const defEff of defenseGrid) {
    for (const varx of varianceGrid) {
      for (const bossBy of bossBypassGrid) {
        const params = { DEFENSE_EFFECTIVENESS: defEff, DAMAGE_VARIANCE: varx, BOSS_DEFENSE_BYPASS: bossBy };
        const res = await runSimulations({ sims: simsPerCombo, heroLevel, params });
        const pct = res.winRate * 100;
        // record combos closest to 50%
        const delta = Math.abs(pct - 50);
        best.push({ defEff, varx, bossBy, winRate: pct, delta });
        process.stdout.write(`combo def=${defEff} var=${varx} bossBy=${bossBy} => ${pct.toFixed(2)}%\n`);
      }
    }
  }

  best.sort((a,b) => a.delta - b.delta);
  console.log('\nTop candidates (closest to 50%):');
  best.slice(0, 6).forEach(b => console.log(`${b.winRate.toFixed(2)}% — defEff=${b.defEff}, variance=${b.varx}, bossBy=${b.bossBy}`));
})();
