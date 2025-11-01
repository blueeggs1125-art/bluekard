// js/deck_code.js

// 解析卡组代码
function parseDeckCode(code) {
    // 格式: %%12|AB;UX;GSQ8;LQP1
    if (!code.startsWith('%%')) return null;
    
    const parts = code.substring(2).split('|');
    if (parts.length !== 2) return null;
    
    const countryCode = parts[0];
    const deckPart = parts[1];
    
    // 解析国家代码
    const mainCountryId = parseInt(countryCode.charAt(0));
    const secondaryCountryId = parseInt(countryCode.charAt(1));
    
    // 解析卡组部分（根据分号位置确定稀有度）
    const sections = deckPart.split(';');
    if (sections.length !== 4) return null;
    
    // 按照分号位置解析（不是根据重复数量，而是根据分号位置）
    const 精英Cards = sections[0] ? parseCardSection(sections[0]) : [];  // 第1部分 - 精英
    const 特殊Cards = sections[1] ? parseCardSection(sections[1]) : [];  // 第2部分 - 特殊
    const 限定Cards = sections[2] ? parseCardSection(sections[2]) : [];  // 第3部分 - 限定
    const 普通Cards = sections[3] ? parseCardSection(sections[3]) : [];  // 第4部分 - 普通
    
    return {
        mainCountryId,
        secondaryCountryId,
        精英Cards,
        特殊Cards,
        限定Cards,
        普通Cards
    };
}

// 解析卡牌部分 - 每两个字符为一个卡牌代码
function parseCardSection(section) {
    const cards = [];
    
    // 每两个字符为一个卡牌代码
    for (let i = 0; i < section.length; i += 2) {
        const code = section.substring(i, i + 2);
        if (code.length === 2) {
            cards.push(code);
        }
    }
    
    return cards;
}

// 验证卡组代码
function validateDeckCode(code) {
    try {
        const parsed = parseDeckCode(code);
        if (!parsed) return false;
        
        // 验证数量限制（根据稀有度类型）
        const rarityLimits = {
            '精英': 1,  // 分号前0个位置，最多1张
            '特殊': 2,  // 分号前1个位置，最多2张
            '限定': 3,  // 分号前2个位置，最多3张
            '普通': 4   // 分号前3个位置，最多4张
        };
        
        // 检查每种稀有度的数量是否符合限制
        if (parsed.精英Cards.length > rarityLimits['精英']) return false;
        if (parsed.特殊Cards.length > rarityLimits['特殊']) return false;
        if (parsed.限定Cards.length > rarityLimits['限定']) return false;
        if (parsed.普通Cards.length > rarityLimits['普通']) return false;
        
        return true;
    } catch (e) {
        return false;
    }
}

// 导出卡组代码生成函数
function exportDeckCode() {
    // 这已经在deck_main.js中实现了
    // 这里保留作为接口
    return generateDeckCode();
}

// 从卡组代码重建卡组结构
function rebuildDeckFromCode(code) {
    const parsed = parseDeckCode(code);
    if (!parsed) return null;
    
    // 重建卡组结构
    const deck = {
        精英: {},
        特殊: {},
        限定: {},
        普通: {}
    };
    
    // 反向映射：从卡牌代码到卡牌名称
    const codeToName = {};
    for (const [name, code] of Object.entries(window.cardCodes)) {
        codeToName[code] = name;
    }
    
    // 统计每种稀有度的卡牌数量
    const countCards = (cards) => {
        const counts = {};
        cards.forEach(card => {
            // 使用代码查找名称，如果找不到则使用代码本身
            const cardName = codeToName[card] || card;
            counts[cardName] = (counts[cardName] || 0) + 1;
        });
        return counts;
    };
    
    // 应用到卡组结构
    Object.assign(deck.精英, countCards(parsed.精英Cards));
    Object.assign(deck.特殊, countCards(parsed.特殊Cards));
    Object.assign(deck.限定, countCards(parsed.限定Cards));
    Object.assign(deck.普通, countCards(parsed.普通Cards));
    
    return deck;
}