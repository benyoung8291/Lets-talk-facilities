/* ============================================
   LET'S TALK FACILITIES - App Logic
   - Scroll animations (Intersection Observer)
   - Vertical video carousel with auto-play/pause
   - Netflix watch page interactions
   - Navigation
   ============================================ */

(function () {
    'use strict';

    // -------------------------
    // Navigation
    // -------------------------
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    // Scroll-based nav styling
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    }, { passive: true });

    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('open');
            navLinks.classList.toggle('open');
        });

        // Close mobile menu on link click
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('open');
                navLinks.classList.remove('open');
            });
        });
    }

    // -------------------------
    // Scroll Animations
    // -------------------------
    const animateObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                animateObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    // Observe hero animations on load
    document.querySelectorAll('.animate-in').forEach(el => {
        animateObserver.observe(el);
    });

    // Observe scroll-triggered animations
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        animateObserver.observe(el);
    });

    // -------------------------
    // Vertical Video Carousel
    // -------------------------
    const carousel = document.getElementById('shortsCarousel');
    const carouselLeft = document.getElementById('carouselLeft');
    const carouselRight = document.getElementById('carouselRight');
    const carouselDotsContainer = document.getElementById('carouselDots');

    if (carousel) {
        const cards = carousel.querySelectorAll('.short-card');
        let activePlayer = null;
        let activeCard = null;

        // Create dots
        const totalDots = Math.ceil(cards.length / 3);
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            dot.setAttribute('aria-label', `Go to group ${i + 1}`);
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                const scrollTarget = cards[i * 3];
                if (scrollTarget) {
                    scrollTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            });
            carouselDotsContainer.appendChild(dot);
        }

        // Update dots on scroll
        carousel.addEventListener('scroll', () => {
            const scrollLeft = carousel.scrollLeft;
            const cardWidth = cards[0].offsetWidth + 20; // gap
            const activeIndex = Math.round(scrollLeft / (cardWidth * 3));
            carouselDotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === activeIndex);
            });
        }, { passive: true });

        // Arrow navigation
        if (carouselLeft) {
            carouselLeft.addEventListener('click', () => {
                carousel.scrollBy({ left: -300, behavior: 'smooth' });
            });
        }

        if (carouselRight) {
            carouselRight.addEventListener('click', () => {
                carousel.scrollBy({ left: 300, behavior: 'smooth' });
            });
        }

        // Pause active video
        function pauseActiveVideo() {
            if (activePlayer) {
                try {
                    activePlayer.contentWindow.postMessage(
                        JSON.stringify({ event: 'command', func: 'pauseVideo' }),
                        '*'
                    );
                } catch (e) { /* cross-origin safety */ }
            }
            if (activeCard) {
                activeCard.classList.remove('is-playing', 'is-active');
            }
            activePlayer = null;
            activeCard = null;
        }

        // Load and play video in a card
        function playCard(card) {
            const videoId = card.dataset.videoId;
            if (!videoId) return;

            // Pause current
            pauseActiveVideo();

            const container = card.querySelector('.short-iframe-container');

            // If iframe already exists, just play
            let iframe = container.querySelector('iframe');
            if (iframe) {
                try {
                    iframe.contentWindow.postMessage(
                        JSON.stringify({ event: 'command', func: 'playVideo' }),
                        '*'
                    );
                } catch (e) { /* cross-origin safety */ }
            } else {
                // Create iframe
                iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1&playsinline=1`;
                iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                iframe.setAttribute('allowfullscreen', '');
                iframe.setAttribute('frameborder', '0');
                container.appendChild(iframe);
            }

            card.classList.add('is-playing', 'is-active');
            activePlayer = iframe;
            activeCard = card;
        }

        // Click to play
        cards.forEach(card => {
            card.addEventListener('click', () => {
                if (card === activeCard) {
                    // Toggle pause/play
                    pauseActiveVideo();
                } else {
                    playCard(card);
                }
            });
        });

        // Intersection Observer: auto-pause when scrolling away from section
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    pauseActiveVideo();
                }
            });
        }, {
            threshold: 0.2
        });

        const shortsSection = document.querySelector('.shorts-section');
        if (shortsSection) {
            sectionObserver.observe(shortsSection);
        }

        // Carousel scroll: auto-pause when card scrolls out of center view
        let scrollTimer = null;
        carousel.addEventListener('scroll', () => {
            if (scrollTimer) clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                if (!activeCard) return;

                const carouselRect = carousel.getBoundingClientRect();
                const cardRect = activeCard.getBoundingClientRect();
                const cardCenter = cardRect.left + cardRect.width / 2;
                const carouselCenter = carouselRect.left + carouselRect.width / 2;
                const distance = Math.abs(cardCenter - carouselCenter);

                // If active card is too far from center, pause
                if (distance > carouselRect.width * 0.4) {
                    pauseActiveVideo();
                }
            }, 150);
        }, { passive: true });

        // Touch/swipe support for better mobile UX
        let touchStartX = 0;
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;

            // If significant swipe, auto-pause
            if (Math.abs(diff) > 50 && activeCard) {
                setTimeout(() => {
                    const carouselRect = carousel.getBoundingClientRect();
                    const cardRect = activeCard.getBoundingClientRect();
                    const cardCenter = cardRect.left + cardRect.width / 2;
                    const carouselCenter = carouselRect.left + carouselRect.width / 2;
                    const distance = Math.abs(cardCenter - carouselCenter);

                    if (distance > carouselRect.width * 0.35) {
                        pauseActiveVideo();
                    }
                }, 300);
            }
        }, { passive: true });
    }

    // -------------------------
    // Watch Page: Card Click -> Load in Hero Player
    // -------------------------
    const watchCards = document.querySelectorAll('.watch-card');
    const mainPlayer = document.getElementById('mainPlayer');
    const watchTitle = document.getElementById('watchTitle');
    const watchDesc = document.getElementById('watchDesc');
    const watchHeroBg = document.getElementById('watchHeroBg');

    if (watchCards.length && mainPlayer) {
        watchCards.forEach(card => {
            card.addEventListener('click', () => {
                const videoId = card.dataset.videoId;
                const title = card.dataset.title;
                const desc = card.dataset.desc;

                if (!videoId) return;

                // Update player
                mainPlayer.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1`;

                // Update info
                if (watchTitle) watchTitle.textContent = title || '';
                if (watchDesc) watchDesc.textContent = desc || '';

                // Update background
                if (watchHeroBg) {
                    const bgImg = watchHeroBg.querySelector('img');
                    if (bgImg) {
                        bgImg.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                    }
                }

                // Scroll to player
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Highlight active card
                watchCards.forEach(c => c.style.opacity = '');
                card.style.opacity = '0.7';
            });
        });
    }

    // -------------------------
    // Keyboard navigation for carousel
    // -------------------------
    document.addEventListener('keydown', (e) => {
        if (!carousel) return;
        const carouselRect = carousel.getBoundingClientRect();
        const isInView = carouselRect.top < window.innerHeight && carouselRect.bottom > 0;

        if (!isInView) return;

        if (e.key === 'ArrowLeft') {
            carousel.scrollBy({ left: -300, behavior: 'smooth' });
        } else if (e.key === 'ArrowRight') {
            carousel.scrollBy({ left: 300, behavior: 'smooth' });
        }
    });

})();
