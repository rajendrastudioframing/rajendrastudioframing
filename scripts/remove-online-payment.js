const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('--- Step 1: Updating checkout.html and public/checkout.html ---');

const paymentHtmlMarkup = `            <!-- Payment Method: Pick up from shop -->
            <div style="margin-top: 24px;">
              <h3 class="payment-section-title" style="display: flex; align-items: center; gap: 8px; font-size: 1.125rem; font-weight: 700; color: #111111; margin-bottom: 12px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-gold);">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Payment Method
              </h3>

              <div class="payment-methods-grid">
                <!-- Single Option: Pick up from shop -->
                <div class="payment-option-card active" id="payOptionPickup" data-method="pickup" style="border: 2px solid var(--accent-gold); background: #FCFAF6; padding: 20px; border-radius: 14px; box-shadow: 0 2px 8px rgba(201, 154, 61, 0.08);">
                  <div class="payment-option-header" style="display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
                    <div class="payment-option-left" style="display: flex; align-items: flex-start; gap: 14px;">
                      <div class="payment-radio-circle" style="border-color: var(--accent-gold); background: var(--accent-gold); width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: 2px; flex-shrink: 0;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div>
                        <div class="payment-option-name" style="font-size: 1.0625rem; font-weight: 800; color: #111111; letter-spacing: -0.2px;">
                          Pick up from shop
                        </div>
                        <p style="font-size: 0.875rem; color: #4B5563; margin: 6px 0 0; line-height: 1.5; max-width: 500px;">
                          Pay directly at our shop / studio when you pick up your order. Inspect your custom frames and prints in person before making payment.
                        </p>
                        <div style="margin-top: 10px; display: inline-flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: #926A18; font-weight: 600; background: rgba(201, 154, 61, 0.1); padding: 5px 12px; border-radius: 6px;">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          <span>Studio Address: Dahej GIDC, Bharuch, Gujarat</span>
                        </div>
                      </div>
                    </div>
                    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(201, 154, 61, 0.14); color: #926A18; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; white-space: nowrap;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Pay on Collection</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>`;

function updateCheckoutHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace from `<!-- Payment Method & Dynamic UPI QR Section -->` up to `<!-- Submit Button`
  const paymentSectionRegex = /<!-- Payment Method & Dynamic UPI QR Section -->[\s\S]*?(?=<!-- Submit Button)/i;

  if (paymentSectionRegex.test(content)) {
    content = content.replace(paymentSectionRegex, paymentHtmlMarkup + '\n\n            ');
  } else {
    // If comment was already modified, check by payment-methods-grid
    const gridRegex = /<div style="margin-top:\s*2[04]px;">\s*<h3 class="payment-section-title">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i;
    if (gridRegex.test(content)) {
      content = content.replace(gridRegex, paymentHtmlMarkup);
    }
  }

  // Update default in success modal
  content = content.replace(
    /<span id="successPaymentMethod"[^>]*>Instant UPI Payment<\/span>/g,
    '<span id="successPaymentMethod" style="font-weight: 600; color: #111111;">Pick up from shop</span>'
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated', filePath);
}

updateCheckoutHtml(path.join(rootDir, 'checkout.html'));
updateCheckoutHtml(path.join(rootDir, 'public', 'checkout.html'));

console.log('--- Step 2: Updating js/checkout.js and public/js/checkout.js ---');
function updateCheckoutJs(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace selectedPaymentMethod default
  content = content.replace(/let selectedPaymentMethod = 'upi';/, "let selectedPaymentMethod = 'pickup';");

  // Replace setupUpiPayment function body with clean safe default
  const upiFnRegex = /\/\*\*[\s\S]*?\* Configure and render dynamic UPI QR code[\s\S]*?function setupUpiPayment\(amount\) \{[\s\S]*?\n\}/;
  const newUpiFn = `/**
 * Configure payment handlers (Single Option: Pick up from shop)
 */
function setupUpiPayment(amount) {
  selectedPaymentMethod = 'pickup';
}`;

  if (upiFnRegex.test(content)) {
    content = content.replace(upiFnRegex, newUpiFn);
  }

  // Replace paymentLabel calculation in submitOrder
  content = content.replace(
    /const paymentLabel = selectedPaymentMethod === 'upi' \? 'Instant UPI Payment \(QR Code\)' : 'Pay on Delivery \/ Studio Pickup';/,
    "const paymentLabel = 'Pick up from shop';"
  );

  // Replace success payment label
  content = content.replace(
    /successPayEl\.textContent = paymentLabel;/,
    "successPayEl.textContent = 'Pick up from shop';"
  );

  // Clean WhatsApp message
  content = content.replace(
    /`• Payment Method: \$\{paymentLabel\}\\n` \+\s*\(utr \? `• UPI Ref \/ UTR: \$\{utr\}\\n` : ''\) \+/,
    "`• Payment Method: Pick up from shop (Pay on Collection)\\n` +"
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated', filePath);
}

updateCheckoutJs(path.join(rootDir, 'js', 'checkout.js'));
updateCheckoutJs(path.join(rootDir, 'public', 'js', 'checkout.js'));

console.log('--- Step 3: Updating server.js ---');
const serverPath = path.join(rootDir, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf-8');

serverContent = serverContent.replace(
  /paymentMethod: req\.body\.paymentMethod \|\| 'Instant UPI Payment \(QR Code\)',/g,
  "paymentMethod: req.body.paymentMethod || 'Pick up from shop',"
);

serverContent = serverContent.replace(
  /const paymentMethod = orderOrInquiry\.paymentMethod \|\| 'Pay on Delivery \/ Studio Pickup';/g,
  "const paymentMethod = orderOrInquiry.paymentMethod || 'Pick up from shop';"
);

serverContent = serverContent.replace(
  /const paymentMethod = \(foundOrder && foundOrder\.paymentMethod\) \|\| 'Pay on Delivery \/ Studio Pickup';/g,
  "const paymentMethod = (foundOrder && foundOrder.paymentMethod) || 'Pick up from shop';"
);

fs.writeFileSync(serverPath, serverContent, 'utf-8');
console.log('Updated server.js');

console.log('--- Done! Payment method is now exclusively: Pick up from shop ---');
