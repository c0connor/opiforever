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

/* ---------- 4. Marketplace license filter ---------- */
(function(){
  var chips=document.querySelectorAll('.chip-btn[data-filter]');
  if(!chips.length) return;
  chips.forEach(function(c){ c.addEventListener('click',function(){
    chips.forEach(function(x){x.classList.remove('active')}); c.classList.add('active');
    var f=c.getAttribute('data-filter'), any=false;
    document.querySelectorAll('#marketGrid .card').forEach(function(card){
      var show=(f==='all')||card.getAttribute('data-lic')===f;
      card.style.display=show?'':'none'; if(show) any=true;
    });
    var empty=document.getElementById('exclusiveEmpty'); if(empty) empty.hidden=any;
  });});
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
        body:JSON.stringify(Object.assign({format:current.format,invite:invite},payload))});
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
        var started=Date.now(), poll=function(){
          fetch(API+'/convert/'+res.j.job).then(function(r){return r.json();}).then(function(d){
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
