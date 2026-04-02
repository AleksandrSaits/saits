// ==================== SUPABASE CONFIG ====================
var SUPABASE_URL = 'https://imxgdbztadqkpkrlebnh.supabase.co';
var SUPABASE_KEY = 'sb_publishable_xP_iYqZ-UJWXCb5b3pttRA_rMH9Fhe2';
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== STATE ====================
var currentUser = null;
var isLoginMode = true;
var currentVideoId = null;
var notifications = [];
var viewHistory = [];
var currentTheme = 'dark';
var videoElement = null;
var uploadType = 'file';
var selectedFile = null;
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

// Демо видео
const DEMO_VIDEOS = [
    {
        id: 'demo-1',
        title: 'Welcome to ZERO-TUBE',
        description: 'This is a demo video to show how the platform works.',
        video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail_url: 'https://picsum.photos/seed/demo1/640/360',
        channel_name: 'ZERO-TUBE',
        channel_avatar: 'https://picsum.photos/seed/ch1/40/40',
        views: 15420,
        created_at: new Date().toISOString()
    },
    {
        id: 'demo-2',
        title: 'How to Upload Videos',
        description: 'Learn how to upload your first video.',
        video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail_url: 'https://picsum.photos/seed/demo2/640/360',
        channel_name: 'ZERO-TUBE',
        channel_avatar: 'https://picsum.photos/seed/ch2/40/40',
        views: 8230,
        created_at: new Date().toISOString()
    },
    {
        id: 'demo-3',
        title: 'Platform Features',
        description: 'Explore all the features of ZERO-TUBE.',
        video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail_url: 'https://picsum.photos/seed/demo3/640/360',
        channel_name: 'ZERO-TUBE',
        channel_avatar: 'https://picsum.photos/seed/ch3/40/40',
        views: 12100,
        created_at: new Date().toISOString()
    },
    {
        id: 'demo-4',
        title: 'Getting Started Guide',
        description: 'Everything you need to know to get started.',
        video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail_url: 'https://picsum.photos/seed/demo4/640/360',
        channel_name: 'ZERO-TUBE',
        channel_avatar: 'https://picsum.photos/seed/ch4/40/40',
        views: 5670,
        created_at: new Date().toISOString()
    }
];

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
    try {
        var stored = localStorage.getItem('zeroTubeHistory');
        if (stored) viewHistory = JSON.parse(stored);
        currentTheme = localStorage.getItem('zeroTubeTheme') || 'dark';
    } catch(e) {}
    setTheme(currentTheme);
    checkSession();
    routerInit();
    setupDragAndDrop();
});

// ==================== ROUTER ====================
var router = {
    navigate: function(route, params) {
        var hash = '#' + route;
        if (params && params.id) hash += '?id=' + params.id;
        window.location.hash = hash;
        updateBottomNav();
    }
};

function routerInit() {
    window.addEventListener('hashchange', routerHandleRoute);
    routerHandleRoute();
}

function routerNavigate(route, id) {
    router.navigate(route, id ? {id: id} : {});
}

function routerHandleRoute() {
    var hash = window.location.hash.slice(1) || 'home';
    var parts = hash.split('?');
    var route = parts[0];
    var params = {};
    if (parts[1]) {
        var sp = new URLSearchParams(parts[1]);
        params.id = sp.get('id');
        params.q = sp.get('q');
    }

    var main = document.getElementById('mainContent');
    main.innerHTML = '<div class="text-center" style="padding:100px;"><div class="loading-spinner" style="margin:0 auto 20px;"></div><p class="text-muted">Loading...</p></div>';
    window.scrollTo(0, 0);

    setTimeout(function() {
        if (route === 'home') renderHome(main, params.q);
        else if (route === 'video') renderVideo(main, params.id);
        else if (route === 'history') renderHistory(main);
        else if (route === 'trending') renderHome(main);
        else router.navigate('home');
    }, 100);
}

// ==================== THEME ====================
function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('zeroTubeTheme', theme);
    
    if (theme === 'system') {
        var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

// ==================== BOTTOM NAV ====================
function updateBottomNav() {
    var hash = window.location.hash.slice(1) || 'home';
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.classList.remove('active');
        if (hash === 'home' && item.innerText.includes('Home')) item.classList.add('active');
        if (hash === 'trending' && item.innerText.includes('Explore')) item.classList.add('active');
    });
}

function toggleUserDropdownMobile() {
    if (currentUser) document.getElementById('userDropdown').classList.toggle('active');
    else openAuthModal('login');
}

// ==================== AUTH ====================
async function checkSession() {
    try {
        var result = await supabase.auth.getSession();
        if (result.data.session) {
            currentUser = result.data.session.user;
            await ensureProfile();
            updateUIForAuth(true);
        }
    } catch(e) {
        var stored = localStorage.getItem('zeroTubeUser');
        if (stored) {
            currentUser = JSON.parse(stored);
            updateUIForAuth(true);
        }
    }
}

// FIX: Ensure profile exists before any operations
async function ensureProfile() {
    if (!currentUser) return;
    try {
        var result = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        if (!result.data) {
            // Profile doesn't exist, create it
            await supabase.from('profiles').insert([{
                id: currentUser.id,
                username: currentUser.email.split('@')[0],
                avatar_url: currentUser.user_metadata?.avatar_url
            }]);
        }
        currentUser.profile = result.data || {
            username: currentUser.email.split('@')[0],
            avatar_url: currentUser.user_metadata?.avatar_url
        };
        var avatar = document.getElementById('navAvatar');
        if (avatar) avatar.src = currentUser.profile.avatar_url || 'https://via.placeholder.com/36';
    } catch(e) {
        console.error('Profile error:', e);
    }
}

function updateUIForAuth(isLoggedIn) {
    var authBtns = document.getElementById('authButtons');
    var userMenu = document.getElementById('userMenu');
    if (isLoggedIn) {
        authBtns.classList.add('hidden');
        userMenu.classList.remove('hidden');
        if (currentUser && currentUser.profile) {
            document.getElementById('navAvatar').src = currentUser.profile.avatar_url || 'https://via.placeholder.com/36';
        }
    } else {
        authBtns.classList.remove('hidden');
        userMenu.classList.add('hidden');
    }
}

function openAuthModal(mode) {
    isLoginMode = mode === 'login';
    document.getElementById('authTitle').innerText = isLoginMode ? 'Sign In' : 'Sign Up';
    document.getElementById('authSwitchText').innerHTML = isLoginMode 
        ? 'No account? <span class="text-accent" style="cursor:pointer" onclick="toggleAuthMode()">Sign Up</span>'
        : 'Have account? <span class="text-accent" style="cursor:pointer" onclick="toggleAuthMode()">Sign In</span>';
    
    var confirmGroup = document.getElementById('emailConfirmGroup');
    if (confirmGroup) confirmGroup.style.display = isLoginMode ? 'none' : 'block';
    
    var msg = document.getElementById('authMessage');
    if (msg) msg.innerHTML = '';
    
    document.getElementById('authModal').classList.add('active');
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    openAuthModal(isLoginMode ? 'login' : 'signup');
}

async function handleAuth(e) {
    e.preventDefault();
    var email = document.getElementById('authEmail').value;
    var password = document.getElementById('authPassword').value;
    var btn = document.getElementById('authSubmitBtn');
    var msg = document.getElementById('authMessage');
    
    btn.disabled = true;
    btn.innerText = 'Loading...';
    msg.innerHTML = '';

    try {
        var result;
        if (isLoginMode) {
            result = await supabase.auth.signInWithPassword({email:email,password:password});
        } else {
            var confirmPass = document.getElementById('authPasswordConfirm').value;
            if (password !== confirmPass) {
                throw new Error('Passwords do not match');
            }
            
            result = await supabase.auth.signUp({
                email: email,
                password: password,
                options: { emailRedirectTo: window.location.origin }
            });
            
            if (!result.error) {
                msg.innerHTML = '<p class="text-accent">Check your email to confirm!</p>';
                btn.disabled = false;
                btn.innerText = 'Submit';
                return;
            }
        }
        
        if (result.error) throw result.error;

        currentUser = result.data.user;
        await ensureProfile();
        updateUIForAuth(true);
        closeModal('authModal');
        showToast(isLoginMode ? 'Welcome!' : 'Account created!', 'success');
        router.navigate('home');
    } catch (error) {
        msg.innerHTML = '<p class="text-danger">' + error.message + '</p>';
    } finally {
        btn.disabled = false;
        btn.innerText = 'Submit';
    }
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    updateUIForAuth(false);
    router.navigate('home');
    showToast('Logged out', 'success');
}

// ==================== HOME ====================
async function renderHome(container, searchQuery) {
    var html = '<div class="video-grid" id="videoGrid"></div>';
    container.innerHTML = html;
    await loadVideos(searchQuery, true);
}

async function loadVideos(query, reset) {
    var grid = document.getElementById('videoGrid');
    if (!grid) return;
    if (reset) grid.innerHTML = '';

    try {
        var q = supabase.from('videos').select('*,profiles:user_id(username,avatar_url)').order('created_at',{ascending:false}).limit(20);
        if (query) q = q.or('title.ilike.%'+query+'%');
        var result = await q;
        var data = result.data;
        
        if (data && data.length > 0) {
            data.forEach(function(v) {
                v.channel_name = v.profiles ? v.profiles.username : 'User';
                v.channel_avatar = v.profiles ? v.profiles.avatar_url : 'https://via.placeholder.com/40';
                grid.appendChild(createVideoCard(v));
            });
        } else if (reset) {
            DEMO_VIDEOS.forEach(function(v) {
                grid.appendChild(createVideoCard(v));
            });
        }
    } catch (e) {
        console.error(e);
        if (reset) {
            DEMO_VIDEOS.forEach(function(v) {
                grid.appendChild(createVideoCard(v));
            });
        }
    }
}

function createVideoCard(video) {
    var div = document.createElement('div');
    div.className = 'video-card touch-feedback';
    div.onclick = function() { router.navigate('video', {id:video.id}); };
    div.innerHTML = '<div class="thumbnail-wrapper"><img src="'+(video.thumbnail_url||'https://via.placeholder.com/640x360')+'" class="thumbnail" loading="lazy"></div><div class="video-info"><img src="'+(video.channel_avatar||'https://via.placeholder.com/40')+'" class="channel-thumb"><div class="video-meta"><h3 class="video-title">'+sanitizeHTML(video.title)+'</h3><div class="channel-name">'+sanitizeHTML(video.channel_name||'Unknown')+'</div><div class="video-stats">'+formatNumber(video.views||0)+' views</div></div></div>';
    return div;
}

// ==================== UPLOAD ====================
function setUploadType(type) {
    uploadType = type;
    document.getElementById('uploadTypeFile').classList.toggle('active', type === 'file');
    document.getElementById('uploadTypeUrl').classList.toggle('active', type === 'url');
    document.getElementById('uploadFormFile').classList.toggle('hidden', type !== 'file');
    document.getElementById('uploadFormUrl').classList.toggle('hidden', type !== 'url');
}

function setupDragAndDrop() {
    var dropZone = document.getElementById('fileDropZone');
    if (!dropZone) return;

    ['dragenter','dragover','dragleave','drop'].forEach(function(eventName) {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter','dragover'].forEach(function(eventName) {
        dropZone.addEventListener(eventName, function() { dropZone.classList.add('dragover'); }, false);
    });

    ['dragleave','drop'].forEach(function(eventName) {
        dropZone.addEventListener(eventName, function() { dropZone.classList.remove('dragover'); }, false);
    });

    dropZone.addEventListener('drop', function(e) {
        var files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    }, false);
}

function handleFileSelect(input) {
    if (input.files && input.files[0]) handleFile(input.files[0]);
}

function handleFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
        showToast('Invalid file type. Use MP4, WebM, or MOV', 'error');
        return;
    }
    if (file.size > MAX_FILE_SIZE) {
        showToast('File too large. Max 500MB', 'error');
        return;
    }
    selectedFile = file;
    showFilePreview(file);
}

function showFilePreview(file) {
    var preview = document.getElementById('filePreview');
    var size = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    preview.innerHTML = '<i class="fas fa-file-video"></i><div class="file-preview-info"><div class="file-preview-name">'+sanitizeHTML(file.name)+'</div><div class="file-preview-size">'+size+'</div></div><button type="button" class="file-preview-remove" onclick="removeFile()"><i class="fas fa-times"></i></button>';
    preview.classList.remove('hidden');
    document.getElementById('fileDropZone').classList.add('hidden');
}

function removeFile() {
    selectedFile = null;
    document.getElementById('filePreview').classList.add('hidden');
    document.getElementById('fileDropZone').classList.remove('hidden');
    document.getElementById('videoFile').value = '';
}

async function handleFileUpload(e) {
    e.preventDefault();
    if (!currentUser) { openAuthModal('login'); return; }
    if (!selectedFile) { showToast('Please select a video file', 'error'); return; }

    // FIX: Ensure profile exists before upload
    await ensureProfile();

    var btn = document.getElementById('uploadSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    try {
        var fileExt = selectedFile.name.split('.').pop();
        var fileName = Date.now() + '-' + Math.random().toString(36).substring(7) + '.' + fileExt;
        
        var { data, error } = await supabase.storage.from('videos').upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
        });

        if (error) {
            console.error('Storage Error:', error);
            if (error.message.includes('Bucket not found')) {
                throw new Error('Storage not configured. Contact admin.');
            }
            throw error;
        }

        var { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName);

        var videoData = {
            user_id: currentUser.id,
            title: document.getElementById('vidTitle').value,
            description: document.getElementById('vidDesc').value,
            video_url: publicUrl,
            storage_path: fileName,
            file_size: selectedFile.size
        };

        var { error: insertError } = await supabase.from('videos').insert([videoData]);
        if (insertError) {
            console.error('Insert error:', insertError);
            if (insertError.message.includes('foreign key')) {
                throw new Error('Profile error. Please sign in again.');
            }
            throw insertError;
        }

        closeModal('uploadModal');
        showToast('Video uploaded successfully!', 'success');
        router.navigate('home');
        
        removeFile();
        document.getElementById('uploadFormFile').reset();
    } catch (error) {
        console.error('Upload failed:', error);
        showToast(error.message || 'Upload failed', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-upload"></i> Upload';
    }
}

async function handleUrlUpload(e) {
    e.preventDefault();
    if (!currentUser) { openAuthModal('login'); return; }

    // FIX: Ensure profile exists
    await ensureProfile();

    try {
        var videoData = {
            user_id: currentUser.id,
            title: document.getElementById('vidTitleUrl').value,
            description: document.getElementById('vidDescUrl').value,
            video_url: document.getElementById('vidUrl').value
        };

        var { error } = await supabase.from('videos').insert([videoData]);
        if (error) {
            if (error.message.includes('foreign key')) {
                throw new Error('Profile error. Please sign in again.');
            }
            throw error;
        }

        closeModal('uploadModal');
        showToast('Video added successfully!', 'success');
        router.navigate('home');
        document.getElementById('uploadFormUrl').reset();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function openUploadModal() {
    if (!currentUser) { openAuthModal('login'); return; }
    setUploadType('file');
    document.getElementById('uploadModal').classList.add('active');
}

// ==================== VIDEO PLAYER ====================
async function renderVideo(container, videoId) {
    currentVideoId = videoId;
    
    var video = DEMO_VIDEOS.find(function(v) { return v.id === videoId; });
    
    if (!video) {
        try {
            var result = await supabase.from('videos').select('*,profiles:user_id(username,avatar_url,bio)').eq('id',videoId).single();
            if (result.data) {
                video = result.data;
                video.channel_name = video.profiles ? video.profiles.username : 'Unknown';
                video.channel_avatar = video.profiles ? video.profiles.avatar_url : 'https://via.placeholder.com/44';
            }
        } catch(e) {}
    }
    
    if (!video) {
        container.innerHTML = '<div class="text-center" style="padding:100px;"><h2>Video not found</h2><p class="text-muted">This video may have been removed.</p></div>';
        return;
    }

    var html = '<div class="player-layout"><div class="main-player"><div class="video-player-container"><div class="custom-player" id="customPlayer"><video id="mainVideo" preload="metadata"><source src="'+video.video_url+'" type="video/mp4"></video><div class="player-controls"><div class="progress-bar" id="progressBar" onclick="seekVideo(event)"><div class="progress-filled" id="progressFilled"></div></div><div class="controls-row"><div class="controls-left"><button class="control-btn touch-feedback" onclick="togglePlay()"><i class="fas fa-play" id="playIcon"></i></button><button class="control-btn touch-feedback" onclick="skip(-10)"><i class="fas fa-undo"></i></button><button class="control-btn touch-feedback" onclick="skip(10)"><i class="fas fa-redo"></i></button><span class="time-display"><span id="currentTime">0:00</span> / <span id="duration">0:00</span></span></div><div class="controls-right"><button class="control-btn touch-feedback" onclick="toggleMute()"><i class="fas fa-volume-up" id="volumeIcon"></i></button><button class="control-btn touch-feedback" onclick="toggleFullscreen()"><i class="fas fa-expand"></i></button></div></div></div></div></div><div class="video-info-section"><h1 class="video-title-large">'+sanitizeHTML(video.title)+'</h1><div class="video-actions-bar"><div class="action-buttons"><button class="action-btn touch-feedback" id="likeBtn" onclick="toggleLike()"><i class="fas fa-thumbs-up"></i><span>Like</span></button></div><button class="action-btn touch-feedback" onclick="shareVideo()"><i class="fas fa-share"></i> Share</button></div></div><div class="channel-info-bar"><div class="channel-info-left"><img src="'+video.channel_avatar+'" class="channel-avatar-lg"><div class="channel-details"><h4>'+sanitizeHTML(video.channel_name)+'</h4></div></div></div><div class="video-description"><span class="text-muted">'+formatNumber(video.views||0)+' views</span><div class="desc-content" style="margin-top:8px;">'+sanitizeHTML(video.description||'')+'</div></div><div class="comments-section"><div class="comments-header"><h3>Comments</h3></div>'+(currentUser?'<div class="comment-input-container"><img src="'+(currentUser.profile?currentUser.profile.avatar_url:'https://via.placeholder.com/40')+'" class="comment-avatar"><div class="comment-input-wrapper"><textarea class="comment-input" id="commentInput" placeholder="Add a comment..." rows="1"></textarea><div class="comment-actions"><button class="comment-btn comment-btn-submit touch-feedback" onclick="postComment()" disabled>Comment</button></div></div></div>':'<p class="text-muted">Sign in to comment</p>')+'<div id="commentsList"></div></div></div><div class="suggestions-sidebar"><h3>Up Next</h3><div class="suggestions-list" id="suggestionsList"></div></div></div>';
    
    container.innerHTML = html;
    initVideoPlayer();
    loadComments();
    loadSuggestions();
}

function initVideoPlayer() {
    videoElement = document.getElementById('mainVideo');
    if (!videoElement) return;
    videoElement.addEventListener('timeupdate', function() {
        var pct = (videoElement.currentTime / videoElement.duration) * 100;
        document.getElementById('progressFilled').style.width = pct + '%';
        document.getElementById('currentTime').innerText = formatTime(videoElement.currentTime);
    });
    videoElement.addEventListener('loadedmetadata', function() {
        document.getElementById('duration').innerText = formatTime(videoElement.duration);
    });
}

function togglePlay() {
    if (!videoElement) return;
    var icon = document.getElementById('playIcon');
    if (videoElement.paused) { videoElement.play(); icon.className = 'fas fa-pause'; }
    else { videoElement.pause(); icon.className = 'fas fa-play'; }
}

function seekVideo(e) {
    if (!videoElement) return;
    var bar = document.getElementById('progressBar');
    var rect = bar.getBoundingClientRect();
    var pos = (e.clientX - rect.left) / rect.width;
    videoElement.currentTime = pos * videoElement.duration;
}

function skip(seconds) {
    if (!videoElement) return;
    videoElement.currentTime += seconds;
}

function toggleMute() {
    if (!videoElement) return;
    videoElement.muted = !videoElement.muted;
    document.getElementById('volumeIcon').className = videoElement.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
}

function toggleFullscreen() {
    var player = document.getElementById('customPlayer');
    if (!document.fullscreenElement) { player.requestFullscreen(); }
    else { document.exitFullscreen(); }
}

function toggleLike() {
    if (!currentUser) { openAuthModal('login'); return; }
    var btn = document.getElementById('likeBtn');
    btn.classList.toggle('active');
    showToast(btn.classList.contains('active') ? 'Liked!' : 'Unliked', 'success');
}

function loadComments() {
    var list = document.getElementById('commentsList');
    if (!list) return;
    list.innerHTML = '<p class="text-muted">No comments yet</p>';
    var input = document.getElementById('commentInput');
    if (input) {
        input.addEventListener('input', function() {
            var btn = this.parentElement.querySelector('.comment-btn-submit');
            if (btn) btn.disabled = !this.value.trim();
        });
    }
}

function postComment() {
    var input = document.getElementById('commentInput');
    if (!input || !input.value.trim()) return;
    var list = document.getElementById('commentsList');
    if (list.innerHTML.includes('No comments')) list.innerHTML = '';
    list.insertAdjacentHTML('afterbegin', '<div class="comment-item"><img src="'+(currentUser.profile?currentUser.profile.avatar_url:'https://via.placeholder.com/40')+'" class="comment-avatar"><div class="comment-body"><div class="comment-meta"><span class="comment-author">'+sanitizeHTML(currentUser.profile?currentUser.profile.username:'User')+'</span></div><div class="comment-text">'+sanitizeHTML(input.value)+'</div></div></div>');
    input.value = '';
    input.parentElement.querySelector('.comment-btn-submit').disabled = true;
    showToast('Comment posted!', 'success');
}

function loadSuggestions() {
    var list = document.getElementById('suggestionsList');
    if (!list) return;
    list.innerHTML = '';
    DEMO_VIDEOS.slice(0, 3).forEach(function(v, i) {
        list.innerHTML += '<div class="suggestion-card touch-feedback"><img src="'+v.thumbnail_url+'" class="suggestion-thumb"><div class="suggestion-info"><h4 class="suggestion-title">'+v.title+'</h4><div class="suggestion-channel">'+v.channel_name+'</div></div></div>';
    });
}

function shareVideo() {
    if (navigator.share) {
        navigator.share({title:document.title,url:window.location.href});
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied!', 'success');
    }
}

// ==================== HISTORY ====================
function renderHistory(container) {
    container.innerHTML = '<h2>Watch History</h2><div class="video-grid" style="margin-top:16px;"></div>';
}

// ==================== UTILS ====================
function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('active');
}

function handleSearch() {
    var q = document.getElementById('searchInput').value.trim();
    if (q) router.navigate('home', {q:q});
}

function showToast(msg, type) {
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    toast.innerHTML = '<i class="fas fa-'+(type==='error'?'exclamation-circle':type==='success'?'check-circle':'info-circle')+'"></i><span>'+sanitizeHTML(msg)+'</span>';
    container.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
}

function sanitizeHTML(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatNumber(num) {
    if (num >= 1000000) return (num/1000000).toFixed(1)+'M';
    if (num >= 1000) return (num/1000).toFixed(1)+'K';
    return num.toString();
}

function formatTime(sec) {
    if (!sec) return '0:00';
    var m = Math.floor(sec/60);
    var s = Math.floor(sec%60);
    return m+':'+String(s).padStart(2,'0');
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-menu')) document.getElementById('userDropdown').classList.remove('active');
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active,.user-dropdown.active').forEach(function(el) { el.classList.remove('active'); });
    }
});
