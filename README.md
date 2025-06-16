# CSV Userflow Viewer

A modern web application for displaying and viewing PDF userflows for Carbon Sync Ventures (CSV) projects. This tool helps UI/UX designers share their userflow designs with backend developers for easy review and implementation.

![CSV Userflow Viewer](https://via.placeholder.com/800x400?text=CSV+Userflow+Viewer)

## 📋 Overview

CSV Userflow Viewer is an interactive web application that organizes and displays PDF userflows from different CSV projects. As the UI/UX designer, whenever you finish a userflow, you can download it as a PDF and upload it to this repository. Backend developers can then easily access and review these userflows through this interface.

## 🌟 Features

- **Project Organization**: PDFs are organized by project folders (Senate Digitization, Converge, CSV Registry, DENR, DTI)
- **Modern UI**: Clean, responsive interface with light/dark mode support
- **PDF Viewer**: Built-in PDF viewer with multiple viewing options:
  - Page view with navigation controls
  - Continuous scroll view for reviewing entire flows
  - Zoom in/out functionality
- **Deep Linking**: Direct links to specific PDFs and pages
- **Responsive Design**: Works on mobile, tablet, and desktop devices

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- For local development: [Node.js](https://nodejs.org/) (for running the manifest generator)

### Running Locally

1. Clone this repository:
   ```
   git clone https://github.com/EdwardZehuaZhang/CSV-Userfows.git
   cd CSV-Userfows
   ```

2. Run the site using one of these methods:
   - **Using Python's built-in HTTP server**:
     ```
     # Python 3.x
     python -m http.server

     # Python 2.x
     python -m SimpleHTTPServer
     ```
   - **Using VS Code with Live Server extension**:
     - Install the "Live Server" extension
     - Right-click on `index.html` and select "Open with Live Server"

3. View in your browser at `http://localhost:8000` (or the port specified)

## 📁 Adding New Userflows

1. Add your PDF files to the appropriate project folder (e.g., `Senate_Digitization/`)
2. Run the manifest generator to update the file listings:
   ```
   node generate-manifests.js
   ```
3. Commit and push the changes to GitHub

## 🏗️ Project Structure

```
├── index.html            # Main entry point
├── css/                  # Styling
│   └── styles.css
├── js/                   # JavaScript modules
│   ├── folder-scanner.js # Handles directory scanning and UI building
│   ├── navigation.js     # Handles folder/page navigation
│   ├── pdf-loader.js     # PDF loading and URL handling
│   ├── pdf-viewer.js     # Main coordinator for PDF functionality
│   └── ...               # Other supporting modules
├── Project_Folders/      # PDF userflows organized by project
│   ├── Senate_Digitization/
│   ├── Converge/
│   ├── CSV_Registry/
│   ├── DENR/
│   └── DTI/
└── generate-manifests.js # Script to generate JSON listings of PDFs
```

## 🔧 Technologies Used

- HTML5, CSS3, JavaScript
- [TailwindCSS](https://tailwindcss.com/) - For styling
- [PDF.js](https://mozilla.github.io/pdf.js/) - For PDF rendering
- [SimpleBar](https://grsmto.github.io/simplebar/) - For custom scrollbars
- [Font Awesome](https://fontawesome.com/) - For icons

## 👨‍💼 Author

- **Zehu Zhang** - UI/UX Designer at Carbon Sync Ventures
  - [LinkedIn](https://www.linkedin.com/in/edward-zhang-670a97264/)
  - [GitHub](https://github.com/EdwardZehuaZhang)
  - [Behance](https://www.behance.net/edwardzehuazhang)

## 📜 License

© 2025 Zehu Zhang. All rights reserved.
