using System;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using SkiaSharp;
using System.Threading.Tasks; // Added for Task.Run
using System.Windows;       // Added for Application.Current
using System.Diagnostics; // For Debug.WriteLine

public static class SkiaSharpExtensions
{
    public static BitmapSource ToBitmapSource(this SKBitmap skBitmap)
    {
        if (skBitmap == null)
            throw new ArgumentNullException(nameof(skBitmap));

        PixelFormat wpfPixelFormat;

        if (skBitmap.ColorType == SKColorType.Bgra8888)
        {
            wpfPixelFormat = (skBitmap.AlphaType == SKAlphaType.Premul) ? PixelFormats.Pbgra32 : PixelFormats.Bgra32;
        }
        else
        {
            throw new NotSupportedException($"SKBitmap ColorType '{skBitmap.ColorType}' with AlphaType '{skBitmap.AlphaType}' is not supported.");
        }

        var bitmapSource = BitmapSource.Create(
            skBitmap.Width, skBitmap.Height,
            96, 96, 
            wpfPixelFormat, 
            null, 
            skBitmap.GetPixels(), 
            skBitmap.RowBytes * skBitmap.Height, 
            skBitmap.RowBytes, 
            BitmapCacheOption.OnLoad 
        );
        
        if (bitmapSource.CanFreeze)
        {
            bitmapSource.Freeze(); 
        }
        return bitmapSource;
    }
}

public void LoadDocument(string filePath)
{
    if (isDisposed)
    {
        Debug.WriteLine("[CustomScrollView.LoadDocument] Control is disposed. Aborting load.");
        return;
    }

    Debug.WriteLine($"[CustomScrollView.LoadDocument] Attempting to load document: {filePath}");

    try
    {
        if (document != null)
        {
            Debug.WriteLine("[CustomScrollView.LoadDocument] Disposing existing PDF document.");
            document.Dispose();
            document = null;
        }
        
        Pages.Clear(); 
        Debug.WriteLine("[CustomScrollView.LoadDocument] Cleared existing PageViewModels from Pages collection.");

        if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath))
        {
            Debug.WriteLine($"[CustomScrollView.LoadDocument] File path is invalid or file does not exist: {filePath}");
            PdfFilePath = null;
            return;
        }

        Debug.WriteLine("[CustomScrollView.LoadDocument] Opening PDF document using PdfPig.");
        document = UglyToad.PdfPig.PdfDocument.Open(filePath);
        PdfFilePath = filePath;
        Debug.WriteLine($"[CustomScrollView.LoadDocument] Document opened. Number of pages: {document.NumberOfPages}.");

        if (document.NumberOfPages == 0)
        {
            Debug.WriteLine("[CustomScrollView.LoadDocument] Document has 0 pages.");
            return;
        }

        for (int i = 0; i < document.NumberOfPages; i++)
        {
            Pages.Add(new PageViewModel { PageInfo = $"Loading page {i + 1}..." }); 
        }
        Debug.WriteLine($"[CustomScrollView.LoadDocument] Added {Pages.Count} PageViewModel instances to Pages collection.");

        Debug.WriteLine("[CustomScrollView.LoadDocument] Starting background task to preload all pages.");
        Task.Run(() => PreloadAllPagesInBackground());

        CurrentZoomLevel = 1.0;
        Debug.WriteLine("[CustomScrollView.LoadDocument] LoadDocument method finished successfully.");
    }
    catch (Exception ex)
    {
        Debug.WriteLine($"[CustomScrollView.LoadDocument] CRITICAL ERROR loading document: {ex.ToString()}");
        PdfFilePath = null;
        if (document != null)
        {
            document.Dispose();
            document = null;
        }
        Pages.Clear();
    }
}

private async Task PreloadAllPagesInBackground()
{
    if (document == null)
    {
        Debug.WriteLine("[CustomScrollView.PreloadAllPagesInBackground] Document is null. Aborting preload.");
        return;
    }

    Debug.WriteLine($"[CustomScrollView.PreloadAllPagesInBackground] Starting to preload {document.NumberOfPages} pages.");

    for (int i = 0; i < document.NumberOfPages; i++)
    {
        if (isDisposed)
        {
            Debug.WriteLine($"[CustomScrollView.PreloadAllPagesInBackground] Control is disposed. Aborting preload at page index {i}.");
            return;
        }

        int pageIndexToLoad = i;

        Debug.WriteLine($"[CustomScrollView.PreloadAllPagesInBackground] Preparing to load content for page {pageIndexToLoad + 1} of {document.NumberOfPages}.");

        BitmapSource bitmap = null;
        string pageInfoText = "";

        try
        {
            if (pageIndexToLoad >= Pages.Count)
            {
                Debug.WriteLine($"[CustomScrollView.PreloadAllPagesInBackground] Error: pageIndexToLoad {pageIndexToLoad} is out of bounds for Pages collection (Count: {Pages.Count}). Skipping page.");
                continue; 
            }

            bitmap = GetBitmapForPage(pageIndexToLoad); 
            
            if (bitmap != null)
            {
                pageInfoText = $"Page {pageIndexToLoad + 1} of {document.NumberOfPages}";
                Debug.WriteLine($"[CustomScrollView.PreloadAllPagesInBackground] Successfully rendered page {pageIndexToLoad + 1}.");
            }
            else
            {
                pageInfoText = $"Error loading page {pageIndexToLoad + 1} (bitmap was null)";
                Debug.WriteLine($"[CustomScrollView.PreloadAllPagesInBackground] Failed to render page {pageIndexToLoad + 1} (GetBitmapForPage returned null).");
            }
        }
        catch (Exception ex)
        {
            pageInfoText = $"Error processing page {pageIndexToLoad + 1}";
            Debug.WriteLine($"[CustomScrollView.PreloadAllPagesInBackground] Exception while processing page {pageIndexToLoad + 1}: {ex.ToString()}");
        }

        if (Application.Current != null)
        {
            Application.Current.Dispatcher.Invoke(() =>
            {
                if (isDisposed)
                {
                    Debug.WriteLine($"[CustomScrollView.PreloadAllPagesInBackground] Dispatcher: Control is disposed. Skipping UI update for page {pageIndexToLoad + 1}.");
                    return;
                }
                if (pageIndexToLoad >= Pages.Count)
                {
                     Debug.WriteLine($"[CustomScrollView.PreloadAllPagesInBackground] Dispatcher: pageIndexToLoad {pageIndexToLoad} is out of bounds for Pages collection (Count: {Pages.Count}) during UI update. Skipping.");
                    return;
                }

                var viewModel = Pages[pageIndexToLoad];
                if (viewModel != null)
                {
                    viewModel.ImageSource = bitmap; 
                    viewModel.PageInfo = pageInfoText;
                }
                else
                {
                    Debug.WriteLine($"[CustomScrollView.PreloadAllPagesInBackground] Dispatcher: ViewModel for page {pageIndexToLoad + 1} was null. Cannot update UI.");
                }
            });
        }
        else
        {
            Debug.WriteLine("[CustomScrollView.PreloadAllPagesInBackground] Application.Current is null. Cannot dispatch UI update. Preload might be interrupted if app is shutting down.");
            return;
        }
    }
    Debug.WriteLine("[CustomScrollView.PreloadAllPagesInBackground] Finished preloading all pages.");
}

private BitmapSource GetBitmapForPage(int pageIndex)
{
    if (document == null) {
        Debug.WriteLine($"[CustomScrollView.GetBitmapForPage] Document is null. Cannot render page {pageIndex + 1}.");
        return null;
    }
    if (pageIndex < 0 || pageIndex >= document.NumberOfPages) {
        Debug.WriteLine($"[CustomScrollView.GetBitmapForPage] Page index {pageIndex} is out of range (0-{document.NumberOfPages - 1}). Cannot render page.");
        return null;
    }

    try
    {
        using (var page = document.Page(pageIndex + 1))
        using (var skBitmap = new SKBitmap((int)page.Width, (int)page.Height, SKColorType.Bgra8888, SKAlphaType.Premul))
        {
            page.Render(skBitmap); 
            var bitmapSource = skBitmap.ToBitmapSource();
            return bitmapSource; 
        }
    }
    catch (Exception ex)
    {
        Debug.WriteLine($"[CustomScrollView.GetBitmapForPage] Exception rendering page {pageIndex + 1}: {ex.ToString()}");
        return null;
    }
}

public void Dispose()
{
    if (isDisposed) return;
    isDisposed = true;

    if (document != null)
    {
        document.Dispose();
        document = null;
    }
    Pages.Clear();
}