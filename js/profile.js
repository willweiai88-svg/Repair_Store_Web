// js/profile.js

document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName');

  if (!isLoggedIn || !userEmail) {
    window.location.href = 'login.html';
    return;
  }

  const nameInput = document.getElementById('prof-name');
  const emailInput = document.getElementById('prof-email');

  if (nameInput) nameInput.value = userName || '';
  if (emailInput) emailInput.value = userEmail || '';

  // Intermediary transactional pipeline reference blocks
  let activeTransactionType = null; 
  let pendingFormData = {};

  const modal = document.getElementById('security-code-modal');
  const closeModalBtn = document.getElementById('btn-close-security-modal');
  const gatewayForm = document.getElementById('global-verification-gateway-form');
  
  const wrapperSecondary = document.getElementById('wrapper-code-secondary');
  const labelPrimary = document.getElementById('label-code-primary');
  const descModal = document.getElementById('modal-security-description');

  // Trigger interception point 01: Identity updates
  const identityForm = document.getElementById('profile-identity-form');
  if (identityForm) {
    identityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const targetEmail = emailInput.value.trim();
      const targetName = nameInput.value.trim();

      activeTransactionType = 'identity';
      pendingFormData = { fullName: targetName, email: targetEmail };

      const isChangingEmail = targetEmail !== userEmail;
      
      descModal.innerText = isChangingEmail 
        ? `Detecting modification sequence to security parameter address. Multi-channel codes required.`
        : `Requesting standard credential clearance parameters to execute structural sync.`;

      labelPrimary.innerText = isChangingEmail ? "Old Email Verification Passkey" : "Verification Passkey";
      
      if (isChangingEmail) {
          wrapperSecondary.classList.remove('hidden');
          document.getElementById('input-code-secondary').required = true;
      } else {
          wrapperSecondary.classList.add('hidden');
          document.getElementById('input-code-secondary').required = false;
      }

      await triggerServerCodeEmission(userEmail, 'update_identity', isChangingEmail ? targetEmail : null);
    });
  }

  // Trigger interception point 02: Passkey resets
  const passwordForm = document.getElementById('profile-password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('pass-current').value;
      const newPassword = document.getElementById('pass-new').value;
      const confirmPassword = document.getElementById('pass-confirm').value;

      if (newPassword !== confirmPassword) {
        alert('Validation error: New password confirmations do not match.');
        return;
      }

      activeTransactionType = 'password';
      pendingFormData = { currentPassword, newPassword };

      descModal.innerText = "Requesting secure cryptographic passkey reset clearance variables.";
      labelPrimary.innerText = "Cypher Verification Passkey";
      wrapperSecondary.classList.add('hidden');
      document.getElementById('input-code-secondary').required = false;

      await triggerServerCodeEmission(userEmail, 'reset_password');
    });
  }

  async function triggerServerCodeEmission(email, actionType, secondaryEmail = null) {
      try {
          const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/user/request-code`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, actionType, secondaryEmail })
          });
          const data = await res.json();
          if (res.ok) {
              alert(data.message);
              showGatewayModal();
          } else {
              alert(`TRANSMISSION REFUSED: ${data.message}`);
          }
      } catch (err) {
          console.error(err);
      }
  }

  function showGatewayModal() {
      if (!modal) return;
      gatewayForm.reset();
      modal.classList.remove('hidden');
      setTimeout(() => modal.classList.remove('opacity-0'), 10);
      modal.firstElementChild.classList.remove('scale-95');
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', hideGatewayModal);
  
  function hideGatewayModal() {
      if (!modal) return;
      modal.classList.add('opacity-0');
      modal.firstElementChild.classList.add('scale-95');
      setTimeout(() => modal.classList.add('hidden'), 300);
  }

  // Final Centralized Gateway Form Core Executor Processing Pipeline
  if (gatewayForm) {
      gatewayForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const submitBtn = document.getElementById('btn-submit-gate-clearance');
          const originalText = submitBtn.innerText;

          const primaryCode = document.getElementById('input-code-primary').value.trim();
          const secondaryCode = document.getElementById('input-code-secondary').value.trim();

          submitBtn.innerText = 'PROCESSING_CLEARANCE...';
          submitBtn.disabled = true;

          let targetUrl = '';
          let requestPayload = {};

          if (activeTransactionType === 'identity') {
              targetUrl = `${window.CONFIG.API_BASE_URL}/api/user/update-profile`;
              requestPayload = {
                  currentEmail: userEmail,
                  fullName: pendingFormData.fullName,
                  email: pendingFormData.email,
                  primaryCode,
                  secondaryCode
              };
          } else if (activeTransactionType === 'password') {
              targetUrl = `${window.CONFIG.API_BASE_URL}/api/user/update-password`;
              requestPayload = {
                  email: userEmail,
                  currentPassword: pendingFormData.currentPassword,
                  newPassword: pendingFormData.newPassword,
                  verificationCode: primaryCode
              };
          }

          try {
              const response = await fetch(targetUrl, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(requestPayload)
              });
              const data = await response.json();

              if (response.ok) {
                  alert('Security parameters successfully rewritten inside database.');
                  if (activeTransactionType === 'identity') {
                      localStorage.setItem('userName', pendingFormData.fullName);
                      localStorage.setItem('userEmail', pendingFormData.email);
                      window.location.reload();
                  } else {
                      localStorage.clear();
                      window.location.href = 'login.html';
                  }
              } else {
                  alert(`TRANSACTION DENIED: ${data.message}`);
                  submitBtn.innerText = originalText;
                  submitBtn.disabled = false;
              }
          } catch (error) {
              console.error(error);
              submitBtn.innerText = originalText;
              submitBtn.disabled = false;
          }
      });
  }
});