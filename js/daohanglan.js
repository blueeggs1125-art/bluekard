function createTopNav() {

    const topNav = document.createElement('div');
    topNav.className = 'top-nav';

    const menuBtn = document.createElement('button');
    menuBtn.className = 'menu-btn';
    menuBtn.innerHTML = '☰';
    menuBtn.setAttribute('aria-label', '打开菜单');

    const navTitle = document.createElement('div');
    navTitle.className = 'nav-title';
    navTitle.textContent = 'FUCK 1939';

    const placeholder = document.createElement('div');
    placeholder.style.width = '40px';

    topNav.appendChild(menuBtn);
    topNav.appendChild(navTitle);
    topNav.appendChild(placeholder);

    return topNav;
}

function createSidebar() {

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';

    const sidebarHeader = document.createElement('div');
    sidebarHeader.style.height = '60px';
    sidebarHeader.style.display = 'flex';
    sidebarHeader.style.alignItems = 'center';
    sidebarHeader.style.padding = '0 20px';
    sidebarHeader.style.borderBottom = '1px solid rgba(255,255,255,0.3)';

    const sidebarTitle = document.createElement('span');
    sidebarTitle.style.fontSize = '18px';
    sidebarTitle.style.fontWeight = 'bold';
    sidebarTitle.style.color = '#fff';
    sidebarTitle.textContent = '菜单';

    sidebarHeader.appendChild(sidebarTitle);

    const sidebarNav = document.createElement('div');
    sidebarNav.className = 'sidebar-nav';

    const links = [
        { href: '../assets/cardimage.html', text: '素材下载' },
        { href: '../tools/deckcounalos.html', text: '卡组生成器' },
        { href: '../tools/cardanalysis.html', text: '卡组图片解析' },
        { href: '../forum/messageboard.html', text: '留言板' },
        { href: '../forum/deckshare.html', text: '卡组分享' },
        { href: '../index.html', text: '主页面' }
    ];

    links.forEach(linkData => {
        const link = document.createElement('a');
        link.href = linkData.href;
        link.className = 'sidebar-link';
        link.textContent = linkData.text;
        sidebarNav.appendChild(link);
    });

    sidebar.appendChild(sidebarHeader);
    sidebar.appendChild(sidebarNav);

    return sidebar;
}

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'overlay';
    return overlay;
}

function addTopNavStyles() {

    if (document.getElementById('top-nav-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'top-nav-styles';
    style.textContent = `
        /* 顶部导航栏 - 使用更高优先级的选择器 */
        .top-nav {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 60px !important;
            background-color: rgba(255, 255, 255, 0.25) !important;
            display: flex !important;
            align-items: center !important;
            padding: 0 20px !important;
            z-index: 9999 !important;
            backdrop-filter: blur(18px) saturate(120%) !important;
            -webkit-backdrop-filter: blur(18px) saturate(120%) !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
            margin: 0 !important;
            box-sizing: border-box !important;
        }

        /* 菜单按钮样式 */
        .top-nav .menu-btn {
            background: none !important;
            border: none !important;
            color: #fff !important;
            font-size: 24px !important;
            cursor: pointer !important;
            padding: 10px !important;
            margin: 0 !important;
            width: auto !important;
            height: auto !important;
            box-sizing: border-box !important;
            flex: none !important;
        }

        /* 标题样式 */
        .top-nav .nav-title {
            color: #fff !important;
            font-size: 20px !important;
            font-weight: bold !important;
            flex: 1 !important;
            text-align: center !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
        }

        /* 占位元素样式 */
        .top-nav div[style*="width: 40px"] {
            width: 40px !important;
            flex: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
        }

        /* 重置导航条内所有元素的样式 */
        .top-nav * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
        }

        /* 侧边栏 */
        .sidebar {
            position: fixed;
            top: 0;
            left: -250px;
            width: 250px;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.25);
            z-index: 10000;
            transition: left 0.3s ease;
            backdrop-filter: blur(18px) saturate(120%);
            -webkit-backdrop-filter: blur(18px) saturate(120%);
            box-shadow: 4px 0 20px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            border-radius: 0 20px 20px 0;
        }

        .sidebar.open {
            left: 0;
        }

        .sidebar-nav {
            display: flex;
            flex-direction: column;
            padding: 20px 0;
            flex: 1;
        }

        .sidebar-link {
            text-decoration: none;
            color: #fff;
            font-size: 16px;
            padding: 15px 20px;
            transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), background-color 0.2s ease;
            margin: 5px 10px;
            border-radius: 12px;
            text-align: center;
        }

        .sidebar-link:hover {
            background-color: rgba(255,255,255,0.12);
        }

        .sidebar-link:active {
            transform: scale(0.92);
        }

        /* 遮罩层 */
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            display: none;
        }

        .overlay.show {
            display: block;
        }

        /* 页面内容间距调整 */
        body {
            padding-top: 60px !important;
            margin: 0 !important;
        }

        /* 导航条容器 */
        .top-nav-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 60px !important;
            z-index: 9999 !important;
            margin: 0 !important;
            padding: 0 !important;
        }
    `;

    document.head.appendChild(style);
}

function initTopNav() {

    addTopNavStyles();

    const topNavContainer = document.createElement('div');
    topNavContainer.className = 'top-nav-container';

    const topNav = createTopNav();

    const sidebar = createSidebar();

    const overlay = createOverlay();

    topNavContainer.appendChild(topNav);

    document.body.insertBefore(topNavContainer, document.body.firstChild);

    document.body.appendChild(sidebar);
    document.body.appendChild(overlay);

    const menuBtn = topNav.querySelector('.menu-btn');

    if (menuBtn && sidebar && overlay) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('show');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTopNav);
} else {
    initTopNav();
}