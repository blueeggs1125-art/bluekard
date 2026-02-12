// pl.js - 修复图片评论过滤功能并添加玻璃质感样式

// Supabase 配置
const SUPABASE_URL = "https://fyimdcysosuhwguizroi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aW1kY3lzb3N1aHdndWl6cm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5ODM4MjIsImV4cCI6MjA3NzU1OTgyMn0._QZQCWwhzvQ7r2rarOPa7p9QI3TGAr8vaM1tLNudu1c";

// 全局 Supabase 客户端实例
let supabaseClient = null;

// 初始化 Supabase 客户端
async function initializeSupabase() {
    if (!window.supabase) {
        throw new Error('Supabase library not loaded');
    }
    
    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return supabaseClient;
}

let currentUser = null;
let allComments = [];
let allUsers = [];

// 加载用户信息 - 从localStorage获取
function loadCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        try {
            currentUser = JSON.parse(userStr);
            console.log('当前用户信息:', currentUser);
        } catch (e) {
            console.error('解析用户信息失败:', e);
        }
    } else {
        console.log('用户未登录');
    }
}

// 加载图片评论 - 修复版本，按图片路径过滤
async function loadComments(imagePath) {
    // 确保当前用户信息是最新的
    loadCurrentUser();
    
    try {
        const sb = await initializeSupabase();
        
        console.log('尝试加载评论，图片路径:', imagePath);
        
        // 从数据库获取所有评论
        const { data: comments, error: commentsError } = await sb
            .from('pinglun')
            .select('*')
            .order('created_at', { ascending: false });

        if (commentsError) {
            console.error('加载评论失败:', commentsError);
            throw commentsError;
        }

        console.log('原始评论数据:', comments);
        
        // 过滤出当前图片的评论
        const imageComments = comments.filter(comment => {
            // 检查评论内容是否包含图片路径
            if (comment.neirong && comment.neirong.includes('[IMAGE_PATH:')) {
                const pathMatch = comment.neirong.match(/\[IMAGE_PATH:([^\]]+)\]/);
                if (pathMatch) {
                    const commentImagePath = pathMatch[1];
                    // 比较图片路径，支持编码和解码的路径
                    return commentImagePath === imagePath || 
                           decodeURIComponent(commentImagePath) === imagePath ||
                           commentImagePath === decodeURIComponent(imagePath);
                }
            }
            // 如果评论没有路径标记，可能是旧数据，暂时显示
            return false;
        });
        
        console.log('过滤后的图片评论:', imageComments);
        
        // 获取所有用户信息
        const { data: users, error: usersError } = await sb
            .from('zhuce')
            .select('id, user_name, avatar_url, admin');

        if (usersError) {
            console.error('加载用户信息失败:', usersError);
            throw usersError;
        }

        allComments = imageComments;
        allUsers = users;

        return { comments: imageComments, users };
    } catch (error) {
        console.error('加载评论时出错:', error);
        throw error;
    }
}

// 渲染评论
function renderComments(comments, users, imagePath) {
    const commentsContainer = document.getElementById(`comments-container-${imagePath}`);
    if (!commentsContainer) return;

    // 确保 comments 是数组
    if (!Array.isArray(comments) || comments.length === 0) {
        commentsContainer.innerHTML = '<div class="no-comments">暂无评论</div>';
        return;
    }

    const commentsHTML = comments.map(comment => {
        const time = new Date(comment.created_at).toLocaleString();
        // 使用 user_name 而不是 user_id 来匹配用户
        const user = users.find(u => u.user_name === comment.user_name);
        
        // 从评论内容中提取实际评论文本（去除路径标记）
        let commentText = comment.neirong || comment.content || '';
        if (commentText.includes('[IMAGE_PATH:')) {
            // 移除路径标记部分，只保留实际评论内容
            commentText = commentText.replace(/\[IMAGE_PATH:[^\]]+\]\s*/, '');
        }
        
        return `
            <div class="comment-item">
                <div class="comment-header">
                    ${user ? (() => {
                        const avatarUrl = user.avatar_url;
                        return avatarUrl ? 
                            `<img src="${avatarUrl}" alt="头像" class="comment-avatar" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMGUwZTAiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0MCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJhzwvdGV4dD48L3N2Zz4='" />` :
                            `<div class="default-comment-avatar">👤</div>`;
                    })() : `<div class="default-comment-avatar">👤</div>`}
                    <div class="comment-user-info">
                        <div class="comment-user">
                            ${comment.user_name || '匿名用户'} 
                            ${user && (user.admin === 0 || user.admin === "0") ? '<span style="color:red;font-size:12px;margin-left:5px;">[管理员]</span>' : ''}
                            <span class="comment-time">[${time}]</span>
                        </div>
                    </div>
                </div>
                <div class="comment-content">${commentText}</div>
                ${currentUser && ((parseInt(currentUser.admin) === 0 || currentUser.admin === "0") || 
                   (currentUser.user_name === comment.user_name)) ?
                    `<div class="comment-actions">
                        <button class="delete-comment-btn" onclick="deleteComment(${comment.id}, '${encodeURIComponent(imagePath)}')">删除</button>
                    </div>` : ''}
            </div>
        `;
    }).join('');

    commentsContainer.innerHTML = commentsHTML;
}

// 显示评论悬浮窗 - 修复版本，添加玻璃质感样式
async function showCommentsModal(imagePath, imageName) {
    // 确保当前用户信息是最新的
    loadCurrentUser();
    
    try {
        // 初始化 Supabase
        const sb = await initializeSupabase();

        // 检查是否已存在模态框
        let modal = document.getElementById('comments-modal');
        if (modal) {
            modal.remove();
        }

        // 创建模态框
        modal = document.createElement('div');
        modal.id = 'comments-modal';
        modal.className = 'modal';
        
        // 显示加载状态
        modal.innerHTML = `
            <div class="modal-content floating-window">
                <div class="modal-header">
                    <h3>图片评论 - ${imageName}</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="loading-comments">加载中...</div>
                    <div id="comments-container-${imagePath}" class="comments-list"></div>
                </div>
                <div class="modal-footer">
                    <div id="comment-input-${imagePath}" class="comment-input-section" style="display: ${currentUser ? 'block' : 'none'};">
                        <textarea id="new-comment-${imagePath}" placeholder="写下您的评论..."></textarea>
                        <button id="submit-comment-${imagePath}" class="submit-comment-btn">发表评论</button>
                    </div>
                    <div id="login-prompt-${imagePath}" class="login-prompt" style="display: ${currentUser ? 'none' : 'block'};">
                        请 <a href="../account/sign.html">登录</a> 后评论
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定关闭事件
        const closeModalBtn = modal.querySelector('.close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function() {
                modal.remove();
            });
        }

        // 点击模态框外部关闭
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.remove();
            }
        });

        try {
            // 加载评论
            const { comments, users } = await loadComments(imagePath);
            
            // 隐藏加载提示，显示评论
            const loadingEl = modal.querySelector('.loading-comments');
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
            
            renderComments(comments, users, imagePath);

            // 绑定提交评论事件
            if (currentUser) {
                const submitBtn = document.getElementById(`submit-comment-${imagePath}`);
                if (submitBtn) {
                    submitBtn.addEventListener('click', async function() {
                        await handleCommentSubmit(imagePath, sb);
                    });
                    
                    // 支持回车提交
                    const textarea = document.getElementById(`new-comment-${imagePath}`);
                    if (textarea) {
                        textarea.addEventListener('keydown', function(e) {
                            if (e.key === 'Enter' && e.ctrlKey) {
                                handleCommentSubmit(imagePath, sb);
                            }
                        });
                    }
                }
            }
        } catch (loadError) {
            console.error('加载评论失败:', loadError);
            const commentsContainer = document.getElementById(`comments-container-${imagePath}`);
            if (commentsContainer) {
                commentsContainer.innerHTML = '<div class="no-comments">评论加载失败，请刷新重试</div>';
            }
        }

        // 显示模态框
        modal.style.display = 'block';
    } catch (error) {
        console.error('显示评论模态框失败:', error);
        alert('评论功能暂时不可用，请稍后再试。错误: ' + error.message);
    }
}

// 处理评论提交
async function handleCommentSubmit(imagePath, sb) {
    const commentText = document.getElementById(`new-comment-${imagePath}`).value.trim();
    if (!commentText) {
        alert('请输入评论内容');
        return;
    }

    // 显示提交状态
    const submitBtn = document.getElementById(`submit-comment-${imagePath}`);
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';

    try {
        // 提交评论，包含图片路径标记
        const { error } = await sb
            .from('pinglun')
            .insert([{
                user_name: currentUser.user_name,  // 使用 user_name 而不是 user_id
                neirong: `[IMAGE_PATH:${imagePath}] ${commentText}`
            }]);

        if (error) {
            console.error('提交评论失败:', error);
            alert('提交评论失败: ' + error.message);
        } else {
            document.getElementById(`new-comment-${imagePath}`).value = '';
            // 重新加载评论
            const { comments, users } = await loadComments(imagePath);
            renderComments(comments, users, imagePath);
        }
    } catch (submitError) {
        console.error('提交评论时出错:', submitError);
        alert('提交评论时出错: ' + submitError.message);
    } finally {
        // 恢复按钮状态
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// 删除评论
async function deleteComment(commentId, imagePath) {
    try {
        const sb = await initializeSupabase();

        if (!confirm('确定要删除这条评论吗？')) {
            return;
        }

        const { error } = await sb
            .from('pinglun')
            .delete()
            .eq('id', commentId);

        if (error) {
            console.error('删除评论失败:', error);
            alert('删除评论失败: ' + error.message);
        } else {
            // 重新加载评论
            const { comments, users } = await loadComments(decodeURIComponent(imagePath));
            renderComments(comments, users, decodeURIComponent(imagePath));
        }
    } catch (error) {
        console.error('删除评论时出错:', error);
        alert('删除评论时出错: ' + error.message);
    }
}


function addGlassStyle() {
    if (document.getElementById('comments-modal-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'comments-modal-styles';
    style.textContent = `
        /* 评论模态框玻璃质感样式 */
        .modal {
            display: none;
            position: fixed;
            z-index: 10000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5); /* 50% 透明度 */
            animation: fadeIn 0.3s ease-out;
        }

        .modal-content.floating-window {
            position: absolute;
            background-color: #fefefe;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease-out;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0); /* 0透明度 - 完全透明背景 */
            backdrop-filter: blur(18px) saturate(120%); /* 模糊效果 */
            -webkit-backdrop-filter: blur(18px) saturate(120%); /* Safari兼容 */
            border: 1px solid rgba(255, 255, 255, 0.3); /* 边框 */
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translate(-50%, 100%);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%);
            }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .modal-header {
            padding: 15px 20px;
            background-color: rgba(30, 144, 255, 0.66); /* 66% 透明度 */
            color: white;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255, 255, 255, 0); /* 0透明度 - 完全透明背景 */
            backdrop-filter: blur(18px) saturate(120%); /* 模糊效果 */
            -webkit-backdrop-filter: blur(18px) saturate(120%); /* Safari兼容 */
            border-bottom: 1px solid rgba(255, 255, 255, 0.2); /* 边框 */
        }

        .modal-header h3 {
            margin: 0;
            font-size: 16px;
            color: white; /* 标题文字颜色设为白色 */
        }

        .close-modal {
            color: white;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            background: none;
            border: none;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close-modal:hover {
            color: #ccc;
        }

        .modal-body {
            padding: 15px;
            overflow-y: auto;
            flex: 1;
            max-height: calc(80vh - 180px);
            background: rgba(255, 255, 255, 0); /* 0透明度 - 完全透明背景 */
            backdrop-filter: blur(18px) saturate(120%); /* 模糊效果 */
            -webkit-backdrop-filter: blur(18px) saturate(120%); /* Safari兼容 */
        }

        .modal-footer {
            padding: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.2); /* 半透明边框 */
            background-color: rgba(249, 249, 249, 0); /* 0透明度 - 完全透明背景 */
            border-radius: 0 0 12px 12px;
            backdrop-filter: blur(18px) saturate(120%); /* 模糊效果 */
            -webkit-backdrop-filter: blur(18px) saturate(120%); /* Safari兼容 */
        }

        .comment-item {
            padding: 12px 0;
            border-bottom: 1px solid rgba(238, 238, 238, 0.5); /* 半透明边框 */
        }

        .comment-item:last-child {
            border-bottom: none;
        }

        .comment-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }

        .comment-avatar {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            margin-right: 8px;
            object-fit: cover;
        }

        .default-comment-avatar {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            margin-right: 8px;
            background-color: #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: #999;
        }

        .comment-user-info {
            flex: 1;
        }

        .comment-user {
            font-weight: bold;
            color: white; /* 用户名文字颜色设为白色 */
            font-size: 14px;
        }

        .comment-time {
            color: #ccc; /* 时间文字颜色设为浅灰色 */
            font-size: 12px;
            margin-left: 5px;
        }

        .comment-content {
            color: white; /* 评论内容文字颜色设为白色 */
            line-height: 1.5;
            margin-left: 38px;
            font-size: 14px;
        }

        .comment-actions {
            margin-top: 8px;
            margin-left: 38px;
            text-align: right;
        }

        .delete-comment-btn {
            padding: 4px 8px;
            background: none;
            border: 1px solid #ff4d4d;
            color: #ff4d4d;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }

        .delete-comment-btn:hover {
            background-color: #ff4d4d;
            color: white;
        }

        .no-comments {
            text-align: center;
            padding: 20px;
            color: #ccc; /* 无评论提示文字颜色设为浅灰色 */
            font-style: italic;
            font-size: 14px;
        }

        .loading-comments {
            text-align: center;
            padding: 20px;
            color: #ccc; /* 加载提示文字颜色设为浅灰色 */
            font-size: 14px;
        }

        .comment-input-section textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid rgba(221, 221, 221, 0.5); /* 半透明边框 */
            border-radius: 6px;
            min-height: 80px;
            margin-bottom: 10px;
            font-family: Arial, sans-serif;
            resize: vertical;
            box-sizing: border-box;
            background: rgba(255, 255, 255, 0.7); /* 半透明背景 */
            backdrop-filter: blur(10px); /* 模糊效果 */
            -webkit-backdrop-filter: blur(10px); /* Safari兼容 */
            color: white; /* 输入框文字颜色设为白色 */
        }

        .submit-comment-btn {
            padding: 10px 20px;
            background-color: rgba(30, 144, 255, 0.8); /* 半透明背景 */
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            font-size: 16px;
            font-weight: bold;
            transition: background-color 0.3s;
            backdrop-filter: blur(10px); /* 模糊效果 */
            -webkit-backdrop-filter: blur(10px); /* Safari兼容 */
        }

        .submit-comment-btn:hover {
            background-color: rgba(0, 102, 204, 0.8); /* 半透明背景 */
        }

        .login-prompt {
            text-align: center;
            padding: 10px;
            background: rgba(232, 244, 255, 0.7); /* 半透明背景 */
            border-radius: 6px;
            margin: 10px 0;
            font-size: 14px;
            backdrop-filter: blur(10px); /* 模糊效果 */
            -webkit-backdrop-filter: blur(10px); /* Safari兼容 */
            color: white; /* 登录提示文字颜色设为白色 */
        }

        .login-prompt a {
            color: rgba(30, 144, 255, 0.9); /* 半透明颜色 */
            font-weight: bold;
            text-decoration: none;
        }

        .login-prompt a:hover {
            text-decoration: underline;
        }

        /* 移动端优化 */
        @media (max-width: 768px) {
            .modal-content.floating-window {
                width: 95%;
                max-height: 90vh;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
            
            .modal-header h3 {
                font-size: 14px;
            }
            
            .comment-user {
                font-size: 13px;
            }
            
            .comment-time {
                font-size: 11px;
            }
            
            .comment-content {
                font-size: 13px;
            }
            
            .comment-input-section textarea {
                min-height: 60px;
                padding: 8px;
            }
            
            .submit-comment-btn {
                padding: 8px 16px;
                font-size: 14px;
            }
        }

        @media (max-width: 480px) {
            .modal-content.floating-window {
                width: 98%;
                max-height: 95vh;
                margin: 0 2px;
            }
            
            .modal-header {
                padding: 12px 15px;
            }
            
            .modal-body {
                padding: 10px;
                max-height: calc(95vh - 160px);
            }
            
            .modal-footer {
                padding: 10px;
            }
            
            .comment-item {
                padding: 10px 0;
            }
            
            .comment-avatar, .default-comment-avatar {
                width: 28px;
                height: 28px;
                font-size: 14px;
            }
            
            .comment-content {
                margin-left: 36px;
            }
            
            .comment-actions {
                margin-left: 36px;
            }
        }
    `;

    document.head.appendChild(style);
}

// 初始化图片点击事件
function initImageComments() {
    loadCurrentUser();

    // 为所有图片添加点击事件
    document.addEventListener('click', function(event) {
        if (event.target.tagName === 'IMG' && event.target.closest('.image-item')) {
            const imageItem = event.target.closest('.image-item');
            const img = imageItem.querySelector('img');
            const imagePath = img.getAttribute('data-url');
            const imageName = img.getAttribute('data-filename');
            
            if (imagePath) {
                event.preventDefault();
                showCommentsModal(imagePath, imageName || imagePath.split('/').pop());
            }
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    addGlassStyle(); // 添加玻璃质感样式
    initImageComments();
});

// 全局函数，供HTML调用
window.deleteComment = deleteComment;