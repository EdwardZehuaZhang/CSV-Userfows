// Folder and page navigation

// Process URL parameters to set initial state
function processURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const folderParam = urlParams.get('folder');
    const hash = window.location.hash;
    
    console.log('Processing URL params:', { folder: folderParam, hash });
    
    if (folderParam) {
        // Show the folder with dynamically scanned PDFs
        showFolderWithPDFs(folderParam, false); // Don't update URL, we're already there
        
        // Check for PDF in hash
        if (hash && hash.startsWith('#pdf=')) {
            try {
                const hashParts = hash.substring(5).split('&');
                let pdfPath = hashParts[0];
                let page = 1;
                
                // Check for page parameter
                for (let i = 1; i < hashParts.length; i++) {
                    if (hashParts[i].startsWith('page=')) {
                        page = parseInt(hashParts[i].substring(5), 10) || 1;
                    }
                }
                
                // Make sure path is valid
                if (!pdfPath.includes('/')) {
                    pdfPath = folderParam + '/' + pdfPath;
                }
                
                // Ensure path starts with ./
                if (!pdfPath.startsWith('./')) {
                    pdfPath = './' + pdfPath;
                }
                
                console.log('Loading PDF from URL:', pdfPath, 'Page:', page);
                loadPDF(pdfPath, page);
            } catch (e) {
                console.error('Error processing hash parameters:', e);
            }
        }
    }
}

// Folder navigation - delegate to the folder scanner module
function showFolder(folderName, updateURL = true) {
    // Use the dynamic folder scanner to show folder contents
    showFolderWithPDFs(folderName, updateURL);
}

// Back to folders
function backToFolders() {
    const pdfSelection = document.getElementById('pdf-selection');
    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfError = document.getElementById('pdf-error');
    const folderSelection = document.getElementById('folder-selection');
    
    pdfSelection.classList.add('hidden');
    pdfViewer.classList.add('hidden');
    // Remove the active-viewer class when returning to folders
    pdfViewer.classList.remove('active-viewer');
    pdfError.classList.add('hidden');
    folderSelection.classList.remove('hidden');
    
    // Clear hash and update URL
    history.pushState({}, '', window.location.pathname);
}

// Back to selection list
function backToList() {
    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfError = document.getElementById('pdf-error');
    const pdfSelection = document.getElementById('pdf-selection');
    
    pdfViewer.classList.add('hidden');
    // Remove the active-viewer class when returning to folder selection
    pdfViewer.classList.remove('active-viewer');
    pdfError.classList.add('hidden');
    pdfSelection.classList.remove('hidden');
    
    // Update URL to remove PDF info but keep folder
    const urlParams = new URLSearchParams(window.location.search);
    const folder = urlParams.get('folder') || 'Senate_Digitization';
    history.pushState({}, '', `?folder=${folder}`);
}

// Initialize navigation event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for back to folders button
    const backToFoldersBtn = document.getElementById('back-to-folders');
    if (backToFoldersBtn) {
        backToFoldersBtn.addEventListener('click', backToFolders);
    }
    
    // Add event listeners for back to list buttons
    const backToListButton = document.getElementById('back-to-list');
    const errorBackButton = document.getElementById('error-back-button');
    
    if (backToListButton) {
        backToListButton.addEventListener('click', backToList);
    }
    
    if (errorBackButton) {
        errorBackButton.addEventListener('click', backToList);
    }
    
    // Listen for browser navigation (back/forward buttons)
    window.addEventListener('popstate', function(event) {
        processURLParams();
    });
    
    // Process URL parameters on load
    processURLParams();
});