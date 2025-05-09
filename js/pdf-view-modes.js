// Toggle between page view and scroll view
function toggleViewMode() {
    isScrollView = !isScrollView;
    const viewModeToggle = document.getElementById('view-mode-toggle');
    const pdfCanvas = document.getElementById('pdf-canvas');
    const pdfScrollContainer = document.getElementById('pdf-scroll-container');
    
    // Update button text based on the current mode
    if (isScrollView) {
        // Switch to scroll view
        viewModeToggle.innerHTML = '<i class="fa-solid fa-file mr-1"></i> Page View';
        pdfCanvas.classList.add('hidden');
        pdfScrollContainer.classList.remove('hidden');
        
        renderScrollView();
    } else {
        // Switch to page view
        viewModeToggle.innerHTML = '<i class="fa-solid fa-scroll mr-1"></i> Scroll View';
        pdfCanvas.classList.remove('hidden');
        pdfScrollContainer.classList.add('hidden');
        
        renderPage(pageNum);
        
        // Ensure the URL is updated with the current page
        updateURLWithPage(pageNum);
    }
    
    // Use the UI components module to update pagination control state
    if (typeof updatePaginationControlState === 'function') {
        updatePaginationControlState();
    }
}