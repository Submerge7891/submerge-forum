// ========== 自定义消息提示核心函数 ==========
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

// ========== 自定义确认框核心函数 ==========
function showConfirm(title, isInput = false, callback) {
    const confirmBox = document.getElementById('customConfirm');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmInput = document.getElementById('confirmInput');
    const confirmOk = document.getElementById('confirmOk');
    const confirmCancel = document.getElementById('confirmCancel');
    
    // 设置标题
    confirmTitle.textContent = title;
    // 显示/隐藏输入框
    confirmInput.style.display = isInput ? 'block' : 'none';
    confirmInput.value = '';
    
    // 打开确认框
    confirmBox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // 绑定确认事件
    const okHandler = () => {
        const inputValue = confirmInput.value.trim();
        callback(true, isInput ? inputValue : '');
        confirmBox.style.display = 'none';
        document.body.style.overflow = 'auto';
        confirmOk.removeEventListener('click', okHandler);
        confirmCancel.removeEventListener('click', cancelHandler);
    };
    
    // 绑定取消事件
    const cancelHandler = () => {
        callback(false, '');
        confirmBox.style.display = 'none';
        document.body.style.overflow = 'auto';
        confirmOk.removeEventListener('click', okHandler);
        confirmCancel.removeEventListener('click', cancelHandler);
    };
    
    confirmOk.addEventListener('click', okHandler);
    confirmCancel.addEventListener('click', cancelHandler);
    
    // 点击外部关闭
    confirmBox.addEventListener('click', (e) => {
        if (e.target === confirmBox) {
            cancelHandler();
        }
    });
}

// 初始化数据存储
function initStorage() {
    // 用户数据
    if (!localStorage.getItem('users')) {
        // 默认管理员账号
        const adminUser = {
            username: 'Submerge',
            password: 'syhnqqsjx1019',
            email: 'admin@example.com',
            isAdmin: true,
            avatar: 'S',
            collections: [],
            likedPosts: [],
            likedComments: []
        };
        localStorage.setItem('users', JSON.stringify([adminUser]));
    }

    // 帖子数据
    if (!localStorage.getItem('posts')) {
        const defaultPosts = [
            {
                id: 1,
                title: '这个讨论区的橙色主题太好看了，和 boyacoding.cn 一模一样！',
                content: `# 讨论区主题分享
                
这个橙色主题真的太好看了，分享一下实现思路：

1. 使用CSS变量定义主题色
\`\`\`css
:root {
    --main-color: #ff7c24;
    --main-hover: #ff6a00;
}
\`\`\`

2. 按钮和高亮元素使用主题色
3. 悬停效果增强交互体验

希望对大家有帮助！`,
                author: 'Submerge__l',
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
                content: `## 前端开发工具求助

最近在做静态页面开发，想找一些高效的编辑器和插件，大家有什么好的推荐吗？

### 我目前在用的：
- VS Code
- Chrome开发者工具
- PostCSS

希望能找到更多提升效率的工具！`,
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
                content: `# HTML+CSS零基础学习路线

零基础想入门前端，从HTML和CSS开始，分享一下我的学习路线：

### 阶段1：基础语法
- HTML标签学习
- CSS选择器和样式
- 盒模型理解

### 阶段2：实战练习
- 简单页面布局
- 响应式设计
- 常见组件实现

### 阶段3：进阶提升
- Flex/Grid布局
- CSS动画
- 预处理器

有没有更好的学习资源推荐？`,
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

    // 消息数据
    if (!localStorage.getItem('messages')) {
        const defaultMessages = {
            system: [
                {
                    id: 1,
                    subject: '欢迎加入讨论区',
                    content: '感谢你注册并使用Submerge__l讨论区，祝你使用愉快！',
                    time: new Date().toLocaleString(),
                    isRead: false
                }
            ],
            user: [],
            report: []
        };
        localStorage.setItem('messages', JSON.stringify(defaultMessages));
    }

    // 当前登录用户
    if (!localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', JSON.stringify(null));
    }
}

// 工具函数
const utils = {
    // 获取当前登录用户
    getCurrentUser: () => JSON.parse(localStorage.getItem('currentUser')),
    // 设置当前登录用户
    setCurrentUser: (user) => localStorage.setItem('currentUser', JSON.stringify(user)),
    // 获取所有用户
    getUsers: () => JSON.parse(localStorage.getItem('users')),
    // 保存用户
    saveUsers: (users) => localStorage.setItem('users', JSON.stringify(users)),
    // 获取所有帖子
    getPosts: () => JSON.parse(localStorage.getItem('posts')),
    // 保存帖子
    savePosts: (posts) => localStorage.setItem('posts', JSON.stringify(posts)),
    // 获取消息
    getMessages: () => JSON.parse(localStorage.getItem('messages')),
    // 保存消息
    saveMessages: (messages) => localStorage.setItem('messages', JSON.stringify(messages)),
    // 生成唯一ID
    generateId: (type) => {
        let items = [];
        if (type === 'post') items = utils.getPosts();
        else if (type === 'comment') {
            // 查找所有评论的最大ID
            const posts = utils.getPosts();
            let maxId = 0;
            posts.forEach(post => {
                post.comments.forEach(comment => {
                    if (comment.id > maxId) maxId = comment.id;
                });
            });
            return maxId + 1;
        }
        else if (type === 'message') {
            const messages = utils.getMessages();
            let maxId = 0;
            Object.values(messages).forEach(typeMsgs => {
                typeMsgs.forEach(msg => {
                    if (msg.id > maxId) maxId = msg.id;
                });
            });
            return maxId + 1;
        }
        return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    },
    // 格式化时间
    formatTime: (date) => new Date(date).toLocaleString(),
    // 检查是否为管理员
    isAdmin: () => {
        const user = utils.getCurrentUser();
        return user && user.isAdmin;
    },
    // 更新统计数据
    updateStats: () => {
        const posts = utils.getPosts();
        const users = utils.getUsers();
        const today = new Date().toLocaleDateString();
        
        // 总帖子数
        document.getElementById('total-posts').textContent = posts.length;
        // 今日发帖数
        const todayPosts = posts.filter(post => new Date(post.time).toLocaleDateString() === today).length;
        document.getElementById('today-posts').textContent = todayPosts;
        // 总用户数
        document.getElementById('total-users').textContent = users.length;
    },
    // 更新未读消息数
    updateUnreadCount: () => {
        const user = utils.getCurrentUser();
        if (!user) return;
        
        const messages = utils.getMessages();
        let unreadCount = 0;
        
        // 系统消息未读数
        unreadCount += messages.system.filter(msg => !msg.isRead).length;
        // 用户消息未读数
        unreadCount += messages.user.filter(msg => !msg.isRead).length;
        // 管理员举报消息未读数
        if (user.isAdmin) {
            unreadCount += messages.report.filter(msg => !msg.isRead).length;
        }
        
        const badge = document.getElementById('msg-badge');
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
};

// 打开模态框
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
    // 阻止页面滚动
    document.body.style.overflow = 'hidden';
}

// 关闭模态框
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    // 恢复页面滚动
    document.body.style.overflow = 'auto';
}

// 初始化页面
function initPage() {
    initStorage();
    renderPosts();
    utils.updateStats();
    
    // 检查登录状态
    checkLoginStatus();
    
    // 绑定事件
    bindEvents();
    
    // 初始化Markdown预览
    initMarkdownPreview();
}

// 检查登录状态
function checkLoginStatus() {
    const currentUser = utils.getCurrentUser();
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    
    if (currentUser) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        document.getElementById('user-avatar').textContent = currentUser.avatar || currentUser.username.charAt(0);
        document.getElementById('user-name').textContent = currentUser.username;
        
        // 更新未读消息数
        utils.updateUnreadCount();
    } else {
        authButtons.style.display = 'block';
        userProfile.style.display = 'none';
    }
}

// 渲染帖子列表
function renderPosts() {
    const posts = utils.getPosts();
    const postList = document.getElementById('post-list');
    const currentUser = utils.getCurrentUser();
    
    postList.innerHTML = '';
    
    // 过滤掉被封禁的帖子（管理员可以看到）
    const visiblePosts = currentUser && currentUser.isAdmin 
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
            // 排除点赞按钮点击
            if (!e.target.closest('.like-btn')) {
                openPostDetail(post.id);
            }
        });
        
        // 帖子点赞事件
        const likeBtn = postItem.querySelector('.like-btn');
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePostLike(post.id);
        });
    });
}

// 切换帖子点赞状态
function togglePostLike(postId) {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) {
        showToast('请先登录！', 'warning');
        openModal('login-modal');
        return;
    }
    
    const posts = utils.getPosts();
    const postIndex = posts.findIndex(post => post.id === postId);
    if (postIndex === -1) return;
    
    const users = utils.getUsers();
    const userIndex = users.findIndex(user => user.username === currentUser.username);
    
    // 检查是否已点赞
    const isLiked = currentUser.likedPosts && currentUser.likedPosts.includes(postId);
    
    if (isLiked) {
        // 取消点赞
        posts[postIndex].likes--;
        users[userIndex].likedPosts = users[userIndex].likedPosts.filter(id => id !== postId);
        showToast('已取消点赞', 'info');
    } else {
        // 点赞
        posts[postIndex].likes++;
        if (!users[userIndex].likedPosts) users[userIndex].likedPosts = [];
        users[userIndex].likedPosts.push(postId);
        showToast('点赞成功', 'success');
    }
    
    // 保存数据
    utils.savePosts(posts);
    utils.saveUsers(users);
    
    // 更新当前用户
    currentUser.likedPosts = users[userIndex].likedPosts;
    utils.setCurrentUser(currentUser);
    
    // 重新渲染
    renderPosts();
}

// 打开帖子详情
function openPostDetail(postId) {
    const posts = utils.getPosts();
    const post = posts.find(post => post.id === postId);
    if (!post) return;
    
    const currentUser = utils.getCurrentUser();
    const isLiked = currentUser && currentUser.likedPosts && currentUser.likedPosts.includes(postId);
    const isCollected = currentUser && currentUser.collections && currentUser.collections.includes(postId);
    
    // 填充内容
    document.getElementById('detail-title').textContent = post.title;
    document.getElementById('detail-author').textContent = `发布者: ${post.author}`;
    document.getElementById('detail-time').textContent = `发布时间: ${post.time}`;
    document.getElementById('detail-content').innerHTML = marked.parse(post.content);
    document.getElementById('like-count').textContent = post.likes;
    
    // 更新点赞/收藏状态
    const likeBtn = document.getElementById('like-post');
    const collectBtn = document.getElementById('collect-post');
    
    likeBtn.className = `post-detail-action-btn ${isLiked ? 'liked' : ''}`;
    likeBtn.innerHTML = `<i class="bi bi-heart${isLiked ? '-fill' : ''}"></i> 点赞 (<span id="like-count">${post.likes}</span>)`;
    
    collectBtn.className = `post-detail-action-btn ${isCollected ? 'collected' : ''}`;
    collectBtn.innerHTML = `<i class="bi bi-star${isCollected ? '-fill' : ''}"></i> ${isCollected ? '已收藏' : '收藏'}`;
    
    // 显示管理员操作
    const adminActions = document.getElementById('admin-actions');
    adminActions.style.display = (currentUser && currentUser.isAdmin) ? 'inline-flex' : 'none';
    
    // 渲染评论
    renderComments(postId);
    
    // 打开模态框
    openModal('post-detail-modal');
    
    // 绑定帖子详情内的事件
    bindPostDetailEvents(postId);
}

// 渲染评论
function renderComments(postId) {
    const posts = utils.getPosts();
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
        
        // 评论点赞事件
        const likeBtn = commentItem.querySelector('.like-comment');
        likeBtn.addEventListener('click', () => {
            toggleCommentLike(postId, comment.id);
        });
        
        // 评论举报事件
        const reportBtn = commentItem.querySelector('.report-comment');
        reportBtn.addEventListener('click', () => {
            openReportModal('comment', postId, comment.id);
        });
    });
}

// 切换评论点赞状态
function toggleCommentLike(postId, commentId) {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) {
        showToast('请先登录！', 'warning');
        openModal('login-modal');
        return;
    }
    
    const posts = utils.getPosts();
    const postIndex = posts.findIndex(post => post.id === postId);
    if (postIndex === -1) return;
    
    const commentIndex = posts[postIndex].comments.findIndex(comment => comment.id === commentId);
    if (commentIndex === -1) return;
    
    const users = utils.getUsers();
    const userIndex = users.findIndex(user => user.username === currentUser.username);
    
    // 检查是否已点赞
    const isLiked = currentUser.likedComments && currentUser.likedComments.includes(commentId);
    
    if (isLiked) {
        // 取消点赞
        posts[postIndex].comments[commentIndex].likes = (posts[postIndex].comments[commentIndex].likes || 1) - 1;
        users[userIndex].likedComments = users[userIndex].likedComments.filter(id => id !== commentId);
        showToast('已取消评论点赞', 'info');
    } else {
        // 点赞
        posts[postIndex].comments[commentIndex].likes = (posts[postIndex].comments[commentIndex].likes || 0) + 1;
        if (!users[userIndex].likedComments) users[userIndex].likedComments = [];
        users[userIndex].likedComments.push(commentId);
        showToast('评论点赞成功', 'success');
    }
    
    // 保存数据
    utils.savePosts(posts);
    utils.saveUsers(users);
    
    // 更新当前用户
    currentUser.likedComments = users[userIndex].likedComments;
    utils.setCurrentUser(currentUser);
    
    // 重新渲染评论
    renderComments(postId);
}

// 绑定帖子详情事件
function bindPostDetailEvents(postId) {
    const currentUser = utils.getCurrentUser();
    
    // 帖子点赞
    document.getElementById('like-post').addEventListener('click', () => {
        togglePostLike(postId);
        // 更新点赞数显示
        const post = utils.getPosts().find(p => p.id === postId);
        document.getElementById('like-count').textContent = post.likes;
        const isLiked = currentUser && currentUser.likedPosts && currentUser.likedPosts.includes(postId);
        document.getElementById('like-post').innerHTML = `<i class="bi bi-heart${isLiked ? '-fill' : ''}"></i> 点赞 (<span id="like-count">${post.likes}</span>)`;
    });
    
    // 帖子收藏
    document.getElementById('collect-post').addEventListener('click', () => {
        if (!currentUser) {
            showToast('请先登录！', 'warning');
            openModal('login-modal');
            return;
        }
        
        const users = utils.getUsers();
        const userIndex = users.findIndex(user => user.username === currentUser.username);
        
        // 检查是否已收藏
        const isCollected = currentUser.collections && currentUser.collections.includes(postId);
        
        if (isCollected) {
            // 取消收藏
            users[userIndex].collections = users[userIndex].collections.filter(id => id !== postId);
            showToast('已取消收藏！', 'info');
        } else {
            // 收藏
            if (!users[userIndex].collections) users[userIndex].collections = [];
            users[userIndex].collections.push(postId);
            showToast('收藏成功！', 'success');
        }
        
        // 保存数据
        utils.saveUsers(users);
        
        // 更新当前用户
        currentUser.collections = users[userIndex].collections;
        utils.setCurrentUser(currentUser);
        
        // 更新收藏按钮状态
        const collectBtn = document.getElementById('collect-post');
        const newIsCollected = currentUser.collections && currentUser.collections.includes(postId);
        collectBtn.className = `post-detail-action-btn ${newIsCollected ? 'collected' : ''}`;
        collectBtn.innerHTML = `<i class="bi bi-star${newIsCollected ? '-fill' : ''}"></i> ${newIsCollected ? '已收藏' : '收藏'}`;
    });
    
    // 帖子举报
    document.getElementById('report-post').addEventListener('click', () => {
        openReportModal('post', postId);
    });
    
    // 发布评论
    document.getElementById('submit-comment').addEventListener('click', () => {
        submitComment(postId);
    });
    
    // 管理员操作 - 封禁帖子
    document.getElementById('ban-post').addEventListener('click', () => {
        showConfirm('确定要封禁这个帖子吗？', false, (confirmed) => {
            if (confirmed) {
                const posts = utils.getPosts();
                const postIndex = posts.findIndex(post => post.id === postId);
                posts[postIndex].isBanned = !posts[postIndex].isBanned;
                utils.savePosts(posts);
                
                // 添加系统消息
                addSystemMessage(post.author, `你的帖子《${posts[postIndex].title}》已被${posts[postIndex].isBanned ? '封禁' : '解封'}`);
                
                showToast(`帖子已${posts[postIndex].isBanned ? '封禁' : '解封'}！`, 'success');
                closeModal('post-detail-modal');
                renderPosts();
            }
        });
    });
    
    // 管理员操作 - 封禁用户
    document.getElementById('ban-user').addEventListener('click', () => {
        const post = utils.getPosts().find(p => p.id === postId);
        showConfirm(`确定要封禁用户 ${post.author} 吗？`, false, (confirmed) => {
            if (confirmed) {
                // 这里简化处理，实际项目需要更完善的封禁逻辑
                addSystemMessage(post.author, '你的账号已被管理员封禁，请联系客服解决');
                showToast(`用户 ${post.author} 已被封禁！`, 'success');
            }
        });
    });
    
    // 管理员操作 - 修改分类
    document.getElementById('change-category').addEventListener('click', () => {
        showConfirm('请输入新的分类标签（用逗号分隔）：', true, (confirmed, inputValue) => {
            if (confirmed && inputValue) {
                const posts = utils.getPosts();
                const postIndex = posts.findIndex(post => post.id === postId);
                posts[postIndex].tags = inputValue.split(',').map(tag => tag.trim());
                utils.savePosts(posts);
                
                showToast('分类修改成功！', 'success');
                openPostDetail(postId); // 重新加载帖子详情
            } else if (confirmed && !inputValue) {
                showToast('分类标签不能为空！', 'error');
            }
        });
    });
}

// 提交评论
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
    
    const posts = utils.getPosts();
    const postIndex = posts.findIndex(post => post.id === postId);
    
    // 创建新评论
    const newComment = {
        id: utils.generateId('comment'),
        author: currentUser.username,
        content: commentContent,
        time: new Date().toLocaleString(),
        likes: 0,
        isBanned: false
    };
    
    // 添加评论
    if (!posts[postIndex].comments) posts[postIndex].comments = [];
    posts[postIndex].comments.push(newComment);
    
    // 保存数据
    utils.savePosts(posts);
    
    // 清空输入框
    document.getElementById('comment-input').value = '';
    
    // 重新渲染评论
    renderComments(postId);
    
    // 添加系统消息通知作者
    addSystemMessage(posts[postIndex].author, `你的帖子《${posts[postIndex].title}》有新的评论`);
    
    showToast('评论发布成功！', 'success');
}

// 打开举报模态框
function openReportModal(type, targetId, commentId) {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) {
        showToast('请先登录！', 'warning');
        openModal('login-modal');
        return;
    }
    
    // 保存举报类型和ID
    document.getElementById('report-modal').dataset.type = type;
    document.getElementById('report-modal').dataset.targetId = targetId;
    if (commentId) {
        document.getElementById('report-modal').dataset.commentId = commentId;
    }
    
    // 清空举报原因
    document.getElementById('report-reason').value = '';
    document.getElementById('report-error').style.display = 'none';
    
    // 打开模态框
    openModal('report-modal');
}

// 提交举报
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
    const posts = utils.getPosts();
    
    // 找到目标帖子/评论
    let targetTitle = '';
    if (type === 'post') {
        const post = posts.find(p => p.id === targetId);
        targetTitle = post.title;
        // 保存举报信息到帖子
        if (!post.reports) post.reports = [];
        post.reports.push({
            id: utils.generateId('message'),
            reporter: currentUser.username,
            reason: reason,
            time: new Date().toLocaleString(),
            isProcessed: false
        });
        utils.savePosts(posts);
    } else if (type === 'comment') {
        const post = posts.find(p => p.id === targetId);
        const comment = post.comments.find(c => c.id === commentId);
        targetTitle = `评论(${comment.author}): ${comment.content.substring(0, 20)}...`;
    }
    
    // 添加举报消息给管理员
    addReportMessage({
        id: utils.generateId('message'),
        subject: `新的举报 - ${type === 'post' ? '帖子' : '评论'}`,
        content: `举报人：${currentUser.username}\n举报对象：${targetTitle}\n举报原因：${reason}`,
        time: new Date().toLocaleString(),
        isRead: false,
        targetType: type,
        targetId: targetId,
        commentId: commentId
    });
    
    // 关闭模态框
    closeModal('report-modal');
    
    // 提示成功
    showToast('举报提交成功！管理员会尽快处理。', 'success');
    
    // 添加系统消息
    addSystemMessage(currentUser.username, '你的举报已提交，管理员会尽快处理，感谢你的反馈！');
}

// 添加系统消息
function addSystemMessage(username, content) {
    const messages = utils.getMessages();
    const newMsg = {
        id: utils.generateId('message'),
        subject: '系统通知',
        content: content,
        time: new Date().toLocaleString(),
        isRead: false
    };
    
    messages.system.push(newMsg);
    utils.saveMessages(messages);
    
    // 更新未读消息数
    if (utils.getCurrentUser() && utils.getCurrentUser().username === username) {
        utils.updateUnreadCount();
    }
}

// 添加举报消息
function addReportMessage(msg) {
    const messages = utils.getMessages();
    if (!messages.report) messages.report = [];
    messages.report.push(msg);
    utils.saveMessages(messages);
    
    // 更新未读消息数
    utils.updateUnreadCount();
}

// 打开消息中心
function openMessages() {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) {
        showToast('请先登录！', 'warning');
        openModal('login-modal');
        return;
    }
    
    // 显示管理员举报标签
    const reportTab = document.getElementById('report-tab');
    reportTab.style.display = currentUser.isAdmin ? 'block' : 'none';
    
    // 渲染消息
    renderMessages('system');
    
    // 打开模态框
    openModal('messages-modal');
}

// 渲染消息
function renderMessages(tabType) {
    const messages = utils.getMessages();
    const msgContent = document.getElementById('msg-content');
    const currentUser = utils.getCurrentUser();
    
    // 切换标签样式
    document.querySelectorAll('.msg-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabType);
    });
    
    // 获取对应类型的消息
    let msgs = messages[tabType] || [];
    
    // 管理员可以看到所有举报消息，普通用户看不到
    if (tabType === 'report' && !currentUser.isAdmin) {
        msgs = [];
    }
    
    // 按时间倒序排列
    msgs = msgs.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    // 渲染消息列表
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
                ${currentUser.isAdmin && tabType === 'report' ? `
                    <div class="admin-actions">
                        <button class="btn btn-primary btn-sm process-report" data-id="${msg.targetId}" data-comment-id="${msg.commentId || ''}">处理</button>
                        <button class="btn btn-secondary btn-sm mark-read" data-id="${msg.id}">标为已读</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        msgContent.appendChild(msgItem);
        
        // 标记为已读
        msgItem.addEventListener('click', () => {
            if (!msg.isRead) {
                msg.isRead = true;
                utils.saveMessages(messages);
                msgItem.classList.remove('unread');
                utils.updateUnreadCount();
            }
        });
        
        // 管理员处理举报
        if (currentUser.isAdmin && tabType === 'report') {
            const processBtn = msgItem.querySelector('.process-report');
            if (processBtn) {
                processBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetId = parseInt(processBtn.dataset.id);
                    const commentId = processBtn.dataset.commentId ? parseInt(processBtn.dataset.commentId) : null;
                    
                    // 标记举报为已处理
                    msg.isProcessed = true;
                    utils.saveMessages(messages);
                    
                    // 询问处理方式
                    showConfirm('请输入处理结果（例如：已封禁/已警告/不予处理）：', true, (confirmed, action) => {
                        if (confirmed && action) {
                            // 添加系统消息通知举报人
                            addSystemMessage(msg.reporter || '未知用户', `你举报的${msg.targetType === 'post' ? '帖子' : '评论'}已处理，处理结果：${action}`);
                            showToast('举报已处理！', 'success');
                            renderMessages('report');
                            utils.updateUnreadCount();
                        } else if (confirmed && !action) {
                            showToast('处理结果不能为空！', 'error');
                        }
                    });
                });
            }
            
            // 标为已读
            const markReadBtn = msgItem.querySelector('.mark-read');
            if (markReadBtn) {
                markReadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    msg.isRead = true;
                    utils.saveMessages(messages);
                    msgItem.classList.remove('unread');
                    utils.updateUnreadCount();
                    showToast('已标记为已读！', 'success');
                });
            }
        }
    });
}

// 初始化Markdown编辑器
function initMarkdownPreview() {
    const editorTextarea = document.getElementById('post-content');
    const previewArea = document.getElementById('editor-preview');
    
    // 实时预览
    editorTextarea.addEventListener('input', () => {
        previewArea.innerHTML = marked.parse(editorTextarea.value);
    });
    
    // 编辑器工具栏按钮事件
    document.querySelectorAll('.editor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const textarea = editorTextarea;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end);
            
            // 根据不同的Markdown语法插入
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
            
            // 更新预览
            previewArea.innerHTML = marked.parse(textarea.value);
            // 聚焦回文本框
            textarea.focus();
        });
    });
}

// 发布新帖子
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
    
    // 验证
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
    
    // 创建新帖子
    const newPost = {
        id: utils.generateId('post'),
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
    
    // 保存帖子
    const posts = utils.getPosts();
    posts.unshift(newPost); // 最新的帖子放在最前面
    utils.savePosts(posts);
    
    // 清空编辑器
    document.getElementById('post-title').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('post-tags').value = '';
    document.getElementById('editor-preview').innerHTML = '';
    
    // 关闭模态框
    closeModal('editor-modal');
    
    // 更新页面
    renderPosts();
    utils.updateStats();
    
    // 添加系统消息
    addSystemMessage(currentUser.username, `你的帖子《${title}》发布成功！`);
    
    showToast('帖子发布成功！', 'success');
}

// 登录功能
function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorEl = document.getElementById('login-error');
    
    errorEl.style.display = 'none';
    
    if (!username || !password) {
        errorEl.textContent = '用户名和密码不能为空！';
        errorEl.style.display = 'block';
        return;
    }
    
    const users = utils.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        errorEl.textContent = '用户名或密码错误！';
        errorEl.style.display = 'block';
        return;
    }
    
    // 登录成功
    utils.setCurrentUser(user);
    
    // 关闭模态框
    closeModal('login-modal');
    
    // 更新页面状态
    checkLoginStatus();
    
    // 添加登录成功消息
    addSystemMessage(username, '欢迎回来！你已成功登录讨论区');
    
    showToast(`欢迎回来，${username}！`, 'success');
}

// 注册功能
function register() {
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
    
    const users = utils.getUsers();
    if (users.some(u => u.username === username)) {
        errorEl.textContent = '用户名已存在！';
        errorEl.style.display = 'block';
        return;
    }
    
    if (users.some(u => u.email === email)) {
        errorEl.textContent = '邮箱已被注册！';
        errorEl.style.display = 'block';
        return;
    }
    
    // 创建新用户
    const newUser = {
        username: username,
        password: password,
        email: email,
        isAdmin: false,
        avatar: username.charAt(0),
        collections: [],
        likedPosts: [],
        likedComments: []
    };
    
    // 保存用户
    users.push(newUser);
    utils.saveUsers(users);
    
    // 清空表单
    document.getElementById('register-username').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    
    // 关闭模态框
    closeModal('register-modal');
    
    // 添加注册成功消息
    addSystemMessage(username, '恭喜你注册成功！欢迎加入讨论区');
    
    showToast('注册成功！请登录', 'success');
}

// 退出登录
function logout() {
    showConfirm('确定要退出登录吗？', false, (confirmed) => {
        if (confirmed) {
            utils.setCurrentUser(null);
            checkLoginStatus();
            showToast('已退出登录！', 'info');
        }
    });
}

// 绑定所有事件
function bindEvents() {
    // 登录/注册模态框事件
    document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));
    document.getElementById('register-btn').addEventListener('click', () => openModal('register-modal'));
    
    // 关闭模态框事件
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
    
    // 登录/注册提交
    document.getElementById('login-submit').addEventListener('click', login);
    document.getElementById('register-submit').addEventListener('click', register);
    
    // 退出登录
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // 创建帖子按钮
    document.getElementById('create-post-btn').addEventListener('click', () => {
        const currentUser = utils.getCurrentUser();
        if (currentUser) {
            openModal('editor-modal');
        } else {
            showToast('请先登录！', 'warning');
            openModal('login-modal');
        }
    });
    
    // 发布帖子
    document.getElementById('editor-submit').addEventListener('click', publishPost);
    
    // 提交举报
    document.getElementById('report-submit').addEventListener('click', submitReport);
    
    // 消息中心
    document.getElementById('msg-icon').addEventListener('click', openMessages);
    
    // 消息标签切换
    document.querySelectorAll('.msg-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            renderMessages(tab.dataset.tab);
        });
    });
    
    // 点击模态框外部关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initPage);
