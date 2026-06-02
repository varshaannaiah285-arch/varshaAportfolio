/* CORE FRONTEND INTERACTIONS & DOM MANAGER */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize APIs and backend detection
  const backendMode = await ApiService.init();
  updateBackendBadge(backendMode);
  
  // Theme Toggle Logic
  setupTheme();
  
  // Mobile Nav Drawer Toggle
  setupMobileNav();
  
  // Scroll Navigation Highlight & Skill Fill Animation
  setupScrollTracking();
  
  // Lightbox Modal for Gallery Images
  setupLightbox();
  
  // Load Dynamic Data (Page Views & Guestbook)
  await refreshDynamicContent();
  
  // Bind Contact/Guestbook Form Submissions
  setupFormSubmission();
});

// Update backend status badge
function updateBackendBadge(mode) {
  const badge = document.getElementById('backend-mode-badge');
  if (!badge) return;
  
  if (mode === 'EXPRESS') {
    badge.textContent = '⚡ Express Server Connected';
    badge.style.borderColor = 'var(--accent-cyan)';
    badge.style.color = 'var(--accent-cyan)';
    badge.style.backgroundColor = 'hsla(182, 100%, 50%, 0.1)';
  } else {
    badge.textContent = '⚡ Client-Side LocalStorage Sandbox';
    badge.style.borderColor = 'var(--accent-purple)';
    badge.style.color = 'var(--accent-purple)';
    badge.style.backgroundColor = 'hsla(272, 100%, 65%, 0.1)';
  }
}

// Light / Dark Theme Management
function setupTheme() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  const storedTheme = localStorage.getItem('bit_portfolio_theme') || 'dark';
  
  document.documentElement.setAttribute('data-theme', storedTheme);
  updateThemeIcon(storedTheme);
  
  themeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('bit_portfolio_theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#theme-toggle-btn span');
  if (icon) {
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
  }
}

// Mobile Menu
function setupMobileNav() {
  const menuToggle = document.getElementById('menu-toggle-btn');
  const navLinks = document.getElementById('nav-links-list');
  const links = navLinks.querySelectorAll('a');
  
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    menuToggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
  });
  
  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuToggle.textContent = '☰';
    });
  });
}

// Scroll Intersection Tracking
function setupScrollTracking() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-links a');
  
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -60% 0px', // Trigger when section occupies the active middle screen viewport
    threshold: 0
  };
  
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeId = entry.target.getAttribute('id');
        
        // Highlight Navigation Link
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${activeId}`) {
            link.classList.add('active');
          }
        });
        
        // Trigger Skill Fill Animations when Skills Section is visible
        if (activeId === 'skills') {
          animateSkills();
        }
      }
    });
  }, observerOptions);
  
  sections.forEach(section => sectionObserver.observe(section));
}

// Animate Skills Fill
function animateSkills() {
  const fillBars = document.querySelectorAll('.skill-bar-fill');
  fillBars.forEach(bar => {
    const level = bar.getAttribute('data-level');
    bar.style.width = level;
  });
}

// Gallery Lightbox Modal Zoom
function setupLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const title = item.querySelector('.gallery-item-title').textContent;
      
      lightboxImg.src = img.src;
      lightboxCaption.textContent = title;
      lightbox.style.display = 'flex';
    });
  });
  
  closeBtn.addEventListener('click', () => {
    lightbox.style.display = 'none';
  });
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.style.display = 'none';
    }
  });
}

// Fetch and Render Dynamic Page Data
async function refreshDynamicContent() {
  try {
    // 1. Load Page views
    const viewCount = await ApiService.getAnalytics();
    const countElement = document.getElementById('visit-counter-value');
    if (countElement) {
      countElement.textContent = viewCount;
    }
    
    // 2. Load and Render Guestbook Wall
    const messages = await ApiService.getMessages();
    const listElement = document.getElementById('guestbook-messages-list');
    if (listElement) {
      listElement.innerHTML = '';
      
      if (messages.length === 0) {
        listElement.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1rem;">No messages yet. Be the first!</p>';
        return;
      }
      
      messages.forEach(msg => {
        const timeFormatted = formatTime(msg.timestamp);
        const item = document.createElement('div');
        item.className = 'wall-item';
        item.innerHTML = `
          <div class="wall-item-header">
            <span class="wall-item-name">${escapeHTML(msg.name)}</span>
            <span class="wall-item-time">${timeFormatted}</span>
          </div>
          <p class="wall-item-message">${escapeHTML(msg.message)}</p>
        `;
        listElement.appendChild(item);
      });
    }
  } catch (e) {
    console.error('Error refreshing content:', e);
  }
}

// Form Submit Management
function setupFormSubmission() {
  const form = document.getElementById('guestbook-submit-form');
  const statusElement = document.getElementById('form-status-message');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('form-input-name').value.trim();
    const email = document.getElementById('form-input-email').value.trim();
    const message = document.getElementById('form-input-message').value.trim();
    
    if (!name || !email || !message) {
      showFormStatus('All fields are required!', 'error');
      return;
    }
    
    try {
      showFormStatus('Submitting message...', 'info');
      await ApiService.postMessage(name, email, message);
      
      form.reset();
      showFormStatus('Message posted successfully!', 'success');
      
      // Refresh the list immediately to show the new message
      await refreshDynamicContent();
      
      // Hide status message after 3 seconds
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 3000);
    } catch (err) {
      showFormStatus('Failed to submit message. Please try again.', 'error');
    }
  });
}

function showFormStatus(text, type) {
  const status = document.getElementById('form-status-message');
  if (!status) return;
  
  status.textContent = text;
  status.className = `form-status ${type}`;
  status.style.display = 'block';
  
  if (type === 'info') {
    status.style.color = 'var(--text-secondary)';
  }
}

// Helper Utilities
function formatTime(isoString) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
