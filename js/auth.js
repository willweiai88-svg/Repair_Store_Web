window.logout = function() {
    // clear the local storage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    // will navigate us to the main page
    window.location.href = 'index.html';
};
document.addEventListener('DOMContentLoaded', () => {

    // get all the button and form
    const tabLogin = document.getElementById('tab-login')
    const tabRegister = document.getElementById('tab-register')
    const loginForm = document.getElementById('form-login')
    const registerForm = document.getElementById('form-register')
    const formLoginNode = document.getElementById('form-login-node')
    const formRegisterNode = document.getElementById('form-register-node')

    tabLogin.addEventListener('click', () => switchTab('login'))
    tabRegister.addEventListener('click', () => switchTab('register'))

    function switchTab (target) {
        if (target === 'login') {
            loginForm.classList.replace('hidden-form', 'active-form')
            registerForm.classList.replace('active-form', 'hidden-form')
            tabLogin.classList.replace('tab-inactive', 'tab-active')
            tabRegister.classList.replace('tab-active', 'tab-inactive')
        } else {
            registerForm.classList.replace('hidden-form', 'active-form')
            loginForm.classList.replace('active-form', 'hidden-form')
            tabRegister.classList.replace('tab-inactive', 'tab-active')
            tabLogin.classList.replace('tab-active', 'tab-inactive')
        }
    }

    // submit
    formLoginNode.addEventListener('submit', (e) => handleAuth(e, 'login'))
    formRegisterNode.addEventListener('submit', (e) => handleAuth(e, 'register'))

    async function handleAuth (e, type) {
        e.preventDefault()

        let requestBody = {}
        let submitBtn
        let originalBtnText

        if (type === 'register') {
            submitBtn = document.getElementById('btn-register')
            originalBtnText = submitBtn.innerText
            requestBody = {
                fullName: document.getElementById('reg-name').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value
            }
        } else if (type === 'login') {
            submitBtn = document.getElementById('btn-login')
            originalBtnText = submitBtn.innerText
            requestBody = {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
            }
        }

        try {
            submitBtn.innerText = "Processing..."
            submitBtn.disabled = true

            const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })

            const data = await response.json()

            if (response.ok) {
                localStorage.setItem('isLoggedIn', 'true')
                if (type === 'login') {
                    localStorage.setItem('userName', data.user.fullName)
                    localStorage.setItem('userEmail', data.user.email)
                } else {
                    localStorage.setItem('userName', requestBody.fullName)
                    localStorage.setItem('userEmail', requestBody.email)
                }


                const urlParams = new URLSearchParams(window.location.search)
                const redirectTarget = urlParams.get('redirect')

                if (redirectTarget) {
                    window.location.href = decodeURIComponent(redirectTarget)
                } else {
                    window.location.href = 'index.html'
                }

            } else {
                alert(`Error: ${data.message}`)
                submitBtn.innerText = originalBtnText
                submitBtn.disabled = false
            }

        } catch (error) {
            console.error('Server Error:', error)
            alert('Failed to connect to the server.')
            submitBtn.innerText = "Try Again"
            submitBtn.disabled = false
        }
    }
})
