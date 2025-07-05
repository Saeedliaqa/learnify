// shared-auth.js - Shared Authentication and UI Functions

// 🔐 Main authentication check function
async function initializeAuth() {
    console.log('🔍 Starting authentication check...');
    
    // Get token from localStorage
    const token = localStorage.getItem('learnify_token');
    
    if (!token) {
        console.log('❌ No token found - redirecting to login');
        alert('Please login to access this page');
        window.location.href = './learnifylogin.html?error=no_token';
        return false;
    }

    // Verify token with your backend API
    try {
        console.log('🔍 Verifying token with server...');
        const response = await axios.get('http://localhost:3000/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000
        });
        
        if (response.status === 200 && response.data.user) {
            console.log('✅ Token verified - user authenticated');
            
            // Update localStorage with fresh user data
            localStorage.setItem('learnify_user', JSON.stringify(response.data.user));
            
            // Set default axios headers for future requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Update UI with user data
            updateUserInterface(response.data.user);
            
            return true;
        } else {
            throw new Error('Invalid server response');
        }
    } catch (error) {
        console.error('❌ Token verification failed:', error);
        
        // Clear invalid token
        localStorage.removeItem('learnify_token');
        localStorage.removeItem('learnify_user');
        localStorage.removeItem('learnify_login_time');
        
        // Show error and redirect
        let errorMsg = 'Your session has expired. Please login again.';
        if (error.response) {
            if (error.response.status === 401) {
                errorMsg = 'Authentication failed. Please login again.';
            } else if (error.response.status === 404) {
                errorMsg = 'User account not found. Please login again.';
            }
        } else if (error.request) {
            errorMsg = 'Cannot connect to server. Please check your connection and try again.';
        }
        
        alert(errorMsg);
        window.location.href = './learnifylogin.html?error=invalid_token';
        return false;
    }
}

// 🔄 Function to update UI with user data from database
function updateUserInterface(user) {
    try {
        console.log('🔄 Updating UI with user data:', user);
        
        // Update coin count displays
        const coinCountEls = document.querySelectorAll('#coin-count');
        coinCountEls.forEach(el => {
            if (el) {
                el.textContent = user.coins || 0;
            }
        });
        
        // Update user name displays (if any)
        const userNameEls = document.querySelectorAll('#user-name, [data-user-name]');
        userNameEls.forEach(el => {
            if (el) {
                el.textContent = user.name || 'User';
            }
        });
        
        // Store user data globally
        window.currentUser = user;
        
        console.log('✅ UI updated successfully');
        
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

// 🚪 Enhanced logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        console.log('🚪 Logging out user...');
        
        // Clear all authentication data
        localStorage.removeItem('learnify_token');
        localStorage.removeItem('learnify_user');
        localStorage.removeItem('learnify_login_time');
        localStorage.removeItem('currentQuiz');
        
        // Clear axios defaults
        delete axios.defaults.headers.common['Authorization'];
        
        alert('You have been logged out successfully!');
        window.location.href = './learnifylogin.html?message=logged_out';
    }
}

// 🔄 Periodic token validation (every 5 minutes)
function startPeriodicTokenCheck() {
    setInterval(async function() {
        const token = localStorage.getItem('learnify_token');
        
        if (!token) {
            console.log('⚠️ Token missing during periodic check');
            alert('Your session has expired. Please login again.');
            window.location.href = './learnifylogin.html?error=session_expired';
            return;
        }

        try {
            await axios.get('http://localhost:3000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 5000
            });
            console.log('✅ Periodic token validation successful');
        } catch (error) {
            console.error('❌ Periodic token validation failed');
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                alert('Your session has expired. Please login again.');
                logout();
            }
        }
    }, 300000); // 5 minutes
}

// 🔒 Prevent unauthorized access via browser back button
function setupBrowserProtection() {
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            // Page was loaded from cache (back button)
            const token = localStorage.getItem('learnify_token');
            if (!token) {
                console.log('⚠️ No token found in cached page');
                window.location.href = './learnifylogin.html?error=session_expired';
            }
        }
    });
}

// 🎯 Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    // Load navbar
    await loadNavbar();
    
    // Initialize authentication
    const authSuccess = await initializeAuth();
    
    if (authSuccess) {
        // Start periodic checks
        startPeriodicTokenCheck();
        
        // Setup browser protection
        setupBrowserProtection();
        
        // Initialize AOS if available
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-in-out',
                once: true
            });
        }
    }
});

// 📡 Function to load navbar
async function loadNavbar() {
    try {
        const response = await fetch('./navbar.html');
        const navbarHTML = await response.text();
        
        // Insert navbar at the beginning of body
        const navbarContainer = document.createElement('div');
        navbarContainer.innerHTML = navbarHTML;
        document.body.insertBefore(navbarContainer, document.body.firstChild);
        
        console.log('✅ Navbar loaded successfully');
    } catch (error) {
        console.error('❌ Error loading navbar:', error);
        // Fallback: show basic navigation
        document.body.insertAdjacentHTML('afterbegin', `
            <nav class="h-20 flex items-center justify-between px-6 py-4 bg-white">
                <div class="text-4xl font-bold text-[#212121]">Learnify.</div>
                <button onclick="logout()" class="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </nav>
        `);
    }
}

// 💰 Utility function to update coin display
function updateCoinDisplay(newCoinAmount) {
    const coinCountEls = document.querySelectorAll('#coin-count');
    coinCountEls.forEach(el => {
        if (el) {
            el.textContent = newCoinAmount;
        }
    });
    
    // Update localStorage as well
    const userData = JSON.parse(localStorage.getItem('learnify_user') || '{}');
    userData.coins = newCoinAmount;
    localStorage.setItem('learnify_user', JSON.stringify(userData));
}

// Export functions for global use
window.logout = logout;
window.updateCoinDisplay = updateCoinDisplay;
window.updateUserInterface = updateUserInterface;