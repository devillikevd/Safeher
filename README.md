<![CDATA[<div align="center">

```
███████╗ █████╗ ███████╗███████╗██╗  ██╗███████╗██████╗      ██████╗ ███████╗
██╔════╝██╔══██╗██╔════╝██╔════╝██║  ██║██╔════╝██╔══██╗    ██╔═══██╗██╔════╝
███████╗███████║█████╗  █████╗  ███████║█████╗  ██████╔╝    ██║   ██║███████╗
╚════██║██╔══██║██╔══╝  ██╔══╝  ██╔══██║██╔══╝  ██╔══██╗    ██║   ██║╚════██║
███████║██║  ██║██║     ███████╗██║  ██║███████╗██║  ██║    ╚██████╔╝███████║
╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝
```

### ⚔️ CYBER-EMERGENCY OPERATING SYSTEM FOR WOMEN SAFETY

![Version](https://img.shields.io/badge/VERSION-1.0.0-FF003C?style=for-the-badge&labelColor=0A0A0F)
![Status](https://img.shields.io/badge/STATUS-OPERATIONAL-00FF88?style=for-the-badge&labelColor=0A0A0F)
![Build](https://img.shields.io/badge/BUILD-STABLE-00F5FF?style=for-the-badge&labelColor=0A0A0F)
![License](https://img.shields.io/badge/LICENSE-MIT-FFB300?style=for-the-badge&labelColor=0A0A0F)

**Real-time voice surveillance • Automated SOS • AI risk analysis • Evidence chain custody**

[🚀 Live Demo](#-deployment) · [📖 Documentation](#-modules-deep-dive) · [⚡ Quick Start](#-quick-start)

---

</div>

## 🧬 What is SafeHer OS?

SafeHer OS is a **mission-critical women's safety command system** disguised as a futuristic operating system interface. Unlike conventional safety apps that require manual interaction, SafeHer OS operates with **zero-touch threat response** — it continuously listens, analyzes, and acts autonomously.

```
╔══════════════════════════════════════════════════════════════╗
║  SAFEHER OS v1.0 — THREAT RESPONSE PIPELINE                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  [BOOT] ──→ [VOICE ARM] ──→ [CONTINUOUS LISTEN] ──┐        ║
║                                                     │        ║
║              ┌──────────────────────────────────────┘        ║
║              ▼                                               ║
║  [KEYWORD DETECTED] ──→ [AUTO-SOS TRIGGER]                  ║
║              │                                               ║
║              ├──→ GPS Lock + Location Transmit               ║
║              ├──→ Emergency Contacts Alerted (SMS/Call)      ║
║              ├──→ Camera + Mic Auto-Record (30s)             ║
║              ├──→ Photo Snapshot Captured                    ║
║              └──→ Evidence Hashed (SHA-256) → Vault          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### 🏆 Why SafeHer OS Wins

| Feature | Traditional Safety Apps | SafeHer OS |
|---------|:----------------------:|:----------:|
| Manual SOS button | ✅ | ✅ |
| Voice-activated SOS | ❌ | ✅ **Always-on** |
| Auto evidence recording | ❌ | ✅ **Camera + Mic** |
| AI risk assessment | ❌ | ✅ **Real-time** |
| Works without internet | ❌ | ✅ **Offline capable** |
| Hindi keyword detection | ❌ | ✅ **"bachao", "darr"** |
| Evidence chain integrity | ❌ | ✅ **SHA-256 hashed** |
| Fake call decoy | Some | ✅ **With audio** |
| Zero-touch activation | ❌ | ✅ **Fully autonomous** |

---

## 🏗️ System Architecture

```
safeher-os/
├── index.html        # UI Shell — 8 screens, 430+ lines
├── styles.css        # Design System — Cyberpunk theme, 290+ lines
├── app.js            # Core Engine — 650+ lines, 12 modules
├── vercel.json       # Deployment config with security headers
└── README.md         # This file
```

### Technology Matrix

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Rendering** | HTML5 Semantic | Accessible, structured UI shell |
| **Design** | Vanilla CSS3 | Custom properties, Grid, animations, glassmorphism |
| **Engine** | ES6+ JavaScript | Zero-dependency application logic |
| **Mapping** | Leaflet.js 1.9.4 | Interactive maps with CartoDB dark tiles |
| **Voice** | Web Speech Recognition API | Continuous speech-to-text analysis |
| **Media** | MediaRecorder API | Audio + video evidence capture |
| **Crypto** | Web Crypto API | SHA-256 evidence hashing |
| **Typography** | Google Fonts | Orbitron (headings) + Share Tech Mono (data) |
| **Persistence** | localStorage | Contacts, keywords, reports, settings |
| **Deployment** | Vercel | Zero-config static hosting |

### Design Tokens

```css
--bg:     #0A0A0F    /* Deep void black         */
--red:    #FF003C    /* Crimson — danger/SOS     */
--cyan:   #00F5FF    /* Electric cyan — data     */
--amber:  #FFB300    /* Amber — warnings         */
--green:  #00FF88    /* Neon green — safe zones   */
--glass:  blur(20px) /* Glassmorphism backdrop    */
```

---

## 🧩 Modules Deep Dive

### Module 01 — 🛡️ Command Dashboard
The nerve center. Displays real-time system health at a glance.

- **4 stat cards** — Animated count-up with 3D perspective tilt on hover
- **Threat Escalation Bar** — 4 levels: `NOMINAL` → `MONITORING` → `THREAT` → `CRITICAL`
- **Live Leaflet Map** — Lucknow-centered with 7 color-coded safety markers
- **Activity Feed** — 10 chronological events with relative timestamps
- **Quick Actions** — SOS NOW, Fake Call, Share Location, Voice Arm

### Module 02 — 🗺️ Safe Routes Navigation
AI-analyzed route safety with real Lucknow geography.

- **4 mapped routes** with safety scores (32–95/100)
- **12 named locations** — Hazratganj, Gomti Nagar, Aminabad, Alambagh, etc.
- **5 danger heatmap zones** — Toggleable red overlay circles
- **3 police stations** — Marked with dial info
- **Route info panel** — Distance, safety score, estimated time, warnings

### Module 03 — 🚨 SOS Emergency Console
Full emergency sequence with automated evidence collection.

- **Hold-to-activate** (3 sec) with animated SVG progress ring
- **4-phase sequence:** GPS → Contacts → Evidence → Secured
- **Auto camera + mic recording** — 30-second WebM capture
- **Auto photo snapshot** — JPEG captured during Phase 3
- **Alarm siren** — Web Audio API sawtooth oscillator sweep
- **Emergency helplines** — Police (100), Women (1091), Ambulance (108), Child (1098), UP 1090
- **Safety protocol** — 6-step emergency response checklist

### Module 04 — 🎤 Voice Guardian (Always-On)
**The killer feature.** Auto-arms on boot, listens continuously, triggers SOS autonomously.

```
TRIGGER KEYWORDS:
┌──────────┬──────────┬───────────┬──────────┐
│  help    │  bachao  │ emergency │   darr   │
├──────────┼──────────┼───────────┼──────────┤
│  police  │  raksha  │  scared   │  (custom)│
└──────────┴──────────┴───────────┴──────────┘
```

- **Auto-arms on boot** — No manual toggle required
- **Continuous listening** — Active on ALL screens simultaneously
- **Auto-restarts** — If recognition drops, reconnects in 300ms
- **Multi-language** — Hindi (`hi-IN`), English (`en-IN`), or Both
- **30s cooldown** — Prevents accidental re-triggers
- **Waveform canvas** — Real-time audio visualization
- **Detection log** — Timestamped system events
- **Nearby safe zones** — Distance to 5 closest safe locations

### Module 05 — 📝 Report Incident
Structured incident reporting with evidence upload.

- **5 categories** — Stalking, Harassment, Assault, Suspicious Activity, Other
- **Auto-location** — Pre-filled with GPS coordinates
- **File upload** — Drag-and-drop with image/video support
- **Anonymous mode** — On by default
- **SHA-256 hash** — Generated on submission for evidence integrity
- **localStorage persistence** — Reports saved locally

### Module 06 — 🤖 AI Guardian (RAKSHA)
Context-aware safety chatbot with risk assessment.

- **4 quick-action chips** — Pre-built safety queries
- **Risk badges** — `LOW` (green) / `MEDIUM` (amber) / `HIGH` (red) on every response
- **Lucknow-specific** — References local landmarks, police stations, routes
- **Anthropic API** — Optional Claude integration for live AI responses
- **Intelligent fallback** — Rich pre-built responses when API unavailable

### Module 07 — 🔒 Evidence Vault
Tamper-proof digital evidence locker.

- **8 pre-loaded items** + auto-populated from SOS captures
- **4 filter categories** — All, Photos, Video, Reports
- **SHA-256 hash chain** — Each item cryptographically fingerprinted
- **Storage meter** — Visual capacity indicator (2.3/5 GB)
- **Download capability** — Individual evidence export
- **3D tilt cards** — Perspective transform on hover

### Module 08 — ⚙️ System Settings
Full system configuration panel.

- **Emergency contacts** — CRUD operations with phone numbers
- **Custom keywords** — Add/remove voice trigger words
- **Alert channels** — SMS, Call, WhatsApp toggles
- **Privacy controls** — Anonymous reporting, auto-evidence capture
- **All changes persisted** to localStorage

---

## 🎨 Visual Engineering

| Effect | Technique |
|--------|-----------|
| Boot sequence | CSS transitions + JS timed steps |
| Particle network | Canvas 2D — 70 dots with distance-linked connections |
| Scanline overlay | `repeating-linear-gradient` with `@keyframes` scroll |
| 3D card tilt | `perspective(600px) rotateX/Y` on `mousemove` |
| Glassmorphism | `backdrop-filter: blur(20px)` + rgba borders |
| Neon glow | Multi-layer `box-shadow` with color bleed |
| GPS scramble | Random digit replacement settling to final coords |
| SOS pulse | Infinite `@keyframes` with box-shadow breathing |
| Red flash | Full-body `@keyframes` background flash on SOS |
| Counter animation | `requestAnimationFrame` driven count-up |
| Live clock | `setInterval` with IST timezone formatting |
| System uptime | Live `HH:MM:SS` counter from boot moment |
| Waveform | Canvas sine wave with amplitude modulation |

---

## 📍 Lucknow Safety Intelligence

| Zone | Score | Status | Notes |
|------|:-----:|--------|-------|
| Lulu Mall Area | 95 | 🟢 Safe | Commercial, well-monitored |
| Hazratganj | 92 | 🟢 Safe | Main CP area, CCTV coverage |
| Gomti Nagar | 90 | 🟢 Safe | Residential + commercial hub |
| Indira Nagar | 87 | 🟢 Safe | Well-lit residential |
| Gomti Riverfront | 85 | 🟢 Safe | Public park area |
| Mahanagar | 82 | 🟢 Safe | Residential colony |
| Amausi Airport | 70 | 🟡 Moderate | Transit zone |
| Aminabad | 64 | 🟡 Moderate | Narrow lanes, busy market |
| Kaiserbagh | 61 | 🟡 Moderate | Historical area |
| Charbagh Station | 58 | 🟡 Moderate | Railway station area |
| 1090 Chauraha | 55 | 🟡 Moderate | Intersection hub |
| Alambagh | 32 | 🔴 Avoid | Multiple incidents reported |

---

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/safeher-os.git
cd safeher-os

# Option 1: Open directly
start index.html          # Windows
open index.html           # macOS

# Option 2: Static server
npx serve . -l 3000

# Option 3: VS Code Live Server
# Right-click index.html → Open with Live Server
```

### Browser Requirements

| Requirement | Minimum |
|------------|---------|
| Chrome / Edge | v80+ (recommended) |
| Microphone | Required for Voice Guardian |
| Camera | Required for SOS evidence |
| Location | Required for GPS features |
| HTTPS | Required for media APIs on deployment |

### Optional: Enable Live AI
```javascript
// In browser console:
localStorage.setItem('safeher_api_key', 'your-anthropic-api-key');
// AI Guardian will now use Claude for real-time responses
```

---

## 🚀 Deployment

### Deploy to Vercel (One-Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/safeher-os)

### Manual Vercel Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (from project root)
vercel

# Deploy to production
vercel --prod
```

The included `vercel.json` configures:
- ✅ Static file serving (no build step)
- ✅ Security headers (X-Content-Type-Options, X-Frame-Options)
- ✅ Permissions-Policy for camera, mic, geolocation
- ✅ Asset caching (CSS/JS — 1 year immutable)
- ✅ SPA rewrites to index.html

---

## 🔐 Security & Privacy

```
┌─────────────────────────────────────────────┐
│  DATA FLOW: 100% CLIENT-SIDE                │
│                                             │
│  Browser ──→ localStorage (encrypted)       │
│         ──→ No external servers             │
│         ──→ No analytics / tracking         │
│         ──→ No data leaves the device       │
│         ──→ SHA-256 evidence hashing        │
│         ──→ Permission-gated media access   │
└─────────────────────────────────────────────┘
```

| Measure | Implementation |
|---------|---------------|
| Data storage | localStorage only — never leaves device |
| Evidence integrity | SHA-256 cryptographic hashing |
| Media access | Permission-gated (camera, mic, GPS) |
| Anonymous reporting | Enabled by default |
| Network requests | Zero (except map tiles + optional AI) |
| Security headers | CSP, X-Frame-Options, Referrer-Policy |

---

## 📋 API Reference

```javascript
// Core namespace
App.nav.switchScreen('sos')      // Navigate to any screen
App.sos.activate()               // Trigger SOS sequence
App.sos.startFakeCall()          // Trigger fake incoming call
App.sos.toggleAlarm()            // Toggle siren alarm
App.voice.autoArm()              // Arm voice recognition
App.voice.test()                 // Simulate keyword detection
App.chat.send()                  // Send AI chat message
App.vault.render()               // Refresh evidence vault
App.shareLocation()              // Share GPS coordinates
App.settings.addContact()        // Add emergency contact
App.settings.addKeyword()        // Add voice trigger keyword
```

---

<div align="center">

```
╔══════════════════════════════════════════════╗
║                                              ║
║    SAFEHER OS v1.0 — SYSTEMS OPERATIONAL     ║
║    Because safety is not optional.           ║
║                                              ║
╚══════════════════════════════════════════════╝
```

**Built with 🛡️ for women's safety**

Made in 🇮🇳 India | Lucknow Edition

</div>
]]>
