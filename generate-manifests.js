//node generate-manifests.js

const fs = require('fs');
const path = require('path');

// Add all folders that contain PDFs you want to scan
const pdfFolders = [
    'Senate_Digitization'
    // Add other PDF folder names here, e.g., 'Another_PDF_Folder'
];

const projectRoot = __dirname; // Assumes the script is in the project root

pdfFolders.forEach(folderName => {
    const folderPath = path.join(projectRoot, folderName);
    const manifestPath = path.join(folderPath, 'manifest.json');

    try {
        if (!fs.existsSync(folderPath)) {
            console.warn(`Warning: PDF folder not found: ${folderPath}. Skipping.`);
            return;
        }

        const files = fs.readdirSync(folderPath);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        // Sort PDF files alphabetically for consistent manifest content
        pdfFiles.sort();

        fs.writeFileSync(manifestPath, JSON.stringify(pdfFiles, null, 2));
        console.log(`Successfully generated manifest for ${folderName} at ${manifestPath} with ${pdfFiles.length} PDF(s).`);

    } catch (error) {
        console.error(`Error processing folder ${folderName}:`, error);
    }
});

console.log("Manifest generation complete.");
