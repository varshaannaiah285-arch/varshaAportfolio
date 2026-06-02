/* CLIENT-SIDE API CONTROLLER WITH LOCALSTORAGE FALLBACK */

const API_CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  isExpressServer: false, // Will be dynamically checked
};

const ApiService = {
  // Check if Express backend is running
  async init() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1000); // 1s timeout
      
      const response = await fetch(`${API_CONFIG.baseUrl}/health`, { 
        method: 'GET',
        signal: controller.signal 
      });
      clearTimeout(id);
      
      if (response.ok) {
        API_CONFIG.isExpressServer = true;
        console.log('⚡ Connected to Express API Server.');
        return 'EXPRESS';
      }
    } catch (e) {
      console.warn('⚠️ Express Server not detected. Falling back to Browser LocalStorage Sandbox.');
    }
    
    API_CONFIG.isExpressServer = false;
    // Initialise LocalStorage arrays if not present
    if (!localStorage.getItem('bit_guestbook')) {
      localStorage.setItem('bit_guestbook', JSON.stringify([
        { id: 1, name: "Aditi", message: "Great portfolio! The theater photos look awesome!", timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
        { id: 2, name: "Rahul", message: "Nice project work! Lost & Found prototype is very clean.", timestamp: new Date(Date.now() - 3600000 * 12).toISOString() }
      ]));
    }
    if (!localStorage.getItem('bit_views')) {
      localStorage.setItem('bit_views', '142');
    } else {
      // Increment views on load in local mode
      const current = parseInt(localStorage.getItem('bit_views')) || 0;
      localStorage.setItem('bit_views', (current + 1).toString());
    }
    return 'LOCALSTORAGE';
  },

  // Record page views and get analytics
  async getAnalytics() {
    if (API_CONFIG.isExpressServer) {
      try {
        const res = await fetch(`${API_CONFIG.baseUrl}/analytics`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          return data.views;
        }
      } catch (e) {
        console.error('Analytics API error, falling back to local:', e);
      }
    }
    
    // Local fallback
    return parseInt(localStorage.getItem('bit_views')) || 0;
  },

  // Retrieve Guestbook messages
  async getMessages() {
    if (API_CONFIG.isExpressServer) {
      try {
        const res = await fetch(`${API_CONFIG.baseUrl}/guestbook`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.error('Guestbook API GET error:', e);
      }
    }
    
    // Local fallback
    return JSON.parse(localStorage.getItem('bit_guestbook')) || [];
  },

  // Submit new Guestbook message
  async postMessage(name, email, message) {
    const payload = { name, email, message };
    
    if (API_CONFIG.isExpressServer) {
      try {
        const res = await fetch(`${API_CONFIG.baseUrl}/guestbook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.error('Guestbook API POST error:', e);
      }
    }
    
    // Local fallback
    const localMessages = JSON.parse(localStorage.getItem('bit_guestbook')) || [];
    const newEntry = {
      id: localMessages.length ? Math.max(...localMessages.map(m => m.id)) + 1 : 1,
      name,
      email,
      message,
      timestamp: new Date().toISOString()
    };
    localMessages.unshift(newEntry); // Prepend to show latest first
    localStorage.setItem('bit_guestbook', JSON.stringify(localMessages));
    return newEntry;
  }
};
