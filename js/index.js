// js/index.js

document.addEventListener('DOMContentLoaded', () => {
    // Reveal Animation
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.15 });

    revealElements.forEach((el) => revealObserver.observe(el));
    // User Menu State
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName');
    
    const userMenu = document.getElementById('user-menu');
    const mobileUserMenu = document.getElementById('mobile-user-menu');

    if (isLoggedIn && userName) {
        const firstName = userName.split(' ')[0];
        const loggedInHTML = `
            <div class="group relative">
                <button class="bg-neonBlue text-black px-5 py-2 rounded-full font-bold flex items-center gap-2 shadow-[0_0_15px_#00f3ff]">
                    Hi, ${firstName} ▾
                </button>
                <div class="absolute right-0 mt-2 w-48 glass-panel rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-2 shadow-xl border border-white/10">
                    <a href="dashboard.html" class="block px-4 py-2 hover:bg-white/10 rounded-lg transition text-sm text-white">Order History</a>
                    <a href="services.html" class="block px-4 py-2 hover:bg-white/10 rounded-lg transition text-sm text-white">New Repair</a>
                    <hr class="my-2 border-white/10">
                    <button onclick="window.logout()" class="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition text-sm">Logout</button>
                </div>
            </div>
        `;

        const loggedInMobileHTML = `
            <div class="bg-white/5 p-4 rounded-xl border border-white/10 mt-2">
                <p class="text-neonBlue font-bold mb-3">Hi, ${firstName}</p>
                <a href="dashboard.html" class="block py-2 text-white hover:text-neonBlue transition">Order History</a>
                <a href="services.html" class="block py-2 text-white hover:text-neonBlue transition">New Repair</a>
                <button onclick="window.logout()" class="block w-full text-left py-2 text-red-400 mt-2 border-t border-white/10">Logout</button>
            </div>
        `;

        if (userMenu) userMenu.innerHTML = loggedInHTML;
        if (mobileUserMenu) mobileUserMenu.innerHTML = loggedInMobileHTML;
    }

    // Enquiry Form Submission
    const btnSubmit = document.getElementById('btn-submit-enquiry');
    if(btnSubmit) {
        btnSubmit.addEventListener('click', async function() {
            const btn = this;
            btn.innerText = 'SUBMITTING...';
            
            const data = {
                firstName: document.getElementById('enq-firstName').value,
                lastName: document.getElementById('enq-lastName').value,
                email: document.getElementById('enq-email').value,
                phone: document.getElementById('enq-phone').value,
                service: document.getElementById('enq-service').value,
                model: document.getElementById('enq-model').value,
                description: document.getElementById('enq-desc').value,
            };

            if(!data.firstName || !data.email || !data.description) {
                alert("Please fill in all required fields!");
                btn.innerText = 'SUBMIT';
                return;
            }

            try {
                const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/enquiries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if(res.ok) {
                    btn.innerText = 'SUCCESS!';
                    btn.classList.replace('bg-neonGold', 'bg-green-400');
                    document.querySelector('#enquiry form').reset();
                    setTimeout(() => {
                        btn.innerText = 'SUBMIT';
                        btn.classList.replace('bg-green-400', 'bg-neonGold');
                    }, 3000);
                }
            } catch (err) {
                alert("Submission failed. Please try again later.");
                btn.innerText = 'SUBMIT';
            }
        });
    }
});