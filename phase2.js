/* CoolCalci Phase 2 — authentication, cloud history, entitlements and secure usage bridge. */
(function () {
  'use strict';

  const CFG = window.COOLCALCI_SUPABASE_CONFIG || {};
  const KEY = 'coolcalci_phase1_v5';
  const supabaseLib = window.supabase;
  const configured = !!(supabaseLib && CFG.url && CFG.publishableKey && !String(CFG.publishableKey).startsWith('REPLACE_'));
  const $ = id => document.getElementById(id);
  const DAY = 86400000;

  let client = null;
  let mode = 'signin';
  let busy = false;
  let bypassNextSubmit = false;

  function toast(msg) {
    const t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show'); clearTimeout(window.__ccToast2);
    window.__ccToast2 = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function localState() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {history:[], saved:[], usage:0, day:new Date().toISOString().slice(0,10), plan:'free'}; }
    catch (_) { return {history:[], saved:[], usage:0, day:new Date().toISOString().slice(0,10), plan:'free'}; }
  }
  function writeLocalState(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} }
  function normalizePlan(plan) {
    if (plan === 'pro_monthly' || plan === 'pro-monthly') return 'pro-monthly';
    if (plan === 'pro_yearly' || plan === 'pro-yearly') return 'pro-yearly';
    return 'free';
  }
  function retentionMs(plan) {
    if (plan === 'pro-yearly') return 365 * DAY;
    if (plan === 'pro-monthly') return 31 * DAY;
    return DAY;
  }
  function openAuth() { const o=$('authOverlay'); if(!o)return; o.classList.add('open'); o.setAttribute('aria-hidden','false'); $('authEmail')?.focus(); }
  function closeAuth() { const o=$('authOverlay'); if(!o)return; o.classList.remove('open'); o.setAttribute('aria-hidden','true'); }
  function status(message,error) { const el=$('authStatus'); if(!el)return; el.textContent=message||''; el.classList.toggle('error',!!error); }
  function setMode(next) {
    mode=next; const signup=mode==='signup';
    $('signInTab')?.classList.toggle('active',!signup); $('signUpTab')?.classList.toggle('active',signup);
    if($('nameLabel')) $('nameLabel').hidden=!signup;
    if($('authSubmit')) $('authSubmit').textContent=signup?'Create account':'Sign in';
    if($('authTitle')) $('authTitle').textContent=signup?'Create your CoolCalci account':'Sign in to CoolCalci';
    if($('authSubtitle')) $('authSubtitle').textContent=signup?'Keep your calculations synced across devices.':'Sync your history and saved calculations across devices.';
    if($('authPassword')) $('authPassword').autocomplete=signup?'new-password':'current-password'; status('');
  }
  function renderAuthUser(user) {
    const area=$('authArea'); if(!area)return;
    if(!user){ area.innerHTML='<button class="auth-button" id="authBtn">Sign in</button>'; $('authBtn').onclick=openAuth; return; }
    const email=user.email||'Signed-in user';
    const safeEmail=String(email).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
    area.innerHTML=`<div class="auth-user"><span class="cloud-badge"><span class="cloud-dot"></span>Cloud sync</span><small title="${safeEmail}">${safeEmail}</small><button class="auth-button" id="signOutBtn">Sign out</button></div>`;
    $('signOutBtn').onclick=async()=>{await client?.auth.signOut();toast('Signed out');};
  }
  async function getEntitlement(userId) {
    if(!client||!userId)return {plan:'free',role:'user',status:'active',historyRetentionDays:1,unlimitedCalculations:false};
    const {data,error}=await client.rpc('get_my_entitlement');
    if(error){ console.error('CoolCalci entitlement:',error); return {plan:'free',role:'user',status:'active',historyRetentionDays:1,unlimitedCalculations:false}; }
    const row=Array.isArray(data)?data[0]:data;
    return {plan:normalizePlan(row?.plan),role:row?.role||'user',status:row?.status||'active',historyRetentionDays:Number(row?.history_retention_days||1),unlimitedCalculations:!!row?.unlimited_calculations};
  }
  function applyEntitlement(ent) {
    const s=localState(); s.plan=normalizePlan(ent?.plan); s.role=ent?.role||'user'; s.unlimitedCalculations=!!ent?.unlimitedCalculations; writeLocalState(s);
  }
  function pruneLocalHistory(plan) {
    const s=localState(); const cutoff=Date.now()-retentionMs(normalizePlan(plan));
    s.history=(s.history||[]).filter(x=>Number(x.time||0)>=cutoff); writeLocalState(s);
  }
  async function loadCloudData(user,ent) {
    if(!client||!user)return;
    const cutoff=new Date(Date.now()-retentionMs(ent?.plan)).toISOString();
    const [historyRes,savedRes]=await Promise.all([
      client.from('calculation_history').select('id,query,title,result,formula,created_at').eq('user_id',user.id).gte('created_at',cutoff).order('created_at',{ascending:false}).limit(200),
      client.from('saved_calculations').select('id,query,title,result,formula,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(200)
    ]);
    const s=localState();
    if(!historyRes.error)s.history=historyRes.data.map(x=>({q:x.query,title:x.title,r:x.result,f:x.formula,time:new Date(x.created_at).getTime(),cloudId:x.id}));
    if(!savedRes.error)s.saved=savedRes.data.map(x=>({q:x.query,title:x.title,r:x.result+' · '+(x.formula||''),time:new Date(x.created_at).getTime(),cloudId:x.id}));
    writeLocalState(s); pruneLocalHistory(ent?.plan);
    document.dispatchEvent(new CustomEvent('coolcalci:cloud-data-loaded'));
  }
  async function migrateLocalData(user) {
    if(!client||!user)return; const s=localState(); if(s.__cloudMigrated)return;
    const history=(s.history||[]).slice(0,200).map(x=>({user_id:user.id,query:x.q||x.title||'Calculation',title:x.title||'Calculation',result:x.r||'',formula:x.f||null,created_at:new Date(x.time||Date.now()).toISOString()})).filter(x=>x.result);
    const saved=(s.saved||[]).slice(0,200).map(x=>{const raw=String(x.r||'');const parts=raw.split(' · ');return {user_id:user.id,query:x.q||x.title||'Calculation',title:x.title||'Calculation',result:parts.shift()||raw,formula:parts.join(' · ')||null,created_at:new Date(x.time||Date.now()).toISOString()};}).filter(x=>x.result);
    if(history.length)await client.from('calculation_history').insert(history);
    if(saved.length)await client.from('saved_calculations').insert(saved);
    s.__cloudMigrated=true; writeLocalState(s);
  }
  async function syncLatestCalculation(user) {
    if(!client||!user)return; const s=localState(); const x=s.history?.[0]; if(!x)return;
    const marker=`${x.time}:${x.q}:${x.r}`; if(sessionStorage.getItem('cc_last_synced_calc')===marker)return;
    const {error}=await client.from('calculation_history').insert({user_id:user.id,query:x.q||x.title||'Calculation',title:x.title||'Calculation',result:x.r||'',formula:x.f||null,created_at:new Date(x.time||Date.now()).toISOString()});
    if(!error){sessionStorage.setItem('cc_last_synced_calc',marker);}
  }
  async function syncSavedCalculation(user) {
    if(!client||!user)return; const s=localState(); const x=s.saved?.[0]; if(!x)return;
    const marker=`${x.time}:${x.q}:${x.r}`; if(sessionStorage.getItem('cc_last_synced_saved')===marker)return;
    const raw=String(x.r||'');const parts=raw.split(' · ');
    const {error}=await client.from('saved_calculations').insert({user_id:user.id,query:x.q||x.title||'Calculation',title:x.title||'Calculation',result:parts.shift()||raw,formula:parts.join(' · ')||null,created_at:new Date(x.time||Date.now()).toISOString()});
    if(!error)sessionStorage.setItem('cc_last_synced_saved',marker);
  }
  async function deleteCloudSavedByLocalIndex(index) {
    if(!client)return false; const s=localState(); const x=s.saved?.[index]; if(!x?.cloudId)return false;
    const {data:{session}}=await client.auth.getSession(); if(!session?.user)return false;
    const {error}=await client.from('saved_calculations').delete().eq('id',x.cloudId).eq('user_id',session.user.id);
    if(!error){s.saved.splice(index,1);writeLocalState(s);return true;} return false;
  }
  window.coolCalciPhase2={deleteCloudSavedByLocalIndex};
  async function consumeServerQuota(user) {
    if(!client||!user)return true;
    const {data,error}=await client.rpc('consume_calculation');
    if(error){toast('Cloud usage check is not ready yet. Please try again shortly.');console.error('CoolCalci usage RPC:',error);return false;}
    const row=Array.isArray(data)?data[0]:data;
    if(!row?.allowed){toast(`Daily free limit reached (${row?.daily_limit||3} calculations).`);return false;}
    const ent=await getEntitlement(user.id); applyEntitlement(ent); return true;
  }
  async function handleSubmitCapture(event) {
    if(bypassNextSubmit||busy||!client)return;
    const {data:{session}}=await client.auth.getSession(); if(!session?.user)return;
    event.preventDefault();event.stopImmediatePropagation();busy=true;
    const allowed=await consumeServerQuota(session.user); if(allowed){bypassNextSubmit=true;event.target.requestSubmit();bypassNextSubmit=false;} busy=false;
  }
  async function submitAuth(event) {
    event.preventDefault(); if(!configured||!client){status('Supabase publishable key is not configured yet.',true);return;}
    const email=$('authEmail').value.trim(),password=$('authPassword').value,name=$('authName').value.trim();
    if(!email||password.length<6){status('Enter a valid email and a password of at least 6 characters.',true);return;}
    status(mode==='signup'?'Creating your account…':'Signing you in…');$('authSubmit').disabled=true;
    const result=mode==='signup'?await client.auth.signUp({email,password,options:{data:{full_name:name||undefined}}}):await client.auth.signInWithPassword({email,password});
    $('authSubmit').disabled=false;if(result.error){status(result.error.message,true);return;}
    if(mode==='signup'&&!result.data.session){status('Account created. Check your email to confirm your address, then sign in.');return;} closeAuth();
  }
  async function startGoogle(){
    if(!configured||!client){status('Supabase publishable key is not configured yet.',true);return;}
    status('Opening Google sign-in…'); const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+window.location.pathname}}); if(error)status(error.message,true);
  }
  function bindUi(){
    $('authBtn')?.addEventListener('click',openAuth);$('authClose')?.addEventListener('click',closeAuth);$('authOverlay')?.addEventListener('click',e=>{if(e.target===$('authOverlay'))closeAuth();});
    $('signInTab')?.addEventListener('click',()=>setMode('signin'));$('signUpTab')?.addEventListener('click',()=>setMode('signup'));$('authForm')?.addEventListener('submit',submitAuth);$('googleBtn')?.addEventListener('click',startGoogle);
    $('calcForm')?.addEventListener('submit',handleSubmitCapture,true);
    $('calcForm')?.addEventListener('submit',async()=>{const {data:{session}}=await client?.auth.getSession()||{data:{session:null}};if(session?.user)setTimeout(()=>syncLatestCalculation(session.user),0);});
    document.addEventListener('click',e=>{if(e.target.closest('[data-save]'))setTimeout(async()=>{const {data:{session}}=await client?.auth.getSession()||{data:{session:null}};if(session?.user)syncSavedCalculation(session.user);},20);});
    $('proCta')?.addEventListener('click',e=>{if(!client)return;e.preventDefault();e.stopImmediatePropagation();toast('Secure Pro activation will be connected with payments in the monetization phase.');},true);
  }
  async function boot(){
    bindUi(); if(!configured){renderAuthUser(null);return;}
    client=supabaseLib.createClient(CFG.url,CFG.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});window.coolCalciSupabase=client;
    const {data:{session}}=await client.auth.getSession();
    if(session?.user){const ent=await getEntitlement(session.user.id);applyEntitlement(ent);renderAuthUser(session.user);await migrateLocalData(session.user);await loadCloudData(session.user,ent);}
    else renderAuthUser(null);
    client.auth.onAuthStateChange(async(_event,nextSession)=>{if(nextSession?.user){const ent=await getEntitlement(nextSession.user.id);applyEntitlement(ent);renderAuthUser(nextSession.user);await migrateLocalData(nextSession.user);await loadCloudData(nextSession.user,ent);toast('Account connected. Cloud sync is on.');}else{applyEntitlement({plan:'free',role:'user',unlimitedCalculations:false});renderAuthUser(null);}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
