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
                <img id="reserve-icon" style="position: absolute; bottom: 20px; right: 20px; width: 64px; height: 64px; display: none;" src="../image/T_nui-icon-Reserves-gritty-256.png" alt="预备">
            </div>
            <div id="info-container" style="flex: 1; padding: 20px; color: white; overflow-y: auto;">
                <h2 id="card-name" style="margin-bottom: 15px; font-size: 24px;"></h2>
                <p id="card-description" style="margin-bottom: 15px; font-size: 16px; line-height: 1.5;"></p>
                <div id="card-details" style="font-size: 14px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tbody id="details-table"></tbody>
                    </table>
                </div>
                <button id="download-btn" style="margin-top: 15px; padding: 10px 20px; background-color: #1e90ff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">下载图片</button>
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
    
    // 添加下载按钮事件
    document.getElementById('download-btn').addEventListener('click', downloadImage);
}

function downloadImage() {
    const modalImage = document.getElementById('modal-image');
    const cardName = document.getElementById('card-name').textContent;
    const imageUrl = modalImage.src;
    
    if (!imageUrl) {
        alert('图片链接无效');
        return;
    }
    
    try {
        const filename = cardName ? `${cardName}.png` : 'card.png';
        
        if (imageUrl.endsWith('.avif')) {
            convertAndDownloadAvif(imageUrl, filename);
        } else {
            // 对于非AVIF图片，直接下载
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error('下载图片时出错:', error);
        alert('下载失败，请重试');
    }
}

// 优化的AVIF转PNG函数，解决黑角问题
// 优化的AVIF转PNG函数，解决黑角问题
function convertAndDownloadAvif(avifUrl, filename) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制原图
        ctx.drawImage(img, 0, 0);
        
        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 只检测并处理四个角落的黑色像素，设置为透明
        const corners = [
            {x: 0, y: 0},                                    // 左上角
            {x: canvas.width - 1, y: 0},                     // 右上角
            {x: 0, y: canvas.height - 1},                    // 左下角
            {x: canvas.width - 1, y: canvas.height - 1}      // 右下角
        ];
        
        // 检查每个角落附近的像素
        corners.forEach(corner => {
            // 检查角落周围一定范围内的像素（例如10x10区域）
            const range = Math.min(10, canvas.width/10, canvas.height/10); // 根据图片大小调整检测范围
            
            for (let y = Math.max(0, corner.y - range); y <= Math.min(canvas.height - 1, corner.y + range); y++) {
                for (let x = Math.max(0, corner.x - range); x <= Math.min(canvas.width - 1, corner.x + range); x++) {
                    const index = (y * canvas.width + x) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    
                    // 如果像素接近黑色，则设为透明
                    if (r < 30 && g < 30 && b < 30) {
                        data[index + 3] = 0; // Alpha设为0（完全透明）
                    }
                }
            }
        });
        
        // 将修改后的图像数据放回canvas
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob(function(blob) {
            const pngUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(pngUrl);
        }, 'image/png');
    };
    
    img.onerror = function() {
        console.error('图片加载失败:', avifUrl);
        alert('图片加载失败，无法下载');
    };
    
    // 设置crossOrigin属性以避免CORS问题
    img.crossOrigin = 'Anonymous';
    img.src = avifUrl;
}

function getPixelColor(data, x, y, width) {
    const index = (y * width + x) * 4;
    return {
        r: data[index],
        g: data[index + 1],
        b: data[index + 2],
        a: data[index + 3]
    };
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
        // 不显示衍生相关信息
        if (!excludeFields.includes(key) && key !== "衍生") {
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
    return fetch('../data/newk.json')
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
// 修改 initImageClickEvents 函数中的相应部分
function initImageClickEvents() {
    // 监听图片容器的变化
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // 为新添加的图片添加点击事件和保护措施
                document.querySelectorAll('.image-item img').forEach(img => {
                    // 只为卡牌图片添加点击事件，不为预备图标添加
                    if (!img.classList.contains('reserve-icon') && !img.hasAttribute('data-click-handler')) {
                        // 添加点击事件
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
                        
                        // 添加保护措施：禁用右键和长按
                        img.addEventListener('contextmenu', function(e) {
                            e.preventDefault();
                            return false;
                        });
                        
                        img.addEventListener('touchstart', function(e) {
                            this.style.webkitTouchCallout = 'none';
                            this.style.webkitUserSelect = 'none';
                        });
                        
                        img.style.touchAction = 'manipulation';
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
    return fetch('../data/newk.json')
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

// 添加到 DOMContentLoaded 事件监听器中
document.addEventListener('DOMContentLoaded', function() {
    createModal();
    initImageClickEvents();
    
    // 禁用图片右键菜单和长按菜单
    disableImageContextMenus();
});

// 禁用图片右键和长按功能
function disableImageContextMenus() {
    // 禁用PC端右键点击图片
    document.addEventListener('contextmenu', function(e) {
        if (e.target.tagName === 'IMG' && e.target.closest('.image-item')) {
            e.preventDefault();
            return false;
        }
    });
    
    // 禁用移动端长按图片
    document.addEventListener('touchstart', function(e) {
        if (e.target.tagName === 'IMG' && e.target.closest('.image-item')) {
            // 阻止默认的长按行为
            e.target.style.webkitTouchCallout = 'none';
            e.target.style.webkitUserSelect = 'none';
        }
    });
    
    // 为所有已存在的图片添加保护
    document.querySelectorAll('.image-item img').forEach(img => {
        img.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        
        img.addEventListener('touchstart', function(e) {
            this.style.webkitTouchCallout = 'none';
            this.style.webkitUserSelect = 'none';
        });
        
        // 添加CSS属性防止长按菜单
        img.style.touchAction = 'manipulation';
    });
}

// 添加键盘事件支持（ESC关闭模态框）
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});