/**
 * Update Sold Status Script
 * 
 * This script helps you mark artworks as sold in the index.json file.
 * To use:
 * 1. Update the soldItems array with the titles of sold artworks
 * 2. Run with Node.js: node update-sold-status.js
 */

const fs = require('fs');
const path = require('path');

// List of artwork titles that are sold
const soldItems = [
    "Fuchs",
    "Studie l",
    "Mount Ama Dablam",
    "Chiemsee",
    "Tropfen",
    "11"
    // Add more titles of sold artworks here
];

// Path to the index.json file
const indexJsonPath = path.join(__dirname, 'index.json');

// Read the current index.json file
fs.readFile(indexJsonPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading index.json:', err);
        return;
    }

    try {
        // Parse the JSON data
        const artworks = JSON.parse(data);
        
        // Update the sold status for each artwork
        artworks.forEach(artwork => {
            if (soldItems.includes(artwork.title)) {
                artwork.sold = true;
            } else {
                // Remove sold property if it exists but the item is not in the sold list
                if (artwork.sold) {
                    delete artwork.sold;
                }
            }
        });

        // Write the updated data back to index.json
        fs.writeFile(indexJsonPath, JSON.stringify(artworks, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing to index.json:', writeErr);
                return;
            }
            console.log('Successfully updated sold status for artworks!');
            console.log('The following items are marked as sold:', soldItems.join(', '));
        });
    } catch (parseErr) {
        console.error('Error parsing index.json:', parseErr);
    }
});
