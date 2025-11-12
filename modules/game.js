// modules/game.js

import { Hero } from './hero.js';
import { Enemy } from './enemy.js';
import { processCombatTurn } from './combat.js';
import { enemyList } from './data/enemies.js';
import { dungeonList } from './data/dungeons.js';
import { Logger } from './logger.js';
import { saveGame, loadGame } from './save.js';
import { initQuests, applyQuestState, checkQuestProgress } from './quest.js';
import { generateLoot } from './loot.js';
import { RARITIES } from './data/items.js';
import { renderInventory } from './inventory.js';
import { renderQuests } from './questUI.js';
import { renderDungeonMenu } from './menu.js';

// --- KHỞI TẠO BIẾN TRẠNG THÁI CỐT LÕI ---
export const logger = new Logger();
export let hero;
export let currentDungeonID = "Cave of Slimes";
export let currentEnemy = null;
export let isBossFight = false;
let combatInterval = null;
// Per-dungeon run progression
let currentFloor = 1;
let battlesRemainingInFloor = 0;
let enemiesDefeatedCount = 0;
let currentFloorTotalBattles = 0;
const COMBAT_TICK_RATE = 1000;

// ✨ BIẾN TRẠNG THÁI CHO NHIỆM VỤ (Được sử dụng trong checkQuestProgress)
export let totalGoldEarned = 0;
export let totalEnemiesKilled = 0;

/**
 * Khởi tạo lại game với dữ liệu đã tải (hoặc tạo Hero mới nếu không có data)
 * Hàm này dùng để tái tạo toàn bộ trạng thái game.
 * @param {object | null} savedData - Dữ liệu đã tải từ save.js
 */
export function startGameWithData(savedData = null) {
    let loadedHeroState = null; // Đổi tên biến để dễ hiểu hơn
    let dungeonIdToLoad = "Cave of Slimes"; // Mặc định

    if (savedData) {
        // Tải Hero State riêng
        loadedHeroState = savedData.heroState;
        dungeonIdToLoad = savedData.gameState.dungeonId;

        // Tải các biến theo dõi toàn cục
        // Kiểm tra an toàn trước khi truy cập
        if (savedData.gameState && savedData.gameState.questState) {
             totalGoldEarned = savedData.gameState.questState.totalGoldEarned;
             totalEnemiesKilled = savedData.gameState.questState.totalEnemiesKilled;
        }
    }

    // 1. Khởi tạo Hero (sử dụng constructor có khả năng tải data)
    // Sẽ tạo Hero mới nếu loadedHeroState là null
    hero = new Hero(null, loadedHeroState); // ✅ TRUYỀN loadedHeroState

    // 2. Khởi tạo Nhiệm vụ
    initQuests();
    if (savedData && savedData.gameState && savedData.gameState.questState) {
        // Áp dụng trạng thái nhiệm vụ đã lưu
        applyQuestState(savedData.gameState.questState); 
    }

    // 3. Đồng bộ hóa chỉ số lần cuối và hồi đầy máu (nếu cần)
    hero.calculateStats(); 
    
    // **Đảm bảo HP hiện tại không vượt quá Max HP sau khi tính toán stats**
    // LƯU Ý: Nếu Hero constructor xử lý currentHP đã tải, phần này chỉ là dự phòng.
    if (hero.baseStats.currentHP > hero.stats.maxHP) {
        hero.baseStats.currentHP = hero.stats.maxHP;
    }
    
    // 4. Đặt lại Dungeon
    // Sử dụng `false` để tránh ghi log và khởi động combat ngay lập tức
    changeDungeon(dungeonIdToLoad, false); 

    // 5. Cập nhật UI
    window.updateUI(); 
    
    if (savedData) {
        logMessage('💾 **TẢI GAME THÀNH CÔNG!**', 'success');
    }
}
/**
 * Khởi tạo hoặc tái tạo trạng thái game.
 * @param {object | null} loadedData - Dữ liệu đã tải từ save game.
 */
export function initGame(loadedData = null) {
    // 1. Tải/Khởi tạo Hero
    hero = new Hero('Anh Hùng', loadedData ? loadedData.heroState : null);
    
    // 2. Khởi tạo Nhiệm vụ
    if (loadedData && loadedData.gameState && loadedData.gameState.questState) {
        // Tải trạng thái nhiệm vụ và cập nhật các biến theo dõi
        const questState = applyQuestState(loadedData.gameState.questState);
        totalGoldEarned = questState.totalGoldEarned;
        totalEnemiesKilled = questState.totalEnemiesKilled;
    } else {
        // Khởi tạo mới
        initQuests();
        totalGoldEarned = 0;
        totalEnemiesKilled = 0;
    }
    
    // 3. Tải/Thiết lập Dungeon
    if (loadedData && loadedData.gameState && loadedData.gameState.dungeonId) {
        // Tải Dungeon, nhưng KHÔNG ghi log và KHÔNG khởi động lại combat
        changeDungeon(loadedData.gameState.dungeonId, false);
    } else {
        // Mặc định là Forest Clearing
    changeDungeon("Cave of Slimes", false);
    }
    
    // 4. Dừng combat nếu đang chạy (tránh chạy nhiều interval)
    stopCombat();
    
    // 5. Cập nhật UI sau khi tải/khởi tạo
    updateGameUI();
    renderDungeonMenu();
}
/**
 * 💡 KHAI BÁO HÀM CẬP NHẬT UI TOÀN CỤC (Để tránh circular dependency)
 * HÀM NÀY PHẢI ĐƯỢC GÁN TỪ main.js VÀO window.globalUpdateUI
 * hoặc nhận qua tham số. Ở đây, ta dùng window.updateUI
 */
export function callGlobalUpdateUI() {
    // Đảm bảo window.updateUI tồn tại (được gán từ main.js)
    if (typeof window.updateUI === 'function') {
        updateGameUI();
    } else {
	// Fallback nếu UI chưa sẵn sàng
        console.warn("window.updateUI is not defined. UI may not be updated.");
    }
}

/**
 * Trả về thông tin Dungeon hiện tại.
 */
export function getCurrentDungeon() { 
    return dungeonList[currentDungeonID];
}

/**
 * Hàm ghi log (Đã được đơn giản hóa)
 */
export function logMessage(message, type = 'info') {
    logger.log(message, type);
}

// --- HÀM CẬP NHẬT UI CHUNG ---
// ✨ Tối ưu hóa: Loại bỏ việc import renderUpgrades/renderInventory
// ✨ Giữ nguyên các hàm UI riêng biệt, nhưng chỉ export updateGameUI

/**
 * Cập nhật giao diện người dùng hiển thị chỉ số Hero và Dungeon hiện tại.
 */
export function updateHeroUI() {
    if (!hero) return;
    
    // ✨ FIX 1: KHAI BÁO CÁC BIẾN DOM CẦN THIẾT
    const statsDiv = document.getElementById('hero-stats-panel'); // Giả định ID của container chỉ số chính
    const heroXPBar = document.getElementById('hero-xp-bar');
    const equipsDiv = document.getElementById('hero-equips'); // Giả định ID của container trang bị
    const heroHPDisplay = document.getElementById('arena-hero-hp'); // Giả định ID hiển thị HP trong đấu trường
    
    // THÊM KIỂM TRA NULL cho các container lớn
    if (!statsDiv || !heroXPBar || !equipsDiv || !heroHPDisplay) {
        // Có thể ghi log nếu cần gỡ lỗi
        // logger.log("⚠️ Lỗi UI: Không tìm thấy một hoặc nhiều container UI chính cho Hero.", 'error');
        return; 
    }
// 1. Cập nhật Stats Panel (Bằng cách ghi đè innerHTML)
    statsDiv.innerHTML = `
        <div class="hero-stat">Cấp độ: <strong class="text-xl text-green-600">${hero.baseStats.level}</strong></div>
        <div class="hero-stat">HP: <strong class="text-red-500">${hero.stats.currentHP}/${hero.stats.maxHP}</strong></div>
        <div class="hero-stat">Tấn công: <strong>${hero.stats.attack}</strong></div>
        <div class="hero-stat">Phòng thủ: <strong>${hero.stats.defense}</strong></div>
        <div class="hero-stat">Vàng: <strong class="text-yellow-600">${hero.baseStats.gold.toLocaleString()}</strong></div>
    `;

    // Hiển thị chỉ số mới: STR / DEX / INT / LUX và các hệ số phụ
    statsDiv.innerHTML += `
        <hr class="my-2">
        <div class="hero-stat">STR: <strong>${hero.stats.str}</strong></div>
        <div class="hero-stat">DEX: <strong>${hero.stats.dex}</strong> (Atk Speed: <strong>${(hero.stats.attackSpeed || 1).toFixed(2)}</strong>)</div>
        <div class="hero-stat">INT: <strong>${hero.stats.int}</strong></div>
        <div class="hero-stat">LUX: <strong>${hero.stats.lux}</strong> (Crit: <strong>${Math.round((hero.stats.critChance || 0.05)*100)}%</strong>)</div>
        <div class="hero-stat">Crit Mult: <strong>${(hero.stats.critMultiplier || 1.5).toFixed(2)}x</strong></div>
    `;

    // Cập nhật XP Bar
    const xpPercent = (hero.baseStats.experience / hero.baseStats.xpToNextLevel) * 100;
    heroXPBar.style.width = `${xpPercent}%`;

    // 2. Cập nhật Trang bị
    let equipsHTML = '';
    for (const slot in hero.equipment) {
        const item = hero.equipment[slot];
        if (item) {
            const rarityInfo = RARITIES[item.rarity] || { color: 'text-gray-400' };
            equipsHTML += `<p class="flex justify-between items-center">
                                <span><strong>${slot.charAt(0).toUpperCase() + slot.slice(1)}:</strong> <span class="${rarityInfo.color}">${item.id}</span></span>
                                <button onclick="window.handleUnequip('${slot}')" class="ml-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs py-0.5 px-2 rounded transition duration-150">Bỏ</button>
                           </p>`;
        }
    }
    equipsDiv.innerHTML = equipsHTML;

    // 3. Cập nhật HP của Anh hùng trong Arena
    heroHPDisplay.textContent = `${hero.stats.currentHP}/${hero.stats.maxHP}`;
    const heroHPBar = document.getElementById('hero-hp-bar');
    if (heroHPBar) {
        const hpPercent = (hero.stats.currentHP / hero.stats.maxHP) * 100;
        heroHPBar.style.width = `${hpPercent}%`;
        heroHPBar.className = `absolute bottom-0 w-full h-1 rounded-b-xl transition-all duration-300 ${hpPercent < 20 ? 'bg-red-700' : 'bg-green-500'}`;
    }

    // 4. Render skill bar (active skills)
    try {
        const skillBar = document.getElementById('skill-bar');
        if (skillBar && hero && hero.skills && Array.isArray(hero.skills.actives)) {
            skillBar.innerHTML = hero.skills.actives.map(s => {
                const cd = s.currentCooldown || 0;
                const disabled = cd > 0 ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105';
                return `
                    <button onclick="window.requestSkill && window.requestSkill('${s.id}')" class="px-3 py-2 bg-indigo-600 text-white rounded-lg font-semibold transition-transform duration-150 ${disabled} relative" ${cd>0? 'disabled' : ''}>
                        <div class="text-sm">${s.name}</div>
                        ${cd>0 ? `<div class=\"absolute -top-2 -right-2 bg-red-600 text-xs rounded-full w-6 h-6 flex items-center justify-center\">${cd}</div>` : ''}
                    </button>`;
            }).join('');
        }
    } catch (e) {
        // ignore UI errors in headless environments
    }
}

/**
 * Request skill use from UI. Will set window.requestedSkillId after verifying cooldown.
 * @param {string} skillId
 */
function requestSkill(skillId) {
    if (!hero) return;
    const skill = hero.getActiveSkill(skillId);
    if (!skill) return;
    if (skill.currentCooldown && skill.currentCooldown > 0) {
        logMessage(`⏳ Kỹ năng ${skill.name} đang hồi chiêu (${skill.currentCooldown} lượt).`, 'warn');
        return;
    }
    // Use skill (sets cooldown) and request it for the combat loop
    const used = hero.useSkill(skillId);
    if (used) {
        // flag for combat to process this skill once
        try { window.requestedSkillId = skillId; } catch (e) { /* ignore */ }
        logMessage(`⚔️ Sử dụng kỹ năng: ${skill.name}`);
        updateGameUI();
    }
}

// Expose to global UI so index.html buttons can call it
try { window.requestSkill = requestSkill; } catch (e) { /* ignore in headless */ }

function updateEnemyUI() {
    // ... (logic cập nhật Enemy UI GIỮ NGUYÊN) ...
    const enemyNameDisplay = document.getElementById('enemy-name-display'); 
    const enemyHPDisplay = document.getElementById('enemy-hp-display');
    const enemyHPBar = document.getElementById('enemy-hp-bar'); 

    if (!enemyNameDisplay || !enemyHPDisplay || !enemyHPBar) return;

    if (currentEnemy) {
        enemyNameDisplay.textContent = currentEnemy.type;
        enemyHPDisplay.textContent = `${currentEnemy.stats.currentHP}/${currentEnemy.stats.maxHP}`;
        
        const hpPercent = (currentEnemy.stats.currentHP / currentEnemy.stats.maxHP) * 100;
        enemyHPBar.style.width = `${hpPercent}%`;
        enemyHPBar.className = `absolute bottom-0 w-full h-1 rounded-b-xl transition-all duration-300 ${isBossFight ? 'bg-purple-500' : 'bg-green-500'}`;
    } else {
        enemyNameDisplay.textContent = "???";
        enemyHPDisplay.textContent = "N/A";
        enemyHPBar.style.width = "0%";
    }
}

/**
 * Cập nhật UI cơ bản của Game (Hero & Enemy) VÀ CÁC PANEL PHỨC TẠP HƠN.
 */
export function updateGameUI() {
    if (!hero) return;
    updateHeroUI(); 
    updateEnemyUI();
    renderQuests(); 
    renderDungeonMenu(); 
    
}

/**
 * Tạo ra một kẻ thù ngẫu nhiên hoặc Boss.
 * @param {string} dungeonId - ID của Dungeon hiện tại.
 */
function spawnEnemy(dungeonId) {
    const dungeon = dungeonList[dungeonId];
    if (!dungeon) return;

    // If in boss phase, always spawn the dungeon boss
    if (isBossFight) {
        const bossLevel = dungeon.bossLevel + Math.floor((hero ? (hero.baseStats.level - 1) : 0) / 5);
        currentEnemy = new Enemy(dungeon.boss, bossLevel, true);
        logger.log(`🚨 **BOSS** xuất hiện: **${currentEnemy.baseType}** (Cấp ${bossLevel})!`, 'alert');
        updateEnemyUI();
        updateDungeonProgressUI();
        return;
    }

    // Initialize battlesRemainingInFloor if needed
    if (!battlesRemainingInFloor || battlesRemainingInFloor <= 0) {
        const range = dungeon.battlesPerFloor || [3, 5];
        const min = range[0] || 3;
        const max = range[1] || 5;
        battlesRemainingInFloor = Math.floor(Math.random() * (max - min + 1)) + min;
        // remember how many battles this floor has so we can show a progress bar
        currentFloorTotalBattles = battlesRemainingInFloor;
        logger.log(`➡️ Bắt đầu Tầng ${currentFloor} — ${battlesRemainingInFloor} trận.`);
    }

    // Spawn a regular enemy
    const enemyType = dungeon.enemies[Math.floor(Math.random() * dungeon.enemies.length)];
    const heroLevel = hero ? hero.baseStats.level : 1;
    const extraFromHero = Math.floor((heroLevel - 1) / 5); // +1 enemy level every 5 hero levels
    const enemyLevel = Math.max(dungeon.level, dungeon.level + extraFromHero);
    currentEnemy = new Enemy(enemyType, enemyLevel);
    logger.log(`Một <span class="text-red-400">${currentEnemy.baseType}</span> (Cấp ${enemyLevel}) xuất hiện!`);

    updateEnemyUI();
    updateDungeonProgressUI();
}

function updateDungeonProgressUI() {
    const dungeon = getCurrentDungeon();
    if (!dungeon) return;
    // Update textual progress
    const textEl = document.getElementById('dungeon-progress-text');
    const percentEl = document.getElementById('dungeon-progress-percent');
    const barEl = document.getElementById('dungeon-progress-bar');
    const totalFloors = dungeon.floors || 1;

    if (textEl) {
        textEl.textContent = `Tầng: ${currentFloor}/${totalFloors} — Trận còn lại: ${battlesRemainingInFloor}`;
    }

    // Compute an approximate percent progress across the whole dungeon run
    // We use the completed floors plus progress inside the current floor.
    let insideFloorProgress = 0;
    if (currentFloorTotalBattles && currentFloorTotalBattles > 0) {
        insideFloorProgress = (currentFloorTotalBattles - battlesRemainingInFloor) / currentFloorTotalBattles;
        insideFloorProgress = Math.max(0, Math.min(1, insideFloorProgress));
    }

    let overallProgress = ((currentFloor - 1) + insideFloorProgress) / totalFloors;
    overallProgress = Math.max(0, Math.min(1, overallProgress));
    const percent = Math.round(overallProgress * 100);

    if (percentEl) percentEl.textContent = `${percent}%`;
    if (barEl) barEl.style.width = `${percent}%`;
}

/**
 * Show a temporary relic popup in the UI when a relic is awarded.
 * @param {string} relicName
 */
function showRelicPopup(relicName) {
    try {
        const popup = document.getElementById('relic-popup');
        const desc = document.getElementById('relic-popup-desc');
        if (!popup) return;
        if (desc) desc.textContent = `Bạn nhận được: ${relicName}`;
        popup.style.display = 'block';
        // Auto-hide after 4.5s
        setTimeout(() => {
            try { popup.style.display = 'none'; } catch (e) {}
        }, 4500);
    } catch (e) {
        // ignore DOM errors when running headless
    }
}

/**
 * Xử lý khi một kẻ thù bị đánh bại.
 */
function handleEnemyDefeated() {
    // Lấy Dungeon hiện tại TRƯỚC KHI xử lý Boss
    const currentDungeon = getCurrentDungeon();
    
    // 1. Nhận XP và Vàng (defensive: some enemy definitions may omit xpDrop or goldDrop)
    const xpGained = (currentEnemy && currentEnemy.stats && typeof currentEnemy.stats.xpDrop === 'number') ? currentEnemy.stats.xpDrop : 0;
    // goldDrop expected as [min,max]
    let goldGained = 0;
    try {
        const goldRange = (currentEnemy && currentEnemy.stats && Array.isArray(currentEnemy.stats.goldDrop))
            ? currentEnemy.stats.goldDrop
            : null;

        if (goldRange && goldRange.length >= 2 && typeof goldRange[0] === 'number' && typeof goldRange[1] === 'number') {
            const minG = Math.max(0, Math.floor(goldRange[0]));
            const maxG = Math.max(minG, Math.floor(goldRange[1]));
            goldGained = Math.floor(Math.random() * (maxG - minG + 1)) + minG;
        } else {
            // Fallback: derive a small gold reward from enemy maxHP or level
            const base = (currentEnemy && currentEnemy.stats && currentEnemy.stats.maxHP) ? currentEnemy.stats.maxHP : 10;
            const fallbackMin = Math.max(1, Math.floor(base / 20));
            const fallbackMax = Math.max(fallbackMin, Math.floor(base / 10));
            goldGained = Math.floor(Math.random() * (fallbackMax - fallbackMin + 1)) + fallbackMin;
        }
    } catch (e) {
        goldGained = 0;
    }

    const leveledUp = hero.gainXP(xpGained);
    hero.baseStats.gold += goldGained;
    
    // 2. Cập nhật Biến trạng thái Nhiệm vụ
    totalEnemiesKilled++;
    totalGoldEarned += goldGained;

    // 3. Kiểm tra tiến trình nhiệm vụ
    checkQuestProgress('enemiesDefeated', totalEnemiesKilled);
    checkQuestProgress('totalGoldEarned', totalGoldEarned);
    // Vẫn gọi cho dungeonClear ngay cả khi không phải là Boss, logic trong quest.js sẽ kiểm tra boss/dungeon.
    checkQuestProgress('dungeonClear', currentDungeon.id); 

    // 4. Log
    logger.log(`Đã nhận: <span class="text-purple-400">${xpGained} XP</span> và <span class="text-yellow-400">${goldGained} Vàng</span>.`);
    if (leveledUp) {
        logger.log(`🎉 **CẤP ĐỘ MỚI!** Anh hùng đã đạt Cấp độ ${hero.baseStats.level}!`, 'success');
        checkQuestProgress('heroLevel', hero.baseStats.level);
    }

    // 5. Rơi đồ (Loot)
    // ✅ ĐÃ SỬA: Truyền thêm isBossFight và currentDungeon vào generateLoot
    const loot = generateLoot(hero.baseStats.level, isBossFight, currentDungeon);
    if (loot) {
        const rarityClass = RARITIES[loot.rarity] ? RARITIES[loot.rarity].color : 'text-white';
        if (hero.addItemToInventory(loot)) { 
            // Nếu là Unique Item (từ Boss)
            if (loot.rarity === 'Unique') {
                 logger.log(`👑 **RƠI ĐỒ BOSS!** Đã nhận ${rarityClass} **${loot.id}**!`, 'loot');
            } else {
                 logger.log(`✨ Rơi đồ: <span class="${rarityClass}">${loot.rarity} **${loot.id}**</span> đã thêm vào kho đồ.`, 'loot');
            }
        } else {
            logger.log(`⚠️ Kho đồ đầy! **${loot.id}** đã bị bỏ lại.`, 'warn');
        }
    }

    // 6. Xử lý Boss và Mở khóa Dungeon
    if (isBossFight) {
        // Dungeon boss defeated — award relic and unlock next dungeon
        enemiesDefeatedCount = 0;
        const nextDungeonId = currentDungeon.unlocks;
        if (nextDungeonId && dungeonList[nextDungeonId] && dungeonList[nextDungeonId].isLocked) {
            dungeonList[nextDungeonId].isLocked = false;
            logMessage(`🔓 <span class="text-green-400">Dungeon mới mở khóa: ${nextDungeonId}!</span>`, 'success');
        }

        // Award relic
        if (currentDungeon.relic) {
            const relicItem = { id: currentDungeon.relic, type: 'Relic', rarity: 'Legendary', stats: {} };
            if (hero.addItemToInventory(relicItem)) {
                logger.log(`🏆 Nhận Relic: <strong>${currentDungeon.relic}</strong>!`, 'loot');
                    // Show a temporary popup to highlight the relic
                    showRelicPopup(currentDungeon.relic);
            } else {
                logger.log(`⚠️ Kho đồ đầy! Relic ${currentDungeon.relic} bị bỏ lại.`, 'warn');
            }
        }

        // Reset progression for this dungeon run
        currentFloor = 1;
        battlesRemainingInFloor = 0;
        isBossFight = false;
        logger.log(`Dungeon **${currentDungeon.id}** đã được Dọn dẹp!`);
    } else {
        // regular enemy defeated
        enemiesDefeatedCount++;
        battlesRemainingInFloor = Math.max(0, battlesRemainingInFloor - 1);

        // If no more battles this floor, advance floor or trigger boss if last floor
        if (battlesRemainingInFloor <= 0) {
            currentFloor++;
            if (currentFloor > currentDungeon.floors) {
                // all floors cleared -> trigger dungeon boss
                isBossFight = true;
                logger.log(`⚔️ Tất cả tầng đã dọn — Boss Dungeon sắp xuất hiện!`, 'alert');
            } else {
                // prepare next floor (battlesRemainingInFloor will be set in spawnEnemy)
                logger.log(`✅ Tầng ${currentFloor - 1} hoàn thành! Chuẩn bị Tầng ${currentFloor}.`, 'info');
            }
        }
    }

    // 7. Dọn dẹp và Spawn kẻ thù mới
    currentEnemy = null;
    spawnEnemy(currentDungeonID);
    
    // 8. Cập nhật UI và Save Game
    window.updateUI(); // Cập nhật tất cả UI (gọi cả renderInventory)
    saveGame(); // Tự động lưu game
}

/**
 * Vòng lặp chiến đấu chính (Game Loop)
 */
function gameLoop() {
    // 1. Logic tạo quái (Không có quái -> tạo quái và hồi máu)
    if (!currentEnemy) {
        hero.heal(hero.stats.maxHP);
        updateGameUI();
        spawnEnemy(currentDungeonID); 
		return;
    }
    
    // 2. Xử lý một lượt chiến đấu
    const combatFinished = processCombatTurn(hero, currentEnemy, isBossFight);
    updateGameUI(); 

// 3. Xử lý sau khi combat kết thúc (Hero hoặc Enemy đã chết)
    if (combatFinished) {

        // A. Xử lý khi HERO THẮNG (Kiểm tra xem kẻ thù đã chết chưa)
        if (currentEnemy && !currentEnemy.isAlive()) { // ✅ ĐIỀU KIỆN THẮNG CHÍNH XÁC

            // ✨ GỌI HÀM CHUẨN HÓA: handleEnemyDefeated()
            // Hàm này đã xử lý: XP, Vàng, Quest, Loot, Boss/Dungeon Logic, Reset currentEnemy=null
            handleEnemyDefeated();

        // B. Xử lý khi HERO THUA (Kiểm tra xem Anh hùng đã chết chưa)
        } else if (!hero.isAlive()) { // ✅ ĐIỀU KIỆN THUA CHÍNH XÁC
            logger.log("😴 Anh hùng nghỉ ngơi và hồi sinh...");
            stopCombat();
            hero.heal(hero.stats.maxHP);
            currentEnemy = null;

            // Đặt lại tiến trình Dungeon khi thua
            if (enemiesDefeatedCount > 0 || isBossFight) {
                enemiesDefeatedCount = 0;
                isBossFight = false;
                logMessage("💔 Tiến trình chinh phục Dungeon đã bị đặt lại.", 'warning');
            }
        }

        window.updateUI(); // Cập nhật UI cuối cùng (Quan trọng)
        saveGame(); // Tự động lưu game khi có thay đổi lớn
    }
}
        
/**
 * Xử lý việc rơi vật phẩm ngẫu nhiên và thêm vào kho đồ Hero.
 * @param {object} defeatedEnemy - Đối tượng kẻ thù đã bị đánh bại.
 */

// --- Xử lý sự kiện UI ---
export function startCombat() {
    if (combatInterval) {
        return;
    }
    
    const currentDungeon = getCurrentDungeon();
    
    if (!hero) initGame(); // Đảm bảo Hero có sẵn
    
    logger.log(`▶️ **Bắt đầu thám hiểm ${currentDungeon.id}...**`); 
    
    document.getElementById('start-combat-btn').disabled = true;
    document.getElementById('stop-combat-btn').disabled = false;
    
    currentEnemy = null; 
    
    combatInterval = setInterval(gameLoop, COMBAT_TICK_RATE); 
}

export function stopCombat() {
    if (combatInterval) {
        clearInterval(combatInterval);
        combatInterval = null;
        logger.log("⏸️ ...Dừng thám hiểm.");
        document.getElementById('start-combat-btn').disabled = false;
        document.getElementById('stop-combat-btn').disabled = true;
        currentEnemy = null;
        updateEnemyUI();
    }
}
/**
 * Xử lý việc cộng vàng từ các nguồn khác ngoài combat (ví dụ: bán vật phẩm)
 * @param {number} amount - Lượng vàng cộng thêm
 */
export function updateGoldEarned(amount) {
    if (amount > 0) {
        totalGoldEarned += amount;
        checkQuestProgress('totalGoldEarned', totalGoldEarned);
        // Cập nhật lại UI để hiển thị vàng mới
        window.updateUI();
    }
}

// ======================
// Debug helpers (for test UI)
// ======================
export function debugIncrementEnemies(count = 1) {
    totalEnemiesKilled += count;
    // Gọi checkQuestProgress để cập nhật quest liên quan
    checkQuestProgress('enemiesDefeated');
    if (window.updateUI) window.updateUI();
}

export function debugAddGold(amount = 100) {
    // Dùng updateGoldEarned để giữ logic đồng nhất
    updateGoldEarned(amount);
}
/**
 * Thay đổi Dungeon hiện tại và cập nhật UI.
 * @param {string} dungeonId - ID của dungeon mới.
 * @param {boolean} [shouldLog=true] - Có nên ghi log và khởi động lại combat không. ✨ ĐÃ THÊM
 */
export function changeDungeon(dungeonId, shouldLog = true) {
    if (dungeonList[dungeonId]) {
        currentDungeonID = dungeonId;
        const dungeonName = dungeonList[dungeonId].id;
        // 1. Log chỉ khi không phải đang tải game
        if (shouldLog) {
            logMessage(`Bạn đã bước vào khu vực **${dungeonName}**.`);
        }
        
       // Reset run progression for the new dungeon
       currentFloor = 1;
       battlesRemainingInFloor = 0;
       isBossFight = false;
       enemiesDefeatedCount = 0;

       // 2. Khởi động lại Combat (nếu đang chạy) chỉ khi không phải đang tải game
        if (combatInterval && shouldLog) {
             stopCombat();
             startCombat();
        }
        updateGameUI(); 
    }
}

// EXPORT các đối tượng cần thiết
export {dungeonList, combatInterval, COMBAT_TICK_RATE};