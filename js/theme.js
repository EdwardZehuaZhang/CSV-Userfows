// Theme handling functions
function setTheme() {
    if (localStorage.theme === 'dark' || 
        (!('theme' in localStorage) && 
        window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Initialize theme
document.addEventListener('DOMContentLoaded', () => {
    setTheme();
    
    // Set current year for copyright
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Set up theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
            localStorage.theme = 'light';
            document.documentElement.classList.remove('dark');
        } else {
            localStorage.theme = 'dark';
            document.documentElement.classList.add('dark');
        }
    });
});