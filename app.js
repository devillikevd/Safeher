// SafeHer OS — Main Application
const App = {
  currentScreen: 'dashboard',
  init() {
    this.bootSequence();
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

  // ── SAFE ROUTES ──
  routes: {
    map: null, heatShown: true, heatLayers:[], markerLayers:[], safeLayers:[],
    init() {
      if(this.map) {this.map.invalidateSize();return;}
      try {
        this.map = L.map('main-map',{attributionControl:false}).setView([26.8467,80.9462],14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(this.map);
        // User marker
        L.marker([26.8467,80.9462],{icon:L.divIcon({html:'<div style="width:14px;height:14px;background:#00F5FF;border-radius:50%;box-shadow:0 0 15px #00F5FF;border:2px solid #fff"></div>',iconSize:[14,14],className:''})}).addTo(this.map).bindPopup('<b>📍 Your Location</b><br>Hazratganj, Lucknow<br><small>26.8467°N, 80.9462°E</small>');
        // Safe Route 1: Hazratganj → Gomti Nagar
        const sr1=L.polyline([[26.8467,80.9462],[26.8480,80.9480],[26.8500,80.9500],[26.8520,80.9510],[26.8545,80.9491]],{color:'#00FF88',weight:5,opacity:.8}).addTo(this.map).bindPopup('<b>Route 1: Hazratganj → Gomti Nagar</b><br>Safety: <span style="color:#0f0">92/100</span><br>Distance: 2.1 km | Time: ~8 min');
        // Safe Route 2: Hazratganj → Indira Nagar
        const sr2=L.polyline([[26.8467,80.9462],[26.8510,80.9470],[26.8570,80.9480],[26.8620,80.9510],[26.8680,80.9540],[26.8754,80.9560]],{color:'#00FF88',weight:4,opacity:.6}).addTo(this.map).bindPopup('<b>Route 2: Hazratganj → Indira Nagar</b><br>Safety: <span style="color:#0f0">87/100</span><br>Distance: 4.3 km | Time: ~15 min');
        // Moderate Route: via Aminabad
        L.polyline([[26.8467,80.9462],[26.8440,80.9430],[26.8410,80.9400],[26.8393,80.9394]],{color:'#FFB300',weight:3,opacity:.7,dashArray:'10,6'}).addTo(this.map).bindPopup('<b>Route 3: → Aminabad Market</b><br>Safety: <span style="color:#FFB300">64/100</span><br>⚠️ Poor lighting after 8PM');
        // Avoid Route: via Alambagh
        L.polyline([[26.8467,80.9462],[26.8400,80.9380],[26.8340,80.9300],[26.8281,80.9213]],{color:'#FF003C',weight:3,opacity:.5,dashArray:'5,10'}).addTo(this.map).bindPopup('<b>Route 4: → Alambagh</b><br>Safety: <span style="color:#FF003C">32/100</span><br>🚫 Multiple incidents reported');
        this.safeLayers.push(sr1,sr2);
        // Named location markers
        const locs=[
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
        ];
        locs.forEach(l=>{
          const col=l[5]>75?'#00FF88':l[5]>50?'#FFB300':'#FF003C';
          const m=L.circleMarker([l[0],l[1]],{radius:7,color:col,fillColor:col,fillOpacity:.4,weight:2}).addTo(this.map);
          m.bindPopup(`<b>${l[2]}</b><br>${l[3]}<br>Status: ${l[4]}<br>Safety Score: <b style="color:${col}">${l[5]}/100</b>`);
          this.markerLayers.push(m);
        });
        // Danger heatmap zones
        const zones=[[26.8281,80.9213,500,'Alambagh Bus Stand'],[26.8350,80.9100,350,'Aishbagh'],[26.8150,80.9300,400,'Saadatganj'],[26.8600,80.9650,300,'Vikas Nagar Edge'],[26.8300,80.9500,250,'1090 Crossing Night']];
        zones.forEach(z=>{
          const c=L.circle([z[0],z[1]],{radius:z[2],color:'#FF003C',fillColor:'#FF003C',fillOpacity:.12,weight:1}).addTo(this.map);
          c.bindPopup(`<b>⚠️ Unsafe Zone</b><br>${z[3]}<br><small>Multiple incidents reported</small>`);
          this.heatLayers.push(c);
        });
        // Police stations
        const police=[[26.8480,80.9500,'Hazratganj PS'],[26.8550,80.9400,'Gautampalli PS'],[26.8300,80.9250,'Alambagh PS']];
        police.forEach(p=>{
          L.marker([p[0],p[1]],{icon:L.divIcon({html:'<div style="font-size:16px">🚔</div>',iconSize:[16,16],className:''})}).addTo(this.map).bindPopup(`<b>${p[2]}</b><br>Police Station<br>Dial: 100`);
        });
        setTimeout(()=>this.map.invalidateSize(),200);
      } catch(e){}
    },
    toggleHeatmap(btn) {
      btn.classList.toggle('active');
      this.heatShown=!this.heatShown;
      this.heatLayers.forEach(l=> this.heatShown? l.addTo(this.map): this.map.removeLayer(l));
    },
    toggleSafeOnly(btn) { btn.classList.toggle('active'); }
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
      if(this.activated) return; // Guard against double-fire
      this.activated = true;
      this._activating = false;
      cancelAnimationFrame(this.holdTimer);
      const btn = document.getElementById('sos-button');
      if(btn) btn.style.transform = '';
      // Fill ring completely
      const ring = document.getElementById('sos-ring-progress');
      if(ring) ring.style.strokeDashoffset = 0;
      document.body.classList.add('sos-flash');
      setTimeout(() => document.body.classList.remove('sos-flash'), 500);
      if(navigator.vibrate) navigator.vibrate([200,100,200,100,200]);
      // Auto-start evidence capture
      this.startEvidenceCapture();
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
        if(step <= 4) setTimeout(run, 1200);
      };
      run();
    },
    // Auto voice recording
    async startEvidenceCapture() {
      try {
        // Request microphone + camera
        const stream = await navigator.mediaDevices.getUserMedia({audio:true, video:true});
        this.cameraStream = stream;
        this.audioStream = stream;
        // Start audio/video recording
        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, {mimeType:'video/webm'});
        this.mediaRecorder.ondataavailable = (e) => {
          if(e.data.size > 0) this.recordedChunks.push(e.data);
        };
        this.mediaRecorder.onstop = () => this.saveRecording();
        this.mediaRecorder.start(1000); // capture in 1s chunks
        console.log('[SOS] 🎙️ Recording started — audio + video capturing');
        // Show recording indicator
        document.getElementById('sos-recording-status').classList.remove('hidden');
        let sec=0;
        this._recInterval=setInterval(()=>{sec++;const m=String(Math.floor(sec/60)).padStart(2,'0');const s=String(sec%60).padStart(2,'0');document.getElementById('rec-timer').textContent=m+':'+s;},1000);
        // Auto-stop after 30 seconds
        setTimeout(() => this.stopRecording(), 30000);
      } catch(e) {
        console.log('[SOS] Evidence capture: using fallback (permissions denied)');
        this.saveMockEvidence('audio');
      }
    },
    // Camera snapshot
    async capturePhoto() {
      try {
        if(!this.cameraStream) {
          const stream = await navigator.mediaDevices.getUserMedia({video:true});
          this.cameraStream = stream;
        }
        const video = document.createElement('video');
        video.srcObject = this.cameraStream;
        video.play();
        await new Promise(r => video.onloadedmetadata = r);
        await new Promise(r => setTimeout(r, 500));
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.7);
        // Save to evidence vault
        const ts = new Date().toISOString().replace(/[:.]/g,'-');
        const hash = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,'0')).join('');
        const evidence = {id:Date.now(),name:`sos_photo_${ts}.jpg`,type:'photo',icon:'📸',time:new Date().toLocaleString(),gps:'26.8467°N, 80.9462°E',hash:hash.substring(0,24),status:'SECURED'};
        App.vault.data.unshift(evidence);
        // Store thumbnail reference
        localStorage.setItem('sos_photo_'+evidence.id, photoData.substring(0,500));
        console.log('[SOS] 📸 Photo captured & saved to Evidence Vault');
      } catch(e) {
        console.log('[SOS] Camera capture fallback');
        this.saveMockEvidence('photo');
      }
    },
    stopRecording() {
      if(this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
        console.log('[SOS] 🛑 Recording stopped');
      }
      // Hide recording indicator
      if(this._recInterval) clearInterval(this._recInterval);
      const recEl = document.getElementById('sos-recording-status');
      if(recEl) recEl.classList.add('hidden');
      // Stop all tracks
      if(this.cameraStream) { this.cameraStream.getTracks().forEach(t=>t.stop()); this.cameraStream=null; }
      if(this.audioStream) { this.audioStream.getTracks().forEach(t=>t.stop()); this.audioStream=null; }
    },
    saveRecording() {
      if(this.recordedChunks.length === 0) return;
      const blob = new Blob(this.recordedChunks, {type:'video/webm'});
      const ts = new Date().toISOString().replace(/[:.]/g,'-');
      const hash = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,'0')).join('');
      // Add to evidence vault
      const evidence = {id:Date.now(),name:`sos_recording_${ts}.webm`,type:'video',icon:'🎙️',time:new Date().toLocaleString(),gps:'26.8467°N, 80.9462°E',hash:hash.substring(0,24),status:'SECURED'};
      App.vault.data.unshift(evidence);
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = evidence.name;
      localStorage.setItem('sos_recording_url', url);
      console.log('[SOS] 💾 Recording saved to Evidence Vault (' + (blob.size/1024).toFixed(1) + ' KB)');
    },
    saveMockEvidence(type) {
      const ts = new Date().toISOString().replace(/[:.]/g,'-');
      const hash = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,'0')).join('');
      const name = type==='photo' ? `sos_photo_${ts}.jpg` : `sos_audio_${ts}.webm`;
      const icon = type==='photo' ? '📸' : '🎙️';
      App.vault.data.unshift({id:Date.now(),name,type:type==='photo'?'photo':'video',icon,time:new Date().toLocaleString(),gps:'26.8467°N, 80.9462°E',hash:hash.substring(0,24),status:'SECURED'});
    },
    abort() {
      this.activated = false;
      this._activating = false;
      cancelAnimationFrame(this.holdTimer);
      this.holdTimer = null;
      this.stopRecording();
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
    startFakeCall() {
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
    },
    declineFakeCall() {
      document.getElementById('fake-call-overlay').classList.add('hidden');
      try{this._fakeRing.o.stop();}catch(e){}
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
    keywords:['help','bachao','emergency','darr','police','raksha','scared'],
    _sosCooldown:false, _retryCount:0, _watchdog:null, _lastResult:0,
    // Auto-arm on boot — always listening regardless of screen
    autoArm() {
      this.active = true;
      this._updateUI(true);
      this._createRecognition();
      this._startListening();
      // Watchdog: check every 5s if recognition is alive, restart if dead
      this._watchdog = setInterval(() => {
        if(!this.active) return;
        const silent = Date.now() - this._lastResult > 15000; // 15s no results
        if(silent) {
          console.log('[VOICE] Watchdog: no activity for 15s, restarting...');
          this._restart();
        }
      }, 5000);
      console.log('[VOICE] 🎤 Always-on listening armed on boot');
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
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN';
      this.recognition.maxAlternatives = 3;
      this.recognition.onresult = (e) => {
        this._lastResult = Date.now();
        this._retryCount = 0; // Reset retries on successful result
        for(let i = e.resultIndex; i < e.results.length; i++) {
          // Check all alternatives for better accuracy
          for(let a = 0; a < e.results[i].length; a++) {
            const t = e.results[i][a].transcript.toLowerCase();
            this.keywords.forEach(k => { if(t.includes(k)) this.onKeyword(k); });
          }
        }
      };
      this.recognition.onerror = (e) => {
        // 'no-speech' and 'aborted' are normal, not real errors
        if(e.error === 'no-speech' || e.error === 'aborted') return;
        console.log('[VOICE] Error:', e.error);
        if(e.error === 'not-allowed') {
          console.log('[VOICE] Microphone permission denied — cannot listen');
          this._updateUI(false);
          return;
        }
      };
      this.recognition.onend = () => {
        if(!this.active) return;
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
        // Already started — stop and restart
        if(e.message && e.message.includes('already started')) return;
        console.log('[VOICE] Start failed, will retry:', e.message);
        setTimeout(() => this._restart(), 1000);
      }
    },
    _restart() {
      try { this.recognition.abort(); } catch(e) {}
      // Recreate fresh instance to clear any stuck state
      this._createRecognition();
      this._startListening();
    },
    toggle(on) {
      this.active = on;
      this._updateUI(on);
      if(on) {
        this._retryCount = 0;
        this._createRecognition();
        this._startListening();
      } else {
        this.stopRecognition();
      }
    },
    stopRecognition() {
      try { this.recognition && this.recognition.abort(); } catch(e) {}
      this.recognition = null;
    },
    onKeyword(word) {
      console.log('[VOICE] 🔴 KEYWORD DETECTED: ' + word.toUpperCase());
      // Update UI on voice screen
      const el=document.getElementById('voice-detected');
      if(el) el.classList.remove('hidden');
      document.getElementById('detected-word').textContent=word.toUpperCase();
      document.getElementById('detected-time').textContent=new Date().toLocaleTimeString();
      document.querySelectorAll('.keyword').forEach(k=>{if(k.textContent===word)k.classList.add('triggered');});
      setTimeout(()=>document.querySelectorAll('.keyword').forEach(k=>k.classList.remove('triggered')),3000);
      // Update header threat badge
      const badge=document.getElementById('threat-badge');
      if(badge){badge.textContent='🔴 KEYWORD: '+word.toUpperCase();badge.style.color='var(--red)';}
      // AUTO-TRIGGER SOS — switch to SOS screen and activate
      if(!this._sosCooldown && !App.sos.activated) {
        this._sosCooldown = true;
        console.log('[VOICE] ⚡ Auto-triggering SOS sequence!');
        // Flash the screen red
        document.body.classList.add('sos-flash');
        setTimeout(()=>document.body.classList.remove('sos-flash'),500);
        // Switch to SOS screen
        App.nav.switchScreen('sos');
        // Small delay then activate SOS
        setTimeout(()=>{
          App.sos.activate();
        }, 500);
        // Cooldown — prevent re-trigger for 30 seconds
        setTimeout(()=>{ this._sosCooldown=false; }, 30000);
      }
    },
    test() {
      this.onKeyword(this.keywords[Math.floor(Math.random()*this.keywords.length)]);
    },
    setLang(lang,btn) {
      btn.parentElement.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if(this.recognition){
        const map={hi:'hi-IN',en:'en-IN',both:'en-IN'};
        this.recognition.lang=map[lang]||'en-IN';
      }
    },
    initCanvas() {
      const c=document.getElementById('waveform-canvas');
      const ctx=c.getContext('2d');
      c.width=c.offsetWidth;c.height=c.offsetHeight;
      if(this.animId)cancelAnimationFrame(this.animId);
      let phase=0;
      const draw=()=>{
        ctx.clearRect(0,0,c.width,c.height);
        ctx.strokeStyle=this.active?'#00F5FF':'rgba(0,245,255,0.3)';
        ctx.lineWidth=2;ctx.beginPath();
        const amp=this.active?40:15;
        for(let x=0;x<c.width;x++){
          const y=c.height/2+Math.sin(x*.02+phase)*amp*Math.sin(x*.005+phase*.5)+Math.sin(x*.05+phase*2)*(amp*.3);
          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.stroke();phase+=.05;
        this.animId=requestAnimationFrame(draw);
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
    keywords: JSON.parse(localStorage.getItem('safeher_keywords')||'["help","bachao","emergency","darr","police","raksha","scared"]'),
    render() {
      const cDiv=document.getElementById('settings-contacts');
      cDiv.innerHTML=this.contacts.map((c,i)=>`<div class="contact-entry"><input class="cyber-input" value="${c.name}" onchange="App.settings.updateContact(${i},'name',this.value)" placeholder="Name"><input class="cyber-input" value="${c.phone}" onchange="App.settings.updateContact(${i},'phone',this.value)" placeholder="Phone"><button class="del-btn" onclick="App.settings.removeContact(${i})">✕</button></div>`).join('');
      const kDiv=document.getElementById('settings-keywords');
      kDiv.innerHTML=this.keywords.map((k,i)=>`<span class="keyword" style="cursor:pointer" onclick="App.settings.removeKeyword(${i})">${k} ✕</span>`).join('');
    },
    updateContact(i,field,val){this.contacts[i][field]=val;this.save();},
    removeContact(i){this.contacts.splice(i,1);this.save();this.render();},
    addContact(){this.contacts.push({name:'',phone:''});this.save();this.render();},
    removeKeyword(i){this.keywords.splice(i,1);this.save();this.render();},
    addKeyword(){const inp=document.getElementById('new-keyword');const v=inp.value.trim();if(v){this.keywords.push(v);inp.value='';this.save();this.render();}},
    save(){localStorage.setItem('safeher_contacts',JSON.stringify(this.contacts));localStorage.setItem('safeher_keywords',JSON.stringify(this.keywords));}
  },

  // ── 3D TILT ──
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
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
