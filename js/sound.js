// sound.js

// 当前播放的音频元素
let currentAudio = null;
let longPressTimer;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initSoundPage);

async function initSoundPage() {
    const soundDisplay = document.getElementById('sound-display');
    
    try {
        // 获取音效文件列表
        const sounds = await getSoundFiles();
        
        if (sounds.length === 0) {
            soundDisplay.innerHTML = '<div class="no-sounds">暂无音效文件</div>';
            return;
        }
        
        // 过滤出MP3文件
        const mp3Sounds = sounds.filter(sound => 
            sound.toLowerCase().endsWith('.mp3')
        );
        
        if (mp3Sounds.length === 0) {
            soundDisplay.innerHTML = '<div class="no-sounds">暂无MP3音效文件</div>';
            return;
        }
        
        // 生成音效按钮
        displaySounds(mp3Sounds);
        
    } catch (error) {
        console.error('加载音效出错:', error);
        soundDisplay.innerHTML = '<div class="no-sounds">加载音效失败</div>';
    }
}

// 获取音效文件列表
async function getSoundFiles() {
    try {
        // 从JSON文件获取音效文件列表
        const response = await fetch('sound/files.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const soundFiles = await response.json();
        return soundFiles;
    } catch (error) {
        console.error('获取音效文件列表失败:', error);
        return [];
    }
}

// 显示音效按钮
function displaySounds(sounds) {
    const soundDisplay = document.getElementById('sound-display');
    
    let html = '<div class="sound-container">';
    sounds.forEach(sound => {
        const fileName = sound.split('/').pop().replace('.mp3', '').replace('.MP3', '');
        html += `
            <div class="sound-item" 
                 data-src="${sound}" 
                 data-filename="${sound.split('/').pop()}">
                <div class="sound-name">${fileName}</div>
            </div>
        `;
    });
    html += '</div>';
    
    soundDisplay.innerHTML = html;
    
    // 为每个音效按钮添加事件监听器
    document.querySelectorAll('.sound-item').forEach(item => {
        // PC端事件
        item.addEventListener('click', () => {
            playSound(item.getAttribute('data-src'));
        });
        
        item.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            downloadSound(event, item.getAttribute('data-src'), item.getAttribute('data-filename'));
        });
        
        // 移动端事件
        item.addEventListener('touchstart', (event) => {
            handleTouchStart(event, item.getAttribute('data-src'), item.getAttribute('data-filename'));
        });
        
        item.addEventListener('touchend', handleTouchEnd);
        item.addEventListener('touchmove', handleTouchMove);
    });
}

// 播放音效
function playSound(src) {
    // 停止当前播放的音效
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.remove();
    }
    
    // 播放新音效
    currentAudio = new Audio(src);
    currentAudio.play();
}

// 下载音效文件
function downloadSound(event, url, filename) {
    event.preventDefault();
    
    const link = document.createElement('a');
    link.href = url;
    // 解码文件名用于下载
    link.download = decodeURIComponent(filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 移动端触摸处理
function handleTouchStart(event, url, filename) {
    longPressTimer = setTimeout(() => {
        downloadSound(event, url, filename);
    }, 1000); // 长按1秒触发下载
}

function handleTouchEnd() {
    clearTimeout(longPressTimer);
}

function handleTouchMove() {
    clearTimeout(longPressTimer);
}