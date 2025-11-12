#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const enemiesPath = path.resolve(__dirname, '../modules/data/enemies.js');
const dungeonsPath = path.resolve(__dirname, '../modules/data/dungeons.js');

async function loadData() {
  const dungeonModule = await import('file://' + dungeonsPath);
  const enemiesModule = await import('file://' + enemiesPath);
  return { dungeonList: dungeonModule.dungeonList, enemyList: enemiesModule.enemyList };
}

function collectDungeonEnemyMap(dungeonList) {
  const map = new Map();
  for (const [id, d] of Object.entries(dungeonList)) {
    const level = d.level || 1;
    const enemies = Array.isArray(d.enemies) ? d.enemies : [];
    for (const name of enemies) {
      if (!map.has(name)) map.set(name, []);
      map.get(name).push({ dungeon: id, level });
    }
    if (d.boss) {
      const b = d.boss;
      if (!map.has(b)) map.set(b, []);
      map.get(b).push({ dungeon: id, level: d.bossLevel || d.level || 1, boss: true });
    }
  }
  return map;
}

function makeDefaultEnemyEntry(name, hints) {
  // Determine a representative level (max from hints)
  const level = hints && hints.length ? Math.max(...hints.map(h => h.level || 1)) : 1;
  // Heuristic scaling
  const sizeFactor = name.toLowerCase().includes('slime') ? 0.6 : name.toLowerCase().includes('wisp') ? 0.9 : name.toLowerCase().includes('golem') ? 1.4 : name.toLowerCase().includes('dragon') ? 2.0 : 1.0;
  const baseHP = Math.max(8, Math.floor(level * 6 * sizeFactor));
  const baseAttack = Math.max(1, Math.floor(level * 0.6 * sizeFactor + (sizeFactor>1?2:0)));
  const baseDefense = Math.max(0, Math.floor(level * 0.18 * sizeFactor));
  const goldMin = Math.max(1, Math.floor(baseHP / 6));
  const goldMax = Math.max(goldMin+1, Math.floor(baseHP / 3));
  const xp = Math.max(1, Math.floor(baseHP / 4));
  const commonWeight = level > 30 ? 55 : level > 20 ? 65 : level > 10 ? 75 : 85;
  const rareWeight = 100 - commonWeight;

  return {
    name,
    obj: {
      baseHP,
      baseAttack,
      baseDefense,
      goldDrop: [goldMin, goldMax],
      xpDrop: xp,
      lootTable: { Common: commonWeight, Rare: rareWeight }
    }
  };
}

function formatEntry(name, obj) {
  const s = [];
  s.push(`    "${name}": {`);
  s.push(`        baseHP: ${obj.baseHP},`);
  s.push(`        baseAttack: ${obj.baseAttack},`);
  s.push(`        baseDefense: ${obj.baseDefense},`);
  s.push(`        goldDrop: [${obj.goldDrop[0]}, ${obj.goldDrop[1]}],`);
  s.push(`        xpDrop: ${obj.xpDrop},`);
  s.push(`        lootTable: { Common: ${obj.lootTable.Common}, Rare: ${obj.lootTable.Rare} }`);
  s.push('    },');
  return s.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const doFix = args.includes('--fix');
  const dryRun = args.includes('--dry');
  const { dungeonList, enemyList } = await loadData();

  const dungeonEnemyMap = collectDungeonEnemyMap(dungeonList);
  const referenced = Array.from(dungeonEnemyMap.keys());
  const existing = new Set(Object.keys(enemyList));

  const missing = referenced.filter(n => !existing.has(n));
  if (missing.length === 0) {
    console.log('✅ No missing enemies found.');
    process.exit(0);
  }

  console.log(`Found ${missing.length} missing enemy type(s):`);
  for (const m of missing) {
    const hints = dungeonEnemyMap.get(m) || [];
    console.log(` - ${m}  (referenced in: ${hints.map(h=>h.dungeon+ (h.boss? ' [boss]':'' )).join(', ')})`);
  }

  const generated = missing.map(m => {
    const hints = dungeonEnemyMap.get(m) || [];
    return makeDefaultEnemyEntry(m, hints);
  });

  if (!doFix) {
    console.log('\nSuggested entries (run with --fix to apply):\n');
    for (const g of generated) console.log(formatEntry(g.name, g.obj));
    process.exit(0);
  }

  // Apply fix: insert generated entries before the boss section marker
  let content = await fs.readFile(enemiesPath, 'utf8');
  const marker = '// ======== BOSS ========';
  const idx = content.indexOf(marker);
  if (idx === -1) {
    console.error('ERROR: Could not find boss marker in enemies.js; aborting.');
    process.exit(2);
  }

  const before = content.slice(0, idx);
  const after = content.slice(idx);

  const entriesText = '\n    // Auto-generated missing enemies\n' + generated.map(g => formatEntry(g.name, g.obj)).join('\n') + '\n';

  const newContent = before + entriesText + after;

  // Backup original
  if (!dryRun) {
    await fs.copyFile(enemiesPath, enemiesPath + '.bak');
    await fs.writeFile(enemiesPath, newContent, 'utf8');
    console.log(`✅ Applied ${generated.length} entries to ${enemiesPath} (backup at ${enemiesPath}.bak)`);
  } else {
    console.log('Dry run enabled; no files were modified.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
