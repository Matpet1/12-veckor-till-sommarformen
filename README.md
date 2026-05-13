# 12 veckor till sommaren

Mobil-först webbapp för ett 12-veckors hälsoprogram med två profiler.
Byggd med Vite + React + Tailwind. All data sparas i webbläsarens localStorage.

---

## Snabbstart lokalt

Kräver Node.js 18+ ([nodejs.org](https://nodejs.org)).

```bash
npm install
npm run dev
```

Öppna `http://localhost:5173` (eller IP:n som visas i terminalen — då kan du testa direkt på mobilen om den är på samma WiFi).

## Bygg för produktion

```bash
npm run build
npm run preview
```

Färdiga filer hamnar i `dist/`.

---

## Publicera så det funkar på mobilen

### Alternativ A: Vercel (enklast, gratis)

1. Skapa ett gratis konto på [vercel.com](https://vercel.com) (logga gärna in med GitHub).
2. Ladda upp projektmappen till ett nytt GitHub-repo, **eller** dra in zip-filen direkt på Vercel-dashboarden.
3. Vercel hittar Vite automatiskt — klicka **Deploy**.
4. Efter ~1 minut har du en URL som `12-veckor-till-sommaren.vercel.app`.

### Alternativ B: Netlify

1. Konto på [netlify.com](https://netlify.com).
2. Dra och släpp **hela projektmappen** (inte zip) på Netlify-dashboardens "Sites"-yta — eller koppla till GitHub.
3. `netlify.toml` är redan med, så den vet hur den ska bygga.

### Alternativ C: StackBlitz (utan terminal, utan konto)

1. Gå till [stackblitz.com](https://stackblitz.com), klicka "New" → "Vite" → "React".
2. Klistra in filerna från `src/`, `public/`, plus `package.json`, `index.html`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`.
3. StackBlitz installerar dependencies automatiskt och ger dig en URL.

---

## Installera på mobilen som app

När du har en URL (från något av alternativen ovan):

**iPhone (Safari):**
1. Öppna URL:en i Safari.
2. Tryck på dela-ikonen → **"Lägg till på hemskärmen"**.
3. Appen får egen ikon, öppnas i fullskärm utan webbläsarens UI.

**Android (Chrome):**
1. Öppna URL:en i Chrome.
2. Meny → **"Lägg till på hemskärmen"** eller "Installera app".

---

## Två personer, samma app

Båda profilerna ("Jag" och "Kompis") ligger i samma localStorage. Det betyder att om ni vill ha **varsin** mobil med varsin data behöver ni göra något av följande:

- **Enklast:** Ni installerar samma URL på varsin mobil och fyller i varsin profil som "Jag" — då har ni varsin separat data, och kan lägga in den andres veckosiffror manuellt under "Kompis" för jämförelsen.
- **Mer avancerat:** Bygg ut med en backend (Firebase, Supabase) så data synkar. Säg till om du vill ha hjälp med det.

---

## Filstruktur

```
.
├── index.html              # Med PWA-meta + font-laddning
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json             # SPA-rewrites för Vercel
├── netlify.toml            # Build-config för Netlify
├── public/
│   ├── manifest.webmanifest  # PWA-manifest
│   ├── icon.svg
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.jsx            # React entry
    ├── App.jsx             # Hela appen
    └── index.css           # Tailwind + safe-area
```

---

## Byta namn på profilerna

Gå till **Duell**-vyn och **dubbelklicka** på en av namnknapparna ("Jag" / "Kompis"). Det öppnar en prompt där du kan skriva in det riktiga namnet.

## Nollställa all data

Öppna webbläsarens devtools → Application → Local Storage → ta bort nyckeln `12v_sommar_v1`. Eller, om du installerat som PWA: avinstallera och installera om.
