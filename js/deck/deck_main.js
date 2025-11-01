// js/deck_main.js

// 卡组数据结构 - 记录每张卡牌的数量
window.deck = {
    精英: {},
    特殊: {},
    限定: {},
    普通: {}
};

// 卡组中的所有卡牌（包含详细信息）
window.deckCards = [];

// 卡牌代码映射
window.cardCodes = {};

// 保存从card.html传递过来的原始国家代码
window.originalCountryCode = "";

// 稀有度限制
const rarityLimits = {
    '精英': 1,
    '特殊': 2,
    '限定': 3,
    '普通': 4
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 解析并保存从URL传递的原始国家代码
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && code.startsWith('%%')) {
        // 提取国家代码部分 (例如从 %%12|... 中提取 12)
        window.originalCountryCode = code.substring(2, 4);
    }
    
    // 设置弹窗关闭事件
    document.getElementById('modal-close').addEventListener('click', function() {
        document.getElementById('limit-modal').style.display = 'none';
    });
    
    // 点击卡牌事件委托
 // deck_main.js 中的点击卡牌事件委托修改
document.getElementById('cards-container').addEventListener('click', function(e) {
    const cardItem = e.target.closest('.card-item');
    if (!cardItem) return;
    
    const cardName = cardItem.dataset.name;
    const rarity = cardItem.dataset.rarity;
    const cardCode = cardItem.dataset.code;
    
    // 检查是否超过该稀有度的限制
    if (isRarityLimitReached(rarity, cardName)) {
        showLimitModal(rarity);
        return;
    }
    
    // 检查卡组是否已满（39张）
    const totalCards = getTotalCards();
    if (totalCards >= 39) {
        document.getElementById('modal-message').textContent = '卡组已达到最大数量（39张）';
        document.getElementById('limit-modal').style.display = 'block';
        return;
    }
    
    // 添加到卡组
    addToDeck(cardName, rarity, cardItem.dataset.card, cardCode);
    
    // 更新预览
    updateDeckPreview();
    
    // 更新卡组代码，使用原始国家代码
    updateDeckCode();
    
    // 更新卡牌上的点击次数显示
    updateCardClickCount(cardItem, cardName, rarity);
});

function updateCardClickCount(cardItem, cardName, rarity) {
    // 获取稀有度限制
    const rarityLimits = {
        '精英': 1,
        '特殊': 2,
        '限定': 3,
        '普通': 4
    };
    
    const limit = rarityLimits[rarity] || 1;
    const currentCount = window.deck[rarity][cardName] || 0;
    const remainingClicks = limit - currentCount;
    
    // 更新卡牌上的点击次数显示
    const clicksElement = cardItem.querySelector('.card-clicks');
    if (clicksElement) {
        clicksElement.textContent = remainingClicks;
        // 如果没有剩余点击次数，可以改变样式
        if (remainingClicks <= 0) {
            clicksElement.style.opacity = '0.5';
        }
    }
}
    
    // 点击预览项事件委托（用于移除卡牌）
    document.getElementById('preview-list').addEventListener('click', function(e) {
        const previewItem = e.target.closest('.preview-item');
        if (!previewItem) return;
        
        const cardName = previewItem.dataset.name;
        const rarity = previewItem.dataset.rarity;
        
        // 从卡组中移除一张
        removeFromDeck(cardName, rarity);
        
        // 更新预览
        updateDeckPreview();
        
        // 更新卡组代码，使用原始国家代码
        updateDeckCode();
    });
    
    // 保存按钮事件
    document.getElementById('save-btn').addEventListener('click', function() {
        const deckCode = document.getElementById('deck-code').textContent;
        if (deckCode) {
            copyToClipboard(deckCode);
            alert('卡组代码已复制到剪贴板');
        }
    });
    
    // 加载卡牌代码数据
    loadCardCodes();
});

// 加载卡牌代码数据
async function loadCardCodes() {
    try {
        const response = await fetch('data/newk.json');
        if (!response.ok) {
            throw new Error('newk.json 网络响应错误');
        }
        const cardsData = await response.json();
        
        // 构建卡牌代码映射
        cardsData.forEach(card => {
            const cardName = card.名称;
            const cardCode = card.详细信息?.["卡牌代码"];
            if (cardCode) {
                window.cardCodes[cardName] = cardCode;
            }
        });
    } catch (error) {
        console.error('加载卡牌代码数据出错:', error);
    }
}

// 获取卡组总卡牌数
function getTotalCards() {
    let total = 0;
    for (const rarity in window.deck) {
        for (const cardName in window.deck[rarity]) {
            total += window.deck[rarity][cardName];
        }
    }
    return total;
}

// 检查稀有度是否达到限制（根据分号位置判断）
function isRarityLimitReached(rarity, cardName) {
    const limit = rarityLimits[rarity];
    const currentCount = window.deck[rarity][cardName] || 0;
    
    // 同一张卡牌可以重复添加
    return currentCount >= limit;
}

// 显示限制弹窗
function showLimitModal(rarity) {
    const limit = rarityLimits[rarity];
    document.getElementById('modal-message').textContent = `${rarity}类型至多只能选择${limit}张`;
    document.getElementById('limit-modal').style.display = 'block';
}

// 添加卡牌到卡组
function addToDeck(cardName, rarity, cardData, cardCode) {
    // 初始化稀有度对象
    if (!window.deck[rarity]) {
        window.deck[rarity] = {};
    }
    
    // 增加卡牌计数
    if (!window.deck[rarity][cardName]) {
        window.deck[rarity][cardName] = 0;
    }
    window.deck[rarity][cardName]++;
    
    // 添加卡牌详细信息（如果还没有）
    const existingCard = window.deckCards.find(card => card.name === cardName);
    if (!existingCard) {
        const cardInfo = JSON.parse(decodeURIComponent(cardData));
        window.deckCards.push({
            name: cardName,
            code: cardCode,
            rarity: rarity,
            commandPoint: parseInt(cardInfo.详细信息?.["指挥点"]) || 0,
            data: cardInfo
        });
    }
}

// 从卡组中移除卡牌
function removeFromDeck(cardName, rarity) {
    if (window.deck[rarity] && window.deck[rarity][cardName]) {
        window.deck[rarity][cardName]--;
        if (window.deck[rarity][cardName] <= 0) {
            delete window.deck[rarity][cardName];
            
            // 从详细信息数组中移除
            const cardIndex = window.deckCards.findIndex(card => card.name === cardName);
            if (cardIndex > -1) {
                window.deckCards.splice(cardIndex, 1);
            }
        }
    }
}

// 更新卡组预览
function updateDeckPreview() {
    const previewList = document.getElementById('preview-list');
    previewList.innerHTML = '';
    
    // 按指挥点排序
    const sortedCards = [...window.deckCards].sort((a, b) => a.commandPoint - b.commandPoint);
    
    // 显示排序后的卡牌
    sortedCards.forEach(card => {
        const count = window.deck[card.rarity][card.name] || 0;
        if (count > 0) {
            const listItem = document.createElement('li');
            listItem.className = 'preview-item';
            listItem.dataset.name = card.name;
            listItem.dataset.rarity = card.rarity;
            listItem.innerHTML = `
                <div class="preview-info">
                    <div class="preview-name">${card.name}</div>
                    <div class="preview-cost">指挥点: ${card.commandPoint}</div>
                </div>
                <div class="preview-count">X${count}</div>
            `;
            previewList.appendChild(listItem);
        }
    });
    
    // 启用保存按钮
    const totalCards = getTotalCards();
    document.getElementById('save-btn').disabled = totalCards === 0;
    
    // 更新标题显示卡牌数量
    const previewTitle = document.querySelector('.preview-title');
    previewTitle.textContent = `卡组预览 (${totalCards}/39)`;
}

// 更新卡组代码 - 使用原始国家代码
function updateDeckCode() {
    // 永远从URL参数中获取原始国家代码，永不使用可能被修改的 window.originalCountryCode
    const urlParams = new URLSearchParams(window.location.search);
    const fullCode = urlParams.get('code');
    
    if (!fullCode || !fullCode.startsWith('%%')) return;
    
    // 从原始URL中提取国家代码部分（例如从 %%12|... 中提取 12）
    const originalCountryCode = fullCode.substring(2, 4);
    
    if (!originalCountryCode) return;
    
    // 生成卡组部分代码
    const deckPart = generateDeckCode();
    
    // 构建完整代码，使用从URL中提取的原始国家代码
    const finalCode = `%%${originalCountryCode}|${deckPart}`;
    
    const deckCodeElement = document.getElementById('deck-code');
    deckCodeElement.textContent = finalCode;
    deckCodeElement.classList.add('visible');
}


function generateDeckCode() {
    const layers = { 0: [], 1: [], 2: [], 3: [] };

    // 定义每种稀有度的最大次数
    const maxCount = {
        "精英": 1,
        "特殊": 2,
        "限定": 3,
        "普通": 4
    };

    // 遍历所有卡牌
    for (const rarity in window.deck) {
        for (const cardName in window.deck[rarity]) {
            const count = window.deck[rarity][cardName];
            const code = window.cardCodes[cardName] || cardName.substring(0, 2);

            // 限制点击次数不超过最大上限
            const cappedCount = Math.min(count, maxCount[rarity]);

            // 放入对应层级（count 次对应层级 count-1）
            const layerIndex = cappedCount - 1;
            if (layerIndex >= 0 && layerIndex <= 3) {
                layers[layerIndex].push(code);
            }
        }
    }

    // 拼接结果（全局三个分号）
    return `${layers[0].join('')};${layers[1].join('')};${layers[2].join('')};${layers[3].join('')}`;
}

// 复制到剪贴板
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}