// SafeHer OS — SOS SMS Alert Serverless Function
// Sends real SMS to emergency contacts via Fast2SMS (India) or Twilio (global)

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userName, userPhone, contacts, location, timestamp } = req.body;

    if (!contacts || !contacts.length) {
      return res.status(400).json({ error: 'No contacts provided' });
    }

    const lat = location?.lat || 26.8467;
    const lng = location?.lng || 80.9462;
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    const timeStr = timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const message = `🚨 EMERGENCY - SafeHer SOS triggered by ${userName || 'User'}!\n📍 Location: ${mapsLink}\n🕐 Time: ${timeStr}\n📞 User Phone: ${userPhone || 'N/A'}\n⚠️ Please respond immediately! This is an automated safety alert.`;

    const results = [];

    // Try Fast2SMS first (India), then Twilio fallback
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    for (const contact of contacts) {
      const phone = contact.phone?.replace(/\D/g, '');
      if (!phone || phone.length < 10) {
        results.push({ phone: contact.phone, status: 'skipped', reason: 'Invalid number' });
        continue;
      }

      let sent = false;

      // ── Fast2SMS (India) ──
      if (fast2smsKey && !sent) {
        try {
          // Use only last 10 digits for Indian numbers
          const indianNumber = phone.slice(-10);
          const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              'Authorization': fast2smsKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              route: 'q',
              message: message,
              language: 'english',
              flash: 0,
              numbers: indianNumber
            })
          });
          const data = await response.json();
          if (data.return === true) {
            results.push({ phone: contact.phone, name: contact.name, status: 'sent', provider: 'fast2sms' });
            sent = true;
          } else {
            console.error('[Fast2SMS] Failed:', data);
          }
        } catch (e) {
          console.error('[Fast2SMS] Error:', e.message);
        }
      }

      // ── Twilio Fallback ──
      if (twilioSid && twilioToken && twilioPhone && !sent) {
        try {
          const toNumber = phone.startsWith('91') ? `+${phone}` : `+91${phone}`;
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const authHeader = 'Basic ' + btoa(`${twilioSid}:${twilioToken}`);
          
          const params = new URLSearchParams();
          params.append('To', toNumber);
          params.append('From', twilioPhone);
          params.append('Body', message);

          const response = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          });
          const data = await response.json();
          if (data.sid) {
            results.push({ phone: contact.phone, name: contact.name, status: 'sent', provider: 'twilio' });
            sent = true;
          } else {
            console.error('[Twilio] Failed:', data);
          }
        } catch (e) {
          console.error('[Twilio] Error:', e.message);
        }
      }

      if (!sent) {
        results.push({ phone: contact.phone, name: contact.name, status: 'failed', reason: 'No SMS provider configured or all failed' });
      }
    }

    // ── Attempt WhatsApp if configured ──
    const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const waToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    if (waPhoneId && waToken) {
      for (const contact of contacts) {
        const phone = contact.phone?.replace(/\D/g, '');
        if (!phone || phone.length < 10) continue;
        try {
          const waNumber = phone.startsWith('91') ? phone : `91${phone}`;
          const waResponse = await fetch(
            `https://graph.facebook.com/v18.0/${waPhoneId}/messages`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${waToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: waNumber,
                type: 'text',
                text: { body: message }
              })
            }
          );
          const waData = await waResponse.json();
          if (waData.messages) {
            results.push({ phone: contact.phone, name: contact.name, status: 'whatsapp_sent', provider: 'whatsapp' });
          }
        } catch (e) {
          console.error('[WhatsApp] Error:', e.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      sent: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[SOS API] Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
