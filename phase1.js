/* CoolCalci Phase 1 — local product preview. Real auth, billing and server-side entitlements arrive in later phases. */
(function () {
  'use strict';
  const KEY = 'coolcalci_phase1_v5';
  const DAY = 86400000;
  const examples = [
    {title:'Everyday math', desc:'Percentages, totals, changes and growth.', prompt:'What is 18% of 2500?'},
    {title:'Risk management', desc:'Account risk and position planning.', prompt:'I have a $5000 account and want to risk 1%. How much is my maximum risk?'},
    {title:'Trading R:R', desc:'Entry, SL, TP and reward-to-risk.', prompt:'Calculate risk to reward if entry is 3650, stop loss 3645 and target 3665.'},
    {title:'XAUUSD lot size', desc:'Gold position sizing from account risk.', prompt:'Calculate XAUUSD lot size for a $5000 account, 1% risk, entry 3650 and stop loss 3645.'},
    {title:'Percentage change', desc:'Measure gains, losses and price moves.', prompt:'What is the percentage change from 3500 to 3675?'},
    {title:'SL / TP planning', desc:'Build targets from entry, risk and R:R.', prompt:'Calculate XAUUSD take profit for a buy entry 3650 with a 5 point stop distance and 1:3 R:R.'}
  ];
  const $ = id => document.getElementById(id);
  const input = $('calcInput'), chat = $('chat');
  let state = load();
  function load(){
    try { const s=JSON.parse(localStorage.getItem(KEY)||'null'); if(s) return s; } catch(e){}
    return {usage:0, day:new Date().toISOString().slice(0,10), history:[], saved:[], plan:'free'};
  }
  function saveState(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function today(){ return new Date().toISOString().slice(0,10); }
  function retention(){ return state.plan==='pro-yearly'?365*DAY:state.plan==='pro-monthly'?30*DAY:DAY; }
  function clean(){
    if(state.day!==today()){ state.day=today(); state.usage=0; }
    state.history=(state.history||[]).filter(x=>Date.now()-x.time<retention());
    state.saved=(state.saved||[]).filter(x=>Date.now()-x.time<365*DAY);
    saveState();
  }
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function titleFor(q){return q.length>48?q.slice(0,48)+'…':q;}
  function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__ccToast);window.__ccToast=setTimeout(()=>t.classList.remove('show'),2200);}
  function render(){
    clean();
    const free=state.plan==='free';
    $('usageCount').textContent=free?Math.min(state.usage,3)+' / 3 free today':'Unlimited';
    $('usageBar').style.width=free?Math.min(100,state.usage/3*100)+'%':'100%';
    $('usageLabel').textContent=free?'Free usage':'Pro usage';
    $('planPill').textContent=free?'Free plan':state.plan==='pro-monthly'?'Pro · Monthly':'Pro · Yearly';
    $('hint').textContent=free?'Free plan includes 3 calculation previews per day · History stays for 24 hours.':'Pro includes unlimited calculations · History stays for '+(state.plan==='pro-monthly'?'1 month.':'1 year.');
    const h=$('history');
    h.innerHTML=state.history.length?state.history.map((x,i)=>`<button data-history="${i}"><span>${esc(x.title)}</span><small>${new Date(x.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></button>`).join(''):`<div class="empty-history">Recent calculations stay visible for ${free?'24 hours.':state.plan==='pro-monthly'?'1 month.':'1 year.'}</div>`;
  }
  function calculate(q){
    const s=q.toLowerCase().replace(/,/g,'').replace(/\$/g,'');
    let m=s.match(/([\d.]+)\s*%\s*(?:of|on)\s*([\d.]+)/);
    if(m){const a=+m[1],b=+m[2];return {r:(a*b/100).toLocaleString(undefined,{maximumFractionDigits:8}),f:`${a}% × ${b} ÷ 100`};}
    m=s.match(/percentage change from\s*([\d.]+)\s*to\s*([\d.]+)/);
    if(m){const a=+m[1],b=+m[2];return {r:((b-a)/a*100).toFixed(4)+'%',f:`(${b} − ${a}) ÷ ${a} × 100`};}
    m=s.match(/account.*?(?:risk|risking).*?([\d.]+)\s*%/);
    if(m){const acct=(s.match(/([\d.]+)\s*(?:account|capital)/)||[])[1];if(acct)return {r:'$'+(+acct*+m[1]/100).toFixed(2)+' maximum risk',f:`${acct} × ${m[1]}%`};}
    m=s.match(/entry\s*(?:is|=)?\s*([\d.]+).*?(?:stop loss|sl)\s*(?:is|=)?\s*([\d.]+).*?(?:target|tp)\s*(?:is|=)?\s*([\d.]+)/);
    if(m){const e=+m[1],sl=+m[2],tp=+m[3],risk=Math.abs(e-sl),reward=Math.abs(tp-e);return risk?{r:`Risk ${risk.toFixed(2)} · Reward ${reward.toFixed(2)} · R:R 1:${(reward/risk).toFixed(2)}`,f:`Risk = |${e} − ${sl}| · Reward = |${tp} − ${e}|`}:null;}
    m=s.match(/xauusd.*?lot size.*?([\d.]+).*?account.*?([\d.]+)\s*%.*?entry.*?([\d.]+).*?(?:stop loss|sl).*?([\d.]+)/);
    if(m){const acct=+m[1],pct=+m[2],entry=+m[3],sl=+m[4],risk=acct*pct/100,dist=Math.abs(entry-sl);if(dist)return {r:`≈ ${(risk/(dist*100)).toFixed(2)} lots`,f:`Risk $${risk.toFixed(2)} ÷ ($${dist.toFixed(2)} × $100 per $1 move per lot)`};}
    m=s.match(/xauusd.*?(?:take profit|tp).*?buy.*?entry\s*([\d.]+).*?(?:([\d.]+)\s*point).*?1:([\d.]+)/);
    if(m){const e=+m[1],points=+m[2],rr=+m[3],distance=points*0.01,tp=e+distance*rr;return {r:`Buy TP ≈ ${tp.toFixed(2)}`,f:`Entry ${e} + (${points} points × 0.01 × ${rr}R)`};}
    if(/risk to reward|r:r/.test(s)) return {r:'Enter entry, stop loss and target for an exact R:R.',f:'R:R = reward ÷ risk'};
    if(/^[\d\s()+\-*/.%]+$/.test(s)){try{return {r:String(Function('"use strict";return ('+s+')')()),f:s};}catch(e){}}
    return null;
  }
  function resultCard(q,out){
    const b=document.createElement('div');b.className='msg bot';b.dataset.query=q;
    b.innerHTML='<div class="bubble"><div class="answer-title">CoolCalci result</div><div class="result"></div><div class="formula"></div><div class="actions"><button data-copy>Copy result</button><button data-save>Save</button></div></div>';
    b.querySelector('.result').textContent=out.r;b.querySelector('.formula').textContent=out.f;return b;
  }
  function submit(q){
    q=q.trim();if(!q)return;
    clean();
    if(state.plan==='free'&&state.usage>=3){openPricing();toast("You've reached today's free preview limit.");return;}
    $('welcome')?.remove();
    const u=document.createElement('div');u.className='msg user';u.innerHTML='<div class="bubble"></div>';u.querySelector('.bubble').textContent=q;chat.appendChild(u);
    const out=calculate(q)||{r:'I could not calculate that in the Phase-1 preview. Try one of the six supported examples or a basic numeric expression.',f:'Preview calculation'};
    chat.appendChild(resultCard(q,out));
    if(state.plan==='free')state.usage++;
    state.history.unshift({q,title:titleFor(q),r:out.r,time:Date.now()});saveState();render();chat.scrollTop=chat.scrollHeight;
  }
  function openInfo(kind){
    const c=$('infoContent');
    if(kind==='help'){
      c.innerHTML='<h2>How CoolCalci works</h2><p>Ask a calculation in normal language. Choose a suggestion, edit it if needed, then press Calculate. Results show the answer and the logic used.</p><div class="help-grid"><div><b>1. Ask</b><span>Type naturally or choose an example.</span></div><div><b>2. Calculate</b><span>Review the result and formula.</span></div><div><b>3. Verify</b><span>For trading, confirm your broker’s contract specifications.</span></div><div><b>4. Save</b><span>Save useful results for quick reference.</span></div></div><h3>What CoolCalci is built for</h3><p>Everyday mathematics, percentages, finance, account risk, XAUUSD/Forex position sizing, SL/TP, R:R and future AI-powered calculation services.</p>';
    } else if(kind==='saved'){
      c.innerHTML='<h2>Saved calculations</h2><p>Your saved results are separate from Recent history and are not removed when the daily free limit is reached.</p><div class="example-list">'+(state.saved.length?state.saved.map((x,i)=>`<button class="example-row" data-saved="${i}"><b>${esc(x.title)}</b><span>${esc(x.r)}</span></button>`).join(''):'<p>No saved calculations yet. Use Save on a result to keep it here.</p>')+'</div>';
    } else {
      c.innerHTML='<h2>CoolCalci Examples</h2><p>These examples represent the different kinds of calculations CoolCalci is designed to handle. Tap one to load it into the calculator.</p><div class="example-list">'+examples.map((x,i)=>`<button class="example-row" data-example="${i}"><b>${esc(x.title)}</b><span>${esc(x.desc)}</span></button>`).join('')+'</div>';
    }
    $('infoOverlay').classList.add('open');
  }
  function openPricing(){$('pricingOverlay').classList.add('open');$('pricingOverlay').setAttribute('aria-hidden','false');}
  function closePricing(){$('pricingOverlay').classList.remove('open');$('pricingOverlay').setAttribute('aria-hidden','true');}
  function renderExamples(){
    $('suggestions').innerHTML=examples.map((x,i)=>`<button class="card" data-example="${i}"><b>${esc(x.title)}</b><span>${esc(x.desc)}</span></button>`).join('');
  }
  $('calcForm').addEventListener('submit',e=>{e.preventDefault();submit(input.value);input.value='';});
  document.addEventListener('click',e=>{
    const ex=e.target.closest('[data-example]');
    if(ex){const x=examples[+ex.dataset.example];if(x){$('infoOverlay').classList.remove('open');input.value=x.prompt;input.focus();}return;}
    const h=e.target.closest('[data-history]');if(h){input.value=state.history[+h.dataset.history]?.q||'';input.focus();return;}
    const sv=e.target.closest('[data-saved]');if(sv){input.value=state.saved[+sv.dataset.saved]?.q||'';$('infoOverlay').classList.remove('open');input.focus();return;}
    if(e.target.closest('[data-copy]')){const r=e.target.closest('.bubble').querySelector('.result').textContent;navigator.clipboard?.writeText(r);toast('Result copied');return;}
    if(e.target.closest('[data-save]')){const card=e.target.closest('.msg.bot'),q=card.dataset.query,r=card.querySelector('.result').textContent,f=card.querySelector('.formula').textContent;state.saved.unshift({q,title:titleFor(q),r:r+' · '+f,time:Date.now()});saveState();toast('Calculation saved');return;}
    if(e.target.closest('[data-open-pricing]')){openPricing();return;}
    if(e.target.closest('[data-close-info]')){$('infoOverlay').classList.remove('open');return;}
  });
  $('helpBtn').onclick=()=>openInfo('help');$('mobileHelp').onclick=()=>openInfo('help');$('examplesBtn').onclick=()=>openInfo('examples');$('showAllExamples').onclick=()=>openInfo('examples');$('savedBtn').onclick=()=>openInfo('saved');
  $('clearHistory').onclick=()=>{state.history=[];saveState();render();toast('Recent history cleared');};
  $('mobileClear').onclick=()=>$('clearHistory').click();$('calculatorBtn').onclick=()=>input.focus();
  $('newChat').onclick=()=>{location.reload();};
  $('closePricing').onclick=closePricing;
  $('pricingOverlay').addEventListener('click',e=>{if(e.target===$('pricingOverlay'))closePricing();});
  document.querySelectorAll('[data-billing]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-billing]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
    const annual=btn.dataset.billing==='annual';$('monthlyPrice').textContent=annual?'$50':'$5';$('priceSuffix').textContent=annual?'/ year':'/ month';$('annualNote').textContent=annual?'Save $10 vs monthly':'Best value · $50/year';$('proCta').textContent=annual?'Choose Pro yearly':'Choose Pro monthly';
  }));
  $('proCta').onclick=()=>{const annual=document.querySelector('[data-billing].active')?.dataset.billing==='annual';state.plan=annual?'pro-yearly':'pro-monthly';saveState();render();closePricing();toast('Pro preview enabled on this browser');};
  renderExamples();render();
})();
