/**
 * RAJESH FRAMING - ADMIN LOGIN CONTROLLER
 * Handles Email/Password Verification, OTP Sending, 6-Digit Auto-Focus, and Token Storage
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to admin.html
  const existingToken = localStorage.getItem('rf_admin_token');
  if (existingToken) {
    checkExistingSession(existingToken);
  }

  initLoginCredentialsForm();
  initOtpVerificationForm();
  initPasswordToggle();
});

let currentAdminEmail = '';
let otpCountdownTimer = null;
let countdownSeconds = 60;

// Base API URL (falls back to current origin or port 5000)
const API_BASE = window.location.origin.includes(':5500') 
  ? 'http://localhost:5000' 
  : window.location.origin;

/* --- Check Existing Session --- */
async function checkExistingSession(token) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = 'admin.html';
    } else {
      localStorage.removeItem('rf_admin_token');
      localStorage.removeItem('rf_admin_user');
    }
  } catch (e) {
    console.warn('Could not verify existing session:', e);
  }
}

/* --- Password Visibility Toggle --- */
function initPasswordToggle() {
  const toggleBtn = document.getElementById('togglePasswordBtn');
  const passwordInput = document.getElementById('adminPassword');
  if (!toggleBtn || !passwordInput) return;

  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.innerHTML = isPassword ? `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    ` : `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  });
}

/* --- Phase 1: Submit Credentials & Request OTP --- */
function initLoginCredentialsForm() {
  const form = document.getElementById('loginCredentialsForm');
  const emailInput = document.getElementById('adminEmail');
  const passwordInput = document.getElementById('adminPassword');
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const btnText = document.getElementById('sendOtpBtnText');
  const spinner = document.getElementById('sendOtpSpinner');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAlert('danger', 'Please provide both admin email and password.');
      return;
    }

    // Set Loading State
    sendOtpBtn.disabled = true;
    btnText.textContent = 'Verifying & Sending OTP...';
    spinner.style.display = 'inline-block';

    try {
      const response = await fetch(`${API_BASE}/api/auth/login-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        currentAdminEmail = email;

        // Transition to Phase 2 (OTP input)
        form.style.display = 'none';
        const otpForm = document.getElementById('loginOtpForm');
        otpForm.style.display = 'block';

        document.getElementById('formHeaderTitle').textContent = 'Enter Verification Passcode';
        document.getElementById('formHeaderSubtitle').textContent = 'A secure 6-digit OTP code has been generated and sent to your email.';
        document.getElementById('targetEmailLabel').textContent = email;

        // If testOtp is available (or in local dev), show the preview banner for instant access
        if (result.testOtp) {
          const testBanner = document.getElementById('testOtpBanner');
          const testCodeEl = document.getElementById('testOtpCode');
          testCodeEl.textContent = result.testOtp;
          testBanner.style.display = 'flex';
        }

        showAlert('success', result.message || 'OTP sent successfully!');
        startOtpCountdown();

        // Focus first OTP input
        const firstOtpBox = document.getElementById('otp-1');
        if (firstOtpBox) firstOtpBox.focus();

      } else {
        showAlert('danger', result.message || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err) {
      console.error('Login request failed:', err);
      showAlert('danger', 'Connection error. Please make sure the Rajesh Framing server is running on port 5000.');
    } finally {
      sendOtpBtn.disabled = false;
      btnText.textContent = 'Send Login OTP';
      spinner.style.display = 'none';
    }
  });
}

/* --- Phase 2: OTP Verification & Auto-Focus Controls --- */
function initOtpVerificationForm() {
  const otpForm = document.getElementById('loginOtpForm');
  const verifyBtn = document.getElementById('verifyOtpBtn');
  const btnText = document.getElementById('verifyOtpBtnText');
  const spinner = document.getElementById('verifyOtpSpinner');
  const resendBtn = document.getElementById('resendOtpBtn');
  const backBtn = document.getElementById('backToCredentialsBtn');
  const boxes = [
    document.getElementById('otp-1'),
    document.getElementById('otp-2'),
    document.getElementById('otp-3'),
    document.getElementById('otp-4'),
    document.getElementById('otp-5'),
    document.getElementById('otp-6')
  ];

  // Auto-advance & Backspace Navigation
  boxes.forEach((box, index) => {
    if (!box) return;

    box.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length >= 1) {
        box.value = val.slice(-1); // Only keep the single last digit
        if (index < boxes.length - 1) {
          boxes[index + 1].focus();
        }
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) {
        boxes[index - 1].focus();
      }
    });

    // Paste handler (e.g. user copies '123456' from email or test banner)
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
      const digits = pasteData.replace(/\D/g, '').slice(0, 6);
      digits.split('').forEach((d, i) => {
        if (boxes[i]) boxes[i].value = d;
      });
      if (digits.length > 0 && boxes[Math.min(digits.length, 5)]) {
        boxes[Math.min(digits.length, 5)].focus();
      }
    });
  });

  // Verify OTP Submission
  if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const otp = boxes.map(b => b.value).join('');

      if (otp.length !== 6) {
        showAlert('danger', 'Please enter all 6 digits of your authentication passcode.');
        return;
      }

      verifyBtn.disabled = true;
      btnText.textContent = 'Verifying Passcode...';
      spinner.style.display = 'inline-block';

      try {
        const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentAdminEmail,
            otp: otp
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert('success', 'Passcode verified! Redirecting to Dashboard...');
          
          // Save session token in localStorage
          localStorage.setItem('rf_admin_token', result.token);
          localStorage.setItem('rf_admin_user', JSON.stringify(result.admin));

          setTimeout(() => {
            window.location.href = 'admin.html';
          }, 800);

        } else {
          showAlert('danger', result.message || 'Incorrect or expired OTP.');
          // Clear boxes on error
          boxes.forEach(b => b.value = '');
          if (boxes[0]) boxes[0].focus();
        }
      } catch (err) {
        console.error('Verification error:', err);
        showAlert('danger', 'Could not reach server to verify passcode.');
      } finally {
        verifyBtn.disabled = false;
        btnText.textContent = 'Verify & Enter Dashboard';
        spinner.style.display = 'none';
      }
    });
  }

  // Resend OTP Button
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      if (resendBtn.disabled) return;
      hideAlert();
      resendBtn.disabled = true;
      resendBtn.textContent = 'Resending...';

      try {
        const response = await fetch(`${API_BASE}/api/auth/resend-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentAdminEmail })
        });

        const result = await response.json();
        if (response.ok && result.success) {
          showAlert('success', result.message || 'New OTP sent to your email.');
          if (result.testOtp) {
            document.getElementById('testOtpCode').textContent = result.testOtp;
          }
          startOtpCountdown();
        } else {
          showAlert('danger', result.message || 'Could not resend OTP.');
          resendBtn.disabled = false;
          resendBtn.textContent = 'Resend Code';
        }
      } catch (err) {
        showAlert('danger', 'Network error resending OTP.');
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      }
    });
  }

  // Back to Credentials Button
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      clearInterval(otpCountdownTimer);
      otpForm.style.display = 'none';
      document.getElementById('loginCredentialsForm').style.display = 'block';
      document.getElementById('testOtpBanner').style.display = 'none';
      document.getElementById('formHeaderTitle').textContent = 'Admin Login';
      document.getElementById('formHeaderSubtitle').textContent = 'Enter your authorized credentials to receive an authentication OTP on your email.';
      hideAlert();
    });
  }
}

/* --- Countdown Timer for OTP Expiration --- */
function startOtpCountdown() {
  clearInterval(otpCountdownTimer);
  countdownSeconds = 60;
  const timerText = document.getElementById('otpTimerText');
  const resendBtn = document.getElementById('resendOtpBtn');

  if (resendBtn) resendBtn.disabled = true;
  if (timerText) timerText.textContent = `${countdownSeconds}s`;

  otpCountdownTimer = setInterval(() => {
    countdownSeconds -= 1;
    if (timerText) timerText.textContent = `${countdownSeconds}s`;

    if (countdownSeconds <= 0) {
      clearInterval(otpCountdownTimer);
      if (timerText) timerText.textContent = 'Expired';
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      }
    }
  }, 1000);
}

/* --- Alert Notification Helper --- */
function showAlert(type, message) {
  const alertEl = document.getElementById('loginAlert');
  const msgEl = document.getElementById('alertMessage');
  const iconEl = document.getElementById('alertIcon');

  if (!alertEl || !msgEl) return;

  alertEl.className = `login-alert ${type} show`;
  msgEl.textContent = message;

  if (type === 'danger') {
    iconEl.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: #EF4444; flex-shrink: 0;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
  } else if (type === 'success') {
    iconEl.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: #10B981; flex-shrink: 0;">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `;
  } else {
    iconEl.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: #C99A3D; flex-shrink: 0;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;
  }
}

function hideAlert() {
  const alertEl = document.getElementById('loginAlert');
  if (alertEl) alertEl.className = 'login-alert';
}
