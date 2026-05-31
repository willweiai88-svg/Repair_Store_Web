// js/booking.js

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const serviceId = urlParams.get('service_id')

  if (!serviceId) {
    alert(
      'CRITICAL ACCESS FAILURE: Missing core service identifier node parameter.',
    )
    window.location.href = 'services.html'
    return
  }

  const isMemberLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const cachedEmail = localStorage.getItem('userEmail') || ''
  const cachedName = localStorage.getItem('userName') || ''

  let selectedServicePrice = 0
  let selectedDeviceString = ''
  let selectedServiceString = ''

  // Standard DOM elements mapping locator references
  const bookingForm = document.getElementById('booking-submission-form')
  const inputFirstName = document.getElementById('book-firstname')
  const inputLastName = document.getElementById('book-lastname')
  const inputEmail = document.getElementById('book-email')
  const inputPhone = document.getElementById('book-phone')
  const selectLocation = document.getElementById('book-location')
  const inputDate = document.getElementById('book-date')
  const inputNotes = document.getElementById('book-notes')

  // Mapped out explicitly against real nodes inside booking.html
  const loadingStateNode = document.getElementById('loading-state')
  const orderDetailsNode = document.getElementById('order-details')
  const summaryDeviceNode = document.getElementById('summary-device')
  const summaryServiceNode = document.getElementById('summary-service')
  const summaryStandardNode = document.getElementById('summary-standard')
  const summaryFinalNode = document.getElementById('summary-final')
  const memberDiscountNoteNode = document.getElementById('member-discount-note')
  const authStatusBadgeNode = document.getElementById('auth-status-badge')
  const guestAuthPromptNode = document.getElementById('guest-auth-prompt')

  // Pre-populate elements matrix if user session data cache is present
  if (isMemberLoggedIn) {
    if (authStatusBadgeNode)
      authStatusBadgeNode.innerText = 'Verified Pro Member'
    if (guestAuthPromptNode) guestAuthPromptNode.classList.add('hidden')
    const todayObject = new Date()
    const formattedTodayISO = `${todayObject.getFullYear()}-${String(todayObject.getMonth() + 1).padStart(2, '0')}-${String(todayObject.getDate()).padStart(2, '0')}`
    if (inputDate) {
      inputDate.min = formattedTodayISO
    }
    if (inputEmail) {
      inputEmail.value = cachedEmail
      inputEmail.disabled = true
    }
    if (cachedName && cachedName.includes(' ')) {
      const parts = cachedName.split(' ')
      if (inputFirstName) inputFirstName.value = parts[0]
      if (inputLastName) inputLastName.value = parts.slice(1).join(' ')
    } else if (inputFirstName) {
      inputFirstName.value = cachedName
    }
  } else {
    if (guestAuthPromptNode) guestAuthPromptNode.classList.remove('hidden')
  }

  // Pull catalog configuration metadata matrix to fetch prices dynamically
  try {
    const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/services`)
    const services = await response.json()
    const matchedItem = services.find((s) => s._id === serviceId)

    if (!matchedItem) {
      alert(
        'DATA ERROR: Target repair data node configuration is invalid inside the cluster.',
      )
      window.location.href = 'services.html'
      return
    }

    selectedServicePrice = isMemberLoggedIn
      ? matchedItem.memberPrice
      : matchedItem.price
    selectedDeviceString = `${matchedItem.brand} ${matchedItem.model}`
    selectedServiceString = matchedItem.service

    // Populate pristine html template fields with aligned parameter tokens
    if (summaryDeviceNode) summaryDeviceNode.innerText = selectedDeviceString
    if (summaryServiceNode) summaryServiceNode.innerText = selectedServiceString
    if (summaryStandardNode)
      summaryStandardNode.innerText = `$${matchedItem.price}`
    if (summaryFinalNode)
      summaryFinalNode.innerText = `$${selectedServicePrice}`

    if (isMemberLoggedIn && memberDiscountNoteNode) {
      memberDiscountNoteNode.classList.remove('hidden')
    }

    // De-active loading loop animation framework shell and unhide core metrics
    if (loadingStateNode) loadingStateNode.classList.add('hidden')
    if (orderDetailsNode) orderDetailsNode.classList.remove('hidden')
  } catch (err) {
    console.error(err)
    if (loadingStateNode)
      loadingStateNode.innerText =
        '❌ Failed to decrypt service context telemetry logs.'
  }

  // Pure Client-Side Sandbox Form In-Place Validation Interception Engine
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      const firstNameVal = inputFirstName.value.trim()
      const lastNameVal = inputLastName.value.trim()
      const emailVal = inputEmail.value.trim()
      const phoneVal = inputPhone.value.trim()
      const locationVal = selectLocation.value
      const dateValue = inputDate.value
      const notesVal = inputNotes ? inputNotes.value.trim() : ''

      // 1. Boundary Integrity Lock Check
      if (
        !firstNameVal ||
        !lastNameVal ||
        !emailVal ||
        !phoneVal ||
        !locationVal ||
        !dateValue
      ) {
        alert(
          'VALIDATION MATRIX FAILED: Please fill out all required fields marked with an asterisk (*).',
        )
        return
      }

      // 2. Names Regex Alphabetical Pattern Verification
      const alphabeticalPattern = /^[a-zA-Z\s]{2,30}$/
      if (
        !alphabeticalPattern.test(firstNameVal) ||
        !alphabeticalPattern.test(lastNameVal)
      ) {
        alert(
          'VALIDATION MATRIX FAILED: First name and Last name can only contain alphabetical letters (2-30 chars).',
        )
        return
      }

      // 3. Email Structural Identity Topology Check
      const cyberEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!cyberEmailPattern.test(emailVal)) {
        alert(
          'VALIDATION MATRIX FAILED: Email address structure is malformed. Use standard syntax.',
        )
        return
      }

      // 4. Australian Hardware Line Telephone Architecture Verification Rules
      const standardAussieMobilePattern = /^(?:\+?61|0)4\d{8}$/
      const normalizedPhone = phoneVal.replace(/\s+/g, '')

      if (!standardAussieMobilePattern.test(normalizedPhone)) {
        alert(
          'VALIDATION MATRIX FAILED: Invalid mobile sequence. A valid Australian mobile link address is required (e.g., 04XX XXX XXX).',
        )
        return
      }

      // 5. Epoch Calendar Chronology Filter Check
      const selectedEpoch = new Date(dateValue)
      const minimumAllowedTimeline = new Date()
      minimumAllowedTimeline.setHours(0, 0, 0, 0)

      if (selectedEpoch < minimumAllowedTimeline) {
        alert(
          'VALIDATION MATRIX FAILED: Selected reservation timestamp cannot be mapped into historical dates.',
        )
        return
      }

      // All systems green - execute submission block payload transfer
      const submitBtn = bookingForm.querySelector('button[type="submit"]')
      const originalBtnText = submitBtn.innerText
      submitBtn.innerText = 'BROADCASTING_REPAIR_BLOCK_...'
      submitBtn.disabled = true

      const bookingPayload = {
        customerName: `${firstNameVal} ${lastNameVal}`,
        customerEmail: emailVal,
        phone: normalizedPhone,
        device: selectedDeviceString,
        service: selectedServiceString,
        location: locationVal,
        date: dateValue,
        price: selectedServicePrice,
        notes: notesVal,
      }

      try {
        const response = await fetch(
          `${window.CONFIG.API_BASE_URL}/api/bookings`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload),
          },
        )

        if (response.ok) {
          alert(
            'PROMPT: Repair protocol pipeline established. System booking locked successfully.',
          )
          window.location.href = isMemberLoggedIn
            ? 'dashboard.html'
            : 'index.html'
        } else {
          const errorResponseBlock = await response.json()
          alert(
            `TRANSMISSION REJECTED BY SERVER: ${errorResponseBlock.message}`,
          )
          submitBtn.innerText = originalBtnText
          submitBtn.disabled = false
        }
      } catch (err) {
        console.error(err)
        alert(
          'CRITICAL SYSTEM ERROR: Mainframe database cluster connectivity unreachable.',
        )
        submitBtn.innerText = originalBtnText
        submitBtn.disabled = false
      }
    })
  }
})
