// filepath: d:\Coding Files\GitHub\CSV-Userfows\js\pdf-ui-components.js
// PDF UI Components - Contains critical UI component setup and initialization

/**
 * Ensures critical UI elements like pagination controls exist in the DOM
 * This function is used to maintain page navigation and view mode controls
 * even if other parts of the code get modified
 */
function ensurePDFUIComponents() {
    console.log('Ensuring PDF UI components exist...');
    
    // Check if pagination controls container exists, create it if not
    let paginationControls = document.getElementById('pagination-controls');
    if (!paginationControls) {
        console.log('Creating missing pagination-controls element');
        
        // Find where to insert it - usually after the page input container
        const controlsContainer = document.querySelector('.bg-gray-100.dark\\:bg-gray-700');
        
        if (controlsContainer) {
            // Create the pagination controls container
            paginationControls = document.createElement('div');
            paginationControls.id = 'pagination-controls';
            paginationControls.className = 'flex items-center space-x-2';
            
            // Find where to insert it (after the page input group)
            const pageInputGroup = controlsContainer.querySelector('.flex.items-center.space-x-2.mb-2');
            
            // If found, insert after it
            if (pageInputGroup) {
                pageInputGroup.parentNode.insertBefore(paginationControls, pageInputGroup.nextSibling);
            } else {
                // Otherwise append to the controls container
                controlsContainer.appendChild(paginationControls);
            }
            
            // Move the existing buttons if they exist
            const zoomOutButton = document.getElementById('zoom-out');
            const zoomInButton = document.getElementById('zoom-in');
            const viewModeToggle = document.getElementById('view-mode-toggle');
            
            if (zoomOutButton) paginationControls.appendChild(zoomOutButton);
            if (zoomInButton) paginationControls.appendChild(zoomInButton);
            if (viewModeToggle) paginationControls.appendChild(viewModeToggle);
        }
    }
    
    // Make sure the pagination controls have the right initial state based on current view mode
    updatePaginationControlState();
}

/**
 * Updates the pagination control state based on the current view mode
 * This should be called whenever the view mode changes
 */
function updatePaginationControlState() {
    const paginationControls = document.getElementById('pagination-controls');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    
    if (!paginationControls) return;
    
    // Check if isScrollView is defined in the global scope
    if (typeof isScrollView !== 'undefined') {
        if (isScrollView) {
            // In scroll view, hide navigation buttons but keep zoom/view controls enabled
            if (prevPageButton) prevPageButton.classList.add('hidden');
            if (nextPageButton) nextPageButton.classList.add('hidden');
            
            // Remove the disabled class from pagination controls to ensure zoom/view buttons work
            paginationControls.classList.remove('disabled');
        } else {
            // In page view, show navigation buttons
            if (prevPageButton) prevPageButton.classList.remove('hidden');
            if (nextPageButton) nextPageButton.classList.remove('hidden');
            paginationControls.classList.remove('disabled');
        }
    }
}

// Initialize the UI components on DOM load
document.addEventListener('DOMContentLoaded', function() {
    ensurePDFUIComponents();
});

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ensurePDFUIComponents,
        updatePaginationControlState
    };
}