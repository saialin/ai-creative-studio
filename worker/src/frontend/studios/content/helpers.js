// AI Creative Studio — Content Studio / helpers.js (V2 refactor)
// Browser-side helpers — extracted VERBATIM from frontend/content.js (v1, byte-identical slice).
// The whole <script> is reassembled in page.js in the original source order.
export const HELPERS_SCRIPT = `(function init(){
  setVoiceGender('male'); // Default: Male → Puck (chip + voiceSel consistent)
  updateConditionalFields();
  if(!token){document.getElementById('loginView').style.display='flex';document.getElementById('aicsApp').style.display='none';return;}
  var _ue=document.getElementById('userEmail');if(_ue)_ue.textContent=userEmail||'—';
  var _pb=document.getElementById('planBadge');if(_pb)_pb.textContent=userPlan||'FREE';
  buildQuickActions();
})();

// ===== Branch Stepper Helpers =====
function csMeta(n){
  var modes=['main','video','audio'];
  for(var m=0;m<modes.length;m++){
    var steps=CS_STEPS[modes[m]];
    for(var i=0;i<steps.length;i++)if(steps[i].n===n)return steps[i];
  }
  return null;
}
function csModeSteps(){ return CS_STEPS[CS_MODE]||CS_STEPS.main; }
function csAllowed(n){
  if(csDone[n])return true;
  var m=csMeta(n); if(!m)return false;
  var req=m.req||[];
  if(req.length===0)return true;
  for(var i=0;i<req.length;i++)if(!csDone[req[i]])return false;
  return true;
}
function csNav(n){
  var m=csMeta(n); if(!m)return;
  if(m.lock){ showToastMsg('ဤအဆင့်သည် AI ဆောင်ရွက်နေချိန် အဆင့်ဖြစ်ပြီး ကိုယ်တိုင် ရွေးချယ်၍ မရပါ'); return; }
  if(!csAllowed(n)){ showToastMsg('အရင်အဆင့်များ ပြီးမှ ဤအဆင့်သို့ ဆက်သွားနိုင်ပါသည်'); return; }
  csCur=n; csShow(n);
}
// Program အလိုအလျောက် သွားရန် (Branch) — Lock & Req ကို ကျော်သည်
function csGoForce(n){ csCur=n; csShow(n); }
function csMarkDone(n){ csDone[n]=true; csUpdateStepper(); }
// Error ဖြစ်သော Processing Step ကို Done အဖြစ် မသတ်မှတ်စေရန် — Done အခြေအနေကို ပြန်ဖျက်သည်
function csUnmarkDone(n){ csDone[n]=false; csUpdateStepper(); }
function csShow(n){
  var steps=document.querySelectorAll('.aics-step');
  for(var i=0;i<steps.length;i++){
    var ds=steps[i].getAttribute('data-step');
    var match=false;
    if(parseInt(ds,10)===n)match=true;
    else if(n===2&&(ds==='2b'||ds==='2c'))match=true; // Content Result ၃ ပိုင်း (Result / Edit / Output Hub) အတူတူပြရန်
    steps[i].classList.toggle('active',match);
  }
  if(n===2)showResultView(csResultView); // Linear — Result Stage အတွင်းရှိ panel ကို ပြသည်
  var w=document.getElementById('aicsWork'); if(w)w.scrollTop=0;
  csUpdateStepper();
  if(window.studioOnStep){ try{ window.studioOnStep(n); }catch(e){} }
}

// ===== Linear Workflow Stepper (Pilot — shared workflow layer) =====
// UX: INPUT → GENERATE → RESULT → REVIEW → FINAL — Stepper သည် 1 → 2 သာ။
// Video/Audio တို့ကို Branch Stepper အဖြစ် မပြတော့ဘဲ Result Stage ၏ panel များအဖြစ် ပြသည်။
function csStepHtml(s,index){
  var label=((index+1<10)?'0':'')+(index+1)+' '+String(s.label).replace(/^\\d+\\s*/,'');
  return '<button class="aics-step-btn" data-step="'+s.n+'" onclick="csNav('+s.n+')">'+
    '<span class="aics-step-txt"><span class="aics-step-label">'+label+'</span></span>'+
    '<span class="aics-step-loading"><span class="aics-step-spinner"></span>'+(s.loading||'ဖန်တီးနေသည်...')+'</span></button>';
}
function csRenderStepper(){
  var c=document.getElementById('aicsStepper'); if(!c)return;
  var steps=CS_STEPS.main; // Main steps သာ — Branch steps မပြတော့
  var html='<div class="aics-stepper-inner">';
  for(var i=0;i<steps.length;i++){
    html+=csStepHtml(steps[i],i);
    if(i<steps.length-1)html+='<span class="aics-step-link"></span>';
  }
  html+='</div>';
  c.innerHTML=html;
  var bs=document.getElementById('aicsBranchStepper');
  if(bs){bs.style.display='none';bs.innerHTML='';} // Legacy branch bar — မပြတော့
  csUpdateStepper();
}
function csUpdateStepper(){
  var btns=document.querySelectorAll('.aics-step-btn');
  for(var i=0;i<btns.length;i++){
    var n=parseInt(btns[i].getAttribute('data-step'),10);
    var m=csMeta(n);
    btns[i].classList.remove('active','done','todo','cs-busy');
    if(n===csCur)btns[i].classList.add('active');
    else if(csDone[n])btns[i].classList.add('done');
    else if(!csAllowed(n)||(m&&m.lock))btns[i].classList.add('todo');
  }
  if(window.studioScrollActiveStep)window.studioScrollActiveStep(true);
}
// Legacy compat — draft migration အတွက်သာ (branch step navigation မရှိတော့)
function csSetMode(mode){
  if(mode==='video')csResultView='video';
  else if(mode==='audio')csResultView='audio';
  else csResultView='content';
}

// ===== Result Stage Panels (Branch Stepper အစား — Result အတွင်းမှ panel များ) =====
function showResultView(v){
  csResultView=(v==='video'||v==='audio')?v:'content';
  var pc=document.getElementById('panelContent');
  var pe=document.getElementById('panelContentEdit');
  var ph=document.getElementById('panelContentHub');
  var pv=document.getElementById('panelVideo');
  var pa=document.getElementById('panelAudio');
  if(pc)pc.style.display=(csResultView==='content')?'':'none';
  if(pe)pe.style.display=(csResultView==='content')?'':'none';
  if(ph)ph.style.display=(csResultView==='content')?'':'none';
  if(pv)pv.style.display=(csResultView==='video')?'':'none';
  if(pa)pa.style.display=(csResultView==='audio')?'':'none';
}
function showVideoSetupPhase(){
  var s=document.getElementById('videoSetupBlock'); if(s)s.style.display='';
  var r=document.getElementById('videoResultBlock'); if(r)r.style.display='none';
}
function showVideoResultPhase(){
  var s=document.getElementById('videoSetupBlock'); if(s)s.style.display='none';
  var r=document.getElementById('videoResultBlock'); if(r)r.style.display='';
}
function showAudioSetupPhase(){
  var s=document.getElementById('audioSetupBlock'); if(s)s.style.display='';
  var r=document.getElementById('audioResultBlock'); if(r)r.style.display='none';
}
function showAudioResultPhase(){
  var s=document.getElementById('audioSetupBlock'); if(s)s.style.display='none';
  var r=document.getElementById('audioResultBlock'); if(r)r.style.display='';
}

// ===== Output Hub — Branch ဖွင့်ခြင်း (Auto-Transfer — Section 11 / 14) =====
function getEditedContent(){
  var ta=document.getElementById('contentOut');
  var v=(ta&&ta.value!==undefined&&ta.value!==null)?ta.value:'';
  if(typeof v!=='string'||!v.trim())v=(lastResult&&lastResult.content)||'';
  return v;
}
function openBranch(kind){
  if(!lastResult||!lastResult.content){ showToastMsg('အရင် Content ကို ဖန်တီးပါ'); return; }
  var content=getEditedContent();
  contentState.editedResult=content;
  if(kind==='video'){
    videoState.content=content;
    var vt=document.getElementById('videoContentText'); if(vt){vt.value=content;autoGrow(vt);}
    var vp=document.getElementById('videoContentPreview'); if(vp){vp.textContent=content;vp.style.display='';}
    showResultView('video');
    if(videoPlan)showVideoResultPhase(); else showVideoSetupPhase();
  }else if(kind==='audio'){
    // Audio ကို Content Studio အတွင်းမှာပဲ Result panel အဖြစ် ဆက်လုပ်သည် —
    // Copy/paste မလိုအပ် — နောက်ဆုံး edit လုပ်ထားသော Content ကို Auto-fill လုပ်သည်။
    audioState.content=content;
    var ap=document.getElementById('audioContentPreview'); if(ap){ap.textContent=content;ap.style.display='';}
    var tt=document.getElementById('ttsText'); if(tt){tt.value=content;autoGrow(tt);}
    showResultView('audio');
    if(currentAudioBase64)showAudioResultPhase(); else showAudioSetupPhase();
  }
  csGoForce(2); // Stepper သည် Result step (2) တွင် ရှိနေသည် — branch step မရှိ
}
function backToContentResult(){
  showResultView('content');
  if(csDone[2]){ csGoForce(2); } else { csGoForce(1); }
}
// ===== Cross-Studio Handoff (Explicit Contract — shared-workflow.js) =====
// Content → Voice: aicsTransfer.write('voice', contract) — Voice Studio သည်
// ဤ contract ကို ဖတ်၍ TTS input auto-fill လုပ်ပါမည် (producer side fix)
function sendToVoice(){
  if(!lastResult||!lastResult.content){ showToastMsg('အရင် Content ကို ဖန်တီးပါ'); return; }
  var content=getEditedContent();
  var ok=window.aicsTransfer&&window.aicsTransfer.write('voice',{
    source:'content',
    sourceType:'text',
    payload:{text:content, speakingStyle:lastResult.speakingStyle||'', voiceStyle:lastResult.voiceStyle||''},
    metadata:{}
  });
  if(!ok){ showToastMsg('Voice သို့ ပို့၍ မရပါ — ထပ်စမ်းပါ'); return; }
  showToastMsg('✓ Voice Studio သို့ ပို့လိုက်ပါပြီ');
  setTimeout(function(){ try{ location.href='/app/voice'; }catch(e){} }, 600);
}
function scrollToRevise(){
  var el=document.getElementById('feedbackInput');
  if(el){ try{ el.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){ el.focus(); } }
}

// ===== Helpers — Loading / Error / Toast =====
function setGenButtonsDisabled(off){
  var acts=document.querySelectorAll('.aics-actions .aics-act');
  for(var i=0;i<acts.length;i++)acts[i].disabled=off;
  var ids=['genBtn','videoGenBtn','voiceBtn','reviseBtn','srtBtn','translateBtn'];
  for(var j=0;j<ids.length;j++){var el=document.getElementById(ids[j]);if(el)el.disabled=off;}
}
function setLoading(id,show){
  var el=document.getElementById(id);
  if(el){ if(show)el.classList.add('show'); else el.classList.remove('show'); }
  var meta=csMeta(csCur)||{};
  if(window.studioSetLoading){
    window.studioSetLoading({on:show,step:csCur,text:meta.loading||''});
  }
}
function showError(id,msg){ var el=document.getElementById(id); if(!el)return; el.textContent=msg; el.classList.add('show'); }
function hideError(id){ var el=document.getElementById(id); if(el)el.classList.remove('show'); }
function copyText(id){
  var el=document.getElementById(id); if(!el)return;
  var text=el.value||el.textContent;
  if(navigator.clipboard)navigator.clipboard.writeText(text).then(function(){showToastMsg();});
  else{var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToastMsg();}
}
function showToastMsg(msg){ var t=document.getElementById('toast'); if(!t)return; t.textContent=msg||'&#9989; ကူးယူပြီးပါပြီ'; t.classList.add('show'); setTimeout(function(){t.classList.remove('show');},2000); }
function escapeHtml(s){ var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function autoGrow(el){ if(!el)return; el.style.height='auto'; el.style.height=(el.scrollHeight+4)+'px'; }
function onContentEdit(){ if(typingNow)return; if(!lastResult)return; lastResult.content=document.getElementById('contentOut').value; contentState.editedResult=lastResult.content; }

// ===== Typewriter Effect + Auto Expand (Section 9) =====
var typeTimer=null;
var typingNow=false;
function stopTypewriter(){ if(typeTimer){clearInterval(typeTimer);typeTimer=null;} typingNow=false; }
function typewriterFill(ta,text,onDone){
  if(!ta)return;
  stopTypewriter();
  var full=text||'';
  if(!full){ta.value='';autoGrow(ta);if(onDone)onDone();return;}
  ta.readOnly=true;
  ta.value='';
  autoGrow(ta);
  typingNow=true;
  var i=0;
  typeTimer=setInterval(function(){
    i+=2;
    if(i>full.length)i=full.length;
    ta.value=full.slice(0,i);
    autoGrow(ta);
    if(i>=full.length){
      clearInterval(typeTimer);typeTimer=null;typingNow=false;ta.readOnly=false;
      if(onDone)onDone();
    }
  },14);
}

function buildQuickActions(){
  var c=document.getElementById('quickActions');if(!c)return;
  c.innerHTML='';
  for(var i=0;i<QUICK_ACTIONS.length;i++){
    (function(a){
      var chip=document.createElement('div');
      chip.className='type-chip';
      chip.innerHTML=a.label;
      chip.onclick=function(){quickAction(a.kind);};
      c.appendChild(chip);
    })(QUICK_ACTIONS[i]);
  }
}

function quickAction(kind){
  if(!lastResult){showError('revError','အရင် Content ကို ဖန်တီးပါ');return;}
  var preset=QUICK_PROMPTS[kind]||'ပြင်ပါ';
  var feedback=preset;
  if(kind==='tone'){
    var tone=prompt('ဘယ်လို Tone ပြောင်းချင်ပါသလဲ? (ဥပမာ — ရယ်စရာ / လေးနက် / ဖော်ရွေ / စိတ်လှုပ်ရှားဖွယ်)','ရယ်စရာ');
    if(tone===null)return;
    feedback='Tone ကို "'+tone+'" ဖြစ်အောင် ပြောင်းပါ';
  }
  document.getElementById('feedbackInput').value=feedback;
  reviseContent();
}

function apiCall(url,body){
  var s=document.getElementById('aiModelSel');if(s&&s.value)body.model=s.value;
  return fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(body)}).then(function(res){return res.json().then(function(data){if(!res.ok)throw new Error(data.detail||data.error||'Request failed');return data;});});
}

`;
