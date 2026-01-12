// ============================================
// PUBLIC/JS/MAIN.JS
// ============================================

let allItems = [];
let isAuthenticated = false;

// Check authentication status
async function checkAuth() {
  try {
    const res = await fetch('/auth/status');
    const data = await res.json();
    isAuthenticated = data.authenticated;
  } catch (error) {
    console.error('Error checking auth:', error);
  }
}

// Load all items
async function loadItems() {
  try {
    const res = await fetch('/items');
    allItems = await res.json();
    displayItems(allItems);
  } catch (error) {
    console.error('Error loading items:', error);
    document.getElementById('itemsContainer').innerHTML = 
      '<p style="text-align:center; color:white;">Error loading items. Please refresh the page.</p>';
  }
}

// Display items
function displayItems(items) {
  const container = document.getElementById('itemsContainer');
  
  if (items.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:white; grid-column: 1/-1;">No items found. Try adjusting your filters.</p>';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="item-card">
      <img src="${item.image}" alt="${item.itemName}" onerror="this.src='/uploads/default-item.jpg'">
      <div class="item-details">
        <h3>${item.itemName}</h3>
        <p><strong>Department:</strong> ${item.department}</p>
        <p><strong>Semester:</strong> ${item.semester}</p>
        <p class="item-price">₹${item.price}</p>
        
        <!-- LIKES SECTION -->
        <div class="item-likes">
          <button 
            class="like-btn" 
            id="like-btn-${item._id}"
            onclick="toggleLike('${item._id}')"
            ${!isAuthenticated ? 'disabled' : ''}
          >
            ❤️
          </button>
          <span class="likes-count" id="likes-count-${item._id}">${item.likesCount || 0}</span>
          <span class="likes-text">likes</span>
        </div>
        
        <button class="btn-add-cart" onclick="addToCart('${item._id}')" ${!isAuthenticated ? 'disabled' : ''}>
          ${isAuthenticated ? 'Add to Cart' : 'Login to Add'}
        </button>
      </div>
    </div>
  `).join('');

  // Check which items user has liked (only if authenticated)
  if (isAuthenticated) {
    items.forEach(item => {
      checkIfLiked(item._id);
    });
  }
}

// Add to cart
async function addToCart(itemId) {
  if (!isAuthenticated) {
    alert('Please login to add items to cart');
    window.location.href = '/auth/login';
    return;
  }

  try {
    const res = await fetch('/add-to-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemId })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Item added to cart successfully!');
    } else {
      alert(data.error || 'Failed to add item to cart');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('An error occurred. Please try again.');
  }
}

// Apply filters
async function applyFilters() {
  const department = document.getElementById('departmentFilter').value;
  const semester = document.getElementById('semesterFilter').value;

  try {
    const params = new URLSearchParams();
    if (department) params.append('department', department);
    if (semester) params.append('semester', semester);

    const res = await fetch(`/items/filter?${params.toString()}`);
    const items = await res.json();
    displayItems(items);
  } catch (error) {
    console.error('Error filtering items:', error);
    alert('Error applying filters. Please try again.');
  }
}

// Clear filters
function clearFilters() {
  document.getElementById('departmentFilter').value = '';
  document.getElementById('semesterFilter').value = '';
  displayItems(allItems);
}

// Logout function
async function logout() {
  try {
    const res = await fetch('/auth/logout', { method: 'POST' });
    if (res.ok) {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  await loadItems();

  // Add enter key support for filters
  document.getElementById('departmentFilter')?.addEventListener('change', applyFilters);
  document.getElementById('semesterFilter')?.addEventListener('change', applyFilters);
});

// Toggle like/unlike
async function toggleLike(itemId) {
  if (!isAuthenticated) {
    alert('Please login to like items');
    window.location.href = '/auth/login';
    return;
  }

  const likeBtn = document.getElementById(`like-btn-${itemId}`);
  const likesCountElement = document.getElementById(`likes-count-${itemId}`);
  
  // Disable button while processing
  likeBtn.disabled = true;

  try {
    const res = await fetch(`/rating/like/${itemId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (res.ok) {
      // Update likes count
      likesCountElement.textContent = data.likesCount;
      
      // Update button appearance
      if (data.liked) {
        likeBtn.textContent = '❤️';
        likeBtn.classList.add('liked');
      } else {
        likeBtn.textContent = '🤍';
        likeBtn.classList.remove('liked');
      }
    } else {
      alert(data.error || 'Failed to update like');
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    alert('An error occurred. Please try again.');
  } finally {
    likeBtn.disabled = false;
  }
}

// Check if user has liked an item
async function checkIfLiked(itemId) {
  try {
    const res = await fetch(`/rating/check-like/${itemId}`);
    const data = await res.json();

    if (res.ok) {
      const likeBtn = document.getElementById(`like-btn-${itemId}`);
      if (likeBtn) {
        if (data.liked) {
          likeBtn.textContent = '❤️';
          likeBtn.classList.add('liked');
        } else {
          likeBtn.textContent = '🤍';
          likeBtn.classList.remove('liked');
        }
      }
    }
  } catch (error) {
    console.error('Error checking like status:', error);
  }
}
