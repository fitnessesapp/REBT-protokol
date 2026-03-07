exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GOOGLE_TTS_KEY = process.env.GOOGLE_TTS_API_KEY;
  if (!GOOGLE_TTS_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'No TTS API key' }) };
  }

  try {
    const { text } = JSON.parse(event.body);
    if (!text || !text.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No text' }) };
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: text.trim() },
          voice: {
            languageCode: 'sr-RS',
            name: 'sr-RS-Standard-A',  // jedini dostupan srpski glas
            ssmlGender: 'FEMALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.92,
            pitch: 0
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.audioContent) {
      console.error('[TTS] Google error:', JSON.stringify(data));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: data.error?.message || 'TTS failed' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600'
      },
      body: data.audioContent,
      isBase64Encoded: true
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
