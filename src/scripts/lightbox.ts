// Create lightbox overlay
const overlay = document.createElement('div');
overlay.className = 'lightbox-overlay';
document.body.appendChild(overlay);

// Close lightbox on click
overlay.addEventListener('click', () => {
    overlay.classList.remove('active');
    overlay.innerHTML = '';
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
        overlay.innerHTML = '';
    }
});

// Add click handlers to prose images
const proseImages = document.querySelectorAll('.prose img');
proseImages.forEach((img) => {
    (img as HTMLImageElement).addEventListener('click', () => {
        const fullImg = document.createElement('img');
        fullImg.src = (img as HTMLImageElement).src;
        fullImg.alt = (img as HTMLImageElement).alt || '';
        overlay.innerHTML = '';
        overlay.appendChild(fullImg);
        overlay.classList.add('active');
    });
});
