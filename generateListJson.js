const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, 'images'); // Adjust if needed
const OUTPUT_FILE = path.join(__dirname, 'list.json');

function getImagesByCategory(baseDir) {
    const result = {};
    const categories = fs.readdirSync(baseDir, { withFileTypes: true });

    for (const entry of categories) {
        if (entry.isDirectory()) {
            const folderPath = path.join(baseDir, entry.name);
            const files = fs.readdirSync(folderPath).filter(file =>
                /\.(jpe?g|png|webp)$/i.test(file)
            );
            const fileMap = {};
            for (const file of files) {
                fileMap[file] = 'file';
            }
            result[entry.name] = fileMap;
        }
    }

    return result;
}

function generateListJson() {
    const mainDir = path.join(ROOT_DIR, 'main');
    const adventDir = path.join(ROOT_DIR, 'adventcalender');

    const output = {
        images: {
            main: fs.existsSync(mainDir) ? getImagesByCategory(mainDir) : {},
            adventcalender: fs.existsSync(adventDir) ? getImagesByCategory(adventDir) : {}
        }
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
    console.log(`✅ list.json has been generated at: ${OUTPUT_FILE}`);
}

generateListJson();
