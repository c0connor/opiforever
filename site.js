/* ===== Opi — shared behaviour: preview gate, audio player, placeholder forms ===== */
(function(){
  /* ---------- 1. Private preview gate ---------- */
  var HASH='786055cb56642c9440774777ac3acbb5fc42cdd061566e27673ec13037544232';
  var KEY='opi-gate-ok';
  var root=document.documentElement;
  function remembered(){ try{ return localStorage.getItem(KEY)===HASH; }catch(e){ return false; } }
  function remember(){ try{ localStorage.setItem(KEY,HASH); }catch(e){} }
  function sha256(ascii){
    function rr(v,a){return (v>>>a)|(v<<(32-a));}
    var mp=Math.pow, mx=mp(2,32), i, j, res='', words=[], al=ascii.length*8;
    var hash=sha256.h=sha256.h||[], k=sha256.k=sha256.k||[], pc=k.length, ip={};
    for(var c=2; pc<64; c++){ if(!ip[c]){ for(i=0;i<313;i+=c) ip[i]=c;
      hash[pc]=(mp(c,.5)*mx)|0; k[pc++]=(mp(c,1/3)*mx)|0; } }
    ascii+='\x80'; while(ascii.length%64-56) ascii+='\x00';
    for(i=0;i<ascii.length;i++){ j=ascii.charCodeAt(i); if(j>>8) return; words[i>>2]|=j<<((3-i)%4)*8; }
    words[words.length]=(al/mx)|0; words[words.length]=al;
    for(j=0;j<words.length;){ var w=words.slice(j,j+=16), oh=hash; hash=hash.slice(0,8);
      for(i=0;i<64;i++){ var w15=w[i-15], w2=w[i-2], a=hash[0], e=hash[4];
        var t1=hash[7]+(rr(e,6)^rr(e,11)^rr(e,25))+((e&hash[5])^((~e)&hash[6]))+k[i]
          +(w[i]=(i<16)?w[i]:(w[i-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+w[i-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10)))|0);
        var t2=(rr(a,2)^rr(a,13)^rr(a,22))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
        hash=[(t1+t2)|0].concat(hash); hash[4]=(hash[4]+t1)|0; }
      for(i=0;i<8;i++) hash[i]=(hash[i]+oh[i])|0; }
    for(i=0;i<8;i++) for(j=3;j+1;j--){ var b=(hash[i]>>(j*8))&255; res+=((b<16)?0:'')+b.toString(16); }
    return res;
  }
  if(!remembered()){
    root.classList.add('locked');
    var gate=document.createElement('div'); gate.id='gate';
    gate.innerHTML='<div><div class="gate-logo blackletter">Opi</div><div class="gate-sub">a world in progress</div>'+
      '<form class="gate-form" id="gateForm" autocomplete="off"><input type="password" id="gatePass" placeholder="password" aria-label="password" autofocus>'+
      '<button class="btn" type="submit">Enter</button></form><div class="gate-hint">Private preview · invited guests only</div></div>';
    document.body.appendChild(gate);
    gate.querySelector('#gateForm').addEventListener('submit',function(e){
      e.preventDefault();
      var inp=gate.querySelector('#gatePass');
      if(sha256(inp.value.trim().toLowerCase())===HASH){ remember(); gate.remove(); root.classList.remove('locked'); }
      else{ inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.value=''; }
    });
  }

  /* ---------- 2. Preview player (one shared <audio>) ---------- */
  var audio=new Audio(); audio.preload='none';
  var current=null; // the .play button currently playing
  var bar=document.querySelector('.now-playing');
  function setState(btn,playing){
    if(!btn) return;
    btn.classList.toggle('playing',playing);
    btn.innerHTML=playing?'❚❚':'▶';
    btn.setAttribute('aria-label',playing?'Pause preview':'Play preview');
  }
  function stop(){ audio.pause(); setState(current,false); current=null; if(bar) bar.classList.remove('show'); }
  function play(btn){
    try{ document.dispatchEvent(new CustomEvent('opi-audio',{detail:'cards'})); }catch(e){}
    if(current===btn){ if(audio.paused){ audio.play(); setState(btn,true);} else { audio.pause(); setState(btn,false);} return; }
    setState(current,false);
    current=btn; audio.src=btn.getAttribute('data-src'); audio.currentTime=0;
    audio.play().then(function(){ setState(btn,true); }).catch(function(){ setState(btn,false); });
    if(bar){
      bar.querySelector('.np-title').textContent=btn.getAttribute('data-title')||'';
      bar.classList.add('show');
    }
    document.querySelectorAll('.progress > i').forEach(function(i){ i.style.width='0'; });
  }
  audio.addEventListener('timeupdate',function(){
    if(!current||!audio.duration) return;
    var pct=(audio.currentTime/audio.duration*100)+'%';
    var card=current.closest('.card, .detail-art');
    var p=card&&card.querySelector('.progress > i'); if(p) p.style.width=pct;
  });
  audio.addEventListener('ended',function(){ setState(current,false); current=null; if(bar) bar.classList.remove('show'); });
  document.addEventListener('click',function(e){
    var btn=e.target.closest('.play[data-src]');
    if(btn){ e.preventDefault(); play(btn); return; }
    if(e.target.closest('.np-toggle')){ if(current){ play(current);} }
    if(e.target.closest('.np-close')){ stop(); }
  });
  document.addEventListener('opi-audio',function(e){
    if(e.detail!=='cards' && !audio.paused){ audio.pause(); setState(current,false); if(bar) bar.classList.remove('show'); }
  });
  // "Enter with sound" handoff from the intro page
  try{
    if(sessionStorage.getItem('opi-sound')==='1'){
      sessionStorage.removeItem('opi-sound');
      var first=document.querySelector('.play[data-featured="1"]')||document.querySelector('.play[data-src]');
      if(first){ setTimeout(function(){ play(first); },300); }
    }
  }catch(e){}
  document.querySelectorAll('.enter-sound').forEach(function(a){
    a.addEventListener('click',function(){ try{ sessionStorage.setItem('opi-sound','1'); }catch(e){} });
  });

  /* ---------- 3. Placeholder forms (preview mode) ---------- */
  document.querySelectorAll('form[data-placeholder]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var ok=f.querySelector('.form-ok');
      if(!ok){ ok=document.createElement('div'); ok.className='form-ok'; f.appendChild(ok); }
      ok.textContent=f.getAttribute('data-placeholder');
      f.querySelectorAll('input,textarea').forEach(function(i){ i.value=''; });
    });
  });
})();

/* ---------- 4. Marketplace filters: chips + search + BPM + key + genres ---------- */
(function(){
  var grid=document.getElementById('marketGrid');
  if(!grid) return;
  var chips=document.querySelectorAll('.chip-btn[data-filter]');
  var q=null, fb=document.getElementById('fBpm'), fk=document.getElementById('fKey');
  var genreRow=null, countEl=document.getElementById('fCount');
  var cards=[].slice.call(grid.querySelectorAll('.card'));
  // key dropdown from catalog
  if(fk){
    var keys={};
    cards.forEach(function(c){ keys[c.getAttribute('data-key')]=1; });
    Object.keys(keys).sort().forEach(function(k){
      var o=document.createElement('option'); o.value=k; o.textContent=k; fk.appendChild(o);
    });
  }
  // genre chips from catalog (Splice-style, multi-select)
  var activeGenres={};
  if(genreRow){
    var gset={};
    cards.forEach(function(c){
      (c.getAttribute('data-genre')||'').split(/[^a-z]+/).forEach(function(t){ if(t) gset[t]=1; });
    });
    Object.keys(gset).sort().forEach(function(gname){
      var b=document.createElement('button'); b.className='chip-btn'; b.textContent=gname;
      b.addEventListener('click',function(){
        if(activeGenres[gname]){ delete activeGenres[gname]; b.classList.remove('active'); }
        else { activeGenres[gname]=1; b.classList.add('active'); }
        apply();
      });
      genreRow.insertBefore(b, countEl);
    });
  }
  function lic(){ var a=document.querySelector('.chip-btn.active[data-filter]'); return a?a.getAttribute('data-filter'):'all'; }
  function apply(){
    var f=lic(), text=(q&&q.value||'').trim().toLowerCase();
    var bpmRange=(fb&&fb.value)?fb.value.split('-').map(Number):null;
    var key=(fk&&fk.value)||'';
    var gsel=Object.keys(activeGenres);
    var shown=0;
    cards.forEach(function(card){
      var show=(f==='all')||card.getAttribute('data-lic')===f;
      if(show&&text){
        var hay=(card.getAttribute('data-title')+' '+card.getAttribute('data-genre')+' '+card.getAttribute('data-key')).toLowerCase();
        show=hay.indexOf(text)>=0;
      }
      if(show&&bpmRange){
        var b=parseInt(card.getAttribute('data-bpm'),10);
        show=b>=bpmRange[0]&&b<=bpmRange[1];
      }
      if(show&&key) show=card.getAttribute('data-key')===key;
      if(show&&gsel.length){
        var toks=(card.getAttribute('data-genre')||'').split(/[^a-z]+/);
        show=gsel.some(function(g){ return toks.indexOf(g)>=0; });
      }
      card.style.display=show?'':'none';
      if(show) shown++;
    });
    if(countEl) countEl.textContent=shown+(shown===1?' vocal':' vocals');
    var empty=document.getElementById('exclusiveEmpty');
    if(empty){
      if(!shown && f==='exclusive' && !text && !bpmRange && !key && !gsel.length){
        empty.innerHTML='<h3>Exclusives are one-of-one.</h3><p class="muted">The first exclusive drops are being held for launch. Want a catalog vocal exclusively \u2014 or something made to order? <a href="about.html#custom" style="color:var(--coral)">Ask directly \u2192</a></p>';
        empty.hidden=false;
      } else if(!shown){
        empty.innerHTML='<h3>No vocals match.</h3><p class="muted">Try widening the search \u2014 or <a href="about.html#custom" style="color:var(--coral)">ask for a custom topline \u2192</a> in exactly the style you need.</p>';
        empty.hidden=false;
      } else empty.hidden=true;
    }
  }
  chips.forEach(function(c){ c.addEventListener('click',function(){
    chips.forEach(function(x){x.classList.remove('active')}); c.classList.add('active'); apply();
  });});
  if(q) q.addEventListener('input',apply);
  if(fb) fb.addEventListener('change',apply);
  if(fk) fk.addEventListener('change',apply);
  apply();
})();

/* ---------- 5. Opi Voice — live conversion (mic/upload -> api.opiforever.com) ---------- */
(function(){
  var recBtn=document.getElementById('vtRecord');
  if(!recBtn) return;
  var API='https://api.opiforever.com';
  var idle=document.getElementById('vtIdle'), rec=document.getElementById('vtRec'), got=document.getElementById('vtGot');
  var timerEl=document.getElementById('vtTimer'), player=document.getElementById('vtPlayer'), nameEl=document.getElementById('vtName');
  var notice=document.getElementById('vtNotice'), statusEl=document.getElementById('vtStatus');
  var resultEl=document.getElementById('vtResult'), outEl=document.getElementById('vtOut'), dlEl=document.getElementById('vtDownload'), ecoEl=document.getElementById('vtEco');
  var inviteEl=document.getElementById('vtInvite');
  try{ if(inviteEl && localStorage.getItem('opi-invite')) inviteEl.value=localStorage.getItem('opi-invite'); }catch(e){}
  var mr=null, chunks=[], t0=0, tick=null;
  // Pro mode
  var proBtn=document.getElementById('vmPro'), simpleBtn=document.getElementById('vmSimple'), knobs=document.getElementById('vtKnobs');
  function knobEls(){ return {pitch:document.getElementById('kPitch'),index:document.getElementById('kIndex'),protect:document.getElementById('kProtect'),vol:document.getElementById('kVol')}; }
  if(proBtn){
    proBtn.addEventListener('click',function(){ knobs.hidden=false; proBtn.classList.add('active'); simpleBtn.classList.remove('active'); });
    simpleBtn.addEventListener('click',function(){ knobs.hidden=true; simpleBtn.classList.add('active'); proBtn.classList.remove('active'); });
    [['kPitch','kvPitch'],['kIndex','kvIndex'],['kProtect','kvProtect'],['kVol','kvVol']].forEach(function(pair){
      var i=document.getElementById(pair[0]), o=document.getElementById(pair[1]);
      i.addEventListener('input',function(){ o.textContent=i.value; });
    });
    document.getElementById('kReset').addEventListener('click',function(){
      var e=knobEls(); e.pitch.value=0; e.index.value=0.75; e.protect.value=0.33; e.vol.value=1;
      ['kPitch','kIndex','kProtect','kVol'].forEach(function(id){ document.getElementById(id).dispatchEvent(new Event('input')); });
    });
  }
  function knobPayload(){
    if(!knobs||knobs.hidden) return {};
    var e=knobEls();
    return {pitch:parseInt(e.pitch.value,10), index_rate:parseFloat(e.index.value), protect:parseFloat(e.protect.value), volume_envelope:parseFloat(e.vol.value)};
  }
  var current={blob:null, format:'wav'};
  function show(el){[idle,rec,got].forEach(function(x){x.hidden=(x!==el)});}
  function fmt(s){return Math.floor(s/60)+':'+('0'+Math.floor(s%60)).slice(-2);}
  function setStatus(t){ notice.hidden=false; statusEl.textContent=t; }
  recBtn.addEventListener('click',function(){
    navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false}}).then(function(st){
      chunks=[]; mr=new MediaRecorder(st);
      mr.ondataavailable=function(e){if(e.data.size)chunks.push(e.data);};
      mr.onstop=function(){
        var blob=new Blob(chunks,{type:mr.mimeType||'audio/webm'});
        current={blob:blob, format:(mr.mimeType||'').indexOf('ogg')>=0?'ogg':'webm'};
        player.src=URL.createObjectURL(blob);
        nameEl.textContent='Your take · '+fmt((Date.now()-t0)/1000);
        show(got); notice.hidden=true; resultEl.hidden=true;
        st.getTracks().forEach(function(tr){tr.stop();});
      };
      mr.start(); t0=Date.now(); timerEl.textContent='0:00';
      tick=setInterval(function(){timerEl.textContent=fmt((Date.now()-t0)/1000);},250);
      show(rec);
    }).catch(function(){ alert('Mic access was blocked — allow the microphone in your browser, or upload a file instead.'); });
  });
  document.getElementById('vtStop').addEventListener('click',function(){ clearInterval(tick); if(mr&&mr.state!=='inactive')mr.stop(); });
  document.getElementById('vtFile').addEventListener('change',function(e){
    var f=e.target.files[0]; if(!f)return;
    var ext=(f.name.split('.').pop()||'wav').toLowerCase();
    current={blob:f, format:['wav','mp3','flac','m4a','ogg','webm'].indexOf(ext)>=0?ext:'wav'};
    player.src=URL.createObjectURL(f);
    nameEl.textContent=f.name;
    show(got); notice.hidden=true; resultEl.hidden=true;
  });
  document.getElementById('vtReset').addEventListener('click',function(){ player.removeAttribute('src'); show(idle); notice.hidden=true; });

  document.getElementById('vtConvert').addEventListener('click',function(){
    if(!current.blob){ setStatus('Record or upload a vocal first.'); return; }
    if(current.blob.size>100*1024*1024){ setStatus('That file is over 100 MB — export a trimmed version and try again.'); return; }
    var invite=(inviteEl&&inviteEl.value||'').trim();
    try{ if(invite) localStorage.setItem('opi-invite',invite); }catch(e){}
    resultEl.hidden=true;
    var submit=function(payload){
      setStatus('Sending to the engine…');
      return fetch(API+'/convert',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(Object.assign({format:current.format,invite:invite},knobPayload(),payload))});
    };
    var start;
    if(current.blob.size>6*1024*1024){
      var mb=Math.round(current.blob.size/1048576);
      setStatus('Uploading your file ('+mb+' MB) to the vault…');
      start=fetch(API+'/upload',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Audio-Format':current.format},body:current.blob})
        .then(function(r){return r.json();})
        .then(function(u){ if(!u.upload_id) throw new Error(u.hint||u.error||'upload failed'); return submit({upload_id:u.upload_id}); });
    } else {
      setStatus('Reading your audio…');
      start=new Promise(function(res,rej){
        var fr=new FileReader();
        fr.onload=function(){res(String(fr.result).split(',')[1]);};
        fr.onerror=rej; fr.readAsDataURL(current.blob);
      }).then(function(b64){ return submit({audio_b64:b64}); });
    }
    start
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(res){
        if(!res.ok||!res.j.job){ setStatus('The engine said no: '+(res.j.hint||res.j.error||'unknown error')); return; }
        var trialNote=res.j.trial?' (15-sec trial — add an invite code for full length)':'';
        var started=Date.now(), misses=0, poll=function(){
          fetch(API+'/convert/'+res.j.job).then(function(r){return r.json();}).then(function(d){
            if(d&&d.error){ misses++; if(misses>=5){ setStatus('The engine lost track of this job (it happens if the studio reshuffles mid-song) — press Convert again, it\u2019s warm now.'); return; } setTimeout(poll,4000); return; }
            misses=0;
            if(d.status==='COMPLETED'&&(d.audio_b64||d.result_url)){
              var finish=function(src){
                outEl.src=src; dlEl.href=src;
                statusEl.textContent='Done'+trialNote+' ✨';
                ecoEl.textContent='🌱 '+(d.eco||''); resultEl.hidden=false;
              };
              if(d.audio_b64){ finish('data:audio/wav;base64,'+d.audio_b64); }
              else {
                setStatus('Downloading your conversion…');
                fetch(API+d.result_url).then(function(r){ if(!r.ok) throw 0; return r.blob(); }).then(function(b){
                  finish(URL.createObjectURL(b));
                  fetch(API+d.result_url,{method:'DELETE'}).catch(function(){});
                }).catch(function(){ setStatus('Conversion finished but the download failed — try Convert again.'); });
              }
            } else if(d.status==='FAILED'||d.status==='CANCELLED'||d.status==='TIMED_OUT'){
              setStatus('Conversion '+d.status.toLowerCase()+' — try again in a minute.');
            } else {
              var el=Math.round((Date.now()-started)/1000);
              setStatus(el<25?('In queue'+trialNote+' — a worker is waking up…'):(el<180?'Opi is singing… ('+el+'s)':'Still working… first wake of the day can take a few minutes ('+el+'s)'));
              setTimeout(poll,3000);
            }
          }).catch(function(){ setTimeout(poll,5000); });
        };
        poll();
      })
      .catch(function(e){ setStatus('Couldn\u2019t reach the engine: '+(e&&e.message||'try again soon.')); });
  });
})();

/* ---------- 6. Guided tour: ONE continuous track across pages (seams hidden in her silent gaps) ---------- */
(function(){
  // Absolute timeline (seconds) into tour-full.m4a. seam = navigate here; cues fire within [start,seam].
  var FULL='assets/tour/tour-full.m4a';
  var SEGMENTS={
    voice:  {start:0.0,   seam:52.0,  nextPage:'vocals.html',
      cues:[[4.75,'#vtIdle'],[15.15,'.vtool-tips'],[25.4,'#vtNotice'],[37.55,'.vtool .form-note']],
      acts:[[4.9,'press','#vtRecord'],[5.6,'recpulse','#vtRecord'],[8.8,'ghostfile'],[11.6,'gotstate'],
            [25.5,'press','#vtConvert'],[26.4,'status','Opi is singing\u2026 (demo)'],
            [33.5,'status','Done \u2728 \u2014 your real take comes back right here'],[48.2,'reset']]},
    market: {start:52.0,  seam:106.0, nextPage:'submit.html',
      cues:[[57.85,'.card .play'],[61.4,'.card .card-body'],[71.45,'.steps'],[92.3,'.filter-bar'],[100.25,'nav.top a[href$="voice.html"]']],
      acts:[[58.0,'press','.card .play'],[58.4,'pulse','.card .play'],[61.6,'cardpop','.card'],[83.3,'confetti'],[92.5,'chipdance'],[100.4,'glitch','nav.top a[href$="voice.html"]']]},
    sell:   {start:106.0, seam:9999,  nextPage:null,
      cues:[[109.75,'#sellTrack'],[118.3,'#sellCredits'],[124.7,'#sellOffer'],[137.35,'.pledges'],[152.1,'.agree']],
      acts:[[110.1,'ghosttype'],[118.6,'press','.pledges .pledge:nth-child(1)'],[125.2,'pricedemo'],[137.6,'pledgewave'],[152.3,'checkagree'],[160.0,'reset']]}
  };
  var btn=document.getElementById('tourBtn');
  if(!btn) return;
  var segName=btn.getAttribute('data-tour'); segName = segName==='voice'?'voice':(segName==='sell'?'sell':'market');
  var seg=SEGMENTS[segName], audio=null, spotted=null, xBtn=null, navved=false;
  function clearSpot(){ if(spotted){spotted.classList.remove('tour-spot'); spotted=null;} }
  var demoTouched=false;
  function act(kind, sel){
    var idle=document.getElementById('vtIdle'), got=document.getElementById('vtGot'),
        notice=document.getElementById('vtNotice'), st=document.getElementById('vtStatus'),
        name=document.getElementById('vtName'), result=document.getElementById('vtResult');
    if(kind==='press'){ var el=document.querySelector(sel); if(el){ el.classList.remove('tour-press'); void el.offsetWidth; el.classList.add('tour-press'); } }
    if(kind==='recpulse'||kind==='pulse'){ var e2=document.querySelector(sel); if(e2){ e2.classList.add('tour-recpulse'); setTimeout(function(){e2.classList.remove('tour-recpulse');},2400); } }
    if(kind==='cardpop'){ var cp=document.querySelector(sel); if(cp){ cp.classList.remove('tour-cardpop'); void cp.offsetWidth; cp.classList.add('tour-cardpop'); } }
    if(kind==='ghostfile'){ var card=document.querySelector('.vtool'); if(card){ var gf=document.createElement('div'); gf.className='ghost-file'; gf.textContent='\ud83c\udfb5 my-take.wav'; gf.style.top='90px'; gf.style.right='60px'; card.appendChild(gf); setTimeout(function(){gf.remove();},2300); } }
    if(kind==='gotstate' && idle && got){ demoTouched=true; idle.hidden=true; got.hidden=false; if(name) name.textContent='your take \u00b7 0:23 (demo)'; if(result) result.hidden=true; }
    if(kind==='status' && st){ demoTouched=true; st.setAttribute('data-tour-demo','1'); if(notice) notice.hidden=false; st.textContent=sel; }
    if(kind==='confetti'){ var cc=document.createElement('div'); cc.className='tour-confetti';
      for(var ci=0;ci<70;ci++){ var pi=document.createElement('i');
        pi.style.setProperty('--dx',((Math.random()*2-1)*45)+'vw'); pi.style.setProperty('--dy',(Math.random()*55+30)+'vh'); pi.style.setProperty('--r',(Math.random()*720-360)+'deg');
        pi.style.left='50%'; pi.style.top='18%'; pi.style.background=['#f26b4f','#a8a4ce','#f4f0e6','#e0392e'][ci%4]; pi.style.animationDelay=(Math.random()*0.35)+'s'; cc.appendChild(pi); }
      document.body.appendChild(cc); setTimeout(function(){cc.remove();},2800); }
    if(kind==='chipdance'){ document.querySelectorAll('.chip-btn').forEach(function(ch,i){ setTimeout(function(){ ch.classList.remove('tour-press'); void ch.offsetWidth; ch.classList.add('tour-press'); }, i*350); }); }
    if(kind==='glitch'){ var gl=document.querySelector(sel); if(gl){ gl.classList.add('tour-glitch'); setTimeout(function(){gl.classList.remove('tour-glitch');},2200); } }
    if(kind==='ghosttype'){ demoTouched=true; var ins=document.querySelectorAll('#sellTrack input'); var texts=['Midnight Run','128','F minor'];
      ins.forEach(function(inp,i){ if(i>2||!texts[i]) return; inp.setAttribute('data-tour-demo','1'); var t=texts[i], k=0; setTimeout(function type(){ if(k<=t.length){ inp.value=t.slice(0,k); k++; setTimeout(type,55);} }, i*1400); }); }
    if(kind==='pricedemo'){ demoTouched=true; var pr=document.querySelector('#sellOffer input[type=number]');
      if(pr){ pr.setAttribute('data-tour-demo','1'); var v=0; var iv=setInterval(function(){ v+=25; pr.value=v; if(v>=300){ clearInterval(iv);
        var off=document.getElementById('sellOffer'); if(off){ off.style.position='relative'; var gc=document.createElement('div'); gc.className='ghost-chip'; gc.textContent='\u2212 10% \u2192 you keep $270'; gc.style.top='-14px'; gc.style.right='10px'; off.appendChild(gc); setTimeout(function(){gc.remove();},3100); } } },70); } }
    if(kind==='pledgewave'){ document.querySelectorAll('.pledges .pledge').forEach(function(pl,i){ setTimeout(function(){ pl.classList.remove('tour-press'); void pl.offsetWidth; pl.classList.add('tour-press'); }, i*450); }); }
    if(kind==='checkagree'){ demoTouched=true; var ag=document.querySelector('.agree input'); if(ag){ ag.setAttribute('data-tour-demo','1'); ag.checked=true; } var sb=document.querySelector('.submit-form button[type=submit]'); if(sb){ sb.classList.remove('tour-press'); void sb.offsetWidth; sb.classList.add('tour-press'); } }
    if(kind==='reset'){ if(demoTouched){ if(idle) idle.hidden=false; if(got) got.hidden=true; if(notice) notice.hidden=true; if(st){ st.textContent=''; st.removeAttribute('data-tour-demo'); }
      document.querySelectorAll('input[data-tour-demo]').forEach(function(di){ if(di.type==='checkbox') di.checked=false; else di.value=''; di.removeAttribute('data-tour-demo'); }); demoTouched=false; } }
  }
  function setLabel(t){ btn.textContent=t; }
  function showX(show){
    if(show && !xBtn){ xBtn=document.createElement('button'); xBtn.className='tour-pill'; xBtn.style.marginLeft='10px'; xBtn.textContent='\u2715 End tour'; xBtn.addEventListener('click',endTour); btn.parentNode.insertBefore(xBtn, btn.nextSibling); }
    if(!show && xBtn){ xBtn.remove(); xBtn=null; }
  }
  function endTour(){ if(audio){audio.pause(); audio=null;} clearSpot(); act('reset'); showX(false); setLabel('\u25b6 Let Opi show you around'); try{ sessionStorage.removeItem('opi-tour-t'); sessionStorage.removeItem('opi-tour-chain'); }catch(e){} }
  var canAct=false, nextCue=0, nextAct=0;
  function begin(resumeAt){
    if(segName==='voice'){ var gotEl=document.getElementById('vtGot'); canAct=!!(seg.acts && gotEl && gotEl.hidden); }
    else if(segName==='sell'){ var ti=document.querySelector('#sellTrack input'); canAct=!!(seg.acts && ti && !ti.value); }
    else canAct=!!seg.acts;
    audio=new Audio(FULL); nextCue=0; nextAct=0; navved=false;
    audio.addEventListener('loadedmetadata',function(){ try{ audio.currentTime=(resumeAt!=null?resumeAt:seg.start); }catch(e){} });
    audio.addEventListener('timeupdate',function(){
      if(!audio) return;
      var ct=audio.currentTime;
      try{ sessionStorage.setItem('opi-tour-t', String(ct)); }catch(e){}
      while(canAct && seg.acts && nextAct<seg.acts.length && ct>=seg.acts[nextAct][0]){ act(seg.acts[nextAct][1], seg.acts[nextAct][2]); nextAct++; }
      while(nextCue<seg.cues.length && ct>=seg.cues[nextCue][0]){
        clearSpot(); var el=document.querySelector(seg.cues[nextCue][1]);
        if(el){ el.classList.add('tour-spot'); el.scrollIntoView({behavior:'smooth',block:'center'}); spotted=el; }
        nextCue++;
      }
      // hand off to next page during the silent gap
      if(!navved && seg.nextPage && ct>=seg.seam){
        navved=true; clearSpot(); act('reset');
        try{ sessionStorage.setItem('opi-tour-t', String(seg.seam)); sessionStorage.setItem('opi-tour-chain','1'); }catch(e){}
        window.location.href=seg.nextPage;
      }
    });
    audio.addEventListener('ended',function(){ clearSpot(); act('reset'); showX(false); audio=null; setLabel('\u2728 That\u2019s the tour \u2014 the stage is yours'); try{ sessionStorage.removeItem('opi-tour-t'); }catch(e){} setTimeout(function(){ setLabel('\u25b6 Let Opi show you around'); },5000); });
    audio.play().then(function(){ setLabel('\u23f8 Pause the tour'); showX(true); }).catch(function(){ audio=null; btn.classList.add('pulse'); });
  }
  btn.addEventListener('click',function(){
    btn.classList.remove('pulse');
    if(!audio){ begin(seg.start); return; }
    if(audio.paused){ audio.play(); setLabel('\u23f8 Pause the tour'); } else { audio.pause(); setLabel('\u25b6 Resume the tour'); }
  });
  // auto-start: fresh from landing (voice), or resumed hop from a previous page
  try{
    var t=parseFloat(sessionStorage.getItem('opi-tour-t'));
    var chained=sessionStorage.getItem('opi-tour-chain')==='1';
    var fromLanding=segName==='voice' && sessionStorage.getItem('opi-tour')==='1';
    if(fromLanding) sessionStorage.removeItem('opi-tour');
    if(chained) sessionStorage.removeItem('opi-tour-chain');
    if(fromLanding || (chained && !isNaN(t) && t>=seg.start-1 && (seg.seam>t))){
      setTimeout(function(){ if(!document.getElementById('gate')) begin(fromLanding?seg.start:t); else btn.classList.add('pulse'); },500);
    }
  }catch(e){}
})();

/* chimes: hook into the conversion status via tiny observer on the status element */
(function(){
  var statusEl=document.getElementById('vtStatus');
  if(!statusEl) return;
  var played={ready:false,working:false,error:false};
  function chime(f){ try{ new Audio('assets/tour/'+f).play().catch(function(){}); }catch(e){} }
  new MutationObserver(function(){
    if(statusEl.hasAttribute('data-tour-demo')) return;
    var t=statusEl.textContent||'';
    if(/Done/.test(t) && !played.ready){ played.ready=true; played.working=true; chime('ready-2.m4a'); }
    else if(/failed|lost track|tripped/i.test(t) && !played.error){ played.error=true; chime('error-1.m4a'); }
    else if(/\((7[5-9]|8[0-9])s\)/.test(t) && !played.working){ played.working=true; chime('working-1.m4a'); }
    else if(/Sending to the engine/.test(t)){ played={ready:false,working:false,error:false}; }
  }).observe(statusEl,{childList:true,characterData:true,subtree:true});
})();


/* ---------- 7. Opi Radio: shuffle the catalog while you browse ---------- */
(function(){
  var rb=document.getElementById('radioBtn');
  if(!rb) return;
  var nodes=document.querySelectorAll('#marketGrid .play[data-src]');
  var items=[]; nodes.forEach(function(b){ items.push({src:b.getAttribute('data-src'), title:b.getAttribute('data-title')}); });
  if(!items.length){ rb.hidden=true; return; }
  var order=[], pos=0, audio=null, nextBtn=null;
  function shuffle(){ order=items.slice();
    for(var i=order.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=order[i]; order[i]=order[j]; order[j]=t; }
    pos=0; }
  function label(t){ rb.textContent=t; }
  function showNext(sh){
    if(sh&&!nextBtn){ nextBtn=document.createElement('button'); nextBtn.className='tour-pill'; nextBtn.style.marginLeft='10px';
      nextBtn.textContent='\u23ed'; nextBtn.title='Next track'; nextBtn.addEventListener('click',nextTrack);
      rb.parentNode.insertBefore(nextBtn, rb.nextSibling); }
    if(!sh&&nextBtn){ nextBtn.remove(); nextBtn=null; }
  }
  function announce(){ try{ document.dispatchEvent(new CustomEvent('opi-audio',{detail:'radio'})); }catch(e){} }
  function playCur(){
    var it=order[pos];
    if(!audio){ audio=new Audio(); audio.addEventListener('ended',nextTrack); }
    audio.src=it.src;
    audio.play().then(function(){ announce(); label('\ud83d\udcfb '+it.title+' \u00b7 \u23f8'); showNext(true); })
      .catch(function(){ label('\ud83d\udcfb tap again to start the radio'); });
  }
  function nextTrack(){ pos=pos+1; if(pos>=order.length){ shuffle(); } playCur(); }
  rb.addEventListener('click',function(){
    if(!audio||!audio.src){ shuffle(); playCur(); return; }
    if(audio.paused){ audio.play(); announce(); label('\ud83d\udcfb '+order[pos].title+' \u00b7 \u23f8'); }
    else { audio.pause(); label('\ud83d\udcfb paused \u2014 tap to resume'); }
  });
  document.addEventListener('opi-audio',function(e){
    if(e.detail!=='radio' && audio && !audio.paused){ audio.pause(); label('\ud83d\udcfb Opi Radio \u2014 tap to resume'); }
  });
})();
