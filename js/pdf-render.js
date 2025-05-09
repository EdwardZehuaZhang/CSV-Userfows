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
        // Use the page's inherent rotation metadata
        const viewport = page.getViewport({ 
            scale: scale,
            rotation: page.rotate  // Use the page's own rotation value
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
    if (document.querySelector('#pdf-scroll-container .simplebar-content-wrapper')) {
        setupPageObserver();
    } else {
        console.warn('SimpleBar wrapper for pdf-scroll-container not ready for IntersectionObserver setup. Pages might not lazy load correctly on scroll until it is.');
        setTimeout(() => {
            if (document.querySelector('#pdf-scroll-container .simplebar-content-wrapper')) {
                setupPageObserver();
            } else {
                console.error('Failed to set up IntersectionObserver: SimpleBar wrapper still not found.');
            }
        }, 500);
    }
    
    // Sequentially render all pages
    let loadPromise = Promise.resolve();
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        loadPromise = loadPromise.then(() => renderPageInScrollView(i));
    }
    
    return loadPromise
        .then(() => {
            console.log(`All ${pdfDoc.numPages} pages loaded in scroll view`);
            const firstVisiblePage = findFirstVisiblePage();
            if (firstVisiblePage) {
                document.getElementById('page-input').value = firstVisiblePage;
            }
        })
        .catch(error => {
            console.error('Error rendering all scroll view pages:', error);
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
    
    // Pages that are already rendered or currently rendering shouldn't be processed again
    if (pageCanvas.dataset.rendered === 'true' || pageCanvas.dataset.rendering === 'true') {
        return Promise.resolve();
    }
    
    pageCanvas.dataset.rendering = 'true'; // Mark as rendering
    
    // Get and render the page
    return pdfDoc.getPage(pageNumber).then(function(page) {
        // Use the page's inherent rotation metadata
        const viewport = page.getViewport({ 
            scale: scale, 
            rotation: page.rotate  // Use the page's own rotation value
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
            pageCanvas.dataset.rendering = 'false'; // Clear rendering flag
            pageContainer.dataset.rendered = 'true';  // Also mark container as rendered
            loadingIndicator.classList.add('hidden');
            console.log(`Page ${pageNumber} rendered in scroll view`);
        });
    }).catch(error => {
        console.error(`Error rendering page ${pageNumber} in scroll view:`, error);
        if (pageCanvas) pageCanvas.dataset.rendering = 'false'; // Clear rendering flag on error
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
    if (window.pageObserver) {
        window.pageObserver.disconnect();
    }
    
    const scrollRoot = document.querySelector('#pdf-scroll-container .simplebar-content-wrapper');
    if (!scrollRoot) {
        console.error("Cannot setup PageObserver: scroll root '#pdf-scroll-container .simplebar-content-wrapper' not found.");
        return;
    }

    // Create new observer
    window.pageObserver = new IntersectionObserver((entries) => {
        let ScollViewPageNumUpdated = false; // Flag to update page number only once per intersection event batch
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNumber = parseInt(entry.target.dataset.pageNumber);
                if (pageNumber) {
                    const canvas = document.getElementById(`scroll-page-canvas-${pageNumber}`);
                    if (canvas && canvas.dataset.rendered !== 'true' && canvas.dataset.rendering !== 'true') {
                        renderPageInScrollView(pageNumber);
                    }
                    
                    if (!ScollViewPageNumUpdated) {
                        const firstVisible = findFirstVisiblePage();
                        if (firstVisible) {
                             document.getElementById('page-input').value = firstVisible;
                             ScollViewPageNumUpdated = true;
                        }
                    }
                }
            }
        });
    }, {
        root: scrollRoot, // Observe within the SimpleBar scrollable area of pdf-scroll-container
        rootMargin: '200px 0px', // Start loading when page is within 200px of viewport
        threshold: 0.01 // A small part of the page is visible
    });
    
    document.querySelectorAll('.pdf-page-container').forEach(pageContainer => {
        window.pageObserver.observe(pageContainer);
    });
}

// Helper function to find the first visible page in scroll view
function findFirstVisiblePage() {
    const scrollWrapper = document.querySelector('#pdf-scroll-container .simplebar-content-wrapper');
    
    if (!scrollWrapper) {
        const fallbackScrollContainer = document.getElementById('pdf-scroll-container') || document.documentElement;
        const scrollContainerTop = fallbackScrollContainer.scrollTop;
        const pageContainers = document.querySelectorAll('#pdf-scroll-container .pdf-page-container');

        for (let i = 0; i < pageContainers.length; i++) {
            const container = pageContainers[i];
            if (container.offsetParent !== null && (container.offsetTop + container.offsetHeight - scrollContainerTop > 50) && (container.offsetTop - scrollContainerTop < fallbackScrollContainer.clientHeight - 50)) {
                if (container.offsetTop >= scrollContainerTop - 50) {
                    return parseInt(container.dataset.pageNumber);
                }
            }
        }
        return null;
    }

    const scrollContainerTop = scrollWrapper.scrollTop;
    const scrollContainerHeight = scrollWrapper.clientHeight;
    
    const pageContainers = document.querySelectorAll('#pdf-scroll-container .pdf-page-container');
    for (let i = 0; i < pageContainers.length; i++) {
        const container = pageContainers[i];
        const containerTopRelativeToScrollWrapper = container.offsetTop - scrollContainerTop;
        const containerBottomRelativeToScrollWrapper = container.offsetTop + container.offsetHeight - scrollContainerTop;

        if (containerTopRelativeToScrollWrapper < scrollContainerHeight && containerBottomRelativeToScrollWrapper > 0) {
            if (containerTopRelativeToScrollWrapper <= 100) {
                return parseInt(container.dataset.pageNumber);
            }
        }
    }
    return null; // No page found or suitable
}