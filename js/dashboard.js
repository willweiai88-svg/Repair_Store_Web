
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

  // We need to fetch all the orders the customer has already booked before
  try {
    const response = await fetch(
      `${window.CONFIG.API_BASE_URL}/api/my-bookings?email=${userEmail}`,
    )
    const orders = await response.json()
    renderOrders(orders)
  } catch (err) {
    console.error('Dashboard error', err)
  }
})
// We used this function to render all the orders on the web
function renderOrders(orders) {
  const container = document.getElementById('orders-container')
  // if the customer didnt book any order before
  // we just end
  if (orders.length === 0) return

  container.innerHTML = ''
  // Since some of the orders may have the warranty
  // we want to show all these info at the page giving the clear
  // ideat to the customer
  let activeCount = 0
  let warrantyCount = 0
  // We have already got all orders, we need to go throguh them
  // and calculate warranty and display info to customer
  orders.forEach((order) => {
    // Check how many repairs we have already done
    if (order.status !== 'Completed') activeCount++

    // calculate the warranty left
    const warranty = calculateWarranty(order.createdAt, order.status)
    if (warranty.isValid) warrantyCount++


    const card = document.createElement('div')
    // we apply the style for this card to display our repair info
    card.className =
      'glass-panel p-6 md:p-8 rounded-3xl border border-white/5 hover:border-neonBlue/30 transition-all group relative overflow-hidden'

    // we format our repair date or the date of the order (if we still
    // didnt finish that order)
    const repairDate = new Date(order.createdAt).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    // We add the content / info into our card element and apply the style to
    // each card
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

                    <div class="text-right">
                        <p class="text-[10px] text-gray-200 uppercase mb-1 tracking-widest">Total Cost</p>
                        <p class="text-2xl font-black text-white italic">$${order.price}</p>
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


// this function is used to calculate the duration of the warranty
function calculateWarranty(dateStr, status) {
  // This info will also display in the card's content
  if (status !== 'Completed')
    return { isValid: false, text: 'PENDING', expiry: 'Starts after repair' }

  const repairDate = new Date(dateStr)
  const expiryDate = new Date(repairDate)
  expiryDate.setMonth(repairDate.getMonth() + 3)

  // calculate the time left
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

// this function is used to get the status of the progress
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

// for different status the style will be different
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
