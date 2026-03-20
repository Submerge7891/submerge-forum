// ==================== 全局配置 ====================
const API_BASE = typeof API_BASE !== 'undefined' ? API_BASE : '';
let currentUser = null;
let socket = null;
let currentChatId = null;

// ==================== DOM 元素 ====================
const mainContent = document.getElementById('main-content');
const authButtons = document.getElementById('auth-buttons');
const userProfile = document.getElementById('user-profile');
const userNameSpan = document.getElementById('user-name');
const userAvatarSpan = document.getElementById('user-avatar');
const msgBadge = document.getElementById('msg-badge');
const logoutBtn = document.getElementById('logout-btn');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const createPostBtn = document.getElementById('create-post-btn');
const msgIcon = document.getElementById('msg-icon');

// ==================== 工具函数 ====================
function showToast(message, type = 'info', duration = 3000) {
    let toast = document.getElementById('customToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'customToast';
        toast.className = 'custom-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `custom-toast toast-${type}`;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.classList.add('active');
}

function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.classList.remove('active');
}

function withLoader(fn) {
    return async (...args) => {
        showLoader();
        try {
            return await fn(...args);
        } finally {
            setTimeout(() => hideLoader(), 300);
        }
    };
}

async function fetchAPI(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(API_BASE + url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || '请求失败');
    return data;
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== 用户认证 ====================
async function login(username, password) {
    try {
        const data = await fetchAPI('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        currentUser = data.user;
        checkLoginStatus();
        showToast(`欢迎回来，${username}！`, 'success');
        closeModal('login-modal');
        loadPosts();
        return true;
    } catch (err) {
        const errorEl = document.getElementById('login-error');
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        return false;
    }
}

async function register(username, email, password) {
    try {
        const data = await fetchAPI('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        currentUser = data.user;
        checkLoginStatus();
        showToast(`注册成功！欢迎 ${username}`, 'success');
        closeModal('register-modal');
        loadPosts();
        return true;
    } catch (err) {
        const errorEl = document.getElementById('register-error');
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        return false;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    currentUser = null;
    if (socket) socket.disconnect();
    checkLoginStatus();
    showToast('已退出登录', 'info');
    loadPosts();
}

function checkLoginStatus() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        userNameSpan.textContent = currentUser.username;
        userAvatarSpan.textContent = currentUser.avatar || currentUser.username.charAt(0).toUpperCase();
        initSocket();
    } else {
        currentUser = null;
        authButtons.style.display = 'block';
        userProfile.style.display = 'none';
    }
}

// ==================== Socket.IO ====================
function initSocket() {
    if (socket) socket.disconnect();
    socket = io(API_BASE);
    socket.on('connect', () => {
        console.log('Socket connected');
        if (currentUser) {
            socket.emit('user-login', currentUser.id);
        }
    });
    socket.on('online-count', (count) => {
        const onlineSpan = document.getElementById('online-count');
        if (onlineSpan) onlineSpan.innerText = count;
    });
    socket.on('new-message', (msg) => {
        showToast(`新消息：${msg.subject}`, 'info');
        updateUnreadCount();
    });
    socket.on('chat-message', (data) => {
        if (currentChatId === data.chatId) {
            renderChatMessages(data.chatId);
        } else {
            showToast('聊天有新消息', 'info');
        }
    });
    socket.on('join-request', (data) => {
        showToast(`有用户申请加入聊天`, 'info');
    });
    socket.on('request-approved', (data) => {
        showToast('你的申请已被批准', 'success');
    });
    socket.on('chat-invite', (data) => {
        showToast(`你被邀请加入聊天`, 'info');
    });
}

async function updateUnreadCount() {
    if (!currentUser) return;
    try {
        const messages = await fetchAPI('/api/messages');
        const unread = messages.filter(m => !m.isRead).length;
        msgBadge.innerText = unread;
        msgBadge.style.display = unread ? 'inline-block' : 'none';
    } catch (err) {
        console.error(err);
    }
}

// ==================== 帖子功能 ====================
async function loadPosts(page = 1, sort = 'time') {
    try {
        const data = await fetchAPI(`/api/posts?page=${page}&sort=${sort}`);
        renderPosts(data.posts);
        const totalSpan = document.getElementById('total-posts');
        if (totalSpan) totalSpan.innerText = data.total;
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderPosts(posts) {
    if (!posts.length) {
        mainContent.innerHTML = '<div class="no-posts">暂无帖子，快来发布第一个吧！</div>';
        return;
    }
    mainContent.innerHTML = posts.map(post => `
        <div class="post-item" data-id="${post._id}">
            <div class="avatar">${escapeHtml(post.author.username.charAt(0))}</div>
            <div class="post-content">
                <div class="post-title">${escapeHtml(post.title)}</div>
                <div class="post-meta">
                    <span>发布者: ${escapeHtml(post.author.username)} · ${new Date(post.time).toLocaleString()}</span>
                    <span class="tags">${post.tags.map(t => '#' + escapeHtml(t)).join(' ')}</span>
                </div>
                <div class="post-actions">
                    <span class="like-btn ${currentUser && post.likedBy && post.likedBy.includes(currentUser.id) ? 'liked' : ''}" data-id="${post._id}">
                        <i class="bi bi-heart${currentUser && post.likedBy && post.likedBy.includes(currentUser.id) ? '-fill' : ''}"></i> ${post.likes}
                    </span>
                    <span><i class="bi bi-chat"></i> ${post.comments?.length || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
    attachPostEvents();
}

function attachPostEvents() {
    document.querySelectorAll('.post-item').forEach(el => {
        el.addEventListener('click', (e) => {
            if (!e.target.closest('.like-btn')) {
                const postId = el.dataset.id;
                openPostDetail(postId);
            }
        });
    });
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!currentUser) {
                showToast('请先登录', 'warning');
                openModal('login-modal');
                return;
            }
            const postId = btn.dataset.id;
            try {
                const data = await fetchAPI(`/api/posts/${postId}/like`, { method: 'POST' });
                const likeSpan = btn;
                likeSpan.innerHTML = `<i class="bi bi-heart${data.liked ? '-fill' : ''}"></i> ${data.likes}`;
                if (data.liked) likeSpan.classList.add('liked');
                else likeSpan.classList.remove('liked');
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    });
}

async function openPostDetail(postId) {
    try {
        const post = await fetchAPI(`/api/posts/${postId}`);
        document.getElementById('detail-title').innerText = post.title;
        document.getElementById('detail-meta').innerHTML = `发布者: ${escapeHtml(post.author.username)} · ${new Date(post.time).toLocaleString()}`;
        document.getElementById('detail-content').innerHTML = marked.parse(post.content);
        document.getElementById('like-count').innerText = post.likes;
        const isLiked = currentUser && post.likedBy && post.likedBy.includes(currentUser.id);
        const likeBtn = document.getElementById('like-post-btn');
        likeBtn.innerHTML = `<i class="bi bi-heart${isLiked ? '-fill' : ''}"></i> 点赞 <span id="like-count">${post.likes}</span>`;
        if (isLiked) likeBtn.classList.add('liked');
        else likeBtn.classList.remove('liked');

        const isCollected = currentUser && currentUser.collections && currentUser.collections.includes(postId);
        const collectBtn = document.getElementById('collect-post-btn');
        collectBtn.innerHTML = `<i class="bi bi-star${isCollected ? '-fill' : ''}"></i> ${isCollected ? '已收藏' : '收藏'}`;
        if (isCollected) collectBtn.classList.add('collected');
        else collectBtn.classList.remove('collected');

        const adminActions = document.getElementById('admin-actions');
        adminActions.style.display = (currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner')) ? 'inline-flex' : 'none';

        renderComments(postId);
        openModal('post-detail-modal');
        bindPostDetailEvents(postId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function renderComments(postId) {
    const post = await fetchAPI(`/api/posts/${postId}`);
    const commentList = document.getElementById('comment-list');
    if (!post.comments || !post.comments.length) {
        commentList.innerHTML = '<div>暂无评论</div>';
        return;
    }
    commentList.innerHTML = post.comments.map(comment => `
        <div class="comment-item" data-id="${comment._id}">
            <div class="comment-header">
                <span class="comment-author">${escapeHtml(comment.author.username)}</span>
                <span class="comment-time">${new Date(comment.time).toLocaleString()}</span>
            </div>
            <div class="comment-content">${marked.parse(comment.content)}</div>
            <div class="comment-actions">
                <span class="comment-like" data-id="${comment._id}">
                    <i class="bi bi-heart${currentUser && comment.likedBy && comment.likedBy.includes(currentUser.id) ? '-fill' : ''}"></i> 点赞 (${comment.likes})
                </span>
                <span class="comment-report" data-id="${comment._id}">举报</span>
            </div>
        </div>
    `).join('');
    attachCommentEvents(postId);
}

function attachCommentEvents(postId) {
    document.querySelectorAll('.comment-like').forEach(el => {
        el.addEventListener('click', async () => {
            if (!currentUser) {
                showToast('请先登录', 'warning');
                openModal('login-modal');
                return;
            }
            const commentId = el.dataset.id;
            try {
                const data = await fetchAPI(`/api/posts/${postId}/comments/${commentId}/like`, { method: 'POST' });
                el.innerHTML = `<i class="bi bi-heart${data.liked ? '-fill' : ''}"></i> 点赞 (${data.likes})`;
                if (data.liked) el.classList.add('liked');
                else el.classList.remove('liked');
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    });
    document.querySelectorAll('.comment-report').forEach(el => {
        el.addEventListener('click', () => {
            const commentId = el.dataset.id;
            openReportModal('comment', postId, commentId);
        });
    });
}

function bindPostDetailEvents(postId) {
    const likeBtn = document.getElementById('like-post-btn');
    likeBtn.onclick = async () => {
        if (!currentUser) {
            showToast('请先登录', 'warning');
            openModal('login-modal');
            return;
        }
        try {
            const data = await fetchAPI(`/api/posts/${postId}/like`, { method: 'POST' });
            likeBtn.innerHTML = `<i class="bi bi-heart${data.liked ? '-fill' : ''}"></i> 点赞 <span id="like-count">${data.likes}</span>`;
            if (data.liked) likeBtn.classList.add('liked');
            else likeBtn.classList.remove('liked');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };
    const collectBtn = document.getElementById('collect-post-btn');
    collectBtn.onclick = async () => {
        if (!currentUser) {
            showToast('请先登录', 'warning');
            openModal('login-modal');
            return;
        }
        try {
            const data = await fetchAPI(`/api/posts/${postId}/collect`, { method: 'POST' });
            collectBtn.innerHTML = `<i class="bi bi-star${data.collected ? '-fill' : ''}"></i> ${data.collected ? '已收藏' : '收藏'}`;
            if (data.collected) collectBtn.classList.add('collected');
            else collectBtn.classList.remove('collected');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };
    const reportBtn = document.getElementById('report-post-btn');
    reportBtn.onclick = () => openReportModal('post', postId);
    const submitCommentBtn = document.getElementById('submit-comment-btn');
    submitCommentBtn.onclick = async () => {
        const content = document.getElementById('comment-input').value.trim();
        if (!content) {
            showToast('评论内容不能为空', 'error');
            return;
        }
        try {
            await fetchAPI(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
            document.getElementById('comment-input').value = '';
            await renderComments(postId);
            showToast('评论发布成功', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };
    const banPostBtn = document.getElementById('ban-post-btn');
    if (banPostBtn) {
        banPostBtn.onclick = async () => {
            const reason = prompt('请输入封禁理由：', '违规内容');
            if (reason === null) return;
            try {
                await fetchAPI(`/api/posts/${postId}/ban`, { method: 'PUT', body: JSON.stringify({ reason }) });
                showToast('操作成功', 'success');
                closeModal('post-detail-modal');
                loadPosts();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }
    const essenceBtn = document.getElementById('essence-post-btn');
    if (essenceBtn) {
        essenceBtn.onclick = async () => {
            try {
                await fetchAPI(`/api/posts/${postId}/essence`, { method: 'PUT' });
                showToast('操作成功', 'success');
                closeModal('post-detail-modal');
                loadPosts();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }
    const topBtn = document.getElementById('top-post-btn');
    if (topBtn) {
        topBtn.onclick = async () => {
            try {
                await fetchAPI(`/api/posts/${postId}/top`, { method: 'PUT' });
                showToast('操作成功', 'success');
                closeModal('post-detail-modal');
                loadPosts();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }
    const banUserBtn = document.getElementById('ban-user-btn');
    if (banUserBtn) {
        banUserBtn.onclick = async () => {
            const post = await fetchAPI(`/api/posts/${postId}`);
            const uid = post.author.uid;
            const reason = prompt('请输入封禁理由：', '违规用户');
            if (reason === null) return;
            try {
                await fetchAPI(`/api/users/${uid}/ban`, { method: 'PUT' });
                showToast('用户已封禁', 'success');
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }
}

// ==================== 发帖 ====================
function showEditorModal() {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        openModal('login-modal');
        return;
    }
    openModal('editor-modal');
    const preview = document.getElementById('editor-preview');
    const contentArea = document.getElementById('post-content');
    contentArea.oninput = () => {
        preview.innerHTML = marked.parse(contentArea.value);
    };
    const toolbarBtns = document.querySelectorAll('.editor-btn');
    toolbarBtns.forEach(btn => {
        btn.onclick = () => {
            const action = btn.dataset.action;
            const textarea = contentArea;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selected = textarea.value.substring(start, end);
            let insert = '';
            switch(action) {
                case 'bold': insert = `**${selected || '粗体文本'}**`; break;
                case 'italic': insert = `*${selected || '斜体文本'}*`; break;
                case 'strikethrough': insert = `~~${selected || '删除线文本'}~~`; break;
                case 'heading': insert = `## ${selected || '标题文本'}`; break;
                case 'list': insert = `- ${selected || '列表项'}`; break;
                case 'code': insert = `\`\`\`\n${selected || '代码内容'}\n\`\`\``; break;
                case 'quote': insert = `> ${selected || '引用文本'}`; break;
                case 'link': insert = `[${selected || '链接文本'}](https://)`; break;
                case 'image': insert = `![${selected || '图片描述'}](https://)`; break;
            }
            textarea.value = textarea.value.substring(0, start) + insert + textarea.value.substring(end);
            textarea.dispatchEvent(new Event('input'));
            textarea.focus();
        };
    });
    const submitBtn = document.getElementById('editor-submit');
    submitBtn.onclick = async () => {
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const tags = document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t);
        if (!title || !content) {
            showToast('标题和内容不能为空', 'error');
            return;
        }
        try {
            await fetchAPI('/api/posts', { method: 'POST', body: JSON.stringify({ title, content, tags }) });
            showToast('发布成功', 'success');
            closeModal('editor-modal');
            loadPosts();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };
    const cancelBtn = document.getElementById('editor-cancel');
    cancelBtn.onclick = () => closeModal('editor-modal');
    const closeBtn = document.getElementById('editor-close');
    closeBtn.onclick = () => closeModal('editor-modal');
}

// ==================== 举报 ====================
function openReportModal(type, targetId, commentId = null) {
    const modal = document.getElementById('report-modal');
    modal.dataset.type = type;
    modal.dataset.targetId = targetId;
    if (commentId) modal.dataset.commentId = commentId;
    document.getElementById('report-reason').value = '';
    document.getElementById('report-error').style.display = 'none';
    openModal('report-modal');
    const submitBtn = document.getElementById('report-submit');
    submitBtn.onclick = async () => {
        const reason = document.getElementById('report-reason').value.trim();
        if (!reason) {
            document.getElementById('report-error').textContent = '举报原因不能为空';
            document.getElementById('report-error').style.display = 'block';
            return;
        }
        const type = modal.dataset.type;
        const targetId = modal.dataset.targetId;
        const commentId = modal.dataset.commentId;
        try {
            if (type === 'post') {
                await fetchAPI(`/api/posts/${targetId}/report`, { method: 'POST', body: JSON.stringify({ reason }) });
            } else if (type === 'comment') {
                // 评论举报可类似实现，暂未单独接口，可合并为帖子举报或单独实现
                showToast('评论举报功能待完善', 'info');
                closeModal('report-modal');
                return;
            }
            showToast('举报已提交', 'success');
            closeModal('report-modal');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };
    const cancelBtn = document.getElementById('report-cancel');
    cancelBtn.onclick = () => closeModal('report-modal');
    const closeBtn = document.getElementById('report-close');
    closeBtn.onclick = () => closeModal('report-modal');
}

// ==================== 聊天功能 ====================
async function openChatList() {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        openModal('login-modal');
        return;
    }
    try {
        const chats = await fetchAPI('/api/chats');
        const contentDiv = document.getElementById('chat-list-content');
        if (!chats.length) {
            contentDiv.innerHTML = '<div>暂无聊天</div>';
        } else {
            contentDiv.innerHTML = chats.map(chat => `<div class="chat-item" data-id="${chat._id}">${escapeHtml(chat.title)}</div>`).join('');
            document.querySelectorAll('.chat-item').forEach(el => {
                el.addEventListener('click', () => openChatRoom(el.dataset.id));
            });
        }
        openModal('chat-list-modal');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function openChatRoom(chatId) {
    try {
        const chat = await fetchAPI(`/api/chats/${chatId}`);
        document.getElementById('chat-title').innerText = chat.title;
        currentChatId = chatId;
        renderChatMessages(chatId);
        openModal('chat-room-modal');
        const sendBtn = document.getElementById('send-chat-message');
        sendBtn.onclick = async () => {
            const content = document.getElementById('chat-message-input').value.trim();
            if (!content) return;
            try {
                await fetchAPI(`/api/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
                document.getElementById('chat-message-input').value = '';
                renderChatMessages(chatId);
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function renderChatMessages(chatId) {
    try {
        const chat = await fetchAPI(`/api/chats/${chatId}`);
        const container = document.getElementById('chat-messages');
        if (!chat.messages || !chat.messages.length) {
            container.innerHTML = '<div>暂无消息</div>';
            return;
        }
        container.innerHTML = chat.messages.map(msg => `
            <div class="chat-message">
                <strong>${escapeHtml(msg.author.username)}</strong> ${new Date(msg.time).toLocaleString()}<br>
                ${marked.parse(msg.content)}
                <hr>
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function createNewChat() {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        openModal('login-modal');
        return;
    }
    const title = prompt('输入聊天标题（可选）', `${currentUser.username}的聊天贴`);
    try {
        await fetchAPI('/api/chats', { method: 'POST', body: JSON.stringify({ title }) });
        showToast('聊天创建成功', 'success');
        closeModal('chat-list-modal');
        openChatList();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==================== 消息中心 ====================
async function openMessages() {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        openModal('login-modal');
        return;
    }
    try {
        const messages = await fetchAPI('/api/messages');
        const container = document.getElementById('messages-list');
        container.innerHTML = messages.map(msg => `
            <div class="msg-item ${msg.isRead ? '' : 'unread'}" data-id="${msg._id}">
                <div class="msg-avatar">${msg.subject.charAt(0)}</div>
                <div class="msg-body">
                    <div class="msg-subject">${escapeHtml(msg.subject)}</div>
                    <div class="msg-text">${escapeHtml(msg.content)}</div>
                    <div class="msg-time">${new Date(msg.time).toLocaleString()}</div>
                </div>
            </div>
        `).join('');
        document.querySelectorAll('.msg-item').forEach(el => {
            el.addEventListener('click', async () => {
                const id = el.dataset.id;
                await fetchAPI(`/api/messages/${id}/read`, { method: 'PUT' });
                el.classList.remove('unread');
                updateUnreadCount();
            });
        });
        openModal('messages-modal');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==================== 分类/搜索/精华/关于 ====================
async function loadEssence() {
    try {
        const data = await fetchAPI('/api/posts?sort=time&essence=true');
        renderPosts(data.posts);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadCategory() {
    // 简单分类页面：显示搜索框和标签列表
    mainContent.innerHTML = `
        <div class="category-box">
            <h3>分类搜索</h3>
            <input type="text" id="search-input" class="form-input" placeholder="搜索标题/内容...">
            <button id="search-btn" class="btn btn-primary">搜索</button>
            <div class="tags-group" id="search-tags"></div>
        </div>
    `;
    const tags = ['求助', '学术', '水贴', '前端', '后端', '数据库', '运维', 'AI'];
    const tagsContainer = document.getElementById('search-tags');
    tagsContainer.innerHTML = tags.map(tag => `<span class="hot-tag" data-tag="${tag}">${tag}</span>`).join('');
    document.getElementById('search-btn').onclick = async () => {
        const keyword = document.getElementById('search-input').value.trim();
        if (!keyword) return;
        try {
            const data = await fetchAPI(`/api/posts?keyword=${encodeURIComponent(keyword)}`);
            renderPosts(data.posts);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };
    document.querySelectorAll('.hot-tag').forEach(el => {
        el.addEventListener('click', async () => {
            const tag = el.dataset.tag;
            try {
                const data = await fetchAPI(`/api/posts?tag=${encodeURIComponent(tag)}`);
                renderPosts(data.posts);
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    });
}

function showAbout() {
    mainContent.innerHTML = `
        <div class="about">
            <h3>关于 Submerge 讨论区</h3>
            <p>这是一个技术交流社区，你可以在这里分享知识、讨论问题、结交朋友。</p>
            <p>本网站采用橙色主题，风格参考洛谷，实现了完整的讨论区功能，包括发帖、评论、点赞、收藏、聊天、实时消息等。</p>
            <p>开发者洛谷账号：<a href="https://www.luogu.com.cn/user/1496004" target="_blank">https://www.luogu.com.cn/user/1496004</a></p>
        </div>
    `;
}

// ==================== 导航 ====================
let currentPage = 'home';

function navigate(page) {
    currentPage = page;
    document.querySelectorAll('.nav a').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
    if (page === 'home') loadPosts();
    else if (page === 'essence') loadEssence();
    else if (page === 'category') loadCategory();
    else if (page === 'chat') openChatList();
    else if (page === 'about') showAbout();
}

// ==================== 初始化 ====================
function initEventListeners() {
    loginBtn.onclick = () => openModal('login-modal');
    registerBtn.onclick = () => openModal('register-modal');
    logoutBtn.onclick = logout;
    createPostBtn.onclick = showEditorModal;
    msgIcon.onclick = openMessages;
    document.querySelectorAll('.nav a').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            navigate(link.dataset.page);
        };
    });
    document.getElementById('login-submit').onclick = async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        await login(username, password);
    };
    document.getElementById('login-cancel').onclick = () => closeModal('login-modal');
    document.getElementById('login-close').onclick = () => closeModal('login-modal');
    document.getElementById('register-submit').onclick = async () => {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        await register(username, email, password);
    };
    document.getElementById('register-cancel').onclick = () => closeModal('register-modal');
    document.getElementById('register-close').onclick = () => closeModal('register-modal');
    document.getElementById('post-detail-close').onclick = () => closeModal('post-detail-modal');
    document.getElementById('post-detail-cancel').onclick = () => closeModal('post-detail-modal');
    document.getElementById('chat-list-close').onclick = () => closeModal('chat-list-modal');
    document.getElementById('chat-list-cancel').onclick = () => closeModal('chat-list-modal');
    document.getElementById('chat-room-close').onclick = () => closeModal('chat-room-modal');
    document.getElementById('chat-room-cancel').onclick = () => closeModal('chat-room-modal');
    document.getElementById('messages-close').onclick = () => closeModal('messages-modal');
    document.getElementById('messages-cancel').onclick = () => closeModal('messages-modal');
    document.getElementById('create-chat-btn').onclick = createNewChat;
}

function init() {
    checkLoginStatus();
    loadPosts();
    initEventListeners();
    setInterval(updateUnreadCount, 10000);
    updateUnreadCount();
}

init();
