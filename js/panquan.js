// panquan.js - 全局页脚脚本
(function() {
    // 检查是否已经添加过页脚，避免重复添加
    if (document.querySelector('.global-footer')) {
        return;
    }

    // 创建页脚元素
    const footer = document.createElement('footer');
    footer.className = 'global-footer';
    footer.innerHTML = `
        <div class="footer-content">
            Copyright © 2025-2026 fk1939.cn All right reserved.
        </div>
    `;

    // 添加页脚样式
    const style = document.createElement('style');
    style.textContent = `
        .global-footer {
            position: fixed;
            bottom: 70px; /* 留出底部导航的空间 */
            left: 0;
            right: 0;
            background-color: transparent !important; /* 强制纯透明背景 */
            color: #fff;
            font-size: 12px;
            text-align: center;
            padding: 10px 0;
            z-index: 998; /* 确保在底部导航栏下方，但在主要内容上方 */
            border-top: none;
            backdrop-filter: none !important; /* 禁用毛玻璃效果 */
            -webkit-backdrop-filter: none !important;
            box-shadow: none;
            margin: 0;
        }
        
        .footer-content {
            display: block;
            width: 100%;
        }
        
        /* 移动设备适配 */
        @media (max-width: 768px) {
            .global-footer {
                font-size: 11px;
                bottom: 70px; /* 保持与桌面端相同的距离 */
                padding: 8px 0;
            }
        }
        
        @media (max-width: 480px) {
            .global-footer {
                font-size: 10px;
                bottom: 70px;
                padding: 6px 0;
            }
        }
        
        /* 确保页脚始终可见 */
        body {
            padding-bottom: 100px; /* 为固定定位的页脚预留空间 */
        }
    `;
    
    // 将样式添加到头部
    document.head.appendChild(style);
    
    // 将页脚添加到页面主体
    document.body.appendChild(footer);
    
    // 监听DOM变化，确保页脚始终保持在正确位置
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            // 检查是否有底部导航栏出现
            const bottomNav = document.querySelector('.bottom-nav') || 
                             document.querySelector('[style*="position: fixed"][style*="bottom"]');
            
            if (bottomNav) {
                // 调整页脚位置，避免与底部导航重叠
                footer.style.bottom = '70px';
            } else {
                // 如果没有底部导航，则放置在接近页面底部的位置
                footer.style.bottom = '20px';
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // 页面加载完成后调整页脚位置
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            adjustFooterPosition();
        });
    } else {
        adjustFooterPosition();
    }
    
    // 窗口大小改变时重新调整页脚位置
    window.addEventListener('resize', adjustFooterPosition);
    
    // 函数：调整页脚位置
    function adjustFooterPosition() {
        // 查找底部导航栏
        const bottomNav = document.querySelector('.bottom-nav') || 
                         document.querySelector('[style*="position: fixed"][style*="bottom"]') ||
                         document.querySelector('.global-bottom-nav'); // 通用底部导航类名
        
        if (bottomNav) {
            // 获取底部导航栏的高度
            const navHeight = bottomNav.offsetHeight || 55; // 默认高度
            // 设置页脚在底部导航栏上方
            footer.style.bottom = (navHeight + 15) + 'px'; // 15px 间距
        } else {
            // 如果没有底部导航栏，将页脚放置在页面底部附近
            footer.style.bottom = '20px';
        }
    }
})();