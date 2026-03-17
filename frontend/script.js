// ========== 全局配置 ==========
// API_BASE 从 config.js 引入
// 注意：需要在 index.html 中先引入 config.js，再引入 script.js
const API_BASE = typeof API_BASE !== 'undefined' ? API_BASE : '';

// ========== 自定义消息提示 ==========
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('customToast');
    toast.textContent = message;
    toast.className = `custom-toast toast-${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.textContent = '';
        }, 300);
    }, duration);
}

// ========== 自定义确认框 ==========
function showConfirm(title, isInput = false, callback) {
    const confirmBox = document.getElementById('customConfirm');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmInput = document.getElementById('confirmInput');
    const confirmOk = document.getElementById('confirmOk');
    const confirmCancel = document.getElementById('confirmCancel');
    
    confirmTitle.textContent = title;
    confirmInput.style.display = isInput ? 'block' : 'none';
    confirmInput.value = '';
    
    confirmBox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    const okHandler = () => {
        const inputValue = confirmInput.value.trim();
        callback(true, isInput ? inputValue : '');
        confirmBox.style.display = 'none';
        document.body.style.overflow = 'auto';
        confirmOk.removeEventListener('click', okHandler);
        confirmCancel.removeEventListener('click', cancelHandler);
    };
    
    const cancelHandler = () => {
        callback(false, '');
        confirmBox.style.display = 'none';
        document.body.style.overflow = 'auto';
        confirmOk.removeEventListener('click', okHandler);
        confirmCancel.removeEventListener('click', cancelHandler);
    };
    
    confirmOk.addEventListener('click', okHandler);
    confirmCancel.addEventListener('click', cancelHandler);
    
    confirmBox.addEventListener('click', (e) => {
        if (e.target === confirmBox) {
            cancelHandler();
        }
    });
}

// ========== 工具函数 ==========
const utils = {
    // 获取存储的 token
    getToken: () => localStorage.getItem('token'),
    
    // 获取当前登录用户信息
    getCurrentUser: () => JSON.parse(localStorage.getItem('currentUser')),
    
    // 设置当前用户
    setCurrentUser: (user) => localStorage.setItem('currentUser', JSON.stringify(user)),
    
    // 保存 token
    setToken: (token) => localStorage.setItem('token', token),
    
    // 清除登录状态
    clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
    },
    
    // 检查是否已登录
    isLoggedIn: () => !!utils.getToken(),
    
    // 检查是否为管理员（含所有者）
    isAdmin: () => {
        const user = utils.getCurrentUser();
        return user && (user.role === 'admin' || user.role === 'owner');
    },
    
    // 检查是否为所有者
    isOwner: () => {
        const user = utils.getCurrentUser();
        return user && user.role === 'owner';
    },
    
    // 格式化时间
    formatTime: (date) => new Date(date).toLocaleString(),
    
    // 发起带认证的 fetch 请求
    fetchWithAuth: async (url, options = {}) => {
        const token = utils.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(API_BASE + url, {
            ...options,
            headers
        });
        return response;
    }
};

// ========== 模态框控制 ==========
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ========== 检查登录状态并更新UI ==========
function checkLoginStatus() {
    const currentUser = utils.getCurrentUser();
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    
    if (currentUser) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        document.getElementById('user-avatar').textContent = currentUser.avatar || currentUser.username.charAt(0).toUpperCase();
        document.getElementById('user-name').textContent = currentUser.username;
        
        // 更新未读消息数（暂不实现，后续分支添加）
        // utils.updateUnreadCount();
    } else {
        authButtons.style.display = 'block';
        userProfile.style.display = 'none';
    }
}

// ========== 登录功能 ==========
async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorEl = document.getElementById('login-error');
    
    errorEl.style.display = 'none';
    
    if (!username || !password) {
        errorEl.textContent = '用户名和密码不能为空！';
        errorEl.style.display = 'block';
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || '登录失败');
        }
        
        // 保存 token 和用户信息
        utils.setToken(data.token);
        utils.setCurrentUser(data.user);
        
        closeModal('login-modal');
        checkLoginStatus();
        showToast(`欢迎回来，${username}！`, 'success');
        
        // 清空输入框
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
    }
}

// ========== 注册功能 ==========
async function register() {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const errorEl = document.getElementById('register-error');
    
    errorEl.style.display = 'none';
    
    // 验证
    if (!username || !email || !password) {
        errorEl.textContent = '所有字段都不能为空！';
        errorEl.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        errorEl.textContent = '密码长度不能少于6位！';
        errorEl.style.display = 'block';
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorEl.textContent = '邮箱格式不正确！';
        errorEl.style.display = 'block';
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || '注册失败');
        }
        
        // 自动登录（注册成功后直接登录）
        utils.setToken(data.token);
        utils.setCurrentUser(data.user);
        
        closeModal('register-modal');
        checkLoginStatus();
        showToast(`注册成功！欢迎 ${username}`, 'success');
        
        // 清空输入框
        document.getElementById('register-username').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
    }
}

// ========== 退出登录 ==========
function logout() {
    showConfirm('确定要退出登录吗？', false, (confirmed) => {
        if (confirmed) {
            utils.clearAuth();
            checkLoginStatus();
            showToast('已退出登录！', 'info');
        }
    });
}

// ========== 渲染帖子列表（暂用模拟数据，后续分支对接真实API）==========
// 注意：在 step-2-user 中，帖子功能尚未对接后端，所以暂时使用 localStorage 模拟数据，
// 以免影响其他功能的演示。但登录/注册已经对接后端。
// 这里保留原有的 renderPosts 函数，但将其数据源改为 localStorage（兼容之前的数据结构）
function renderPosts() {
    // 从 localStorage 获取帖子数据（兼容之前版本）
    let posts = JSON.parse(localStorage.getItem('posts')) || [];
    const postList = document.getElementById('post-list');
    const currentUser = utils.getCurrentUser();
    
    postList.innerHTML = '';
    
    // 过滤掉被封禁的帖子（管理员可以看到）
    const visiblePosts = currentUser && utils.isAdmin() 
        ? posts 
        : posts.filter(post => !post.isBanned);
    
    visiblePosts.forEach(post => {
        const isLiked = currentUser && currentUser.likedPosts && currentUser.likedPosts.includes(post.id);
        
        const postItem = document.createElement('div');
        postItem.className = 'post-item';
        postItem.dataset.id = post.id;
        postItem.innerHTML = `
            <div class="avatar">${post.author.charAt(0)}</div>
            <div class="post-content">
                <div class="post-title">${post.title}</div>
                <div class="post-desc">${post.content}</div>
                <div class="post-meta">
                    <span>发布者: ${post.author} · ${post.time}</span>
                    <span class="tags">#${post.tags.join(' #')}</span>
                </div>
                <div class="post-actions">
                    <span class="like-btn ${isLiked ? 'liked' : ''}">
                        <i class="bi bi-heart${isLiked ? '-fill' : ''}"></i> ${post.likes}
                    </span>
                    <span>
                        <i class="bi bi-chat"></i> ${post.comments ? post.comments.length : 0}
                    </span>
                </div>
            </div>
        `;
        
        postList.appendChild(postItem);
        
        // 帖子点击事件
        postItem.addEventListener('click', (e) => {
            if (!e.target.closest('.like-btn')) {
                openPostDetail(post.id);
            }
        });
        
        // 帖子点赞事件（暂用 localStorage 模拟）
        const likeBtn = postItem.querySelector('.like-btn');
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePostLike(post.id);
        });
    });
}

// ========== 切换帖子点赞（模拟）==========
function togglePostLike(postId) {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) {
        showToast('请先登录！', 'warning');
        openModal('login-modal');
        return;
    }
    
    // 从 localStorage 获取数据
    let posts = JSON.parse(localStorage.getItem('posts')) || [];
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    const postIndex = posts.findIndex(post => post.id === postId);
    if (postIndex === -1) return;
    
    const userIndex = users.findIndex(user => user.username === currentUser.username);
    if (userIndex === -1) return;
    
    // 检查是否已点赞
    const isLiked = currentUser.likedPosts && currentUser.likedPosts.includes(postId);
    
    if (isLiked) {
        posts[postIndex].likes--;
        users[userIndex].likedPosts = users[userIndex].likedPosts.filter(id => id !== postId);
        showToast('已取消点赞', 'info');
    } else {
        posts[postIndex].likes++;
        if (!users[userIndex].likedPosts) users[userIndex].likedPosts = [];
        users[userIndex].likedPosts.push(postId);
        showToast('点赞成功', 'success');
    }
    
    // 保存回 localStorage
    localStorage.setItem('posts', JSON.stringify(posts));
    localStorage.setItem('users', JSON.stringify(users));
    
    // 更新当前用户信息
    currentUser.likedPosts = users[userIndex].likedPosts;
    utils.setCurrentUser(currentUser);
    
    // 重新渲染
    renderPosts();
}

// ========== 打开帖子详情（暂用模拟）==========
function openPostDetail(postId) {
    const posts = JSON.parse(localStorage.getItem('posts')) || [];
    const post = posts.find(post => post.id === postId);
    if (!post) return;
    
    const currentUser = utils.getCurrentUser();
    const isLiked = currentUser && currentUser.likedPosts && currentUser.likedPosts.includes(postId);
    const isCollected = currentUser && currentUser.collections && currentUser.collections.includes(postId);
    
    document.getElementById('detail-title').textContent = post.title;
    document.getElementById('detail-author').textContent = `发布者: ${post.author}`;
    document.getElementById('detail-time').textContent = `发布时间: ${post.time}`;
    document.getElementById('detail-content').innerHTML = marked.parse(post.content);
    document.getElementById('like-count').textContent = post.likes;
    
    const likeBtn = document.getElementById('like-post');
    const collectBtn = document.getElementById('collect-post');
    
    likeBtn.className = `post-detail-action-btn ${isLiked ? 'liked' : ''}`;
    likeBtn.innerHTML = `<i class="bi bi-heart${isLiked ? '-fill' : ''}"></i> 点赞 (<span id="like-count">${post.likes}</span>)`;
    
    collectBtn.className = `post-detail-action-btn ${isCollected ? 'collected' : ''}`;
    collectBtn.innerHTML = `<i class="bi bi-star${isCollected ? '-fill' : ''}"></i> ${isCollected ? '已收藏' : '收藏'}`;
    
    const adminActions = document.getElementById('admin-actions');
    adminActions.style.display = (currentUser && utils.isAdmin()) ? 'inline-flex' : 'none';
    
    renderComments(postId);
    openModal('post-detail-modal');
    bindPostDetailEvents(postId);
}

// ========== 渲染评论（模拟）==========
function renderComments(postId) {
    const posts = JSON.parse(localStorage.getItem('posts')) || [];
    const post = posts.find(post => post.id === postId);
    if (!post || !post.comments) return;
    
    const commentList = document.getElementById('comment-list');
    const currentUser = utils.getCurrentUser();
    
    commentList.innerHTML = '';
    
    post.comments.forEach(comment => {
        const isLiked = currentUser && currentUser.likedComments && currentUser.likedComments.includes(comment.id);
        
        const commentItem = document.createElement('div');
        commentItem.className = 'comment-item';
        commentItem.dataset.id = comment.id;
        commentItem.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-time">${comment.time}</span>
            </div>
            <div class="comment-content">${marked.parse(comment.content)}</div>
            <div class="comment-actions">
                <span class="comment-action like-comment ${isLiked ? 'liked' : ''}" data-id="${comment.id}">
                    <i class="bi bi-heart${isLiked ? '-fill' : ''}"></i> 点赞 (${comment.likes || 0})
                </span>
                <span class="comment-action report-comment" data-id="${comment.id}">
                    <i class="bi bi-flag"></i> 举报
                </span>
            </div>
        `;
        
        commentList.appendChild(commentItem);
        
        const likeBtn = commentItem.querySelector('.like-comment');
        likeBtn.addEventListener('click', () => {
            toggleCommentLike(postId, comment.id);
        });
        
        const reportBtn = commentItem.querySelector('.report-comment');
        reportBtn.addEventListener('click', () => {
            openReportModal('comment', postId, comment.id);
        });
    });
}

// ========== 切换评论点赞（模拟）==========
function toggleCommentLike(postId, commentId) {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) {
        showToast('请先登录！', 'warning');
        openModal('login-modal');
        return;
    }
    
    let posts = JSON.parse(localStorage.getItem('posts')) || [];
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    const postIndex = posts.findIndex(post => post.id === postId);
    if (postIndex === -1) return;
    
    const commentIndex = posts[postIndex].comments.findIndex(comment => comment.id === commentId);
    if (commentIndex === -1) return;
    
    const userIndex = users.findIndex(user => user.username === currentUser.username);
    if (userIndex === -1) return;
    
    const isLiked = currentUser.likedComments && currentUser.likedComments.includes(commentId);
    
    if (isLiked) {
        posts[postIndex].comments[commentIndex].likes = (posts[postIndex].comments[commentIndex].likes || 1) - 1;
        users[userIndex].likedComments = users[userIndex].likedComments.filter(id => id !== commentId);
        showToast('已取消评论点赞', 'info');
    } else {
        posts[postIndex].comments[commentIndex].likes = (posts[postIndex].comments[commentIndex].likes || 0) + 1;
        if (!users[userIndex].likedComments) users[userIndex].likedComments = [];
        users[userIndex].likedComments.push(commentId);
        showToast('评论点赞成功', 'success');
    }
    
    localStorage.setItem('posts', JSON.stringify(posts));
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser.likedComments = users[userIndex].likedComments;
    utils.setCurrentUser(currentUser);
    
    renderComments(postId);
}

// ========== 绑定帖子详情事件 ==========
function bindPostDetailEvents(postId) {
    const currentUser = utils.getCurrentUser();
    
    document.getElementById('like-post').addEventListener('click', () => {
        togglePostLike(postId);
        const post = JSON.parse(localStorage.getItem('posts')).find(p => p.id === postId);
        document.getElementById('like-count').textContent = post.likes;
        const isLiked = currentUser && currentUser.likedPosts && currentUser.likedPosts.includes(postId);
        document.getElementById('like-post').innerHTML = `<i class="bi bi-heart${isLiked ? '-fill' : ''}"></i> 点赞 (<span id="like-count">${post.likes}</span>)`;
    });
    
    document.getElementById('collect-post').addEventListener('click', () => {
        if (!currentUser) {
            showToast('请先登录！', 'warning');
            openModal('login-modal');
            return;
        }
        
        let users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(user => user.username === currentUser.username);
        if (userIndex === -1) return;
        
        const isCollected = currentUser.collections && currentUser.collections.includes(postId);
        
        if (isCollected) {
            users[userIndex].collections = users[userIndex].collections.filter(id => id !== postId);
            showToast('已取消收藏！', 'info');
        } else {
            if (!users[userIndex].collections) users[userIndex].collections = [];
            users[userIndex].collections.push(postId);
            showToast('收藏成功！', 'success');
        }
        
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser.collections = users[userIndex].collections;
        utils.setCurrentUser(currentUser);
        
        const collectBtn = document.getElementById('collect-post');
        const newIsCollected = currentUser.collections && currentUser.collections.includes(postId);
        collectBtn.className = `post-detail-action-btn ${newIsCollected ? 'collected' : ''}`;
        collectBtn.innerHTML = `<i class="bi bi-star${newIsCollected ? '-fill' : ''}"></i> ${newIsCollected ? '已收藏' : '收藏'}`;
    });
    
    document.getElementById('report-post').addEventListener('click', () => {
        openReportModal('post', postId);
    });
    
    document.getElementById('submit-comment').addEventListener('click', () => {
        submitComment(postId);
    });
    
    document.getElementById('ban-post').addEventListener('click', () => {
        showConfirm('确定要封禁这个帖子吗？', false, (confirmed) => {
            if (confirmed) {
                let posts = JSON.parse(localStorage.getItem('posts')) || [];
                const postIndex = posts.findIndex(post => post.id === postId);
                posts[postIndex].isBanned = !posts[postIndex].isBanned;
                localStorage.setItem('posts', JSON.stringify(posts));
                
                addSystemMessage(posts[postIndex].author, `你的帖子《${posts[postIndex].title}》已被${posts[postIndex].isBanned ? '封禁' : '解封'}`);
                
                showToast(`帖子已${posts[postIndex].isBanned ? '封禁' : '解封'}！`, 'success');
                closeModal('post-detail-modal');
                renderPosts();
            }
        });
    });
    
    document.getElementById('ban-user').addEventListener('click', () => {
        const post = JSON.parse(localStorage.getItem('posts')).find(p => p.id === postId);
        showConfirm(`确定要封禁用户 ${post.author} 吗？`, false, (confirmed) => {
            if (confirmed) {
                addSystemMessage(post.author, '你的账号已被管理员封禁，请联系客服解决');
                showToast(`用户 ${post.author} 已被封禁！`, 'success');
            }
        });
    });
    
    document.getElementById('change-category').addEventListener('click', () => {
        showConfirm('请输入新的分类标签（用逗号分隔）：', true, (confirmed, inputValue) => {
            if (confirmed && inputValue) {
                let posts = JSON.parse(localStorage.getItem('posts')) || [];
                const postIndex = posts.findIndex(post => post.id === postId);
                posts[postIndex].tags = inputValue.split(',').map(tag => tag.trim());
                localStorage.setItem('posts', JSON.stringify(posts));
                
                showToast('分类修改成功！', 'success');
                openPostDetail(postId);
            } else if (confirmed && !inputValue) {
                showToast('分类标签不能为空！', 'error');
            }
        });
    });
}

// ========== 提交评论（模拟）==========
function submitComment(postId) {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) {
        showToast('请先登录！', 'warning');
        openModal('login-modal');
        return;
    }
    
    const commentContent = document.getElementById('comment-input').value.trim();
    if (!commentContent) {
        showToast('评论内容不能为空！', 'error');
        return;
    }
    
    let posts = JSON.parse(localStorage.getItem('posts')) || [];
    const postIndex = posts.findIndex(post => post.id === postId);
    if (postIndex === -1) return;
    
    // 生成新评论ID
    let maxId = 0;
    posts.forEach(post => {
        if (post.comments) {
            post.comments.forEach(comment => {
                if (comment.id > maxId) maxId = comment.id;
            });
        }
    });
    const newId = maxId + 1;
    
    const newComment = {
        id: newId,
        author: currentUser.username,
        content: commentContent,
        time: new Date().toLocaleString(),
        likes: 0,
        isBanned: false
    };
    
    if (!posts[postIndex].comments) posts[postIndex].comments = [];
    posts[postIndex].comments.push(newComment);
    
    localStorage.setItem('posts', JSON.stringify(posts));
    
    document.getElementById('comment-input').value = '';
    renderComments(postId);
    
    addSystemMessage(posts[postIndex].author, `你的帖子《${posts[postIndex].title}》有新的评论`);
    showToast('评论发布成功！', 'success');
}

// ========== 打开举报模态框 ==========
function openReportModal(type, targetId, commentId) {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) {
        showToast('请先登录！', 'warning');
        openModal('login-modal');
        return;
    }
    
    document.getElementById('report-modal').dataset.type = type;
    document.getElementById('report-modal').dataset.targetId = targetId;
    if (commentId) {
        document.getElementById('report-modal').dataset.commentId = commentId;
    }
    
    document.getElementById('report-reason').value = '';
    document.getElementById('report-error').style.display = 'none';
    
    openModal('report-modal');
}

// ========== 提交举报 ==========
function submitReport() {
    const reason = document.getElementById('report-reason').value.trim();
    if (!reason) {
        document.getElementById('report-error').textContent = '举报原因不能为空！';
        document.getElementById('report-error').style.display = 'block';
        return;
    }
    
    const modal = document.getElementById('report-modal');
    const type = modal.dataset.type;
    const targetId = parseInt(modal.dataset.targetId);
    const commentId = modal.dataset.commentId ? parseInt(modal.dataset.commentId) : null;
    
    const currentUser = utils.getCurrentUser();
    let posts = JSON.parse(localStorage.getItem('posts')) || [];
    
    let targetTitle = '';
    if (type === 'post') {
        const post = posts.find(p => p.id === targetId);
        targetTitle = post.title;
        if (!post.reports) post.reports = [];
        post.reports.push({
            id: Date.now(),
            reporter: currentUser.username,
            reason: reason,
            time: new Date().toLocaleString(),
            isProcessed: false
        });
        localStorage.setItem('posts', JSON.stringify(posts));
    } else if (type === 'comment') {
        const post = posts.find(p => p.id === targetId);
        const comment = post.comments.find(c => c.id === commentId);
        targetTitle = `评论(${comment.author}): ${comment.content.substring(0, 20)}...`;
    }
    
    // 添加举报消息（模拟）
    addReportMessage({
        id: Date.now(),
        subject: `新的举报 - ${type === 'post' ? '帖子' : '评论'}`,
        content: `举报人：${currentUser.username}\n举报对象：${targetTitle}\n举报原因：${reason}`,
        time: new Date().toLocaleString(),
        isRead: false,
        targetType: type,
        targetId: targetId,
        commentId: commentId
    });
    
    closeModal('report-modal');
    showToast('举报提交成功！管理员会尽快处理。', 'success');
    addSystemMessage(currentUser.username, '你的举报已提交，管理员会尽快处理，感谢你的反馈！');
}

// ========== 添加系统消息（模拟）==========
function addSystemMessage(username, content) {
    let messages = JSON.parse(localStorage.getItem('messages')) || { system: [], user: [], report: [] };
    const newMsg = {
        id: Date.now(),
        subject: '系统通知',
        content: content,
        time: new Date().toLocaleString(),
        isRead: false
    };
    
    messages.system.push(newMsg);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    // 更新未读消息数（简化处理）
    if (utils.getCurrentUser() && utils.getCurrentUser().username === username) {
        // utils.updateUnreadCount(); // 暂不实现
    }
}

// ========== 添加举报消息（模拟）==========
function addReportMessage(msg) {
    let messages = JSON.parse(localStorage.getItem('messages')) || { system: [], user: [], report: [] };
    if (!messages.report) messages.report = [];
    messages.report.push(msg);
    localStorage.setItem('messages', JSON.stringify(messages));
}

// ========== 打开消息中心 ==========
function openMessages() {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) {
        showToast('请先登录！', 'warning');
        openModal('login-modal');
        return;
    }
    
    const reportTab = document.getElementById('report-tab');
    reportTab.style.display = currentUser.role === 'admin' || currentUser.role === 'owner' ? 'block' : 'none';
    
    renderMessages('system');
    openModal('messages-modal');
}

// ========== 渲染消息 ==========
function renderMessages(tabType) {
    const messages = JSON.parse(localStorage.getItem('messages')) || { system: [], user: [], report: [] };
    const msgContent = document.getElementById('msg-content');
    const currentUser = utils.getCurrentUser();
    
    document.querySelectorAll('.msg-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabType);
    });
    
    let msgs = messages[tabType] || [];
    
    if (tabType === 'report' && !utils.isAdmin()) {
        msgs = [];
    }
    
    msgs = msgs.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    msgContent.innerHTML = '';
    
    if (msgs.length === 0) {
        msgContent.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-light);">暂无消息</div>';
        return;
    }
    
    msgs.forEach(msg => {
        const msgItem = document.createElement('div');
        msgItem.className = `msg-item ${msg.isRead ? '' : 'unread'}`;
        msgItem.dataset.id = msg.id;
        msgItem.innerHTML = `
            <div class="msg-avatar">${msg.subject.charAt(0)}</div>
            <div class="msg-body">
                <div class="msg-subject">${msg.subject}</div>
                <div class="msg-text">${msg.content}</div>
                <div class="msg-time">${msg.time}</div>
                ${utils.isAdmin() && tabType === 'report' ? `
                    <div class="admin-actions">
                        <button class="btn btn-primary btn-sm process-report" data-id="${msg.targetId}" data-comment-id="${msg.commentId || ''}">处理</button>
                        <button class="btn btn-secondary btn-sm mark-read" data-id="${msg.id}">标为已读</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        msgContent.appendChild(msgItem);
        
        msgItem.addEventListener('click', () => {
            if (!msg.isRead) {
                msg.isRead = true;
                localStorage.setItem('messages', JSON.stringify(messages));
                msgItem.classList.remove('unread');
                // utils.updateUnreadCount();
            }
        });
        
        if (utils.isAdmin() && tabType === 'report') {
            const processBtn = msgItem.querySelector('.process-report');
            if (processBtn) {
                processBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetId = parseInt(processBtn.dataset.id);
                    const commentId = processBtn.dataset.commentId ? parseInt(processBtn.dataset.commentId) : null;
                    
                    msg.isProcessed = true;
                    localStorage.setItem('messages', JSON.stringify(messages));
                    
                    showConfirm('请输入处理结果（例如：已封禁/已警告/不予处理）：', true, (confirmed, action) => {
                        if (confirmed && action) {
                            addSystemMessage(msg.reporter || '未知用户', `你举报的${msg.targetType === 'post' ? '帖子' : '评论'}已处理，处理结果：${action}`);
                            showToast('举报已处理！', 'success');
                            renderMessages('report');
                        } else if (confirmed && !action) {
                            showToast('处理结果不能为空！', 'error');
                        }
                    });
                });
            }
            
            const markReadBtn = msgItem.querySelector('.mark-read');
            if (markReadBtn) {
                markReadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    msg.isRead = true;
                    localStorage.setItem('messages', JSON.stringify(messages));
                    msgItem.classList.remove('unread');
                    showToast('已标记为已读！', 'success');
                });
            }
        }
    });
}

// ========== 初始化 Markdown 预览 ==========
function initMarkdownPreview() {
    const editorTextarea = document.getElementById('post-content');
    const previewArea = document.getElementById('editor-preview');
    
    if (!editorTextarea || !previewArea) return;
    
    editorTextarea.addEventListener('input', () => {
        previewArea.innerHTML = marked.parse(editorTextarea.value);
    });
    
    document.querySelectorAll('.editor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const textarea = editorTextarea;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end);
            
            switch(action) {
                case 'bold':
                    textarea.value = textarea.value.substring(0, start) + `**${selectedText || '粗体文本'}**` + textarea.value.substring(end);
                    break;
                case 'italic':
                    textarea.value = textarea.value.substring(0, start) + `*${selectedText || '斜体文本'}*` + textarea.value.substring(end);
                    break;
                case 'strikethrough':
                    textarea.value = textarea.value.substring(0, start) + `~~${selectedText || '删除线文本'}~~` + textarea.value.substring(end);
                    break;
                case 'heading':
                    textarea.value = textarea.value.substring(0, start) + `## ${selectedText || '标题文本'}` + textarea.value.substring(end);
                    break;
                case 'list':
                    textarea.value = textarea.value.substring(0, start) + `- ${selectedText || '列表项'}` + textarea.value.substring(end);
                    break;
                case 'code':
                    textarea.value = textarea.value.substring(0, start) + "```\n" + (selectedText || '代码内容') + "\n```" + textarea.value.substring(end);
                    break;
                case 'quote':
                    textarea.value = textarea.value.substring(0, start) + `> ${selectedText || '引用文本'}` + textarea.value.substring(end);
                    break;
                case 'link':
                    textarea.value = textarea.value.substring(0, start) + `[${selectedText || '链接文本'}](https://)` + textarea.value.substring(end);
                    break;
                case 'image':
                    textarea.value = textarea.value.substring(0, start) + `![${selectedText || '图片描述'}](https://)` + textarea.value.substring(end);
                    break;
            }
            
            previewArea.innerHTML = marked.parse(textarea.value);
            textarea.focus();
        });
    });
}

// ========== 发布新帖子（模拟）==========
function publishPost() {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) {
        showToast('请先登录！', 'warning');
        openModal('login-modal');
        return;
    }
    
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const tags = document.getElementById('post-tags').value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
    
    const errorEl = document.getElementById('editor-error');
    errorEl.style.display = 'none';
    
    if (!title) {
        errorEl.textContent = '帖子标题不能为空！';
        errorEl.style.display = 'block';
        return;
    }
    
    if (!content) {
        errorEl.textContent = '帖子内容不能为空！';
        errorEl.style.display = 'block';
        return;
    }
    
    let posts = JSON.parse(localStorage.getItem('posts')) || [];
    let maxId = 0;
    posts.forEach(post => { if (post.id > maxId) maxId = post.id; });
    
    const newPost = {
        id: maxId + 1,
        title: title,
        content: content,
        author: currentUser.username,
        time: new Date().toLocaleString(),
        tags: tags.length > 0 ? tags : ['未分类'],
        likes: 0,
        comments: [],
        reports: [],
        isBanned: false
    };
    
    posts.unshift(newPost);
    localStorage.setItem('posts', JSON.stringify(posts));
    
    document.getElementById('post-title').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('post-tags').value = '';
    document.getElementById('editor-preview').innerHTML = '';
    
    closeModal('editor-modal');
    renderPosts();
    // updateStats(); // 暂不实现
    
    addSystemMessage(currentUser.username, `你的帖子《${title}》发布成功！`);
    showToast('帖子发布成功！', 'success');
}

// ========== 初始化页面数据 ==========
function initData() {
    // 初始化 localStorage 数据（兼容原有模拟数据）
    if (!localStorage.getItem('users')) {
        const adminUser = {
            username: 'Submerge',
            password: 'syhnqqsjx1019',
            email: 'admin@example.com',
            role: 'owner',
            avatar: 'S',
            collections: [],
            likedPosts: [],
            likedComments: []
        };
        localStorage.setItem('users', JSON.stringify([adminUser]));
    }
    
    if (!localStorage.getItem('posts')) {
        const defaultPosts = [
            {
                id: 1,
                title: '这个讨论区的橙色主题太好看了，和 boyacoding.cn 一模一样！',
                content: `# 讨论区主题分享\n\n这个橙色主题真的太好看了，分享一下实现思路：\n\n1. 使用CSS变量定义主题色\n\`\`\`css\n:root {\n    --main-color: #ff7c24;\n    --main-hover: #ff6a00;\n}\n\`\`\`\n\n2. 按钮和高亮元素使用主题色\n3. 悬停效果增强交互体验\n\n希望对大家有帮助！`,
                author: 'Submerge',
                time: new Date().toLocaleString(),
                tags: ['主题分享', '前端'],
                likes: 12,
                comments: [],
                reports: [],
                isBanned: false
            },
            {
                id: 2,
                title: '求推荐好用的前端开发工具',
                content: `## 前端开发工具求助\n\n最近在做静态页面开发，想找一些高效的编辑器和插件，大家有什么好的推荐吗？\n\n### 我目前在用的：\n- VS Code\n- Chrome开发者工具\n- PostCSS\n\n希望能找到更多提升效率的工具！`,
                author: '路人甲',
                time: new Date(Date.now() - 600000).toLocaleString(),
                tags: ['工具推荐', '开发'],
                likes: 8,
                comments: [],
                reports: [],
                isBanned: false
            },
            {
                id: 3,
                title: 'HTML+CSS零基础入门学习路线',
                content: `# HTML+CSS零基础学习路线\n\n零基础想入门前端，从HTML和CSS开始，分享一下我的学习路线：\n\n### 阶段1：基础语法\n- HTML标签学习\n- CSS选择器和样式\n- 盒模型理解\n\n### 阶段2：实战练习\n- 简单页面布局\n- 响应式设计\n- 常见组件实现\n\n### 阶段3：进阶提升\n- Flex/Grid布局\n- CSS动画\n- 预处理器\n\n有没有更好的学习资源推荐？`,
                author: '编程小白',
                time: new Date(Date.now() - 1800000).toLocaleString(),
                tags: ['学习路线', '零基础'],
                likes: 15,
                comments: [],
                reports: [],
                isBanned: false
            }
        ];
        localStorage.setItem('posts', JSON.stringify(defaultPosts));
    }
    
    if (!localStorage.getItem('messages')) {
        const defaultMessages = {
            system: [
                {
                    id: 1,
                    subject: '欢迎加入讨论区',
                    content: '感谢你注册并使用Submerge讨论区，祝你使用愉快！',
                    time: new Date().toLocaleString(),
                    isRead: false
                }
            ],
            user: [],
            report: []
        };
        localStorage.setItem('messages', JSON.stringify(defaultMessages));
    }
}

// ========== 绑定事件 ==========
function bindEvents() {
    document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));
    document.getElementById('register-btn').addEventListener('click', () => openModal('register-modal'));
    
    document.getElementById('login-close').addEventListener('click', () => closeModal('login-modal'));
    document.getElementById('login-cancel').addEventListener('click', () => closeModal('login-modal'));
    document.getElementById('register-close').addEventListener('click', () => closeModal('register-modal'));
    document.getElementById('register-cancel').addEventListener('click', () => closeModal('register-modal'));
    document.getElementById('editor-close').addEventListener('click', () => closeModal('editor-modal'));
    document.getElementById('editor-cancel').addEventListener('click', () => closeModal('editor-modal'));
    document.getElementById('post-detail-close').addEventListener('click', () => closeModal('post-detail-modal'));
    document.getElementById('post-detail-cancel').addEventListener('click', () => closeModal('post-detail-modal'));
    document.getElementById('report-close').addEventListener('click', () => closeModal('report-modal'));
    document.getElementById('report-cancel').addEventListener('click', () => closeModal('report-modal'));
    document.getElementById('messages-close').addEventListener('click', () => closeModal('messages-modal'));
    document.getElementById('messages-cancel').addEventListener('click', () => closeModal('messages-modal'));
    
    document.getElementById('login-submit').addEventListener('click', login);
    document.getElementById('register-submit').addEventListener('click', register);
    
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    document.getElementById('create-post-btn').addEventListener('click', () => {
        if (utils.isLoggedIn()) {
            openModal('editor-modal');
        } else {
            showToast('请先登录！', 'warning');
            openModal('login-modal');
        }
    });
    
    document.getElementById('editor-submit').addEventListener('click', publishPost);
    document.getElementById('report-submit').addEventListener('click', submitReport);
    document.getElementById('msg-icon').addEventListener('click', openMessages);
    
    document.querySelectorAll('.msg-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            renderMessages(tab.dataset.tab);
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// ========== 页面初始化 ==========
function initPage() {
    initData();
    renderPosts();
    checkLoginStatus();
    bindEvents();
    initMarkdownPreview();
}

// 启动
window.addEventListener('DOMContentLoaded', initPage);
