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
    const viewModeToggle = document.getElementById('view-mode-toggle');
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
    
    // Add active-viewer class for special footer handling
    pdfViewer.classList.add('active-viewer');
    
    // Reset zoom
    scale = 1.0;
    
    // Reset canvas to clean state
    ctx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
    
    // Clear scroll container if it exists
    if (pdfScrollContainer) {
        pdfScrollContainer.innerHTML = '';
    }
    
    // Ensure all UI components exist and are properly set up
    if (typeof ensurePDFUIComponents === 'function') {
        ensurePDFUIComponents();
    }
    
    // Set up initial view mode display
    if (isScrollView) {
        // Show scroll container, hide page view container
        pdfCanvas.classList.add('hidden');
        pdfScrollContainer.classList.remove('hidden');
        // Set button text to show the alternative view option
        viewModeToggle.innerHTML = '<i class="fa-solid fa-file mr-1"></i> Page View';
    } else {
        // Show page view container, hide scroll container
        pdfCanvas.classList.remove('hidden');
        pdfScrollContainer.classList.add('hidden');
        // Set button text to show the alternative view option
        viewModeToggle.innerHTML = '<i class="fa-solid fa-scroll mr-1"></i> Scroll View';
    }
    
    // Use the UI components module to update pagination control state
    if (typeof updatePaginationControlState === 'function') {
        updatePaginationControlState();
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
    
    // Always update URL immediately before loading the PDF
    // This ensures the URL is updated even if the PDF fails to load
    // or if we're in scroll view mode
    updateURLWithPDF(pdfPath, targetPage, folder);
    
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
                return renderScrollView();
            } else {
                // Render first page
                return renderPage(pageNum);
            }
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