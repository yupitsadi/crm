'use client';

import { useEffect, useState } from 'react';

export default function SidebarLayoutEffect() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  useEffect(() => {
    // Get initial sidebar state from localStorage
    const savedState = localStorage.getItem('sidebarExpanded');
    if (savedState !== null) {
      setSidebarExpanded(savedState === 'true');
    }
    
    // Function to check sidebar state and update main content
    const updateLayout = () => {
      const sidebarElement = document.querySelector('.h-full.bg-gray-800');
      const mainContent = document.getElementById('main-content');
      
      if (!sidebarElement || !mainContent) return;
      
      // Check if sidebar is collapsed or expanded based on class or width
      const sidebarWidth = sidebarElement.clientWidth;
      const isExpanded = sidebarWidth > 50; // If width is > 50px, consider it expanded
      
      setSidebarExpanded(isExpanded);
      
      // Apply the appropriate margin with transition
      if (isExpanded) {
        mainContent.style.transition = 'margin-left 0.3s ease-in-out';
        mainContent.style.marginLeft = '16rem'; // 256px = 16rem (expanded sidebar)
      } else {
        mainContent.style.transition = 'margin-left 0.3s ease-in-out';
        mainContent.style.marginLeft = '4rem'; // 64px = 4rem (collapsed sidebar)
      }
    };
    
    // Listen for sidebar state changes via custom event
    const handleSidebarStateChange = (event: CustomEvent) => {
      const { isExpanded } = event.detail;
      setSidebarExpanded(isExpanded);
      
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.style.transition = 'margin-left 0.3s ease-in-out';
        mainContent.style.marginLeft = isExpanded ? '16rem' : '4rem';
      }
    };
    
    // Initial check
    updateLayout();
    
    // Add custom event listener for sidebar state changes
    window.addEventListener('sidebarStateChange', handleSidebarStateChange as EventListener);
    
    // Create a mutation observer to watch for sidebar changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Only update if class or style attribute changed
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
          updateLayout();
        }
      }
    });
    
    // Get the sidebar element
    const sidebarElement = document.querySelector('.h-full.bg-gray-800');
    
    if (sidebarElement) {
      // Start observing the sidebar for attribute changes
      observer.observe(sidebarElement, { attributes: true });
    }
    
    // Also add a resize listener to handle manual window resizing
    window.addEventListener('resize', updateLayout);
    
    // Cleanup observer and event listeners on component unmount
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('sidebarStateChange', handleSidebarStateChange as EventListener);
    };
  }, []);
  
  // Add responsive styles for small screens
  useEffect(() => {
    const handleResize = () => {
      const mainContent = document.getElementById('main-content');
      if (!mainContent) return;
      
      if (window.innerWidth < 768) {
        // On mobile, always use minimal margin regardless of sidebar state
        mainContent.style.marginLeft = '4rem';
      } else {
        // On larger screens, respect the sidebar state
        mainContent.style.marginLeft = sidebarExpanded ? '16rem' : '4rem';
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarExpanded]);
  
  return null;
} 