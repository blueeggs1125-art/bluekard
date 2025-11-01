// js/mar.js

class ImageEditor {
    constructor() {
        this.editorCanvas = document.getElementById('editor-canvas');
        this.editorPlaceholder = document.getElementById('editor-placeholder');
        this.cropBtn = document.getElementById('crop-btn');
        this.autoRemoveBgBtn = document.getElementById('auto-remove-bg-btn');
        this.manualRemoveBgBtn = document.getElementById('manual-remove-bg-btn');
        this.saveBtn = document.getElementById('save-btn');
        
        this.currentImage = null;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.imageStartX = 0;
        this.imageStartY = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupImageSearch();
    }
    
    setupEventListeners() {
        // 编辑器画布拖拽事件
        this.editorCanvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.editorCanvas.classList.add('drag-over');
        });
        
        this.editorCanvas.addEventListener('dragleave', () => {
            this.editorCanvas.classList.remove('drag-over');
        });
        
        this.editorCanvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.editorCanvas.classList.remove('drag-over');
            this.handleImageDrop(e);
        });
        
        // 功能按钮事件
        this.cropBtn.addEventListener('click', () => this.cropImage());
        this.autoRemoveBgBtn.addEventListener('click', () => this.autoRemoveBackground());
        this.manualRemoveBgBtn.addEventListener('click', () => this.manualRemoveBackground());
        this.saveBtn.addEventListener('click', () => this.saveImage());
        
        // 图片拖拽事件（移动端和PC端兼容）
        this.editorCanvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.editorCanvas.addEventListener('mousemove', (e) => this.dragImage(e));
        this.editorCanvas.addEventListener('mouseup', () => this.stopDrag());
        this.editorCanvas.addEventListener('mouseleave', () => this.stopDrag());
        
        // 触摸事件支持
        this.editorCanvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.editorCanvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.editorCanvas.addEventListener('touchend', () => this.stopDrag());
    }
    
    setupImageSearch() {
        // 复用index.html中的搜索逻辑
        const countries = {
            '苏联': { name: '苏联', hasSubtypes: true },
            '美国': { name: '美国', hasSubtypes: true },
            '德国': { name: '德国', hasSubtypes: true },
            '日本': { name: '日本', hasSubtypes: true },
            '英国': { name: '英国', hasSubtypes: true },
            '波兰': { name: '波兰', hasSubtypes: true },
            '法国': { name: '法国', hasSubtypes: true },
            '意大利': { name: '意大利', hasSubtypes: true },
            '芬兰': { name: '芬兰', hasSubtypes: true },
            '总部': { name: '总部', hasSubtypes: false },
            '卡背': { name: '卡背', hasSubtypes: false }
        };
        
        const subtypes = {
            '金卡': '金卡',
            '银卡': '银卡',
            '铜卡': '铜卡',
            '铁卡': '铁卡'
        };
        
        const noGoldCountries = ['波兰', '法国', '意大利', '芬兰'];
        
        const countrySelect = document.getElementById('country-select');
        const subtypeGroup = document.getElementById('subtype-group');
        const subtypeSelect = document.getElementById('subtype-select');
        const imageDisplay = document.getElementById('image-display');
        const searchInput = document.getElementById('search-input');
        
        // 搜索功能
        searchInput.addEventListener('input', function() {
            const keyword = this.value.trim();
            if (keyword.length > 0) {
                searchImages(keyword);
            } else if (countrySelect.value) {
                if (countries[countrySelect.value].hasSubtypes && subtypeSelect.value) {
                    displayImages(countrySelect.value, subtypeSelect.value);
                } else if (!countries[countrySelect.value].hasSubtypes) {
                    displayImages(countrySelect.value);
                } else {
                    imageDisplay.innerHTML = '<div class="no-images">请选择卡牌类型</div>';
                }
            } else {
                imageDisplay.innerHTML = '<div class="no-images">请先选择国家/类型或搜索关键词</div>';
            }
        });
        
        countrySelect.addEventListener('change', function() {
            const country = this.value;
            if (!country) {
                subtypeGroup.style.display = 'none';
                imageDisplay.innerHTML = '<div class="no-images">请先选择国家/类型</div>';
                return;
            }
            
            const countryConfig = countries[country];
            if (countryConfig.hasSubtypes) {
                subtypeGroup.style.display = 'block';
                updateSubtypeOptions(country);
                imageDisplay.innerHTML = '<div class="no-images">请选择卡牌类型</div>';
            } else {
                subtypeGroup.style.display = 'none';
                displayImages(country);
            }
        });
        
        subtypeSelect.addEventListener('change', function() {
            const country = countrySelect.value;
            const subtype = this.value;
            if (country && subtype) {
                displayImages(country, subtype);
            } else {
                imageDisplay.innerHTML = '<div class="no-images">请选择卡牌类型</div>';
            }
        });
        
        function updateSubtypeOptions(country) {
            subtypeSelect.innerHTML = '<option value="">请选择...</option>';
            
            for (const [key, name] of Object.entries(subtypes)) {
                if (key === '金卡' && noGoldCountries.includes(country)) {
                    continue;
                }
                const option = document.createElement('option');
                option.value = key;
                option.textContent = name;
                subtypeSelect.appendChild(option);
            }
        }
        
        // 显示特定国家和类型的图片
        async function displayImages(country, subtype = null) {
            imageDisplay.innerHTML = '<div class="loading">加载中...</div>';
            
            try {
                const response = await fetch('data/newimages.json');
                if (!response.ok) {
                    throw new Error('newimages.json 网络响应错误');
                }
                const imagesData = await response.json();
                
                let filteredImages = [];
                
                // 根据国家和子类型筛选图片
                if (imagesData[country]) {
                    if (countries[country].hasSubtypes && subtype && imagesData[country][subtype]) {
                        // 有子类型的情况
                        filteredImages = imagesData[country][subtype];
                    } else if (!countries[country].hasSubtypes) {
                        // 没有子类型的情况（总部、卡背）
                        filteredImages = imagesData[country];
                    }
                }
                
                if (filteredImages.length === 0) {
                    imageDisplay.innerHTML = '<div class="no-images">暂无图片</div>';
                    return;
                }
                
                renderImages(filteredImages);
                
            } catch (error) {
                console.error('加载图片出错:', error);
                imageDisplay.innerHTML = '<div class="no-images">加载图片失败</div>';
            }
        }
        
        // 搜索图片功能
        async function searchImages(keyword) {
            imageDisplay.innerHTML = '<div class="loading">搜索中...</div>';
            
            try {
                const searchResults = await searchImagesByKeyword(keyword);
                
                if (searchResults.length === 0) {
                    imageDisplay.innerHTML = '<div class="no-images">未找到匹配的图片</div>';
                    return;
                }
                
                renderImages(searchResults);
            } catch (error) {
                console.error('搜索图片出错:', error);
                imageDisplay.innerHTML = '<div class="no-images">搜索图片失败</div>';
            }
        }
        
        // 根据关键词搜索图片
        async function searchImagesByKeyword(keyword) {
            try {
                const response = await fetch('data/newimages.json');
                if (!response.ok) {
                    throw new Error('newimages.json 网络响应错误');
                }
                const imagesData = await response.json();
                
                const results = [];
                const searchKeyword = keyword.trim().toLowerCase();
                const addedPaths = new Set(); // 用于避免重复添加
                
                // 遍历 newimages.json 中的图片数据
                for (const country in imagesData) {
                    if (!imagesData.hasOwnProperty(country)) continue;
                    
                    const countryData = imagesData[country];
                    
                    // 如果国家数据是数组格式（总部、卡背等没有子类型）
                    if (Array.isArray(countryData)) {
                        countryData.forEach(imagePath => {
                            const fileName = imagePath.split('/').pop();
                            // 只检查文件名是否匹配关键词（不区分大小写）
                            if (fileName.toLowerCase().includes(searchKeyword)) {
                                // 避免重复添加
                                if (!addedPaths.has(imagePath)) {
                                    addedPaths.add(imagePath);
                                    results.push({
                                        path: imagePath,
                                        name: fileName,
                                        description: ''
                                    });
                                }
                            }
                        });
                    } 
                    // 如果国家数据是对象格式（有子类型：金卡、银卡等）
                    else {
                        for (const subtype in countryData) {
                            if (!countryData.hasOwnProperty(subtype)) continue;
                            
                            countryData[subtype].forEach(imagePath => {
                                const fileName = imagePath.split('/').pop();
                                // 只检查文件名是否匹配关键词（不区分大小写）
                                if (fileName.toLowerCase().includes(searchKeyword)) {
                                    // 避免重复添加
                                    if (!addedPaths.has(imagePath)) {
                                        addedPaths.add(imagePath);
                                        results.push({
                                            path: imagePath,
                                            name: fileName,
                                            description: ''
                                        });
                                    }
                                }
                            });
                        }
                    }
                }
                
                return results;
            } catch (error) {
                console.error('搜索图片失败:', error);
                return [];
            }
        }
        
        // 渲染图片列表
        function renderImages(images) {
            let html = '<div class="image-container">';
            images.forEach(image => {
                // 处理搜索结果和普通图片路径的不同
                const imagePath = typeof image === 'object' ? image.path : image;
                // 对整个路径进行编码以支持中文
                const encodedImagePath = encodeImagePath(imagePath);
                const fileName = imagePath.split('/').pop();
                const displayName = typeof image === 'object' ? (image.name || fileName) : fileName;
                
                // 对文件名进行编码用于下载
                const encodedFileName = encodeURIComponent(fileName);
                
                html += `
                    <div class="image-item" draggable="true" data-src="${encodedImagePath}" data-name="${encodedFileName}">
                        <img src="${encodedImagePath}" alt="${displayName}">
                        <div class="image-name">${displayName}</div>
                    </div>
                `;
            });
            html += '</div>';
            
            imageDisplay.innerHTML = html;
            
            // 为所有图片项添加拖拽事件
            document.querySelectorAll('.image-item').forEach(item => {
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', item.dataset.src);
                    e.dataTransfer.setData('image-name', item.dataset.name);
                });
            });
        }
        
        // 添加一个新函数用于处理包含中文的图片路径
        function encodeImagePath(path) {
            // 将路径中的每个部分进行编码，但保持分隔符不变
            return path.split('/').map(part => encodeURIComponent(part)).join('/');
        }
    }
    
    handleImageDrop(e) {
        const imageUrl = e.dataTransfer.getData('text/plain');
        const imageName = e.dataTransfer.getData('image-name');
        
        if (imageUrl) {
            this.loadImageToEditor(imageUrl, imageName);
        }
    }
    
    loadImageToEditor(imageUrl, imageName) {
        // 清除占位符
        this.editorPlaceholder.style.display = 'none';
        
        // 如果已有图片，先移除
        if (this.currentImage) {
            this.currentImage.remove();
        }
        
        // 创建新图片
        this.currentImage = document.createElement('img');
        this.currentImage.src = imageUrl;
        this.currentImage.className = 'editor-image';
        this.currentImage.alt = decodeURIComponent(imageName);
        
        // 图片加载完成后居中显示
        this.currentImage.onload = () => {
            this.editorCanvas.appendChild(this.currentImage);
            this.centerImage();
            this.enableButtons();
        };
        
        // 图片拖拽事件
        this.currentImage.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startDrag(e);
        });
        
        this.currentImage.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            this.handleTouchStart(e);
        });
    }
    
    centerImage() {
        if (!this.currentImage) return;
        
        const containerRect = this.editorCanvas.getBoundingClientRect();
        const imageRect = this.currentImage.getBoundingClientRect();
        
        // 设置图片初始位置为居中
        this.currentImage.style.left = `${(containerRect.width - imageRect.width) / 2}px`;
        this.currentImage.style.top = `${(containerRect.height - imageRect.height) / 2}px`;
    }
    
    startDrag(e) {
        if (!this.currentImage) return;
        
        e.preventDefault();
        this.isDragging = true;
        
        const rect = this.currentImage.getBoundingClientRect();
        
        if (e.type === 'mousedown') {
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
        } else if (e.type === 'touchstart') {
            this.dragStartX = e.touches[0].clientX;
            this.dragStartY = e.touches[0].clientY;
        }
        
        this.imageStartX = rect.left - this.editorCanvas.getBoundingClientRect().left;
        this.imageStartY = rect.top - this.editorCanvas.getBoundingClientRect().top;
        
        this.currentImage.style.cursor = 'grabbing';
    }
    
    dragImage(e) {
        if (!this.isDragging || !this.currentImage) return;
        
        e.preventDefault();
        
        let clientX, clientY;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        const dx = clientX - this.dragStartX;
        const dy = clientY - this.dragStartY;
        
        // 限制图片不能拖出编辑区域
        const containerRect = this.editorCanvas.getBoundingClientRect();
        const imageRect = this.currentImage.getBoundingClientRect();
        
        let newX = this.imageStartX + dx;
        let newY = this.imageStartY + dy;
        
        // 限制X轴移动范围
        if (newX > 0) newX = 0;
        if (newX < containerRect.width - imageRect.width) 
            newX = containerRect.width - imageRect.width;
        
        // 限制Y轴移动范围
        if (newY > 0) newY = 0;
        if (newY < containerRect.height - imageRect.height) 
            newY = containerRect.height - imageRect.height;
        
        // 应用新位置
        this.currentImage.style.left = `${newX}px`;
        this.currentImage.style.top = `${newY}px`;
    }
    
    stopDrag() {
        this.isDragging = false;
        if (this.currentImage) {
            this.currentImage.style.cursor = 'move';
        }
    }
    
    handleTouchStart(e) {
        this.startDrag(e);
    }
    
    handleTouchMove(e) {
        this.dragImage(e);
    }
    
    enableButtons() {
        this.cropBtn.disabled = false;
        this.autoRemoveBgBtn.disabled = false;
        this.manualRemoveBgBtn.disabled = false;
        this.saveBtn.disabled = false;
    }
    
    disableButtons() {
        this.cropBtn.disabled = true;
        this.autoRemoveBgBtn.disabled = true;
        this.manualRemoveBgBtn.disabled = true;
        this.saveBtn.disabled = true;
    }
    
    cropImage() {
        if (!this.currentImage) return;
        
        alert('裁剪功能已激活。在实际应用中，您可以在这里实现裁剪功能。');
        // 实际应用中会打开裁剪工具，让用户选择裁剪区域
    }
    
    autoRemoveBackground() {
        if (!this.currentImage) return;
        
        alert('自动抠图功能已激活。在实际应用中，您可以在这里实现背景移除功能。');
        // 实际应用中会使用背景移除算法或API
    }
    
    manualRemoveBackground() {
        if (!this.currentImage) return;
        
        alert('手动抠图功能已激活。在实际应用中，您可以在这里实现手动背景移除功能。');
        // 实际应用中会提供画笔工具让用户手动标记要移除的背景
    }
    
    saveImage() {
        if (!this.currentImage) return;
        
        // 创建一个临时canvas用于导出
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const containerRect = this.editorCanvas.getBoundingClientRect();
        const imageRect = this.currentImage.getBoundingClientRect();
        
        // 设置canvas尺寸为编辑区域尺寸
        canvas.width = containerRect.width;
        canvas.height = containerRect.height;
        
        // 绘制图片到canvas
        const scaleX = this.currentImage.naturalWidth / this.currentImage.width;
        const scaleY = this.currentImage.naturalHeight / this.currentImage.height;
        
        const drawX = parseFloat(this.currentImage.style.left) || 0;
        const drawY = parseFloat(this.currentImage.style.top) || 0;
        const drawWidth = imageRect.width;
        const drawHeight = imageRect.height;
        
        ctx.drawImage(
            this.currentImage,
            0, 0, this.currentImage.naturalWidth, this.currentImage.naturalHeight,
            drawX, drawY, drawWidth, drawHeight
        );
        
        // 导出为图片并下载
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `edited-${this.currentImage.alt || 'image'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
}

// 页面加载完成后初始化编辑器
document.addEventListener('DOMContentLoaded', () => {
    window.imageEditor = new ImageEditor();
});