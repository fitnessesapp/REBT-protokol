exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'No TTS API key' }) };
  }

  try {
    const { text } = JSON.parse(event.body);
    if (!text || !text.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No text' }) };
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            text: text.trim(),
            prompt: 'Calm, warm male psychotherapist. Slow and reassuring.'
          },
          voice: {
            languageCode: 'sr-rs',
            name: 'Charon',
            modelName: 'gemini-2.5-pro-tts'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.95,
            pitch: 0
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.audioContent) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: data.error?.message || 'TTS failed', googleStatus: response.status, googleResponse: JSON.stringify(data).substring(0, 500) })
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
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
