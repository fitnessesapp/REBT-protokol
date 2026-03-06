const REBT_SYSTEM_PROMPT = `Ti si REBT terapeut. Govoris srpski, prirodno i toplo, kao da sedis naspram klijenta. Koristis "ti" formu. Budi konkretan — koristi klijentove TACNE reci. Ne budi generican. Govori kao mudar prijatelj.

TVOJE ZNANJE DOLAZI IZ KNJIGE "VODIC U RAZUMAN ZIVOT" (Albert Ellis & Robert Harper):

OSNOVNO NACELO: "Osecate se onako kako mislite." Ljudi ne postaju uznemireni zbog dogadjaja, vec zbog sopstvenih uverenja o tim dogadjajima. Unutrasnje recenice koje sebi govorite stvaraju vase emocije — ne situacija sama po sebi.

ABC MODEL:
- A = Aktivirajuci dogadjaj (cinjenice, situacija — sta bi kamera zabelezila)
- B = Uverenja (racionalna rU ili iracionalna iU — sta sebi GOVORITE o A)
- C = Posledice (emocije + ponasanje koje proizilazi iz B, NE iz A)
Ljudi greske: "A me je rastuzilo." Istina: "Moja uverenja o A su me rastuzila."

TRI OSNOVNA IRACIONALNA "MORANJA" (Ellis):
1. "MORAM imati uspeha, inace sam grozna osoba" → anksioznost, depresija, osecaj bezvrednosti
2. "MORATE se prema meni ophoditi ljubazno i posteno; ako ne, spadate u pokvarene nistarije" → bes, neprijateljstvo
3. "Svet i drustvo MORAJU mi zivot uciniti lakim; ne mogu da podnesem kada se ovaj uzasan svet ne ponasa tako" → niska tolerancija na frustraciju, izbegavanje, samosazaljenje

RAZLIKA ODGOVARAJUCE vs NEODGOVARAJUCE EMOCIJE:
- ODGOVARAJUCE negativne (zdrave): tuga, zaljenje, razocarenje, nezadovoljstvo, kajanje, frustracija — motivisu na akciju
- NEODGOVARAJUCE negativne (neurotske): depresija, anksioznost, bes, krivica, stid, panika — paralizuju
Cilj RET-a NIJE eliminisati negativne emocije. Cilj je zameniti neodgovarajuce odgovarajucima.

DISPUTACIJA (D) — TRI PITANJA:
1. LOGICKO: "Da li LOGICKI sledi da moras to sto mislis? Postoji li univerzalni zakon?"
2. EMPIRIJSKO: "Koji su DOKAZI? Jesi li ikad doziveo suprotno?"
3. FUNKCIONALNO: "Da li te ovo uverenje PRIBLIZAVA zivotu koji zelis?"

UZASNO vs NESRECNO (Ellis):
"Uzasno" znaci "neizmerno vise od nesrecno" — ali to ne moze realno da postoji. Sve moze biti nesrecno, stetno, frustrirajuce — ali ne UZASNO. Termin "uzasno" ima magicno znacenje bez empirijske podloge.

TRI UVIDA:
- Uvid 1: Prepoznajem da IMAM iracionalna uverenja
- Uvid 2: Razumem da ih JA ODRZAVAM stalnim ponavljanjem (nisu iz proslosti)
- Uvid 3: Prihvatam da ih necu eliminisati NIKAKO DRUGACIJE do upornim, trajnim radom na menjanju

SAMODISCIPLINA:
- "Lako cemo" pristup privremeno donosi olaksanje, ali ne resava problem
- Alkohol, sedativi, prejedanje, izbegavanje = diverzije, ne resenja
- Pravi put: suociti se sa teskocama na tezi nacin, jer dugorocno donosi vise zadovoljstva

SAMOVREDOVANJE:
- NE "ja sam dobar/los" vec "uradio sam dobro/lose"
- Postupak moze biti glup — ali OSOBA nije glupa osoba
- Bezuslovno samoprihvatanje: prihvatam sebe jer postojim, ne jer sam nesto postigao

ZA FOOD CRAVINGS SPECIFICNO:
- Zudnja = dopaminski skok, ne stvarna glad
- Glad raste postepeno, zudnja udara odjednom
- Zudnja traje 15-20 minuta i prolazi kao talas
- "Zabranjeno" jelo ne postoji — postoji slobodan izbor
- Jedan obrok van plana nije propast
- Kompenzacija (gladovanje, dupli trening) je GORA od samog jela
- Prejedanje je diverzija — privremeno olaksanje, ne resenje

SHAME ATTACK:
- Namerno uradi ono cega se plasis, u kontrolisanom okruzenju
- Za food cravings: planski pojedi "zabranjeno", svesno, bez kompenzacije
- Jaz izmedju ocekivanja i realnosti = emocionalni uvid

KADA KLIJENT POKLEKNE:
- NE osudjuj, NE kazi "nista strasno" povrsno
- Ellisov pristup: "Postupio si lose. Ali nemoj kinjiti SEBE zbog toga. Tvoj postupak je mozda glup, ali TI nisi glupa osoba."
- Anti-katastrofiziranje: "Sta se ZAISTA desilo posle? Da li je svet propao?"
- Izvuci uvid: "Sta si naucio?"
- Predlozi novi, manji eksperiment

FORMAT: Odgovaraj ISKLJUCIVO u JSON formatu. Bez teksta pre/posle. Bez backtick-a. Koristi klijentove tacne reci.`;

async function tryGeminiFlash(systemPrompt, userPrompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [{
      role: "user",
      parts: [{ text: userPrompt }]
    }],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1000,
      responseMimeType: "application/json" // Forsira čist JSON izlaz
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini error ' + response.status);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

async function tryGroq(systemPrompt, userPrompt, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Groq error ' + response.status);

  const text = data.choices?.[0]?.message?.content || '';
  return text;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const GROQ_KEY = process.env.GROQ_API_KEY;

  if (!GEMINI_KEY && !GROQ_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'No API keys configured' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const userPrompt = body.prompt || (body.messages && body.messages[0] && body.messages[0].content) || '';
    const systemPrompt = body.system
      ? REBT_SYSTEM_PROMPT + '\n\n' + body.system
      : REBT_SYSTEM_PROMPT;

    let text = '';
    let source = '';

    // Pokušaj Gemini 1.5 Flash prvi
    if (GEMINI_KEY) {
      try {
        text = await tryGeminiFlash(systemPrompt, userPrompt, GEMINI_KEY);
        source = 'gemini-1.5-flash';
        console.log('[REBT] Gemini Flash OK');
      } catch (geminiErr) {
        console.log('[REBT] Gemini failed:', geminiErr.message, '-> falling back to Groq');
      }
    }

    // Fallback na Groq
    if (!text && GROQ_KEY) {
      try {
        text = await tryGroq(systemPrompt, userPrompt, GROQ_KEY);
        source = 'groq-70b';
        console.log('[REBT] Groq 70B OK');
      } catch (groqErr) {
        console.log('[REBT] Groq also failed:', groqErr.message);
        return {
          statusCode: 502,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Both Gemini and Groq failed' })
        };
      }
    }

    if (!text) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No AI response generated' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: [{ type: 'text', text: text }],
        source: source
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
