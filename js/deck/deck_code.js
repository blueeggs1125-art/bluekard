


function parseDeckCode(code) {
    
    if (!code.startsWith('%%')) return null;
    
    const parts = code.substring(2).split('|');
    if (parts.length !== 2) return null;
    
    const countryCode = parts[0];
    const deckPart = parts[1];
    
    
    const mainCountryId = parseInt(countryCode.charAt(0));
    const secondaryCountryId = parseInt(countryCode.charAt(1));
    
    
    const sections = deckPart.split(';');
    if (sections.length !== 4) return null;
    
    
    const 精英Cards = sections[0] ? parseCardSection(sections[0]) : [];  
    const 特殊Cards = sections[1] ? parseCardSection(sections[1]) : [];  
    const 限定Cards = sections[2] ? parseCardSection(sections[2]) : [];  
    const 普通Cards = sections[3] ? parseCardSection(sections[3]) : [];  
    
    return {
        mainCountryId,
        secondaryCountryId,
        精英Cards,
        特殊Cards,
        限定Cards,
        普通Cards
    };
}


function parseCardSection(section) {
    const cards = [];
    
    
    for (let i = 0; i < section.length; i += 2) {
        const code = section.substring(i, i + 2);
        if (code.length === 2) {
            cards.push(code);
        }
    }
    
    return cards;
}


function validateDeckCode(code) {
    try {
        const parsed = parseDeckCode(code);
        if (!parsed) return false;
        
        
        const rarityLimits = {
            '精英': 1,  
            '特殊': 2,  
            '限定': 3,  
            '普通': 4   
        };
        
        
        if (parsed.精英Cards.length > rarityLimits['精英']) return false;
        if (parsed.特殊Cards.length > rarityLimits['特殊']) return false;
        if (parsed.限定Cards.length > rarityLimits['限定']) return false;
        if (parsed.普通Cards.length > rarityLimits['普通']) return false;
        
        return true;
    } catch (e) {
        return false;
    }
}


function exportDeckCode() {
    
    
    return generateDeckCode();
}


function rebuildDeckFromCode(code) {
    const parsed = parseDeckCode(code);
    if (!parsed) return null;
    
    
    const deck = {
        精英: {},
        特殊: {},
        限定: {},
        普通: {}
    };
    
    
    const codeToName = {};
    for (const [name, code] of Object.entries(window.cardCodes)) {
        codeToName[code] = name;
    }
    
    
    const countCards = (cards) => {
        const counts = {};
        cards.forEach(card => {
            
            const cardName = codeToName[card] || card;
            counts[cardName] = (counts[cardName] || 0) + 1;
        });
        return counts;
    };
    
    
    Object.assign(deck.精英, countCards(parsed.精英Cards));
    Object.assign(deck.特殊, countCards(parsed.特殊Cards));
    Object.assign(deck.限定, countCards(parsed.限定Cards));
    Object.assign(deck.普通, countCards(parsed.普通Cards));
    
    return deck;
}