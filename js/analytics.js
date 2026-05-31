// js/analytics.js

document.addEventListener('DOMContentLoaded', () => {
  const isAdminLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';

  if (!isAdminLoggedIn) {
    window.location.href = 'admin-login.html';
    return;
  }

  const mainContent = document.getElementById('analytics-main-content');
  if (mainContent) {
    mainContent.classList.remove('hidden');
  }

  const adminLogoutBtn = document.getElementById('btn-analytics-logout');
  const startDateInput = document.getElementById('analytics-start-date');
  const endDateInput = document.getElementById('analytics-end-date');
  const allTimeBtn = document.getElementById('btn-analytics-all-time');

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
        if (confirm('Disconnect from administrative mainframe terminal?')) {
            // Clear all restricted credentials from session cache storage
            sessionStorage.removeItem('isAdminLoggedIn');
            sessionStorage.removeItem('adminToken');
            
            // Redirect seamlessly back to the public frontline homepage
            window.location.href = 'index.html';
        }
    });
}

  // Global Configuration Defaults for Dark Mode Tech Theme Charts
  Chart.defaults.color = '#9ca3af';
  Chart.defaults.font.family = 'monospace';
  Chart.defaults.font.size = 10;

  let cachedBookings = [];
  
  // Persistent chart instances to allow dynamic tracking destruction cycles
  let chartRevenueInstance = null;
  let chartServiceInstance = null;
  let chartTaskInstance = null;

  // Default time bounding window initialization configuration (Default to current day parameters)
  const todayStr = new Date().toLocaleDateString('en-CA'); 
  if (startDateInput && endDateInput) {
    startDateInput.value = todayStr;
    endDateInput.value = todayStr;
  }

  fetchAnalyticsData();

  function toggleDateHighlight() {
    const startValue = startDateInput ? startDateInput.value : '';
    const endValue = endDateInput ? endDateInput.value : '';

    if (!startValue && !endValue) {
      if (allTimeBtn) {
        allTimeBtn.className = "text-[10px] font-mono border px-2.5 py-1.5 rounded-xl transition-all duration-300 uppercase ml-2 border-neonBlue text-neonBlue bg-neonBlue/10 shadow-[0_0_10px_rgba(0,243,255,0.2)]";
      }
      if (startDateInput) startDateInput.className = "bg-[#080b12] border border-white/10 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-neonBlue text-white font-mono transition-all duration-300";
      if (endDateInput) endDateInput.className = "bg-[#080b12] border border-white/10 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-neonBlue text-white font-mono transition-all duration-300";
    } else {
      if (allTimeBtn) {
        allTimeBtn.className = "text-[10px] font-mono border px-2.5 py-1.5 rounded-xl transition-all duration-300 uppercase ml-2 border-gray-700 text-gray-400";
      }
      if (startDateInput) startDateInput.className = "bg-[#080b12] border border-neonBlue text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-neonBlue text-white font-mono transition-all duration-300 shadow-[0_0_10px_rgba(0,243,255,0.1)]";
      if (endDateInput) endDateInput.className = "bg-[#080b12] border border-neonBlue text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-neonBlue text-white font-mono transition-all duration-300 shadow-[0_0_10px_rgba(0,243,255,0.1)]";
    }
  }

  function onDateRangeChange() {
    toggleDateHighlight();
    if (cachedBookings.length > 0) {
      processAndRenderCharts(cachedBookings);
    }
  }

  if (startDateInput) startDateInput.addEventListener('change', onDateRangeChange);
  if (endDateInput) endDateInput.addEventListener('change', onDateRangeChange);

  async function fetchAnalyticsData() {
    try {
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/admin/bookings`);
      cachedBookings = await response.json();
      toggleDateHighlight();
      processAndRenderCharts(cachedBookings);
    } catch (error) {
      console.error('Analytics streaming processing error:', error);
    }
  }

  function processAndRenderCharts(bookings) {
    const startValue = startDateInput ? startDateInput.value : '';
    const endValue = endDateInput ? endDateInput.value : '';

    // Step 1: Filter raw data blocks according to targeted range matrix configuration
    let filtered = [...bookings];
    if (startValue && endValue) {
      filtered = filtered.filter(b => b.date >= startValue && b.date <= endValue);
    } else if (startValue) {
      filtered = filtered.filter(b => b.date >= startValue);
    } else if (endValue) {
      filtered = filtered.filter(b => b.date <= endValue);
    }

    let grossRevenue = 0;
    const totalBookings = filtered.length;

    const storeRevenueMap = {
      'Sydney CBD': 0,
      'World Square': 0,
      'Burwood': 0,
      'Mascot': 0,
      'Kingsford': 0
    };

    const serviceDistributionMap = {};
    let incompleteTasksCount = 0;
    let completedTasksCount = 0;

    filtered.forEach(b => {
      const price = parseFloat(b.price || 0);
      
      if (b.status === 'Completed') {
        grossRevenue += price;
        completedTasksCount++;
        
        const store = b.location || 'Mail-In';
        if (storeRevenueMap[store] !== undefined) {
          storeRevenueMap[store] += price;
        }
      } else {
        incompleteTasksCount++;
      }

      const service = b.service || 'General Repair';
      serviceDistributionMap[service] = (serviceDistributionMap[service] || 0) + 1;
    });

    // Update real-time summary tickers data indicators
    document.getElementById('ticker-gross-revenue').innerText = `$${grossRevenue.toFixed(2)}`;
    document.getElementById('ticker-total-bookings').innerText = totalBookings;

    const revenueLabel = document.querySelector('.border-l-neonBlue p');
    if (revenueLabel) {
      revenueLabel.innerText = (startValue || endValue) ? "Selected Revenue" : "Gross Revenue";
    }

    // =======================================================
    // CHART 01 // DYNAMIC MULTI-STORE REVENUE BAR CHART
    // =======================================================
    if (chartRevenueInstance) chartRevenueInstance.destroy();
    const ctxRevenue = document.getElementById('chart-store-revenue').getContext('2d');
    chartRevenueInstance = new Chart(ctxRevenue, {
      type: 'bar',
      data: {
        labels: Object.keys(storeRevenueMap),
        datasets: [{
          label: 'Revenue Yield ($)',
          data: Object.values(storeRevenueMap),
          backgroundColor: 'rgba(0, 243, 255, 0.2)',
          borderColor: '#00f3ff',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(0, 243, 255, 0.4)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          y: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { callback: value => '$' + value }
          }
        }
      }
    });

    // =======================================================
    // CHART 02 // DYNAMIC SERVICE CATEGORY PIE CHART
    // =======================================================
    if (chartServiceInstance) chartServiceInstance.destroy();
    const ctxService = document.getElementById('chart-service-distribution').getContext('2d');
    chartServiceInstance = new Chart(ctxService, {
      type: 'pie',
      data: {
        labels: Object.keys(serviceDistributionMap),
        datasets: [{
          data: Object.values(serviceDistributionMap),
          backgroundColor: [
            'rgba(0, 243, 255, 0.3)',
            'rgba(250, 219, 95, 0.3)',
            'rgba(168, 85, 247, 0.3)',
            'rgba(34, 197, 94, 0.3)',
            'rgba(239, 68, 68, 0.3)'
          ],
          borderColor: 'rgba(11, 15, 25, 0.8)',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 12, padding: 15 }
          }
        }
      }
    });

    if (chartTaskInstance) chartTaskInstance.destroy();
    const ctxTask = document.getElementById('chart-task-ratio').getContext('2d');
    chartTaskInstance = new Chart(ctxTask, {
      type: 'doughnut',
      data: {
        labels: ['Active Incomplete Tasks', 'Archived Completed Logs'],
        datasets: [{
          data: [incompleteTasksCount, completedTasksCount],
          backgroundColor: ['#fadb5f', 'rgba(34, 197, 94, 0.4)'],
          borderColor: '#080b12',
          borderWidth: 4,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 20 }
          }
        }
      }
    });
  }

  window.clearAnalyticsDateFilter = function() {
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    toggleDateHighlight();
    if (cachedBookings.length > 0) {
      processAndRenderCharts(cachedBookings);
    }
  };
});