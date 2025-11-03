// js/deck/deck_image.js

// 添加一个新函数用于处理包含中文的图片路径
function encodeImagePath(path) {
    // 将路径中的每个部分进行编码，但保持分隔符不变
    return path.split('/').map(part => encodeURIComponent(part)).join('/');
}

// 获取所有元素引用
const countrySelector = document.getElementById('country-selector');
const subtypeSelect = document.getElementById('subtype-select');
const raritySelect = document.getElementById('rarity-select');
const typeSelect = document.getElementById('type-select');
const commandPointsSelect = document.getElementById('command-point-select');
const statusSelect = document.getElementById('status-select');
const searchInput = document.getElementById('search-input');
const cardsContainer = document.getElementById('cards-container');
// 添加衍生筛选器引用
const derivedSelect = document.getElementById('derived-select');
const mobileDerivedSelect = document.getElementById('mobile-derived-select');

// 国家信息
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

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadCountryIcons();
    setupEventListeners();
    
    // 从URL参数获取国家代码
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && code.startsWith('%%')) {
        parseCountryCode(code);
    }
    
    // 初始化筛选器
    initFilters();
});

// 初始化筛选器
function initFilters() {
    // 初始化类型筛选器
    updateTypeSelector([]);
    
    // 初始化指挥点筛选器（保持和index.html一致）
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
    
    // 初始化状态筛选器
    statusSelect.innerHTML = `
        <option value="">全部状态</option>
        <option value="true">活跃</option>
        <option value="false">预备</option>
    `;
    
    // 初始化衍生筛选器
    derivedSelect.innerHTML = `
        <option value="">全部</option>
        <option value="true">真</option>
        <option value="fake">假</option>
    `;
    
    // 初始化移动端衍生筛选器
    mobileDerivedSelect.innerHTML = `
        <option value="">全部</option>
        <option value="true">真</option>
        <option value="fake">假</option>
    `;
}

// 加载国家图标
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

// 解析国家代码
function parseCountryCode(code) {
    // 格式: %%12|...
    const countryCode = code.substring(2, 4);
    const mainCountryId = parseInt(countryCode.charAt(0));
    const secondaryCountryId = parseInt(countryCode.charAt(1));
    
    // 选择主国家
    if (mainCountryId) {
        const mainCountryElement = document.querySelector(`.country-option[data-country-id="${mainCountryId}"]`);
        if (mainCountryElement) {
            mainCountryElement.classList.add('selected');
            window.selectedMainCountry = mainCountryId;
        }
    }
    
    // 选择盟国
    if (secondaryCountryId) {
        const secondaryCountryElement = document.querySelector(`.country-option[data-country-id="${secondaryCountryId}"]`);
        if (secondaryCountryElement) {
            secondaryCountryElement.classList.add('selected');
            window.selectedSecondaryCountry = secondaryCountryId;
        }
    }
    
    // 更新禁用状态
    updateDisabledState();
    
    // 隐藏其他未选择的国家图标
    hideUnselectedCountries();
    
    // 加载卡牌
    if (window.selectedMainCountry && window.selectedSecondaryCountry) {
        loadCardsForCountries();
    }
}

// 隐藏未选择的国家图标
function hideUnselectedCountries() {
    const countryItems = document.querySelectorAll('.country-option');
    
    countryItems.forEach(item => {
        const countryId = parseInt(item.dataset.countryId);
        
        // 只显示选定的两个国家
        if (countryId !== window.selectedMainCountry && countryId !== window.selectedSecondaryCountry) {
            item.style.display = 'none';
        }
    });
}

// 更新禁用状态
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

// 设置事件监听器
function setupEventListeners() {
    // 国家图标点击事件 - 已在 HTML 中处理，这里留空或者删除
    
    // 筛选器事件
    raritySelect.addEventListener('change', filterCards);
    typeSelect.addEventListener('change', filterCards);
    commandPointsSelect.addEventListener('change', filterCards);
    statusSelect.addEventListener('change', filterCards);
    // 添加衍生筛选器事件监听
    derivedSelect.addEventListener('change', filterCards);
    mobileDerivedSelect.addEventListener('change', filterCards);
    searchInput.addEventListener('input', filterCards);
    
    // 添加类型选择器事件监听（修复之前的问题）
    if (typeSelect) {
        typeSelect.addEventListener('change', filterCards);
    }
}

// 修改 loadCardsForCountries 函数，允许只选择一个国家
async function loadCardsForCountries() {

    
    cardsContainer.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        // 获取卡牌数据
        const response = await fetch('data/newk.json');
        if (!response.ok) {
            throw new Error('newk.json 网络响应错误');
        }
        const cardsData = await response.json();
        
        // 获取图片数据
        const imagesResponse = await fetch('data/newimages.json');
        if (!imagesResponse.ok) {
            throw new Error('newimages.json 网络响应错误');
        }
        const imagesData = await imagesResponse.json();
        
        // 获取选定国家的卡牌（允许只选择一个国家）
        const selectedCountries = [];
        const mainCountryName = window.selectedMainCountry ? countries.find(c => c.id === window.selectedMainCountry)?.name : null;
        const secondaryCountryName = window.selectedSecondaryCountry ? countries.find(c => c.id === window.selectedSecondaryCountry)?.name : null;
        
        if (mainCountryName) selectedCountries.push(mainCountryName);
        if (secondaryCountryName) selectedCountries.push(secondaryCountryName);
        
        // 筛选卡牌
        let filteredCards = cardsData.filter(card => 
            selectedCountries.includes(card.国家)
        );
        
        // 对卡牌进行特殊处理：
        // 1. 主国家可以使用所有卡牌
        // 2. 盟国不能使用金卡和精英卡
        filteredCards = filteredCards.filter(card => {
            // 主国家可以使用所有卡牌
            if (window.selectedMainCountry && card.国家 === mainCountryName) {
                return true;
            }
            // 盟国不能使用金卡和精英卡
            if (window.selectedSecondaryCountry && card.国家 === secondaryCountryName) {
                // 检查这张卡是否是金卡
                const isGold = isGoldenCard(card, imagesData);
                // 检查是否是精英卡
                const isElite = card.详细信息?.稀有度 === '精英';
                // 如果是金卡或精英卡则排除，否则保留
                return !(isGold || isElite);
            }
            return true;
        });
        
        if (filteredCards.length === 0) {
            cardsContainer.innerHTML = '<div class="no-cards">未找到匹配的卡牌</div>';
            return;
        }
        
        // 获取对应的图片路径
        let cardImages = [];
        filteredCards.forEach(card => {
            const country = card.国家;
            const cardName = card.名称;
            
            // 在图片数据中查找对应的图片
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
        
        // 按指挥点排序
        cardImages = sortCardsByCommandPoint(cardImages);
        
        // 更新类型筛选器选项
        const types = getCardTypes(cardImages);
        updateTypeSelector(types);
        
        renderCards(cardImages);
        
        // 立即应用筛选，不需要点击国家
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
    typeSelect.innerHTML = '<option value="">全部类型</option>';
    
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
    
    // 不要在这里重新绑定事件监听器，因为已经在 setupEventListeners 中绑定过了
}

// 渲染卡牌 (移除右下角的指挥点数字，添加预备图标)
function renderCards(cards) {
    if (cards.length === 0) {
        cardsContainer.innerHTML = '<div class="no-cards">未找到匹配的卡牌</div>';
        return;
    }
    
    let html = '';
    cards.forEach(card => {
        // 处理图片路径
        const imagePath = card.path;
        const encodedImagePath = encodeImagePath(imagePath);
        const fileName = imagePath.split('/').pop();
        const displayName = card.name || fileName;
        
        // 获取稀有度 - 确保正确获取稀有度信息
        const rarity = card.cardData?.详细信息?.稀有度 || '未知';
        
        // 获取卡牌代码
        const cardCode = card.cardData?.详细信息?.["卡牌代码"] || '';
        
        // 检查是否为预备卡牌
        const isReserve = card.cardData?.详细信息?.活跃 === "false";
        
        // 获取稀有度限制次数
        const rarityLimits = {
            '精英': 1,
            '特殊': 2,
            '限定': 3,
            '普通': 4
        };
        const maxClicks = rarityLimits[rarity] || 1;
        
        // 调试信息 - 检查特定卡牌
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
    
    // 应用当前筛选条件，使用 setTimeout 确保 DOM 已更新
    setTimeout(filterCards, 0);
}

// 筛选卡牌
// 在 js/deck/deck_image.js 中找到 filterCards 函数并替换为以下代码：

// 筛选卡牌
// 在 js/deck/deck_image.js 中找到 filterCards 函数，并替换为以下代码：

// 筛选卡牌
function filterCards() {
    const rarity = raritySelect.value;
    const type = typeSelect.value;
    const commandPoints = commandPointsSelect.value;
    const status = statusSelect.value;
    // 获取衍生筛选值（从两个筛选器中获取，移动端和桌面端）
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
        // 获取衍生值，默认为"fake"
        const cardDerived = cardData.详细信息?.衍生 || 'fake';

        let show = true;
        
        // 稀有度筛选（精英、特殊等）
        if (rarity && cardRarity !== rarity) {
            show = false;
        }
        
        // 类型筛选（步兵、坦克等）
        if (type && cardType !== type) {
            show = false;
        }
        
        // 指挥点筛选
        if (commandPoints) {
            if (commandPoints === "7+") {
                if (parseInt(cardCommandPoint) < 7) {
                    show = false;
                }
            } else if (cardCommandPoint !== commandPoints) {
                show = false;
            }
        }
        
        // 状态筛选
        if (status !== "" && status !== undefined) {
            // 需要将 cardStatus 转换为字符串进行比较
            const statusStr = cardStatus === true || cardStatus === "true" ? "true" : "false";
            if (statusStr !== status) {
                show = false;
            }
        }
        
        // 衍生筛选
        if (derived && cardDerived !== derived) {
            show = false;
        }
        
        // 搜索筛选
        if (search && !cardName.includes(search)) {
            show = false;
        }
        
        // 调试信息 - 检查特定卡牌的筛选结果
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