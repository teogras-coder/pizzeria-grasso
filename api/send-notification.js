export default async function handler(req, res) {
  console.log('=== API CALLED ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Titolo e messaggio sono obbligatori' });
  }

  const ONE_SIGNAL_APP_ID = '00485893-99f7-4757-aa76-df88e8b67766';
  const ONE_SIGNAL_API_KEY = 'os_v2_app_abefre4z65dvpktw36eorntxmy7yj3po3kzutte2agidatboa3m27ztq7ztu4mpq3uacxyowf2xcyk65lu6wjhdrogpx4tcsmnhvlcy';

  console.log('App ID:', ONE_SIGNAL_APP_ID);
  console.log('API Key (first 20 chars):', ONE_SIGNAL_API_KEY.substring(0, 20) + '...');

  const payload = {
    app_id: ONE_SIGNAL_APP_ID,
    included_segments: ['All'],
    headings: { it: title },
    contents: { it: body },
    url: 'https://pizzeriagrasso.vercel.app/'
  };

  console.log('Payload to OneSignal:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONE_SIGNAL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log('OneSignal Status:', response.status);
    console.log('OneSignal Headers:', Object.fromEntries(response.headers));
    
    const result = await response.json();
    console.log('OneSignal Response:', result);

    if (response.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'Notifica inviata!',
        id: result.id
      });
    } else {
      return res.status(response.status).json({ 
        success: false, 
        error: result.errors ? result.errors[0] : JSON.stringify(result),
        details: result
      });
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
