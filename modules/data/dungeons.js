export const dungeonList = {
  "Cave of Slimes": {
    id: "Cave of Slimes",
    level: 1,
    theme: "Slime",
    special: "poison", // DOT damage
    enemies: ["Slime", "Poison Slime", "Slimeling"],
    floors: 10,
    battlesPerFloor: [3, 5],
    boss: "Slime King",
    bossLevel: 10,
    relic: "Corroded Core",
  relicSlot: 'amulet',
  relicStats: { defense: 5, maxHP: 20 },
    isLocked: false,
    unlocks: "Crypt of Bones"
  },
  "Crypt of Bones": {
    id: "Crypt of Bones",
    level: 10,
    theme: "Undead",
    special: "curse", // curse reduces stats
    enemies: ["Skeleton", "Zombie", "Bone Archer"],
    floors: 10,
    battlesPerFloor: [3, 5],
    boss: "Bone Warden",
    bossLevel: 20,
    relic: "Shattered Phylactery",
  relicSlot: 'amulet',
  relicStats: { attack: 4, int: 2 },
    isLocked: true,
    unlocks: "Inferno Keep"
  },
  "Inferno Keep": {
    id: "Inferno Keep",
    level: 20,
    theme: "Fire",
    special: "burn", // burn damage over time
    enemies: ["Fire Imp", "Lava Golem", "Smoke Hound"],
    floors: 10,
    battlesPerFloor: [3, 5],
    boss: "Flame Tyrant",
    bossLevel: 30,
    relic: "Emberheart",
  relicSlot: 'amulet',
  relicStats: { attack: 8, critChance: 0.03 },
    isLocked: true,
    unlocks: "Frost Hollow"
  },
  "Frost Hollow": {
    id: "Frost Hollow",
    level: 30,
    theme: "Ice",
    special: "slow", // slow debuff
    enemies: ["Ice Wolf", "Frost Golem", "Snow Wisp"],
    floors: 10,
    battlesPerFloor: [3, 5],
    boss: "Glacier Lord",
    bossLevel: 40,
    relic: "Crystalized Mantle",
  relicSlot: 'amulet',
  relicStats: { defense: 10, maxHP: 40 },
    isLocked: true,
    unlocks: "Abyss"
  },
  "Abyss": {
    id: "Abyss",
    level: 40,
    theme: "Chaos",
    special: "random_skill", // enemies have random skills
    enemies: ["Voidling", "Abyssal Horror", "Chaos Wisp"],
    floors: 10,
    battlesPerFloor: [3, 5],
    boss: "Void Emperor",
    bossLevel: 50,
    relic: "Shard of Anomaly",
  relicSlot: 'amulet',
  relicStats: { attack: 12, dex: 3, lux: 1 },
    isLocked: true,
    unlocks: null
  }
};
