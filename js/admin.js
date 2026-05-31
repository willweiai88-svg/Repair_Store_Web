// js/admin.js

document.addEventListener('DOMContentLoaded', () => {
  const isAdminLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true'

  if (!isAdminLoggedIn) {
    window.location.href = 'admin-login.html'
    return
  }

  const mainContent = document.getElementById('admin-main-content')
  if (mainContent) {
    mainContent.classList.remove('hidden')
  }

  const adminLogoutBtn = document.getElementById('btn-admin-logout')
  const startDateInput = document.getElementById('admin-start-date')
  const endDateInput = document.getElementById('admin-end-date')
  const allTimeBtn = document.getElementById('btn-all-time')

  let allBookings = []
  let allEnquiries = []
  let currentView = 'bookings'
  let currentStore = 'All'

  const todayStr = new Date().toLocaleDateString('en-CA')
  if (startDateInput && endDateInput) {
    startDateInput.value = todayStr
    endDateInput.value = todayStr
  }

  initAdminPanel()

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
      if (confirm('Disconnect from administrative mainframe terminal?')) {
        // Clear all restricted credentials from session cache storage
        sessionStorage.removeItem('isAdminLoggedIn')
        sessionStorage.removeItem('adminToken')

        // Redirect seamlessly back to the public frontline homepage
        window.location.href = 'index.html'
      }
    })
  }

  function toggleDateHighlight() {
    const startValue = startDateInput ? startDateInput.value : ''
    const endValue = endDateInput ? endDateInput.value : ''

    if (!startValue && !endValue) {
      if (allTimeBtn) {
        allTimeBtn.className =
          'text-[10px] font-mono border px-2.5 py-1.5 rounded-xl transition-all duration-300 uppercase ml-2 border-neonBlue text-neonBlue bg-neonBlue/10 shadow-[0_0_10px_rgba(0,243,255,0.2)]'
      }
      if (startDateInput)
        startDateInput.className =
          'bg-[#080b12] border border-white/10 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-neonBlue text-white font-mono transition-all duration-300'
      if (endDateInput)
        endDateInput.className =
          'bg-[#080b12] border border-white/10 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-neonBlue text-white font-mono transition-all duration-300'
    } else {
      if (allTimeBtn) {
        allTimeBtn.className =
          'text-[10px] font-mono border px-2.5 py-1.5 rounded-xl transition-all duration-300 uppercase ml-2 border-gray-700 text-gray-400'
      }
      if (startDateInput)
        startDateInput.className =
          'bg-[#080b12] border border-neonBlue text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-neonBlue text-white font-mono transition-all duration-300 shadow-[0_0_10px_rgba(0,243,255,0.1)]'
      if (endDateInput)
        endDateInput.className =
          'bg-[#080b12] border border-neonBlue text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-neonBlue text-white font-mono transition-all duration-300 shadow-[0_0_10px_rgba(0,243,255,0.1)]'
    }
  }

  function onDateChange() {
    toggleDateHighlight()
    if (currentView === 'bookings') {
      renderBookingsTable()
    }
  }

  if (startDateInput) startDateInput.addEventListener('change', onDateChange)
  if (endDateInput) endDateInput.addEventListener('change', onDateChange)

  function initAdminPanel() {
    fetchBookingsData()
    fetchEnquiriesData()
  }

  async function fetchBookingsData() {
    try {
      const response = await fetch(
        `${window.CONFIG.API_BASE_URL}/api/admin/bookings`,
      )
      allBookings = await response.json()
      toggleDateHighlight()
      if (currentView === 'bookings') {
        renderBookingsTable()
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function fetchEnquiriesData() {
    try {
      const response = await fetch(
        `${window.CONFIG.API_BASE_URL}/api/admin/enquiries`,
      )
      allEnquiries = await response.json()
      if (currentView === 'enquiries') {
        renderEnquiriesTable()
      }
    } catch (error) {
      console.error(error)
    }
  }

  function renderBookingsTable() {
    const tableHead = document.getElementById('admin-table-head')
    const tableBody = document.getElementById('admin-table-body')

    const startValue = startDateInput ? startDateInput.value : ''
    const endValue = endDateInput ? endDateInput.value : ''

    if (!tableHead || !tableBody) return

    tableHead.innerHTML = `
      <tr>
        <th class="px-6 py-5">Protocol ID</th>
        <th class="px-6 py-5">Customer</th>
        <th class="px-6 py-5">Device & Service</th>
        <th class="px-6 py-5">Location</th>
        <th class="px-6 py-5">Status Update</th>
        <th class="px-6 py-5 text-right">Price</th>
      </tr>
    `

    let filtered =
      currentStore === 'All'
        ? allBookings
        : allBookings.filter((b) => b.location === currentStore)

    if (startValue && endValue) {
      filtered = filtered.filter(
        (b) => b.date >= startValue && b.date <= endValue,
      )
    } else if (startValue) {
      filtered = filtered.filter((b) => b.date >= startValue)
    } else if (endValue) {
      filtered = filtered.filter((b) => b.date <= endValue)
    }

    let activeCount = 0
    let revenueSum = 0

    tableBody.innerHTML = filtered
      .map((booking) => {
        if (booking.status !== 'Completed') activeCount++
        if (booking.status === 'Completed')
          revenueSum += parseFloat(booking.price || 0)

        const bookingId = booking._id || booking.bookingId || 'N/A'
        const shortId =
          bookingId.length > 8
            ? bookingId.substring(bookingId.length - 8).toUpperCase()
            : bookingId

        let displayDate = 'N/A'
        if (booking.date) {
          const dateParts = booking.date.split('-')
          if (dateParts.length === 3) {
            displayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
          } else {
            displayDate = booking.date
          }
        }

        return `
        <tr class="hover:bg-white/5 transition">
          <td class="px-6 py-4">
            <div class="font-mono text-xs text-neonBlue" title="${bookingId}">#${shortId}</div>
            <div class="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-wider">${displayDate}</div>
          </td>
          <td class="px-6 py-4">
            <div class="font-bold text-white">${booking.customerName || 'Guest'}</div>
            <div class="text-xs text-gray-400 font-mono">${booking.customerEmail || ''}</div>
            <div class="text-[11px] text-gray-500 font-mono">${booking.phone || ''}</div>
          </td>
          <td class="px-6 py-4">
            <div class="text-sm font-bold text-white">${booking.device || 'Unknown Device'}</div>
            <div class="text-xs text-neonGold font-mono uppercase tracking-wider">${booking.service || 'General Repair'}</div>
          </td>
          <td class="px-6 py-4 font-mono text-xs text-gray-300">${booking.location || 'Mail-In'}</td>
          <td class="px-6 py-4">
            <select onchange="window.updateBookingStatus('${bookingId}', this.value)" class="bg-[#080b12] border border-white/10 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-neonBlue text-white font-mono">
              <option value="Pending" ${booking.status === 'Pending' ? 'selected' : ''}>PENDING</option>
              <option value="Confirmed" ${booking.status === 'Confirmed' ? 'selected' : ''}>CONFIRMED</option>
              <option value="Repairing" ${booking.status === 'Repairing' ? 'selected' : ''}>REPAIRING</option>
              <option value="Testing" ${booking.status === 'Testing' ? 'selected' : ''}>TESTING</option>
              <option value="Completed" ${booking.status === 'Completed' ? 'selected' : ''}>COMPLETED</option>
            </select>
          </td>
          <td class="px-6 py-4 text-right font-black text-white italic">$${booking.price || '0'}</td>
        </tr>
      `
      })
      .join('')

    document.getElementById('active-count').innerText = activeCount

    const revenueLabel = document.querySelector('.border-l-neonGold p')
    if (revenueLabel) {
      revenueLabel.innerText =
        startValue || endValue ? 'Selected Revenue' : 'Total Revenue'
    }
    document.getElementById('revenue-count').innerText = `$${revenueSum}`
  }

  function renderEnquiriesTable() {
    const tableHead = document.getElementById('admin-table-head')
    const tableBody = document.getElementById('admin-table-body')
    if (!tableHead || !tableBody) return

    tableHead.innerHTML = `
      <tr>
        <th class="px-6 py-5">Received</th>
        <th class="px-6 py-5">Contact Details</th>
        <th class="px-6 py-5">Requested Service</th>
        <th class="px-6 py-5">Issue Description</th>
        <th class="px-6 py-5 text-right">Actions</th>
      </tr>
    `

    tableBody.innerHTML = allEnquiries
      .map((enq) => {
        const name =
          `${enq.firstName || ''} ${enq.lastName || ''}`.trim() || 'Anonymous'
        return `
        <tr class="hover:bg-white/5 transition text-sm">
          <td class="px-6 py-4 text-xs font-mono text-gray-400">Node_Enq</td>
          <td class="px-6 py-4">
            <div class="font-bold text-white">${name}</div>
            <div class="text-xs text-neonBlue font-mono">${enq.email || ''}</div>
            <div class="text-[11px] text-gray-500 font-mono">${enq.phone || ''}</div>
          </td>
          <td class="px-6 py-4 font-mono">
            <div class="text-white font-bold">${enq.model || 'Unknown Model'}</div>
            <div class="text-xs text-neonGold uppercase">${enq.service || 'Other'}</div>
          </td>
          <td class="px-6 py-4 text-xs text-gray-300 max-w-xs break-words">${enq.description || 'No notes provided.'}</td>
          <td class="px-6 py-4 text-right">
            <button onclick="window.dismissEnquiry('${enq._id}')" class="text-xs border border-red-500/30 px-3 py-1.5 rounded-xl text-red-400 hover:bg-red-500/10 transition font-mono">DISMISS</button>
          </td>
        </tr>
      `
      })
      .join('')
  }

  window.clearDateFilter = function () {
    if (startDateInput) startDateInput.value = ''
    if (endDateInput) endDateInput.value = ''
    toggleDateHighlight()
    if (currentView === 'bookings') {
      renderBookingsTable()
    }
  }

  window.updateBookingStatus = async function (bookingId, newStatus) {
    try {
      const response = await fetch(
        `${window.CONFIG.API_BASE_URL}/api/admin/bookings/${bookingId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        },
      )

      if (response.ok) {
        allBookings = allBookings.map((b) =>
          b._id === bookingId || b.bookingId === bookingId
            ? { ...b, status: newStatus }
            : b,
        )
        renderBookingsTable()
      } else {
        alert('Status sync failed.')
      }
    } catch (error) {
      console.error(error)
    }
  }

  window.dismissEnquiry = async function (enquiryId) {
    if (!confirm('Resolve and clear this enquiry?')) return
    try {
      const response = await fetch(
        `${window.CONFIG.API_BASE_URL}/api/admin/enquiries/${enquiryId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'resolved' }),
        },
      )

      if (response.ok) {
        allEnquiries = allEnquiries.filter((e) => e._id !== enquiryId)
        renderEnquiriesTable()
      }
    } catch (error) {
      console.error(error)
    }
  }

  window.switchView = function (view) {
    currentView = view
    const tabBookings = document.getElementById('tab-bookings')
    const tabEnquiries = document.getElementById('tab-enquiries')
    const title = document.getElementById('current-store-title')
    const filters = document.getElementById('location-filters-container')
    const dateFilterArea = startDateInput ? startDateInput.parentElement : null

    if (view === 'bookings') {
      tabBookings.className =
        'w-full text-left px-4 py-3 rounded-xl transition text-sm bg-white/10 text-neonBlue font-bold'
      tabEnquiries.className =
        'w-full text-left px-4 py-3 rounded-xl transition text-sm text-gray-400 hover:text-white'
      if (title)
        title.innerHTML = `${currentStore} <span class="text-neonBlue">Protocols</span>`
      if (filters) filters.classList.remove('hidden')
      if (dateFilterArea) dateFilterArea.classList.remove('hidden')
      renderBookingsTable()
    } else {
      tabEnquiries.className =
        'w-full text-left px-4 py-3 rounded-xl transition text-sm bg-white/10 text-neonBlue font-bold'
      tabBookings.className =
        'w-full text-left px-4 py-3 rounded-xl transition text-sm text-gray-400 hover:text-white'
      if (title)
        title.innerHTML = `Customer <span class="text-neonBlue">Enquiries</span>`
      if (filters) filters.classList.add('hidden')
      if (dateFilterArea) dateFilterArea.classList.add('hidden')
      renderEnquiriesTable()
    }
  }

  window.changeStore = function (storeName) {
    currentStore = storeName
    const title = document.getElementById('current-store-title')
    if (title) {
      title.innerHTML = `${storeName} <span class="text-neonBlue">Protocols</span>`
    }

    const storeButtons = document.querySelectorAll('.store-btn')
    storeButtons.forEach((btn) => {
      const text = btn.innerText.trim()
      if (
        text.includes(storeName) ||
        (storeName === 'All' && text.includes('All'))
      ) {
        btn.className =
          'store-btn active w-full text-left px-4 py-3 rounded-xl transition text-sm text-neonBlue font-bold bg-white/10'
      } else {
        btn.className =
          'store-btn w-full text-left px-4 py-3 rounded-xl transition text-sm text-gray-400 hover:text-white'
      }
    })

    if (currentView === 'bookings') {
      renderBookingsTable()
    }
  }
})
