// modules/save.js

import { hero, totalGoldEarned, totalEnemiesKilled, logMessage, getCurrentDungeon } from './game.js';
import { activeQuests } from './quest.js'; 

const SAVE_KEY = 'idle_rpg_save_data';

/**
 * Thu thập và lưu trạng thái hiện tại của game vào Local Storage.
 */
export function saveGame() {
	if (!hero) {	
	logMessage("❌ Không thể lưu: Dữ liệu Anh hùng chưa được khởi tạo.", 'error'); return; }
	
	// 1. Thu thập trạng thái Anh hùng	
	const heroState = {	
	// FIX: SỬ DỤNG THUỘC TÍNH CƠ BẢN ĐỂ LƯU
	level: hero.baseStats.level,	
	experience: hero.baseStats.experience,	
	gold: hero.baseStats.gold,	
	upgrades: hero.upgrades,	
	inventory: hero.inventory,	
	equipment: hero.equipment,	
	maxHP: hero.baseStats.maxHP, // Lưu maxHP cơ bản (từ levelUp)
    currentHP: hero.stats.currentHP, // ✨ THÊM: Lưu HP hiện tại (sử dụng stats đã tính toán)
    name: hero.baseStats.name, // Thêm tên để tải lại (nếu cần)
	};
    
    // 2. Thu thập trạng thái Game và Nhiệm vụ
    const gameState = {
        dungeonId: getCurrentDungeon().id, 
        // DỮ LIỆU NHIỆM VỤ VÀ THEO DÕI
        questState: {
            activeQuests: activeQuests,
            totalGoldEarned: totalGoldEarned,
            totalEnemiesKilled: totalEnemiesKilled,
            // Thêm các biến theo dõi khác nếu có
        },
        // Thêm các biến trạng thái game khác nếu có
    };

    // 3. Tạo đối tượng Save
    const dataToSave = {
        timestamp: new Date().toISOString(),
        heroState: heroState,
        gameState: gameState,
    };

    // 4. Lưu vào Local Storage
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
        updateSaveLoadUI();
    } catch (e) {
        logMessage(`❌ Lỗi khi lưu game: ${e}`, 'error');
    }
};

/**
 * Tải dữ liệu từ Local Storage
 * @returns {object | null} Dữ liệu đã tải hoặc null nếu không có.
 */
export function loadGame() {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) {
        return null;
    }
    try {
        return JSON.parse(savedData);
    } catch (e) {
        logMessage(`❌ Lỗi khi đọc dữ liệu lưu: ${e}`, 'error');
        return null;
    }
}

/**
 * Tải game và bắt đầu trò chơi (Hàm này sẽ được gọi từ main.js)
 */
export function loadGameAndStart() {
    // 1. Tải dữ liệu từ Local Storage
    const savedData = loadGame();
    if (!savedData) {
        logMessage("⚠️ Không tìm thấy dữ liệu lưu để tải.", 'warning');
        return;
    }
    
    // Đảm bảo dừng combat nếu đang chạy
    window.stopCombat();
    
    // 2. Tái tạo Hero và Game state
    const heroName = savedData.heroState.name || 'Anh Hùng';
	window.startGameWithData(savedData); // Ví dụ: gọi hàm đã gán vào window
}
/**
 * Xóa dữ liệu lưu trữ game khỏi Local Storage.
 * @returns {boolean} true nếu xóa thành công.
 */
export function deleteSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
        return true;
    } catch (e) {
        logMessage(`❌ Lỗi khi xóa save: ${e}`, 'error');
        return false;
    }
}
/**
 * Cập nhật trạng thái của các nút Lưu/Tải (kiểm tra xem có dữ liệu lưu không).
 */
export function updateSaveLoadUI() {
    const loadBtn = document.getElementById('load-game-btn');
    const saveBtn = document.getElementById('save-game-btn');
    const deleteBtn = document.getElementById('delete-save-btn');
    const saveTimestampEl = document.getElementById('save-timestamp');

    const savedData = localStorage.getItem(SAVE_KEY);
    const hasSave = !!savedData; // Kiểm tra xem có dữ liệu lưu trữ không

    if (loadBtn) {
        loadBtn.disabled = !hasSave;
    }
    if (deleteBtn) {
        deleteBtn.disabled = !hasSave;
    }
    
    // Hiển thị thời gian lưu
    if (saveTimestampEl) {
        if (hasSave) {
            try {
                const data = JSON.parse(savedData);
                const timestamp = new Date(data.timestamp).toLocaleString();
                saveTimestampEl.textContent = `Lần lưu cuối: ${timestamp}`;
            } catch {
                saveTimestampEl.textContent = `Lần lưu cuối: Dữ liệu bị lỗi`;
            }
        } else {
            saveTimestampEl.textContent = 'Chưa có dữ liệu lưu trữ.';
        }
    }
}