I need a beautiful English visual pdf viwer website that hosts multiple pdf files.
THe documents are located right now here: D:\Coding Files\GitHub\CSV-Userfows\Senate_Digitization\What A Journalist Following Imprechement Might See User flow.pdf
The file name is: userflow-to-web.html.

## Content requirements
- All page content must be in English
- Keep the core information of the original file, but present it in a more readable and visual way
- Add an author information area at the bottom of the page, including:
  - Author name: Zehu Zhang
  - Social media links: at least Linkedin: https://www.linkedin.com/in/edward-zhang-670a97264/
  - Copyright information and year

## Design style
- The overall style refers to the simple and modern design of Linear App
- Use a clear visual hierarchy to highlight important content
- The color scheme should be professional and harmonious, suitable for long-term reading

## Technical specifications
- Use HTML5, TailwindCSS 3.0+ (introduced through CDN) and necessary JavaScript
- Implement a complete dark/light mode switching function, and follow the system settings by default
- The code structure is clear and contains appropriate comments for easy understanding and maintenance

## Responsive design
- The page must be displayed perfectly on all devices (mobile phones, tablets, desktops)
- Optimize the layout and font size for different screen sizes
- Ensure a good touch experience on mobile devices

## Media resources
- Use the Markdown image link in the document (if any)
- Use the video embed code in the document (if any)

## Icons and visual elements
- Use professional icon libraries such as Font Awesome or Material Icons (imported via CDN)
- Choose appropriate illustrations or charts to display data according to the content theme
- Avoid using emoji as the main icon

## Interactive experience
- Add appropriate micro-interaction effects to improve the user experience:
  - Slightly enlarge and change the color when the button is hovered
  - Delicate shadow and border effects when the card element is hovered
  - Smooth transition effect when the page scrolls
  - Elegant fade-in animation when the content block is loaded

## Performance optimization
- Ensure the page loads quickly and avoid unnecessary large resources
- Use modern formats (WebP) for images and compress them appropriately
- Implement lazy loading technology for long page content

---

## **PDF Viewer Extension**
- Instead of a static portfolio, the site must function as a PDF viewer/slideshow for UI userflows
- Provide a landing page or navigation menu where each link corresponds to one PDF file (e.g., “UI Flow 1”, “UI Flow 2”, etc.)
- When a user clicks a PDF link:
  - Load the corresponding PDF in a full-width, embedded viewer component
  - Enable next/previous controls as well as direct page-number input
  - Support scroll, swipe (on touch devices), and keyboard navigation (←/→ keys)
  - Display the current page indicator and total page count prominently
- Ensure the PDF viewer:
  - Adapts to dark/light mode seamlessly
  - Loads pages lazily to optimize performance on large documents
  - Falls back gracefully if PDF fails to load (displaying an error message)
- Allow deep-linking to a specific page in a PDF via URL hash or query parameter (e.g., `?file=ui1.pdf&page=3`)

---

## Output requirements
- Provide a complete and executable single HTML file, including all necessary CSS and JavaScript
- Ensure that the code complies with W3C standards and has no error warnings
- The page maintains consistent appearance and functionality in different browsers

