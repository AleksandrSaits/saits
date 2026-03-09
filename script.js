// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

if (themeToggle) {
    const themeIcon = themeToggle.querySelector('i');
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        body.classList.add('dark-theme');
        if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        if (body.classList.contains('dark-theme')) {
            if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });
}

// ===== MOBILE MENU =====
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    });
}

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// ===== ACTIVE NAV LINK =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        if (scrollY >= section.offsetTop - 200) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
});

// ===== TYPING EFFECT =====
const typingText = document.getElementById('typingText');
const words = ['Веб-разработчик', 'Фронтенд-разработчик', 'UI/UX энтузиаст', 'JavaScript разработчик'];
let wordIndex = 0, charIndex = 0, isDeleting = false;

if (typingText) {
    function type() {
        const currentWord = words[wordIndex];
        typingText.textContent = isDeleting 
            ? currentWord.substring(0, charIndex - 1) 
            : currentWord.substring(0, charIndex + 1);
        charIndex += isDeleting ? -1 : 1;
        let typeSpeed = isDeleting ? 50 : 100;
        if (!isDeleting && charIndex === currentWord.length) { typeSpeed = 2000; isDeleting = true; }
        else if (isDeleting && charIndex === 0) { isDeleting = false; wordIndex = (wordIndex + 1) % words.length; typeSpeed = 500; }
        setTimeout(type, typeSpeed);
    }
    setTimeout(type, 1000);
    const cursorSpan = document.createElement('span');
    cursorSpan.className = 'typing-cursor';
    cursorSpan.textContent = '|';
    typingText.appendChild(cursorSpan);
}

// ===== COUNTER ANIMATION =====
const counters = document.querySelectorAll('.stat-number');
const animateCounters = () => {
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;
        if (count < target) {
            counter.innerText = Math.ceil(count + target / 200);
            setTimeout(animateCounters, 20);
        } else counter.innerText = target + '+';
    });
};
let countersAnimated = false;
const heroSection = document.querySelector('.hero');
if (heroSection) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersAnimated) { animateCounters(); countersAnimated = true; }
        });
    }, { threshold: 0.5 });
    observer.observe(heroSection);
}

// ===== SKILL BARS =====
const skillBars = document.querySelectorAll('.progress-bar');
const skillsSection = document.querySelector('.skills');
if (skillsSection) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                skillBars.forEach(bar => bar.style.width = bar.getAttribute('data-progress') + '%');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    observer.observe(skillsSection);
}

// ===== PROJECT FILTER =====
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        projectCards.forEach(card => {
            if (filter === 'all' || card.getAttribute('data-category') === filter) {
                card.style.display = 'block';
                setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 10);
            } else {
                card.style.opacity = '0'; card.style.transform = 'scale(0.8)';
                setTimeout(() => card.style.display = 'none', 300);
            }
        });
    });
});

// ===== MODAL WINDOW =====
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const telegramLink = document.getElementById('telegramLink');
const gmailLink = document.getElementById('gmailLink');
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        if (modalOverlay) modalOverlay.classList.add('active');
        if (telegramLink) {
            const telegramText = encodeURIComponent(`Привет! Меня зовут ${name}.\n\nEmail: ${email}\n\nСообщение:\n${message}`);
            telegramLink.href = `https://t.me/Lufiuz?text=${telegramText}`;
        }
        if (gmailLink) {
            const subject = encodeURIComponent(`Новое сообщение от ${name}`);
            const body = encodeURIComponent(`Имя: ${name}\nEmail: ${email}\n\n${message}`);
            gmailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=boombl4you@gmail.com&su=${subject}&body=${body}`;
        }
    });
}
if (modalClose && modalOverlay) modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('active'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalOverlay.classList.contains('active')) modalOverlay.classList.remove('active'); });
}

// ===== CUSTOM CURSOR =====
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');
if (cursor && cursorFollower && window.innerWidth > 640) {
    let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0, followerX = 0, followerY = 0;
    document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.2; cursorY += (mouseY - cursorY) * 0.2;
        followerX += (mouseX - followerX) * 0.1; followerY += (mouseY - followerY) * 0.1;
        cursor.style.left = cursorX + 'px'; cursor.style.top = cursorY + 'px';
        cursorFollower.style.left = followerX + 'px'; cursorFollower.style.top = followerY + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    document.querySelectorAll('a, button, .project-card, .skill-card').forEach(el => {
        el.addEventListener('mouseenter', () => { cursor.classList.add('hover'); cursorFollower.classList.add('hover'); });
        el.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); cursorFollower.classList.remove('hover'); });
    });
}

// ===== PARTICLES =====
const particlesContainer = document.getElementById('particles');
if (particlesContainer) {
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = particle.style.height = Math.random() * 6 + 2 + 'px';
        particle.style.animationDuration = Math.random() * 10 + 10 + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.background = ['#6366f1', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 3)];
        particlesContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 20000);
    }
    setInterval(createParticle, 500);
    for (let i = 0; i < 20; i++) setTimeout(createParticle, i * 200);
}

// ===== SCROLL PROGRESS =====
const scrollProgress = document.querySelector('.scroll-progress');
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    if (scrollProgress) scrollProgress.style.transform = `scaleX(${scrolled})`;
});

// ===== SMOOTH SCROLL - ИСПРАВЛЕНО ✅ =====
document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    
    const href = anchor.getAttribute('href');
    
    // Пропускаем, если:
    // 1. href пустой или только "#"
    // 2. Это внешняя ссылка (содержит ://)
    // 3. Это ссылка в модальном окне
    if (!href || href === '#' || href.includes('://') || anchor.closest('.modal')) {
        return;
    }
    
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
        window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
    }
});

// ===== MAGNETIC BUTTONS =====
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - rect.left - rect.width/2) * 0.3}px, ${(e.clientY - rect.top - rect.height/2) * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => btn.style.transform = 'translate(0, 0)');
});

// ===== PARALLAX =====
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroImg = document.querySelector('.hero-img');
    const heroBg = document.querySelector('.hero-image-bg');
    if (heroImg && window.innerWidth > 968) heroImg.style.transform = `translateY(${scrolled * 0.3}px)`;
    if (heroBg && window.innerWidth > 968) heroBg.style.transform = `translateY(${scrolled * 0.5}px)`;
});

// ===== SCROLL REVEAL =====
document.querySelectorAll('.skill-card, .project-card, .about-image, .about-text').forEach(el => {
    el.classList.add('fade-in');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    observer.observe(el);
});

// ===== FLOATING CARDS =====
const heroWrapper = document.querySelector('.hero-image-wrapper');
const floatingCards = document.querySelectorAll('.floating-card');
if (heroWrapper) {
    heroWrapper.addEventListener('mousemove', (e) => {
        const rect = heroWrapper.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        floatingCards.forEach((card, i) => card.style.transform = `translate(${x * (i+1) * 20}px, ${y * (i+1) * 20}px)`);
    });
    heroWrapper.addEventListener('mouseleave', () => floatingCards.forEach(card => card.style.transform = 'translate(0, 0)'));
}

console.log('🚀 Website loaded with superpowers!');
