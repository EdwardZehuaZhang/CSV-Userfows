// filepath: d:\Coding Files\GitHub\CSV-Userfows\js\folder-scanner.js
// Folder Scanner - Automatically scans directories for PDF files and builds UI

/**
 * Fetches the list of PDF files in a directory using AJAX
 * @param {string} folderPath - The path of the folder to scan
 * @returns {Promise} - Resolves with the list of PDF files or rejects with an error
 */
function scanFolderForPDFs(folderPath) {
    return new Promise((resolve, reject) => {
        const IS_GITHUB_PAGES = window.location.hostname.endsWith('github.io');

        if (IS_GITHUB_PAGES) {
            // GitHub Pages: Fetch manifest.json
            const manifestUrl = `${folderPath}/manifest.json`;
            console.log(`GitHub Pages mode: Attempting to fetch manifest: ${manifestUrl}`);
            const xhr = new XMLHttpRequest();
            xhr.open('GET', manifestUrl, true);
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const fileNames = JSON.parse(xhr.responseText);
                        if (!Array.isArray(fileNames)) {
                            console.error(`Manifest content for ${folderPath} is not an array.`);
                            throw new Error('Manifest content is not an array.');
                        }
                        const pdfFiles = fileNames
                            .filter(fileName => typeof fileName === 'string' && fileName.toLowerCase().endsWith('.pdf'))
                            .map(fileName => ({
                                name: decodeURIComponent(fileName), // Decode file names
                                path: `${folderPath}/${fileName}`   // Path uses original (potentially encoded) name
                            }));
                        console.log(`Successfully loaded PDFs from manifest for ${folderPath}:`, pdfFiles);
                        resolve(pdfFiles);
                    } catch (e) {
                        console.error(`Error parsing manifest for ${folderPath}:`, e);
                        reject(new Error(`Error parsing manifest for ${folderPath}: ${e.message}`));
                    }
                } else {
                    console.error(`Failed to load manifest.json for ${folderPath} (Status: ${xhr.status}). This is required on GitHub Pages.`);
                    reject(new Error(`Failed to load manifest.json for ${folderPath}: ${xhr.status}`));
                }
            };
            xhr.onerror = function () {
                console.error(`Network error while fetching manifest.json for ${folderPath}.`);
                reject(new Error(`Network error fetching manifest.json for ${folderPath}`));
            };
            xhr.send();
        } else {
            // Local development: Scan directory listing (original behavior)
            console.log(`Local mode: Attempting directory scan for: ${folderPath}/`);
            const xhr = new XMLHttpRequest();
            xhr.open('GET', folderPath + '/', true); 
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(xhr.responseText, 'text/html');
                    const links = Array.from(doc.querySelectorAll('a'));
                    const pdfFiles = links
                        .map(link => {
                            const href = link.getAttribute('href');
                            if (!href || href === '../' || href.endsWith('/') || href.startsWith('?') || href.startsWith('#')) {
                                return null;
                            }
                            const decodedName = decodeURIComponent(href.split('/').pop());
                            if (decodedName.toLowerCase().endsWith('.pdf')) {
                                return {
                                    name: decodedName,
                                    path: `${folderPath}/${href}`
                                };
                            }
                            return null;
                        })
                        .filter(Boolean);
                    console.log(`Successfully scanned directory for ${folderPath} (local):`, pdfFiles);
                    resolve(pdfFiles);
                } else {
                    console.error(`Failed to scan folder (local): ${folderPath} (Status: ${xhr.status})`);
                    reject(new Error(`Failed to scan folder (local): ${xhr.status}`));
                }
            };
            xhr.onerror = function () {
                console.error(`Network error during directory scan for ${folderPath} (local).`);
                reject(new Error('Failed to scan folder (local): Network error'));
            };
            xhr.send();
        }
    });
}

/**
 * Creates display-friendly title from PDF filename
 * @param {string} filename - The raw filename
 * @returns {string} - Formatted title
 */
function formatPDFTitle(filename) {
    const filenameParts = filename.split('/');
    let title = filenameParts[filenameParts.length - 1];
    title = title.replace('.pdf', '');
    title = title.replace(/[-_]/g, ' ');
    title = title.replace(/\s*[Uu]ser\s*[Ff]low\s*$/, '');
    title = title.trim();
    return title;
}

/**
 * Creates a brief description for the PDF based on its name
 * @param {string} filename - The raw filename
 * @returns {string} - Generated description
 */
function generatePDFDescription(filename) {
    const title = formatPDFTitle(filename);
    return `User flow for ${title.toLowerCase()} process`;
}

/**
 * Builds the PDF selection UI for a given folder
 * @param {string} folderName - The name of the folder
 * @param {Array} pdfFiles - Array of PDF file information
 */
function buildPDFSelectionUI(folderName, pdfFiles) {
    const containerId = `${folderName.toLowerCase()}-pdf-container`;
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 col-span-full hidden';
        const pdfSelection = document.getElementById('pdf-selection');
        if (pdfSelection) {
            pdfSelection.appendChild(container);
        }
    }
    container.innerHTML = '';
    if (pdfFiles.length === 0) {
        document.getElementById('empty-folder-message').classList.remove('hidden');
        return;
    }
    document.getElementById('empty-folder-message').classList.add('hidden');
    container.classList.remove('hidden');
    pdfFiles.forEach(pdf => {
        const title = formatPDFTitle(pdf.name);
        const description = generatePDFDescription(pdf.name);
        const card = document.createElement('div');
        card.className = 'card-hover bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 flex flex-col h-full';
        card.innerHTML = `
            <h3 class="text-xl font-semibold mb-3">${title}</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-4 flex-grow">${description}</p>
            <button class="btn-hover flex items-center justify-center w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-all mt-auto" 
                    onclick="loadPDF('${pdf.path}')">
                <i class="fa-solid fa-file-pdf mr-2"></i> View PDF
            </button>
        `;
        container.appendChild(card);
    });
}

/**
 * Shows the selected folder and its PDF files
 * @param {string} folderName - The name of the folder to show
 * @param {boolean} updateURL - Whether to update the URL
 */
function showFolderWithPDFs(folderName, updateURL = true) {
    const folderSelection = document.getElementById('folder-selection');
    const pdfSelection = document.getElementById('pdf-selection');
    const currentFolderName = document.getElementById('current-folder-name');
    folderSelection.classList.add('hidden');
    pdfSelection.classList.remove('hidden');
    const formattedName = folderName.replace(/_/g, ' ');
    currentFolderName.textContent = formattedName;
    document.querySelectorAll('[id$="-pdf-container"]').forEach(container => {
        container.classList.add('hidden');
    });
    document.getElementById('loading').classList.remove('hidden');
    scanFolderForPDFs(folderName)
        .then(pdfFiles => {
            buildPDFSelectionUI(folderName, pdfFiles);
            document.getElementById('loading').classList.add('hidden');
        })
        .catch(error => {
            console.error('Error loading PDFs:', error);
            document.getElementById('empty-folder-message').classList.remove('hidden');
            document.getElementById('loading').classList.add('hidden');
        });
    if (updateURL) {
        history.pushState({}, '', `?folder=${folderName}`);
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        scanFolderForPDFs,
        buildPDFSelectionUI,
        showFolderWithPDFs,
        formatPDFTitle,
        generatePDFDescription
    };
}
