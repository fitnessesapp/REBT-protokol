function pcmToWav(pcmBuffer) {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);           // chunk size
  header.writeUInt16LE(1, 20);            // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'No API key' }) };
  }

  try {
    const { text } = JSON.parse(event.body);
    if (!text || !text.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No text' }) };
    }

    const prompt = 'Calm, warm female psychotherapist. Slow and reassuring. ' + text.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-tts:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Aoede' }
              }
            }
          }
        })
      }
    );

    const data = await response.json();
    const audioBase64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'unknown';

    if (!response.ok || !audioBase64) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: data.error?.message || 'TTS failed', detail: JSON.stringify(data).substring(0, 300) })
      };
    }

    // Check actual format from mimeType
    if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
      // Already MP3 — send directly
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'X-Audio-Mime': mimeType },
        body: audioBase64,
        isBase64Encoded: true
      };
    }

    // PCM or unknown — wrap in WAV
    const pcmBuffer = Buffer.from(audioBase64, 'base64');
    const wavBuffer = pcmToWav(pcmBuffer);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store', 'X-Audio-Mime': mimeType },
      body: wavBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
