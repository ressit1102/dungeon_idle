// modules/logger.js

export class Logger {
    constructor() {
        this.logElement = document.getElementById('game-log');
    }

    /**
     * Ghi lại một thông báo vào log trò chơi.
     * @param {string} message 
     */
    log(message) {
        if (this.logElement) {
            const entry = document.createElement('p');
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            // Sử dụng innerHTML để hỗ trợ Markdown/CSS đơn giản trong log
            entry.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> ${message}`; 
            
            this.logElement.prepend(entry); 

            // Giới hạn số lượng log
            while (this.logElement.children.length > 50) {
                this.logElement.removeChild(this.logElement.lastChild);
            }
        } else {
            console.log(`[LOG]: ${message}`);
        }
    }

    clear() {
        if (this.logElement) {
            this.logElement.innerHTML = '';
        }
    }
}