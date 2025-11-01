// js/deck.js（修复版 - 实现点击预览和按指挥点排序保存）

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

// 不含金卡的国家
const noGoldCountries = ['波兰', '法国', '意大利', '芬兰'];

// 稀有度上限（importId 组合逻辑所需）
const rarityLimits = {
    'Standard': 4, // 普通
    'Limited': 3,  // 限定
    'Special': 2,  // 特殊
    'Elite': 1     // 精英
};

// 当前状态
let selectedCountry = null;
let selectedCards = [];
let currentCards = [];
let cardDetails = {}; // keyed by 原始名称（trim）
let mainCountry = null;
let secondaryCountry = null;

// 缓存加载（避免重复 fetch）
let _cachedImagesJson = null;
let _cachedAllCardsJson = null;
let _cachedCardCodeJson = null;

// ---------------- helper ----------------
function normalizeKey(s) {
    if (!s && s !== 0) return '';
    return String(s)
        .replace(/（.*?）/g, '')        // 去掉括号里的注解
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '') // 去掉标点空格等
        .toLowerCase()
        .trim();
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
}

// 把文件路径编码为浏览器能识别（处理中文路径的情况）
function encodeImagePathIfNeeded(p) {
    if (!p) return p;
    // 如果已经是 data: 或 http(s) 就返回原值
    if (p.startsWith('data:') || p.startsWith('http://') || p.startsWith('https://')) return p;
    // 分段 encodeURI 对每段路径，防止把 / 编码
    return p.split('/').map(seg => encodeURIComponent(seg)).join('/');
}

// ---------------- URL 参数 ----------------
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(window.location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function parseDeckCode() {
    const code = getUrlParameter('code');
    if (code && code.startsWith('%%') && code.includes('|')) {
        // 格式示例: %%12|...  我们至少解析主/副国家
        const core = code.substring(2);
        const parts = core.split('|');
        const header = parts[0] || '';
        if (header.length >= 2) {
            const mainCountryId = parseInt(header[0]);
            const secondaryCountryId = parseInt(header[1]);
            return { mainCountryId, secondaryCountryId };
        }
    }
    return null;
}

// ---------------- 加载 cardcode.json ----------------
async function loadCardCodes() {
    try {
        if (_cachedCardCodeJson) {
            return;
        }
        const resp = await fetch('data/cardcode.json');
        if (!resp.ok) throw new Error('cardcode.json 网络响应错误');
        const data = await resp.json();
        _cachedCardCodeJson = data;
    } catch (err) {
        console.error('加载卡牌代码失败:', err);
    }
}

// ---------------- findCardData （通过图片文件名匹配 all_card.json 条目） ----------------
function findCardData(imageFileName) {
    if (!imageFileName) return null;
    const fileNameWithoutExt = imageFileName.split('/').pop().replace(/\.[^/.]+$/, '').trim();

    const nf = normalizeKey(fileNameWithoutExt);

    // 优先：精确标准化匹配（去掉标点空格等后相等）
    for (const origName in cardDetails) {
        const card = cardDetails[origName];
        const nk = normalizeKey(origName);
        if (nk === nf) return card;
    }

    // 次优：文件名开头匹配卡牌名称（标准化后）
    for (const origName in cardDetails) {
        const card = cardDetails[origName];
        const nk = normalizeKey(origName);
        if (nf.startsWith(nk) || nk.startsWith(nf)) return card;
    }

    // 回退：包含匹配
    for (const origName in cardDetails) {
        const card = cardDetails[origName];
        const nk = normalizeKey(origName);
        if (nf.includes(nk) || nk.includes(nf)) return card;
    }

    // 未匹配
    return null;
}

// ---------------- loadCardsForCountry ----------------
async function loadCardsForCountry(countryFolder) {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = '<div class="loading">加载中...</div>';

    try {
        let imagesData, cardsData;
        if (_cachedImagesJson && _cachedAllCardsJson) {
            imagesData = _cachedImagesJson;
            cardsData = _cachedAllCardsJson;
        } else {
            const [imagesResp, cardsResp] = await Promise.all([
                fetch('data/newimages.json'),
                fetch('data/all_card.json')
            ]);
            if (!imagesResp.ok) throw new Error('newimages.json 网络响应错误');
            if (!cardsResp.ok) throw new Error('all_card.json 网络响应错误');
            imagesData = await imagesResp.json();
            cardsData = await cardsResp.json();
            _cachedImagesJson = imagesData;
            _cachedAllCardsJson = cardsData;
        }

        // 构建 cardDetails 映射：以 card.名称 (trim) 为键
        cardDetails = {};
        if (Array.isArray(cardsData)) {
            cardsData.forEach(card => {
                if (card && card.名称) {
                    cardDetails[String(card.名称).trim()] = card;
                }
            });
        } else if (cardsData && Array.isArray(cardsData.cards)) {
            cardsData.cards.forEach(card => {
                if (card && card.名称) {
                    cardDetails[String(card.名称).trim()] = card;
                }
            });
        } else {
            // 尝试对象值
            Object.values(cardsData || {}).forEach(card => {
                if (card && card.名称) cardDetails[String(card.名称).trim()] = card;
            });
        }

        if (!imagesData[countryFolder]) {
            cardsContainer.innerHTML = '<div class="no-cards">该国家暂无卡牌</div>';
            currentCards = [];
            updateFilterOptions();
            renderCards([]);
            return;
        }

        currentCards = [];

        for (const [subtype, cards] of Object.entries(imagesData[countryFolder])) {
            if (noGoldCountries.includes(selectedCountry?.name) && subtype === '金卡') continue;

            cards.forEach(cardPath => {
                const fileName = cardPath.split('/').pop().replace(/\.[^/.]+$/, '').trim();
                const cardInfo = findCardData(fileName);
                const displayName = cardInfo?.名称 ? String(cardInfo.名称).trim() : fileName;

                currentCards.push({
                    path: cardPath,
                    fileName: fileName,
                    name: displayName, // 真实显示名，优先使用 all_card.json 的 名称
                    subtype: subtype,
                    type: cardInfo?.详细信息?.类型 || '未知',
                    // 指挥点保持为数字，便于排序
                    commandPoints: cardInfo?.详细信息 && cardInfo.详细信息.指挥点 ? parseInt(cardInfo.详细信息.指挥点, 10) || 0 : 0
                });
            });
        }

        updateFilterOptions();
        filterCards();
    } catch (err) {
        console.error('加载卡牌失败:', err);
        cardsContainer.innerHTML = '<div class="no-cards">加载卡牌失败</div>';
    }
}

// ---------------- updateFilterOptions ----------------
function updateFilterOptions() {
    const typeSelect = document.getElementById('type-select');
    const types = [...new Set(currentCards.map(c => c.type))];
    typeSelect.innerHTML = '<option value="">全部类型</option>';
    types.forEach(t => {
        if (t && t !== '未知') {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            typeSelect.appendChild(opt);
        }
    });

    const commandPointsSelect = document.getElementById('command-points-select');
    const cps = [...new Set(currentCards.map(c => c.commandPoints))].sort((a,b)=>a-b);
    commandPointsSelect.innerHTML = '<option value="">全部指挥点</option>';
    cps.forEach(cp => {
        if (cp !== 0 && cp !== '未知') {
            const opt = document.createElement('option');
            opt.value = String(cp);
            opt.textContent = String(cp);
            commandPointsSelect.appendChild(opt);
        }
    });

    // 子类型 select（若存在）
    const subtypeSelect = document.getElementById('subtype-select');
    if (subtypeSelect) {
        const subs = [...new Set(currentCards.map(c => c.subtype))];
        subtypeSelect.innerHTML = '<option value="">全部子类型</option>';
        subs.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            subtypeSelect.appendChild(opt);
        });
    }
}

// ---------------- filterCards ----------------
function filterCards() {
    const subtypeFilter = document.getElementById('subtype-select') ? document.getElementById('subtype-select').value : '';
    const searchFilter = (document.getElementById('search-input') ? document.getElementById('search-input').value : '').toLowerCase();
    const typeFilter = document.getElementById('type-select') ? document.getElementById('type-select').value : '';
    const commandPointsFilter = document.getElementById('command-points-select') ? document.getElementById('command-points-select').value : '';

    let filtered = [...currentCards];

    if (subtypeFilter) filtered = filtered.filter(c => c.subtype === subtypeFilter);
    if (searchFilter) filtered = filtered.filter(c => (c.name || c.fileName || '').toLowerCase().includes(searchFilter));
    if (typeFilter) filtered = filtered.filter(c => c.type === typeFilter);
    if (commandPointsFilter) filtered = filtered.filter(c => String(c.commandPoints) === String(commandPointsFilter));

    // 按指挥点排序
    filtered.sort((a,b) => (a.commandPoints || 0) - (b.commandPoints || 0));

    renderCards(filtered);
}

// ---------------- renderCards ----------------
function renderCards(cards) {
    const cardsContainer = document.getElementById('cards-container');
    if (!cardsContainer) return;
    if (!cards || cards.length === 0) {
        cardsContainer.innerHTML = '<div class="no-cards">未找到符合条件的卡牌</div>';
        return;
    }

    let html = '';
    cards.forEach(card => {
        const encodedPath = encodeImagePathIfNeeded(card.path);
        const displayName = card.name || card.fileName || '未知名称';
        // 查找该卡牌当前的点击次数
        const selectedCard = selectedCards.find(sc => sc.path === card.path);
        const clickCount = selectedCard ? selectedCard.clickCount : 0;
        
        // 获取卡牌稀有度
        const cardCodeEntry = findCardCodeEntry(card.name);
        const rarity = cardCodeEntry?.rarity || 'Standard';
        const limit = rarityLimits[rarity] || 4;

        html += `
            <div class="card-item ${clickCount > 0 ? 'selected' : ''}" data-card-path="${encodeURIComponent(card.path)}" data-card-name="${escapeHtml(displayName)}" data-rarity="${rarity}">
                <img src="${encodedPath}" alt="${escapeHtml(displayName)}" class="card-image">
                <div class="card-caption">${escapeHtml(displayName)}</div>
                ${clickCount > 0 ? `<div class="click-count">X${clickCount}</div>` : ''}
            </div>
        `;
    });

    cardsContainer.innerHTML = html;

    // 绑定事件
    document.querySelectorAll('.card-item').forEach(item => {
        item.addEventListener('click', function() {
            const p = decodeURIComponent(this.dataset.cardPath || '');
            const card = currentCards.find(c => c.path === p);
            if (!card) return;

            // 获取卡牌稀有度
            const cardCodeEntry = findCardCodeEntry(card.name);
            const rarity = cardCodeEntry?.rarity || 'Standard';
            const limit = rarityLimits[rarity] || 4;

            // 查找是否已选择该卡牌
            const existingIndex = selectedCards.findIndex(sc => sc.path === p);
            
            if (existingIndex > -1) {
                // 已存在，增加点击次数（不超过上限）
                if (selectedCards[existingIndex].clickCount < limit) {
                    selectedCards[existingIndex].clickCount++;
                } else {
                    // 超过上限，移除该卡牌
                    selectedCards.splice(existingIndex, 1);
                }
            } else {
                // 新增卡牌，初始点击次数为1
                selectedCards.push({...card, clickCount: 1});
            }
            
            updateDeckPreview();
        });
    });
}
// ---------------- updateDeckPreview ----------------
// 修改 updateDeckPreview 函数
function updateDeckPreview() {
    const previewList = document.getElementById('preview-list');
    const saveBtn = document.getElementById('save-btn');
    if (!previewList) return;

    if (!selectedCards || selectedCards.length === 0) {
        previewList.innerHTML = '<li class="no-cards">暂无选中的卡牌</li>';
        if (saveBtn) saveBtn.disabled = true;
        return;
    }

    // 按指挥点排序
    const sortedCards = [...selectedCards].sort((a, b) => (a.commandPoints || 0) - (b.commandPoints || 0));

    let html = '';
    sortedCards.forEach(card => {
        const encodedPath = encodeImagePathIfNeeded(card.path);
        const displayName = card.name || card.fileName || '未知名称';
        html += `
            <li class="preview-item" data-card-path="${encodeURIComponent(card.path)}">
                <img src="${encodedPath}" alt="${escapeHtml(displayName)}" class="preview-image">
                <div class="preview-info">
                    <div class="preview-name">${escapeHtml(displayName)}</div>
                    <div class="preview-cost">${escapeHtml(card.subtype || '')} · ${escapeHtml(card.type || '')} · ${card.commandPoints} 指挥点</div>
                </div>
                <div class="preview-count">X${card.clickCount}</div>
            </li>
        `;
    });

    previewList.innerHTML = html;
    if (saveBtn) saveBtn.disabled = false;
}
// ---------------- removeCardFromPreview ----------------
function removeCardFromPreview(cardPathEncoded) {
    const cardPath = decodeURIComponent(cardPathEncoded);
    selectedCards = selectedCards.filter(c => c.path !== cardPath);

    // 取消主面板选中样式
    document.querySelectorAll('.card-item').forEach(it => {
        const p = decodeURIComponent(it.dataset.cardPath || '');
        if (p === cardPath) it.classList.remove('selected');
    });

    updateDeckPreview();
}

// ---------------- saveDeckCode ----------------
function saveDeckCode() {
    if (!mainCountry || !secondaryCountry) {
        alert("请选择主国家和副国家");
        return;
    }

    if (!selectedCards || selectedCards.length === 0) {
        alert("当前没有选中卡牌");
        return;
    }

    // 按指挥点排序
    const sorted = [...selectedCards].sort((a,b) => (a.commandPoints||0) - (b.commandPoints||0));

    // 统计 importId
    const map = {}; // importId -> {count, rarityKey}
    sorted.forEach(card => {
        // 查找对应的 cardcode 信息
        const cardCodeEntry = findCardCodeEntry(card.name);
        if (!cardCodeEntry || !cardCodeEntry.importId) {
            console.warn('未找到 importId:', card.name, card.fileName);
            return;
        }
        const importId = cardCodeEntry.importId;
        const rarityKey = cardCodeEntry.rarity || 'Standard'; 
        if (!map[importId]) map[importId] = { count: 0, rarityKey };
        map[importId].count++;
    });

    // 根据稀有度构建代码段
    const segments = [];
    for (const [importId, info] of Object.entries(map)) {
        const segs = buildCodeSegmentsForImportId(importId, info.count, info.rarityKey);
        segments.push(...segs);
    }

    if (segments.length === 0) {
        alert("未生成任何卡牌代码，请检查选中卡牌是否能匹配 importId");
        return;
    }

    // 使用 #selectedCode 中的国家 ID
    const mainCountryId = mainCountry?.id ?? '';
    const secondaryCountryId = secondaryCountry?.id ?? '';
    const header = '%%' + String(mainCountryId) + String(secondaryCountryId) + '|';
    
    // 生成最终代码，不添加结尾 '|'
    const finalCode = header + segments.join('');

    // 复制与展示
    navigator.clipboard.writeText(finalCode).then(() => {
        alert('卡组代码已复制：' + finalCode);
    }).catch(err => {
        console.error('复制失败', err);
        alert('卡组代码：' + finalCode);
    });
}


// 查找 cardcode 条目
function findCardCodeEntry(displayName) {
    if (!_cachedCardCodeJson) return null;
    
    // 遍历 cardcode.json 查找匹配项
    let arr = [];
    if (Array.isArray(_cachedCardCodeJson)) arr = _cachedCardCodeJson;
    else if (_cachedCardCodeJson && Array.isArray(_cachedCardCodeJson.cards)) arr = _cachedCardCodeJson.cards;
    else if (_cachedCardCodeJson && _cachedCardCodeJson.cards && typeof _cachedCardCodeJson.cards === 'object') arr = Object.values(_cachedCardCodeJson.cards);
    else {
        if (_cachedCardCodeJson && typeof _cachedCardCodeJson === 'object') {
            arr = Object.values(_cachedCardCodeJson);
        }
    }

    for (let entry of arr) {
        const nm = entry.name || entry.名称 || entry.cardName || '';
        if (nm === displayName) {
            return entry;
        }
    }
    
    return null;
}

// 修改 buildCodeSegmentsForImportId 函数
// 修改 buildCodeSegmentsForImportId 函数
function buildCodeSegmentsForImportId(importId, count, rarityKey) {
    // rarityKey 对应关系: 'Standard'->普通(铁卡), 'Limited'->限定(铜卡), 'Special'->特殊(银卡), 'Elite'->精英(金卡)
    const limit = rarityLimits[rarityKey] || 4;
    const segments = [];

    // 检查是否超出限制
    if (count > limit) {
        alert(`此卡牌类型最多只能带${limit}张`);
        count = limit;
    }

    // 根据稀有度类型生成对应的代码格式
    if (limit === 1) {
        // 精英卡 (金卡) - 每张卡一个 importId，不加分号
        segments.push(importId);
    } else {
        // 其他稀有度: 根据点击次数生成对应的格式
        // 创建分号数组，长度为4（固定）
        const arr = Array(4).fill(';');
        
        // 根据实际点击次数放置 importId
        // 计算放置位置：4 - 点击次数
        arr[4 - count] = importId;
        segments.push(arr.join(''));
    }
    
    return segments;
}

// 修改 saveDeckCode 函数，移除末尾的 |
function saveDeckCode() {
    if (!mainCountry || !secondaryCountry) {
        alert("请选择主国家和副国家");
        return;
    }

    if (!selectedCards || selectedCards.length === 0) {
        alert("当前没有选中卡牌");
        return;
    }

    // 按指挥点排序
    const sorted = [...selectedCards].sort((a,b) => (a.commandPoints||0) - (b.commandPoints||0));

    // 统计 importId 和其出现次数
    const importIdCounts = {}; // importId -> {count, rarityKey}
    sorted.forEach(card => {
        // 查找对应的 cardcode 信息
        const cardCodeEntry = findCardCodeEntry(card.name);
        if (!cardCodeEntry || !cardCodeEntry.importId) {
            console.warn('未找到 importId:', card.name, card.fileName);
            return;
        }
        const importId = cardCodeEntry.importId;
        const rarityKey = cardCodeEntry.rarity || 'Standard'; 
        if (!importIdCounts[importId]) importIdCounts[importId] = { count: 0, rarityKey };
        importIdCounts[importId].count++;
    });

    // 根据稀有度构建代码段
    const segments = [];
    for (const [importId, info] of Object.entries(importIdCounts)) {
        const segs = buildCodeSegmentsForImportId(importId, info.count, info.rarityKey);
        segments.push(...segs);
    }

    if (segments.length === 0) {
        alert("未生成任何卡牌代码，请检查选中卡牌是否能匹配 importId");
        return;
    }

    // 使用国家 ID
    const mainCountryId = mainCountry?.id ?? '';
    const secondaryCountryId = secondaryCountry?.id ?? '';
    const header = '%%' + String(mainCountryId) + String(secondaryCountryId) + '|';
    // 移除末尾的 |
    const finalCode = header + segments.join('');

    // 复制与展示
    navigator.clipboard.writeText(finalCode).then(() => {
        alert('卡组代码已复制：' + finalCode);
    }).catch(err => {
        console.error('复制失败', err);
        alert('卡组代码：' + finalCode);
    });
}


// ---------------- 初始化 ----------------
document.addEventListener('DOMContentLoaded', function() {
    const deckInfo = parseDeckCode();
    if (deckInfo) {
        mainCountry = countries.find(c => c.id === deckInfo.mainCountryId) || null;
        secondaryCountry = countries.find(c => c.id === deckInfo.secondaryCountryId) || null;
        loadCountrySelector(deckInfo.mainCountryId, deckInfo.secondaryCountryId);
    } else {
        loadCountrySelector();
    }

    setupEventListeners();
    loadCardCodes();
});

// ---------------- loadCountrySelector & setupEventListeners（保留原逻辑，稍微修订） ----------------
function loadCountrySelector(mainCountryId = null, secondaryCountryId = null) {
    const countrySelector = document.getElementById('country-selector');
    if (!countrySelector) return;
    countrySelector.innerHTML = '';

    let displayCountries = countries;
    const deckInfo = parseDeckCode();
    if (deckInfo) {
        const m = countries.find(c => c.id === deckInfo.mainCountryId);
        const s = countries.find(c => c.id === deckInfo.secondaryCountryId);
        displayCountries = [m, s].filter(Boolean);
    }

    displayCountries.forEach(country => {
        const countryOption = document.createElement('div');
        countryOption.className = 'country-option';
        countryOption.dataset.countryId = country.id;

        if (mainCountryId && country.id === mainCountryId) {
            countryOption.classList.add('selected');
            selectedCountry = country;
            loadCardsForCountry(country.folder);
        }

        countryOption.innerHTML = `
            <img src="image2/${country.iconFolder}/${country.iconFile}" alt="${escapeHtml(country.name)}" class="country-image">
            <div class="country-name">${escapeHtml(country.name)}</div>
        `;
        countrySelector.appendChild(countryOption);
    });
}

function setupEventListeners() {
    const countrySelector = document.getElementById('country-selector');
    if (countrySelector) {
        countrySelector.addEventListener('click', function(e) {
            const co = e.target.closest('.country-option');
            if (!co) return;
            const cid = parseInt(co.dataset.countryId);
            const country = countries.find(c => c.id === cid);
            if (!country) return;
            document.querySelectorAll('.country-option.selected').forEach(o => o.classList.remove('selected'));
            co.classList.add('selected');
            selectedCountry = country;
            loadCardsForCountry(country.folder);
        });
    }

    const subtypeSelect = document.getElementById('subtype-select');
    if (subtypeSelect) subtypeSelect.addEventListener('change', filterCards);

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', filterCards);

    const typeSelect = document.getElementById('type-select');
    if (typeSelect) typeSelect.addEventListener('change', filterCards);

    const cpSelect = document.getElementById('command-points-select');
    if (cpSelect) cpSelect.addEventListener('change', filterCards);

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveDeckCode);

    // 预览点击移除（事件代理）
    const previewList = document.getElementById('preview-list');
    if (previewList) {
        previewList.addEventListener('click', function(e) {
            const item = e.target.closest('.preview-item');
            if (!item) return;
            const p = item.dataset.cardPath;
            removeCardFromPreview(p);
        });
    }
}