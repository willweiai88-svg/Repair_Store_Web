// js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const userEmail = localStorage.getItem('userEmail')
  const userName = localStorage.getItem('userName')

  if (!isLoggedIn) {
    document.getElementById('member-dashboard').classList.add('hidden')
    document.getElementById('guest-tracking').classList.remove('hidden')
    return
  }

  document.getElementById('display-name').innerText = userName

  try {
    const response = await fetch(
      `${window.CONFIG.API_BASE_URL}/api/my-bookings?email=${userEmail}`,
    )
    const orders = await response.json()
    renderOrders(orders, userName)
  } catch (err) {
    console.error('Dashboard error', err)
  }
})

function renderOrders(orders, currentUserName) {
  const container = document.getElementById('orders-container')
  if (orders.length === 0) return

  container.innerHTML = ''
  let activeCount = 0
  let warrantyCount = 0

  orders.forEach((order) => {
    if (order.status !== 'Completed') activeCount++

    const warranty = calculateWarranty(order.createdAt, order.status)
    if (warranty.isValid) warrantyCount++

    const card = document.createElement('div')
    card.className =
      'glass-panel p-6 md:p-8 rounded-3xl border border-white/5 hover:border-neonBlue/30 transition-all group relative overflow-hidden'

    const repairDate = new Date(order.createdAt).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    // Atomic direct parameter layout rendering engine configuration logic
    let reviewButtonHTML = '';
    if (order.status === 'Completed') {
      // Direct synchronization mapping: button completely disappears if true
      if (!order.isReviewed) {
        reviewButtonHTML = `
          <button onclick="window.openReviewGate('${order._id}', '${order.device}', '${order.service}')" class="mt-3 w-full text-center px-4 py-1.5 rounded-xl border border-neonGold/30 text-neonGold hover:bg-neonGold hover:text-black font-mono text-[10px] transition uppercase font-black tracking-wider shadow-[0_0_10px_rgba(250,219,95,0.05)]">
              Write Review
          </button>
        `;
      }
    }

    card.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                <div class="flex gap-6">
                    <div class="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center text-3xl border border-white/10" aria-hidden="true">
                        ${getDeviceIcon(order.device)}
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-white">${order.device}</h3>
                        <p class="text-sm text-neonBlue font-mono uppercase">${order.service}</p>
                        <p class="text-[10px] text-gray-200 mt-2 font-mono uppercase tracking-widest">Recorded: ${repairDate}</p>
                    </div>
                </div>

                <div class="flex flex-wrap md:flex-nowrap items-center gap-8">
                    <div class="text-right" aria-label="Current Repair Status">
                        <p class="text-[10px] text-gray-200 uppercase mb-1 tracking-widest">Current Status</p>
                        <span class="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${getStatusStyle(order.status)}">
                            ${order.status.toUpperCase()}
                        </span>
                    </div>

                    <div class="text-right min-w-[140px]">
                        <p class="text-[10px] text-gray-200 uppercase mb-1 tracking-widest">Warranty Guard</p>
                        <p class="text-sm ${warranty.isValid ? 'text-green-400' : 'text-gray-200'} font-black">
                            ${warranty.text}
                        </p>
                        <p class="text-[9px] text-gray-200 font-mono mt-1">${warranty.expiry || ''}</p>
                    </div>

                    <div class="text-right flex flex-col justify-center min-w-[110px]">
                        <p class="text-[10px] text-gray-200 uppercase mb-1 tracking-widest">Total Cost</p>
                        <p class="text-2xl font-black text-white italic">$${order.price}</p>
                        ${reviewButtonHTML}
                    </div>
                </div>
            </div>
            
            <div class="absolute bottom-0 left-0 h-1 bg-neonBlue/10 w-full">
                <div class="h-full bg-neonBlue shadow-[0_0_15px_#00f3ff]" style="width: ${getStatusProgress(order.status)}%"></div>
            </div>
        `
    container.appendChild(card)
  })

  document.getElementById('stat-active').innerText = activeCount
  document.getElementById('stat-warranty').innerText = warrantyCount
}

window.openReviewGate = function(id, device, service) {
  const reviewModal = document.getElementById('dashboard-review-modal');
  if (!reviewModal) return;
  
  document.getElementById('modal-rev-booking-id').value = id;
  document.getElementById('modal-rev-device').value = device;
  document.getElementById('modal-rev-service').value = service;
  
  document.getElementById('modal-display-target').innerText = `${device} // ${service}`;
  
  reviewModal.classList.remove('hidden');
  setTimeout(() => reviewModal.classList.remove('opacity-0'), 10);
  reviewModal.firstElementChild.classList.remove('scale-95');
  
  const starButtons = document.querySelectorAll('.dash-star-select');
  starButtons.forEach(btn => {
    btn.className = "dash-star-select text-neonGold transition";
  });
  
  const reviewForm = document.getElementById('dashboard-review-form');
  if (reviewForm) reviewForm.reset();
};

const closeReviewModalBtn = document.getElementById('btn-close-review-modal');
if (closeReviewModalBtn) {
  closeReviewModalBtn.addEventListener('click', () => {
    const reviewModal = document.getElementById('dashboard-review-modal');
    if (!reviewModal) return;
    reviewModal.classList.add('opacity-0');
    reviewModal.firstElementChild.classList.add('scale-95');
    setTimeout(() => reviewModal.classList.add('hidden'), 300);
  });
}

const starButtons = document.querySelectorAll('.dash-star-select');
let selectedRating = 5;
starButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedRating = parseInt(btn.getAttribute('data-val'));
    starButtons.forEach(s => {
      const val = parseInt(s.getAttribute('data-val'));
      s.className = val <= selectedRating ? "dash-star-select text-neonGold transition" : "dash-star-select text-gray-600 hover:text-neonGold transition";
    });
  });
});

const reviewForm = document.getElementById('dashboard-review-form');
if (reviewForm) {
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-dashboard-submit-review');
    const originalText = submitBtn.innerText;
    
    const bookingId = document.getElementById('modal-rev-booking-id').value;
    const device = document.getElementById('modal-rev-device').value;
    const service = document.getElementById('modal-rev-service').value;
    const content = document.getElementById('modal-rev-content').value.trim();

    submitBtn.innerText = 'BROADCASTING_LOG...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId,
          customerName: localStorage.getItem('userName') || 'Verified Pro Member',
          device: device,
          service: service,
          rating: selectedRating,
          content: content
        })
      });

     if (response.ok) {
        alert('Review logs compiled and committed successfully.');
        
        // 1. Smoothly slide down and close the active overlay frame
        const reviewModal = document.getElementById('dashboard-review-modal');
        if (reviewModal) {
          reviewModal.classList.add('opacity-0');
          reviewModal.firstElementChild.classList.add('scale-95');
        }
        
        // 2. Direct pipeline redirection straight into the global testimonials hub page
        setTimeout(() => {
          window.location.href = 'reviews.html';
        }, 300);
      } else {
        const errData = await response.json();
        alert(`CRITICAL REJECTION: ${errData.message}`);
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      }
    } catch (error) {
      console.error(error);
      alert('CONNECTION FAILURE: MAIN FRAME SYSTEM UNREACHABLE.');
      submitBtn.innerText = originalText;
      submitBtn.disabled = false;
    }
  });
}

function calculateWarranty(dateStr, status) {
  if (status !== 'Completed')
    return { isValid: false, text: 'PENDING', expiry: 'Starts after repair' }

  const repairDate = new Date(dateStr)
  const expiryDate = new Date(repairDate)
  expiryDate.setMonth(repairDate.getMonth() + 3)

  const today = new Date()
  const diffTime = expiryDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 0) {
    return {
      isValid: true,
      text: `ACTIVE (${diffDays} Days)`,
      expiry: `Until ${expiryDate.toLocaleDateString()}`,
    }
  } else {
    return {
      isValid: false,
      text: 'EXPIRED',
      expiry: `Ended on ${expiryDate.toLocaleDateString()}`,
    }
  }
}

function getStatusProgress(status) {
  const steps = {
    Pending: 20,
    Confirmed: 40,
    Repairing: 60,
    Testing: 80,
    Completed: 100,
  }
  return steps[status] || 0
}

function getStatusStyle(status) {
  const styles = {
    Pending: 'bg-gray-800 text-gray-400',
    Confirmed: 'bg-blue-900/30 text-blue-400 border border-blue-500/30',
    Repairing: 'bg-neonGold/20 text-neonGold border border-neonGold/30',
    Completed: 'bg-green-900/30 text-green-400 border border-green-500/30',
  }
  return styles[status] || styles['Pending']
}

function getDeviceIcon(device) {
  if (device.includes('iPhone') || device.includes('Apple')) return '🍎'
  if (device.includes('Samsung')) return '📱'
  return '🔧'
}

function logout() {
  localStorage.clear()
  window.location.href = 'index.html'
}