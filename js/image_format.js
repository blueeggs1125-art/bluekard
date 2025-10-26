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

// 修改 showModal 函数，在 image_format.js 中
function showModal(imageSrc, cardData) {
    const modal = document.getElementById('card-modal');
    const modalImage = document.getElementById('modal-image');
    const cardName = document.getElementById('card-name');
    const cardDescription = document.getElementById('card-description');
    const detailsTable = document.getElementById('details-table');
    
    // 设置图片
    modalImage.src = imageSrc;
    
    // 设置卡片信息
    cardName.textContent = cardData.名称 || '未知名称';
    cardDescription.textContent = cardData.描述 || '无描述';
    
    // 清空并填充详细信息表格
    detailsTable.innerHTML = '';
    
    // 添加卡牌代码行
    if (cardData.importId) {
        const codeRow = document.createElement('tr');
        codeRow.innerHTML = `
            <td style="padding: 8px; border-bottom: 1px solid #444; font-weight: bold;">卡牌代码</td>
            <td style="padding: 8px; border-bottom: 1px solid #444;">${cardData.importId}</td>
        `;
        detailsTable.appendChild(codeRow);
    }
    
    const detailInfo = cardData.详细信息 || {};
    for (const [key, value] of Object.entries(detailInfo)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 8px; border-bottom: 1px solid #444; font-weight: bold;">${key}</td>
            <td style="padding: 8px; border-bottom: 1px solid #444;">${value}</td>
        `;
        detailsTable.appendChild(row);
    }
    
    // 显示模态框
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 移动端适配：滚动到顶部
    modal.scrollTop = 0;
}

// 重写 findCardData 函数，改进匹配逻辑以支持所有国家和包含空格的文件名，并提高匹配准确性
function findCardData(imageFileName, country) {
    // 移除文件扩展名
    let fileNameWithoutExt = imageFileName.replace(/\.[^/.]+$/, "");
    
    // 构建卡牌信息文件路径 - 使用正确的文件名
    const encodedCountry = encodeURIComponent(country);
    const cardInfoPath = `image/${encodedCountry}/${encodedCountry}%E5%8D%A1%E7%89%8C%E4%BF%A1%E6%81%AF.json`; // 卡牌信息.json的URL编码
    
    console.log('查找卡牌信息:', country, fileNameWithoutExt);
    console.log('文件路径:', cardInfoPath);
    
    // 同时加载卡牌信息和卡牌代码
    return Promise.all([
        fetch(cardInfoPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载 ${cardInfoPath}: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.warn(`加载卡牌信息失败 (${country}):`, error);
                return [];
            }),
        fetch('data/cardcode.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载 cardcode.json: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.warn('加载卡牌代码失败:', error);
                return [];
            })
    ])
    .then(([cardInfoData, cardCodeData]) => {
        console.log('卡牌信息数据:', Array.isArray(cardInfoData) ? cardInfoData.length : 0);
        console.log('卡牌代码数据:', Array.isArray(cardCodeData) ? cardCodeData.length : 0);
        
        // 查找匹配的卡片信息数据
        let cardInfo = {};
        if (Array.isArray(cardInfoData) && cardInfoData.length > 0) {
            // 策略1: 精确匹配完整名称（最高优先级）
            cardInfo = cardInfoData.find(card => {
                const cardName = card.名称;
                if (!cardName) return false;
                return fileNameWithoutExt === cardName;
            }) || {};
            
            // 策略2: 如果没有精确匹配，尝试去除空格后精确匹配
            if (Object.keys(cardInfo).length === 0) {
                const cleanFileName = fileNameWithoutExt.replace(/\s+/g, '');
                cardInfo = cardInfoData.find(card => {
                    const cardName = card.名称;
                    if (!cardName) return false;
                    const cleanCardName = cardName.replace(/\s+/g, '');
                    return cleanFileName === cleanCardName;
                }) || {};
            }
            
            // 策略3: 如果还是没有匹配，尝试更严格的模糊匹配
            if (Object.keys(cardInfo).length === 0) {
                // 先尝试完全包含关系的匹配（文件名包含卡牌名或卡牌名包含文件名）
                cardInfo = cardInfoData.find(card => {
                    const cardName = card.名称;
                    if (!cardName) return false;
                    return fileNameWithoutExt.includes(cardName) || cardName.includes(fileNameWithoutExt);
                }) || {};
                
                // 如果找到多个可能匹配项，选择最接近的
                const possibleMatches = cardInfoData.filter(card => {
                    const cardName = card.名称;
                    if (!cardName) return false;
                    return fileNameWithoutExt.includes(cardName) || cardName.includes(fileNameWithoutExt);
                });
                
                if (possibleMatches.length > 1) {
                    // 选择名称最接近的匹配项
                    possibleMatches.sort((a, b) => {
                        const aName = a.名称;
                        const bName = b.名称;
                        // 计算编辑距离或长度差来判断相似度
                        const aDiff = Math.abs(fileNameWithoutExt.length - aName.length);
                        const bDiff = Math.abs(fileNameWithoutExt.length - bName.length);
                        return aDiff - bDiff;
                    });
                    cardInfo = possibleMatches[0];
                }
            }
        } else {
            console.warn(`未找到有效的卡牌信息数据 (${country})`);
        }
        
        // 查找匹配的卡牌代码数据
        let cardCode = null;
        if (Array.isArray(cardCodeData) && cardCodeData.length > 0) {
            // 策略1: 精确匹配完整名称
            cardCode = cardCodeData.find(card => {
                const cardName = card.name;
                if (!cardName) return false;
                return fileNameWithoutExt === cardName;
            });
            
            // 策略2: 如果没有精确匹配，尝试去除空格后精确匹配
            if (!cardCode) {
                const cleanFileName = fileNameWithoutExt.replace(/\s+/g, '');
                cardCode = cardCodeData.find(card => {
                    const cardName = card.name;
                    if (!cardName) return false;
                    const cleanCardName = cardName.replace(/\s+/g, '');
                    return cleanFileName === cleanCardName;
                });
            }
            
            // 策略3: 如果还是没有匹配，尝试更严格的模糊匹配
            if (!cardCode) {
                // 先尝试完全包含关系的匹配
                cardCode = cardCodeData.find(card => {
                    const cardName = card.name;
                    if (!cardName) return false;
                    return fileNameWithoutExt.includes(cardName) || cardName.includes(fileNameWithoutExt);
                });
                
                // 如果找到多个可能匹配项，选择最接近的
                const possibleMatches = cardCodeData.filter(card => {
                    const cardName = card.name;
                    if (!cardName) return false;
                    return fileNameWithoutExt.includes(cardName) || cardName.includes(fileNameWithoutExt);
                });
                
                if (possibleMatches.length > 1) {
                    // 选择名称最接近的匹配项
                    possibleMatches.sort((a, b) => {
                        const aName = a.name;
                        const bName = b.name;
                        // 计算编辑距离或长度差来判断相似度
                        const aDiff = Math.abs(fileNameWithoutExt.length - aName.length);
                        const bDiff = Math.abs(fileNameWithoutExt.length - bName.length);
                        return aDiff - bDiff;
                    });
                    cardCode = possibleMatches[0];
                }
            }
        }
        
        // 合并两个数据源的信息
        if (cardCode && cardCode.importId) {
            cardInfo.importId = cardCode.importId;
        }
        
        console.log('最终卡牌数据:', cardInfo);
        // 即使没有找到匹配项，也返回一个基本对象，避免完全失败
        return cardInfo || {};
    })
    .catch(error => {
        console.error('处理JSON数据时发生错误:', error);
        // 出错时也返回一个基本对象，避免完全失败
        return {};
    });
}
// 修改 showModal 函数，改进错误处理
function showModal(imageSrc, cardData) {
    const modal = document.getElementById('card-modal');
    const modalImage = document.getElementById('modal-image');
    const cardName = document.getElementById('card-name');
    const cardDescription = document.getElementById('card-description');
    const detailsTable = document.getElementById('details-table');
    
    // 设置图片
    modalImage.src = imageSrc;
    
    // 设置卡片信息
    cardName.textContent = cardData.名称 || cardData.name || '未知名称';
    cardDescription.textContent = cardData.描述 || '无描述';
    
    // 清空并填充详细信息表格
    detailsTable.innerHTML = '';
    
    // 添加卡牌代码行
    if (cardData.importId) {
        const codeRow = document.createElement('tr');
        codeRow.innerHTML = `
            <td style="padding: 8px; border-bottom: 1px solid #444; font-weight: bold;">卡牌代码</td>
            <td style="padding: 8px; border-bottom: 1px solid #444;">${cardData.importId}</td>
        `;
        detailsTable.appendChild(codeRow);
    }
    
    const detailInfo = cardData.详细信息 || cardData.details || {};
    for (const [key, value] of Object.entries(detailInfo)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 8px; border-bottom: 1px solid #444; font-weight: bold;">${key}</td>
            <td style="padding: 8px; border-bottom: 1px solid #444;">${value}</td>
        `;
        detailsTable.appendChild(row);
    }
    
    // 显示模态框
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 移动端适配：滚动到顶部
    modal.scrollTop = 0;
}

// 修改图片点击事件处理函数，增强调试信息
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
                            
                            console.log('点击图片:', fileName, '国家:', country);
                            
                            if (country && fileName) {
                                findCardData(fileName, country).then(cardData => {
                                    if (cardData) {
                                        console.log('显示卡牌数据:', cardData);
                                        showModal(imageUrl, cardData);
                                    } else {
                                        console.log('未找到卡牌数据');
                                        // 如果没有找到JSON数据，仍然显示图片
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
// 初始化图片点击事件
// 初始化图片点击事件 - 支持所有国家
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
                            
                            // 确保国家名称正确
                            if (country && fileName) {
                                // 对国家名称进行编码处理
                                const encodedCountry = country; // 由于我们使用的是中文国家名，不需要额外编码
                                
                                findCardData(fileName, encodedCountry).then(cardData => {
                                    if (cardData) {
                                        showModal(imageUrl, cardData);
                                    } else {
                                        // 如果没有找到JSON数据，仍然显示图片
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