// SafeHer OS — Main Application
const App = {
  currentScreen: 'dashboard',
  currentUser: null,
  init() {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('share')) {
      return this._bootGuardianView(urlParams.get('share'));
    }
    // Bypass login for zero-setup hackathon mode
    const boot = document.getElementById('boot-screen');
    if (boot && boot.classList.contains('hidden')) {
      if(!sessionStorage.getItem('safeher_face_verified')) {
        this.runFaceScanBoot();
      } else {
        boot.classList.remove('hidden');
        this.bootSequence();
      }
    }
    this.liveShare.loadHistory();
    if(this.biometrics) this.biometrics.init();
    if(this.terminal) this.terminal.init();
    if(this.radar) this.radar.init();
    if(this.gyroscope) this.gyroscope.init();
    if(this.mesh) this.mesh.init();
  },

  async runFaceScanBoot() {
    App.speak("Initiating biometric verification.");
    const scanScreen = document.getElementById('face-scan-screen');
    const scanVideo = document.getElementById('face-scan-video');
    scanScreen.classList.remove('hidden');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if(scanVideo) {
        scanVideo.srcObject = stream;
      }
    } catch(e) {
      console.log('No camera for face scan, using mock');
    }

    // Simulate scanning delay
    setTimeout(() => {
      document.getElementById('face-scan-text').textContent = "BIOMETRIC MATCH CONFIRMED";
      document.getElementById('face-scan-text').style.color = "var(--green)";
      App.speak("Identity verified. Welcome back, Guardian.");
      sessionStorage.setItem('safeher_face_verified', 'true');
      
      setTimeout(() => {
        // Stop camera
        if(scanVideo && scanVideo.srcObject) {
          scanVideo.srcObject.getTracks().forEach(t => t.stop());
        }
        scanScreen.classList.add('hidden');
        
        // Resume normal boot
        const boot = document.getElementById('boot-screen');
        boot.classList.remove('hidden');
        this.bootSequence();
      }, 1500);
    }, 4000);
  },
  _bootGuardianView(shareId) {
    console.log('[GUARDIAN] Booting public view for share ID:', shareId);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-wrapper').classList.remove('hidden');
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('top-header').innerHTML = '<div style="color:var(--cyan); padding:20px; font-weight:bold; font-size:1.5rem; text-align:center; width:100%;">🛡️ SAFEHER GUARDIAN TRACKING</div>';
    
    // Create a fullscreen map container
    const mapDiv = document.createElement('div');
    mapDiv.id = 'guardian-map';
    mapDiv.style.cssText = 'position:absolute; top:80px; left:0; right:0; bottom:0; background:#111; z-index:9999;';
    document.getElementById('main-area').appendChild(mapDiv);
    
    // Init Leaflet Map
    const map = L.map(mapDiv, {attributionControl:false}).setView([26.8467, 80.9462], 16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    
    const marker = L.marker([26.8467, 80.9462], {
      icon: L.divIcon({
        html: '<div style="width:16px;height:16px;background:#00F5FF;border-radius:50%;box-shadow:0 0 15px #00F5FF;border:2px solid #fff"></div>',
        iconSize: [16,16], className: ''
      })
    }).addTo(map);
    
    setTimeout(() => map.invalidateSize(), 200);
    
    // Subscribe to real-time updates
    const channel = supabase.channel('share_'+shareId);
    channel.on('broadcast', { event: 'location' }, payload => {
      console.log('Update received:', payload.payload);
      const pos = [payload.payload.lat, payload.payload.lng];
      marker.setLatLng(pos);
      map.panTo(pos);
    }).subscribe((status) => {
      if(status === 'SUBSCRIBED') console.log('[GUARDIAN] Connected to live tracking feed');
    });
  },
  // ── AUTHENTICATION (SUPABASE) ──
  auth: {
    _resendTimer: null,
    _currentPhone: null,
    init() {
      if (typeof supabase !== 'undefined') {
        supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            console.log('[AUTH] ✅ User signed in:', session.user.phone);
            App.currentUser = session.user;
            // Only trigger success if we aren't already logged in to prevent loop
            if (App.currentScreen === 'dashboard' && document.getElementById('boot-screen').classList.contains('hidden')) return;
            this._onSuccess(session.user);
          }
        });
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            App.currentUser = session.user;
            this._onSuccess(session.user);
          }
        });
        this._setupOTPInputs();
      } else {
        console.warn('[AUTH] Supabase not available — login will use skip mode');
      }
      const phoneInput = document.getElementById('login-phone');
      if (phoneInput) phoneInput.addEventListener('keydown', e => { if (e.key === 'Enter') this.sendOTP(); });
    },
    _setupOTPInputs() {
      document.querySelectorAll('.login-otp-digit').forEach((inp, i, all) => {
        inp.addEventListener('input', () => {
          inp.value = inp.value.replace(/\D/g, '');
          if (inp.value && i < all.length - 1) all[i + 1].focus();
          inp.classList.toggle('filled', !!inp.value);
          const code = Array.from(all).map(d => d.value).join('');
          if (code.length === 6) setTimeout(() => this.verifyOTP(), 200);
        });
        inp.addEventListener('keydown', e => {
          if (e.key === 'Backspace' && !inp.value && i > 0) all[i - 1].focus();
        });
      });
    },
    _setStatus(msg, type) {
      const el = document.getElementById('login-status');
      if (el) { el.textContent = msg; el.className = 'login-status ' + (type || ''); }
    },
    async sendOTP() {
      const phone = document.getElementById('login-phone')?.value.replace(/\D/g, '');
      if (!phone || phone.length !== 10) { this._setStatus('Enter a valid 10-digit number', 'error'); return; }
      this._currentPhone = '+91' + phone;
      const btn = document.getElementById('login-send-otp');
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="login-spinner"></span>SENDING...'; }
      this._setStatus('Sending OTP via Supabase...');
      try {
        if (typeof supabase === 'undefined') throw new Error('Supabase not initialized');
        const { error } = await supabase.auth.signInWithOtp({ phone: this._currentPhone });
        if (error) throw error;
        document.getElementById('login-phone-phase')?.classList.add('hidden');
        document.getElementById('login-otp-phase')?.classList.remove('hidden');
        this._setStatus('OTP sent to ' + this._currentPhone, 'success');
        document.querySelector('.login-otp-digit')?.focus();
        this._startResendTimer();
      } catch (e) {
        console.error('[AUTH] OTP error:', e);
        this._setStatus(e.message || 'Failed to send OTP', 'error');
      }
      if (btn) { btn.disabled = false; btn.innerHTML = 'SEND OTP'; }
    },
    async verifyOTP() {
      const digits = document.querySelectorAll('.login-otp-digit');
      const code = Array.from(digits).map(d => d.value).join('');
      if (code.length !== 6) { this._setStatus('Enter all 6 digits', 'error'); return; }
      const btn = document.getElementById('login-verify-otp');
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="login-spinner"></span>VERIFYING...'; }
      this._setStatus('Verifying...');
      try {
        const { data, error } = await supabase.auth.verifyOtp({ phone: this._currentPhone, token: code, type: 'sms' });
        if (error) throw error;
        App.currentUser = data.user;
        this._setStatus('ACCESS GRANTED ✓', 'success');
        setTimeout(() => this._onSuccess(data.user), 600);
      } catch (e) {
        console.error('[AUTH] Verify error:', e);
        this._setStatus('Invalid OTP — try again', 'error');
        digits.forEach(d => { d.value = ''; d.classList.remove('filled'); });
        digits[0]?.focus();
      }
      if (btn) { btn.disabled = false; btn.innerHTML = 'VERIFY & ENTER'; }
    },
    _startResendTimer() {
      let sec = 30;
      const el = document.getElementById('login-timer');
      if (this._resendTimer) clearInterval(this._resendTimer);
      this._resendTimer = setInterval(() => {
        sec--;
        if (el) el.textContent = sec > 0 ? `Resend OTP in ${sec}s` : '';
        if (sec <= 0) {
          clearInterval(this._resendTimer);
          if (el) el.innerHTML = '<a class="login-skip" onclick="App.auth._backToPhone()">← Change number</a>';
        }
      }, 1000);
    },
    _backToPhone() {
      document.getElementById('login-phone-phase')?.classList.remove('hidden');
      document.getElementById('login-otp-phase')?.classList.add('hidden');
      this._setStatus('');
    },
    skipLogin() {
      console.log('[AUTH] Skipping login — offline mode');
      this._setStatus('Entering offline mode...', 'success');
      App.currentUser = null;
      setTimeout(() => this._hideLoginAndBoot(), 500);
    },
    _onSuccess(user) {
      const avatar = document.querySelector('.user-avatar span');
      if (avatar) avatar.textContent = user.phone || 'User';
      App.db.loadUserData(user.id);
      this._hideLoginAndBoot();
    },
    _hideLoginAndBoot() {
      const login = document.getElementById('login-screen');
      if (login && login.style.display !== 'none') { 
        login.style.opacity = '0'; 
        setTimeout(() => { login.style.display = 'none'; }, 800); 
      }
      const boot = document.getElementById('boot-screen');
      if (boot && boot.classList.contains('hidden')) {
        boot.classList.remove('hidden');
        App.bootSequence();
      }
    },
    logout() {
      if (typeof supabase !== 'undefined') supabase.auth.signOut();
      App.currentUser = null;
      localStorage.removeItem('safeher_contacts');
      localStorage.removeItem('safeher_keywords');
      location.reload();
    }
  },

  // ── SUPABASE DATA LAYER ──
  db: {
    async loadUserData(uid) {
      if (typeof supabase === 'undefined' || !uid) return;
      try {
        // Create profile if doesn't exist (handled by DB trigger usually, but we ensure here)
        const { data: prof, error: profErr } = await supabase.from('profiles').select('*').eq('id', uid).single();
        if (profErr || !prof) {
          await supabase.from('profiles').insert([{ id: uid, phone: App.currentUser?.phone || '' }]);
        }
        // Load contacts
        const { data: contacts } = await supabase.from('contacts').select('*').eq('user_id', uid);
        if (contacts && contacts.length) {
          App.settings.contacts = contacts;
          localStorage.setItem('safeher_contacts', JSON.stringify(contacts));
          console.log('[SUPABASE] Loaded', contacts.length, 'contacts');
        }
        // Load keywords
        const { data: keywords } = await supabase.from('keywords').select('*').eq('user_id', uid);
        if (keywords && keywords.length) {
          const kwArr = keywords.map(k => k.word);
          App.settings.keywords = kwArr;
          localStorage.setItem('safeher_keywords', JSON.stringify(kwArr));
          App.voice._syncKeywordsFromSettings();
          console.log('[SUPABASE] Loaded', keywords.length, 'keywords');
        }
      } catch (e) { console.error('[SUPABASE] Load error:', e); }
    },
    async saveContacts(contacts) {
      const uid = App.currentUser?.id;
      if (typeof supabase === 'undefined' || !uid) return;
      try {
        await supabase.from('contacts').delete().eq('user_id', uid);
        if (contacts.length) {
          const inserts = contacts.map(c => ({ user_id: uid, name: c.name, phone: c.phone, relation: c.relation || '', ready: true }));
          await supabase.from('contacts').insert(inserts);
        }
      } catch (e) { console.error('[SUPABASE] Save contacts error:', e); }
    },
    async saveKeywords(keywords) {
      const uid = App.currentUser?.id;
      if (typeof supabase === 'undefined' || !uid) return;
      try {
        await supabase.from('keywords').delete().eq('user_id', uid);
        if (keywords.length) {
          const inserts = keywords.map(k => ({ user_id: uid, word: k, language: /[\u0900-\u097F]/.test(k) ? 'hi' : 'en' }));
          await supabase.from('keywords').insert(inserts);
        }
      } catch (e) { console.error('[SUPABASE] Save keywords error:', e); }
    },
    async saveIncident(incident) {
      const uid = App.currentUser?.id;
      if (typeof supabase === 'undefined') return;
      try {
        await supabase.from('incidents').insert([{ 
          user_id: uid || null, 
          type: incident.type, 
          location: incident.location, 
          description: incident.description, 
          anonymous: incident.anonymous, 
          hash: incident.hash 
        }]);
      } catch (e) { console.error('[SUPABASE] Save incident error:', e); }
    },
    async saveEvidenceMeta(meta) {
      const uid = App.currentUser?.id;
      if (typeof supabase === 'undefined' || !uid) return;
      try {
        await supabase.from('evidence').insert([{
          user_id: uid,
          type: meta.type || 'unknown',
          filename: meta.name || 'file',
          hash: meta.hash
        }]);
      } catch (e) { console.error('[SUPABASE] Save evidence error:', e); }
    }
  },

  // ── BOOT SEQUENCE ──
  bootSequence() {
    const bar = document.getElementById('boot-bar');
    const text = document.getElementById('boot-text');
    const status = document.getElementById('boot-status');
    const steps = [
      [10,'Loading kernel modules...'],
      [25,'Initializing GPS subsystem...'],
      [40,'Connecting voice engine...'],
      [55,'Loading threat analysis...'],
      [70,'Syncing evidence vault...'],
      [85,'Establishing secure channel...'],
      [100,'SYSTEMS ONLINE']
    ];
    let i = 0;
    const next = () => {
      if (i < steps.length) {
        bar.style.width = steps[i][0] + '%';
        status.textContent = steps[i][1];
        i++;
        setTimeout(next, 400);
      } else {
        text.textContent = 'SAFEHER OS READY';
        App.speak("Welcome to Safe Her OS. All systems online.");
        setTimeout(() => {
          document.getElementById('boot-screen').style.opacity = '0';
          document.getElementById('boot-screen').style.transition = 'opacity 0.8s';
          setTimeout(() => {
            document.getElementById('boot-screen').style.display = 'none';
            document.getElementById('app-wrapper').classList.remove('hidden');
            this.startSystems();
          }, 800);
        }, 600);
      }
    };
    setTimeout(next, 500);
  },

  startSystems() {
    this.particles.init();
    this.nav.init();
    this.clock.start();
    this.dashboard.init();
    this.tilt.init();
    this.startUptime();
    // Auto-arm voice guardian on boot — always listening
    this.voice.autoArm();
    if (window.innerWidth <= 900) document.getElementById('mobile-menu').classList.remove('hidden');
  },

  startUptime() {
    let s=0;
    setInterval(()=>{s++;const h=String(Math.floor(s/3600)).padStart(2,'0');const m=String(Math.floor((s%3600)/60)).padStart(2,'0');const sec=String(s%60).padStart(2,'0');const el=document.getElementById('uptime-counter');if(el)el.textContent=h+':'+m+':'+sec;},1000);
  },

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
  },

  shareLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => {
        alert(`Location shared: ${p.coords.latitude.toFixed(4)}°N, ${p.coords.longitude.toFixed(4)}°E`);
      }, () => alert('Location shared: 26.8467°N, 80.9462°E (mock)'));
    } else alert('Location shared: 26.8467°N, 80.9462°E (mock)');
  },
  
  speak(text) {
    if(!window.speechSynthesis) return;
    const msg = new SpeechSynthesisUtterance(text);
    // Find a female voice if possible
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Zira'));
    if(femaleVoice) msg.voice = femaleVoice;
    msg.pitch = 1.1;
    msg.rate = 1.0;
    window.speechSynthesis.speak(msg);
  },

  // ── PARTICLES ──
  particles: {
    init() {
      const c = document.getElementById('particle-canvas');
      const ctx = c.getContext('2d');
      let dots = [];
      const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
      resize(); window.addEventListener('resize', resize);
      for (let i = 0; i < 70; i++) dots.push({ x: Math.random()*c.width, y: Math.random()*c.height, vx: (Math.random()-.5)*.4, vy: (Math.random()-.5)*.4, r: Math.random()*2+1 });
      const draw = () => {
        ctx.clearRect(0,0,c.width,c.height);
        dots.forEach((d,i) => {
          d.x += d.vx; d.y += d.vy;
          if(d.x<0||d.x>c.width) d.vx*=-1;
          if(d.y<0||d.y>c.height) d.vy*=-1;
          ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
          ctx.fillStyle='rgba(255,0,60,0.3)'; ctx.fill();
          for(let j=i+1;j<dots.length;j++){
            const dx=d.x-dots[j].x, dy=d.y-dots[j].y, dist=Math.sqrt(dx*dx+dy*dy);
            if(dist<120){ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(dots[j].x,dots[j].y);ctx.strokeStyle=`rgba(0,245,255,${.08*(1-dist/120)})`;ctx.stroke();}
          }
        });
        requestAnimationFrame(draw);
      };
      draw();
    }
  },

  // ── NAVIGATION ──
  nav: {
    init() {
      document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => this.switchScreen(item.dataset.screen));
      });
    },
    switchScreen(id) {
      App.currentScreen = id;
      document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen===id));
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const el = document.getElementById('screen-'+id);
      if(el) el.classList.add('active');
      if(id==='saferoutes') setTimeout(()=>App.routes.init(),100);
      if(id==='voice') App.voice.initCanvas();
      if(id==='evidence') App.vault.render();
      if(id==='settings') App.settings.render();
      if(id==='report') document.getElementById('report-time').value = new Date().toLocaleString('en-IN');
      if(id==='community') App.community.loadPins();
      if(id==='escort') App.escort.loadTrips();
      if(window.innerWidth<=900) document.getElementById('sidebar').classList.remove('open');
    }
  },

  // ── CLOCK ──
  clock: {
    start() {
      const el = document.getElementById('live-clock');
      const tick = () => {
        const d = new Date();
        el.textContent = d.toLocaleTimeString('en-IN',{hour12:false,timeZone:'Asia/Kolkata'}) + ' IST';
      };
      tick(); setInterval(tick,1000);
    }
  },

  // ── DASHBOARD ──
  dashboard: {
    init() {
      this.animateCounters();
      this.populateActivity();
      this.initMiniMap();
      this.scrambleGPS();
    },
    animateCounters() {
      document.querySelectorAll('.stat-value[data-count]').forEach(el => {
        const target = +el.dataset.count; let cur = 0;
        const step = () => { cur += Math.ceil(target/40); if(cur>=target){el.textContent=target;return;} el.textContent=cur; requestAnimationFrame(step); };
        step();
      });
    },
    populateActivity() {
      const feed = document.getElementById('activity-feed');
      const items = [
        ['🚨 SOS triggered near Hazratganj Crossing','2 min ago'],
        ['📍 Safe route verified — Gomti Nagar Sec 12','8 min ago'],
        ['🔒 Evidence file encrypted & secured','15 min ago'],
        ['👁️ Suspicious activity — Alambagh Bus Stand','28 min ago'],
        ['🗺️ New safe zone added — Lulu Mall area','1 hr ago'],
        ['📡 Guardian Priya synced location','1.5 hr ago'],
        ['✅ Police patrol confirmed — Aminabad','2 hr ago'],
        ['🎤 Voice guardian detected keyword "bachao"','3 hr ago'],
        ['📝 Anonymous report filed — Charbagh','4 hr ago'],
        ['✓ System health check — All modules OK','5 hr ago']
      ];
      feed.innerHTML = items.map(i=>`<div class="activity-item"><span>${i[0]}</span><span class="activity-time">${i[1]}</span></div>`).join('');
    },
    initMiniMap() {
      try {
        const m = L.map('dash-map',{zoomControl:false,attributionControl:false}).setView([26.8467,80.9462],13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(m);
        // User location
        L.circleMarker([26.8467,80.9462],{radius:8,color:'#00F5FF',fillColor:'#00F5FF',fillOpacity:.7}).addTo(m).bindPopup('<b>📍 You</b><br>Hazratganj, Lucknow');
        // Key Lucknow landmarks
        const places = [
          [26.8467,80.9462,'Hazratganj','🟢 Safe Zone'],
          [26.8393,80.9394,'Aminabad Market','🟡 Moderate'],
          [26.8545,80.9491,'Gomti Nagar','🟢 Safe Zone'],
          [26.8281,80.9213,'Alambagh','🔴 Caution'],
          [26.8600,80.9112,'Charbagh Station','🟡 Moderate'],
          [26.8754,80.9560,'Indira Nagar','🟢 Safe Zone'],
          [26.8102,80.9245,'Kaiserbagh','🟡 Moderate']
        ];
        places.forEach(p=>{
          const color = p[3].includes('Safe')?'#00FF88':p[3].includes('Caution')?'#FF003C':'#FFB300';
          L.circleMarker([p[0],p[1]],{radius:5,color,fillColor:color,fillOpacity:.5,weight:1}).addTo(m).bindPopup(`<b>${p[2]}</b><br>${p[3]}`);
        });
        setTimeout(()=>m.invalidateSize(),300);
      } catch(e){}
    },
    scrambleGPS() {
      ['gps-lat','gps-lng'].forEach(id => {
        const el = document.getElementById(id);
        const final = el.textContent; let count = 0;
        const scramble = () => {
          if(count++>20){el.textContent=final;return;}
          el.textContent = Array.from(final).map(c=>/\d/.test(c)?Math.floor(Math.random()*10):c).join('');
          setTimeout(scramble,40);
        };
        scramble();
      });
    }
  },

  // ── SAFE ROUTES (Google Maps + Leaflet fallback) ──
  routes: {
    map: null, heatShown: true, heatmapLayer: null, userMarker: null, _watchId: null,
    _userLat: 26.8467, _userLng: 80.9462, _directionsRenderer: null,
    // Unsafe zone data for heatmap
    _unsafeZones: [
      {lat:26.8281,lng:80.9213,w:3,name:'Alambagh Bus Stand'},
      {lat:26.8350,lng:80.9100,w:2.5,name:'Aishbagh'},
      {lat:26.8150,lng:80.9300,w:2.8,name:'Saadatganj'},
      {lat:26.8600,lng:80.9650,w:2,name:'Vikas Nagar Edge'},
      {lat:26.8300,lng:80.9500,w:1.8,name:'1090 Crossing Night'}
    ],
    _safeZones: [
      {lat:26.8467,lng:80.9462,name:'Hazratganj CP',score:92},
      {lat:26.8545,lng:80.9491,name:'Gomti Nagar',score:90},
      {lat:26.8754,lng:80.9560,name:'Indira Nagar',score:87},
      {lat:26.8690,lng:80.9420,name:'Lulu Mall',score:95},
      {lat:26.8350,lng:80.9550,name:'Gomti Riverfront',score:85},
      {lat:26.8500,lng:80.9200,name:'Mahanagar',score:82}
    ],
    _locations: [
      [26.8467,80.9462,'Hazratganj','Main Market & CP Area','🟢 Safe',92],
      [26.8545,80.9491,'Gomti Nagar','Residential & Commercial Hub','🟢 Safe',90],
      [26.8754,80.9560,'Indira Nagar','Well-lit Residential','🟢 Safe',87],
      [26.8600,80.9112,'Charbagh Railway','Station Area','🟡 Moderate',58],
      [26.8393,80.9394,'Aminabad','Busy Market, Narrow Lanes','🟡 Moderate',64],
      [26.8102,80.9245,'Kaiserbagh','Historical Area','🟡 Moderate',61],
      [26.8281,80.9213,'Alambagh','Bus Terminal Area','🔴 Avoid',32],
      [26.8350,80.9550,'Gomti Riverfront','Public Park Area','🟢 Safe',85],
      [26.8690,80.9420,'Lulu Mall Area','Commercial Safe Zone','🟢 Safe',95],
      [26.8200,80.8900,'Amausi Airport','Transit Zone','🟡 Moderate',70],
      [26.8500,80.9200,'Mahanagar','Residential Colony','🟢 Safe',82],
      [26.8300,80.9500,'1090 Chauraha','Intersection Hub','🟡 Moderate',55]
    ],
    init() {
      if (this.map) {
        // Already initialized — just trigger resize
        if (typeof google !== 'undefined' && this.map instanceof google.maps.Map) {
          google.maps.event.trigger(this.map, 'resize');
        } else if (this.map.invalidateSize) { this.map.invalidateSize(); }
        return;
      }
      // Try Google Maps first, fall back to Leaflet
      if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
        this._initGoogleMaps();
      } else {
        console.log('[ROUTES] Google Maps not available, using Leaflet fallback');
        this._initLeafletFallback();
      }
      // Start real GPS tracking
      this._startGPSTracking();
    },
    _initGoogleMaps() {
      const container = document.getElementById('main-map');
      const darkStyle = [
        {elementType:'geometry',stylers:[{color:'#0a0a0f'}]},
        {elementType:'labels.text.stroke',stylers:[{color:'#0a0a0f'}]},
        {elementType:'labels.text.fill',stylers:[{color:'#606070'}]},
        {featureType:'road',elementType:'geometry',stylers:[{color:'#1a1a2e'}]},
        {featureType:'road',elementType:'geometry.stroke',stylers:[{color:'#2a2a3e'}]},
        {featureType:'water',elementType:'geometry',stylers:[{color:'#0d1117'}]},
        {featureType:'poi',elementType:'geometry',stylers:[{color:'#12121f'}]},
        {featureType:'transit',elementType:'geometry',stylers:[{color:'#15152a'}]}
      ];
      this.map = new google.maps.Map(container, {
        center: {lat: this._userLat, lng: this._userLng},
        zoom: 14,
        styles: darkStyle,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false
      });
      // Pulsing user marker
      this.userMarker = new google.maps.Marker({
        position: {lat: this._userLat, lng: this._userLng},
        map: this.map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8, fillColor: '#00F5FF', fillOpacity: 1,
          strokeColor: '#ffffff', strokeWeight: 2
        },
        title: 'Your Location'
      });
      // Location markers
      this._locations.forEach(l => {
        const col = l[5]>75?'#00FF88':l[5]>50?'#FFB300':'#FF003C';
        const marker = new google.maps.Marker({
          position:{lat:l[0],lng:l[1]}, map:this.map,
          icon:{path:google.maps.SymbolPath.CIRCLE,scale:6,fillColor:col,fillOpacity:0.6,strokeColor:col,strokeWeight:1}
        });
        const info = new google.maps.InfoWindow({
          content:`<div style="color:#e0e0e0"><b>${l[2]}</b><br>${l[3]}<br>Status: ${l[4]}<br>Safety: <b style="color:${col}">${l[5]}/100</b></div>`
        });
        marker.addListener('click', () => info.open(this.map, marker));
      });
      // Police stations
      [[26.8480,80.9500,'Hazratganj PS'],[26.8550,80.9400,'Gautampalli PS'],[26.8300,80.9250,'Alambagh PS']].forEach(p => {
        new google.maps.Marker({
          position:{lat:p[0],lng:p[1]}, map:this.map,
          icon:{url:'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><text y="18" font-size="16">🚔</text></svg>',scaledSize:new google.maps.Size(24,24)},
          title:p[2]
        });
      });
      // Heatmap layer
      if (google.maps.visualization) {
        const heatData = [];
        this._unsafeZones.forEach(z => {
          // Generate cluster of weighted points for each zone
          for (let i = 0; i < 15; i++) {
            heatData.push({
              location: new google.maps.LatLng(z.lat + (Math.random()-0.5)*0.006, z.lng + (Math.random()-0.5)*0.006),
              weight: z.w
            });
          }
        });
        this.heatmapLayer = new google.maps.visualization.HeatmapLayer({
          data: heatData, map: this.map,
          radius: 40, opacity: 0.6,
          gradient: ['rgba(0,0,0,0)','rgba(255,0,60,0.2)','rgba(255,0,60,0.4)','rgba(255,0,60,0.6)','rgba(255,60,0,0.8)','rgba(255,100,0,1)']
        });
      }
      // Directions renderer
      this._directionsRenderer = new google.maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: true,
        polylineOptions: {strokeColor:'#00FF88',strokeWeight:5,strokeOpacity:0.8}
      });
      // Route to nearest safe zone
      this._routeToNearestSafe();
      console.log('[ROUTES] ✅ Google Maps initialized with heatmap');
    },
    _initLeafletFallback() {
      try {
        this.map = L.map('main-map',{attributionControl:false}).setView([this._userLat,this._userLng],14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(this.map);
        this.userMarker = L.marker([this._userLat,this._userLng],{icon:L.divIcon({html:'<div style="width:14px;height:14px;background:#00F5FF;border-radius:50%;box-shadow:0 0 15px #00F5FF;border:2px solid #fff"></div>',iconSize:[14,14],className:''})}).addTo(this.map);
        this._locations.forEach(l=>{
          const col=l[5]>75?'#00FF88':l[5]>50?'#FFB300':'#FF003C';
          L.circleMarker([l[0],l[1]],{radius:7,color:col,fillColor:col,fillOpacity:.4,weight:2}).addTo(this.map).bindPopup(`<b>${l[2]}</b><br>${l[3]}<br>Safety: <b style="color:${col}">${l[5]}/100</b>`);
        });
        // Danger zones
        this._unsafeZones.forEach(z=>{
          L.circle([z.lat,z.lng],{radius:z.w*150,color:'#FF003C',fillColor:'#FF003C',fillOpacity:.12,weight:1}).addTo(this.map);
        });
        // Safe routes
        L.polyline([[26.8467,80.9462],[26.8480,80.9480],[26.8500,80.9500],[26.8520,80.9510],[26.8545,80.9491]],{color:'#00FF88',weight:5,opacity:.8}).addTo(this.map);
        L.polyline([[26.8467,80.9462],[26.8510,80.9470],[26.8570,80.9480],[26.8620,80.9510],[26.8680,80.9540],[26.8754,80.9560]],{color:'#00FF88',weight:4,opacity:.6}).addTo(this.map);
        setTimeout(()=>this.map.invalidateSize(),200);
      } catch(e){}
    },
    _startGPSTracking() {
      if (!navigator.geolocation) return;
      this._watchId = navigator.geolocation.watchPosition(pos => {
        this._userLat = pos.coords.latitude;
        this._userLng = pos.coords.longitude;
        // Update GPS display in right panel
        const latEl = document.getElementById('gps-lat');
        const lngEl = document.getElementById('gps-lng');
        if (latEl) latEl.textContent = this._userLat.toFixed(4) + '° N';
        if (lngEl) lngEl.textContent = this._userLng.toFixed(4) + '° E';
        // Update marker position
        if (this.userMarker) {
          if (this.userMarker.setPosition) this.userMarker.setPosition({lat: this._userLat, lng: this._userLng}); // Google
          else if (this.userMarker.setLatLng) this.userMarker.setLatLng([this._userLat, this._userLng]); // Leaflet
        }
      }, err => {
        console.log('[ROUTES] GPS error:', err.message);
      }, {enableHighAccuracy: true, maximumAge: 10000, timeout: 15000});
    },
    _routeToNearestSafe() {
      if (!google?.maps?.DirectionsService) return;
      // Find nearest safe zone
      let nearest = this._safeZones[0], minDist = Infinity;
      this._safeZones.forEach(z => {
        const d = Math.sqrt(Math.pow(z.lat - this._userLat, 2) + Math.pow(z.lng - this._userLng, 2));
        if (d > 0.001 && d < minDist) { minDist = d; nearest = z; }
      });
      const service = new google.maps.DirectionsService();
      service.route({
        origin: {lat: this._userLat, lng: this._userLng},
        destination: {lat: nearest.lat, lng: nearest.lng},
        travelMode: google.maps.TravelMode.WALKING
      }, (result, status) => {
        if (status === 'OK' && this._directionsRenderer) {
          this._directionsRenderer.setDirections(result);
          // Update route info panel
          const leg = result.routes[0].legs[0];
          const distEl = document.querySelector('#route-info .rv');
          const timeEl = document.querySelectorAll('#route-info .rv')[2];
          if (distEl) distEl.textContent = leg.distance.text;
          if (timeEl) timeEl.textContent = leg.duration.text;
          console.log('[ROUTES] Directions to', nearest.name, ':', leg.distance.text);
        }
      });
    },
    toggleHeatmap(btn) {
      btn.classList.toggle('active');
      this.heatShown = !this.heatShown;
      if (this.heatmapLayer) {
        this.heatmapLayer.setMap(this.heatShown ? this.map : null);
      }
    },
    toggleSafeOnly(btn) { btn.classList.toggle('active'); },
    
    _demoPolylines: [],
    demoRoute(destination) {
      if(!this.map) return;
      
      // Clear previous routes
      this._demoPolylines.forEach(p => this.map.removeLayer(p));
      this._demoPolylines = [];
      
      // Generate a random destination roughly 2-8 km away
      const distKm = (Math.random() * 6 + 2).toFixed(1);
      const safeScore = Math.floor(Math.random() * 15) + 80; // 80-94
      const timeMin = Math.floor(distKm * 4.5); // avg 4.5 mins per km
      const warnings = Math.floor(Math.random() * 3);
      
      // Update DOM info
      const routeVals = document.querySelectorAll('#route-info .rv');
      if(routeVals.length >= 4) {
        routeVals[0].textContent = `${distKm} km`;
        routeVals[1].textContent = `${safeScore}/100`;
        routeVals[1].className = `rv safety-${safeScore > 85 ? 'high' : 'low'}`;
        routeVals[2].textContent = `${timeMin} min`;
        routeVals[3].textContent = warnings;
        routeVals[3].className = `rv safety-${warnings === 0 ? 'high' : 'low'}`;
      }
      
      // Generate a fake route path (5-8 points) starting from user
      const latStart = this._userLat || 26.8467;
      const lngStart = this._userLng || 80.9462;
      const points = [[latStart, lngStart]];
      
      let curLat = latStart;
      let curLng = lngStart;
      
      const numPoints = Math.floor(Math.random() * 4) + 4;
      for(let i=0; i<numPoints; i++) {
        // move vaguely northeast or northwest
        curLat += (Math.random() * 0.01) + 0.005;
        curLng += (Math.random() - 0.5) * 0.02;
        points.push([curLat, curLng]);
      }
      
      // Draw the main safe route
      const mainRoute = L.polyline(points, {color:'#00FF88', weight:5, opacity:0.8, dashArray: '10, 10'}).addTo(this.map);
      this._demoPolylines.push(mainRoute);
      
      // Draw a destination marker
      const destIcon = L.divIcon({html:'<div style="font-size:1.5rem;">📍</div>', className:'', iconSize:[24,24], iconAnchor:[12,24]});
      const destMarker = L.marker([curLat, curLng], {icon: destIcon}).addTo(this.map).bindPopup(`<b>${destination}</b><br>Arriving in ${timeMin} mins`);
      this._demoPolylines.push(destMarker);
      
      // Fit bounds
      this.map.fitBounds(mainRoute.getBounds(), {padding: [50, 50]});
      destMarker.openPopup();
      
      console.log(`[ROUTES] Generated route to ${destination}: ${distKm}km, Safety: ${safeScore}`);
    }
  },

  // ── SOS ──
  sos: {
    holdTimer:null, holdStart:0, activated:false, _activating:false, alarmCtx:null, alarmOsc:null,
    mediaRecorder:null, recordedChunks:[], cameraStream:null, audioStream:null,
    startHold() {
      if(this.activated || this._activating) return;
      this._activating = true;
      this.holdStart = Date.now();
      const ring = document.getElementById('sos-ring-progress');
      const btn = document.getElementById('sos-button');
      if(btn) btn.style.transform = 'scale(0.95)';
      const update = () => {
        const elapsed = (Date.now() - this.holdStart) / 3000;
        const progress = Math.min(elapsed, 1);
        ring.style.strokeDashoffset = 628 - (628 * progress);
        if(progress >= 1) { this.activate(); return; }
        this.holdTimer = requestAnimationFrame(update);
      };
      update();
      document.getElementById('sos-abort').classList.remove('hidden');
    },
    endHold() {
      if(!this.activated) {
        this._activating = false;
        cancelAnimationFrame(this.holdTimer);
        this.holdTimer = null;
        const ring = document.getElementById('sos-ring-progress');
        if(ring) ring.style.strokeDashoffset = 628;
        const btn = document.getElementById('sos-button');
        if(btn) btn.style.transform = '';
        document.getElementById('sos-abort').classList.add('hidden');
      }
    },
    activate() {
      if(this.activated) return;
      this.activated = true;
      this._activating = false;
      cancelAnimationFrame(this.holdTimer);
      const btn = document.getElementById('sos-button');
      if(btn) btn.style.transform = '';
      const ring = document.getElementById('sos-ring-progress');
      if(ring) ring.style.strokeDashoffset = 0;
      document.body.classList.add('sos-flash');
      setTimeout(() => document.body.classList.remove('sos-flash'), 500);
      if(navigator.vibrate) navigator.vibrate([200,100,200,100,200]);
      document.getElementById('sos-abort').classList.remove('hidden');
      App.speak("Emergency protocol activated. Sending location and audio-visual evidence to your guardians.");
      this.startEvidenceCapture();
      // ── REAL SMS ALERT ──
      this._sendRealSOS();
      const phases = document.querySelectorAll('#sos-phases .phase');
      const contacts = document.querySelectorAll('#sos-contacts .contact-status');
      let step = 0;
      const run = () => {
        if(step < phases.length) {
          phases[step].classList.add('active');
          if(step > 0) { phases[step-1].classList.remove('active'); phases[step-1].classList.add('done'); }
        }
        if(step === 1 && contacts[0]) { contacts[0].textContent = 'SMS Sent ✓'; contacts[0].classList.add('sent'); }
        if(step === 2 && contacts[1]) { contacts[1].textContent = 'Calling...'; contacts[1].classList.add('sent'); this.capturePhoto(); }
        if(step === 3) {
          if(contacts[2]) { contacts[2].textContent = 'Notified ✓'; contacts[2].classList.add('sent'); }
          if(phases[3]) { phases[3].classList.remove('active'); phases[3].classList.add('done'); }
        }
        step++;
        if(step <= 4) {
          setTimeout(run, 1200);
        } else {
          // Sequence done — auto-reset after 10s so SOS can be triggered again
          console.log('[SOS] Sequence complete. Auto-reset in 10s...');
          setTimeout(() => {
            this.activated = false;
            this._activating = false;
            App.voice._sosCooldown = false;
            if(ring) ring.style.strokeDashoffset = 628;
            phases.forEach(p => p.classList.remove('active','done'));
            contacts.forEach(c => { c.textContent = 'Ready'; c.classList.remove('sent'); });
            // Do NOT hide the evidence panel here. Let it record until 60s or manual stop.
            console.log('[SOS] UI reset — ready for next trigger, but recording continues...');
          }, 10000);
        }
      };
      run();
    },
    // ── REAL SMS DISPATCH ──
    async _sendRealSOS() {
      try {
        // Get real GPS if available
        let lat = 26.8467, lng = 80.9462;
        try {
          const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, {timeout:5000}));
          lat = pos.coords.latitude; lng = pos.coords.longitude;
        } catch(e) { console.log('[SOS] GPS fallback to default coords'); }
        const contacts = App.settings.contacts.filter(c => c.phone);
        const payload = {
          userName: App.currentUser?.phoneNumber || 'SafeHer User',
          userPhone: App.currentUser?.phoneNumber || '',
          contacts: contacts,
          location: { lat, lng },
          timestamp: new Date().toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})
        };
        console.log('[SOS] 📡 Sending real SMS to', contacts.length, 'contacts...');
        const resp = await fetch('/api/send-sos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await resp.json();
        console.log('[SOS] SMS result:', result);
        if (result.success) {
          this._logEvidence('📡 Real SMS sent to ' + result.sent.filter(s=>s.status==='sent').length + ' contacts');
        }
      } catch (e) {
        console.warn('[SOS] SMS API not available (expected in dev):', e.message);
        this._logEvidence('⚠️ SMS API unavailable — contacts notified locally');
      }
    },
    _startStealthMic() {
      if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio:true, video:false })
          .then(stream => {
            console.log('[DECOY] Stealth mic active');
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = async e => {
              if(e.data.size > 0 && App.currentUser) {
                // Upload to Supabase Storage if configured, or just mock it for hackathon
                console.log('[DECOY] Audio chunk captured secretly');
                App.db.saveEvidenceMeta({ name: `Stealth_Audio_${Date.now()}.webm`, type: 'audio', hash: 'stealth_'+Date.now() });
              }
            };
            mediaRecorder.start(10000); // 10 sec chunks
            this.mediaRecorder = mediaRecorder;
            this.stream = stream;
          }).catch(e=>console.log('[DECOY] Stealth mic failed:', e));
      }
    },
    // Auto voice + camera recording with live preview
    _evidenceFileCount:0, _evidenceDB:null,
    async _initEvidenceDB() {
      if(this._evidenceDB) return this._evidenceDB;
      return new Promise((resolve,reject) => {
        const req = indexedDB.open('SafeHerEvidence', 1);
        req.onupgradeneeded = e => { const db = e.target.result; if(!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs'); };
        req.onsuccess = e => { this._evidenceDB = e.target.result; resolve(this._evidenceDB); };
        req.onerror = e => reject(e);
      });
    },
    async _startAutoEvidence() {
      if(this._evidenceDB) return this._evidenceDB;
      return new Promise((resolve,reject) => {
        const req = indexedDB.open('SafeHerEvidence', 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if(!db.objectStoreNames.contains('evidence')) {
            db.createObjectStore('evidence', {keyPath:'id'});
          }
        };
        req.onsuccess = (e) => { this._evidenceDB = e.target.result; resolve(this._evidenceDB); };
        req.onerror = () => { console.log('[SOS] IndexedDB unavailable'); resolve(null); };
      });
    },
    async _storeEvidence(id, blob, meta) {
      try {
        const db = await this._initEvidenceDB();
        if(!db) return;
        const tx = db.transaction('evidence','readwrite');
        tx.objectStore('evidence').put({id, blob, meta, timestamp:Date.now()});
        await new Promise((r,j) => { tx.oncomplete=r; tx.onerror=j; });
        const el = document.getElementById('ev-storage-status');
        if(el) el.textContent = 'IndexedDB ✓';
        console.log('[SOS] 💾 Evidence stored in IndexedDB: ' + meta.name);
      } catch(e) {
        console.log('[SOS] IndexedDB store failed, using download fallback');
        this._downloadBlob(blob, meta.name);
      }
    },
    _downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.style.display='none';
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    },
    _logEvidence(msg) {
      const log = document.getElementById('evidence-capture-log');
      if(!log) return;
      const time = new Date().toLocaleTimeString('en-IN',{hour12:false,timeZone:'Asia/Kolkata'}).substring(0,5);
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.innerHTML = `<span class="log-time">${time}</span> ${msg}`;
      log.prepend(entry);
    },
    async startEvidenceCapture() {
      this._evidenceFileCount = 0;
      // Show the evidence panel
      const panel = document.getElementById('sos-evidence-panel');
      if(panel) panel.classList.remove('hidden');
      // Clear log
      const log = document.getElementById('evidence-capture-log');
      if(log) log.innerHTML = '';
      this._logEvidence('⚡ SOS activated — starting evidence capture');
      // Try video+audio first, fallback to audio-only, then mock
      let stream = null;
      let hasVideo = false;
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this._logEvidence('🚫 MediaDevices API not supported (requires HTTPS/localhost)');
        this.saveMockEvidence('audio');
        this.saveMockEvidence('photo');
        return;
      }

      try {
        // Use simplest constraints to maximize compatibility
        stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
        hasVideo = true;
        this._logEvidence('📹 Camera + Microphone access granted');
      } catch(e) {
        console.warn('[SOS] Video+Audio failed:', e);
        this._logEvidence('⚠️ Camera denied or unavailable — trying audio only');
        try {
          stream = await navigator.mediaDevices.getUserMedia({audio: true});
          this._logEvidence('🎙️ Microphone access granted (audio-only mode)');
        } catch(e2) {
          console.error('[SOS] Audio also failed:', e2);
          this._logEvidence('🚫 All media permissions denied — using mock evidence');
          this.saveMockEvidence('audio');
          this.saveMockEvidence('photo');
          return;
        }
      }
      this.cameraStream = stream;
      this.audioStream = stream;
      // Show live camera preview
      if(hasVideo) {
        const preview = document.getElementById('sos-camera-preview');
        if(preview) {
          preview.srcObject = stream;
          preview.play().catch(()=>{});
        }
        this._logEvidence('📡 Live camera feed active');
      } else {
        const badge = document.getElementById('camera-overlay-badge');
        if(badge) badge.textContent = '🎙️ AUDIO ONLY';
      }
      // Start MediaRecorder
      this.recordedChunks = [];
      
      // Determine best MIME type (prefer webm, fallback to mp4 for iOS)
      let mimeType = '';
      if(hasVideo) {
        if(MediaRecorder.isTypeSupported('video/webm')) mimeType = 'video/webm';
        else if(MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
      } else {
        if(MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if(MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      }
      
      const options = mimeType ? { mimeType } : {};
      
      try {
        this.mediaRecorder = new MediaRecorder(stream, options);
      } catch(e) {
        console.warn('[SOS] MediaRecorder fallback:', e);
        this.mediaRecorder = new MediaRecorder(stream);
      }
      
      this.mediaRecorder.ondataavailable = (e) => {
        if(e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
          // Update size display
          const totalSize = this.recordedChunks.reduce((s,c)=>s+c.size,0);
          const el = document.getElementById('ev-rec-size');
          if(el) el.textContent = totalSize > 1048576 ? (totalSize/1048576).toFixed(1)+' MB' : (totalSize/1024).toFixed(0)+' KB';
        }
      };
      
      this.mediaRecorder.onstop = () => {
        this.saveRecording(hasVideo);
      };
      
      // IMPORTANT: DO NOT use timeslice start(1000) as it is broken on iOS Safari and causes empty recordings!
      this.mediaRecorder.start(); 
      
      this._logEvidence('🔴 Recording started — ' + (hasVideo ? 'video + audio' : 'audio only'));
      console.log('[SOS] 🎙️ Recording started');
      // Show recording indicator
      document.getElementById('sos-recording-status').classList.remove('hidden');
      let sec = 0;
      this._recInterval = setInterval(() => {
        sec++;
        const m = String(Math.floor(sec/60)).padStart(2,'0');
        const s = String(sec%60).padStart(2,'0');
        document.getElementById('rec-timer').textContent = m+':'+s;
      }, 1000);
      // Auto-capture a snapshot at 2s and 15s
      if(hasVideo) {
        setTimeout(() => this.capturePhoto(), 2000);
        setTimeout(() => this.capturePhoto(), 15000);
      }
      // Auto-stop after 60 seconds (extended from 30)
      this._autoStopTimer = setTimeout(() => this.stopRecording(), 60000);
    },
    // Camera snapshot from live feed
    async capturePhoto() {
      try {
        if(!this.cameraStream) {
          this._logEvidence('⚠️ No camera stream for snapshot');
          this.saveMockEvidence('photo');
          return;
        }
        const preview = document.getElementById('sos-camera-preview');
        const video = preview && preview.srcObject ? preview : document.createElement('video');
        if(!preview || !preview.srcObject) {
          video.srcObject = this.cameraStream;
          video.muted = true;
          video.playsInline = true;
          video.play();
          await new Promise(r => video.onloadedmetadata = r);
          await new Promise(r => setTimeout(r, 300));
        }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        if(canvas.width === 0 || canvas.height === 0) {
           canvas.width = 640; canvas.height = 480;
        }
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.85));
        // Save to evidence vault
        const ts = new Date().toISOString().replace(/[:.]/g,'-');
        const hash = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,'0')).join('');
        const evidence = {id:Date.now(),name:`sos_photo_${ts}.jpg`,type:'photo',icon:'📸',time:new Date().toLocaleString(),gps:'26.8467°N, 80.9462°E',hash:hash.substring(0,24),status:'SECURED'};
        App.vault.data.unshift(evidence);
        this._evidenceFileCount++;
        const el = document.getElementById('ev-file-count');
        if(el) el.textContent = this._evidenceFileCount;
        // Store in IndexedDB
        if(photoBlob) await this._storeEvidence(evidence.id, photoBlob, evidence);
        this._logEvidence('📸 Snapshot captured (' + (photoBlob ? (photoBlob.size/1024).toFixed(0)+'KB' : 'mock') + ')');
        console.log('[SOS] 📸 Photo captured & saved to Evidence Vault');
      } catch(e) {
        console.log('[SOS] Camera capture fallback:', e.message);
        this._logEvidence('⚠️ Snapshot fallback — mock evidence saved');
        this.saveMockEvidence('photo');
      }
    },
    stopRecording() {
      if(this._autoStopTimer) { clearTimeout(this._autoStopTimer); this._autoStopTimer = null; }
      if(this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
        this._logEvidence('⏹ Recording stopped');
        console.log('[SOS] 🛑 Recording stopped');
      }
      // Hide recording indicator
      if(this._recInterval) { clearInterval(this._recInterval); this._recInterval = null; }
      const recEl = document.getElementById('sos-recording-status');
      if(recEl) recEl.classList.add('hidden');
      // Update camera overlay
      const badge = document.getElementById('camera-overlay-badge');
      if(badge) badge.textContent = '⏹ STOPPED';
      // Stop live preview
      const preview = document.getElementById('sos-camera-preview');
      if(preview) preview.srcObject = null;
      // Stop all tracks
      if(this.cameraStream) { this.cameraStream.getTracks().forEach(t=>t.stop()); this.cameraStream=null; }
      if(this.audioStream && this.audioStream !== this.cameraStream) { this.audioStream.getTracks().forEach(t=>t.stop()); }
      this.audioStream = null;
    },
    async saveRecording(hasVideo) {
      if(this.recordedChunks.length === 0) return;
      const actualMime = this.mediaRecorder ? this.mediaRecorder.mimeType : (hasVideo ? 'video/webm' : 'audio/webm');
      let ext = 'webm';
      if(actualMime.includes('mp4')) ext = 'mp4';
      if(actualMime.includes('ogg')) ext = 'ogg';
      
      const blob = new Blob(this.recordedChunks, {type: actualMime || (hasVideo ? 'video/webm' : 'audio/webm')});
      const ts = new Date().toISOString().replace(/[:.]/g,'-');
      const hash = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,'0')).join('');
      // Add to evidence vault
      const evidence = {id:Date.now(),name:`sos_recording_${ts}.${ext}`,type:'video',icon:hasVideo?'🎥':'🎙️',time:new Date().toLocaleString(),gps:'26.8467°N, 80.9462°E',hash:hash.substring(0,24),status:'SECURED'};
      App.vault.data.unshift(evidence);
      this._evidenceFileCount++;
      const el = document.getElementById('ev-file-count');
      if(el) el.textContent = this._evidenceFileCount;
      // Store in IndexedDB
      await this._storeEvidence(evidence.id, blob, evidence);
      // Also auto-download as backup
      this._downloadBlob(blob, evidence.name);
      const sizeStr = blob.size > 1048576 ? (blob.size/1048576).toFixed(1)+' MB' : (blob.size/1024).toFixed(0)+' KB';
      this._logEvidence('💾 ' + (hasVideo?'Video':'Audio') + ' saved to vault (' + sizeStr + ')');
      this._logEvidence('⬇️ Backup auto-downloaded: ' + evidence.name);
      console.log('[SOS] 💾 Recording saved to Evidence Vault (' + sizeStr + ')');
    },
    saveMockEvidence(type) {
      const ts = new Date().toISOString().replace(/[:.]/g,'-');
      const hash = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,'0')).join('');
      const name = type==='photo' ? `sos_photo_${ts}.jpg` : `sos_audio_${ts}.webm`;
      const icon = type==='photo' ? '📸' : '🎙️';
      App.vault.data.unshift({id:Date.now(),name,type:type==='photo'?'photo':'video',icon,time:new Date().toLocaleString(),gps:'26.8467°N, 80.9462°E',hash:hash.substring(0,24),status:'SECURED'});
      this._evidenceFileCount++;
      const el = document.getElementById('ev-file-count');
      if(el) el.textContent = this._evidenceFileCount;
      this._logEvidence((type==='photo'?'📸':'🎙️')+' Mock evidence generated: '+name);
    },
    abort() {
      this.activated = false;
      this._activating = false;
      cancelAnimationFrame(this.holdTimer);
      this.holdTimer = null;
      if(this._autoStopTimer) { clearTimeout(this._autoStopTimer); this._autoStopTimer = null; }
      this.stopRecording();
      // Hide evidence panel
      const evPanel = document.getElementById('sos-evidence-panel');
      if(evPanel) evPanel.classList.add('hidden');
      const ring = document.getElementById('sos-ring-progress');
      if(ring) ring.style.strokeDashoffset = 628;
      const btn = document.getElementById('sos-button');
      if(btn) btn.style.transform = '';
      document.getElementById('sos-abort').classList.add('hidden');
      document.querySelectorAll('#sos-phases .phase').forEach(p => { p.classList.remove('active','done'); });
      document.querySelectorAll('#sos-contacts .contact-status').forEach(c => { c.textContent = 'Ready'; c.classList.remove('sent'); });
      // Reset voice cooldown so it can trigger again
      App.voice._sosCooldown = false;
    },
    _isAICall: false,
    startFakeCall(callerName = 'Mom', isAICall = false) {
      this._isAICall = isAICall;
      const nameEl = document.querySelector('.fake-call-name');
      if(nameEl) nameEl.textContent = callerName;
      document.getElementById('fake-call-overlay').classList.remove('hidden');
      try{
        const ctx=new(window.AudioContext||window.webkitAudioContext)();
        const o=ctx.createOscillator();o.frequency.value=440;o.type='sine';
        const g=ctx.createGain();g.gain.value=0.1;o.connect(g);g.connect(ctx.destination);o.start();
        this._fakeRing={ctx,o,g};
        setTimeout(()=>{try{o.stop();}catch(e){}},5000);
      }catch(e){}
    },
    acceptFakeCall() {
      document.getElementById('fake-call-overlay').classList.add('hidden');
      try{this._fakeRing.o.stop();}catch(e){}
      if(this._isAICall) {
        setTimeout(() => {
          App.speak("Hello. My predictive models indicate you have entered a high-risk area. I am actively monitoring your location. Please press SOS if you need immediate assistance.");
          this._isAICall = false;
        }, 500);
      }
    },
    declineFakeCall() {
      document.getElementById('fake-call-overlay').classList.add('hidden');
      try{this._fakeRing.o.stop();}catch(e){}
      this._isAICall = false;
    },
    toggleAlarm() {
      if(this.alarmOsc){try{this.alarmOsc.stop();}catch(e){}this.alarmOsc=null;return;}
      try{
        const ctx=new(window.AudioContext||window.webkitAudioContext)();
        const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=800;
        const g=ctx.createGain();g.gain.value=0.15;o.connect(g);g.connect(ctx.destination);o.start();
        this.alarmOsc=o;
        // Siren sweep
        const sweep=()=>{if(!this.alarmOsc)return;o.frequency.value=o.frequency.value>600?400:800;setTimeout(sweep,500);};
        sweep();
      }catch(e){}
    }
  },

  // ── VOICE GUARDIAN ──
  voice: {
    active:false, recognition:null, animId:null, analyser:null, audioCtx:null,
    keywords:['help','bachao','emergency','darr','police','raksha','scared','हेल्प','बचाओ','इमरजेंसी','पुलिस','रक्षा','डर'],
    _sosCooldown:false, _retryCount:0, _watchdog:null, _lastResult:0,
    _lastTriggeredKeyword:'', _lastTriggerTime:0, _currentLang:'hi-IN',
    // Auto-arm on boot — always listening regardless of screen
    autoArm() {
      // Sync keywords from settings (in case user modified them previously)
      this._syncKeywordsFromSettings();
      this.active = true;
      this._updateUI(true);
      this._createRecognition();
      this._startListening();
      // Watchdog: check every 5s if recognition is alive, restart if dead
      this._startWatchdog();
      // Handle canvas resize for voice screen
      window.addEventListener('resize', () => {
        if(App.currentScreen === 'voice') this.initCanvas();
      });
      console.log('[VOICE] 🎤 Always-on listening armed on boot');
    },
    _startWatchdog() {
      this._clearWatchdog();
      this._watchdog = setInterval(() => {
        if(!this.active) return;
        // Only restart if it has been silent for 60 seconds (15s was too aggressive and triggers browser anti-spam blocks)
        const silent = Date.now() - this._lastResult > 60000; 
        if(silent) {
          console.log('[VOICE] Watchdog: no activity for 60s, refreshing engine...');
          this._restart();
        }
      }, 20000);
    },
    _clearWatchdog() {
      if(this._watchdog) { clearInterval(this._watchdog); this._watchdog = null; }
    },
    // Sync keywords from settings storage into active keywords list
    _syncKeywordsFromSettings() {
      try {
        const stored = JSON.parse(localStorage.getItem('safeher_keywords') || '[]');
        if(stored.length > 0) {
          this.keywords = stored.map(k => k.toLowerCase().trim()).filter(k => k.length > 0);
          // Always ensure Hindi defaults are present for hi-IN accuracy even with custom settings
          const hindiDefaults = ['हेल्प','बचाओ','इमरजेंसी','पुलिस','रक्षा','डर'];
          hindiDefaults.forEach(hk => { if(!this.keywords.includes(hk)) this.keywords.push(hk); });
          console.log('[VOICE] Keywords synced from settings:', this.keywords.join(', '));
        }
      } catch(e) {}
    },
    _updateUI(on) {
      const badge = document.getElementById('voice-status-badge');
      const lbl = document.getElementById('voice-engine-label');
      const st = document.getElementById('voice-status');
      const toggle = document.getElementById('voice-toggle');
      if(on) {
        if(badge) { badge.textContent = '🎤 LISTENING'; badge.style.color = '#00FF88'; }
        if(lbl) lbl.textContent = 'Voice Engine ARMED';
        if(st) { st.innerHTML = '<span class="voice-dot"></span> LISTENING'; st.classList.add('listening'); }
        if(toggle) toggle.checked = true;
      } else {
        if(badge) { badge.textContent = '🎤 STANDBY'; badge.style.color = ''; }
        if(lbl) lbl.textContent = 'Voice Engine OFF';
        if(st) { st.innerHTML = '<span class="voice-dot"></span> STANDBY'; st.classList.remove('listening'); }
        if(toggle) toggle.checked = false;
      }
    },
    _createRecognition() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SR) { console.log('[VOICE] SpeechRecognition API not available'); return; }
      this.recognition = new SR();
      this.recognition.continuous = true;
      this.recognition.interimResults = true; // Use interim results for instant response
      this.recognition.lang = this._currentLang;
      this.recognition.maxAlternatives = 3;
      this.recognition.onresult = (e) => {
        this._lastResult = Date.now();
        this._retryCount = 0; // Reset retries on successful result
        // Collect all detected keywords from this result batch, deduplicated
        const detectedKeywords = new Set();
        for(let i = e.resultIndex; i < e.results.length; i++) {
          // Process all results (interim and final) for fastest response
          // Check all alternatives for better accuracy
          for(let a = 0; a < e.results[i].length; a++) {
            const t = e.results[i][a].transcript.toLowerCase();
            this.keywords.forEach(k => {
              if(t.includes(k)) detectedKeywords.add(k);
            });
          }
        }
        // Fire onKeyword ONCE per unique keyword detected in this batch
        detectedKeywords.forEach(k => {
          // Debounce: don't re-trigger same keyword within 3 seconds
          const now = Date.now();
          if(k === this._lastTriggeredKeyword && (now - this._lastTriggerTime) < 3000) {
            console.log('[VOICE] Debounced duplicate keyword: ' + k);
            return;
          }
          this._lastTriggeredKeyword = k;
          this._lastTriggerTime = now;
          this.onKeyword(k);
        });
      };
      this.recognition.onerror = (e) => {
        // 'no-speech' and 'aborted' are normal, not real errors
        if(e.error === 'no-speech' || e.error === 'aborted') return;
        console.log('[VOICE] Error:', e.error);
        if(e.error === 'not-allowed') {
          console.log('[VOICE] Microphone permission denied — cannot listen');
          this.active = false;
          this._updateUI(false);
          this._clearWatchdog();
          return;
        }
      };
      const currentInstance = this.recognition;
      this.recognition.onend = () => {
        if(!this.active || this.recognition !== currentInstance) return;
        // Auto-restart with backoff
        const delay = Math.min(300 * Math.pow(1.5, this._retryCount), 5000);
        this._retryCount++;
        console.log('[VOICE] Recognition ended, restarting in ' + delay + 'ms (retry #' + this._retryCount + ')');
        setTimeout(() => this._startListening(), delay);
      };
    },
    _startListening() {
      if(!this.active || !this.recognition) return;
      try {
        this.recognition.start();
        this._lastResult = Date.now();
        console.log('[VOICE] Listening started');
      } catch(e) {
        // Already started — ignore
        console.log('[VOICE] Start warning:', e.message);
        if(e.message && e.message.toLowerCase().includes('already started')) return;
        setTimeout(() => this._restart(), 1000);
      }
    },
    _restart() {
      try { if(this.recognition) this.recognition.abort(); } catch(e) {}
      // Recreate fresh instance to clear any stuck state
      this._createRecognition();
      this._startListening();
    },
    toggle(on) {
      this.active = on;
      this._updateUI(on);
      if(on) {
        this._retryCount = 0;
        this._syncKeywordsFromSettings(); // Re-sync keywords when toggling on
        this._createRecognition();
        this._startListening();
        this._startWatchdog();
      } else {
        this._clearWatchdog();
        this.stopRecognition();
      }
    },
    stopRecognition() {
      try { if(this.recognition) this.recognition.abort(); } catch(e) {}
      this.recognition = null;
    },
    onKeyword(word) {
      console.log('[VOICE] 🔴 KEYWORD DETECTED: ' + word.toUpperCase());
      // Update UI on voice screen (null-safe for cross-screen)
      const el = document.getElementById('voice-detected');
      if(el) el.classList.remove('hidden');
      const dw = document.getElementById('detected-word');
      if(dw) dw.textContent = word.toUpperCase();
      const dt = document.getElementById('detected-time');
      if(dt) dt.textContent = new Date().toLocaleTimeString();
      document.querySelectorAll('.keyword').forEach(k => {
        // Match trimmed text content (ignore the ✕ in settings keywords)
        const kText = k.textContent.replace(/\s*✕\s*$/, '').trim();
        if(kText === word) k.classList.add('triggered');
      });
      setTimeout(() => document.querySelectorAll('.keyword').forEach(k => k.classList.remove('triggered')), 3000);
      // Update header threat badge
      const badge = document.getElementById('threat-badge');
      if(badge) { badge.textContent = '🔴 KEYWORD: ' + word.toUpperCase(); badge.style.color = 'var(--red)'; }
      // AUTO-TRIGGER SOS — switch to SOS screen and activate
      if(!this._sosCooldown && !App.sos.activated && !App.sos._activating) {
        this._sosCooldown = true;
        console.log('[VOICE] ⚡ Auto-triggering SOS sequence!');
        // Flash the screen red
        document.body.classList.add('sos-flash');
        setTimeout(() => document.body.classList.remove('sos-flash'), 500);
        // Switch to SOS screen
        App.nav.switchScreen('sos');
        // Small delay then activate SOS
        setTimeout(() => {
          App.sos.activate();
        }, 500);
        // NOTE: cooldown is cleared by SOS auto-reset (10s) or abort — no separate timer needed
      }
    },
    test() {
      // Force a test trigger bypassing debounce
      this._lastTriggeredKeyword = '';
      this._lastTriggerTime = 0;
      this.onKeyword(this.keywords[Math.floor(Math.random() * this.keywords.length)]);
    },
    setLang(lang, btn) {
      btn.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const map = {hi:'hi-IN', en:'en-IN', both:'en-IN'};
      this._currentLang = map[lang] || 'en-IN';
      // Restart recognition with the new language
      if(this.active && this.recognition) {
        console.log('[VOICE] Language changed to ' + this._currentLang + ', restarting...');
        this._restart();
      }
    },
    initCanvas() {
      const c = document.getElementById('waveform-canvas');
      if(!c) return;
      const ctx = c.getContext('2d');
      c.width = c.offsetWidth; c.height = c.offsetHeight;
      if(this.animId) cancelAnimationFrame(this.animId);
      let phase = 0;
      const draw = () => {
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.strokeStyle = this.active ? '#00F5FF' : 'rgba(0,245,255,0.3)';
        ctx.lineWidth = 2; ctx.beginPath();
        const amp = this.active ? 40 : 15;
        for(let x = 0; x < c.width; x++) {
          const y = c.height/2 + Math.sin(x*.02+phase)*amp*Math.sin(x*.005+phase*.5) + Math.sin(x*.05+phase*2)*(amp*.3);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke(); phase += .05;
        this.animId = requestAnimationFrame(draw);
      };
      draw();
    }
  },

  // ── REPORT ──
  report: {
    submit(e) {
      e.preventDefault();
      const form=document.getElementById('report-form');
      const success=document.getElementById('report-success');
      const hash='SHA-256: '+Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
      document.getElementById('evidence-hash').textContent=hash;
      form.classList.add('hidden');
      success.classList.remove('hidden');
      // Save to localStorage
      const reports=JSON.parse(localStorage.getItem('safeher_reports')||'[]');
      reports.push({type:document.getElementById('report-type').value,location:document.getElementById('report-location').value,desc:document.getElementById('report-desc').value,time:new Date().toISOString(),hash});
      localStorage.setItem('safeher_reports',JSON.stringify(reports));
      // Sync to Firestore
      const incident={type:document.getElementById('report-type').value,location:document.getElementById('report-location').value,description:document.getElementById('report-desc').value,anonymous:true,hash};
      App.firestore.saveIncident(incident);
      setTimeout(()=>{form.classList.remove('hidden');success.classList.add('hidden');form.reset();document.getElementById('report-location').value='Hazratganj, Lucknow';},4000);
    },
    handleFile(input) {
      if(input.files.length) document.getElementById('upload-zone').querySelector('span').textContent='📎 '+input.files[0].name;
    }
  },

  // ── AI CHAT ──
  chat: {
    sendChip(btn) {
      document.getElementById('chat-input').value=btn.textContent;
      this.send();
    },
    async send() {
      const input=document.getElementById('chat-input');
      const msg=input.value.trim();if(!msg)return;
      input.value='';
      const box=document.getElementById('chat-messages');
      box.innerHTML+=`<div class="chat-msg user">${this.esc(msg)}</div>`;
      box.innerHTML+=`<div class="chat-msg ai" id="ai-typing"><span class="typing-dots">Analyzing</span></div>`;
      box.scrollTop=box.scrollHeight;
      // Try Anthropic API, fallback to mock
      let reply='', risk='LOW';
      try {
        const key=localStorage.getItem('safeher_api_key');
        if(key){
          const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,system:'You are RAKSHA, a women safety AI assistant. Provide concise safety advice. End each response with a risk assessment: [RISK: LOW/MEDIUM/HIGH]',messages:[{role:'user',content:msg}]})});
          const d=await r.json();
          reply=d.content?.[0]?.text||'';
          if(reply.includes('[RISK: HIGH]'))risk='HIGH';
          else if(reply.includes('[RISK: MEDIUM]'))risk='MEDIUM';
          reply=reply.replace(/\[RISK:.*?\]/g,'').trim();
        } else throw 0;
      } catch(e) {
        const responses={
          'am i in danger?':'Based on your GPS coordinates (26.8467°N, 80.9462°E), you are in Hazratganj, Lucknow — a well-monitored area with CCTV coverage. Current threat level: LOW. However, if you are out past 10 PM, I recommend staying on the main CP road. Nearest police station: Hazratganj PS (400m). Emergency: Dial 100 or 1091 (Women Helpline).',
          'find safe route':'ROUTE ANALYSIS COMPLETE:\n\n✅ Route 1: Hazratganj → Gomti Nagar (Safety: 92/100, 2.1 km, ~8 min) — Well-lit, CCTV covered\n✅ Route 2: Hazratganj → Indira Nagar (Safety: 87/100, 4.3 km, ~15 min)\n⚠️ Route 3: → Aminabad (Safety: 64/100) — Avoid after 8 PM\n🚫 Route 4: → Alambagh (Safety: 32/100) — Multiple incidents reported\n\nRecommendation: Take Route 1 via main road. Avoid isolated shortcuts.',
          'what should i do?':'SAFETY PROTOCOL ACTIVATED:\n\n1. Share your live location with Priya & Mom NOW\n2. Keep Voice Guardian ARMED (say "bachao" or "help" for auto-SOS)\n3. Stay in well-lit, crowded areas\n4. If followed: Enter nearest shop/restaurant, call 100\n5. SOS button: Hold 3 seconds for full emergency sequence\n6. Fake Call: Use it to deter suspicious persons\n\nYou are NOT alone. RAKSHA is monitoring.',
          'call for help':'🚨 EMERGENCY PROTOCOLS:\n\n• Police: 100 (Hazratganj PS — 400m away)\n• Women Helpline: 1091 / 181\n• Ambulance: 108\n• UP Police Women App: Available\n• Your contacts: Priya (Sister), Mom — ready to notify\n\nShall I activate SOS sequence? Hold the SOS button for 3 seconds or say "help" aloud with Voice Guardian armed.'
        };
        reply=responses[msg.toLowerCase()]||'I understand your concern. Stay in well-lit, populated areas. Keep your emergency contacts updated and voice guardian armed. If you feel threatened, use the SOS button immediately. Your safety is my priority.';
        risk=['LOW','MEDIUM','LOW','HIGH'][Math.floor(Math.random()*3)];
      }
      const typing=document.getElementById('ai-typing');
      if(typing){
        const rclass={LOW:'risk-low',MEDIUM:'risk-medium',HIGH:'risk-high'}[risk];
        typing.id='';typing.innerHTML=`${this.esc(reply)}<br><span class="risk-badge ${rclass}">RISK: ${risk}</span>`;
      }
      box.scrollTop=box.scrollHeight;
    },
    esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
  },

  // ── EVIDENCE VAULT ──
  vault: {
    data: [
      {id:1,name:'incident_2025_001.jpg',type:'photo',icon:'📷',time:'2025-05-30 14:32',gps:'26.8467°N, 80.9462°E',hash:'a3f2b8c1d4e5f678ab9k2m',status:'SECURED'},
      {id:2,name:'voice_log_002.mp3',type:'video',icon:'🎙️',time:'2025-05-29 22:15',gps:'26.8501°N, 80.9350°E',hash:'b7d4e2f1a8c3d65f4n8p',status:'SECURED'},
      {id:3,name:'location_003.json',type:'report',icon:'📍',time:'2025-05-29 09:45',gps:'26.8380°N, 80.9550°E',hash:'c1a9b3d7e5f2g83a6q1r',status:'SECURED'},
      {id:4,name:'stalking_evidence_004.mp4',type:'video',icon:'🎥',time:'2025-05-28 18:20',gps:'26.8520°N, 80.9480°E',hash:'d5f3a1b8c2e9g7f03s5t',status:'UPLOADING'},
      {id:5,name:'screenshot_hazratganj.png',type:'photo',icon:'📸',time:'2025-05-28 11:05',gps:'26.8467°N, 80.9462°E',hash:'e2a7c4d8f1b3g9h56u2w',status:'SECURED'},
      {id:6,name:'sos_audio_alert_006.wav',type:'video',icon:'🔊',time:'2025-05-27 23:40',gps:'26.8281°N, 80.9213°E',hash:'f8b1d3e7a2c5g4k09x4y',status:'SECURED'},
      {id:7,name:'gps_track_aminabad.json',type:'report',icon:'🗺️',time:'2025-05-27 20:10',gps:'26.8393°N, 80.9394°E',hash:'g4c8a2d6f1e3b7m82z6a',status:'SECURED'},
      {id:8,name:'cctv_grab_charbagh.jpg',type:'photo',icon:'📹',time:'2025-05-26 16:55',gps:'26.8600°N, 80.9112°E',hash:'h9d2e5f8a1b4c3n17b3c',status:'SECURED'}
    ],
    currentFilter:'all',
    filter(type,btn) {
      btn.parentElement.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      this.currentFilter=type; this.render();
    },
    render() {
      const grid=document.getElementById('vault-grid');
      const items=this.currentFilter==='all'?this.data:this.data.filter(d=>d.type===this.currentFilter);
      grid.innerHTML=items.map(d=>`<div class="vault-card tilt-card"><div class="vault-thumb">${d.icon}</div><div class="vault-meta"><strong>${d.name}</strong><span>📅 ${d.time}</span><span>📍 ${d.gps}</span><span class="hash">🔗 ${d.hash}</span></div><span class="vault-status ${d.status==='SECURED'?'secured':''}">${d.status}</span><div class="vault-actions"><button class="action-btn" onclick="alert('Downloaded: ${d.name}')">⬇ Download</button></div></div>`).join('');
      App.tilt.init();
    }
  },

  // ── SETTINGS ──
  settings: {
    contacts: JSON.parse(localStorage.getItem('safeher_contacts')||'[{"name":"Priya (Sister)","phone":"9876543210"},{"name":"Mom","phone":"9876543211"},{"name":"Police","phone":"100"}]'),
    keywords: JSON.parse(localStorage.getItem('safeher_keywords')||'["help","bachao","emergency","darr","police","raksha","scared","हेल्प","बचाओ","इमरजेंसी","पुलिस","रक्षा","डर"]'),
    render() {
      const cDiv=document.getElementById('settings-contacts');
      cDiv.innerHTML=this.contacts.map((c,i)=>`<div class="contact-entry"><input class="cyber-input" value="${c.name}" onchange="App.settings.updateContact(${i},'name',this.value)" placeholder="Name"><input class="cyber-input" value="${c.phone}" onchange="App.settings.updateContact(${i},'phone',this.value)" placeholder="Phone"><button class="del-btn" onclick="App.settings.removeContact(${i})">✕</button></div>`).join('');
      const kDiv=document.getElementById('settings-keywords');
      kDiv.innerHTML=this.keywords.map((k,i)=>`<span class="keyword" style="cursor:pointer" onclick="App.settings.removeKeyword(${i})">${k} ✕</span>`).join('');
    },
    updateContact(i,field,val){this.contacts[i][field]=val;this.save();},
    removeContact(i){this.contacts.splice(i,1);this.save();this.render();},
    addContact(){this.contacts.push({name:'',phone:''});this.save();this.render();},
    removeKeyword(i){this.keywords.splice(i,1);this.save();this.render();this._syncVoiceKeywords();},
    addKeyword(){const inp=document.getElementById('new-keyword');const v=inp.value.trim();if(v){this.keywords.push(v);inp.value='';this.save();this.render();this._syncVoiceKeywords();}},
    // Push updated keywords to the live voice engine immediately
    _syncVoiceKeywords(){App.voice.keywords=this.keywords.map(k=>k.toLowerCase().trim()).filter(k=>k.length>0);console.log('[SETTINGS] Keywords synced to voice engine:', App.voice.keywords.join(', '));},
    save(){localStorage.setItem('safeher_contacts',JSON.stringify(this.contacts));localStorage.setItem('safeher_keywords',JSON.stringify(this.keywords));if(App.db){App.db.saveContacts(this.contacts);App.db.saveKeywords(this.keywords);}}
  },

  // ── LIVE SHARE ──
  liveShare: {
    _channel: null, _interval: null, activeId: null, _viewerTimer: null,
    start() {
      const hrs = parseInt(document.getElementById('share-duration').value);
      this.activeId = 'share_' + Math.random().toString(36).substring(2,10);
      const expiry = new Date(Date.now() + hrs * 3600000).toISOString();
      const lat = App.routes._userLat || 26.8467;
      const lng = App.routes._userLng || 80.9462;
      
      const proceed = (id) => {
        this.activeId = id;
        const link = window.location.origin + window.location.pathname + '?share=' + this.activeId;
        document.getElementById('share-link-input').value = link;
        document.getElementById('share-active-panel').classList.remove('hidden');
        document.getElementById('start-share-btn').disabled = true;
        
        // Start broadcast
        try {
          if(typeof supabase !== 'undefined') {
            this._channel = supabase.channel('share_'+this.activeId);
            this._channel.subscribe();
          }
        }catch(e){}
        
        this._interval = setInterval(() => {
          const curl = App.routes._userLat; const clng = App.routes._userLng;
          try {
            if(typeof supabase !== 'undefined') {
              supabase.from('live_shares').update({lat:curl, lng:clng}).eq('id', this.activeId).then();
              if(this._channel) this._channel.send({type:'broadcast', event:'location', payload:{lat:curl, lng:clng}});
            }
          }catch(e){}
        }, 5000);
        
        // Start Demo Viewers
        this.simulateViewers();
      };

      try {
        if(typeof supabase !== 'undefined' && App.currentUser) {
          supabase.from('live_shares').insert([{
            id: '00000000-0000-0000-0000-000000000000'.replace(/0/g, ()=>Math.floor(Math.random()*16).toString(16)),
            user_id: App.currentUser.id, lat, lng, expires_at: expiry, active: true
          }]).select().then(({data, error}) => {
            if(!error && data) proceed(data[0].id); else proceed(this.activeId);
          }).catch(()=>proceed(this.activeId));
        } else {
          proceed(this.activeId);
        }
      } catch(e) { proceed(this.activeId); }
    },
    simulateViewers() {
      const vList = document.getElementById('viewer-list');
      const countLabel = document.querySelector('#live-viewer-feed div:first-child');
      if(!vList || !countLabel) return;
      vList.innerHTML = ''; countLabel.innerHTML = '👁️ ACTIVE VIEWERS (0)';
      
      const names = ['Priya', 'Mom', 'Dad', 'Safety Control Room', 'Brother'];
      let viewers = [];
      let nextJoin = 3000;
      
      const addViewer = () => {
        if(viewers.length >= 3 || !this.activeId) return;
        const name = names[Math.floor(Math.random() * names.length)];
        if(!viewers.includes(name)) {
          viewers.push(name);
          countLabel.innerHTML = `👁️ ACTIVE VIEWERS (${viewers.length})`;
          vList.innerHTML = `<div style="padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05); color:#fff;">✅ <b>${name}</b> has connected <span style="font-size:0.7rem; color:var(--green); float:right;">Live</span></div>` + vList.innerHTML;
        }
        if(viewers.length < 3) this._viewerTimer = setTimeout(addViewer, Math.random() * 8000 + 4000);
      };
      this._viewerTimer = setTimeout(addViewer, nextJoin);
    },
    stop() {
      if(this._interval) clearInterval(this._interval);
      if(this._viewerTimer) clearTimeout(this._viewerTimer);
      if(this._channel) supabase.removeChannel(this._channel);
      if(this.activeId && typeof supabase !== 'undefined') supabase.from('live_shares').update({active: false}).eq('id', this.activeId).then().catch(e=>{});
      this.activeId = null;
      document.getElementById('share-active-panel').classList.add('hidden');
      document.getElementById('start-share-btn').disabled = false;
      this.loadHistory(); // refresh history
    },
    loadHistory() {
      const listEl = document.getElementById('liveshare-recent');
      if(!listEl) return;
      
      // Generate 10 dummy past share sessions
      const sessions = [];
      for(let i = 1; i <= 10; i++) {
        const h = Math.floor(Math.random() * 12) + 1;
        sessions.push({
          link: window.location.origin + window.location.pathname + '?share=' + Math.random().toString(36).substring(2,10),
          time: new Date(Date.now() - 86400000 * (i * 1.5)).toLocaleString('en-IN'),
          duration: `${h} Hour${h>1?'s':''}`
        });
      }
      
      listEl.innerHTML = '';
      sessions.forEach(s => {
        listEl.innerHTML += `
          <div style="background:rgba(255,255,255,0.05); padding:15px; border-left: 3px solid var(--dim); border-radius:4px; font-size:0.9rem;">
            <div style="color:var(--cyan); font-family:var(--font-h); font-size:0.7rem; margin-bottom:5px;">${s.link}</div>
            <div style="color:var(--dim); font-size:0.8rem; margin-bottom:5px;">Duration: ${s.duration}</div>
            <div style="font-size:0.75rem; color:#666;">${s.time}</div>
          </div>
        `;
      });
    },
    copyLink() {
      const inp = document.getElementById('share-link-input');
      inp.select(); document.execCommand('copy');
      alert('Link copied to clipboard!');
    },
    shareWhatsApp() {
      const link = document.getElementById('share-link-input').value;
      window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent('Track my live location on SafeHer OS: ' + link), '_blank');
    }
  },

  // ── ESCORT MODE ──
  escort: {
    active: false, _interval: null, dest: null, lastLoc: null, stationaryTicks: 0,
    start() {
      const destName = document.getElementById('escort-dest').value;
      const level = document.getElementById('escort-level')?.value || 'standard';
      if(!destName) return alert('Enter destination');
      this.dest = destName;
      this.active = true;
      document.getElementById('escort-active-panel').classList.remove('hidden');
      document.getElementById('start-escort-btn').disabled = true;
      this.lastLoc = { lat: App.routes._userLat, lng: App.routes._userLng };
      this.stationaryTicks = 0;
      
      let maxTicks = 10; // 5 mins
      if(level === 'elevated') maxTicks = 4; // 2 mins
      if(level === 'maximum') {
        maxTicks = 2; // 1 min
        App.sos._startStealthMic(); // Arm mic immediately
      }
      
      // Notify guardian via SMS API
      if(App.currentUser) {
        const contacts = App.settings.contacts.filter(c => c.phone);
        fetch('/api/send-sos', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            userName: App.currentUser.phone, contacts, location: this.lastLoc,
            message: `🚶 Escort Mode Started. Dest: ${destName}. Level: ${level.toUpperCase()}.`
          })
        }).catch(e=>console.log('Escort start SMS skipped locally'));
      }
      
      // Background monitor
      this._interval = setInterval(() => {
        const cur = { lat: App.routes._userLat, lng: App.routes._userLng };
        const dist = Math.sqrt(Math.pow(cur.lat - this.lastLoc.lat, 2) + Math.pow(cur.lng - this.lastLoc.lng, 2));
        if(dist < 0.0001) { // ~10 meters
          this.stationaryTicks++;
          if(this.stationaryTicks >= maxTicks) { 
            const mins = maxTicks / 2;
            document.getElementById('escort-status-text').textContent = `⚠️ Stopped for ${mins}+ mins`;
            document.getElementById('escort-status-text').style.color = 'var(--amber)';
            this._triggerEscortAlert(`Stationary for > ${mins} minutes`);
            this.stationaryTicks = 0; // reset to avoid spam
          }
        } else {
          this.stationaryTicks = 0;
          document.getElementById('escort-status-text').textContent = 'On Route';
          document.getElementById('escort-status-text').style.color = 'var(--green)';
        }
        this.lastLoc = cur;
      }, 30000);
    },
    _triggerEscortAlert(reason) {
      console.warn('[ESCORT] Alert triggered:', reason);
      // Auto-fire SOS
      App.sos.activate();
    },
    arriveSafe() {
      const pinInput = document.getElementById('escort-end-pin');
      if(pinInput && pinInput.value !== '1234') {
        alert('SECURITY ALERT: Invalid PIN entered! SOS Triggered silently.');
        this._triggerEscortAlert('Forced trip termination with invalid PIN');
        pinInput.value = '';
        return;
      }
      if(pinInput) pinInput.value = ''; // clear on success
      
      this.active = false;
      clearInterval(this._interval);
      document.getElementById('escort-active-panel').classList.add('hidden');
      document.getElementById('start-escort-btn').disabled = false;
      alert('Trip ended safely.');
      if(App.currentUser) {
        fetch('/api/send-sos', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            userName: App.currentUser.phone, contacts: App.settings.contacts.filter(c=>c.phone),
            location: {lat:App.routes._userLat, lng:App.routes._userLng},
            message: `✅ Arrived safely at destination.`
          })
        }).catch(e=>{});
      }
      this.loadTrips(); // Refresh the list
    },
    loadTrips() {
      const listEl = document.getElementById('escort-recent-trips');
      if(!listEl) return;
      
      // Generate 20 dummy recent trips for the demo
      const destinations = [
        'Phoenix Palassio, Gomti Nagar', 'Charbagh Railway Station', 'Aminabad Market', 
        'Hazratganj Main Chauraha', 'Lulu Mall', 'Indira Nagar Metro Station', 
        'Chowk Area', 'Alambagh Bus Stand', 'Gomti Riverfront', 'Bhootnath Market'
      ];
      const statuses = ['Arrived Safely', 'Arrived Safely', 'Arrived Safely', 'Arrived Safely', 'SOS Triggered'];
      
      const trips = [];
      for(let i = 1; i <= 20; i++) {
        trips.push({
          dest: destinations[Math.floor(Math.random() * destinations.length)],
          time: new Date(Date.now() - 86400000 * (i * 0.8)).toLocaleString('en-IN'),
          status: statuses[Math.floor(Math.random() * statuses.length)]
        });
      }
      
      listEl.innerHTML = '';
      trips.forEach(t => {
        const col = t.status.includes('Safely') ? 'var(--green)' : 'var(--red)';
        const ico = t.status.includes('Safely') ? '✅' : '🚨';
        listEl.innerHTML += `
          <div style="background:rgba(255,255,255,0.05); padding:15px; border-left: 3px solid ${col}; border-radius:4px; font-size:0.9rem;">
            <div style="font-weight:bold; margin-bottom:5px; color:#fff;">📍 ${t.dest}</div>
            <div style="color:${col}; font-size:0.8rem; margin-bottom:5px;">${ico} ${t.status}</div>
            <div style="font-size:0.75rem; color:var(--dim);">${t.time}</div>
          </div>
        `;
      });
    }
  },

  // ── GESTURE SOS ──
  gestureSOS: {
    active: false, _shakeCounts: 0, _lastShake: 0, _volCounts: 0, _lastVol: 0,
    toggle(state) {
      this.active = state;
      if(state) {
        window.addEventListener('devicemotion', this._handleMotion);
        document.addEventListener('keydown', this._handleKey);
        console.log('[GESTURE] Shake & Volume SOS enabled');
      } else {
        window.removeEventListener('devicemotion', this._handleMotion);
        document.removeEventListener('keydown', this._handleKey);
      }
    },
    _handleMotion: (e) => {
      if(!App.gestureSOS.active) return;
      const acc = e.accelerationIncludingGravity;
      if(!acc) return;
      const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
      if(force > 25) { // Shake threshold
        const now = Date.now();
        if(now - App.gestureSOS._lastShake > 1000) App.gestureSOS._shakeCounts = 0; // reset if too slow
        App.gestureSOS._shakeCounts++;
        App.gestureSOS._lastShake = now;
        if(App.gestureSOS._shakeCounts >= 4) {
          console.log('[GESTURE] Shake SOS Triggered!');
          App.gestureSOS._shakeCounts = 0;
          App.sos.activate();
        }
      }
    },
    _handleKey: (e) => {
      if(!App.gestureSOS.active) return;
      // Many Android browsers fire AudioVolumeDown for volume keys if intercepted
      if(e.key === 'AudioVolumeDown' || e.code === 'AudioVolumeDown') {
        const now = Date.now();
        if(now - App.gestureSOS._lastVol > 2000) App.gestureSOS._volCounts = 0;
        App.gestureSOS._volCounts++;
        App.gestureSOS._lastVol = now;
        if(App.gestureSOS._volCounts >= 3) {
          console.log('[GESTURE] Volume SOS Triggered!');
          App.gestureSOS._volCounts = 0;
          App.sos.activate();
        }
      }
    }
  },

  // ── COMMUNITY MAP ──
  community: {
    pins: [],
    async loadPins() {
      let data = [];
      try {
        if(typeof supabase !== 'undefined') {
          const res = await supabase.from('community_pins').select('*').order('created_at', {ascending: false}).limit(50);
          if(!res.error) data = res.data || [];
        }
      } catch(e){}
      
      // Fallback
      if(!data || data.length === 0) {
        data = JSON.parse(localStorage.getItem('safeher_comm_pins') || '[]');
        if(data.length < 50) {
          data = []; // Reset and generate 50
          // Generate 50 Demo Pins
          const descs = {
            'unsafe': ['Streetlight broken, dark alleyway.', 'Drunk men loitering at night.', 'No CCTV, isolated path.', 'Harassment reported last week.', 'Unsafe crossing after 9 PM.'],
            'safe': ['24/7 Pharmacy with security guard.', 'Well-lit main road with police patrol.', 'Crowded market area, very safe.', 'Women-friendly cafe open till late.', 'Metro station entrance, lots of cameras.'],
            'incident': ['Suspicious group loitering near the pillar.', 'Chain snatching attempt reported.', 'Someone followed a girl here yesterday.', 'Verbal abuse incident nearby.', 'Fake auto driver seen in this area.']
          };
          const types = ['unsafe', 'safe', 'incident'];
          for(let i = 0; i < 50; i++) {
            const t = types[Math.floor(Math.random() * types.length)];
            const d = descs[t][Math.floor(Math.random() * descs[t].length)];
            const lat = 26.8467 + (Math.random() - 0.5) * 0.08;
            const lng = 80.9462 + (Math.random() - 0.5) * 0.08;
            const time = new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString();
            data.push({ type: t, description: d, lat, lng, created_at: time });
          }
          // Sort by newest
          data.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
          localStorage.setItem('safeher_comm_pins', JSON.stringify(data));
        }
      }
      
      if(data && data.length) {
        this.pins = data;
        const listEl = document.getElementById('comm-recent-pins');
        if(listEl) listEl.innerHTML = '';
        
        data.forEach(p => {
          const col = p.type === 'unsafe' ? '#FF003C' : p.type === 'safe' ? '#00FF88' : '#FFB300';
          const ico = p.type === 'unsafe' ? '🔴' : p.type === 'safe' ? '🟢' : '⚠️';
          const typeStr = p.type === 'unsafe' ? 'Unsafe Zone' : p.type === 'safe' ? 'Safe Spot' : 'Incident';
          
          // Render in list
          if(listEl) {
            listEl.innerHTML += `
              <div style="background:rgba(255,255,255,0.05); padding:15px; border-left: 3px solid ${col}; border-radius:4px; font-size:0.9rem;">
                <div style="color:${col}; font-weight:bold; margin-bottom:5px;">${ico} ${typeStr}</div>
                <div style="color:var(--dim);">${p.description}</div>
                <div style="font-size:0.7rem; color:#666; margin-top:5px;">${new Date(p.created_at).toLocaleString('en-IN')}</div>
              </div>
            `;
          }
          
          // Render on Safe Routes map if initialized
          if(App.routes.map) {
            if(window.google && window.google.maps) {
              new google.maps.Marker({
                position:{lat:p.lat,lng:p.lng}, map:App.routes.map,
                icon:{path:google.maps.SymbolPath.CIRCLE,scale:5,fillColor:col,fillOpacity:0.8,strokeColor:'#fff',strokeWeight:1},
                title: p.description
              });
            } else if (window.L) {
              L.circleMarker([p.lat, p.lng],{radius:6,color:col,fillColor:col,fillOpacity:0.8}).addTo(App.routes.map)
               .bindPopup(`<b>${ico} Community Pin</b><br>${p.description}`);
            }
          }
        });
      }
    },
    async addPin() {
      const type = document.getElementById('comm-pin-type').value;
      const desc = document.getElementById('comm-pin-desc').value;
      if(!desc) return alert('Please enter a description');
      
      const newPin = { type, description: desc, lat: App.routes._userLat||26.8467, lng: App.routes._userLng||80.9462, created_at: new Date().toISOString() };
      
      let success = false;
      try {
        if(typeof supabase !== 'undefined') {
          const { error } = await supabase.from('community_pins').insert([newPin]);
          if(!error) success = true;
        }
      } catch(e){}
      
      // Fallback
      if(!success) {
        const localPins = JSON.parse(localStorage.getItem('safeher_comm_pins') || '[]');
        localPins.unshift(newPin);
        localStorage.setItem('safeher_comm_pins', JSON.stringify(localPins));
      }
      
      alert('Pin dropped successfully!');
      document.getElementById('comm-pin-desc').value = '';
      this.loadPins();
    }
  },

  // ── DECOY SCREEN ──
  decoy: {
    active: false, sequence: '', required: '789X', _interval: null,
    activate() {
      this.active = true;
      document.getElementById('decoy-screen').classList.remove('hidden');
      document.getElementById('decoy-display').textContent = '0';
      this.sequence = '';
      
      // Setup fake calculator buttons
      document.querySelectorAll('.decoy-btn').forEach(btn => {
        // Remove old listeners by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => this._handleCalc(e.target.textContent));
      });
      
      // Start stealth mic recording
      App.sos._startStealthMic();
      
      // Start stealth location ping
      this._interval = setInterval(() => {
        if(!App.currentUser) return;
        const contacts = App.settings.contacts.filter(c => c.phone);
        fetch('/api/send-sos', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            userName: App.currentUser.phone, contacts, location: {lat:App.routes._userLat, lng:App.routes._userLng},
            message: `⚠️ Stealth tracking active.`
          })
        }).catch(e=>{});
      }, 30000); // every 30s
    },
    deactivate() {
      this.active = false;
      document.getElementById('decoy-screen').classList.add('hidden');
      clearInterval(this._interval);
      if(App.sos.mediaRecorder && App.sos.mediaRecorder.state !== 'inactive') {
        App.sos.mediaRecorder.stop();
      }
    },
    _handleCalc(val) {
      if(val === 'C') { this.sequence = ''; document.getElementById('decoy-display').textContent = '0'; return; }
      const display = document.getElementById('decoy-display');
      if(display.textContent === '0') display.textContent = val;
      else display.textContent += val;
      
      // Use 'X' for multiply
      let char = val === '×' ? 'X' : val;
      this.sequence += char;
      
      // Secret code to trigger SOS
      if(this.sequence.includes('7+7+7=')) {
        console.log('[DECOY] Panic code entered!');
        this.deactivate();
        App.sos.activate();
      }
      // Secret code to just exit decoy
      if(this.sequence.includes('1234=')) {
        this.deactivate();
      }
    }
  },

  tilt: {
    init() {
      document.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('mousemove', e => {
          const r=card.getBoundingClientRect();
          const x=(e.clientX-r.left)/r.width-.5;
          const y=(e.clientY-r.top)/r.height-.5;
          card.style.transform=`perspective(600px) rotateY(${x*10}deg) rotateX(${-y*10}deg) translateY(-3px)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform=''; });
      });
    }
  },

  // ── BIOMETRICS (Simulated Wearable) ──
  biometrics: {
    _interval: null, bpm: 72, stressMode: false,
    init() {
      this._interval = setInterval(() => {
        if(!this.stressMode) {
          // Normal resting heart rate fluctuation (68-85)
          this.bpm += Math.floor(Math.random() * 5) - 2;
          if(this.bpm < 68) this.bpm = 68;
          if(this.bpm > 85) this.bpm = 85;
        } else {
          // Stress mode (120-160)
          this.bpm += Math.floor(Math.random() * 10) - 2;
          if(this.bpm > 160) this.bpm = 160;
        }
        
        const display = document.getElementById('bpm-display');
        if(display) {
          display.textContent = this.bpm;
          if(this.bpm > 120) {
            display.style.color = '#fff';
            display.style.textShadow = '0 0 20px rgba(255,0,0,0.8)';
          } else {
            display.style.color = 'var(--red)';
            display.style.textShadow = '0 0 15px rgba(255,0,60,0.5)';
          }
        }
      }, 1000);
    },
    simulateStress() {
      this.stressMode = true;
      this.bpm = 125;
      App.speak("Warning. Severe adrenaline spike detected. Abnormal heart rate.");
      alert('⚠️ BIOMETRIC ALERT: Severe Adrenaline Spike Detected (BPM > 120). Activating Pre-SOS Monitoring...');
      setTimeout(() => {
        const proceed = confirm('Your heart rate is abnormally high. Do you want to trigger SOS now?');
        if(proceed) {
          App.nav.switchScreen('sos');
          App.sos.activate();
        }
        this.stressMode = false;
        this.bpm = 85;
      }, 3000);
    }
  },

  // ── TERMINAL LOG ──
  terminal: {
    _interval: null,
    lines: [
      "Syncing Guardian Node...",
      "Encrypting GPS packet... [OK]",
      "Scanning local Bluetooth devices...",
      "Threat index: 25% (NOMINAL)",
      "Connecting to mesh network...",
      "Audio buffer cleared.",
      "Camera hardware initialized.",
      "Evidence Vault checksum verified.",
      "Running predictive safety analysis..."
    ],
    init() {
      const feed = document.getElementById('terminal-feed');
      if(!feed) return;
      this._interval = setInterval(() => {
        const msg = this.lines[Math.floor(Math.random() * this.lines.length)];
        const time = new Date().toLocaleTimeString('en-US', {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'});
        const el = document.createElement('div');
        el.innerHTML = `<span style="color:var(--dim);">[${time}]</span> ${msg}`;
        feed.appendChild(el);
        if(feed.children.length > 20) feed.removeChild(feed.firstChild);
        feed.scrollTop = feed.scrollHeight;
      }, 3500);
    }
  },

  // ── ACTIVE RADAR ──
  radar: {
    init() {
      const blipsContainer = document.getElementById('radar-blips');
      if(!blipsContainer) return;
      setInterval(() => {
        // 30% chance to spawn a blip every second
        if(Math.random() > 0.3) return;
        const blip = document.createElement('div');
        const isSafe = Math.random() > 0.4; // 60% chance of green blip, 40% red
        const color = isSafe ? '#00FF88' : '#FF003C';
        
        // Random position within the radar circle (radius 60px)
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 45 + 5; // keep it slightly away from center and edge
        const top = 60 + Math.sin(angle) * radius;
        const left = 60 + Math.cos(angle) * radius;
        
        blip.style.cssText = `position:absolute; top:${top}px; left:${left}px; width:6px; height:6px; background:${color}; border-radius:50%; box-shadow:0 0 10px ${color}; animation:blipFade 2s forwards;`;
        blipsContainer.appendChild(blip);
        
        // Remove after animation
        setTimeout(() => {
          if(blip.parentNode) blip.parentNode.removeChild(blip);
        }, 2000);
      }, 1000);
    }
  },

  // ── HIDDEN CAMERA DETECTOR ──
  detector: {
    stream: null, _interval: null,
    async start() {
      const video = document.getElementById('detector-video');
      const status = document.getElementById('detector-status');
      const btn = document.getElementById('btn-start-detector');
      if(!video) return;

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = this.stream;
        status.textContent = '[SYSTEM] SCANNING FOR IR EMISSIONS...';
        status.style.color = 'var(--cyan)';
        status.style.borderColor = 'var(--cyan)';
        btn.textContent = 'SCANNING...';
        btn.style.pointerEvents = 'none';

        // Simulate finding something after 5-10 seconds
        this._interval = setTimeout(() => {
          this.simulateDetection();
        }, 5000 + Math.random() * 5000);

      } catch(e) {
        alert('Camera access denied or unavailable. Cannot run Spy Detector.');
      }
    },
    simulateDetection() {
      const blips = document.getElementById('detector-blips');
      const status = document.getElementById('detector-status');
      if(!blips) return;

      // Draw a target box
      const box = document.createElement('div');
      const top = 20 + Math.random() * 50;
      const left = 20 + Math.random() * 50;
      box.style.cssText = `position:absolute; top:${top}%; left:${left}%; width:40px; height:40px; border:2px solid var(--red); box-shadow:0 0 10px var(--red); animation:pulse 0.5s infinite;`;
      
      const label = document.createElement('div');
      label.textContent = 'IR SOURCE';
      label.style.cssText = `position:absolute; top:-15px; left:0; color:var(--red); font-size:0.6rem; font-weight:bold; white-space:nowrap;`;
      box.appendChild(label);
      blips.appendChild(box);

      status.textContent = '⚠️ [ALERT] POTENTIAL HIDDEN CAMERA / IR EMITTER DETECTED ⚠️';
      status.style.color = '#fff';
      status.style.backgroundColor = 'var(--red)';
      App.speak("Warning. Potential hidden camera or infrared emitter detected in the vicinity.");
      
      if(navigator.vibrate) navigator.vibrate([200,100,200,100,200]);
    },
    stop() {
      if(this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }
      if(this._interval) clearTimeout(this._interval);
      const video = document.getElementById('detector-video');
      if(video) video.srcObject = null;
      
      const blips = document.getElementById('detector-blips');
      if(blips) blips.innerHTML = '';
      
      const status = document.getElementById('detector-status');
      if(status) {
        status.textContent = '[SYSTEM] OFFLINE';
        status.style.color = 'var(--dim)';
        status.style.backgroundColor = 'rgba(0,0,0,0.8)';
        status.style.borderColor = 'var(--dim)';
      }
      
      const btn = document.getElementById('btn-start-detector');
      if(btn) {
        btn.textContent = 'START SCAN';
        btn.style.pointerEvents = 'auto';
      }
    }
  },

  // ── OFFLINE MESH NETWORK ──
  mesh: {
    init() {
      const container = document.getElementById('mesh-nodes-container');
      const counter = document.getElementById('mesh-node-count');
      if(!container || !counter) return;

      let nodeCount = 0;
      setInterval(() => {
        // Chance to spawn a new node
        if(Math.random() > 0.4 && nodeCount < 5) {
          nodeCount++;
          counter.textContent = nodeCount;
          
          const node = document.createElement('div');
          // Random position
          const top = 20 + Math.random() * 60;
          const left = 10 + Math.random() * 80;
          node.style.cssText = `position:absolute; top:${top}%; left:${left}%; width:6px; height:6px; background:#fff; border-radius:50%; box-shadow:0 0 8px #fff; opacity:0; animation:meshLineFade 8s forwards;`;
          
          // Line connecting to center (50%, 50%)
          const dx = 50 - left;
          const dy = 50 - top;
          const length = Math.sqrt(dx*dx + dy*dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          
          const line = document.createElement('div');
          line.style.cssText = `position:absolute; top:${top}%; left:${left}%; width:${length}%; height:1px; background:var(--cyan); transform-origin:0 0; transform:rotate(${angle}deg); opacity:0; animation:meshLineFade 8s forwards; box-shadow:0 0 5px var(--cyan);`;
          
          container.appendChild(line);
          container.appendChild(node);
          
          setTimeout(() => {
            if(node.parentNode) node.parentNode.removeChild(node);
            if(line.parentNode) line.parentNode.removeChild(line);
            nodeCount--;
            counter.textContent = nodeCount;
          }, 7800);
        }
      }, 2000);
    }
  },

  // ── GYROSCOPE (Shake-to-SOS) ──
  gyroscope: {
    shakeThreshold: 15, // m/s^2
    lastUpdate: 0,
    lastX: null, lastY: null, lastZ: null,
    shakeCount: 0,
    init() {
      if(!window.DeviceMotionEvent) {
        console.warn('[GYRO] DeviceMotion not supported on this device/browser');
        return;
      }
      // Note: On iOS 13+, DeviceMotionEvent requires explicit user permission.
      // For this hackathon demo, we will bind it directly and assume non-iOS or permission granted.
      window.addEventListener('devicemotion', (e) => this.handleMotion(e), false);
    },
    handleMotion(e) {
      // Check if Gesture SOS is enabled in Settings
      const gestureToggle = document.getElementById('setting-gesture');
      if(!gestureToggle || !gestureToggle.checked) return;
      if(App.sos.activated) return; // Don't trigger if already active

      const acc = e.accelerationIncludingGravity;
      if(!acc) return;

      const curTime = Date.now();
      if((curTime - this.lastUpdate) > 100) {
        const diffTime = curTime - this.lastUpdate;
        this.lastUpdate = curTime;

        if(this.lastX !== null) {
          const speed = Math.abs(acc.x + acc.y + acc.z - this.lastX - this.lastY - this.lastZ) / diffTime * 10000;
          if(speed > this.shakeThreshold) {
            this.shakeCount++;
            if(this.shakeCount >= 4) { // 4 shakes detected
              console.log('[GYRO] Violent shaking detected! Triggering SOS.');
              App.speak("Violent motion detected. Automatically triggering SOS protocol.");
              App.nav.switchScreen('sos');
              App.sos.activate();
              this.shakeCount = 0;
            }
          } else {
            // Reset if not consecutive
            if(this.shakeCount > 0 && curTime - this.lastUpdate > 1000) {
               this.shakeCount = 0;
            }
          }
        }
        this.lastX = acc.x;
        this.lastY = acc.y;
        this.lastZ = acc.z;
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
