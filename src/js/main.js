// Main JavaScript file for The Bay Harbor Gooner
document.addEventListener('DOMContentLoaded', () => {
  console.log('The Bay Harbor Gooner - The ritual begins...');
  
  // Add some dark atmosphere effects
  const addBloodDropEffect = () => {
    const header = document.querySelector('header');
    if (header) {
      setInterval(() => {
        const drop = document.createElement('div');
        drop.className = 'absolute w-1 h-8 bg-red-600 rounded-b-full opacity-70 animate-pulse';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.top = '0';
        drop.style.animationDuration = (Math.random() * 3 + 2) + 's';
        
        header.appendChild(drop);
        
        // Remove the drop after animation
        setTimeout(() => {
          if (drop.parentNode) {
            drop.parentNode.removeChild(drop);
          }
        }, 5000);
      }, 10000); // Add a drop every 10 seconds
    }
  };
  
  // Initialize blood drop effect
  addBloodDropEffect();
  
  // Add click tracking for analytics (placeholder)
  document.addEventListener('click', (e) => {
    if (e.target.textContent?.includes('$GOONER') || e.target.textContent?.includes('Buy')) {
      console.log('User interested in buying $GOONER - The hunt begins!');
    }
  });
}); 