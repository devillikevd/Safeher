<div align="center">

```
███████╗ █████╗ ███████╗███████╗██╗  ██╗███████╗██████╗      ██████╗ ███████╗
██╔════╝██╔══██╗██╔════╝██╔════╝██║  ██║██╔════╝██╔══██╗    ██╔═══██╗██╔════╝
███████╗███████║█████╗  █████╗  ███████║███████║██║  ██║    ╚██████╔╝███████║
╚════██║██╔══██║██╔══╝  ██╔══╝  ██║  ██║██╔══╝  ██╔══██╗    ██║   ██║╚════██║
███████║██║  ██║██║     ███████╗██║  ██║███████║██║  ██║    ╚██████╔╝███████║
╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝
```

### ⚔️ CYBER-EMERGENCY OPERATING SYSTEM FOR WOMEN SAFETY

![Version](https://img.shields.io/badge/VERSION-1.0.0-FF003C?style=for-the-badge&labelColor=0A0A0F)
![Status](https://img.shields.io/badge/STATUS-OPERATIONAL-00FF88?style=for-the-badge&labelColor=0A0A0F)
![Build](https://img.shields.io/badge/BUILD-STABLE-00F5FF?style=for-the-badge&labelColor=0A0A0F)
![License](https://img.shields.io/badge/LICENSE-MIT-FFB300?style=for-the-badge&labelColor=0A0A0F)

**Real-time voice surveillance • Automated SOS • AI risk analysis • Evidence chain custody**

[🌐 Live Demo](https://safe-her-nu.vercel.app/) · [📖 Documentation](#modules-deep-dive) · [⚡ Quick Start](#quick-start)

---

</div>

## 🧬 What is SafeHer OS?

SafeHer OS is a **mission-critical women's safety command system** built as a futuristic operating system interface. It combines continuous voice monitoring, smart route insights, emergency automation, incident reporting, and evidence preservation in a single static web app.

This repository is optimized for modern browsers and deploys instantly on Vercel.

### Core capabilities

- **Always-on voice guardian** with keyword detection
- **Automated SOS activation** with hold-to-trigger interaction
- **Evidence capture** using camera + mic
- **Interactive safe route map** for Lucknow
- **Incident reporting** with cryptographic evidence hashing
- **Local evidence vault** with tamper-resistant storage
- **Cyberpunk UX** with animated dashboard visuals

---

## 🚀 Live Deployment

**Live Demo:** https://safe-her-nu.vercel.app/

### Deployment summary

- Host: **Vercel**
- Type: **Static HTML/CSS/JS**
- Map provider: **Leaflet + CartoDB dark tiles**
- Voice engine: **Web SpeechRecognition API**
- Media capture: **MediaRecorder API**
- Crypto: **Web Crypto SHA-256**

---

## 🏗️ System Architecture

```
safeher-os/
├── index.html        # UI shell and main markup
├── styles.css        # Cyberpunk theme, layout, motion
├── app.js            # Core application logic
├── vercel.json       # Vercel deployment settings
└── README.md         # Project documentation
```

### Technology matrix

| Layer | Technology | Purpose |
|------|-----------|---------|
| UI | HTML5 | Semantic interface structure |
| Styling | CSS3 | Glassmorphism, animations, responsive layout |
| Runtime | Vanilla JavaScript | Zero-dependency feature engine |
| Mapping | Leaflet 1.9.4 | Route safety visualization |
| Voice | SpeechRecognition API | Keyword detection and voice trigger |
| Media | MediaRecorder API | Audio/video evidence capture |
| Crypto | Web Crypto API | SHA-256 hash generation |
| Storage | localStorage | Contacts, reports, settings, vault |
| Deployment | Vercel | Static hosting with secure headers |

---

## 🧩 Feature Overview

### 1. Command Dashboard

- Animated KPI cards for incidents, routes, guardians, and evidence
- Threat escalation bar with four levels
- Embedded Leaflet map with Lucknow safety points
- Activity feed showing recent events
- Quick actions for SOS, fake call, location sharing, and voice arm

### 2. Safe Routes Navigation

- Interactive route visualization
- Heatmap toggle and safe-route filter
- Location-specific safety score display
- Distance, estimated time, and warning panel

### 3. SOS Emergency Console

- 3-second hold-to-activate SOS button
- Multi-phase emergency sequence
- Automatic audio/video capture
- Built-in emergency helpline directory
- Fake call decoy for threat deterrence

### 4. Voice Guardian

- Auto-arms on boot
- Continuous listening across screens
- Auto-reconnect fallback when speech recognition drops
- Multi-language support: Hindi and English
- Real-time waveform visualization
- Detection log and trigger history

### 5. Incident Report

- Structured incident form
- Category selection with location auto-fill
- File upload for supporting evidence
- Anonymous reporting enabled by default
- SHA-256 evidence fingerprint generation
- Persistent browser storage

### 6. AI Guardian (Optional)

- Safety chatbot interface
- Risk assessment badges for responses
- Quick action query chips
- Optional Anthropic Claude integration via localStorage key
- Offline fallback responses when API is unavailable

### 7. Evidence Vault

- Encrypted evidence listing
- Filters for photos, videos, and reports
- SHA-256 hash chain for proof integrity
- Storage meter and download-ready entries
- 3D card hover interaction

### 8. System Settings

- Emergency contact management
- Custom voice keywords
- Alert channel toggles
- Privacy and capture controls
- Local storage persistence

---

## 🎨 Visual Engineering

| Effect | Technique |
|--------|-----------|
| Boot sequence | CSS transitions + JS timed steps |
| Particle network | Canvas 2D with dynamic line links |
| Scanline overlay | `repeating-linear-gradient` with animated background |
| 3D card tilt | `perspective(600px)` and pointer tracking |
| Glassmorphism | `backdrop-filter: blur(20px)` + translucent borders |
| Neon glow | Multi-layer box-shadow effects |
| GPS scramble | Animated digit randomization to final coordinates |
| SOS pulse | `@keyframes` breathing shadow effect |
| Counter animation | `requestAnimationFrame` count-up sequence |
| Live clock | IST timezone formatting with `setInterval` |
| Uptime tracker | Runtime counter from app boot time |
| Waveform | Canvas-based amplitude visualization |

---

## 📍 Lucknow Safety Intelligence

| Zone | Score | Status | Notes |
|------|:-----:|--------|-------|
| Lulu Mall Area | 95 | 🟢 Safe | Commercial, high visibility |
| Hazratganj | 92 | 🟢 Safe | Core police and CCTV coverage |
| Gomti Nagar | 90 | 🟢 Safe | Residential and business hub |
| Indira Nagar | 87 | 🟢 Safe | Well-lit neighborhood |
| Gomti Riverfront | 85 | 🟢 Safe | Public recreation area |
| Mahanagar | 82 | 🟢 Safe | Residential colony |
| Amausi Airport | 70 | 🟡 Moderate | Transit area |
| Aminabad | 64 | 🟡 Moderate | Busy market lanes |
| Kaiserbagh | 61 | 🟡 Moderate | Historical district |
| Charbagh Station | 58 | 🟡 Moderate | Railway transit zone |
| 1090 Chauraha | 55 | 🟡 Moderate | Intersection hub |
| Alambagh | 32 | 🔴 Avoid | High incident density |

---

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/safeher-os.git
cd safeher-os

# Option 1: Open locally
start index.html          # Windows
open index.html           # macOS

# Option 2: Use a local server
npx serve . -l 3000

# Option 3: VS Code Live Server
# Right-click index.html → Open with Live Server
```

### Browser requirements

- Chrome / Edge v80+ recommended
- Microphone required for voice guardian
- Camera required for evidence capture
- Location required for GPS-enabled features
- HTTPS required for camera/microphone access in deployed mode

### Optional AI integration

```javascript
localStorage.setItem('safeher_api_key', 'your-anthropic-api-key');
```

---

## 🔧 Deployment Notes

This project is configured for Vercel with no build step required.

### Manual Vercel deployment

```bash
npm i -g vercel
vercel
vercel --prod
```

### Configured by `vercel.json`

- static file hosting
- security headers
- asset cache TTL
- SPA fallback to `index.html`

---

## 🔐 Security & Privacy

SafeHer OS is designed to keep data local and limit external exposure.

- **Client-side first**: the app runs entirely in browser
- **No analytics / tracking** by default
- **localStorage** used for contacts, reports, settings, and evidence metadata
- **SHA-256 hashing** secures evidence fingerprints
- **Permission workflow** for camera, mic, and location
- **No backend required** for core safety features

---

## 📋 API Reference

```javascript
App.nav.switchScreen('sos')      // Navigate to SOS screen
App.sos.activate()               // Trigger SOS sequence
App.sos.startFakeCall()          // Launch fake call overlay
App.sos.toggleAlarm()            // Toggle siren alarm
App.voice.autoArm()              // Arm voice recognition
App.voice.test()                 // Simulate keyword detection
App.chat.send()                  // Send AI message
App.vault.render()               // Refresh evidence vault UI
App.shareLocation()              // Share GPS coordinates
App.settings.addContact()        // Add emergency contact
App.settings.addKeyword()        // Add voice keyword
```

---

## ⚡ Credit

Built for women's safety, with a focus on intelligent response, immersive UI, and data integrity.

Made in 🇮🇳 India | Lucknow Edition

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

</div>
