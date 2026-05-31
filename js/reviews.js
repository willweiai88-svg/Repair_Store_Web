// js/reviews.js

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('reviews-masonry-container');
  const modal = document.getElementById('verification-modal');
  const openModalBtn = document.getElementById('btn-open-gate');
  const closeModalBtn = document.getElementById('btn-close-modal');
  
  const gateStep = document.getElementById('modal-step-gate');
  const composeStep = document.getElementById('modal-step-compose');
  
  const gateForm = document.getElementById('gate-verification-form');
  const reviewForm = document.getElementById('review-submission-form');
  
  let verifiedBookingData = null;
  let selectedRating = 5;

  initReviewDashboard();

  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      setTimeout(() => modal.classList.remove('opacity-0'), 10);
      modal.firstElementChild.classList.remove('scale-95');
      
      verifiedBookingData = null;
      gateStep.classList.remove('hidden');
      composeStep.classList.add('hidden');
      gateForm.reset();
      reviewForm.reset();
      resetStarSelector();
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', hideModal);
  }

  function hideModal() {
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.firstElementChild.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
  }

  // Handle Dynamic Star Rating Matrix Selector
  const starButtons = document.querySelectorAll('.star-select');
  starButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.getAttribute('data-val'));
      updateStarSelector(selectedRating);
    });
  });

  function updateStarSelector(rating) {
    starButtons.forEach(btn => {
      const val = parseInt(btn.getAttribute('data-val'));
      if (val <= rating) {
        btn.className = "star-select text-neonGold transition";
      } else {
        btn.className = "star-select text-gray-600 hover:text-neonGold transition";
      }
    });
  }

  function resetStarSelector() {
    selectedRating = 5;
    updateStarSelector(5);
  }

  // Step 1: Gate Verification Handler
  if (gateForm) {
    gateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const verifyBtn = document.getElementById('btn-verify-gate');
      const bookingId = document.getElementById('gate-booking-id').value.trim();
      const originalText = verifyBtn.innerText;

      verifyBtn.innerText = 'QUERYING_CHAIN...';
      verifyBtn.disabled = true;

      try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/reviews/verify-gate/${bookingId}`);
        const data = await response.json();

        if (response.ok) {
          verifiedBookingData = data.booking;
          document.getElementById('rev-author').value = data.booking.customerName;
          
          gateStep.classList.add('hidden');
          composeStep.classList.remove('hidden');
        } else {
          alert(`VERIFICATION_REFUSED: ${data.message}`);
        }
      } catch (error) {
        console.error(error);
        alert('CRITICAL ERROR: Failed to cross-reference protocol clearance.');
      } finally {
        verifyBtn.innerText = originalText;
        verifyBtn.disabled = false;
      }
    });
  }

  // Step 2: Form Review Broadcasting Submission Handler
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-submit-review');
      const originalText = submitBtn.innerText;
      const content = document.getElementById('rev-content').value.trim();

      if (!verifiedBookingData) return;

      submitBtn.innerText = 'BROADCASTING_BLOCK...';
      submitBtn.disabled = true;

      try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: verifiedBookingData._id,
            customerName: verifiedBookingData.customerName,
            device: verifiedBookingData.device,
            service: verifiedBookingData.service,
            rating: selectedRating,
            content: content
          })
        });

        if (response.ok) {
          alert('Transmission successful! Feedback broadcasted to the validation pool.');
          hideModal();
          initReviewDashboard();
        } else {
          const errData = await response.json();
          alert(`BROADCAST_DENIED: ${errData.message}`);
        }
      } catch (error) {
        console.error(error);
      } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  async function initReviewDashboard() {
    if (!container) return;
    try {
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/reviews`);
      const reviews = await response.json();

      if (reviews.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-500 font-mono text-xs py-20 col-span-full">[ LOG_STREAM_EMPTY: No verified reviews broadcasted yet ]</div>`;
        return;
      }

      container.innerHTML = reviews.map(rev => {
        const starsHtml = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
        const date = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-AU') : 'All Time';

        return `
          <div class="break-inside-avoid bg-black/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex flex-col gap-4 shadow-xl hover:border-neonBlue/20 transition duration-300">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-white text-base tracking-tight">${rev.customerName}</h3>
                <p class="text-[10px] text-gray-500 font-mono tracking-wider uppercase mt-0.5">${date}</p>
              </div>
              <span class="text-neonGold text-sm font-mono tracking-tighter">${starsHtml}</span>
            </div>
            
            <p class="text-sm text-gray-300 leading-relaxed">${rev.content}</p>
            
            <div class="mt-2 pt-3 border-t border-white/5 flex flex-wrap gap-2 items-center">
              <span class="px-2 py-0.5 bg-neonBlue/10 text-neonBlue font-mono text-[9px] uppercase rounded border border-neonBlue/20">${rev.device}</span>
              <span class="px-2 py-0.5 bg-white/5 text-gray-400 font-mono text-[9px] uppercase rounded border border-white/5">${rev.service}</span>
            </div>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error(error);
      container.innerHTML = `<div class="text-center text-red-400 font-mono text-xs py-20 col-span-full">❌ PIPELINE_OFFLINE: Failed to synchronize live testimonials stream.</div>`;
    }
  }
});