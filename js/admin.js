let allBookings = [];
let allEnquiries = [];
let currentFilter = 'All';
let currentView = 'bookings'; // default will be bookings page

document.addEventListener('DOMContentLoaded', async () => {
    await fetchBookings();
});

// This function is used to fetch all bookings info
async function fetchBookings() {
    try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/admin/bookings`);
        allBookings = await response.json();
        if(currentView === 'bookings') renderTable();
    } catch (err) {
        console.error("Database connection failed", err);
    }
}

// This function is used to fetch all the enquiries
async function fetchEnquiries() {
    try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/admin/enquiries`);
        allEnquiries = await response.json();
        if(currentView === 'enquiries') renderEnquiriesTable();
    } catch (err) {
        console.error("Failed to fetch enquiries", err);
    }
}

// This function is used to switch the view between bookings or enquiries
function switchView(view) {
    currentView = view;
    const tabBookings = document.getElementById('tab-bookings');
    const tabEnquiries = document.getElementById('tab-enquiries');
    const locationFilters = document.getElementById('location-filters-container');

    if (view === 'bookings') {
        tabBookings.className = "w-full text-left px-4 py-3 rounded-xl transition text-sm bg-white/10 text-neonBlue font-bold";
        tabEnquiries.className = "w-full text-left px-4 py-3 rounded-xl transition text-sm text-gray-400 hover:text-white";
        locationFilters.style.display = 'block'; // we will let admin to change to different store
        document.getElementById('current-store-title').innerHTML = `${currentFilter} <span class="text-neonBlue">Protocols</span>`;
        fetchBookings(); // we need to fetch the data again
    } else {
        tabEnquiries.className = "w-full text-left px-4 py-3 rounded-xl transition text-sm bg-white/10 text-neonGold font-bold";
        tabBookings.className = "w-full text-left px-4 py-3 rounded-xl transition text-sm text-gray-400 hover:text-white";
        locationFilters.style.display = 'none'; 
        document.getElementById('current-store-title').innerHTML = `Customer <span class="text-neonGold">Enquiries</span>`;
        fetchEnquiries();
    }
}

// this function is used to render the booking table
function renderTable() {
    const thead = document.getElementById('admin-table-head');
    thead.innerHTML = `
        <tr>
            <th class="px-6 py-5">Protocol ID</th>
            <th class="px-6 py-5">Customer</th>
            <th class="px-6 py-5">Device & Service</th>
            <th class="px-6 py-5">Location</th>
            <th class="px-6 py-5">Status Update</th>
            <th class="px-6 py-5 text-right">Price</th>
        </tr>
    `;

    const tbody = document.getElementById('admin-table-body');
    const filtered = currentFilter === 'All' 
        ? allBookings 
        : allBookings.filter(b => b.location === currentFilter);

    tbody.innerHTML = '';
    let activeTasks = 0;
    let totalRevenue = 0;

    filtered.forEach(order => {
        if (order.status !== 'Completed' && order.status !== 'Cancelled') activeTasks++;
        if (order.status === 'Completed') totalRevenue += order.price;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/[0.02] transition-colors group";
        tr.innerHTML = `
            <td class="px-6 py-4 font-mono text-[10px] text-gray-400">${order._id.substring(0, 8)}...</td>
            <td class="px-6 py-4">
                <p class="font-bold text-sm text-white">${order.customerName}</p>
                <p class="text-[10px] text-gray-400">${order.phone}</p>
            </td>
            <td class="px-6 py-4">
                <p class="text-xs text-white">${order.device}</p>
                <p class="text-[10px] text-neonBlue uppercase">${order.service}</p>
            </td>
            <td class="px-6 py-4 text-xs text-gray-400">${order.location}</td>
            <td class="px-6 py-4">
                <select aria-label="Update Protocol Status" onchange="updateStatus('${order._id}', this.value)" class="status-select status-${order.status ? order.status.toLowerCase() : ''}">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="Repairing" ${order.status === 'Repairing' ? 'selected' : ''}>Repairing</option>
                    <option value="Testing" ${order.status === 'Testing' ? 'selected' : ''}>Testing</option>
                    <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td class="px-6 py-4 text-right font-bold text-neonGold">$${order.price}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('active-count').innerText = activeTasks;
    document.getElementById('revenue-count').innerText = `$${totalRevenue}`;
}

// render the enquries table
function renderEnquiriesTable() {
    const thead = document.getElementById('admin-table-head');
    thead.innerHTML = `
        <tr>
            <th class="px-6 py-5">Date</th>
            <th class="px-6 py-5">Customer Info</th>
            <th class="px-6 py-5">Device Issue</th>
            <th class="px-6 py-5 w-1/3">Description</th>
            <th class="px-6 py-5 text-right">Status Update</th>
        </tr>
    `;

    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '';
    
    // sort the enquiries based on the time
    allEnquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // update the stat dashboard
    const newLeadsCount = allEnquiries.filter(e => e.status === 'New').length;
    document.getElementById('active-count').innerText = newLeadsCount + ' New';
    document.getElementById('revenue-count').innerText = allEnquiries.length + ' Total';

    allEnquiries.forEach(enq => {
        // formate the time of the enquiry
        const dateObj = new Date(enq.createdAt);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/[0.02] transition-colors group";
        
        // if this one is new we will add the border to that
        if(enq.status === 'New' || !enq.status) {
            tr.classList.add('border-l-2', 'border-neonBlue');
        }

        tr.innerHTML = `
            <td class="px-6 py-4 font-mono text-xs text-gray-400">${dateStr}</td>
            <td class="px-6 py-4">
                <p class="font-bold text-sm text-white">${enq.firstName} ${enq.lastName}</p>
                <p class="text-[10px] text-gray-400 select-all">${enq.email}</p>
                <p class="text-[10px] text-gray-400 select-all">${enq.phone}</p>
            </td>
            <td class="px-6 py-4">
                <p class="text-xs text-white">${enq.model}</p>
                <span class="inline-block px-2 py-1 bg-neonGold/10 text-neonGold text-[10px] rounded mt-1 uppercase">${enq.service}</span>
            </td>
            <td class="px-6 py-4 text-xs text-gray-400 break-words">${enq.description}</td>
            <td class="px-6 py-4 text-right">
                <select aria-label="Update Enquiry Status" onchange="updateEnquiryStatus('${enq._id}', this.value)" 
                        class="bg-[#0b0f19] border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-neonGold transition cursor-pointer">
                    <option value="New" ${enq.status === 'New' || !enq.status ? 'selected' : ''}>🔵 New</option>
                    <option value="Contacted" ${enq.status === 'Contacted' ? 'selected' : ''}>🟡 Contacted</option>
                    <option value="Quoted" ${enq.status === 'Quoted' ? 'selected' : ''}>🟣 Quoted</option>
                    <option value="Converted" ${enq.status === 'Converted' ? 'selected' : ''}>🟢 Converted</option>
                    <option value="Closed" ${enq.status === 'Closed' ? 'selected' : ''}>⚪ Closed</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// update the details / status of the enquiry
async function updateEnquiryStatus(enquiryId, newStatus) {
    try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/admin/enquiries/${enquiryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            // update the current status
            const index = allEnquiries.findIndex(e => e._id === enquiryId);
            if (index !== -1) {
                allEnquiries[index].status = newStatus;
            }
            // we need to render the table again
            renderEnquiriesTable();
        } else {
            alert("Failed to update enquiry status.");
        }
    } catch (err) {
        console.error(err);
        alert("Network error.");
    }
}
// the function used to filter the store
function changeStore(store) {
    if(currentView !== 'bookings') return;
    currentFilter = store;
    document.getElementById('current-store-title').innerHTML = `${store === 'All' ? 'All' : store} <span class="text-neonBlue">Protocols</span>`;
    
    document.querySelectorAll('.store-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText === store || (store === 'All' && btn.innerText === 'All Protocols')) {
            btn.classList.add('active');
        }
    });
    renderTable();
}

// update the status of the orders
async function updateStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/admin/bookings/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            const index = allBookings.findIndex(b => b._id === orderId);
            allBookings[index].status = newStatus;
            renderTable();
        }
    } catch (err) {
        alert("Sync failed.");
    }
}