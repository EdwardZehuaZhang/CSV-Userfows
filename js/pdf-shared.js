// PDF.js shared variables
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.0;
let currentPdfPath = '';
let ctx = null;
let isScrollView = true; // Track the current view mode (changed to true for scroll view by default)

// Initialize PDF viewer
document.addEventListener('DOMContentLoaded', function() {
    const pdfCanvas = document.getElementById('pdf-canvas');
    if (pdfCanvas) {
        ctx = pdfCanvas.getContext('2d');
    }
    
    // Set up event listeners for PDF controls if setupPDFControls is defined
    if (typeof setupPDFControls === 'function') {
        setupPDFControls();
    }
});

// Show error message
function showError() {
    document.getElementById('pdfViewer').classList.add('hidden');
    document.getElementById('pdfSelection').classList.add('hidden');
    document.getElementById('pdfError').classList.remove('hidden');
    document.getElementById('loading').classList.add('hidden');
}

// Update UI state based on current page
function updateUIState() {
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    
    if (!pdfDoc) {
        prevPageButton.disabled = true;
        nextPageButton.disabled = true;
        return;
    }
    
    prevPageButton.disabled = pageNum <= 1;
    nextPageButton.disabled = pageNum >= pdfDoc.numPages;
}

// Export shared variables and functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        pdfDoc,
        pageNum,
        pageRendering,
        pageNumPending,
        scale,
        currentPdfPath,
        ctx,
        isScrollView,
        showError,
        updateUIState
    };
}