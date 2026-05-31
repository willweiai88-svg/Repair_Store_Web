// js/index.js

document.addEventListener('DOMContentLoaded', () => {
  // Reveal Animation
  const revealElements = document.querySelectorAll('.reveal')
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active')
          observer.unobserve(entry.target)
        }
      })
    },
    { root: null, rootMargin: '0px', threshold: 0.15 },
  )

  revealElements.forEach((el) => revealObserver.observe(el))
  // User Menu State
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const userName = localStorage.getItem('userName')

  const userMenu = document.getElementById('user-menu')
  const mobileUserMenu = document.getElementById('mobile-user-menu')

  if (isLoggedIn && userName) {
    const firstName = userName.split(' ')[0]
    const loggedInHTML = `
            <div class="group relative">
                <button class="bg-neonBlue text-black px-5 py-2 rounded-full font-bold flex items-center gap-2 shadow-[0_0_15px_#00f3ff]">
                    Hi, ${firstName} ▾
                </button>
                <div class="absolute right-0 mt-2 w-52 glass-panel rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-2 shadow-xl border border-white/10 bg-[#0b0f19]">
                    <a href="dashboard.html" class="block px-4 py-2 hover:bg-white/10 rounded-lg transition text-sm text-white">Order History</a>
                    <a href="services.html" class="block px-4 py-2 hover:bg-white/10 rounded-lg transition text-sm text-white">New Repair</a>
                    <a href="profile.html" class="block px-4 py-2 hover:bg-white/10 rounded-lg transition text-sm text-neonBlue font-mono">Update Info</a>
                    <hr class="my-2 border-white/10">
                    <button onclick="window.logout()" class="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition text-sm">Logout</button>
                </div>
            </div>
        `

    const loggedInMobileHTML = `
            <div class="bg-white/5 p-4 rounded-xl border border-white/10 mt-2">
                <p class="text-neonBlue font-bold mb-3">Hi, ${firstName}</p>
                <a href="dashboard.html" class="block py-2 text-white hover:text-neonBlue transition">Order History</a>
                <a href="services.html" class="block py-2 text-white hover:text-neonBlue transition">New Repair</a>
                <a href="profile.html" class="block py-2 text-neonBlue font-mono hover:text-white transition">Update Info</a>
                <button onclick="window.logout()" class="block w-full text-left py-2 text-red-400 mt-2 border-t border-white/10">Logout</button>
            </div>
        `

    if (userMenu) userMenu.innerHTML = loggedInHTML
    if (mobileUserMenu) mobileUserMenu.innerHTML = loggedInMobileHTML
  }

  // Enquiry Form Submission
  const submitEnquiryBtn = document.getElementById('btn-submit-enquiry')

  if (submitEnquiryBtn) {
    submitEnquiryBtn.addEventListener('click', async () => {
      const firstName = document.getElementById('enq-firstName').value.trim()
      const lastName = document.getElementById('enq-lastName').value.trim()
      const email = document.getElementById('enq-email').value.trim()
      const phone = document.getElementById('enq-phone').value.trim()
      const service = document.getElementById('enq-service').value
      const model = document.getElementById('enq-model').value.trim()
      const desc = document.getElementById('enq-desc').value.trim()

      // 1. Boundary Integrity Check
      if (
        !firstName ||
        !lastName ||
        !email ||
        !phone ||
        !service ||
        !model ||
        !desc
      ) {
        alert(
          'VALIDATION ERROR: All asterisk (*) parameters must be populated.',
        )
        return
      }

      // 2. Cryptographic Name Alignment Check
      const nameRegex = /^[a-zA-Z\s]{2,30}$/
      if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
        alert(
          'VALIDATION ERROR: First name and Last name must contain only letters (2-30 chars).',
        )
        return
      }

      // 3. Email Structure Compliance Check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        alert(
          'VALIDATION ERROR: Invalid email address payload architecture detected.',
        )
        return
      }

      // 4. Australian Phone Architecture Compliance Check
      const phoneRegex = /^(?:\+?61|0)4\d{8}$/
      if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
        alert(
          'VALIDATION ERROR: Phone number must align with a valid Australian mobile standard (e.g. 04XXXXXXXX).',
        )
        return
      }

      // 5. Payload Description Length Bounds Check
      if (desc.length < 10) {
        alert(
          'VALIDATION ERROR: Description telemetry payload too short. Please provide at least 10 characters.',
        )
        return
      }

      // Protocol cleared - proceed with background compilation pipeline transmission
      submitEnquiryBtn.innerText = 'TRANSMITTING...'
      submitEnquiryBtn.disabled = true

      try {
        const response = await fetch(
          `${window.CONFIG.API_BASE_URL}/api/enquiries`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName,
              lastName,
              email,
              phone,
              service,
              model,
              description: desc,
            }),
          },
        )

        if (response.ok) {
          alert(
            'Enquiry payload synchronized and logged inside the mainframe database cluster.',
          )
          window.location.reload()
        } else {
          const errData = await response.json()
          alert(`TRANSMISSION REJECTED: ${errData.message}`)
          submitEnquiryBtn.innerText = 'SUBMIT'
          submitEnquiryBtn.disabled = false
        }
      } catch (error) {
        console.error(error)
        alert(
          'CRITICAL: Internal pipeline connectivity error during packet broadcasting.',
        )
        submitEnquiryBtn.innerText = 'SUBMIT'
        submitEnquiryBtn.disabled = false
      }
    })
  }
  // Fetch and Stream Top 10 Verified Reviews inside Carousel Slider
  const reviewSlider = document.getElementById('live-review-slider')

  async function streamLiveReviews() {
    if (!reviewSlider) return

    try {
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/reviews`)
      const reviews = await response.json()

      if (reviews.length === 0) {
        reviewSlider.innerHTML = `
                    <div class="text-center text-gray-600 font-mono text-xs py-10 w-full">
                        [ REVIEWS_STREAM_NULL: System awaits first broadcast payload ]
                    </div>
                `
        return
      }

      // Cap the telemetry packet stream at exactly 10 items
      const topTenReviews = reviews.slice(0, 10)

      let sliderHTML = topTenReviews
        .map((rev) => {
          const starBlock = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating)
          return `
                    <div class="snap-start shrink-0 w-[320px] md:w-[360px] bg-black/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex flex-col justify-between gap-6 hover:border-neonGold/20 transition-all duration-300">
                        <div>
                            <div class="flex justify-between items-center mb-4">
                                <span class="text-neonGold text-xs font-mono tracking-tighter">${starBlock}</span>
                                <span class="text-[9px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded uppercase">Verified</span>
                            </div>
                            <p class="text-sm text-gray-300 leading-relaxed italic">"${rev.content}"</p>
                        </div>
                        
                        <div class="flex justify-between items-end pt-4 border-t border-white/5">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-white uppercase">
                                    ${rev.customerName ? rev.customerName.charAt(0) : 'U'}
                                </div>
                                <div>
                                    <h4 class="text-white font-bold text-sm tracking-tight">${rev.customerName}</h4>
                                    <p class="text-[9px] font-mono text-gray-500 uppercase mt-0.5">${rev.device}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `
        })
        .join('')

      // Append the 11th "MORE_NODE" End-Gate Card to direct to reviews.html
      sliderHTML += `
                <div class="snap-start shrink-0 w-[240px] bg-black/20 border border-dashed border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center group/card hover:border-neonBlue transition duration-300">
                    <div class="w-12 h-12 bg-neonBlue/10 border border-neonBlue/20 rounded-full flex items-center justify-center text-neonBlue text-xl mb-4 group-hover/card:scale-110 transition duration-300" aria-hidden="true">
                        📂
                    </div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wider font-mono">Load More Logs</h4>
                    <p class="text-xs text-gray-500 mt-1 mb-6">Access all records on the feedback mainframe terminal.</p>
                    <a href="reviews.html" class="text-xs font-mono bg-transparent border border-neonBlue text-neonBlue px-4 py-2 rounded-xl hover:bg-neonBlue hover:text-black transition uppercase font-bold tracking-widest">
                        Execute_Load_
                    </a>
                </div>
            `

      reviewSlider.innerHTML = sliderHTML
    } catch (error) {
      console.error(error)
      reviewSlider.innerHTML = `
                <div class="text-center text-red-400 font-mono text-xs py-10 w-full">
                    ❌ LOG_STREAM_DISCONNECT: Internal stream connection failed.
                </div>
            `
    }
  }

  streamLiveReviews()
})
