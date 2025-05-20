// scripts.js - Fully Rewritten & Fixed

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
            let scrollY = window.scrollY;
            let fadeValue = 1 - scrollY / 200;
            welcomeText.style.opacity = fadeValue > 0 ? fadeValue : 0;
        }
    });

    const backToTopBtn = document.getElementById("backToTop");
    window.addEventListener("scroll", () => {
        backToTopBtn.style.display = window.scrollY > 300 ? "block" : "none";
    });
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

async function loadGallery() {
    const galleryContainer = document.getElementById('gallery');

    try {
        const responseImages = await fetch('list.json');
        const dataImages = await responseImages.json();
        const images = dataImages.images.main;

        const responseDescriptions = await fetch('index.txt');
        const textDescriptions = await responseDescriptions.text();
        const descriptions = parseDescriptions(textDescriptions);

        for (const category in images) {
            const imageSet = images[category];
            const previewFile = Object.keys(imageSet).find(name => name.toLowerCase().includes('preview'));

            if (!previewFile) continue;

            const folder = encodeURIComponent(category);
            const fileBase = previewFile.replace(/\.(webp|jpg|jpeg|png)$/i, '');
            const fallbackExtensions = ['webp', 'jpg', 'png'];
            let fallbackIndex = 0;

            const itemContainer = document.createElement('div');
            itemContainer.classList.add('gallery-item-container');

            const imgElement = document.createElement('img');
            imgElement.alt = category;
            imgElement.loading = "lazy";
            imgElement.classList.add('gallery-item', 'reflect');
            imgElement.dataset.category = category;
            imgElement.dataset.basename = fileBase;
            imgElement.dataset.slides = JSON.stringify(imageSet);

            const tryLoad = () => {
                if (fallbackIndex >= fallbackExtensions.length) {
                    console.warn(`All image formats failed for: ${category}`);
                    imgElement.remove();
                    return;
                }
                const ext = fallbackExtensions[fallbackIndex++];
                imgElement.src = `images/main/${folder}/${fileBase}.${ext}`;
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

function setupLightbox() {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.querySelector(".lightbox-img");
    const closeBtn = document.querySelector(".close-btn");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    let slideFiles = [];
    let currentSlideIndex = 0;
    let fallbackExtensions = ['webp', 'jpg', 'png'];
    let fallbackIndex = 0;

    function tryLoadImage() {
        if (fallbackIndex >= fallbackExtensions.length) {
            console.warn(`All formats failed for: ${slideFiles[currentSlideIndex].file}`);
            lightboxImg.src = '';
            return;
        }

        const ext = fallbackExtensions[fallbackIndex++];
        const folder = encodeURIComponent(slideFiles[currentSlideIndex].category);
        const base = slideFiles[currentSlideIndex].file.replace(/\.(webp|jpg|jpeg|png)$/i, '');
        lightboxImg.src = `images/main/${folder}/${base}.${ext}`;
    }

    document.querySelectorAll(".gallery-item").forEach(img => {
        img.addEventListener("click", () => {
            const category = img.dataset.category;
            const imageSet = JSON.parse(img.dataset.slides);

            slideFiles = Object.keys(imageSet)
                .filter(name => name.toLowerCase().includes('slide') || name.toLowerCase().includes('preview'))
                .sort()
                .map(file => ({ file, category }));

            currentSlideIndex = 0;
            fallbackIndex = 0;
            tryLoadImage();
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
            fallbackIndex = 0;
            tryLoadImage();
        }
    });

    nextBtn.addEventListener("click", () => {
        if (slideFiles.length > 0) {
            currentSlideIndex = (currentSlideIndex + 1) % slideFiles.length;
            fallbackIndex = 0;
            tryLoadImage();
        }
    });

    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            lightbox.classList.add("hidden");
            lightboxImg.src = '';
        }
    });
}

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
