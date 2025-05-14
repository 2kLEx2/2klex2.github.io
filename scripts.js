document.addEventListener('DOMContentLoaded', () => {
    // Check if menuToggle exists before adding event listener
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const welcomeText = document.querySelector(".welcome h1");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // Image Gallery Loading
    const galleryContainer = document.getElementById('gallery');
    if (galleryContainer) {
        loadGallery();
    }

    // ✅ Add the Scroll Event Inside DOMContentLoaded
    window.addEventListener("scroll", () => {
        if (welcomeText) { // ✅ Check if element exists
            let scrollY = window.scrollY; // Get scroll position
            let fadeValue = 1 - scrollY / 200; // Adjust fade effect

            welcomeText.style.opacity = fadeValue > 0 ? fadeValue : 0; // Ensure opacity doesn't go negative
        }
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

        console.log('Images categories:', Object.keys(images));
        console.log('Descriptions:', Object.keys(descriptions));

        for (const category in images) {
            const imageSet = images[category];
            const previewImage = Object.keys(imageSet).find(name => name.includes('preview'));

            if (previewImage) {
                const itemContainer = document.createElement('div');
                itemContainer.classList.add('gallery-item-container');

                const imgElement = document.createElement('img');
                imgElement.src = `images/main/${category}/${previewImage}`;
                imgElement.alt = category;
                imgElement.classList.add('gallery-item', 'reflect');

                // Custom data attribute for category
                imgElement.dataset.category = category;

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
        }

        setupLightbox(); // no need to pass image list anymore

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

    let slideImages = [];
    let currentSlideIndex = 0;

    document.querySelectorAll(".gallery-item").forEach(img => {
        img.addEventListener("click", () => {
            const category = img.dataset.category;
            const previewSrc = img.src;

            const previewFile = previewSrc.split('/').pop();
            const baseName = previewFile.replace(/_preview\.(jpg|JPG|jpeg|png)/, '');

            // Add the preview as first slide
            slideImages = [`images/main/${category}/${baseName}_preview.jpg`];

            // Add slides 1-3
            for (let i = 1; i <= 3; i++) {
                slideImages.push(`images/main/${category}/${baseName}_slide${i}.jpg`);
            }

            currentSlideIndex = 0;
            lightboxImg.src = slideImages[currentSlideIndex];
            lightbox.classList.remove("hidden");
        });
    });

    closeBtn.addEventListener("click", () => lightbox.classList.add("hidden"));

    prevBtn.addEventListener("click", () => {
        if (slideImages.length > 0) {
            currentSlideIndex = (currentSlideIndex - 1 + slideImages.length) % slideImages.length;
            lightboxImg.src = slideImages[currentSlideIndex];
        }
    });

    nextBtn.addEventListener("click", () => {
        if (slideImages.length > 0) {
            currentSlideIndex = (currentSlideIndex + 1) % slideImages.length;
            lightboxImg.src = slideImages[currentSlideIndex];
        }
    });
}



/**
 * Function to parse index.txt into an object with categories as keys
 */
function parseDescriptions(text) {
    const lines = text.split('\n');
    const descriptions = {};
    let currentTitle = '';

    lines.forEach(line => {
        const titleMatch = line.match(/"title":\s*(.*?);/);
        const sizeMatch = line.match(/"maße":\s*(.*?);/);
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

// Back to Top Button Logic
const backToTopBtn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
});

backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
