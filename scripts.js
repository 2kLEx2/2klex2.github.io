document.addEventListener('DOMContentLoaded', () => {
    console.log('[Lightbox Hint] DOMContentLoaded, overlay hint logic loaded');
    // Periodically hint overlay on gallery items
    const overlayHintKey = 'lightboxHintDismissed';
    let overlayInterval = null;
    function showOverlayHint() {
        if (sessionStorage.getItem(overlayHintKey)) return;
        console.log('[Lightbox Hint] Showing overlay on gallery items');
        document.querySelectorAll('.gallery-item').forEach(item => item.classList.add('show-overlay'));
        setTimeout(() => {
            document.querySelectorAll('.gallery-item').forEach(item => item.classList.remove('show-overlay'));
            console.log('[Lightbox Hint] Overlay removed');
        }, 3000);
    }
    function startOverlayHint() {
        if (sessionStorage.getItem(overlayHintKey)) return;
        showOverlayHint();
        overlayInterval = setInterval(showOverlayHint, 10000);
    }
    function stopOverlayHint() {
        sessionStorage.setItem(overlayHintKey, '1');
        if (overlayInterval) clearInterval(overlayInterval);
        document.querySelectorAll('.gallery-item').forEach(item => item.classList.remove('show-overlay'));
    }
    startOverlayHint();
    // Stop overlay hint when lightbox is opened
    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('.gallery-item');
        if (target && !sessionStorage.getItem(overlayHintKey)) {
            stopOverlayHint();
        }
    }, true);

    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const welcomeText = document.querySelector('.welcome h1');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    const galleryContainer = document.getElementById('gallery');
    if (galleryContainer) {
        loadGallery();
    }

    window.addEventListener('scroll', () => {
        if (welcomeText) {
            const fadeValue = 1 - window.scrollY / 200;
            welcomeText.style.opacity = fadeValue > 0 ? fadeValue : 0;
        }
    });

    const backToTopBtn = document.getElementById("backToTop");
    window.addEventListener("scroll", () => {
        backToTopBtn.style.display = window.scrollY > 300 ? "block" : "none";
    });
    backToTopBtn?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ✅ Dropdown toggle (iOS/mobile safe)
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const content = dropdown.querySelector('.dropdown-content');

        if (toggle && content) {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                content.classList.toggle('show-dropdown');
            });

            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target) && !content.contains(e.target)) {
                    content.classList.remove('show-dropdown');
                }
            });
        }
    });
});

// ✅ Load gallery images
async function loadGallery() {
    const galleryContainer = document.getElementById('gallery');
    const urlParams = new URLSearchParams(window.location.search);
    const galleryType = urlParams.get('type') || 'main';
    const materialFilter = urlParams.get('material'); // 'paper' or 'canvas'

    try {
        const responseImages = await fetch('list.json');
        const dataImages = await responseImages.json();
        const images = dataImages.images[galleryType];

        if (!images) {
            galleryContainer.innerHTML = `<p style="color:white;text-align:center;">No gallery data found for type: <strong>${galleryType}</strong></p>`;
            return;
        }

        const responseDescriptions = await fetch('index.json');
        const descriptionsArray = await responseDescriptions.json();
        // Convert array to object for fast lookup by title
        const descriptions = {};
        descriptionsArray.forEach(desc => {
            if (desc.title) {
                descriptions[desc.title.trim()] = desc;
            }
        });

        for (const category in images) {
            const description = descriptions[category] || {};
            const technique = (description.technique || '').toLowerCase();

            // Use last keyword (after "on ") as dominant material
            const materialMatch = technique.match(/on\s+(canvas|paper)\b/);
            const material = materialMatch ? materialMatch[1] : null;

            if (materialFilter && material !== materialFilter) {
                continue;
            }

            // ❗️Apply material filter if provided
            if (materialFilter && !technique.includes(materialFilter)) {
                continue;
            }

            const imageSet = images[category];
            const availableFiles = Object.keys(imageSet);
            const previewCandidates = availableFiles.filter(name => /preview\.(webp|jpg|jpeg|png)$/i.test(name));
            if (previewCandidates.length === 0) continue;

            previewCandidates.sort((a, b) => a.toLowerCase().endsWith('.webp') ? -1 : 1);
            const previewFile = previewCandidates[0];
            const folder = encodeURIComponent(category);
            const fileBase = previewFile.replace(/\.(webp|jpg|jpeg|png)$/i, '');

            const baseMatchRegex = new RegExp(`^${fileBase}\\.(webp|jpg|jpeg|png)$`, 'i');
            const matchingFiles = availableFiles.filter(name => baseMatchRegex.test(name));
            matchingFiles.sort((a, b) => a.toLowerCase().endsWith('.webp') ? -1 : 1);

            let fallbackIndex = 0;
            const itemContainer = document.createElement('div');
            itemContainer.classList.add('gallery-item-container');

            const imgElement = document.createElement('img');
            imgElement.alt = category;
            imgElement.loading = "lazy";
            imgElement.classList.add('gallery-item', 'reflect');
            imgElement.dataset.category = category;
            imgElement.dataset.slides = JSON.stringify(imageSet);
            imgElement.dataset.type = galleryType;
            
            // Calculate image count for indicator
            const imageCount = Object.keys(imageSet).filter(name => /\.(webp|jpg|jpeg|png)$/i.test(name)).length;

            const tryLoad = () => {
                if (fallbackIndex >= matchingFiles.length) {
                    console.warn(`All image formats failed for: ${category}`);
                    imgElement.remove();
                    return;
                }
                const fileName = matchingFiles[fallbackIndex++];
                const pathPrefix = galleryType === 'adventcalender' ? 'images/adventcalender' : 'images/main';
                imgElement.src = `${pathPrefix}/${folder}/${encodeURIComponent(fileName)}`;
            };

            imgElement.onerror = tryLoad;
            tryLoad();

            const textElement = document.createElement('div');
            textElement.classList.add('gallery-description');
            
            // Add sold status to description if item is sold
            const soldStatus = description.sold ? '<p class="sold-status">SOLD</p>' : '';
            
            textElement.innerHTML = `
                <h3>${description.title || category}</h3>
                <p><strong>Size:</strong> ${description.size || 'Unknown'}</p>
                <p><strong>Date:</strong> ${description.date || 'Unknown'}</p>
                <p><strong>Technique:</strong> ${description.technique || 'Unknown'}</p>
                ${soldStatus}
            `;
            
            // We'll add the sold flag after the image wrapper is created

            itemContainer.appendChild(imgElement);
            itemContainer.appendChild(textElement);
            
            // Create a wrapper for the image regardless of count
            const imageWrapper = document.createElement('div');
            imageWrapper.classList.add('image-wrapper');
            
            // Replace the image with the wrapper
            imgElement.parentNode.insertBefore(imageWrapper, imgElement);
            imageWrapper.appendChild(imgElement);
            
            // Add sold flag to the image wrapper if the item is sold
            if (description.sold) {
                const soldFlag = document.createElement('div');
                soldFlag.classList.add('sold-flag');
                soldFlag.textContent = 'SOLD';
                imageWrapper.appendChild(soldFlag);
            }
            
            // Add indicator for multiple images if there are more than one image
            if (imageCount > 1) {
                const indicatorContainer = document.createElement('div');
                indicatorContainer.classList.add('gallery-indicator');
                
                // Create dots based on number of images (max 5 dots)
                const dotsToShow = Math.min(imageCount, 5);
                for (let i = 0; i < dotsToShow; i++) {
                    const dot = document.createElement('span');
                    dot.classList.add('gallery-dot');
                    indicatorContainer.appendChild(dot);
                }
                
                // Add click event to the indicator to open lightbox
                indicatorContainer.addEventListener('click', function(event) {
                    // Prevent the click from propagating to parent elements
                    event.stopPropagation();
                    
                    // Trigger the same click event as clicking on the image
                    imgElement.click();
                });
                
                // Highlight the first dot to indicate it's the current image
                indicatorContainer.firstChild?.classList.add('active');
                
                // Add the indicator to the existing image wrapper
                imageWrapper.appendChild(indicatorContainer);
            }
            
            galleryContainer.appendChild(itemContainer);
        }

        setupLightbox();
        
        // Start preloading all gallery images in the background
        setTimeout(() => preloadGalleryImages(images), 2000);
    } catch (error) {
        console.error('Error loading gallery images or descriptions:', error);
    }
}

// Preload all gallery images in the background with low priority
function preloadGalleryImages(images) {
    // Create a queue of images to preload
    const preloadQueue = [];
    
    // Add all images to the queue
    for (const category in images) {
        const imageSet = images[category];
        const availableFiles = Object.keys(imageSet);
        
        // Prioritize preview images first
        const previewImages = availableFiles.filter(name => /preview\.(webp|jpg|jpeg|png)$/i.test(name));
        const otherImages = availableFiles.filter(name => !/preview\.(webp|jpg|jpeg|png)$/i.test(name));
        
        // Add to queue with proper path construction
        [...previewImages, ...otherImages].forEach(fileName => {
            const folder = encodeURIComponent(category);
            const galleryType = document.querySelector(`.gallery-item[data-category="${category}"]`)?.dataset.type || 'main';
            const pathPrefix = galleryType === 'adventcalender' ? 'images/adventcalender' : 'images/main';
            preloadQueue.push(`${pathPrefix}/${folder}/${encodeURIComponent(fileName)}`);
        });
    }
    
    // Process queue with delay to avoid blocking main thread
    let index = 0;
    function processNext() {
        if (index >= preloadQueue.length) return;
        
        const img = new Image();
        img.importance = 'low'; // Mark as low priority
        img.loading = 'lazy'; // Use browser's lazy loading
        img.src = preloadQueue[index++];
        
        // Process next image after a small delay
        setTimeout(processNext, 100);
    }
    
    // Start processing queue
    processNext();
}

// ✅ Lightbox with swipe & fallback
function setupLightbox() {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.querySelector(".lightbox-img");
    const closeBtn = document.querySelector(".close-btn");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const dotContainer = document.getElementById('lightbox-dots');
    const loadingSpinner = document.querySelector('.loading-spinner');

    let slideFiles = [];
    let currentSlideIndex = 0;
    let matchingFiles = [];
    let fallbackIndex = 0;

    function updateDots() {
        dotContainer.innerHTML = '';
        slideFiles.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('lightbox-dot');
            if (index === currentSlideIndex) dot.classList.add('active');
            dot.addEventListener('click', () => {
                currentSlideIndex = index;
                showCurrentSlide();
            });
            dotContainer.appendChild(dot);
        });
    }

    function tryLoadImage() {
        if (fallbackIndex >= matchingFiles.length) {
            console.warn(`All formats failed for: ${slideFiles[currentSlideIndex].fullName}`);
            lightboxImg.src = '';
            loadingSpinner.classList.add('hidden');
            return;
        }

        // Show loading spinner
        loadingSpinner.classList.remove('hidden');
        lightboxImg.classList.add('hidden');
        
        const fileName = matchingFiles[fallbackIndex++];
        const folder = encodeURIComponent(slideFiles[currentSlideIndex].category);
        const galleryType = document.querySelector(`.gallery-item[data-category="${slideFiles[currentSlideIndex].category}"]`)?.dataset.type || 'main';
        const pathPrefix = galleryType === 'adventcalender' ? 'images/adventcalender' : 'images/main';
        lightboxImg.src = `${pathPrefix}/${folder}/${encodeURIComponent(fileName)}`;
    }

    function showCurrentSlide() {
        const current = slideFiles[currentSlideIndex];
        const imageSet = JSON.parse(document.querySelector(`.gallery-item[data-category="${current.category}"]`).dataset.slides);
        const availableFiles = Object.keys(imageSet);
        const baseName = current.fullName.replace(/\.(webp|jpg|jpeg|png)$/i, '');
        const baseMatchRegex = new RegExp(`^${baseName}\\.(webp|jpg|jpeg|png)$`, 'i');
        matchingFiles = availableFiles.filter(name => baseMatchRegex.test(name));
        matchingFiles.sort((a, b) => a.toLowerCase().endsWith('.webp') ? -1 : 1);
        fallbackIndex = 0;
        tryLoadImage();
        updateDots();
        
        // Preload next and previous images
        preloadAdjacentImages();
    }
    
    function preloadAdjacentImages() {
        if (slideFiles.length <= 1) return;
        
        // Calculate next and previous indices
        const nextIndex = (currentSlideIndex + 1) % slideFiles.length;
        const prevIndex = (currentSlideIndex - 1 + slideFiles.length) % slideFiles.length;
        
        // Preload next image
        preloadImage(nextIndex);
        
        // Preload previous image
        preloadImage(prevIndex);
    }
    
    function preloadImage(index) {
        const slideToPreload = slideFiles[index];
        const imageSet = JSON.parse(document.querySelector(`.gallery-item[data-category="${slideToPreload.category}"]`).dataset.slides);
        const availableFiles = Object.keys(imageSet);
        const baseName = slideToPreload.fullName.replace(/\.(webp|jpg|jpeg|png)$/i, '');
        const baseMatchRegex = new RegExp(`^${baseName}\\.(webp|jpg|jpeg|png)$`, 'i');
        const filesToPreload = availableFiles.filter(name => baseMatchRegex.test(name));
        filesToPreload.sort((a, b) => a.toLowerCase().endsWith('.webp') ? -1 : 1);
        
        if (filesToPreload.length > 0) {
            const preloadImg = new Image();
            const fileName = filesToPreload[0];
            const folder = encodeURIComponent(slideToPreload.category);
            const galleryType = document.querySelector(`.gallery-item[data-category="${slideToPreload.category}"]`)?.dataset.type || 'main';
            const pathPrefix = galleryType === 'adventcalender' ? 'images/adventcalender' : 'images/main';
            preloadImg.src = `${pathPrefix}/${folder}/${encodeURIComponent(fileName)}`;
        }
    }

    document.querySelectorAll(".gallery-item").forEach(img => {
        img.addEventListener("click", () => {
            const category = img.dataset.category;
            const galleryType = img.dataset.type || 'main';
            const imageSet = JSON.parse(img.dataset.slides);
            const availableFiles = Object.keys(imageSet);
            
            // Always include 'preview' first if it exists
            let all = [];

            if (galleryType === 'adventcalender') {
                // Load all image files regardless of naming
                all = availableFiles.filter(name => /\.(webp|jpg|jpeg|png)$/i.test(name));
                all.sort((a, b) => a.toLowerCase().endsWith('.webp') ? -1 : 1);
            } else {
                // Original logic for other types
                const preview = availableFiles.find(name =>
                    /preview\.(webp|jpg|jpeg|png)$/i.test(name)
                );

                const slides = availableFiles.filter(name => /slide/i.test(name));
                const mcImages = availableFiles.filter(name =>
                    /_mc\.(webp|jpg|jpeg|png)$/i.test(name)
                );

                const rest = [...slides, ...mcImages].filter(name => name !== preview);
                rest.sort((a, b) => a.toLowerCase().endsWith('.webp') ? -1 : 1);
                all = preview ? [preview, ...rest] : rest;
            }


            slideFiles = all.map(file => ({ fullName: file, category }));
            currentSlideIndex = 0;
            showCurrentSlide();
            lightbox.classList.remove("hidden");
            
            // Disable scrolling on the body when lightbox is open
            document.body.style.overflow = 'hidden';
        });
    });

    lightboxImg.onerror = tryLoadImage;
    
    // Hide spinner and show image when loading completes
    lightboxImg.onload = function() {
        loadingSpinner.classList.add('hidden');
        lightboxImg.classList.remove('hidden');
    };

    closeBtn.addEventListener("click", () => {
        lightbox.classList.add("hidden");
        lightboxImg.src = '';
        // Re-enable scrolling when lightbox is closed
        document.body.style.overflow = '';
    });

    function animateLightbox(direction) {
        // Remove any existing animation classes
        lightboxImg.classList.remove('slide-left', 'slide-right');
        // Force reflow to restart animation if needed
        void lightboxImg.offsetWidth;
        // Add the new animation class
        lightboxImg.classList.add(direction === 'left' ? 'slide-left' : 'slide-right');
        // Remove the class after animation ends (so it can be reused)
        lightboxImg.addEventListener('animationend', function handler() {
            lightboxImg.classList.remove('slide-left', 'slide-right');
            lightboxImg.removeEventListener('animationend', handler);
        });
    }

    prevBtn.addEventListener("click", () => {
        if (slideFiles.length > 0) {
            currentSlideIndex = (currentSlideIndex - 1 + slideFiles.length) % slideFiles.length;
            animateLightbox('left');
            showCurrentSlide();
        }
    });

    nextBtn.addEventListener("click", () => {
        if (slideFiles.length > 0) {
            currentSlideIndex = (currentSlideIndex + 1) % slideFiles.length;
            animateLightbox('right');
            showCurrentSlide();
        }
    });

    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            lightbox.classList.add("hidden");
            lightboxImg.src = '';
            // Re-enable scrolling when lightbox is closed by clicking outside
            document.body.style.overflow = '';
        }
    });

    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    });

    function handleSwipeGesture() {
        const swipeThreshold = 50;
        const distance = touchEndX - touchStartX;
        if (distance > swipeThreshold) {
            animateLightbox('left');
            prevBtn.click();
        } else if (distance < -swipeThreshold) {
            animateLightbox('right');
            nextBtn.click();
        }
    }
}


