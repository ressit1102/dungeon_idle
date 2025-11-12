// modules/shop.js

import { hero, logMessage } from './game.js';
import { CONSUMABLE_TEMPLATES } from './data/items.js'; 

/**
 * Định nghĩa danh sách vật phẩm được bán trong shop.
 * (Mục tiêu đơn giản: Chỉ bán Potions)
 */
export const shopItems = [
    CONSUMABLE_TEMPLATES['Health Potion'],
    CONSUMABLE_TEMPLATES['Greater Health Potion'],
    // Bạn có thể thêm các vật phẩm khác ở đây
];

/**
 * Xử lý việc Hero mua một vật phẩm từ Shop.
 * Hàm này sẽ được gán vào window để gọi từ UI.
 * @param {string} itemId - ID của vật phẩm (ví dụ: 'Health Potion').
 */
window.buyItem = function(itemId) {
    // 1. Tìm vật phẩm
    const itemToBuy = shopItems.find(item => item.id === itemId);

    if (!itemToBuy) {
        logMessage(`⚠️ Lỗi: Không tìm thấy vật phẩm **${itemId}** trong Shop.`, 'error');
        return;
    }

    const cost = itemToBuy.buyPrice;

    // 2. Kiểm tra Vàng
    if (hero.baseStats.gold < cost) {
        logMessage(`⚠️ Không đủ Vàng (${cost}💰) để mua **${itemToBuy.name}**!`, 'warn');
        return;
    }
    
    // 3. Kiểm tra Kho đồ (chỉ kiểm tra nếu không phải là Consumable, nhưng Potion thường stack)
    // Giả định Potion là Consumable và có thể stack, nên không cần kiểm tra kho đầy.
    // Nếu bạn muốn Potion không stack, bạn cần cập nhật logic addItemToInventory trong hero.js
    
    // 4. Trừ Vàng
    hero.baseStats.gold -= cost;
    
    // 5. Thêm Vật phẩm vào Kho đồ
    // Cần tạo một bản sao của item template để tránh thay đổi template gốc
    const boughtItem = { 
        ...itemToBuy, 
        sellValue: itemToBuy.sellValue || 0, // Đảm bảo có sellValue
        // Consumable không có stats phức tạp, chỉ cần sao chép
    };

    if (hero.addItemToInventory(boughtItem)) { 
        logMessage(`🛒 Đã mua <span class="text-blue-400">${itemToBuy.name}</span> với giá ${cost} Vàng.`, 'info');
    } else {
        // Trường hợp này xảy ra khi inventory.js bị giới hạn kích thước
        logMessage(`⚠️ Kho đồ đầy! Không thể mua **${itemToBuy.name}**.`, 'warn');
        // Hoàn lại tiền
        hero.baseStats.gold += cost; 
    }
    
    // 6. Cập nhật UI và Save Game
    hero.calculateStats();
    if (window.updateUI) {
        window.updateUI();
    }
    window.saveGame();
};

/**
 * Hiển thị giao diện Shop.
 */
export function renderShop() {
    const shopDiv = document.getElementById('shop-menu-content'); // Giả định ID mới
    if (!shopDiv) return;

    let shopHTML = '<div class="space-y-3">';
    
    shopItems.forEach(item => {
        const canAfford = hero.baseStats.gold >= item.buyPrice;
        const buttonClass = canAfford 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-gray-400 cursor-not-allowed';
            
        shopHTML += `
            <div class="flex justify-between items-center p-2 border-b border-gray-200">
                <div>
                    <p class="font-bold text-gray-800">${item.name} <span class="text-sm text-red-500">(${item.effect === 'healHP' ? `Hồi ${item.value} HP` : 'Hiệu ứng'})</span></p>
                    <p class="text-sm text-gray-500">Giá: <span class="text-yellow-600 font-semibold">${item.buyPrice}💰</span></p>
                </div>
                <button 
                    onclick="buyItem('${item.id}')" 
                    class="text-white text-xs px-3 py-1 rounded ${buttonClass} transition duration-150"
                    ${!canAfford ? 'disabled' : ''}>
                    Mua
                </button>
            </div>
        `;
    });

    shopHTML += '</div>';
    shopDiv.innerHTML = shopHTML;
}