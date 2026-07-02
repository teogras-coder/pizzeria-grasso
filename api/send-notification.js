export default async function handler(req, res) {
  // Permetti solo richieste POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { title, body, destinatari } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Titolo e messaggio sono obbligatori' });
  }

  // OneSignal credentials
  const ONE_SIGNAL_APP_ID = '00485893-99f7-4757-aa76-df88e8b67766';
  const ONE_SIGNAL_API_KEY = 'os_v2_app_abefre4z65dvpktw36eorntxmz6ilo57rd7eqiv6kbuefuz63oikkexpl5qkzkou6p6glksoo2cidezuekek6a3e4eyrmlk6ngbaa5y';

  try {
    // Chiama OneSignal API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONE_SIGNAL_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONE_SIGNAL_APP_ID,
        included_segments: ['All'],
        headings: { it: title },
        contents: { it: body },
        url: 'https://pizzeriagrasso.vercel.app/',
        small_icon: 'https://i.imgur.com/nWLqs68.png',
        large_icon: 'https://i.imgur.com/nWLqs68.png'
      })
    });

    const result = await response.json();

    if (response.ok) {
      res.status(200).json({ 
        success: true, 
        message: 'Notifica inviata con successo!',
        notificationId: result.id
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.errors ? result.errors[0] : 'Errore sconosciuto'
      });
    }
  } catch (error) {
    console.error('Errore invio notifica:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
