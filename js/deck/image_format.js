// image_format.js

// 创建模态框元素 - 优化移动端适配
function createModal() {
    const modal = document.createElement('div');
    modal.id = 'card-modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        z-index: 2000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.9);
        overflow: auto;
    `;
    
    modal.innerHTML = `
        <div style="position: relative; width: 95%; max-width: 1200px; margin: 5% auto; background: #1a1a1a; border-radius: 10px; overflow: hidden;">
            <span id="close-modal" style="position: absolute; top: 15px; right: 20px; color: white; font-size: 30px; font-weight: bold; cursor: pointer; z-index: 2001;">&times;</span>
            <div id="modal-content" style="display: flex; flex-direction: column; height: auto; min-height: 500px;">
                <div id="image-container" style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; min-height: 300px;">
                    <img id="modal-image" style="max-width: 100%; max-height: 100%; object-fit: contain;" src="" alt="">
                    <img id="reserve-icon" style="position: absolute; bottom: 20px; right: 20px; width: 64px; height: 64px; display: none;" src="image/T_nui-icon-Reserves-gritty-256.png" alt="预备">
                </div>
                <div id="info-container" style="flex: 1; padding: 20px; color: white; overflow-y: auto;">
                    <h2 id="card-name" style="margin-bottom: 15px; font-size: 24px;"></h2>
                    <p id="card-description" style="margin-bottom: 15px; font-size: 16px; line-height: 1.5;"></p>
                    <div id="card-details" style="font-size: 14px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tbody id="details-table"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加移动端媒体查询
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            #card-modal #modal-content {
                flex-direction: column;
            }
            
            #card-modal #image-container {
                min-height: 200px;
                padding: 10px;
            }
            
            #card-modal #info-container {
                padding: 15px;
            }
            
            #card-modal #card-name {
                font-size: 20px;
                margin-bottom: 10px;
            }
            
            #card-modal #card-description {
                font-size: 14px;
                margin-bottom: 10px;
            }
            
            #card-modal #card-details {
                font-size: 12px;
            }
            
            #card-modal td {
                padding: 6px 4px;
            }
        }
        
        @media (max-width: 480px) {
            #card-modal {
                padding: 5px;
            }
            
            #card-modal #modal-content {
                width: 100%;
                margin: 2% auto;
            }
            
            #card-modal #card-name {
                font-size: 18px;
            }
            
            #card-modal #card-description {
                font-size: 13px;
            }
            
            #card-modal #card-details {
                font-size: 11px;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(modal);
    
    // 添加关闭事件
    document.getElementById('close-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
}

// 关闭模态框
function closeModal() {
    document.getElementById('card-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 显示模态框 - 修改版本
function showModal(imageSrc, cardData) {
    const modal = document.getElementById('card-modal');
    const modalImage = document.getElementById('modal-image');
    const reserveIcon = document.getElementById('reserve-icon');
    const cardName = document.getElementById('card-name');
    const cardDescription = document.getElementById('card-description');
    const detailsTable = document.getElementById('details-table');
    
    // 设置图片
    modalImage.src = imageSrc;
    
    // 设置卡片信息
    cardName.textContent = cardData.名称 || '未知名称';
    cardDescription.textContent = cardData.描述 || '无描述';
    
    // 显示/隐藏预备图标
    const isActive = cardData.详细信息?.活跃 === "true";
    reserveIcon.style.display = isActive ? 'none' : 'block';
    
    // 清空并填充详细信息表格
    detailsTable.innerHTML = '';
    
    // 按要求组织显示信息
    const detailInfo = cardData.详细信息 || {};
    
    // 定义需要排除的字段（包括衍生和卡牌代码相关字段）
    const excludeFields = ["稀有度", "类型", "指挥点", "活跃", "衍生自", "卡牌代码", "衍生卡牌"];
    
    // 显示基本信息
    const basicFields = ["稀有度", "类型", "指挥点"];
    basicFields.forEach(field => {
        if (detailInfo[field]) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 8px; border-bottom: 1px solid #444; font-weight: bold;">${field}</td>
                <td style="padding: 8px; border-bottom: 1px solid #444;">${detailInfo[field]}</td>
            `;
            detailsTable.appendChild(row);
        }
    });
    
    // 显示状态信息
    if (detailInfo.活跃 !== undefined) {
        const statusText = detailInfo.活跃 === "true" ? "活跃" : "预备";
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 8px; border-bottom: 1px solid #444; font-weight: bold;">状态</td>
            <td style="padding: 8px; border-bottom: 1px solid #444;">${statusText}</td>
        `;
        detailsTable.appendChild(row);
    }
    
    // 显示其他信息（排除衍生和卡牌代码相关字段）
    for (const [key, value] of Object.entries(detailInfo)) {
        if (!excludeFields.includes(key)) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 8px; border-bottom: 1px solid #444; font-weight: bold;">${key}</td>
                <td style="padding: 8px; border-bottom: 1px solid #444;">${value}</td>
            `;
            detailsTable.appendChild(row);
        }
    }
    
    // 显示模态框
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 移动端适配：滚动到顶部
    modal.scrollTop = 0;
}

// 查找卡牌数据 - 使用newk.json并改进匹配逻辑
function findCardData(imageFileName, country) {
    // 移除文件扩展名
    let fileNameWithoutExt = imageFileName.replace(/\.[^/.]+$/, "");
    
    // 加载新的卡牌数据文件
    return fetch('data/newk.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`无法加载 newk.json: ${response.status}`);
            }
            return response.json();
        })
        .then(cardData => {
            // 查找匹配的卡片 - 使用更智能的匹配算法
            const card = findBestMatch(cardData, fileNameWithoutExt, country);
            return card || {};
        })
        .catch(error => {
            console.error('查找卡牌数据时出错:', error);
            return {};
        });
}

// 智能匹配函数 - 改进版，支持更精确的匹配
function findBestMatch(cardData, fileName, country) {
    if (!Array.isArray(cardData) || cardData.length === 0) {
        return null;
    }
    
    // 清理文件名，移除路径和扩展名
    let cleanFileName = fileName.split('/').pop().replace(/\.[^/.]+$/, "");
    
    // 尝试多种匹配策略
    
    // 策略1: 精确匹配（最高优先级）
    let match = cardData.find(item => {
        if (item.国家 !== country) return false;
        return item.名称 === cleanFileName;
    });
    
    if (match) return match;
    
    // 策略2: 去除空格后精确匹配
    const cleanFileNameNoSpaces = cleanFileName.replace(/\s+/g, '');
    match = cardData.find(item => {
        if (item.国家 !== country) return false;
        const cleanCardName = item.名称.replace(/\s+/g, '');
        return cleanCardName === cleanFileNameNoSpaces;
    });
    
    if (match) return match;
    
    // 策略3: 完全匹配文件名的关键部分（通常是中文部分）
    const keyPart = extractKeyPart(cleanFileName);
    if (keyPart) {
        const keyPartUpper = keyPart.toUpperCase();
        match = cardData.find(item => {
            if (item.国家 !== country) return false;
            const cardNameUpper = item.名称.toUpperCase();
            return cardNameUpper === keyPartUpper;
        });
        
        if (match) return match;
    }
    
    // 策略4: 文件名包含卡牌名（不区分大小写）
    const fileNameUpper = cleanFileName.toUpperCase();
    match = cardData.find(item => {
        if (item.国家 !== country) return false;
        const cardNameUpper = item.名称.toUpperCase();
        return fileNameUpper.includes(cardNameUpper) || cardNameUpper.includes(fileNameUpper);
    });
    
    if (match) return match;
    
    // 策略5: 卡牌名包含文件名的关键部分
    if (keyPart) {
        const keyPartUpper = keyPart.toUpperCase();
        match = cardData.find(item => {
            if (item.国家 !== country) return false;
            const cardNameUpper = item.名称.toUpperCase();
            return cardNameUpper.includes(keyPartUpper);
        });
        
        if (match) return match;
    }
    
    // 策略6: 最宽松的包含匹配（不区分大小写）
    const fileNameLower = cleanFileName.toLowerCase();
    match = cardData.find(item => {
        if (item.国家 !== country) return false;
        const cardNameLower = item.名称.toLowerCase();
        const cardDescLower = (item.描述 || "").toLowerCase();
        return fileNameLower.includes(cardNameLower) || 
               cardNameLower.includes(fileNameLower) ||
               fileNameLower.includes(cardDescLower) ||
               cardDescLower.includes(fileNameLower);
    });
    
    return match;
}
function extractKeyPart(fileName) {
    // 匹配中文字符
    const chineseMatch = fileName.match(/[\u4e00-\u9fa5]+/g);
    if (chineseMatch && chineseMatch.length > 0) {
        return chineseMatch[0]; // 返回第一个中文部分
    }
    return null;
}

// 初始化图片点击事件
// 初始化图片点击事件
// 初始化图片点击事件
function initImageClickEvents() {
    // 监听图片容器的变化
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // 为新添加的图片添加点击事件
                document.querySelectorAll('.image-item img').forEach(img => {
                    if (!img.hasAttribute('data-click-handler')) {
                        img.addEventListener('click', function() {
                            const imageUrl = this.src;
                            const fileName = decodeURIComponent(this.dataset.filename || '');
                            const country = document.getElementById('country-select').value;
                            
                            // 检查是否有搜索关键词
                            const searchKeyword = document.getElementById('search-input').value.trim();
                            const isSearchResult = searchKeyword.length > 0;
                            
                            if (fileName) {
                                // 如果有选择国家，使用该国家进行查找
                                if (country) {
                                    findCardData(fileName, country).then(cardData => {
                                        if (Object.keys(cardData).length > 0) {
                                            showModal(imageUrl, cardData);
                                        } else {
                                            // 即使没有找到匹配数据，也显示基本信息
                                            showModal(imageUrl, {
                                                名称: fileName,
                                                描述: '暂无详细信息',
                                                详细信息: {}
                                            });
                                        }
                                    }).catch(error => {
                                        console.error('查找卡牌数据时出错:', error);
                                        showModal(imageUrl, {
                                            名称: fileName || '未知图片',
                                            描述: '加载数据时出错: ' + error.message,
                                            详细信息: {}
                                        });
                                    });
                                } else {
                                    // 如果没有选择国家，尝试在所有国家中查找
                                    findAllCountryData(fileName).then(cardData => {
                                        if (Object.keys(cardData).length > 0) {
                                            showModal(imageUrl, cardData);
                                        } else {
                                            // 显示基本信息
                                            showModal(imageUrl, {
                                                名称: fileName,
                                                描述: '暂无详细信息',
                                                详细信息: {}
                                            });
                                        }
                                    }).catch(error => {
                                        console.error('查找卡牌数据时出错:', error);
                                        showModal(imageUrl, {
                                            名称: fileName || '未知图片',
                                            描述: '加载数据时出错: ' + error.message,
                                            详细信息: {}
                                        });
                                    });
                                }
                            } else {
                                showModal(imageUrl, {
                                    名称: fileName || '未知图片',
                                    描述: '暂无详细信息',
                                    详细信息: {}
                                });
                            }
                        });
                        img.setAttribute('data-click-handler', 'true');
                    }
                });
            }
        });
    });
    
    const imageDisplay = document.getElementById('image-display');
    if (imageDisplay) {
        observer.observe(imageDisplay, { childList: true, subtree: true });
    }
}

// 在所有国家中查找卡牌数据
function findAllCountryData(imageFileName) {
    // 移除文件扩展名
    let fileNameWithoutExt = imageFileName.replace(/\.[^/.]+$/, "");
    
    // 加载新的卡牌数据文件
    return fetch('data/newk.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`无法加载 newk.json: ${response.status}`);
            }
            return response.json();
        })
        .then(cardData => {
            // 查找匹配的卡片 - 在所有国家中查找
            const card = findAllCountryBestMatch(cardData, fileNameWithoutExt);
            return card || {};
        })
        .catch(error => {
            console.error('查找卡牌数据时出错:', error);
            return {};
        });
}

// 在所有国家中查找最佳匹配
// 在所有国家中查找最佳匹配
function findAllCountryBestMatch(cardData, fileName) {
    if (!Array.isArray(cardData) || cardData.length === 0) {
        return null;
    }
    
    // 清理文件名，移除路径和扩展名
    let cleanFileName = fileName.split('/').pop().replace(/\.[^/.]+$/, "");
    
    // 尝试多种匹配策略
    
    // 策略1: 精确匹配（最高优先级）
    let match = cardData.find(item => {
        return item.名称 === cleanFileName;
    });
    
    if (match) return match;
    
    // 策略2: 去除空格后精确匹配
    const cleanFileNameNoSpaces = cleanFileName.replace(/\s+/g, '');
    match = cardData.find(item => {
        const cleanCardName = item.名称.replace(/\s+/g, '');
        return cleanCardName === cleanFileNameNoSpaces;
    });
    
    if (match) return match;
    
    // 策略3: 完全匹配文件名的关键部分（通常是中文部分）
    const keyPart = extractKeyPart(cleanFileName);
    if (keyPart) {
        const keyPartUpper = keyPart.toUpperCase();
        match = cardData.find(item => {
            const cardNameUpper = item.名称.toUpperCase();
            return cardNameUpper === keyPartUpper;
        });
        
        if (match) return match;
    }
    
    // 策略4: 文件名包含卡牌名（不区分大小写）
    const fileNameUpper = cleanFileName.toUpperCase();
    match = cardData.find(item => {
        const cardNameUpper = item.名称.toUpperCase();
        return fileNameUpper.includes(cardNameUpper) || cardNameUpper.includes(fileNameUpper);
    });
    
    if (match) return match;
    
    // 策略5: 卡牌名包含文件名的关键部分
    if (keyPart) {
        const keyPartUpper = keyPart.toUpperCase();
        match = cardData.find(item => {
            const cardNameUpper = item.名称.toUpperCase();
            return cardNameUpper.includes(keyPartUpper);
        });
        
        if (match) return match;
    }
    
    // 策略6: 最宽松的包含匹配（不区分大小写）
    const fileNameLower = cleanFileName.toLowerCase();
    match = cardData.find(item => {
        const cardNameLower = item.名称.toLowerCase();
        const cardDescLower = (item.描述 || "").toLowerCase();
        return fileNameLower.includes(cardNameLower) || 
               cardNameLower.includes(fileNameLower) ||
               fileNameLower.includes(cardDescLower) ||
               cardDescLower.includes(fileNameLower);
    });
    
    return match;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    createModal();
    initImageClickEvents();
});

// 添加键盘事件支持（ESC关闭模态框）
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});