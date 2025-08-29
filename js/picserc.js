document.addEventListener('DOMContentLoaded', function() {
    // ... 现有代码 ...

    // 添加搜索相关变量
    const searchInput = document.getElementById('search-input');
    
    // 添加搜索事件监听
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const keyword = this.value.trim();
            if (keyword.length > 0) {
                searchImages(keyword);
            } else {
                renderGallery(); // 如果搜索关键词为空，显示所有图片
            }
        });
    }

    // 根据关键词搜索图片（仿照index.html中的搜索功能）
    function searchImagesByKeyword(keyword) {
        return fetch('data/newimages.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('newimages.json 网络响应错误');
                }
                return response.json();
            })
            .then(imagesData => {
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
            })
            .catch(error => {
                console.error('搜索图片失败:', error);
                return [];
            });
    }

    // 处理搜索功能
    async function searchImages(keyword) {
        try {
            const searchResults = await searchImagesByKeyword(keyword);
            
            // 清空画廊
            const gallery = document.getElementById('image-gallery');
            gallery.innerHTML = '';
            
            // 如果没有搜索结果
            if (searchResults.length === 0) {
                gallery.innerHTML = '<div class="no-images">未找到匹配的图片</div>';
                return;
            }
            
            // 渲染搜索结果
            renderSearchResults(searchResults);
        } catch (error) {
            console.error('搜索图片出错:', error);
            const gallery = document.getElementById('image-gallery');
            gallery.innerHTML = '<div class="no-images">搜索图片失败</div>';
        }
    }

    // 渲染搜索结果
    function renderSearchResults(images) {
        const gallery = document.getElementById('image-gallery');
        gallery.innerHTML = '';
        
        images.forEach(image => {
            const imagePath = typeof image === 'object' ? image.path : image;
            // 对整个路径进行编码以支持中文
            const encodedImagePath = encodeImagePath(imagePath);
            const fileName = imagePath.split('/').pop();
            const displayName = typeof image === 'object' ? (image.name || fileName) : fileName;
            
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.draggable = true;
            item.innerHTML = `
                <img src="${encodedImagePath}" alt="${displayName}" data-src="${encodedImagePath}" data-name="${fileName}">
            `;
            
            // 添加拖拽事件
            const imgElement = item.querySelector('img');
            imgElement.addEventListener('dragstart', handleSearchResultDragStart);
            imgElement.addEventListener('dragend', handleDragEnd);
            
            gallery.appendChild(item);
        });
    }

    // 处理包含中文的图片路径
    function encodeImagePath(path) {
        // 将路径中的每个部分进行编码，但保持分隔符不变
        return path.split('/').map(part => encodeURIComponent(part)).join('/');
    }

    // 搜索结果图片的拖拽开始事件
    function handleSearchResultDragStart(e) {
        const imgElement = e.target;
        draggedElement = imgElement;
        draggedFromGallery = true; // 从搜索结果拖拽
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', imgElement.outerHTML);
        e.dataTransfer.setData('image-src', imgElement.dataset.src);
        e.dataTransfer.setData('image-name', imgElement.dataset.name);
        
        // 添加视觉反馈
        setTimeout(() => {
            imgElement.style.opacity = '0.4';
        }, 0);
    }

    // 修改 handleDrop 函数以处理从搜索结果拖拽的图片
    function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        
        if (draggedElement) {
            // 如果是从画廊拖拽来的（包括搜索结果）
            if (draggedFromGallery) {
                // 创建新图片元素
                const newImg = document.createElement('img');
                
                // 检查是从搜索结果还是普通画廊拖拽
                if (draggedElement.dataset.src) {
                    // 从搜索结果拖拽
                    newImg.src = draggedElement.dataset.src;
                    newImg.dataset.id = 'img-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                    newImg.dataset.name = draggedElement.dataset.name;
                } else {
                    // 从普通画廊拖拽
                    newImg.src = draggedElement.src;
                    newImg.dataset.id = draggedElement.dataset.id;
                }
                
                newImg.className = 'draggable-image';
                newImg.draggable = true;
                
                // 添加拖拽事件
                newImg.addEventListener('dragstart', handleDragStart);
                newImg.addEventListener('dragend', handleDragEnd);
                
                this.appendChild(newImg);
                
                // 如果是从普通画廊拖拽，需要重新渲染画廊
                if (!draggedElement.dataset.src) {
                    renderGallery();
                }
            } 
            // 如果是从其他tier拖拽来的
            else {
                // 移动图片到新区域
                this.appendChild(draggedElement);
                
                // 如果原区域和目标区域不同，重新渲染画廊
                if (draggedFromTier != this.dataset.tier) {
                    renderGallery();
                }
            }
        }
    }

    // ... 现有代码 ...
});