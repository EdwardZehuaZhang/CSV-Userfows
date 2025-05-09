// Queue page rendering
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Render PDF page
function renderPage(num) {
    if (!pdfDoc) {
        console.error('No PDF document available to render');
        return Promise.reject(new Error('No PDF document'));
    }
    
    pageRendering = true;
    
    // Show loading indicator
    document.getElementById('loading').classList.remove('hidden');
    console.log('Rendering page', num);
    
    // Get page
    return pdfDoc.getPage(num).then(function(page) {
        // Get the original viewport then create a new one with correct rotation
        const originalViewport = page.getViewport({ scale: 1.0 });
        const viewport = page.getViewport({ 
            scale: scale,
            rotation: 0  // Always set rotation to 0 to prevent upside-down pages
        });
        const pdfCanvas = document.getElementById('pdf-canvas');
        const ctx = pdfCanvas.getContext('2d');
        
        // Set canvas dimensions
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;
        
        // Render PDF page
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        // Wait for rendering to finish
        return renderTask.promise.then(function() {
            pageRendering = false;
            document.getElementById('loading').classList.add('hidden');
            
            // Update UI
            document.getElementById('current-page').textContent = num;
            document.getElementById('page-input').value = num;
            
            // Handle pending page requests
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        }).catch(function(error) {
            console.error('Error rendering page:', error);
            pageRendering = false;
            document.getElementById('loading').classList.add('hidden');
            throw error;
        });
    }).catch(function(error) {
        console.error('Error getting page:', error);
        pageRendering = false;
        document.getElementById('loading').classList.add('hidden');
        throw error;
    });
}

// Render all pages in scroll view with progressive loading
function renderScrollView() {
    if (!pdfDoc) {
        console.error('No PDF document available to render');
        return Promise.reject(new Error('No PDF document'));
    }
    
    const pdfScrollContainer = document.getElementById('pdf-scroll-container');
    pdfScrollContainer.innerHTML = ''; // Clear existing content
    
    // We'll initially show the master loading indicator only briefly
    document.getElementById('loading').classList.remove('hidden');
    
    // Create placeholders for all pages first, with individual loading indicators
    for (let pageIndex = 1; pageIndex <= pdfDoc.numPages; pageIndex++) {
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page-container relative';
        pageContainer.dataset.pageNumber = pageIndex;
        pageContainer.id = `scroll-page-container-${pageIndex}`;
        
        // Add a custom attribute to indicate page numbers should be hidden
        pageContainer.setAttribute('data-hide-page-number', 'true');
        
        // Create page loading indicator
        const pageLoadingIndicator = document.createElement('div');
        pageLoadingIndicator.className = 'page-loading-indicator absolute inset-0 flex items-center justify-center';
        pageLoadingIndicator.innerHTML = `
            <div class="flex flex-col items-center">
                <div class="loader"></div>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">Loading page ${pageIndex}...</p>
            </div>
        `;
        pageLoadingIndicator.id = `loading-indicator-${pageIndex}`;
        
        // Create canvas for the page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.className = 'pdf-page-canvas shadow-lg'; // Added shadow-lg class
        pageCanvas.id = `scroll-page-canvas-${pageIndex}`;
        
        // Add elements to the page container
        pageContainer.appendChild(pageCanvas);
        pageContainer.appendChild(pageLoadingIndicator);
        
        // Remove any existing page number element if it exists (defensive approach)
        const existingPageNumber = pageContainer.querySelector('.page-number');
        if (existingPageNumber) {
            existingPageNumber.remove();
        }
        
        pdfScrollContainer.appendChild(pageContainer);
    }
    
    // Hide master loading indicator after placeholders are created
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
    }, 300);
    
    // Set up intersection observer to load pages as they come into view
    setupPageObserver();
    
    // Immediately start loading the first few pages
    const initialPagesToLoad = Math.min(3, pdfDoc.numPages);
    const initialLoadPromises = [];
    
    for (let i = 1; i <= initialPagesToLoad; i++) {
        initialLoadPromises.push(renderPageInScrollView(i));
    }
    
    return Promise.all(initialLoadPromises)
        .then(() => {
            console.log(`Initial ${initialPagesToLoad} pages loaded in scroll view`);
            // Ensure current page in view is updated in the input field if needed
            const firstVisiblePage = findFirstVisiblePage();
            if (firstVisiblePage) {
                document.getElementById('page-input').value = firstVisiblePage;
                document.getElementById('current-page').textContent = firstVisiblePage; // If you have a current-page span for scroll view
            }
        })
        .catch(error => {
            console.error('Error rendering initial scroll view pages:', error);
        });
}

// Render a single page in scroll view
function renderPageInScrollView(pageNumber) {
    if (!pdfDoc) return Promise.reject(new Error('No PDF document'));
    
    const pageCanvas = document.getElementById(`scroll-page-canvas-${pageNumber}`);
    const loadingIndicator = document.getElementById(`loading-indicator-${pageNumber}`);
    const pageContainer = document.getElementById(`scroll-page-container-${pageNumber}`);
    
    if (!pageCanvas || !loadingIndicator) {
        return Promise.reject(new Error(`Canvas or loading indicator not found for page ${pageNumber}`));
    }
    
    // Pages that are already rendered shouldn't be rendered again
    if (pageCanvas.dataset.rendered === 'true') {
        return Promise.resolve();
    }
    
    // Get and render the page
    return pdfDoc.getPage(pageNumber).then(function(page) {
        // Always use rotation: 0 to prevent upside-down rendering
        const viewport = page.getViewport({ 
            scale: scale, 
            rotation: 0  // Explicitly force rotation to 0
        });
        
        const ctx = pageCanvas.getContext('2d');
        
        // Set canvas dimensions
        pageCanvas.height = viewport.height;
        pageCanvas.width = viewport.width;
        
        // Render PDF page
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        return page.render(renderContext).promise.then(() => {
            // Mark the page as rendered and hide loading indicator
            pageCanvas.dataset.rendered = 'true';
            pageContainer.dataset.rendered = 'true';  // Also mark container as rendered
            loadingIndicator.classList.add('hidden');
            console.log(`Page ${pageNumber} rendered in scroll view`);
        });
    }).catch(error => {
        console.error(`Error rendering page ${pageNumber} in scroll view:`, error);
        // Show error state instead of loading
        if (loadingIndicator) {
            loadingIndicator.innerHTML = `
                <div class="flex flex-col items-center">
                    <i class="fa-solid fa-exclamation-circle text-red-500 text-2xl"></i>
                    <p class="mt-2 text-sm text-red-500">Failed to load page ${pageNumber}</p>
                </div>
            `;
        }
    });
}

// Set up intersection observer to detect when pages come into view
function setupPageObserver() {
    // Disconnect any existing observer
    if (window.pageObserver) {
        window.pageObserver.disconnect();
    }
    
    // Create new observer
    window.pageObserver = new IntersectionObserver((entries) => {
        let ScollViewPageNumUpdated = false; // Flag to update page number only once per intersection event batch
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNumber = parseInt(entry.target.dataset.pageNumber);
                if (pageNumber) {
                    renderPageInScrollView(pageNumber);
                    // Update current page input only if it's the topmost visible page
                    // and not already updated in this batch
                    if (!ScollViewPageNumUpdated) {
                        const firstVisible = findFirstVisiblePage();
                        if (firstVisible) {
                             document.getElementById('page-input').value = firstVisible;
                             // Also update the "Page X of Y" display if it's separate for scroll view
                             document.getElementById('current-page').textContent = firstVisible;
                             ScollViewPageNumUpdated = true;
                        }
                    }
                }
            }
        });
    }, {
        root: document.querySelector('[data-simplebar].pdf-container'), // Observe within the SimpleBar scrollable area
        rootMargin: '200px 0px', // Start loading when page is within 200px of viewport
        threshold: 0.01 // A small part of the page is visible
    });
    
    // Observe all page containers
    document.querySelectorAll('.pdf-page-container').forEach(pageContainer => {
        window.pageObserver.observe(pageContainer);
    });
}

// Helper function to find the first visible page in scroll view
function findFirstVisiblePage() {
    const scrollContainer = document.querySelector('[data-simplebar].pdf-container .simplebar-content-wrapper') || document.documentElement;
    const scrollContainerTop = scrollContainer.scrollTop;
    
    const pageContainers = document.querySelectorAll('#pdf-scroll-container .pdf-page-container');
    for (let i = 0; i < pageContainers.length; i++) {
        const container = pageContainers[i];
        // Check if the container is rendered and visible
        if (container.offsetParent !== null && (container.offsetTop + container.offsetHeight - scrollContainerTop > 50) && (container.offsetTop - scrollContainerTop < scrollContainer.clientHeight - 50) ) {
             // A page is considered "first visible" if its top part is visible within a tolerance
            if (container.offsetTop >= scrollContainerTop - 50) { // Allow some tolerance
                return parseInt(container.dataset.pageNumber);
            }
        }
    }
    return null; // No page found or suitable
}