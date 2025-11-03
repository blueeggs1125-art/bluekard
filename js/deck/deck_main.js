


window.deck = {
    精英: {},
    特殊: {},
    限定: {},
    普通: {}
};


window.deckCards = [];


window.cardCodes = {};


window.originalCountryCode = "";


const rarityLimits = {
    '精英': 1,
    '特殊': 2,
    '限定': 3,
    '普通': 4
};


document.addEventListener('DOMContentLoaded', function() {
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && code.startsWith('%%')) {
        
        window.originalCountryCode = code.substring(2, 4);
    }
    
    
    document.getElementById('modal-close').addEventListener('click', function() {
        document.getElementById('limit-modal').style.display = 'none';
    });
    
    
 
document.getElementById('cards-container').addEventListener('click', function(e) {
    const cardItem = e.target.closest('.card-item');
    if (!cardItem) return;
    
    const cardName = cardItem.dataset.name;
    const rarity = cardItem.dataset.rarity;
    const cardCode = cardItem.dataset.code;
    
    
    if (isRarityLimitReached(rarity, cardName)) {
        showLimitModal(rarity);
        return;
    }
    
    
    const totalCards = getTotalCards();
    if (totalCards >= 39) {
        document.getElementById('modal-message').textContent = '卡组已达到最大数量（39张）';
        document.getElementById('limit-modal').style.display = 'block';
        return;
    }
    
    
    addToDeck(cardName, rarity, cardItem.dataset.card, cardCode);
    
    
    updateDeckPreview();
    
    
    updateDeckCode();
    
    
    updateCardClickCount(cardItem, cardName, rarity);
});

function updateCardClickCount(cardItem, cardName, rarity) {
    
    const rarityLimits = {
        '精英': 1,
        '特殊': 2,
        '限定': 3,
        '普通': 4
    };
    
    const limit = rarityLimits[rarity] || 1;
    const currentCount = window.deck[rarity][cardName] || 0;
    const remainingClicks = limit - currentCount;
    
    
    const clicksElement = cardItem.querySelector('.card-clicks');
    if (clicksElement) {
        clicksElement.textContent = remainingClicks;
        
        if (remainingClicks <= 0) {
            clicksElement.style.opacity = '0.5';
        }
    }
}
    
    
    document.getElementById('preview-list').addEventListener('click', function(e) {
        const previewItem = e.target.closest('.preview-item');
        if (!previewItem) return;
        
        const cardName = previewItem.dataset.name;
        const rarity = previewItem.dataset.rarity;
        
        
        removeFromDeck(cardName, rarity);
        
        
        updateDeckPreview();
        
        
        updateDeckCode();
    });
    
    
    document.getElementById('save-btn').addEventListener('click', function() {
        const deckCode = document.getElementById('deck-code').textContent;
        if (deckCode) {
            copyToClipboard(deckCode);
            alert('卡组代码已复制到剪贴板');
        }
    });
    
    
    loadCardCodes();
});


async function loadCardCodes() {
    try {
        const response = await fetch('data/newk.json');
        if (!response.ok) {
            throw new Error('newk.json 网络响应错误');
        }
        const cardsData = await response.json();
        
        
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


function getTotalCards() {
    let total = 0;
    for (const rarity in window.deck) {
        for (const cardName in window.deck[rarity]) {
            total += window.deck[rarity][cardName];
        }
    }
    return total;
}


function isRarityLimitReached(rarity, cardName) {
    const limit = rarityLimits[rarity];
    const currentCount = window.deck[rarity][cardName] || 0;
    
    
    return currentCount >= limit;
}


function showLimitModal(rarity) {
    const limit = rarityLimits[rarity];
    document.getElementById('modal-message').textContent = `${rarity}类型至多只能选择${limit}张`;
    document.getElementById('limit-modal').style.display = 'block';
}


function addToDeck(cardName, rarity, cardData, cardCode) {
    
    if (!window.deck[rarity]) {
        window.deck[rarity] = {};
    }
    
    
    if (!window.deck[rarity][cardName]) {
        window.deck[rarity][cardName] = 0;
    }
    window.deck[rarity][cardName]++;
    
    
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


function removeFromDeck(cardName, rarity) {
    if (window.deck[rarity] && window.deck[rarity][cardName]) {
        window.deck[rarity][cardName]--;
        if (window.deck[rarity][cardName] <= 0) {
            delete window.deck[rarity][cardName];
            
            
            const cardIndex = window.deckCards.findIndex(card => card.name === cardName);
            if (cardIndex > -1) {
                window.deckCards.splice(cardIndex, 1);
            }
        }
    }
}


function updateDeckPreview() {
    const previewList = document.getElementById('preview-list');
    previewList.innerHTML = '';
    
    
    const sortedCards = [...window.deckCards].sort((a, b) => a.commandPoint - b.commandPoint);
    
    
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
    
    
    const totalCards = getTotalCards();
    document.getElementById('save-btn').disabled = totalCards === 0;
    
    
    const previewTitle = document.querySelector('.preview-title');
    previewTitle.textContent = `卡组预览 (${totalCards}/39)`;
}


function updateDeckCode() {
    
    const urlParams = new URLSearchParams(window.location.search);
    const fullCode = urlParams.get('code');
    
    if (!fullCode || !fullCode.startsWith('%%')) return;
    
    
    const originalCountryCode = fullCode.substring(2, 4);
    
    if (!originalCountryCode) return;
    
    
    const deckPart = generateDeckCode();
    
    
    const finalCode = `%%${originalCountryCode}|${deckPart}`;
    
    const deckCodeElement = document.getElementById('deck-code');
    deckCodeElement.textContent = finalCode;
    deckCodeElement.classList.add('visible');
}


function generateDeckCode() {
    const layers = { 0: [], 1: [], 2: [], 3: [] };

    
    const maxCount = {
        "精英": 1,
        "特殊": 2,
        "限定": 3,
        "普通": 4
    };

    
    for (const rarity in window.deck) {
        for (const cardName in window.deck[rarity]) {
            const count = window.deck[rarity][cardName];
            const code = window.cardCodes[cardName] || cardName.substring(0, 2);

            
            const cappedCount = Math.min(count, maxCount[rarity]);

            
            const layerIndex = cappedCount - 1;
            if (layerIndex >= 0 && layerIndex <= 3) {
                layers[layerIndex].push(code);
            }
        }
    }

    
    return `${layers[0].join('')};${layers[1].join('')};${layers[2].join('')};${layers[3].join('')}`;
}


function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}