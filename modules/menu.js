// modules/menu.js

import { hero, logMessage } from './game.js'; // Chỉ cần logMessage, hero, không cần updateGameUI
import { checkQuestProgress } from './quest.js';
import { upgradeList, calculateUpgradeCost, calculateUpgradeValue } from './data/upgrades.js';
import { questList } from './data/quests.js'; 
import { activeQuests } from './quest.js';
import { dungeonList } from './data/dungeons.js';
const upgradeMenuEl = document.getElementById('upgrade-list');
const dungeonMenuEl = document.getElementById('dungeon-menu-content');
// =======================================================
// 1. XỬ LÝ SỰ KIỆN (Được gán cho window)
// =======================================================

/**
 * Xử lý khi người chơi mua một nâng cấp
 * (Bây giờ là một hàm được EXPORT)
 */
export function handleUpgrade(upgradeId) { // ✨ FIX: ĐỊNH NGHĨA LÀ EXPORT FUNCTION
    if (!hero || !upgradeList[upgradeId]) return;

    const upgrade = upgradeList[upgradeId];
    // Sử dụng currentLevel của upgrade, không phải của hero.upgrades
    const currentCost = calculateUpgradeCost(upgrade); 

    if (hero.baseStats.gold < currentCost) {
        logMessage(`⚠️ Không đủ Vàng (${currentCost}💰) để mua **${upgrade.name}**!`, 'warning');
        return;
    }
    
    // Trừ vàng
    hero.baseStats.gold -= currentCost;
    
    // Áp dụng nâng cấp
    upgrade.currentLevel++; // Cập nhật level của template
    
    // Cộng chỉ số: Đối với MaxHP, chúng ta cần cộng thêm và hồi máu ngay lập tức
    const value = calculateUpgradeValue(upgrade); 
    
    // Cập nhật hero.upgrades để lưu vào save
    // Lưu ý: Cần đảm bảo hero.upgrades được đồng bộ với upgradeList[upgradeId].currentLevel
    hero.upgrades[upgrade.stat] = upgrade.currentLevel;
    
    logMessage(`📈 Nâng cấp **${upgrade.name}** lên Cấp **${upgrade.currentLevel}**!`, 'info');

    // Bắt buộc tính toán lại stats sau khi nâng cấp
    hero.calculateStats(); 
    // Cập nhật tiến trình nhiệm vụ nếu có quest liên quan đến nâng cấp
    try {
        checkQuestProgress('upgradeStat', upgrade.stat);
    } catch (e) {
        // Không block UI nếu checkQuestProgress không có sẵn do vòng tham chiếu
        console.warn('checkQuestProgress unavailable', e);
    }
    // Gọi hàm cập nhật UI toàn cục
    window.updateUI();
}

// =======================================================
// 2. RENDER UI
// =======================================================

/**
 * Vẽ menu nâng cấp lên UI
 */
export function renderUpgrades() {
    if (!upgradeMenuEl || !hero) return;

    let html = '';
    // Only show a limited set of upgrade options in the UI (HP, Attack, Defense)
    const allowedUpgradeIds = ['hp', 'attack', 'defense'];
    allowedUpgradeIds.forEach(id => {
        const upgrade = upgradeList[id];
        if (!upgrade) return;
        const cost = calculateUpgradeCost(upgrade);
        const value = calculateUpgradeValue(upgrade);
        const canAfford = hero.baseStats.gold >= cost;
        
        // Lấy chỉ số hiện tại của Hero
        // Sử dụng hero.stats cho hiển thị chỉ số tổng (base + equip)
        const currentStatValue = hero.stats[upgrade.stat] || 0; 
        
        html += `
            <div class="flex flex-col p-3 border rounded ${canAfford ? 'bg-green-50' : 'bg-gray-100'}">
                <div class="flex justify-between items-center mb-1">
                    <p class="font-bold text-gray-800">${upgrade.name} (Lv ${upgrade.currentLevel})</p>
                    <p class="text-sm font-semibold ${canAfford ? 'text-green-600' : 'text-red-500'}">
                        ${cost} 💰
                    </p>
                </div>
                <p class="text-xs text-gray-600 mb-2">
                    Cộng: <span class="font-semibold text-blue-600">+${value} ${upgrade.stat.toUpperCase()}</span> (Hiện tại: ${currentStatValue})
                </p>
                <button 
                    class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 rounded text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onclick="handleUpgrade('${id}')" 
                    ${!canAfford ? 'disabled' : ''}
                >
                    Nâng cấp
                </button>
            </div>
        `;
    });

    upgradeMenuEl.innerHTML = html;
}
/**
 * Hiển thị danh sách các Dungeon và các nút để chuyển khu vực.
 */
export function renderDungeonMenu() {
    if (!dungeonMenuEl) return;

    let html = '';
    
    // Lấy ID của Dungeon hiện tại để highlight
    const currentDungeonID = hero ? hero.currentDungeonID : "Forest Clearing"; // Giả định currentDungeonID được gắn vào Hero (hoặc lấy từ game.js)
    
    for (const id in dungeonList) {
        const dungeon = dungeonList[id];
        const isCurrent = id === currentDungeonID;
        const isDisabled = dungeon.isLocked;
        
        // Xác định class cho trạng thái
        let btnClass = 'bg-gray-400 text-gray-700 cursor-not-allowed';
        let action = '';
        let status = '';

        if (isCurrent) {
            btnClass = 'bg-blue-600 text-white font-bold cursor-default';
            status = ' (Đang ở đây)';
        } else if (!isDisabled) {
            btnClass = 'bg-green-600 hover:bg-green-700 text-white font-semibold';
            action = `window.changeDungeon('${id}')`;
            status = ' (Mở khóa)';
        } else {
            status = ' (Đang bị khóa)';
        }
        
        html += `
            <div class="flex justify-between items-center p-2 border-b border-gray-200 ${isCurrent ? 'bg-blue-50/50 rounded' : ''}">
                <div>
                    <p class="font-bold text-gray-800">${dungeon.id}</p>
                    <p class="text-xs text-gray-500">Cấp độ: ${dungeon.level} | Boss: ${dungeon.boss}</p>
                </div>
                <button 
                    class="py-1 px-3 rounded text-sm transition duration-150 ${btnClass}"
                    onclick="${action}"
                    ${isDisabled && !isCurrent ? 'disabled' : ''}
                >
                    ${isCurrent ? 'Khu vực hiện tại' : (isDisabled ? 'Khóa' : 'Thám hiểm')}
                </button>
            </div>
        `;
    }

    dungeonMenuEl.innerHTML = html;
}
/**
 * 🪪 Vẽ danh sách Nhiệm vụ lên UI
 */
export function renderQuests() {
    const questsEl = document.getElementById('quest-list'); // Giả định ID này tồn tại trong index.html
    if (!questsEl) return;

    if (activeQuests.length === 0) {
        questsEl.innerHTML = '<i class="text-gray-500">Không có nhiệm vụ nào đang hoạt động.</i>';
        return;
    }

    let html = '';
    activeQuests.forEach(quest => {
        const progressPercent = Math.min(100, (quest.progress / quest.goalAmount) * 100);
        const isComplete = !!quest.completed;

        html += `
            <div class="flex flex-col p-3 border rounded my-2 ${isComplete ? 'bg-yellow-100 border-yellow-500' : 'bg-white border-gray-200'}">
                <p class="font-bold text-lg">${quest.name}</p>
                <p class="text-sm text-gray-600">${quest.description}</p>

                <div class="w-full bg-gray-200 rounded-full h-2.5 my-2">
                    <div class="h-2.5 rounded-full ${isComplete ? 'bg-yellow-500' : 'bg-blue-500'}" style="width: ${progressPercent}%;"></div>
                </div>

                <p class="text-xs text-gray-700 font-semibold mb-2">
                    Tiến trình: ${quest.progress} / ${quest.goalAmount} (${Math.floor(progressPercent)}%)
                </p>

                <button 
                    class="font-semibold py-1 rounded text-sm transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed
                    ${isComplete ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-400 text-gray-700'}"
                    onclick="${isComplete ? `claimQuestReward('${quest.id}')` : ''}" 
                    ${!isComplete ? 'disabled' : ''}
                >
                    ${isComplete ? '💰 Nhận Thưởng' : 'Đang thực hiện...'}
                </button>
            </div>
        `;
    });

    questsEl.innerHTML = html;
}