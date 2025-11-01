// code.js

// 解析卡组代码
function parseDeckCode(code) {
    if (!code.startsWith('%%') || !code.endsWith('|')) {
        return null;
    }
    
    // 提取主体部分
    const body = code.substring(2, code.length - 1);
    
    // 分离国家代码和卡牌代码
    const match = body.match(/^(\d+)(.*)$/);
    if (!match) {
        return null;
    }
    
    const countryCode = match[1];
    const cardCodesString = match[2];
    
    // 解析卡牌代码
    const cardCodes = cardCodesString.split(';').filter(code => code !== '');
    
    // 统计每张卡的数量
    const cardCounts = {};
    cardCodes.forEach(code => {
        cardCounts[code] = (cardCounts[code] || 0) + 1;
    });
    
    return {
        countryCode: parseInt(countryCode),
        cardCounts: cardCounts
    };
}

// 根据代码加载卡组
async function loadDeckFromCode(code) {
    const parsed = parseDeckCode(code);
    if (!parsed) {
        return null;
    }
    
    try {
        // 加载卡牌代码映射
        const response = await fetch('data/cardcode.json');
        const codesData = await response.json();
        
        // 将importId映射回cardId
        const deckCards = [];
        for (const [importId, count] of Object.entries(parsed.cardCounts)) {
            const cardEntry = codesData.find(c => c.importId === importId);
            if (cardEntry) {
                deckCards.push({
                    card: cardEntry,
                    count: count
                });
            }
        }
        
        return {
            countryCode: parsed.countryCode,
            cards: deckCards
        };
    } catch (error) {
        console.error('加载卡组失败:', error);
        return null;
    }
}