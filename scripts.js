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
        // Load images from list.json
        const responseImages = await fetch('list.json');
        const dataImages = await responseImages.json();
        const images = dataImages.images.main;

        // Load descriptions from index.txt
        const responseDescriptions = await fetch('index.txt');
        const textDescriptions = await responseDescriptions.text();
        const descriptions = parseDescriptions(textDescriptions);

        for (const category in images) {
            const imageSet = images[category];
            const previewImage = Object.keys(imageSet).find(name => name.includes('preview'));

            if (previewImage) {
                // Create a container for image + description
                const itemContainer = document.createElement('div');
                itemContainer.classList.add('gallery-item-container');

                // Create image element
                const imgElement = document.createElement('img');
                imgElement.src = `images/main/${category}/${previewImage}`;
                imgElement.alt = category;
                imgElement.classList.add('gallery-item');

                // Create description text
                const description = descriptions[category] || {}; // Get matching description
                const textElement = document.createElement('div');
                textElement.classList.add('gallery-description');
                textElement.innerHTML = `
                    <h3>${description.title || category}</h3>
                    <p><strong>Size:</strong> ${description.size || 'Unknown'}</p>
                    <p><strong>Date:</strong> ${description.date || 'Unknown'}</p>
                    <p><strong>Technique:</strong> ${description.technique || 'Unknown'}</p>
                `;

                // Append image and description
                itemContainer.appendChild(imgElement);
                itemContainer.appendChild(textElement);
                galleryContainer.appendChild(itemContainer);
            }
        }
    } catch (error) {
        console.error('Error loading gallery images or descriptions:', error);
    }
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

