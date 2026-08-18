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
