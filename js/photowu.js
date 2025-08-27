// 全局变量
let contextMenu = null;
let currentImage = null;
let canvas = null;
let ctx = null;
let scale = 1;
let rotation = 0;
let isDragging = false;
let startX, startY;
let imgX = 0, imgY = 0;
let startImgX, startImgY;
// 裁剪框相关变量
let cropRect = { x: 0, y: 0, width: 100, height: 100 };
let isCropMode = false;
let isResizing = false;
let isMoving = false;
let resizeHandle = null;
let startCropRect;



// 裁剪相关变量
let isCropping = false;
let cropStartX, cropStartY;
let cropEndX, cropEndY;
let showCropRect = false;

// 保存设置
let saveWidth = 300;
let saveHeight = 450;

// 初始化制作界面
function initCreationInterface() {
    canvas = document.getElementById('creation-canvas');
    ctx = canvas.getContext('2d');
    
    // 设置画布大小
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // 加载默认图片（如果有）
    loadCurrentImage();
    
    // 绑定事件
    bindCreationEvents();
}

// 绑定制作界面事件
function bindCreationEvents() {
    // 缩放控制
    const scaleSlider = document.getElementById('scale-slider');
    scaleSlider.addEventListener('input', function() {
        scale = parseFloat(this.value);
        drawImage();
    });
    
    // 旋转控制
    const rotationSlider = document.getElementById('rotation-slider');
    rotationSlider.addEventListener('input', function() {
        rotation = parseInt(this.value);
        drawImage();
    });
    
    // 裁剪按钮
    const cropButton = document.getElementById('crop-button');
    cropButton.addEventListener('click', startCropMode);
    
    // 保存按钮
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.addEventListener('click', saveCroppedImage);
    }
    
    // 重置按钮
    const resetButton = document.getElementById('reset-button');
    resetButton.addEventListener('click', resetImage);
    
    // 分辨率设置
    const widthInput = document.getElementById('width-input');
    const heightInput = document.getElementById('height-input');
    
    if (widthInput) {
        widthInput.addEventListener('change', function() {
            saveWidth = parseInt(this.value) || 300;
        });
    }
    
    if (heightInput) {
        heightInput.addEventListener('change', function() {
            saveHeight = parseInt(this.value) || 450;
        });
    }
    
    // 画布事件
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
    canvas.addEventListener('dblclick', handleCanvasDblClick);
    
    // 触摸事件支持
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
}

// 处理画布鼠标移动事件
function handleCanvasMouseMove(e) {
    if (!currentImage) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isCropping && showCropRect && !isCropConfirmed) {
        // 只有在裁剪模式下且裁剪框未确认时才更新裁剪区域
        cropEndX = x;
        cropEndY = y;
        drawImage();
    } else if (isDragging) {
        // 拖拽图片
        imgX = startImgX + (x - startX);
        imgY = startImgY + (y - startY);
        drawImage();
    }
}


// 绑定制作界面事件


// 处理画布鼠标移动事件
// 处理画布鼠标移动事件
function handleCanvasMouseMove(e) {
    if (!currentImage) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isCropping && showCropRect) {
        // 更新裁剪区域
        cropEndX = x;
        cropEndY = y;
        drawImage();
    } else if (isDragging) {
        // 拖拽图片
        imgX = startImgX + (x - startX);
        imgY = startImgY + (y - startY);
        drawImage();
    }
}

// 处理画布鼠标抬起事件
function handleCanvasMouseUp(e) {
    isResizing = false;
    isMoving = false;
    resizeHandle = null;
    
    if (isDragging) {
        // 结束拖拽
        isDragging = false;
        canvas.style.cursor = 'grab';
    }
}

// 处理鼠标离开画布事件
function handleCanvasMouseLeave() {
    isDragging = false;
    if (canvas) {
        canvas.style.cursor = 'grab';
    }
}

// 处理鼠标离开画布事件
function handleCanvasMouseLeave() {
    isDragging = false;
    if (canvas) {
        canvas.style.cursor = 'default';
    }
}

// 处理双击事件（开始裁剪）
function handleCanvasDblClick() {
    if (!isCropping) {
        startCropMode();
    }
}

// 触摸事件处理
// 触摸事件处理
function handleTouchStart(e) {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    } else if (e.touches.length === 2) {
        // 双指触摸开始裁剪模式
        if (!isCropping) {
            startCropMode();
        }
    }
    e.preventDefault();
}

function handleTouchMove(e) {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
    e.preventDefault();
}

function handleTouchEnd(e) {
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
}

// 加载当前图片到制作界面
function loadCurrentImage() {
    const creationLibrary = JSON.parse(localStorage.getItem('creationLibrary') || '[]');
    if (creationLibrary.length > 0) {
        const lastImage = creationLibrary[creationLibrary.length - 1];
        loadImageToCanvas(lastImage.url);
    }
}

// 将图片加载到画布
function loadImageToCanvas(src) {
    if (currentImage) {
        URL.revokeObjectURL(currentImage.src);
    }
    
    currentImage = new Image();
    currentImage.onload = function() {
        // 重置变换参数
        resetTransform();
        drawImage();
    };
    currentImage.src = src;
}

// 绘制图片到画布
function drawImage() {
    if (!currentImage || !ctx) return;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 保存当前状态
    ctx.save();
    
    // 移动到画布中心
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // 旋转
    ctx.rotate(rotation * Math.PI / 180);
    
    // 缩放和平移
    ctx.translate(imgX, imgY);
    ctx.scale(scale, scale);
    
    // 绘制图片（居中）
    ctx.drawImage(
        currentImage, 
        -currentImage.width / 2, 
        -currentImage.height / 2
    );
    
    // 恢复状态
    ctx.restore();
    
    // 绘制裁剪框
    if (isCropping && showCropRect) {
        drawCropRect();
    }
}

// 绘制裁剪矩形
function drawCropRect() {
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    
    const x = Math.min(cropStartX, cropEndX);
    const y = Math.min(cropStartY, cropEndY);
    const width = Math.abs(cropEndX - cropStartX);
    const height = Math.abs(cropEndY - cropStartY);
    
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
}

// 重置变换参数
function resetTransform() {
    scale = 1;
    rotation = 0;
    imgX = 0;
    imgY = 0;
    
    // 更新滑块
    document.getElementById('scale-slider').value = scale;
    document.getElementById('rotation-slider').value = rotation;
}

// 开始裁剪模式

function startCropMode() {
    isCropping = true;
    showCropRect = false;
    isCropConfirmed = false; // 重置确认状态
    document.getElementById('crop-button').textContent = '取消裁剪';
    document.getElementById('crop-button').onclick = cancelCropMode;
    
    // 创建保存按钮
    let saveButton = document.getElementById('save-button');
    if (!saveButton) {
        const cropButton = document.getElementById('crop-button');
        saveButton = document.createElement('button');
        saveButton.id = 'save-button';
        saveButton.textContent = '保存裁剪';
        cropButton.parentNode.insertBefore(saveButton, cropButton.nextSibling);
        saveButton.addEventListener('click', saveCroppedImage);
    }
    saveButton.style.display = 'block';
}

// 取消裁剪模式
// 取消裁剪模式
function cancelCropMode() {
    isCropping = false;
    showCropRect = false;
    isCropConfirmed = false; // 重置确认状态
    document.getElementById('crop-button').textContent = '裁剪';
    document.getElementById('crop-button').onclick = startCropMode;
    
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.style.display = 'none';
    }
    
    drawImage();
}

// 裁剪图片
function saveCroppedImage() {
    if (!currentImage || !showCropRect) return;
    
    // 计算裁剪区域
    const x = Math.min(cropStartX, cropEndX);
    const y = Math.min(cropStartY, cropEndY);
    const width = Math.abs(cropEndX - cropStartX);
    const height = Math.abs(cropEndY - cropStartY);
    
    // 检查裁剪区域是否有效
    if (width < 1 || height < 1) {
        alert('请选择有效的裁剪区域');
        return;
    }
    
    // 创建临时画布用于裁剪
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // 设置为目标尺寸
    tempCanvas.width = saveWidth;
    tempCanvas.height = saveHeight;
    
    // 计算在原图中的坐标（需要考虑变换）
    const centerX = canvas.width / 2 + imgX;
    const centerY = canvas.height / 2 + imgY;
    
    // 计算图片在画布上的实际尺寸
    const imgWidth = currentImage.width * scale;
    const imgHeight = currentImage.height * scale;
    
    // 计算裁剪区域在原图中的相对位置
    const cropX = ((x - centerX + imgWidth / 2) / scale);
    const cropY = ((y - centerY + imgHeight / 2) / scale);
    const cropWidth = (width / scale);
    const cropHeight = (height / scale);
    
    // 绘制到临时画布
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(
        currentImage,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, tempCanvas.width, tempCanvas.height
    );
    
    // 将裁剪后的图片转换为数据URL
    const dataURL = tempCanvas.toDataURL('image/png');
    
    // 创建新的图片对象
    const croppedImage = new Image();
    croppedImage.onload = function() {
        // 替换当前图片
        currentImage = croppedImage;
        
        // 重置变换
        resetTransform();
        
        // 退出裁剪模式
        cancelCropMode();
        
        // 重新绘制
        drawImage();
    };
    croppedImage.src = dataURL;
}

// 重置图片
function resetImage() {
    if (!currentImage) return;
    
    resetTransform();
    drawImage();
}

// 显示制作库内容
function displayCreationLibrary() {
    const libraryDisplay = document.getElementById('library-display');
    const creationLibrary = JSON.parse(localStorage.getItem('creationLibrary') || '[]');
    
    if (creationLibrary.length === 0) {
        libraryDisplay.innerHTML = '<div class="no-images">制作库为空，请从素材库导入图片</div>';
        return;
    }
    
    let html = '<div class="image-container">';
    creationLibrary.forEach((item, index) => {
        html += `
            <div class="image-item">
                <img src="${item.url}" alt="${item.filename}" 
                     oncontextmenu="showContextMenu(event, '${item.url}', '${item.filename}', ${index})"
                     ontouchstart="handleTouchStartLibrary(event, '${item.url}', '${item.filename}', ${index})"
                     ontouchend="handleTouchEndLibrary()"
                     ontouchmove="handleTouchMoveLibrary()">
                <div class="image-name">${item.filename}</div>
            </div>
        `;
    });
    html += '</div>';
    
    libraryDisplay.innerHTML = html;
}

// 显示上下文菜单
function showContextMenu(event, url, filename, index) {
    event.preventDefault();
    
    // 如果已有菜单，先移除
    if (contextMenu) {
        document.body.removeChild(contextMenu);
        contextMenu = null;
    }
    
    // 创建新菜单
    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    
    // 使用选项
    const useItem = document.createElement('div');
    useItem.className = 'context-menu-item';
    useItem.textContent = '使用';
    useItem.onclick = () => {
        loadImageToCanvas(url);
        // 切换到制作界面
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.tab[data-tab="creation"]').classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById('creation').classList.add('active');
        initCreationInterface();
        document.body.removeChild(contextMenu);
        contextMenu = null;
    };
    
    // 删除选项
    const deleteItem = document.createElement('div');
    deleteItem.className = 'context-menu-item';
    deleteItem.textContent = '删除';
    deleteItem.onclick = () => {
        deleteFromLibrary(index);
        document.body.removeChild(contextMenu);
        contextMenu = null;
    };
    
    contextMenu.appendChild(useItem);
    contextMenu.appendChild(deleteItem);
    document.body.appendChild(contextMenu);
    
    // 点击其他地方关闭菜单
    const closeMenu = (e) => {
        if (contextMenu && !contextMenu.contains(e.target)) {
            document.body.removeChild(contextMenu);
            contextMenu = null;
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 10);
}

// 删除制作库中的项目
function deleteFromLibrary(index) {
    let creationLibrary = JSON.parse(localStorage.getItem('creationLibrary') || '[]');
    creationLibrary.splice(index, 1);
    localStorage.setItem('creationLibrary', JSON.stringify(creationLibrary));
    displayCreationLibrary();
}

// 触摸事件处理（制作库）
let touchStartTime;
let touchTimer;

function handleTouchStartLibrary(event, url, filename, index) {
    touchStartTime = Date.now();
    clearTimeout(touchTimer);
    
    touchTimer = setTimeout(() => {
        if (Date.now() - touchStartTime >= 1000) {
            showContextMenu(event, url, filename, index);
        }
    }, 1000);
}

function handleTouchEndLibrary() {
    clearTimeout(touchTimer);
}

function handleTouchMoveLibrary() {
    clearTimeout(touchTimer);
}

// 页面加载完成后显示制作库
document.addEventListener('DOMContentLoaded', function() {
    displayCreationLibrary();
});

// 页面点击关闭菜单
document.addEventListener('click', function(e) {
    if (contextMenu && !contextMenu.contains(e.target)) {
        document.body.removeChild(contextMenu);
        contextMenu = null;
    }
});

// 检查鼠标是否在裁剪框控制点上
function getResizeHandle(x, y) {
    if (!isCropMode) return null;
    
    const handleSize = 8;
    const handles = [
        { name: 'tl', x: cropRect.x, y: cropRect.y },           // 左上
        { name: 'tr', x: cropRect.x + cropRect.width, y: cropRect.y }, // 右上
        { name: 'bl', x: cropRect.x, y: cropRect.y + cropRect.height }, // 左下
        { name: 'br', x: cropRect.x + cropRect.width, y: cropRect.y + cropRect.height }, // 右下
        { name: 'tc', x: cropRect.x + cropRect.width/2, y: cropRect.y }, // 上中
        { name: 'bc', x: cropRect.x + cropRect.width/2, y: cropRect.y + cropRect.height }, // 下中
        { name: 'cl', x: cropRect.x, y: cropRect.y + cropRect.height/2 }, // 左中
        { name: 'cr', x: cropRect.x + cropRect.width, y: cropRect.y + cropRect.height/2 }  // 右中
    ];
    
    for (const handle of handles) {
        if (Math.abs(x - handle.x) <= handleSize && Math.abs(y - handle.y) <= handleSize) {
            return handle.name;
        }
    }
    
    // 检查是否在裁剪框内部（用于移动）
    if (x > cropRect.x && x < cropRect.x + cropRect.width && 
        y > cropRect.y && y < cropRect.y + cropRect.height) {
        return 'move';
    }
    
    return null;
}

// 初始化制作界面
function initCreationInterface() {
    canvas = document.getElementById('creation-canvas');
    ctx = canvas.getContext('2d');
    
    // 设置画布大小
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // 设置初始光标
    canvas.style.cursor = 'grab';
    
    // 加载默认图片（如果有）
    loadCurrentImage();
    
    // 绑定事件
    bindCreationEvents();
}

// 处理画布右键菜单事件
function handleCanvasContextMenu(e) {
    e.preventDefault();
    
    // 如果没有图片，不显示菜单
    if (!currentImage) return;
    
    // 如果已有菜单，先移除
    if (contextMenu) {
        document.body.removeChild(contextMenu);
        contextMenu = null;
    }
    
    // 创建新菜单
    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
    
    // 删除图片选项
    const deleteItem = document.createElement('div');
    deleteItem.className = 'context-menu-item';
    deleteItem.textContent = '删除图片';
    deleteItem.onclick = () => {
        deleteCurrentImage();
        document.body.removeChild(contextMenu);
        contextMenu = null;
    };
    
    contextMenu.appendChild(deleteItem);
    document.body.appendChild(contextMenu);
    
    // 点击其他地方关闭菜单
    const closeMenu = (event) => {
        if (contextMenu && !contextMenu.contains(event.target)) {
            document.body.removeChild(contextMenu);
            contextMenu = null;
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 10);
}

// 删除当前图片
function deleteCurrentImage() {
    currentImage = null;
    drawImage();
    
    // 更新制作库（从localStorage中移除当前图片）
    let creationLibrary = JSON.parse(localStorage.getItem('creationLibrary') || '[]');
    if (creationLibrary.length > 0) {
        creationLibrary.pop(); // 移除最后一项（当前使用的图片）
        localStorage.setItem('creationLibrary', JSON.stringify(creationLibrary));
        displayCreationLibrary(); // 更新制作库显示
    }
}