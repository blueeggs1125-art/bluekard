


function encodeImagePath(path) {
    
    return path.split('/').map(part => encodeURIComponent(part)).join('/');
}


const countrySelector = document.getElementById('country-selector');
const subtypeSelect = document.getElementById('subtype-select');
const raritySelect = document.getElementById('rarity-select');
const typeSelect = document.getElementById('type-select');
const commandPointsSelect = document.getElementById('command-point-select');
const statusSelect = document.getElementById('status-select');
const searchInput = document.getElementById('search-input');
const cardsContainer = document.getElementById('cards-container');

const derivedSelect = document.getElementById('derived-select');
const mobileDerivedSelect = document.getElementById('mobile-derived-select');


const countries = [
    { id: 1, name: '德国', folder: '德国', iconFolder: '国家图标/德国', iconFile: 'FactionIcon_GER_256_Color.png' },
    { id: 2, name: '英国', folder: '英国', iconFolder: '国家图标/英国', iconFile: 'Brit2.png' },
    { id: 3, name: '日本', folder: '日本', iconFolder: '国家图标/日本', iconFile: 'FactionIcon_JAP_256_Color.png' },
    { id: 4, name: '苏联', folder: '苏联', iconFolder: '国家图标/苏联', iconFile: 'FactionIcon_SOV_256_Color.png' },
    { id: 5, name: '美国', folder: '美国', iconFolder: '国家图标/美国', iconFile: 'FactionIcon_USA_256_Color.png' },
    { id: 6, name: '法国', folder: '法国', iconFolder: '国家图标/法国', iconFile: 'FactionIcon_FRA_256_Color.png' },
    { id: 7, name: '意大利', folder: '意大利', iconFolder: '国家图标/意大利', iconFile: 'FactionIcon_ITA_256_Color.png' },
    { id: 8, name: '波兰', folder: '波兰', iconFolder: '国家图标/波兰', iconFile: 'FactionIcon_POL_512_Color.png' },
    { id: 9, name: '芬兰', folder: '芬兰', iconFolder: '国家图标/芬兰', iconFile: 'FactionIcon_FIN_1024_Color.png' }
];


document.addEventListener('DOMContentLoaded', function() {
    loadCountryIcons();
    setupEventListeners();
    
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && code.startsWith('%%')) {
        parseCountryCode(code);
    }
    
    
    initFilters();
});


function initFilters() {
    
    updateTypeSelector([]);
    
    
    commandPointsSelect.innerHTML = `
        <option value="">全部指挥点</option>
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7+">7+</option>
    `;
    
    
    statusSelect.innerHTML = `
        <option value="">全部状态</option>
        <option value="true">活跃</option>
        <option value="false">预备</option>
    `;
    
    
    derivedSelect.innerHTML = `
        <option value="">全部</option>
        <option value="true">真</option>
        <option value="fake">假</option>
    `;
    
    
    mobileDerivedSelect.innerHTML = `
        <option value="">全部</option>
        <option value="true">真</option>
        <option value="fake">假</option>
    `;
}


function loadCountryIcons() {
    const countryIconsContainer = document.getElementById('country-selector');
    countryIconsContainer.innerHTML = '';
    
    countries.forEach(country => {
        const countryItem = document.createElement('div');
        countryItem.className = 'country-option';
        countryItem.dataset.countryId = country.id;
        
        countryItem.innerHTML = `
            <img src="image2/${country.iconFolder}/${country.iconFile}" alt="${country.name}" class="country-image">
            <div class="country-name">${country.name}</div>
        `;
        
        countryIconsContainer.appendChild(countryItem);
    });
}


function parseCountryCode(code) {
    
    const countryCode = code.substring(2, 4);
    const mainCountryId = parseInt(countryCode.charAt(0));
    const secondaryCountryId = parseInt(countryCode.charAt(1));
    
    
    if (mainCountryId) {
        const mainCountryElement = document.querySelector(`.country-option[data-country-id="${mainCountryId}"]`);
        if (mainCountryElement) {
            mainCountryElement.classList.add('selected');
            window.selectedMainCountry = mainCountryId;
        }
    }
    
    
    if (secondaryCountryId) {
        const secondaryCountryElement = document.querySelector(`.country-option[data-country-id="${secondaryCountryId}"]`);
        if (secondaryCountryElement) {
            secondaryCountryElement.classList.add('selected');
            window.selectedSecondaryCountry = secondaryCountryId;
        }
    }
    
    
    updateDisabledState();
    
    
    hideUnselectedCountries();
    
    
    if (window.selectedMainCountry && window.selectedSecondaryCountry) {
        loadCardsForCountries();
    }
}


function hideUnselectedCountries() {
    const countryItems = document.querySelectorAll('.country-option');
    
    countryItems.forEach(item => {
        const countryId = parseInt(item.dataset.countryId);
        
        
        if (countryId !== window.selectedMainCountry && countryId !== window.selectedSecondaryCountry) {
            item.style.display = 'none';
        }
    });
}


function updateDisabledState() {
    const countryItems = document.querySelectorAll('.country-option');
    
    countryItems.forEach(item => {
        const countryId = parseInt(item.dataset.countryId);
        
        if (window.selectedMainCountry !== null && countryId === window.selectedMainCountry) {
            item.classList.add('disabled');
        } else {
            item.classList.remove('disabled');
        }
    });
}


function setupEventListeners() {
    
    
    
    raritySelect.addEventListener('change', filterCards);
    typeSelect.addEventListener('change', filterCards);
    commandPointsSelect.addEventListener('change', filterCards);
    statusSelect.addEventListener('change', filterCards);
    
    derivedSelect.addEventListener('change', filterCards);
    mobileDerivedSelect.addEventListener('change', filterCards);
    searchInput.addEventListener('input', filterCards);
    
    
    if (typeSelect) {
        typeSelect.addEventListener('change', filterCards);
    }
}


async function loadCardsForCountries() {

    
    cardsContainer.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        
        const response = await fetch('data/newk.json');
        if (!response.ok) {
            throw new Error('newk.json 网络响应错误');
        }
        const cardsData = await response.json();
        
        
        const imagesResponse = await fetch('data/newimages.json');
        if (!imagesResponse.ok) {
            throw new Error('newimages.json 网络响应错误');
        }
        const imagesData = await imagesResponse.json();
        
        
        const selectedCountries = [];
        const mainCountryName = window.selectedMainCountry ? countries.find(c => c.id === window.selectedMainCountry)?.name : null;
        const secondaryCountryName = window.selectedSecondaryCountry ? countries.find(c => c.id === window.selectedSecondaryCountry)?.name : null;
        
        if (mainCountryName) selectedCountries.push(mainCountryName);
        if (secondaryCountryName) selectedCountries.push(secondaryCountryName);
        
        
        let filteredCards = cardsData.filter(card => 
            selectedCountries.includes(card.国家)
        );
        
        
        
        
        filteredCards = filteredCards.filter(card => {
            
            if (window.selectedMainCountry && card.国家 === mainCountryName) {
                return true;
            }
            
            if (window.selectedSecondaryCountry && card.国家 === secondaryCountryName) {
                
                const isGold = isGoldenCard(card, imagesData);
                
                const isElite = card.详细信息?.稀有度 === '精英';
                
                return !(isGold || isElite);
            }
            return true;
        });
        
        if (filteredCards.length === 0) {
            cardsContainer.innerHTML = '<div class="no-cards">未找到匹配的卡牌</div>';
            return;
        }
        
        
        let cardImages = [];
        filteredCards.forEach(card => {
            const country = card.国家;
            const cardName = card.名称;
            
            
            if (imagesData[country]) {
                for (const subtype in imagesData[country]) {
                    const foundImage = imagesData[country][subtype].find(imgPath => 
                        imgPath.includes(cardName)
                    );
                    if (foundImage) {
                        cardImages.push({
                            path: foundImage,
                            name: cardName,
                            cardData: card
                        });
                        break;
                    }
                }
            }
        });
        
        
        cardImages = sortCardsByCommandPoint(cardImages);
        
        
        const types = getCardTypes(cardImages);
        updateTypeSelector(types);
        
        renderCards(cardImages);
        
        
        setTimeout(filterCards, 0);
        
    } catch (error) {
        console.error('加载卡牌出错:', error);
        cardsContainer.innerHTML = '<div class="no-cards">加载卡牌失败</div>';
    }
}


function isGoldenCard(card, imagesData) {
    const country = card.国家;
    const cardName = card.名称;
    
    if (imagesData[country] && imagesData[country]['金卡']) {
        return imagesData[country]['金卡'].some(imgPath => imgPath.includes(cardName));
    }
    
    return false;
}



function sortCardsByCommandPoint(cards) {
    return cards.sort((a, b) => {
        const cpA = parseInt(a.cardData?.详细信息?.["指挥点"]) || 0;
        const cpB = parseInt(b.cardData?.详细信息?.["指挥点"]) || 0;
        return cpA - cpB;
    });
}


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


function updateTypeSelector(types) {
    typeSelect.innerHTML = '<option value="">全部类型</option>';
    
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
    
    
}


function renderCards(cards) {
    if (cards.length === 0) {
        cardsContainer.innerHTML = '<div class="no-cards">未找到匹配的卡牌</div>';
        return;
    }
    
    let html = '';
    cards.forEach(card => {
        
        const imagePath = card.path;
        const encodedImagePath = encodeImagePath(imagePath);
        const fileName = imagePath.split('/').pop();
        const displayName = card.name || fileName;
        
        
        const rarity = card.cardData?.详细信息?.稀有度 || '未知';
        
        
        const cardCode = card.cardData?.详细信息?.["卡牌代码"] || '';
        
        
        const isReserve = card.cardData?.详细信息?.活跃 === "false";
        
        
        const rarityLimits = {
            '精英': 1,
            '特殊': 2,
            '限定': 3,
            '普通': 4
        };
        const maxClicks = rarityLimits[rarity] || 1;
        
        
        if (card.name === "步兵第七十七联队") {
            console.log("步兵第七十七联队卡牌信息:", card);
            console.log("稀有度:", rarity);
        }
        
        html += `
    <div class="card-item" 
         data-name="${card.name}" 
         data-rarity="${rarity}"
         data-code="${cardCode}"
         data-card="${encodeURIComponent(JSON.stringify(card.cardData))}">
        <img src="${encodedImagePath}" alt="${displayName}">
        <div class="card-indicators" data-rarity="${rarity}"></div>
        ${isReserve ? `<img 
            src="image/T_nui-icon-Reserves-gritty-256.png" 
            alt="预备" 
            style="position:absolute;bottom:5px;right:2px;width:15px;height:15px;z-index:10;"
        >` : ''}
        <div class="card-clicks" style="position:absolute;bottom:5px;left:5px;background-color:rgba(0,0,0,0.7);color:white;font-size:12px;font-weight:bold;padding:2px 6px;border-radius:10px;z-index:10;">
            ${maxClicks}
        </div>
    </div>
`;
    });
    
    cardsContainer.innerHTML = html;
    
    
    setTimeout(filterCards, 0);
}








function filterCards() {
    const rarity = raritySelect.value;
    const type = typeSelect.value;
    const commandPoints = commandPointsSelect.value;
    const status = statusSelect.value;
    
    const derived = derivedSelect.value || mobileDerivedSelect.value;
    const search = searchInput.value.trim().toLowerCase();

    const cardItems = document.querySelectorAll('.card-item');
    
    cardItems.forEach(item => {
        const cardName = item.dataset.name.toLowerCase();
        const cardData = JSON.parse(decodeURIComponent(item.dataset.card));
        const cardRarity = cardData.详细信息?.稀有度 || '';
        const cardType = cardData.详细信息?.类型 || '';
        const cardCommandPoint = cardData.详细信息?.["指挥点"] || '';
        const cardStatus = cardData.详细信息?.活跃 || 'true';
        
        const cardDerived = cardData.详细信息?.衍生 || 'fake';

        let show = true;
        
        
        if (rarity && cardRarity !== rarity) {
            show = false;
        }
        
        
        if (type && cardType !== type) {
            show = false;
        }
        
        
        if (commandPoints) {
            if (commandPoints === "7+") {
                if (parseInt(cardCommandPoint) < 7) {
                    show = false;
                }
            } else if (cardCommandPoint !== commandPoints) {
                show = false;
            }
        }
        
        
        if (status !== "" && status !== undefined) {
            
            const statusStr = cardStatus === true || cardStatus === "true" ? "true" : "false";
            if (statusStr !== status) {
                show = false;
            }
        }
        
        
        if (derived && cardDerived !== derived) {
            show = false;
        }
        
        
        if (search && !cardName.includes(search)) {
            show = false;
        }
        
        
        if (item.dataset.name === "步兵第七十七联队") {
            console.log("步兵第七十七联队筛选信息:", {
                cardRarity,
                selectedRarity: rarity,
                show,
                statusMatch: status === "" || status === undefined || (cardStatus === true || cardStatus === "true" ? "true" : "false") === status
            });
        }
        
        item.style.display = show ? 'block' : 'none';
    });
}