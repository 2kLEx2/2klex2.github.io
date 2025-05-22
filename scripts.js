document.addEventListener('DOMContentLoaded', () => {
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

    try {
        const responseImages = await fetch('list.json');
        const dataImages = await responseImages.json();
        const images = dataImages.images[galleryType];

        if (!images) {
            galleryContainer.innerHTML = `<p style="color:white;text-align:center;">No gallery data found for type: <strong>${galleryType}</strong></p>`;
            return;
        }

        const responseDescriptions = await fetch('index.txt');
        const textDescriptions = await responseDescriptions.text();
        const descriptions = parseDescriptions(textDescriptions);

        for (const category in images) {
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

            const description = descriptions[category] || {};
            const textElement = document.createElement('div');
            textElement.classList.add('gallery-description');
            textElement.innerHTML = `
                <h3>${description.title || category}</h3>
                <p><strong>Size:</strong> ${description.size || 'Unknown'}</p>
                <p><strong>Date:</strong> ${description.date || 'Unknown'}</p>
                <p><strong>Technique:</strong> ${description.technique || 'Unknown'}</p>
            `;

            itemContainer.appendChild(imgElement);
            itemContainer.appendChild(textElement);
            galleryContainer.appendChild(itemContainer);
        }

        setupLightbox();
    } catch (error) {
        console.error('Error loading gallery images or descriptions:', error);
    }
}

// ✅ Lightbox with swipe & fallback
function setupLightbox() {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.querySelector(".lightbox-img");
    const closeBtn = document.querySelector(".close-btn");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    let slideFiles = [];
    let currentSlideIndex = 0;
    let matchingFiles = [];
    let fallbackIndex = 0;

    function tryLoadImage() {
        if (fallbackIndex >= matchingFiles.length) {
            console.warn(`All formats failed for: ${slideFiles[currentSlideIndex].fullName}`);
            lightboxImg.src = '';
            return;
        }

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
    }

    document.querySelectorAll(".gallery-item").forEach(img => {
        img.addEventListener("click", () => {
            const category = img.dataset.category;
            const galleryType = img.dataset.type || 'main';
            const imageSet = JSON.parse(img.dataset.slides);
            const availableFiles = Object.keys(imageSet);
            let all = [];

            if (galleryType === 'adventcalender') {
                const preview = availableFiles.find(name => /preview\.(webp|jpg|jpeg|png)$/i.test(name));
                const rest = availableFiles.filter(name => name !== preview);
                rest.sort((a, b) => a.toLowerCase().endsWith('.webp') ? -1 : 1);
                all = preview ? [preview, ...rest] : rest;
            } else {
                const slides = availableFiles.filter(name => /slide/i.test(name));
                const mcImages = availableFiles.filter(name => /_mc\.(webp|jpg|jpeg|png)$/i.test(name));
                all = [...slides, ...mcImages];
            }

            slideFiles = all.map(file => ({ fullName: file, category }));
            currentSlideIndex = 0;
            showCurrentSlide();
            lightbox.classList.remove("hidden");
        });
    });

    lightboxImg.onerror = tryLoadImage;

    closeBtn.addEventListener("click", () => {
        lightbox.classList.add("hidden");
        lightboxImg.src = '';
    });

    prevBtn.addEventListener("click", () => {
        if (slideFiles.length > 0) {
            currentSlideIndex = (currentSlideIndex - 1 + slideFiles.length) % slideFiles.length;
            showCurrentSlide();
        }
    });

    nextBtn.addEventListener("click", () => {
        if (slideFiles.length > 0) {
            currentSlideIndex = (currentSlideIndex + 1) % slideFiles.length;
            showCurrentSlide();
        }
    });

    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            lightbox.classList.add("hidden");
            lightboxImg.src = '';
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
        if (distance > swipeThreshold) prevBtn.click();
        else if (distance < -swipeThreshold) nextBtn.click();
    }
}

// ✅ Parse index.txt description format
function parseDescriptions(text) {
    const lines = text.split('\n');
    const descriptions = {};
    let currentTitle = '';

    lines.forEach(line => {
        const titleMatch = line.match(/"title":\s*(.*?);/);
        const sizeMatch = line.match(/"ma\u00dfe":\s*(.*?);/);
        const dateMatch = line.match(/"datum":\s*(.*?);/);
        const techMatch = line.match(/"tech":\s*(.*?);/);

        if (titleMatch) {
            currentTitle = titleMatch[1].trim();
            descriptions[currentTitle] = { title: currentTitle };
        } else if (sizeMatch && currentTitle) {
            descriptions[currentTitle].size = sizeMatch[1].trim();
        } else if (dateMatch && currentTitle) {
            descriptions[currentTitle].date = dateMatch[1].trim();
        } else if (techMatch && currentTitle) {
            descriptions[currentTitle].technique = techMatch[1].trim();
        }
    });

    return descriptions;
}
