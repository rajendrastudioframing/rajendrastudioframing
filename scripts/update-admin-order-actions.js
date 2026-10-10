const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '..', 'js', 'admin.js'),
  path.join(__dirname, '..', 'public', 'js', 'admin.js')
];

const targetPattern = /<div class="order-action-buttons">[\s\S]*?<\/div>[\r\n\s]*<\/div>[\r\n\s]*<\/div>[\r\n\s]*`;/;

const replacementHtml = `<div class="order-action-buttons">
          <button type="button" 
                  class="btn-card-action accept \${isAccepted ? 'active-state' : ''}" 
                  onclick="acceptOrderQuick('\${order.id}')" 
                  title="Accept order and move to production">
            \${isAccepted ? '✓ Order Accepted' : '✓ Accept Order'}
          </button>
          
          <button type="button" 
                  class="btn-card-action pickup-ready \${isPickupReady ? 'active-state' : ''}" 
                  onclick="markPickupReadyQuick('\${order.id}')" 
                  title="Mark order ready for collection and notify customer">
            \${isPickupReady ? '🛍️ Pick Up Ready ✓' : '🛍️ Pick Up Ready'}
          </button>
        </div>
      </div>
    </div>
  \`;`;

const pickupReadyFunction = `
/* ==========================================================================
   MARK PICK UP READY (QUICK ACTION WITH EMAIL NOTIFICATION)
   ========================================================================== */
window.markPickupReadyQuick = async (id) => {
  const cleanId = (id || '').replace(/^#/, '');
  const item = allInquiries.find(i => i.id === cleanId || i.id === id);
  if (!item) return;

  try {
    showToast('Updating Order', \`Marking Order #\${cleanId} as Ready for Pick Up...\`, 'info');
    const res = await fetch(\`\${API_BASE}/api/admin/inquiries/\${encodeURIComponent(cleanId)}/status\`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify({
        status: 'Shipped',
        notes: 'Your order is ready! Please pick up your custom frame from Rajesh Framing Studio, Dahej.',
        notifyCustomer: true
      })
    });

    const data = await res.json();
    if (data.success) {
      if (item) item.status = 'Shipped';
      await loadInquiries();
      await loadDashboardStats();
      const emailNotice = data.emailResult && data.emailResult.sent ? \` Notification sent to \${data.emailResult.recipient}!\` : '';
      showToast('Pick Up Ready! 🛍️', \`Order #\${cleanId} is now Ready for Pick Up.\${emailNotice}\`, 'success');
    } else {
      showToast('Action Failed', data.message || 'Could not update order status.', 'danger');
    }
  } catch (err) {
    console.error('Error marking order as ready for pickup:', err);
    showToast('Network Error', 'Failed to connect to server.', 'danger');
  }
};
`;

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('Skipping non-existent:', file);
    continue;
  }

  let content = fs.readFileSync(file, 'utf8');

  // Check if target pattern matches
  if (targetPattern.test(content)) {
    content = content.replace(targetPattern, replacementHtml);
    console.log('Replaced order action buttons in:', file);
  } else {
    console.log('Target pattern not found in:', file);
  }

  // Ensure isAccepted and isPickupReady exist in file
  if (!content.includes('const isAccepted =')) {
    const statusLine = "const deliveryClass = order.status.toLowerCase().replace(/\\s+/g, '-');";
    const statusVars = `const isAccepted = order.status === 'Confirmed' || order.status === 'Accepted' || order.status === 'In Progress';
  const isPickupReady = order.status === 'Shipped' || order.status === 'Dispatched' || order.status === 'Completed' || order.status === 'Pickup Ready';

  let displayStatus = order.status || 'New';
  if (isAccepted) {
    displayStatus = 'Accepted';
  } else if (isPickupReady) {
    displayStatus = 'Pick Up Ready';
  } else if (order.status === 'New' || order.status === 'Pending') {
    displayStatus = 'New Order';
  }

  ${statusLine}`;

    if (content.includes(statusLine)) {
      content = content.replace(statusLine, statusVars);
      console.log('Added isAccepted and displayStatus in:', file);
    }
  }

  // Ensure Column 8 uses displayStatus
  if (content.includes('${order.status}\n          </span>\n          <span class="sub-meta-text">${trackingText}</span>')) {
    content = content.replace(
      '${order.status}\n          </span>\n          <span class="sub-meta-text">${trackingText}</span>',
      '${displayStatus}\n          </span>\n          <span class="sub-meta-text">${trackingText}</span>'
    );
  } else if (content.includes('${order.status}\r\n          </span>\r\n          <span class="sub-meta-text">${trackingText}</span>')) {
    content = content.replace(
      '${order.status}\r\n          </span>\r\n          <span class="sub-meta-text">${trackingText}</span>',
      '${displayStatus}\r\n          </span>\r\n          <span class="sub-meta-text">${trackingText}</span>'
    );
  }

  // Add markPickupReadyQuick if not already present
  if (!content.includes('window.markPickupReadyQuick =')) {
    const afterAccept = 'window.acceptOrderQuick = async (id) => {';
    // Find the end of acceptOrderQuick
    const acceptEndPattern = /(window\.acceptOrderQuick = async \([\s\S]*?\n\};)/;
    if (acceptEndPattern.test(content)) {
      content = content.replace(acceptEndPattern, `$1\n${pickupReadyFunction}`);
      console.log('Appended markPickupReadyQuick in:', file);
    }
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully written:', file);
}
