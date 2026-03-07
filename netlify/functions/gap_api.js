exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'No API key' }) };
  }

  try {
    const { b, expect, actual } = JSON.parse(event.body);

    const prompt = `Klijent je imao uverenje: "${b}"

Eksperiment koji je uradio: trebalo je da uradi nešto čega se bojao ili što je izbegavao.

Pre eksperimenta je očekivao: "${expect}"

Šta se zaista desilo: "${actual}"

Napiši KRATKU personalizovanu analizu (2-3 rečenice) koja:
1. Pominje klijentove tačne reči iz uverenja i situacije
2. Objašnjava šta jaz između očekivanja i realnosti govori o tom uverenju (ili — ako se katastrofa zaista desila — šta to znači: "Desilo se, ali ste preživeli")
3. Završava ohrabrujuće, kao topla terapeutkinja

Govori direktno klijentu, koristiš "Vi" formu (persiranje — "Vi", "Vaše", "ste", nikad "ti", "tvoje"). Srpski jezik. BEZ uvodnih fraza poput "Evo analize" ili "Odlično". Samo direktan komentar.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      return { statusCode: 502, body: JSON.stringify({ error: 'No response' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis: text })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
