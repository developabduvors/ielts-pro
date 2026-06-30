// ── shared.js ──────────────────────────────────────────────────────────
// Shared config, API client, session helpers, and grading utilities used
// by index.html, admin.html, student.html, reading-test.html and
// listening-test.html. Load this script before any page-specific script.

const SUPA_URL = 'https://nmwtpcbczurxrxcgpxyn.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5td3RwY2JjenVyeHJ4Y2dweHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjY0NjEsImV4cCI6MjA5ODI0MjQ2MX0.2FfyPGHCnmqBAmra259XqGhSznQeA-nVPtCpQDJVe18';

// Holds the logged-in admin's Supabase Auth access token (JWT), when on
// an admin page. Students never set this — they stay on the plain anon key.
let ADMIN_TOKEN = null;

const api = async (path, opts={}) => {
  const bearer = ADMIN_TOKEN || SUPA_KEY;
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${bearer}`, 'Content-Type': 'application/json', 'Prefer': opts.prefer||'return=representation', ...opts.headers },
    ...opts
  });
  if (!r.ok) {
    let msg = 'API error ('+r.status+')';
    try { const e = await r.json(); msg = e.message || e.error_description || e.msg || msg; } catch(_){}
    throw new Error(msg);
  }
  const t = await r.text(); return t ? JSON.parse(t) : null;
};
const get = p => api(p, {method:'GET'});
const post = (p,b) => api(p, {method:'POST', body:JSON.stringify(b)});
const patch = (p,b) => api(p, {method:'PATCH', body:JSON.stringify(b), prefer:'return=representation'});
const del = p => api(p, {method:'DELETE'});

// ── SUPABASE AUTH (admin login) ──
async function authApi(path, body) {
  const r = await fetch(`${SUPA_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: { 'apikey': SUPA_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error_description || data.msg || 'Auth error');
  return data;
}

// ── TOAST ──
function toast(msg, type='') {
  let t = document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent=msg; t.className='toast show '+type;
  setTimeout(()=>t.classList.remove('show'),3000);
}

// ── STUDENT SESSION (sessionStorage-backed, shared across student pages) ──
function setStudentSession(student){ sessionStorage.setItem('student', JSON.stringify(student)); }
function getStudentSession(){ const raw=sessionStorage.getItem('student'); if(!raw) return null; try{ return JSON.parse(raw); }catch(e){ return null; } }
function clearStudentSession(){ sessionStorage.removeItem('student'); }
// Call at the top of any page that requires a logged-in student. Redirects
// to index.html and returns null if there's no active session.
function requireStudentSession(){
  const s = getStudentSession();
  if(!s){ window.location.href='index.html'; return null; }
  return s;
}

// ── ADMIN SESSION ──
function tryRestoreAdminSession() {
  const tok = sessionStorage.getItem('admin_token');
  if (tok) { ADMIN_TOKEN = tok; return true; }
  return false;
}
function clearAdminSession(){ ADMIN_TOKEN=null; sessionStorage.removeItem('admin_token'); sessionStorage.removeItem('admin_refresh'); }

// ── LOGOUT (student pages) ──
function logout() { clearStudentSession(); window.location.href='index.html'; }

// ── GRADING (used by student.html, reading-test.html, listening-test.html) ──
// Shared grading logic for reading/listening submissions — used both to
// show a live score to the student and to compute the score saved to the
// database, so what the admin sees in Submissions matches what the
// student saw. `answers` is keyed by question index; for 'matching'
// questions the value at that index is itself an object keyed by item index.
function gradeQuestions(questions, answers){
  let correct=0, total=0;
  questions.forEach((q,qi)=>{
    const saved = answers[qi];
    if(q.type==='matching'||q.type==='sentence_endings'){
      const items=q.items||[];
      const savedMatch = saved && typeof saved==='object' ? saved : {};
      items.forEach((it,ii)=>{ total++; if((savedMatch[ii]||'')===it.answer) correct++; });
      return;
    }
    if(q.type==='diagram_label'){
      const items=q.items||[];
      const savedMatch = saved && typeof saved==='object' ? saved : {};
      items.forEach((it,ii)=>{ total++; if((savedMatch[ii]||'').toLowerCase().trim()===(it.answer||'').toLowerCase().trim()) correct++; });
      return;
    }
    if(q.type==='table_completion'||q.type==='summary_completion'||q.type==='flow_chart'||q.type==='note_completion'){
      const items=q.items||[];
      const savedMatch = saved && typeof saved==='object' ? saved : {};
      items.forEach((it,ii)=>{ total++; if((savedMatch[ii]||'').toLowerCase().trim()===(it.answer||'').toLowerCase().trim()) correct++; });
      return;
    }
    total++;
    if(q.type==='gap_fill' || q.type==='short_answer'){
      if((saved||'').toString().toLowerCase().trim()===(q.answer||'').toLowerCase().trim()) correct++;
    } else if(q.type==='tfng' || q.type==='ynng' || q.type==='mcq'){
      if(saved===(q.answer||'')) correct++;
    }
  });
  return {correct, total};
}

function countWords(t){ return t?t.trim().split(/\s+/).filter(Boolean).length:0; }

// ── URL helper ──
function qparam(name){ return new URLSearchParams(window.location.search).get(name); }
