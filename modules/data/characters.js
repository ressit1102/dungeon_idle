// modules/data/characters.js

export const initialHeroStats = {
    level: 1,
    currentHP: 100,
    maxHP: 100,
    attack: 10,
    defense: 5,
    // New attributes for deeper build design
    str: 0,    // Strength: increases raw damage / crit multiplier
    dex: 0,    // Dexterity: increases attack speed
    int: 0,    // Intelligence: reserved for magic / skill scaling
    lux: 0,    // Luck: increases critical chance / rare interactions
    // Derived/combat helpers (defaults)
    attackSpeed: 1.0,   // attacks per turn (will be derived from dex)
    critChance: 0.05,   // base 5% crit chance (modified by lux)
    critMultiplier: 1.5, // base 150% damage on crit (modified by str)
    gold: 0,
    experience: 0,
    // Materials / crafting resources
    materials: { shard: 0 },
    xpToNextLevel: 100,
};