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