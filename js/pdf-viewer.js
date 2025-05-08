// PDF.js variables and functions
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.0;
let currentPdfPath = '';
let ctx = null;
let isScrollView = false; // Track the current view mode

// Initialize PDF viewer
document.addEventListener('DOMContentLoaded', function() {
    const pdfCanvas = document.getElementById('pdf-canvas');
    if (pdfCanvas) {
        ctx = pdfCanvas.getContext('2d');
    }
    
    // Set up event listeners for PDF controls
    setupPDFControls();
});

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

// Load PDF function
function loadPDF(pdfPath, targetPage = 1) {
    const pdfSelection = document.getElementById('pdf-selection');
    const pdfError = document.getElementById('pdf-error');
    const pdfViewer = document.getElementById('pdf-viewer');
    const loadingIndicator = document.getElementById('loading');
    const pdfCanvas = document.getElementById('pdf-canvas');
    const pdfScrollContainer = document.getElementById('pdf-scroll-container');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const ctx = pdfCanvas.getContext('2d');
    
    // Store the current PDF path
    currentPdfPath = pdfPath;
    
    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    console.log('Loading PDF:', pdfPath, 'Page:', targetPage);
    
    // Hide selection and error, show viewer
    pdfSelection.classList.add('hidden');
    pdfError.classList.add('hidden');
    pdfViewer.classList.remove('hidden');
    
    // Reset zoom
    scale = 1.0;
    
    // Reset canvas to clean state
    ctx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
    
    // Clear scroll container if it exists
    if (pdfScrollContainer) {
        pdfScrollContainer.innerHTML = '';
    }
    
    // Handle navigation arrows based on current view mode
    if (isScrollView) {
        prevPageButton.classList.add('hidden');
        nextPageButton.classList.add('hidden');
    } else {
        prevPageButton.classList.remove('hidden');
        nextPageButton.classList.remove('hidden');
    }
    
    // Parse the PDF path to create a proper URL
    const pdfUrl = new URL(pdfPath, window.location.href).href;
    console.log('Resolved PDF URL:', pdfUrl);
    
    // Get the folder from the path
    let folder = 'Senate_Digitization'; // Default folder
    const urlParams = new URLSearchParams(window.location.search);
    const urlFolder = urlParams.get('folder');
    if (urlFolder) {
        folder = urlFolder;
    }
    
    // Create a loading task
    const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        withCredentials: false,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
        cMapPacked: true
    });
    
    // Track when operation is canceled
    let canceled = false;
    
    // Set timeout for loading
    const timeoutId = setTimeout(() => {
        console.error('PDF load timeout');
        canceled = true;
        loadingTask.destroy().catch(() => {});
        showError();
    }, 15000); // 15 second timeout
    
    // Load the PDF
    loadingTask.promise
        .then(function(pdf) {
            if (canceled) return;
            clearTimeout(timeoutId);
            
            console.log('PDF loaded successfully, pages:', pdf.numPages);
            pdfDoc = pdf;
            document.getElementById('total-pages').textContent = pdf.numPages;
            document.getElementById('page-input').max = pdf.numPages;
            
            // Ensure valid page number
            pageNum = Math.min(Math.max(1, targetPage), pdf.numPages);
            
            // Update navigation buttons
            updateUIState();
            
            // Render based on current view mode
            if (isScrollView) {
                renderScrollView();
            } else {
                // Render first page
                return renderPage(pageNum);
            }
        })
        .then(() => {
            if (canceled) return;
            
            // Update URL after successful render
            updateURLWithPDF(pdfPath, pageNum, folder);
        })
        .catch(function(error) {
            if (canceled) return;
            clearTimeout(timeoutId);
            
            console.error('Error loading PDF:', error);
            showError();
        });
}

// Helper function to update URL with current PDF and page
function updateURLWithPDF(pdfPath, page, folder) {
    // Extract just the filename part
    let pdfFilename = pdfPath.split('/').pop();
    
    // Create the full path for the URL
    const folderName = folder || 'Senate_Digitization';
    const urlPath = `${folderName}/${pdfFilename}`;
    
    // Update the URL
    console.log('Updating URL with:', urlPath, 'Page:', page);
    history.pushState(null, '', `?folder=${folderName}#pdf=${urlPath}&page=${page}`);
}

// Update URL with just the page number
function updateURLWithPage(page) {
    const hash = window.location.hash;
    if (hash.startsWith('#pdf=')) {
        const parts = hash.split('&');
        const pdfPart = parts[0]; // #pdf=path/to/file.pdf
        
        // Construct new hash with updated page
        const newHash = `${pdfPart}&page=${page}`;
        
        // Update URL without reloading
        history.pushState(null, '', window.location.pathname + window.location.search + newHash);
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
        const viewport = page.getViewport({ scale: scale });
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

// Toggle between page view and scroll view
function toggleViewMode() {
    isScrollView = !isScrollView;
    const viewModeToggle = document.getElementById('view-mode-toggle');
    const pdfCanvas = document.getElementById('pdf-canvas');
    const pdfScrollContainer = document.getElementById('pdf-scroll-container');
    const paginationControls = document.getElementById('pagination-controls');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    
    if (isScrollView) {
        // Switch to scroll view
        viewModeToggle.innerHTML = '<i class="fa-solid fa-file mr-1"></i> Page View';
        pdfCanvas.classList.add('hidden');
        pdfScrollContainer.classList.remove('hidden');
        paginationControls.classList.add('disabled');
        
        // Hide navigation arrows in scroll view
        prevPageButton.classList.add('hidden');
        nextPageButton.classList.add('hidden');
        
        renderScrollView();
    } else {
        // Switch to page view
        viewModeToggle.innerHTML = '<i class="fa-solid fa-scroll mr-1"></i> Scroll View';
        pdfCanvas.classList.remove('hidden');
        pdfScrollContainer.classList.add('hidden');
        paginationControls.classList.remove('disabled');
        
        // Show navigation arrows in page view
        prevPageButton.classList.remove('hidden');
        nextPageButton.classList.remove('hidden');
        
        renderPage(pageNum);
    }
}

// Render all pages in scroll view
function renderScrollView() {
    if (!pdfDoc) {
        console.error('No PDF document available to render');
        return Promise.reject(new Error('No PDF document'));
    }
    
    const pdfScrollContainer = document.getElementById('pdf-scroll-container');
    pdfScrollContainer.innerHTML = ''; // Clear existing content
    
    // Show loading indicator
    document.getElementById('loading').classList.remove('hidden');
    
    // Array to store all rendering promises
    const renderPromises = [];
    
    // Render each page
    for (let pageIndex = 1; pageIndex <= pdfDoc.numPages; pageIndex++) {
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page-container';
        pageContainer.dataset.pageNumber = pageIndex;
        
        const pageCanvas = document.createElement('canvas');
        pageCanvas.className = 'pdf-page-canvas';
        
        pageContainer.appendChild(pageCanvas);
        pdfScrollContainer.appendChild(pageContainer);
        
        // Render this page
        const renderPromise = pdfDoc.getPage(pageIndex).then(function(page) {
            const viewport = page.getViewport({ scale: scale });
            const ctx = pageCanvas.getContext('2d');
            
            // Set canvas dimensions
            pageCanvas.height = viewport.height;
            pageCanvas.width = viewport.width;
            
            // Render PDF page
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            return page.render(renderContext).promise;
        });
        
        renderPromises.push(renderPromise);
    }
    
    // When all pages are rendered
    return Promise.all(renderPromises)
        .then(() => {
            document.getElementById('loading').classList.add('hidden');
            console.log('All pages rendered in scroll view');
        })
        .catch(error => {
            console.error('Error rendering scroll view:', error);
            document.getElementById('loading').classList.add('hidden');
            throw error;
        });
}

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

// Queue page rendering
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
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