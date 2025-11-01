// js/deck_us.js

// 其他辅助功能

// 按指挥点排序卡牌
function sortCardsByCommandPoint(cards) {
    return cards.sort((a, b) => {
        const cpA = parseInt(a.cardData?.详细信息?.["指挥点"]) || 0;
        const cpB = parseInt(b.cardData?.详细信息?.["指挥点"]) || 0;
        return cpA - cpB;
    });
}

// 获取卡牌类型选项
function getCardTypes(cards) {
    const types = new Set();
    cards.forEach(card => {
        const type = card.cardData?.详细信息?.类型;
        if (type) {
            types.add(type);
        }
    });
    return Array.from(types).sort();
}

// 更新类型选择器
function updateTypeSelector(types) {
    const typeSelect = document.getElementById('type-select');
    typeSelect.innerHTML = '<option value="">全部类型</option>';
    
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
}

// 检查卡牌是否为金卡
function isGoldenCard(card, imagesData) {
    const country = card.国家;
    const cardName = card.名称;
    
    if (imagesData[country] && imagesData[country]['金卡']) {
        return imagesData[country]['金卡'].some(imgPath => imgPath.includes(cardName));
    }
    
    return false;
}

// 格式化卡牌信息显示
function formatCardInfo(cardData) {
    const info = [];
    
    if (cardData.稀有度) info.push(`稀有度: ${cardData.稀有度}`);
    if (cardData.类型) info.push(`类型: ${cardData.类型}`);
    if (cardData["指挥点"]) info.push(`指挥点: ${cardData["指挥点"]}`);
    
    return info.join(', ');
}

// 显示卡牌详细信息（可选功能）
function showCardDetails(cardData) {
    // 可以实现模态框显示卡牌详细信息
    console.log('显示卡牌详细信息:', cardData);
}

// 从URL加载卡组
function loadDeckFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        try {
            // 这里可以实现从代码加载卡组的功能
            console.log('从URL加载卡组:', code);
        } catch (e) {
            console.error('加载卡组失败:', e);
        }
    }
}

// 初始化函数
function initDeckBuilder() {
    // 页面加载完成后执行的初始化操作
    loadDeckFromUrl();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initDeckBuilder);