// js/services.js

let database = []
let state = {
  step: 1,
  brand: null,
  series: null,
  model: null,
  serviceObj: null,
}

document.addEventListener('DOMContentLoaded', () => {
  const views = {
    1: document.getElementById('view-1'),
    2: document.getElementById('view-2'),
    3: document.getElementById('view-3'),
    4: document.getElementById('view-4'),
    5: document.getElementById('view-5'),
  }
  const indicators = {
    1: document.getElementById('ind-1'),
    2: document.getElementById('ind-2'),
    3: document.getElementById('ind-3'),
    4: document.getElementById('ind-4'),
    5: document.getElementById('ind-5'),
  }
  const progressBar = document.getElementById('progress-bar')
  const btnBack = document.getElementById('btn-back')
  const loadingSpinner = document.getElementById('loading-spinner')

  async function fetchServicesData () {
    loadingSpinner.classList.remove('hidden')
    try {
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/services`)
      database = await response.json()
      renderBrands()
    } catch (error) {
      console.error('Fetch error:', error)
      document.getElementById('content-area').innerHTML =
        `<div class="text-center text-red-500 py-10 font-mono">❌ Failed to connect to server. Ensure Node.js is running.</div>`
    } finally {
      loadingSpinner.classList.add('hidden')
    }
  }

  function renderBrands () {
    const brands = [...new Set(database.map((item) => item.brand))]
    views[1].innerHTML = brands
      .map(
        (brand) => `
            <button onclick="window.selectBrand('${brand}')" class="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center gap-4 hover-glow transition">
                <span class="text-2xl font-bold tracking-wider">${brand}</span>
            </button>
        `,
      )
      .join('')
    updateUI(1)
  }

  window.selectBrand = function (brand) {
    state.brand = brand
    state.step = 2

    const filtered = database.filter((item) => item.brand === state.brand)
    const seriesSet = new Set(filtered.map((item) => item.series))
    const seriesArray = [...seriesSet].sort().reverse()

    views[2].innerHTML = seriesArray
      .map(
        (seriesName) => `
            <button onclick="window.selectSeries('${seriesName}')" class="glass-panel p-6 rounded-xl text-center hover-glow transition group">
                <span class="font-bold text-xl text-gray-200 group-hover:text-neonBlue transition">${seriesName}</span>
            </button>
        `,
      )
      .join('')
    updateUI(2)
  }

  window.selectSeries = function (series) {
    state.series = series
    state.step = 3

    const filtered = database.filter(
      (item) => item.brand === state.brand && item.series === state.series,
    )
    const models = [...new Set(filtered.map((item) => item.model))]

    views[3].innerHTML = models
      .map(
        (model) => `
            <button onclick="window.selectModel('${model}')" class="glass-panel p-5 rounded-xl text-left hover-glow transition flex justify-between items-center group">
                <span class="font-bold text-lg text-gray-200 group-hover:text-white">${model}</span>
                <span class="text-neonBlue opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1">→</span>
            </button>
        `,
      )
      .join('')
    updateUI(3)
  }

  window.selectModel = function (model) {
    state.model = model
    state.step = 4

    const services = database.filter(
      (item) => item.brand === state.brand && item.model === state.model,
    )

    views[4].innerHTML = services
      .map((item) => {
        let icon = '🔧'
        if (item.service.toLowerCase().includes('screen')) icon = '📱'
        if (
          item.service.toLowerCase().includes('port') ||
          item.service.toLowerCase().includes('battery')
        )
          icon = '⚡'

        return `
            <button onclick="window.selectService('${item._id}')" class="glass-panel p-6 rounded-xl text-left hover-glow transition flex items-center gap-4 group">
                <div class="text-3xl bg-black/50 w-14 h-14 flex items-center justify-center rounded-xl border border-white/5 group-hover:border-neonBlue/50 transition">${icon}</div>
                <div>
                    <div class="font-bold text-lg text-white group-hover:text-neonBlue transition">${item.service}</div>
                    <div class="text-xs text-gray-400 mt-1">Diagnostic & Hardware Replacement</div>
                </div>
            </button>
        `
      })
      .join('')
    updateUI(4)
  }

  window.selectService = function (itemId) {
    const item = database.find((d) => d._id === itemId)
    state.serviceObj = item
    state.step = 5

    views[5].innerHTML = `
            <div class="flex flex-col md:flex-row gap-8 items-stretch">
                <div class="w-full md:w-1/2 glass-panel p-8 rounded-2xl border-l-4 border-l-neonBlue relative overflow-hidden">
                    <div class="absolute -right-10 -top-10 opacity-5 text-9xl">⚙️</div>
                    <h3 class="text-sm text-gray-400 font-mono mb-1 uppercase tracking-widest">Target Device</h3>
                    <p class="text-2xl font-bold text-white mb-6">${item.brand} <span class="text-neonBlue">${item.model}</span></p>
                    
                    <h3 class="text-sm text-gray-400 font-mono mb-1 uppercase tracking-widest">Required Service</h3>
                    <p class="text-xl text-white mb-6">${item.service}</p>
                    
                    <div class="bg-black/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                        <span class="text-sm text-gray-400">Standard Price</span>
                        <span class="text-lg text-gray-300 line-through">$${item.price}</span>
                    </div>
                </div>

                <div class="w-full md:w-1/2 glass-panel p-8 rounded-2xl flex flex-col justify-center items-center text-center border border-neonGold/30 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-40 h-40 bg-neonGold/10 rounded-bl-full blur-3xl -z-10"></div>
                    <p class="text-neonGold font-bold mb-2 tracking-widest uppercase text-sm">Pro Member Estimate</p>
                    <p class="text-6xl md:text-7xl font-black text-white glow-gold mb-8">$${item.memberPrice}</p>
                    <a href="booking.html?service_id=${item._id}" class="w-full bg-neonBlue text-black font-bold py-4 rounded-xl hover:bg-white transition shadow-[0_0_20px_rgba(0,243,255,0.4)] text-lg uppercase tracking-wide">
                        Book This Price
                    </a>
                </div>
            </div>
        `
    updateUI(5)
  }

  window.goBack = function () {
    if (state.step > 1) {
      state.step--
      updateUI(state.step)
    }
  }

  function updateUI (activeStep) {
    Object.keys(views).forEach((k) => views[k].classList.add('hidden'))
    views[activeStep].classList.remove('hidden')

    Object.keys(indicators).forEach(k => {
      const ind = indicators[k]
      const circle = ind.querySelector('div')
      const text = ind.querySelector('span')
      ind.classList.remove('opacity-40')

      if (k < activeStep) {
        circle.className = "w-10 h-10 rounded-full bg-[#080b12] text-neonBlue border-2 border-neonBlue flex items-center justify-center transition-all z-20"
        circle.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
        text.style.color = '#00f3ff'
      } else if (k == activeStep) {
        circle.className = "w-10 h-10 rounded-full bg-neonBlue text-black font-bold flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.8)] transition-all transform scale-110 z-30"
        circle.innerHTML = k
        text.style.color = '#00f3ff'
      } else {
        circle.className = "w-10 h-10 rounded-full bg-[#080b12] border-2 border-gray-600 text-gray-400 flex items-center justify-center transition-all z-20"
        circle.innerHTML = k
        text.style.color = '#9ca3af'
      }
    })
    const progressWidths = { 1: '0%', 2: '25%', 3: '50%', 4: '75%', 5: '80%' }
    progressBar.style.width = progressWidths[activeStep]

    if (activeStep === 1) {
      btnBack.classList.add('hidden')
    } else {
      btnBack.classList.remove('hidden')
    }
  }

  btnBack.addEventListener('click', window.goBack)
  fetchServicesData()
})