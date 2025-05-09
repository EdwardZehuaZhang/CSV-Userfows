// filepath: d:\Coding Files\GitHub\CSV-Userfows\js\folder-scanner.js
// Folder Scanner - Automatically scans directories for PDF files and builds UI

/**
 * Fetches the list of PDF files in a directory using AJAX
 * @param {string} folderName - The name of the folder to scan
 * @returns {Promise} - Resolves with the list of PDF files or rejects with an error
 */
function scanFolderForPDFs(folderName) {
    return new Promise((resolve, reject) => {
        console.log(`Scanning folder: ${folderName} for PDFs`);
        
        // Create a new XMLHttpRequest to fetch directory listing
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `./${folderName}/`, true);
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                // Create a temporary element to parse the HTML response
                const tempEl = document.createElement('div');
                tempEl.innerHTML = xhr.responseText;
                
                // Find all links in the directory listing
                const links = tempEl.querySelectorAll('a');
                const pdfFiles = [];
                
                // Filter for PDF files
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && href.toLowerCase().endsWith('.pdf')) {
                        pdfFiles.push({
                            name: decodeURIComponent(href),
                            path: `./${folderName}/${href}`
                        });
                    }
                });
                
                console.log(`Found ${pdfFiles.length} PDFs in ${folderName}`);
                resolve(pdfFiles);
            } else {
                console.error(`Failed to scan folder: ${folderName}`, xhr.statusText);
                reject(new Error(`Failed to scan folder: ${xhr.status} ${xhr.statusText}`));
            }
        };
        
        xhr.onerror = function() {
            console.error(`Error scanning folder: ${folderName}`);
            reject(new Error('Network error while scanning folder'));
        };
        
        xhr.send();
    });
}

/**
 * Creates display-friendly title from PDF filename
 * @param {string} filename - The raw filename
 * @returns {string} - Formatted title
 */
function formatPDFTitle(filename) {
    // Remove extension
    let title = filename.replace('.pdf', '');
    
    // Replace hyphens and underscores with spaces
    title = title.replace(/[-_]/g, ' ');
    
    // Clean up any "User Flow" or "User flow" text
    title = title.replace(/\s*[Uu]ser\s*[Ff]low\s*$/, '');
    
    // Trim any extra spaces
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
    // Get the container for this folder's PDFs
    const containerId = `${folderName.toLowerCase()}-pdf-container`;
    let container = document.getElementById(containerId);
    
    // If container doesn't exist, create it
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 col-span-full hidden';
        
        // Add it to the PDF selection div
        const pdfSelection = document.getElementById('pdf-selection');
        if (pdfSelection) {
            pdfSelection.appendChild(container);
        }
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    if (pdfFiles.length === 0) {
        // Show empty folder message
        document.getElementById('empty-folder-message').classList.remove('hidden');
        return;
    }
    
    // Hide empty folder message
    document.getElementById('empty-folder-message').classList.add('hidden');
    
    // Show this folder's container
    container.classList.remove('hidden');
    
    // Create a card for each PDF
    pdfFiles.forEach(pdf => {
        const title = formatPDFTitle(pdf.name);
        const description = generatePDFDescription(pdf.name);
        
        // Create card element
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
    
    // Hide folder selection, show PDF selection
    folderSelection.classList.add('hidden');
    pdfSelection.classList.remove('hidden');
    
    // Set current folder name with proper formatting
    const formattedName = folderName.replace(/_/g, ' ');
    currentFolderName.textContent = formattedName;
    
    // Hide all PDF containers
    document.querySelectorAll('[id$="-pdf-container"]').forEach(container => {
        container.classList.add('hidden');
    });
    
    // Show loading state
    document.getElementById('loading').classList.remove('hidden');
    
    // Scan the folder for PDFs
    scanFolderForPDFs(folderName)
        .then(pdfFiles => {
            // Build the UI with the PDF files
            buildPDFSelectionUI(folderName, pdfFiles);
            document.getElementById('loading').classList.add('hidden');
        })
        .catch(error => {
            console.error('Error loading PDFs:', error);
            document.getElementById('empty-folder-message').classList.remove('hidden');
            document.getElementById('loading').classList.add('hidden');
        });
    
    // Update URL with folder if needed
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
