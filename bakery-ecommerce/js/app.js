// Main JavaScript file for the Bakery E-Commerce application

// Function to initialize the application
function initApp() {
    console.log("Bakery E-Commerce Application Initialized");
    // Additional initialization code can go here
}

// Function to handle global events
function handleGlobalEvents() {
    // Example: Add event listeners for navigation links
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            console.log(`Navigating to ${event.target.textContent}`);
        });
    });
}

// Call the initialization function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    handleGlobalEvents();
});