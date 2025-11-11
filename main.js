// main.js

// =======================================================
// 1. IMPORTS
// =======================================================

// Import các hàm và biến CẦN THIẾT từ game.js
import { 
    initGame, 
    hero,
    logger, 
    startCombat, 
    stopCombat, 
    changeDungeon, 
    getCurrentDungeon,
    updateGameUI,
    logMessage,
    updateGoldEarned,
    startGameWithData // ✨ Cần thiết để khởi động game với dữ liệu đã tải
} from './modules/game.js';

// Import các hàm UI phức tạp
import { renderInventory, handleSellItem, handleEquipItem } from './modules/inventory.js';
import { renderUpgrades, handleUpgrade, renderDungeonMenu } from './modules/menu.js';
import { dungeonList } from './modules/data/dungeons.js'; 
import { saveGame, loadGame as loadGameFromSave, updateSaveLoadUI, deleteSave } from './modules/save.js';
import { initQuests } from './modules/quest.js';
import { renderQuests } from './modules/questUI.js';
import { renderShop} from './modules/shop.js';
// Giả định handleUseItem được import từ inventory.js hoặc một module item/consumable nào đó.
// Nếu chưa có, nó sẽ gây lỗi. Ở đây tôi giả định nó có sẵn hoặc bạn sẽ thêm sau.
// import { handleUseItem } from './modules/inventory.js'; 
// (Tạm thời bỏ qua import vì không có file để xác định) 


// =======================================================
// 2. HÀM CẬP NHẬT UI TOÀN CỤC (GLOBAL UPDATE)
// =======================================================

/**
 * Hàm tổng hợp cập nhật UI. 
 * Gọi các hàm cập nhật thành phần sau khi logic game thay đổi.
 */
function globalUpdateUI() {   
    updateGameUI(); 
	renderInventory(); // Không cần truyền hero, vì hero là export let
	renderUpgrades();
	renderQuests();
	renderShop();
    updateSaveLoadUI();
}
// Gán hàm cập nhật UI toàn cục ra window để các module khác có thể gọi
window.updateUI = globalUpdateUI; 


// =======================================================
// 3. HÀM XỬ LÝ LƯU/TẢI TOÀN CỤC (FIXED)
// =======================================================

/**
 * Xử lý tải game và khởi động game
 */
function loadGameAndStart() {
    const savedData = loadGameFromSave(); // ✨ FIX: Sử dụng hàm loadGameFromSave đã được import
    if (savedData) {
        logMessage("💾 Đã tải tiến trình thành công! Bắt đầu lại game.");
        // ✨ FIX: Gọi hàm startGameWithData từ game.js để tái tạo Hero
        // Dừng combat trước khi tải dữ liệu mới
        window.stopCombat(); 
        startGameWithData(savedData); 
        
    } else {
        logMessage("❌ Không tìm thấy dữ liệu lưu trữ.", 'error');
        // Nếu không có dữ liệu tải, chỉ cập nhật UI
        globalUpdateUI(); 
    }
}

// -------------------------------------------------------
// HÀM XỬ LÝ LƯU THỦ CÔNG (Tách ra để Event Listener gọn hơn)
// -------------------------------------------------------
function handleManualSave() {
    saveGame();
    // Sau khi lưu, cập nhật UI ngay lập tức
    window.updateUI();
}


// =======================================================
// 4. GÁN CÁC HÀM XỬ LÝ TOÀN CỤC (GLOBAL HANDLERS)
// =======================================================

// Gán các hàm cần thiết ra phạm vi toàn cục để có thể gọi từ HTML
window.startCombat = startCombat; 
window.stopCombat = stopCombat;
window.deleteSave = deleteSave;
window.handleSellItem = handleSellItem;
window.handleEquipItem = handleEquipItem;
window.handleUpgrade = handleUpgrade; 
window.changeDungeon = changeDungeon;
window.claimQuestReward = claimQuestReward;
window.updateGoldEarned = updateGoldEarned;
window.buyItem = buyItem;
window.handleManualSave = handleManualSave; // Gán hàm xử lý lưu
window.loadGameAndStart = loadGameAndStart; // Gán hàm xử lý tải game đã sửa

// ⚠️ CẦN SỬA: Không nên gán hero và startGameWithData vào window nếu không cần thiết
// Các module khác đã import chúng. Giữ lại nếu bạn cần truy cập từ console.
window.startGameWithData = startGameWithData;
window.hero = hero; 


// =======================================================
// 5. KHỞI CHẠY LẦN ĐẦU & EVENT LISTENERS
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo game (lần đầu tiên)
    initGame();
    globalUpdateUI();

    // 2. Gán sự kiện cho các nút Combat (Sử dụng Event Listener tốt hơn onclick)
    const startBtn = document.getElementById('start-combat-btn');
    const stopBtn = document.getElementById('stop-combat-btn');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            window.startCombat();
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            window.stopCombat();
        });
    }
    
	// Gán sự kiện cho các nút LƯU / TẢI
    const saveBtn = document.getElementById('save-game-btn');
    const loadBtn = document.getElementById('load-game-btn');
    const deleteBtn = document.getElementById('delete-save-btn');

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            window.handleManualSave(); 
        });
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            window.loadGameAndStart(); // ✅ GỌI HÀM XỬ LÝ TẢI GAME ĐÃ SỬA
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            // Gọi hàm deleteSave đã được gán vào window
            if (window.deleteSave && window.deleteSave()) {
                // Sau khi xóa, cập nhật lại UI và trạng thái
                window.updateUI(); 
                logMessage("🗑️ Đã xóa tiến trình lưu trữ.", 'warn');
            } else {
                logMessage("❌ Không thể xóa tiến trình lưu trữ.", 'error');
            }
        });
    }
    
    // 3. Cập nhật UI ban đầu để hiển thị trạng thái nút Tải game
    updateSaveLoadUI();
});