// Setup PDF control event listeners
function setupPDFControls() {
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageInput = document.getElementById('page-input');
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const viewModeToggle = document.getElementById('view-mode-toggle');
    
    if (prevPageButton) prevPageButton.addEventListener('click', previousPage);
    if (nextPageButton) nextPageButton.addEventListener('click', nextPage);
    
    if (pageInput) {
        // Handle page changes on input change
        pageInput.addEventListener('input', function(e) {
            // Delay execution slightly to let the value stabilize
            setTimeout(goToPage, 300);
        });
        
        // Also handle Enter key for immediate navigation
        pageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                goToPage();
            }
        });
        
        // Handle focus blur (user clicks away)
        pageInput.addEventListener('blur', function() {
            goToPage();
        });
    }
    
    if (zoomInButton) zoomInButton.addEventListener('click', zoomIn);
    if (zoomOutButton) zoomOutButton.addEventListener('click', zoomOut);
    
    // Add event listener for the view mode toggle
    if (viewModeToggle) viewModeToggle.addEventListener('click', toggleViewMode);
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        const pdfViewer = document.getElementById('pdf-viewer');
        if (pdfViewer && pdfViewer.classList.contains('hidden')) return;
        
        if (e.key === 'ArrowLeft') {
            previousPage();
        } else if (e.key === 'ArrowRight') {
            nextPage();
        }
    });
}

// Go to previous page
function previousPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
    updateUIState();
    
    // Update URL with new page number
    updateURLWithPage(pageNum);
}

// Go to next page
function nextPage() {
    if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
    updateUIState();
    
    // Update URL with new page number
    updateURLWithPage(pageNum);
}

// Go to specific page
function goToPage() {
    const pageInput = document.getElementById('page-input');
    const num = parseInt(pageInput.value, 10);
    if (isNaN(num)) return;
    
    // Ensure page number is valid
    if (num < 1) {
        pageNum = 1;
    } else if (num > pdfDoc.numPages) {
        pageNum = pdfDoc.numPages;
    } else {
        pageNum = num;
    }
    
    queueRenderPage(pageNum);
    updateUIState();
    
    // Update URL with new page number
    updateURLWithPage(pageNum);
}

// Zoom in
function zoomIn() {
    scale += 0.25;
    if (isScrollView) {
        renderScrollView();
    } else {
        queueRenderPage(pageNum);
    }
}

// Zoom out
function zoomOut() {
    if (scale <= 0.5) return;
    scale -= 0.25;
    if (isScrollView) {
        renderScrollView();
    } else {
        queueRenderPage(pageNum);
    }
}