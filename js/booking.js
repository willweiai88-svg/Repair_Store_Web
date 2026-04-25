// js/booking.js

document.addEventListener('DOMContentLoaded', async () => {
  // get the service_id
  const urlParams = new URLSearchParams(window.location.search)
  const serviceId = urlParams.get('service_id')

  // check the status of the user
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const userEmail = localStorage.getItem('userEmail')
  const userName = localStorage.getItem('userName')

  const badge = document.getElementById('auth-status-badge')
  const guestAuthPrompt = document.getElementById('guest-auth-prompt')
  // auto fill the table info
  if (isLoggedIn) {
    badge.innerHTML = `<span class="text-neonGold">★ Pro Member:</span> ${userName}`
    badge.className =
      'text-sm font-bold text-white border border-neonGold/50 bg-neonGold/10 px-4 py-1.5 rounded-full'

    // split the name
    if (userName) {
      const nameParts = userName.split(' ')
      document.getElementById('b-firstname').value = nameParts[0] || ''
      document.getElementById('b-lastname').value =
        nameParts.slice(1).join(' ') || ''
    }
    if (userEmail) {
      document.getElementById('b-email').value = userEmail
    }

    document.getElementById('member-discount-note').classList.remove('hidden')
  } else {
    // if the user didnt login in, we give their the option to login
    if (guestAuthPrompt) {
      guestAuthPrompt.classList.remove('hidden')

      //  service_id
      const loginBtn = guestAuthPrompt.querySelector('a')
      if (loginBtn && serviceId) {
        const returnUrl = encodeURIComponent(`booking.html?service_id=${serviceId}`)
        loginBtn.href = `login.html?redirect=${returnUrl}`
      }
    }
  }
  // limit the time cannot select the previous date
  const dateInput = document.getElementById('b-date')
  if (dateInput) {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')

    dateInput.min = `${yyyy}-${mm}-${dd}` 
  }

  // 4. 从后端获取服务详情以填充左侧面板
  if (!serviceId) {
    document.getElementById('loading-state').innerHTML =
      '<span class="text-red-500">Error: No service selected. Please return to Pricing.</span>'
    document.getElementById('btn-submit').disabled = true
    return
  }

  try {
    // get the cost of the service
    const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/services`)
    const services = await response.json()
    const item = services.find((s) => s._id === serviceId)

    if (item) {
      // hide the previous state and show the info to user
      document.getElementById('loading-state').classList.add('hidden')
      document.getElementById('order-details').classList.remove('hidden')

      const deviceFullName = `${item.brand} ${item.model}`
      document.getElementById('summary-device').innerText = deviceFullName
      document.getElementById('summary-service').innerText = item.service
      document.getElementById('summary-standard').innerText = `$${item.price}`

      // if the customer has already logged in
      // we will use our discount
      const finalPrice = isLoggedIn ? item.memberPrice : item.price
      document.getElementById('summary-final').innerText = `$${finalPrice}`

      // save all the content into 
      document.getElementById('hidden-service-id').value = item._id
      document.getElementById('hidden-final-price').value = finalPrice
      document.getElementById('hidden-device-name').value = deviceFullName
      document.getElementById('hidden-service-name').value = item.service
    } else {
      document.getElementById('loading-state').innerText =
        'Item not found in database.'
    }
  } catch (err) {
    console.error('Fetch error', err)
    document.getElementById('loading-state').innerText =
      'Database connection failed. Is Node.js running?'
  }

  // 5. submit the booking info
  document
    .getElementById('booking-form')
    .addEventListener('submit', async (e) => {
      e.preventDefault()

      const submitBtn = document.getElementById('btn-submit')
      const originalText = submitBtn.innerText
      submitBtn.innerText = 'Encrypting & Sending...'
      submitBtn.disabled = true

      // pack all the data
      const bookingData = {
        isMember: isLoggedIn,
        customerEmail: document.getElementById('b-email').value,
        customerName: `${document.getElementById('b-firstname').value} ${document.getElementById('b-lastname').value}`,
        phone: document.getElementById('b-phone').value,
        device: document.getElementById('hidden-device-name').value,
        service: document.getElementById('hidden-service-name').value,
        price: document.getElementById('hidden-final-price').value,
        location: document.getElementById('b-location').value,
        date: document.getElementById('b-date').value,
        notes: document.getElementById('b-notes').value,
        status: 'Pending',
      }

      try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        })

        const data = await response.json()

        if (response.ok) {

          alert(
            `Booking Confirmed! \nYour Order ID is: ${data.bookingId}\nWe will see you at ${bookingData.location}.`,
          )

    
          window.location.href = 'index.html'
        } else {
          alert(`Failed to book: ${data.message}`)
          submitBtn.innerText = originalText
          submitBtn.disabled = false
        }
      } catch (error) {
        console.error('Booking submission error:', error)
        alert('Failed to connect to the server. Is Node.js running?')
        submitBtn.innerText = 'Try Again'
        submitBtn.disabled = false
      }
    })
})
