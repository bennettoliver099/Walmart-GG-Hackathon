import React, { useState, useMemo, useEffect } from 'react';
import {
    CalendarBlankIcon, ClipboardTextIcon, TimerIcon, TrophyIcon,
    QuestionIcon, HeadsetIcon, ChalkboardTeacherIcon, UsersThreeIcon,
    HandWavingIcon, ArrowRightIcon, WarningIcon, SealCheckIcon,
    LockSimpleIcon, MagnifyingGlassIcon, CalendarDotsIcon,
    NotePencilIcon, CheckSquareIcon, ChatCircleIcon, FolderSimpleIcon,
    UserCircleIcon,
} from '@phosphor-icons/react';
import {
    initializeBlock,
    useBase,
    useRecords,
} from '@airtable/blocks/interface/ui';

function safeGetCellValueAsString(record, field) {
    try { return record.getCellValueAsString(field); } catch { return ''; }
}

const EXTERNAL_FORM_URL  = 'https://airtable.com/app4AdZ5m3rWZ4kt8/pagX2wubHXk1Q7Em0/form';
const RULES_URL          = 'https://teams.wal-mart.com/sites/GGDigitalAcceleration';
const TEST_NAMES         = ['Test', 'Test ', 'Test2', 'test 5', 'Rest'];
const TECH_OPTIONS       = ['Airtable', 'CodePuppy', 'Harvey', 'Other'];
const ATTENDANCE_OPTIONS = ['Virtual', 'In Person', 'Hybrid'];
const HACKATHON_DEADLINE = new Date('2026-03-09T17:00:00');
const MAX_TEAMS          = 50;

const SPARK_PATHS = `<path d="M375.663,273.363c12.505-2.575,123.146-53.269,133.021-58.97c22.547-13.017,30.271-41.847,17.254-64.393s-41.847-30.271-64.393-17.254c-9.876,5.702-109.099,76.172-117.581,85.715c-9.721,10.937-11.402,26.579-4.211,39.033C346.945,269.949,361.331,276.314,375.663,273.363z"/><path d="M508.685,385.607c-9.876-5.702-120.516-56.396-133.021-58.97c-14.332-2.951-28.719,3.415-35.909,15.87c-7.191,12.455-5.51,28.097,4.211,39.033c8.482,9.542,107.705,80.013,117.581,85.715c22.546,13.017,51.376,5.292,64.393-17.254S531.231,398.624,508.685,385.607z"/><path d="M266.131,385.012c-14.382,0-27.088,9.276-31.698,23.164c-4.023,12.117-15.441,133.282-15.441,144.685c0,26.034,21.105,47.139,47.139,47.139c26.034,0,47.139-21.105,47.139-47.139c0-11.403-11.418-132.568-15.441-144.685C293.219,394.288,280.513,385.012,266.131,385.012z"/><path d="M156.599,326.637c-12.505,2.575-123.146,53.269-133.021,58.97C1.031,398.624-6.694,427.454,6.323,450c13.017,22.546,41.847,30.271,64.393,17.254c9.876-5.702,109.098-76.172,117.58-85.715c9.722-10.937,11.402-26.579,4.211-39.033S170.931,323.686,156.599,326.637z"/><path d="M70.717,132.746C48.171,119.729,19.341,127.454,6.323,150c-13.017,22.546-5.292,51.376,17.254,64.393c9.876,5.702,120.517,56.396,133.021,58.97c14.332,2.951,28.719-3.415,35.91-15.87c7.191-12.455,5.51-28.096-4.211-39.033C179.815,208.918,80.592,138.447,70.717,132.746z"/><path d="M266.131,0c-26.035,0-47.139,21.105-47.139,47.139c0,11.403,11.418,132.568,15.441,144.685c4.611,13.888,17.317,23.164,31.698,23.164s27.088-9.276,31.698-23.164c4.023-12.117,15.441-133.282,15.441-144.685C313.27,21.105,292.165,0,266.131,0z"/>`;
function SparkIcon({ size = 20, color = 'white' }) {
    return <svg viewBox="0 0 532.262 600" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={{ fill: color, display: 'block', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: SPARK_PATHS }} />;
}

const JUDGING = [
    { label: 'Relevance',       weight: '30%', desc: 'Does it solve a real GG problem? Would it save time, reduce risk, or close a compliance gap?' },
    { label: 'Business Impact', weight: '25%', desc: 'Can you quantify the value? Think hours saved, risk reduced, or decisions improved per month.' },
    { label: 'AI Integration',  weight: '25%', desc: 'Does it use AI meaningfully — automating or augmenting a real decision, not just a dashboard?' },
    { label: 'Demo Quality',    weight: '20%', desc: 'Is the working prototype clear and compelling? Can you explain the problem it solves in 2 minutes?' },
];

const KEY_DATES = [
    { event: 'Free Agent Matching Closes',   date: 'March 8',              note: '' },
    { event: 'Registration Closes',          date: 'March 9 · 5pm CT',     note: '50-team limit' },
    { event: 'Final Team Changes',           date: 'March 14',             note: '' },
    { event: 'Build Window Opens',           date: 'March 16 · 8am CT',    note: 'No building before this date' },
    { event: 'Build Window Closes',          date: 'March 19 · 5pm CT',    note: '' },
    { event: 'Science Fair (Presentations)', date: 'March 20',             note: 'Bentonville & Virtual' },
];

const PHASES = [
    { label: 'Register', sub: 'Now Open — March 9',     active: true  },
    { label: 'Train',    sub: 'Week of March 9',          active: false },
    { label: 'Build',    sub: 'March 16–19 · 48 hrs',    active: false },
    { label: 'Present',  sub: 'March 20 · Science Fair', active: false },
];

const T = {
    blue:     '#0071CE',
    deep:     '#001E60',
    azure:    '#2C8EF4',
    ice:      '#E8F2FF',
    cloud:    '#F5F5F5',
    white:    '#FFFFFF',
    yellow:   '#FFC220',
    body:     '#2B2B2B',
    muted:    '#6B6B6B',
    muted2:   '#9B9B9B',
    border:   '#E5E5E5',
    border2:  '#C5D6EC',
    heroGrad: 'linear-gradient(135deg,#001E60 0%,#0071CE 65%,#2C8EF4 100%)',
    shadow:   '0 1px 4px rgba(0,0,0,0.07)',
    shadowM:  '0 6px 24px rgba(0,0,0,0.10)',
    shadowL:  '0 12px 40px rgba(0,0,0,0.13)',
};

function getCountdown() {
    const diff = HACKATHON_DEADLINE - new Date();
    if (diff <= 0) return 'Closed';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${d}d ${h}h ${m}m`;
}

const FAQS = [
    { q: 'Can I use more than one tool?',                  a: 'Yes, if your use case calls for it. Just note one primary tool on your registration.' },
    { q: "What if a teammate can't participate?",          a: 'Submit a team change request via the #gg-hackathon Teams channel. Changes must be finalized before March 14.' },
    { q: 'Do we need a problem picked before registering?',a: 'No. You can refine your use case after registration. Teams are also free to define their own problem statement.' },
    { q: 'When does the build window start?',              a: 'Monday March 16 at 8am CT. No building before then — but you can plan, attend training, and prepare.' },
    { q: 'Who judges the submissions?',                    a: 'A panel of GG leadership and invited executives. Top 5 teams present at the Science Fair on March 20.' },
    { q: 'What format is the final submission?',           a: 'A working prototype demo (3–5 minutes) plus a brief writeup. Full checklist available during build week.' },
];

const TABS = [
    ['rules',      'Rules & Guidelines'],
    ['register',   'Register'],
    ['teams',      'Teams'],
    ['challenges', 'Challenges'],
    ['help',       'Help'],
];

// ─── CSS ─────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
html,body{scroll-behavior:smooth;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.portal{background:${T.white};color:${T.body};font-family:'Bogle','Brandon Text','Inter',sans-serif;height:100vh;display:flex;flex-direction:column;overflow:hidden;font-size:14px;line-height:1.5;}
.portal-header{flex-shrink:0;}
.portal-body{flex:1;overflow-y:auto;}

/* ── HERO ── */
.hero{background:${T.heroGrad};padding:26px 56px 30px;position:relative;overflow:hidden;flex-shrink:0;}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 80% at 65% 50%,rgba(44,142,244,0.22),transparent);pointer-events:none;}
.hero-inner{max-width:1200px;margin:0 auto;position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:48px;}
.hero-left{flex:1;min-width:0;max-width:640px;}
.hero-orbital{flex-shrink:0;position:relative;width:180px;height:180px;display:flex;align-items:center;justify-content:center;}
.orb-ring{position:absolute;border-radius:50%;}
.orb-r1{width:180px;height:180px;border:1px dashed rgba(255,255,255,0.12);animation:lpspin 32s linear infinite;}
.orb-r2{width:128px;height:128px;border:1px solid rgba(255,255,255,0.10);animation:lpspin 22s linear infinite reverse;}
.orb-r3{width:84px;height:84px;border:1px solid rgba(255,255,255,0.18);animation:lpspin 16s linear infinite;}
.orb-core{position:relative;z-index:2;width:58px;height:58px;border-radius:50%;background:rgba(255,255,255,0.10);border:2px solid rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(12px);}
.orb-track{position:absolute;border-radius:50%;}
.orb-t1{width:158px;height:158px;animation:lpspin 14s linear infinite;}
.orb-t2{width:108px;height:108px;animation:lpspin 9s linear infinite reverse;}
.orb-dot{position:absolute;top:0;left:50%;transform:translate(-50%,-50%);border-radius:50%;}
.orb-t1 .orb-dot{width:8px;height:8px;background:#FFC220;box-shadow:0 0 10px rgba(255,194,32,0.8),0 0 20px rgba(255,194,32,0.3);}
.orb-t2 .orb-dot{width:5px;height:5px;background:white;box-shadow:0 0 7px rgba(255,255,255,0.8),0 0 14px rgba(255,255,255,0.3);}
@keyframes lpspin{to{transform:rotate(360deg);}}
.hero-eyebrow{font-family:'Inter',sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:14px;display:flex;align-items:center;gap:10px;}
.hero-eyebrow::before{content:'';display:block;width:22px;height:1px;background:rgba(255,255,255,0.35);}
.hero h1{font-size:36px;font-weight:800;line-height:1.05;letter-spacing:-0.025em;color:${T.yellow};margin-bottom:12px;}
.hero h1 .accent{background:linear-gradient(90deg,#CFE8FF 0%,#7EC8F8 40%,#2C8EF4 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-byline{font-family:'Inter',sans-serif;font-size:14px;font-weight:700;color:${T.white};margin-bottom:10px;opacity:0.9;}
.hero-sub{font-size:14px;color:rgba(255,255,255,0.65);max-width:500px;line-height:1.65;margin-bottom:26px;}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap;}
.btn-primary{display:inline-flex;align-items:center;gap:8px;background:${T.yellow};color:${T.deep};padding:11px 22px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;border-radius:6px;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(255,194,32,0.35);transition:all 0.18s;text-decoration:none;white-space:nowrap;}
.btn-primary:hover{background:#FFD050;transform:translateY(-1px);box-shadow:0 4px 16px rgba(255,194,32,0.4);}
.btn-outline{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,0.10);color:${T.white};padding:11px 20px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;border-radius:6px;border:1px solid rgba(255,255,255,0.22);cursor:pointer;transition:all 0.18s;text-decoration:none;}
.btn-outline:hover{background:rgba(255,255,255,0.18);}
.btn-outline-dark{display:inline-flex;align-items:center;gap:7px;background:none;color:${T.deep};padding:11px 20px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;border-radius:6px;border:1px solid ${T.border2};cursor:pointer;transition:all 0.18s;}
.btn-outline-dark:hover{background:${T.ice};border-color:${T.blue};color:${T.blue};}

/* ── STAT BAR ── */
.stat-bar{background:${T.white};}
.stat-bar-inner{display:grid;grid-template-columns:repeat(6,1fr);max-width:1200px;margin:0 auto;}
.stat-item{padding:16px 0;border-right:1px solid ${T.border};display:flex;flex-direction:column;gap:4px;align-items:center;text-align:center;}
.stat-item:last-child{border-right:none;}
.stat-num{font-family:'Inter',sans-serif;font-size:22px;font-weight:800;color:${T.blue};line-height:1;letter-spacing:-0.02em;}
.stat-num-red{color:#C0392B;}
.stat-num-sm{font-family:'Inter',sans-serif;font-size:15px;font-weight:800;color:${T.blue};line-height:1.2;letter-spacing:-0.01em;}
.stat-label{font-family:'Inter',sans-serif;font-size:9px;color:${T.muted};letter-spacing:0.06em;text-transform:uppercase;font-weight:500;}

/* ── PHASE STRIP ── */
.phase-section{background:${T.white};border-bottom:1px solid ${T.border};padding:14px 56px 12px;}
.phase-timeline{display:flex;align-items:flex-start;max-width:1200px;margin:0 auto;}
.phase-node{display:flex;flex-direction:column;align-items:center;flex:1;position:relative;}
.phase-node:not(:last-child)::after{content:'';position:absolute;top:13px;left:50%;width:100%;height:1px;background:${T.border};}
.phase-pill{padding:5px 14px;border-radius:100px;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;margin-bottom:5px;white-space:nowrap;position:relative;z-index:1;}
.phase-pill-active{background:${T.yellow};color:${T.deep};box-shadow:0 2px 8px rgba(255,194,32,0.35);}
.phase-pill-inactive{background:${T.cloud};border:1px solid ${T.border};color:${T.muted2};}
.phase-sub{font-family:'Inter',sans-serif;font-size:9px;color:${T.muted};text-align:center;line-height:1.5;max-width:100px;}

/* ── TAB BAR ── */
.tab-bar{background:${T.white};border-bottom:2px solid ${T.border};display:flex;padding:0 56px;flex-shrink:0;}
.tab-btn{padding:0 20px;height:44px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:${T.muted};border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all 0.15s;white-space:nowrap;}
.tab-btn:hover{color:${T.blue};}
.tab-btn.active{color:${T.blue};border-bottom-color:${T.blue};}

/* ── SECTIONS ── */
.sec-white{background:${T.white};border-bottom:1px solid ${T.border};}
.sec-cloud{background:${T.cloud};border-bottom:1px solid ${T.border};}
.sec-dark{background:${T.heroGrad};}
.sec-wrap{max-width:1200px;margin:0 auto;padding:32px 56px;}
.sec-label{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${T.blue};display:inline-block;margin-bottom:8px;}
.sec-h2{font-size:26px;font-weight:800;letter-spacing:-0.02em;color:${T.deep};margin-bottom:6px;line-height:1.15;}
.sec-sub{font-size:14px;color:${T.muted};line-height:1.7;max-width:640px;margin-bottom:24px;}

/* ── RULE CARDS ── */
.rule-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px;}
.rule-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;padding:26px 22px;transition:box-shadow 0.18s;}
.rule-card:hover{box-shadow:${T.shadowM};}
.rule-icon{margin-bottom:16px;display:flex;}
.rule-title{font-size:15px;font-weight:700;color:${T.deep};margin-bottom:8px;}
.rule-desc{font-size:13px;color:${T.muted};line-height:1.65;}

/* ── KEY DATES ── */
.key-dates-table{width:100%;border:1px solid ${T.border};border-radius:8px;overflow:hidden;margin-bottom:32px;}
.kdt-head{background:${T.cloud};display:grid;grid-template-columns:1fr auto 1fr;padding:10px 20px;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${T.muted};}
.kdt-row{display:grid;grid-template-columns:1fr auto 1fr;padding:13px 20px;border-top:1px solid ${T.border};align-items:center;gap:16px;}
.kdt-event{font-size:13px;font-weight:600;color:${T.body};}
.kdt-date{font-family:'Inter',sans-serif;font-size:13px;font-weight:700;color:${T.deep};text-align:center;white-space:nowrap;}
.kdt-note{font-family:'Inter',sans-serif;font-size:11px;color:${T.muted};text-align:right;}
.kdt-note-warn{color:#C0392B;font-weight:600;}

/* ── JUDGE GRID ── */
.judge-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.judge-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;padding:20px 18px;}
.judge-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;gap:8px;}
.judge-label{font-size:14px;font-weight:800;color:${T.deep};line-height:1.2;}
.judge-weight{font-family:'Inter',sans-serif;font-size:16px;font-weight:800;color:${T.blue};flex-shrink:0;}
.judge-desc{font-size:12px;color:${T.muted};line-height:1.6;}

/* ── REGISTRATION ── */
.reg-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;}
.reg-col-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;padding:30px 26px;display:flex;flex-direction:column;}
.reg-col-head{font-size:17px;font-weight:800;color:${T.deep};margin-bottom:20px;}
.step-list{list-style:none;display:flex;flex-direction:column;gap:16px;margin-bottom:20px;}
.step-item{display:flex;gap:14px;align-items:flex-start;}
.step-num{width:26px;height:26px;border-radius:50%;background:${T.blue};color:${T.white};font-family:'Inter',sans-serif;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.step-text{font-size:13px;color:${T.body};line-height:1.6;padding-top:3px;}
.warn-note{background:#FEF9EC;border:1px solid #F0D060;border-radius:6px;padding:11px 14px;font-size:12px;color:#7A5A00;margin-bottom:22px;line-height:1.5;display:flex;align-items:flex-start;gap:8px;}
.fa-bullets{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:22px;}
.fa-bullet{font-size:13px;color:${T.body};padding-left:18px;position:relative;line-height:1.55;}
.fa-bullet::before{content:'→';position:absolute;left:0;color:${T.muted2};}
.already-reg{background:${T.cloud};border:1px solid ${T.border};border-radius:8px;padding:18px 22px;font-size:13px;color:${T.muted};line-height:1.6;}

/* ── TEAM PORTAL ── */
.team-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.team-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;padding:20px 20px;cursor:pointer;transition:all 0.18s;}
.team-card:hover{border-color:${T.border2};box-shadow:${T.shadowM};}
.team-card-name{font-size:15px;font-weight:700;color:${T.deep};margin-bottom:9px;line-height:1.3;}
.team-card-meta{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.team-badge{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;padding:2px 8px;border-radius:100px;text-transform:uppercase;letter-spacing:0.07em;}
.team-badge-registered{background:${T.ice};color:${T.blue};}
.team-badge-submitted{background:#E8F8EF;color:#1A7F37;}
.team-card-count{font-family:'Inter',sans-serif;font-size:11px;color:${T.muted2};}
.team-card-members{font-size:12px;color:${T.muted};line-height:1.6;}
.team-empty{text-align:center;padding:72px 20px;color:${T.muted};font-size:14px;}

/* ── TOOL CARDS ── */
.tool-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;}
.tool-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;overflow:hidden;display:flex;flex-direction:column;transition:box-shadow 0.18s;}
.tool-card:hover{box-shadow:${T.shadowM};}
.tool-bar{height:4px;flex-shrink:0;}
.tool-inner{padding:22px 20px;display:flex;flex-direction:column;flex:1;}
.tool-name{font-size:19px;font-weight:800;color:${T.deep};margin-bottom:4px;}
.tool-tagline{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:${T.muted2};margin-bottom:13px;}
.tool-desc{font-size:13px;color:${T.muted};line-height:1.65;flex:1;margin-bottom:16px;}
.tool-access-block{background:${T.cloud};border:1px solid ${T.border};border-radius:6px;padding:13px 14px;font-size:12px;color:${T.muted};line-height:1.6;margin-bottom:14px;display:flex;align-items:flex-start;gap:7px;}
.tool-link{font-family:'Inter',sans-serif;font-size:12px;font-weight:700;color:${T.blue};text-decoration:none;display:inline-flex;align-items:center;gap:5px;cursor:pointer;margin-top:auto;}
.tool-link:hover{text-decoration:underline;}
.tool-link-dim{color:${T.muted2};cursor:default;}
.tool-note-badge{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;color:${T.muted2};padding:4px 10px;background:${T.cloud};border:1px solid ${T.border};border-radius:4px;display:inline-flex;align-items:center;gap:5px;margin-top:auto;width:fit-content;}

/* ── PROBLEM CARDS ── */
.prob-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px;}
.prob-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;padding:0;cursor:pointer;transition:all 0.18s;position:relative;overflow:hidden;display:flex;flex-direction:column;}
.prob-card::before{content:'';position:absolute;top:0;left:0;bottom:0;width:3px;background:${T.border};transition:background 0.18s;}
.prob-card.diff-Easy::before{background:#27AE60;}
.prob-card.diff-Medium::before{background:#E67E22;}
.prob-card.diff-Hard::before{background:#C0392B;}
.prob-card:hover{border-color:#C5D6EC;box-shadow:${T.shadowM};}
.prob-card-inner{padding:18px 18px 18px 22px;display:flex;flex-direction:column;flex:1;}
.prob-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;}
.prob-card-id{font-family:'Inter',sans-serif;font-size:10px;color:${T.muted2};letter-spacing:0.08em;font-weight:600;}
.prob-card-impact{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;background:${T.ice};color:${T.blue};flex-shrink:0;}
.prob-card-title{font-size:14px;font-weight:700;color:${T.deep};margin-bottom:8px;line-height:1.35;}
.prob-card-desc{font-size:12px;color:${T.muted};line-height:1.6;flex:1;margin-bottom:12px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;}
.prob-card-footer{display:flex;align-items:center;justify-content:space-between;}
.prob-card-tags{display:flex;gap:5px;flex-wrap:wrap;}
.ptag{font-family:'Inter',sans-serif;font-size:10px;font-weight:600;padding:2px 7px;border-radius:3px;}
.ptag-domain{background:${T.cloud};color:${T.muted};}
.ptag-easy{background:#E8F8EF;color:#1A7F37;}
.ptag-medium{background:#FEF3E4;color:#92610A;}
.ptag-hard{background:#FEE8E8;color:#C0392B;}
.prob-card-arrow{color:${T.muted2};transition:all 0.15s;flex-shrink:0;}
.prob-card:hover .prob-card-arrow{color:${T.blue};transform:translateX(2px);}
.prob-note{background:${T.ice};border:1px solid ${T.border2};border-radius:8px;padding:14px 20px;font-size:13px;color:${T.muted};line-height:1.6;}
.prob-note strong{color:${T.deep};}

/* ── HELP CARDS ── */
.help-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:stretch;}
.help-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;padding:26px 22px;display:flex;flex-direction:column;}
.help-card-icon{margin-bottom:14px;display:flex;}
.help-card-title{font-size:16px;font-weight:800;color:${T.deep};margin-bottom:18px;}
.faq-list{display:flex;flex-direction:column;}
.faq-item{border-bottom:1px solid ${T.border};}
.faq-item:first-child{border-top:1px solid ${T.border};}
.faq-q{width:100%;text-align:left;background:none;border:none;padding:13px 0;font-size:13px;font-weight:600;color:${T.body};cursor:pointer;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;transition:color 0.15s;font-family:inherit;line-height:1.45;}
.faq-q:hover{color:${T.blue};}
.faq-chevron{font-size:11px;flex-shrink:0;margin-top:3px;transition:transform 0.2s ease;color:${T.muted2};}
.faq-chevron.open{transform:rotate(90deg);}
.faq-a{font-size:13px;color:${T.muted};line-height:1.65;max-height:0;overflow:hidden;transition:max-height 0.3s ease,opacity 0.2s,padding 0.2s;opacity:0;padding-bottom:0;}
.faq-a.open{max-height:300px;opacity:1;padding-bottom:13px;}
.contact-blocks{display:flex;flex-direction:column;gap:10px;margin-bottom:16px;}
.contact-block{background:${T.cloud};border:1px solid ${T.border};border-radius:6px;padding:13px 14px;}
.contact-topic{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${T.muted};margin-bottom:4px;}
.contact-name{font-size:13px;font-weight:700;color:${T.deep};}
.contact-role{font-size:12px;color:${T.muted};}
.contact-note{font-size:11px;color:${T.muted2};margin-top:2px;font-style:italic;}
.help-footer-note{font-size:12px;color:${T.muted};margin-top:auto;padding-top:14px;border-top:1px solid ${T.border};}
.mentor-body{font-size:13px;color:${T.muted};line-height:1.65;margin-bottom:14px;}
.mentor-bullets{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:14px;}
.mentor-bullet{font-size:13px;color:${T.body};padding-left:18px;position:relative;line-height:1.5;}
.mentor-bullet::before{content:'✓';position:absolute;left:0;color:${T.blue};font-weight:700;}

/* ── CALLOUT ── */
.callout-box{background:${T.ice};border:1px solid ${T.border2};border-radius:8px;padding:16px 20px;font-size:13px;color:${T.muted};line-height:1.7;margin-bottom:24px;}
.callout-box strong{color:${T.deep};}

/* ── TEAM DETAIL MODAL MEMBERS ── */
.member-list{display:flex;flex-direction:column;gap:7px;margin-bottom:20px;}
.member-row{display:flex;align-items:center;gap:10px;padding:9px 12px;background:${T.cloud};border-radius:6px;}
.member-badge-cap{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;background:${T.ice};color:${T.blue};text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0;}
.member-name{font-size:13px;font-weight:600;color:${T.body};}
.ws-coming-soon{width:100%;padding:13px 18px;background:${T.cloud};border:1px solid ${T.border};border-radius:6px;color:${T.muted2};font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:not-allowed;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;}

/* ── MODAL ── */
.modal-overlay{position:fixed;inset:0;z-index:999;background:rgba(0,30,96,0.55);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn 0.18s ease;}
.modal{background:${T.white};border:1px solid ${T.border};border-radius:12px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;box-shadow:${T.shadowL};animation:slideUp 0.22s ease;scrollbar-width:thin;scrollbar-color:${T.muted2} transparent;}
.modal-sm{max-width:460px;}
.modal-header{padding:26px 28px 20px;border-bottom:1px solid ${T.border};display:flex;align-items:flex-start;justify-content:space-between;gap:12px;position:sticky;top:0;background:${T.white};z-index:10;}
.modal-title{font-size:19px;font-weight:800;color:${T.deep};}
.modal-subtitle{font-size:12px;color:${T.muted};margin-top:3px;}
.modal-close{background:none;border:none;cursor:pointer;color:${T.muted};font-size:18px;line-height:1;padding:4px;border-radius:4px;transition:all 0.15s;flex-shrink:0;}
.modal-close:hover{color:${T.body};background:${T.cloud};}
.modal-back{background:none;border:none;cursor:pointer;color:${T.muted};font-size:12px;display:flex;align-items:center;gap:4px;padding:0;transition:color 0.15s;font-family:'Inter',sans-serif;font-weight:600;}
.modal-back:hover{color:${T.body};}
.modal-body{padding:24px 28px 26px;}
.fs{margin-bottom:26px;}
.fs-title{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${T.blue};margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid ${T.border};}
.fr{margin-bottom:15px;}
.fr-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:15px;}
.form-label{display:block;font-size:13px;font-weight:700;margin-bottom:6px;color:${T.body};}
.form-label .req{color:#C0392B;margin-left:2px;}
.fh{font-size:12px;color:${T.muted};margin-bottom:8px;line-height:1.5;}
.fi{width:100%;background:${T.white};border:1px solid ${T.border};border-radius:6px;padding:9px 12px;color:${T.body};font-family:'Inter',sans-serif;font-size:13px;outline:none;transition:border-color 0.15s;}
.fi:focus{border-color:${T.blue};box-shadow:0 0 0 3px rgba(0,113,206,0.10);}
.fi::placeholder{color:${T.muted2};}
textarea.fi{resize:vertical;min-height:76px;line-height:1.5;}
.radio-group{display:flex;gap:7px;flex-wrap:wrap;}
.rp{position:relative;}
.rp input{position:absolute;opacity:0;width:0;height:0;}
.rp label{display:inline-block;padding:6px 13px;border:1px solid ${T.border};border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;color:${T.muted};white-space:nowrap;}
.rp input:checked + label{border-color:${T.blue};color:${T.blue};background:${T.ice};}
.rp label:hover{border-color:${T.blue};color:${T.blue};}
.ms-wrap{position:relative;}
.ms-results{position:absolute;top:calc(100% + 4px);left:0;right:0;background:${T.white};border:1px solid ${T.border2};border-radius:8px;z-index:20;max-height:200px;overflow-y:auto;box-shadow:${T.shadowM};}
.ms-item{padding:10px 13px;cursor:pointer;transition:background 0.12s;border-bottom:1px solid ${T.border};}
.ms-item:last-child{border-bottom:none;}
.ms-item:hover{background:${T.cloud};}
.ms-name{font-size:13px;font-weight:600;color:${T.body};}
.ms-email{font-size:11px;color:${T.muted};margin-top:1px;font-family:'Inter',sans-serif;}
.ms-sel{display:flex;align-items:center;justify-content:space-between;background:${T.ice};border:1px solid ${T.border2};border-radius:6px;padding:9px 12px;margin-top:5px;}
.ms-sel-name{font-size:13px;font-weight:600;color:${T.deep};}
.ms-sel-email{font-size:11px;color:${T.muted};font-family:'Inter',sans-serif;}
.ms-clear{background:none;border:none;cursor:pointer;color:${T.muted2};font-size:16px;padding:2px;transition:color 0.15s;}
.ms-clear:hover{color:#C0392B;}
.ck-row{display:flex;align-items:flex-start;gap:10px;}
.ck-row input[type="checkbox"]{width:16px;height:16px;margin-top:2px;flex-shrink:0;accent-color:${T.blue};cursor:pointer;}
.ck-label{font-size:13px;line-height:1.55;color:${T.body};}
.ck-label a{color:${T.blue};text-decoration:none;}
.ck-label a:hover{text-decoration:underline;}
.modal-footer{padding:18px 28px 24px;border-top:1px solid ${T.border};display:flex;align-items:center;justify-content:space-between;gap:12px;}
.submit-btn{background:${T.yellow};color:${T.deep};border:none;padding:12px 28px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;border-radius:6px;cursor:pointer;box-shadow:0 2px 8px rgba(255,194,32,0.3);transition:all 0.18s;display:flex;align-items:center;gap:8px;}
.submit-btn:hover{background:#FFD050;transform:translateY(-1px);}
.submit-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;box-shadow:none;}
.cancel-btn{background:none;border:none;color:${T.muted};font-size:13px;cursor:pointer;transition:color 0.15s;}
.cancel-btn:hover{color:${T.body};}
.success-wrap{text-align:center;padding:52px 32px;}
.success-title{font-size:22px;font-weight:800;margin-bottom:8px;color:${T.deep};}
.success-sub{font-size:14px;color:${T.muted};line-height:1.65;max-width:380px;margin:0 auto 28px;}
.ferr{font-size:12px;color:#C0392B;margin-top:5px;}
.submit-err{background:#FEE8E8;border:1px solid rgba(192,57,43,0.25);border-radius:6px;padding:10px 13px;font-size:13px;color:#C0392B;margin-bottom:14px;}
.opt-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
.opt-card{background:${T.white};border:1px solid ${T.border};border-radius:10px;padding:26px 20px;cursor:pointer;transition:all 0.18s;display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden;}
.opt-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${T.deep},${T.blue});opacity:0;transition:opacity 0.18s;}
.opt-card:hover{border-color:${T.border2};box-shadow:${T.shadowM};}
.opt-card:hover::before{opacity:1;}
.opt-card-dis{opacity:0.35;cursor:not-allowed;pointer-events:none;}
.opt-card-icon{margin-bottom:4px;display:flex;}
.opt-card-title{font-size:14px;font-weight:800;color:${T.deep};}
.opt-card-desc{font-size:12px;color:${T.muted};line-height:1.6;flex:1;}
.opt-card-cta{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:${T.blue};}
.opt-card-soon{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:${T.muted2};padding:3px 8px;background:${T.cloud};border:1px solid ${T.border};border-radius:3px;display:inline-block;}
.hint-toggle{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:${T.blue};cursor:pointer;background:none;border:none;padding:0;display:flex;align-items:center;gap:5px;margin-bottom:8px;}
.hint-box{background:${T.ice};border:1px solid ${T.border2};border-radius:5px;padding:10px 14px;font-size:12px;color:${T.muted};line-height:1.7;margin-bottom:4px;}

/* ── SHARED ── */
.live-dot{display:inline-block;width:7px;height:7px;background:#27AE60;border-radius:50%;animation:pulse 2s infinite;margin-right:5px;vertical-align:middle;}
.rules-link{font-family:'Inter',sans-serif;font-size:13px;font-weight:700;color:${T.blue};text-decoration:none;display:inline-flex;align-items:center;gap:5px;}
.rules-link:hover{text-decoration:underline;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(0,30,96,0.18);border-top-color:${T.deep};border-radius:50%;animation:spin .7s linear infinite;}

/* ── RESPONSIVE ── */
@media(max-width:1024px){
  .prob-grid{grid-template-columns:repeat(2,1fr);}
  .judge-grid{grid-template-columns:repeat(2,1fr);}
  .team-grid{grid-template-columns:repeat(2,1fr);}
}
@media(max-width:900px){
  .rule-cards,.tool-cards,.help-cards{grid-template-columns:1fr 1fr;}
  .kdt-note{display:none;}
  .kdt-head,.kdt-row{grid-template-columns:1fr auto;}
}
@media(max-width:680px){
  .hero{padding:28px 20px 36px;}
  .hero-orbital{display:none;}
  .hero h1{font-size:32px;}
  .sec-wrap{padding:36px 20px;}
  .phase-section{padding:12px 20px 10px;}
  .tab-bar{padding:0 20px;}
  .stat-bar-inner{grid-template-columns:repeat(3,1fr);}
  .rule-cards,.tool-cards,.help-cards,.prob-grid,.judge-grid,.team-grid,.opt-cards{grid-template-columns:1fr;}
  .reg-cols{grid-template-columns:1fr;}
  .fr-2{grid-template-columns:1fr;}
}
`;

// ─── PROBLEM DETAIL MODAL ─────────────────────────────────────────────────────
function ProblemDetailModal({ prob, onClose, pfId, pfTitle, pfDesc, pfDiff, pfImpact, pfDomain, pfClaimed }) {
    const id      = pfId     ? prob.getCellValueAsString(pfId)     : '';
    const title   = pfTitle  ? prob.getCellValueAsString(pfTitle)  : prob.name;
    const desc    = pfDesc   ? prob.getCellValueAsString(pfDesc)   : '';
    const domain  = pfDomain ? prob.getCellValueAsString(pfDomain) : '';
    const claimed = pfClaimed? prob.getCellValueAsString(pfClaimed): '';
    const diff    = pfDiff   ? (prob.getCellValue(pfDiff)?.name ?? '') : '';
    const impact  = pfImpact ? (prob.getCellValue(pfImpact)?.name ?? '') : '';
    const diffColor = diff === 'Easy' ? '#27AE60' : diff === 'Medium' ? '#E67E22' : diff === 'Hard' ? '#C0392B' : T.muted2;
    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-header">
                    <div style={{ flex: 1 }}>
                        {id && <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: T.muted2, letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{id}</div>}
                        <div className="modal-title">{title}</div>
                        {domain && <div className="modal-subtitle">{domain}</div>}
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                        {diff   && <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 4, background: diffColor + '18', color: diffColor }}>{diff}</span>}
                        {impact === 'High' && <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 4, background: T.ice, color: T.blue }}>High Impact</span>}
                        {domain && <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4, background: T.cloud, color: T.muted }}>{domain}</span>}
                    </div>
                    {desc && <div style={{ marginBottom: 20 }}><div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, marginBottom: 8 }}>Problem Description</div><div style={{ fontSize: 14, color: T.body, lineHeight: 1.7 }}>{desc}</div></div>}
                    {claimed && <div style={{ marginBottom: 20 }}><div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, marginBottom: 8 }}>Being Explored By</div><div style={{ fontSize: 13, color: T.blue, fontWeight: 600 }}>{claimed}</div></div>}
                    <div style={{ background: T.ice, border: `1px solid ${T.border2}`, borderRadius: 6, padding: '12px 14px', fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                        Multiple teams can work on the same problem. Pick whichever best fits your expertise and the tool you plan to use.
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── TEAM DETAIL MODAL ────────────────────────────────────────────────────────
function TeamDetailModal({ team, onClose, sfTeamName, sfStatus, sfUseCase, memberFields }) {
    const name    = sfTeamName ? team.getCellValueAsString(sfTeamName) : team.name;
    const status  = sfStatus   ? team.getCellValueAsString(sfStatus)   : '';
    const useCase = sfUseCase  ? team.getCellValueAsString(sfUseCase)  : '';
    const members = memberFields.flatMap((f, i) => {
        if (!f) return [];
        try { const v = team.getCellValue(f); return v ? v.map(m => ({ name: m.name, captain: i === 0 })) : []; } catch { return []; }
    }).filter(Boolean);
    const badgeClass = status === 'Submitted' ? 'team-badge-submitted' : 'team-badge-registered';
    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal modal-sm">
                <div className="modal-header">
                    <div style={{ flex: 1 }}>
                        <div className="modal-title">{name}</div>
                        <div className="modal-subtitle">{members.length} member{members.length !== 1 ? 's' : ''}</div>
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div style={{ marginBottom: 20 }}><span className={`team-badge ${badgeClass}`}>{status || 'Registered'}</span></div>
                    {members.length > 0 && (
                        <div style={{ marginBottom: 22 }}>
                            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>Team Members</div>
                            <div className="member-list">
                                {members.map((m, i) => (
                                    <div key={i} className="member-row">
                                        {m.captain && <span className="member-badge-cap">Captain</span>}
                                        <span className="member-name">{m.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {useCase && <div style={{ marginBottom: 22 }}><div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, marginBottom: 8 }}>Use Case</div><div style={{ fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{useCase}</div></div>}
                    <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>Team Workspace</div>
                    <button className="ws-coming-soon" disabled><LockSimpleIcon size={15} color={T.muted2} /> Coming Soon</button>
                    <div style={{ fontSize: 11, color: T.muted2, lineHeight: 1.5 }}>Unlocks during the build window March 16–19.</div>
                </div>
            </div>
        </div>
    );
}

// ─── MEMBER SEARCH ────────────────────────────────────────────────────────────
function MemberSearch({ label, optional, dirRecords, nameField, emailField, selected, onSelect }) {
    const [query, setQuery] = useState('');
    const [open, setOpen]   = useState(false);
    const filtered = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return dirRecords.filter(r => {
            const name  = nameField  ? r.getCellValueAsString(nameField)  : '';
            const email = emailField ? r.getCellValueAsString(emailField) : '';
            return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
        }).slice(0, 8);
    }, [query, dirRecords, nameField, emailField]);
    if (selected) return (
        <div className="fr">
            <label className="form-label">{label}{!optional && <span className="req">*</span>}</label>
            <div className="ms-sel">
                <div><div className="ms-sel-name">{selected.name}</div><div className="ms-sel-email">{selected.email}</div></div>
                <button className="ms-clear" onClick={() => onSelect(null)}>✕</button>
            </div>
        </div>
    );
    return (
        <div className="fr">
            <label className="form-label">{label}{!optional && <span className="req">*</span>}</label>
            {label.includes('Captain') && <div className="fh">Primary contact — submits the final project.</div>}
            {optional && label === 'Member 2' && <div className="fh">Optional — teams need 3 minimum, can have up to 5.</div>}
            <div className="ms-wrap">
                <input className="fi" placeholder="Search by name or email…" value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)} />
                {open && filtered.length > 0 && (
                    <div className="ms-results">
                        {filtered.map(r => {
                            const name  = nameField  ? r.getCellValueAsString(nameField).trim()  : '';
                            const email = emailField ? r.getCellValueAsString(emailField).trim() : '';
                            return (
                                <div key={r.id} className="ms-item" onMouseDown={() => { onSelect({ id: r.id, name, email }); setQuery(''); setOpen(false); }}>
                                    <div className="ms-name">{name}</div><div className="ms-email">{email}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

async function createRecordWithRetry(table, fields, attempts = 3) {
    let lastErr = null;
    for (let i = 0; i < attempts; i++) {
        try { return await table.createRecordAsync(fields); }
        catch (err) {
            lastErr = err;
            const msg = (err?.message ?? '').toLowerCase();
            if (!msg.includes('conflict') && !msg.includes('conflicted')) throw err;
            await new Promise(r => setTimeout(r, 200 * Math.pow(2, i)));
        }
    }
    throw lastErr;
}

// ─── REGISTRATION MODAL ───────────────────────────────────────────────────────
function RegistrationModal({ onClose, onRegister, submissionsTable, dirRecords, dirNameField, dirEmailField, initialScreen = 0 }) {
    const [screen,        setScreen]       = useState(() => initialScreen === 'freeagent' ? 'agent' : initialScreen);
    const [teamName,      setTeamName]     = useState('');
    const [useCase,       setUseCase]      = useState('');
    const [technology,    setTechnology]   = useState('');
    const [otherTech,     setOtherTech]    = useState('');
    const [attendance,    setAttendance]   = useState('');
    const [skillLevel,    setSkillLevel]   = useState('');
    const [showHint,      setShowHint]     = useState(false);
    const [captain,       setCaptain]      = useState(null);
    const [member2,       setMember2]      = useState(null);
    const [member3,       setMember3]      = useState(null);
    const [member4,       setMember4]      = useState(null);
    const [member5,       setMember5]      = useState(null);
    const [agreed,        setAgreed]       = useState(false);
    const [agentSelf,     setAgentSelf]    = useState(null);
    const [agentInterest, setAgentInterest]= useState('');
    const [agentTool,     setAgentTool]    = useState('');
    const [agentSkill,    setAgentSkill]   = useState('');
    const [agentAttend,   setAgentAttend]  = useState('');
    const [agentAgreed,   setAgentAgreed]  = useState(false);
    const [submitting,    setSubmitting]   = useState(false);
    const [success,       setSuccess]      = useState(false);
    const [submitError,   setSubmitError]  = useState('');
    const [errors,        setErrors]       = useState({});

    const validateTeam = () => {
        const e = {};
        if (!teamName.trim())  e.teamName   = 'Team name is required.';
        if (!useCase.trim())   e.useCase    = 'Please describe your use case.';
        if (!technology)       e.technology = 'Select a technology.';
        if (technology === 'Other' && !otherTech.trim()) e.otherTech = 'Please specify.';
        if (!attendance)       e.attendance = 'Select an attendance format.';
        if (!captain)          e.captain    = 'Team Captain is required.';
        const cnt = [captain, member2, member3, member4, member5].filter(Boolean).length;
        if (cnt < 3)           e.members    = 'Teams require at least 3 members (captain + 2 more).';
        if (!agreed)           e.agreed     = 'You must agree to the rules to register.';
        setErrors(e); return Object.keys(e).length === 0;
    };
    const validateAgent = () => {
        const e = {};
        if (!agentSelf)   e.agentSelf   = 'Please search and select yourself from the directory.';
        if (!agentTool)   e.agentTool   = 'Select a preferred tool.';
        if (!agentSkill)  e.agentSkill  = 'Select your skill level.';
        if (!agentAttend) e.agentAttend = 'Select an attendance format.';
        if (!agentAgreed) e.agentAgreed = 'You must agree to the rules.';
        setErrors(e); return Object.keys(e).length === 0;
    };

    const handleTeamSubmit = async () => {
        if (!validateTeam()) return;
        setSubmitting(true); setSubmitError('');
        try {
            const fields = {};
            try { const f = submissionsTable.getFieldIfExists('Team Name');          if (f) fields[f.id] = teamName.trim(); } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Use Case');           if (f) fields[f.id] = useCase.trim(); } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Technology');         if (f) fields[f.id] = { name: technology }; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Other Technology');   if (f && technology === 'Other') fields[f.id] = otherTech.trim(); } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Attendance Format');  if (f) fields[f.id] = { name: attendance }; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Submission Status');  if (f) fields[f.id] = { name: 'Registered' }; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Team Member # 1 ( Captain)'); if (f && captain) fields[f.id] = [{ id: captain.id }]; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Team Member # 2');   if (f && member2) fields[f.id] = [{ id: member2.id }]; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Team Member # 3');   if (f && member3) fields[f.id] = [{ id: member3.id }]; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Team Member # 4');   if (f && member4) fields[f.id] = [{ id: member4.id }]; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Team Member # 5');   if (f && member5) fields[f.id] = [{ id: member5.id }]; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('By Selecting the checkbox, you attest that you have read the rules linked above and agree that your team will follow them.'); if (f) fields[f.id] = true; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Link To Hackathon Rules & Guidelines'); if (f) fields[f.id] = RULES_URL; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('AI Skill Level');    if (f && skillLevel) fields[f.id] = parseInt(skillLevel, 10); } catch (_) {}
            await createRecordWithRetry(submissionsTable, fields, 3);
            if (onRegister) onRegister();
            setSuccess(true);
        } catch (err) {
            const msg = err?.message ?? '';
            const isPerms = msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('not authorized') || msg.toLowerCase().includes('read only');
            setSubmitError(isPerms ? '__EXTERNAL__' : msg || 'Something went wrong. Please try again.');
        } finally { setSubmitting(false); }
    };

    const handleAgentSubmit = async () => {
        if (!validateAgent()) return;
        setSubmitting(true); setSubmitError('');
        try {
            const fields = {};
            try { const f = submissionsTable.getFieldIfExists('Team Name');          if (f) fields[f.id] = 'Free Agent Pool'; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Submission Status');  if (f) fields[f.id] = { name: 'Free Agent' }; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Technology');         if (f && agentTool) fields[f.id] = { name: agentTool }; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Attendance Format');  if (f) fields[f.id] = { name: agentAttend }; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Team Member # 1 ( Captain)'); if (f && agentSelf) fields[f.id] = [{ id: agentSelf.id }]; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('By Selecting the checkbox, you attest that you have read the rules linked above and agree that your team will follow them.'); if (f) fields[f.id] = true; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('Problem Interest');   if (f && agentInterest) fields[f.id] = agentInterest; } catch (_) {}
            try { const f = submissionsTable.getFieldIfExists('AI Skill Level');     if (f && agentSkill) fields[f.id] = parseInt(agentSkill, 10); } catch (_) {}
            await createRecordWithRetry(submissionsTable, fields, 3);
            if (onRegister) onRegister();
            setSuccess(true);
        } catch (err) {
            const msg = err?.message ?? '';
            const isPerms = msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('not authorized') || msg.toLowerCase().includes('read only');
            setSubmitError(isPerms ? '__EXTERNAL__' : msg || 'Something went wrong. Please try again.');
        } finally { setSubmitting(false); }
    };

    const ExternalFallback = () => (
        <div className="submit-err">This interface doesn't have write access. Use the{' '}
            <a href={EXTERNAL_FORM_URL} target="_blank" rel="noreferrer" style={{ color: '#C0392B', fontWeight: 700 }}>registration form</a> instead.
        </div>
    );

    if (success) {
        const isAgent = screen === 'agent';
        return (
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="modal"><div className="success-wrap">
                    <div style={{ marginBottom: 18 }}><SealCheckIcon size={52} color={isAgent ? T.blue : '#27AE60'} weight="duotone" /></div>
                    <div className="success-title">{isAgent ? "You're in the pool!" : 'Team registered!'}</div>
                    <div className="success-sub">
                        {isAgent ? "We'll match you with a team based on your skills and interests before March 8."
                            : <><strong>Teammates will receive an invitation to confirm.</strong> Your team is locked in once all members accept.</>}
                    </div>
                    <button className="btn-primary" onClick={onClose}>{isAgent ? 'Done' : 'View Teams →'}</button>
                </div></div>
            </div>
        );
    }

    if (screen === 0) return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-header">
                    <div><div className="modal-title">How do you want to participate?</div><div className="modal-subtitle">FY27 GG AI Hackathon · {MAX_TEAMS}-team limit</div></div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="opt-cards">
                        <div className="opt-card" onClick={() => setScreen('team')}>
                            <div className="opt-card-icon"><UsersThreeIcon size={28} color={T.blue} weight="duotone" /></div>
                            <div className="opt-card-title">Form a Team</div>
                            <div className="opt-card-desc">Register your team of 3–5. Captain leads the build and submits the final project.</div>
                            <div className="opt-card-cta">Get Started →</div>
                        </div>
                        <div className="opt-card" onClick={() => setScreen('agent')}>
                            <div className="opt-card-icon"><HandWavingIcon size={28} color={T.blue} weight="duotone" /></div>
                            <div className="opt-card-title">Join as Free Agent</div>
                            <div className="opt-card-desc">No team yet? We'll match you based on your skills and problem interest by March 8.</div>
                            <div className="opt-card-cta">Sign Up →</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (screen === 'agent') return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-header">
                    <button className="modal-back" onClick={() => setScreen(0)}>← Back</button>
                    <div style={{ flex: 1 }}>
                        <div className="modal-title">Join as Free Agent</div>
                        <div className="modal-subtitle">FY27 GG AI Hackathon · Matching closes March 8</div>
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <MemberSearch label="Find Yourself" dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={agentSelf} onSelect={setAgentSelf} />
                    {errors.agentSelf && <div className="ferr" style={{ marginTop: -8, marginBottom: 10 }}>{errors.agentSelf}</div>}
                    <div className="fr"><label className="form-label">Problem Space Interest</label><div className="fh">What kind of problem do you want to work on?</div><textarea className="fi" placeholder="e.g. Compliance automation, workforce tools, supply chain risk…" value={agentInterest} onChange={e => setAgentInterest(e.target.value)} /></div>
                    <div className="fr-2">
                        <div><label className="form-label">Preferred Tool<span className="req">*</span></label><div className="radio-group" style={{ marginTop: 7 }}>{TECH_OPTIONS.map(t => <div className="rp" key={t}><input type="radio" id={`agt-${t}`} name="agentTool" value={t} checked={agentTool === t} onChange={() => setAgentTool(t)} /><label htmlFor={`agt-${t}`}>{t}</label></div>)}</div>{errors.agentTool && <div className="ferr">{errors.agentTool}</div>}</div>
                        <div><label className="form-label">Attendance<span className="req">*</span></label><div className="radio-group" style={{ marginTop: 7 }}>{ATTENDANCE_OPTIONS.map(a => <div className="rp" key={a}><input type="radio" id={`aga-${a}`} name="agentAttend" value={a} checked={agentAttend === a} onChange={() => setAgentAttend(a)} /><label htmlFor={`aga-${a}`}>{a}</label></div>)}</div>{errors.agentAttend && <div className="ferr">{errors.agentAttend}</div>}</div>
                    </div>
                    <div className="fr"><label className="form-label">AI Skill Level<span className="req">*</span></label><div className="fh">1 = Never used it · 5 = Power user</div><div className="radio-group">{['1','2','3','4','5'].map(n => <div className="rp" key={n}><input type="radio" id={`agsk-${n}`} name="agentSkill" value={n} checked={agentSkill === n} onChange={() => setAgentSkill(n)} /><label htmlFor={`agsk-${n}`}>{n}</label></div>)}</div>{errors.agentSkill && <div className="ferr">{errors.agentSkill}</div>}</div>
                    <div className="fr"><div className="ck-row"><input type="checkbox" id="agAgreed" checked={agentAgreed} onChange={e => setAgentAgreed(e.target.checked)} /><label className="ck-label" htmlFor="agAgreed">I have read the <a href={RULES_URL} target="_blank" rel="noreferrer">hackathon rules & guidelines</a> and agree to follow them.</label></div>{errors.agentAgreed && <div className="ferr">{errors.agentAgreed}</div>}</div>
                    {submitError && submitError !== '__EXTERNAL__' && <div className="submit-err">{submitError}</div>}
                    {submitError === '__EXTERNAL__' && <ExternalFallback />}
                </div>
                <div className="modal-footer"><button className="cancel-btn" onClick={onClose}>Cancel</button><button className="submit-btn" disabled={submitting} onClick={handleAgentSubmit}>{submitting ? <><span className="spinner" /> Submitting…</> : '✓ Join Free Agent Pool'}</button></div>
            </div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-header">
                    <button className="modal-back" onClick={() => setScreen(0)}>← Back</button>
                    <div style={{ flex: 1 }}>
                        <div className="modal-title">Register Your Team</div>
                        <div className="modal-subtitle">FY27 GG AI Hackathon · {MAX_TEAMS}-team limit</div>
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="fs">
                        <div className="fs-title">Your Project</div>
                        <div className="fr"><label className="form-label">Team Name<span className="req">*</span></label><input className="fi" placeholder="e.g. The Compliance Crushers" value={teamName} onChange={e => setTeamName(e.target.value)} />{errors.teamName && <div className="ferr">{errors.teamName}</div>}<button className="hint-toggle" style={{ marginTop: 10 }} onClick={() => setShowHint(h => !h)}>{showHint ? '▾' : '▸'} Recommended Team Structure</button>{showHint && <div className="hint-box">One person on business case · one on the tech build · one on UX/presentation.</div>}</div>
                        <div className="fr"><label className="form-label">Use Case<span className="req">*</span></label><div className="fh">Briefly describe the problem you plan to solve. You can refine this after registration.</div><textarea className="fi" placeholder="We plan to build an AI agent that…" value={useCase} onChange={e => setUseCase(e.target.value)} />{errors.useCase && <div className="ferr">{errors.useCase}</div>}</div>
                        <div className="fr-2">
                            <div><label className="form-label">Technology<span className="req">*</span></label><div className="fh">Free training for all three.</div><div className="radio-group">{TECH_OPTIONS.map(t => <div className="rp" key={t}><input type="radio" id={`tech-${t}`} name="technology" value={t} checked={technology === t} onChange={() => setTechnology(t)} /><label htmlFor={`tech-${t}`}>{t}</label></div>)}</div>{errors.technology && <div className="ferr">{errors.technology}</div>}{technology === 'Other' && <div style={{ marginTop: 10 }}><input className="fi" placeholder="Specify technology…" value={otherTech} onChange={e => setOtherTech(e.target.value)} />{errors.otherTech && <div className="ferr">{errors.otherTech}</div>}</div>}</div>
                            <div><label className="form-label">Attendance<span className="req">*</span></label><div className="fh">How will your team participate?</div><div className="radio-group">{ATTENDANCE_OPTIONS.map(a => <div className="rp" key={a}><input type="radio" id={`att-${a}`} name="attendance" value={a} checked={attendance === a} onChange={() => setAttendance(a)} /><label htmlFor={`att-${a}`}>{a}</label></div>)}</div>{errors.attendance && <div className="ferr">{errors.attendance}</div>}</div>
                        </div>
                        <div className="fr"><label className="form-label">AI Skill Level</label><div className="fh">1 = Never used it · 5 = Power user</div><div className="radio-group">{['1','2','3','4','5'].map(n => <div className="rp" key={n}><input type="radio" id={`sk-${n}`} name="skillLevel" value={n} checked={skillLevel === n} onChange={() => setSkillLevel(n)} /><label htmlFor={`sk-${n}`}>{n}</label></div>)}</div></div>
                    </div>
                    <div className="fs">
                        <div className="fs-title">Your Team</div>
                        <div className="fh" style={{ marginBottom: 14 }}>Teams of 3–5. Captain + at least 2 more members required.</div>
                        <MemberSearch label="Team Captain" dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={captain} onSelect={setCaptain} />
                        {errors.captain && <div className="ferr" style={{ marginTop: -8, marginBottom: 10 }}>{errors.captain}</div>}
                        <MemberSearch label="Member 2" optional dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={member2} onSelect={setMember2} />
                        <MemberSearch label="Member 3" optional dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={member3} onSelect={setMember3} />
                        <MemberSearch label="Member 4" optional dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={member4} onSelect={setMember4} />
                        <MemberSearch label="Member 5" optional dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={member5} onSelect={setMember5} />
                        {errors.members && <div className="ferr">{errors.members}</div>}
                    </div>
                    <div className="fr"><div className="ck-row"><input type="checkbox" id="agreed" checked={agreed} onChange={e => setAgreed(e.target.checked)} /><label className="ck-label" htmlFor="agreed">I have read the <a href={RULES_URL} target="_blank" rel="noreferrer">hackathon rules & guidelines</a> and agree that my team will follow them.</label></div>{errors.agreed && <div className="ferr">{errors.agreed}</div>}</div>
                    {submitError && submitError !== '__EXTERNAL__' && <div className="submit-err">{submitError}</div>}
                    {submitError === '__EXTERNAL__' && <ExternalFallback />}
                </div>
                <div className="modal-footer"><button className="cancel-btn" onClick={onClose}>Cancel</button><button className="submit-btn" disabled={submitting} onClick={handleTeamSubmit}>{submitting ? <><span className="spinner" /> Registering…</> : '✓ Register Team'}</button></div>
            </div>
        </div>
    );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
function App() {
    const base = useBase();

    const subTable  = base.getTableByNameIfExists('Hackathon Submissions') ?? base.tables[0];
    const probTable = base.getTableByNameIfExists('Problem Statements')    ?? base.tables[0];
    const dirTable  = base.getTableByNameIfExists('GG Directory')          ?? base.tables[0];

    const submissions = useRecords(subTable);
    const probRecords = useRecords(probTable);
    const dirRecords  = useRecords(dirTable);

    const [tab,            setTab]            = useState('rules');
    const [showReg,        setShowReg]        = useState(false);
    const [modalInitScreen,setModalInitScreen]= useState(0);
    const [selProb,        setSelProb]        = useState(null);
    const [selTeam,        setSelTeam]        = useState(null);
    const [justRegistered, setJustRegistered] = useState(false);
    const [openFaq,        setOpenFaq]        = useState(null);
    const [countdown,      setCountdown]      = useState(getCountdown);

    useEffect(() => {
        const id = setInterval(() => setCountdown(getCountdown()), 1000);
        return () => clearInterval(id);
    }, []);

    const sfTeamName = subTable.getFieldIfExists('Team Name');
    const sfStatus   = subTable.getFieldIfExists('Submission Status');
    const sfUseCase  = subTable.getFieldIfExists('Use Case');
    const sfMember1  = subTable.getFieldIfExists('Team Member # 1 ( Captain)');
    const sfMember2  = subTable.getFieldIfExists('Team Member # 2');
    const sfMember3  = subTable.getFieldIfExists('Team Member # 3');
    const sfMember4  = subTable.getFieldIfExists('Team Member # 4');
    const sfMember5  = subTable.getFieldIfExists('Team Member # 5');
    const memberFields = [sfMember1, sfMember2, sfMember3, sfMember4, sfMember5];

    const pfId      = probTable.getFieldIfExists('Problem ID');
    const pfTitle   = probTable.getFieldIfExists('Name')        ?? probTable.getFieldIfExists('Problem');
    const pfDesc    = probTable.getFieldIfExists('Description') ?? probTable.getFieldIfExists('Current State');
    const pfDiff    = probTable.getFieldIfExists('Difficulty');
    const pfImpact  = probTable.getFieldIfExists('Impact');
    const pfDomain  = probTable.getFieldIfExists('Domain')      ?? probTable.getFieldIfExists('Category');
    const pfClaimed = probTable.getFieldIfExists('Claimed By')  ?? probTable.getFieldIfExists('Teams Exploring');

    const dfName  = dirTable.getFieldIfExists('Name')  ?? dirTable.getFieldIfExists('Associate Name');
    const dfEmail = dirTable.getFieldIfExists('Email') ?? dirTable.getFieldIfExists('Work Email');

    const { liveTeams, freeAgents } = useMemo(() => {
        const live = [], free = [];
        submissions.forEach(r => {
            const name   = sfTeamName ? r.getCellValueAsString(sfTeamName) : '';
            const status = sfStatus   ? r.getCellValueAsString(sfStatus)   : '';
            if (TEST_NAMES.includes(name.trim())) return;
            if (status === 'Free Agent') free.push(r); else live.push(r);
        });
        return { liveTeams: live, freeAgents: free };
    }, [submissions, sfTeamName, sfStatus]);

    const totalTeams     = liveTeams.length;
    const submittedTeams = liveTeams.filter(r => sfStatus && r.getCellValueAsString(sfStatus) === 'Submitted').length;
    const spotsLeft      = Math.max(0, MAX_TEAMS - totalTeams);

    const openModal = (screen = 0) => { setModalInitScreen(screen); setShowReg(true); };
    const handleModalClose = () => { setShowReg(false); if (justRegistered) { setTab('teams'); setJustRegistered(false); } };

    const renderProbCard = r => {
        const id     = pfId     ? r.getCellValueAsString(pfId)    : '';
        const title  = pfTitle  ? r.getCellValueAsString(pfTitle) : r.name;
        const desc   = pfDesc   ? r.getCellValueAsString(pfDesc)  : '';
        const diff   = pfDiff   ? (r.getCellValue(pfDiff)?.name ?? '') : '';
        const impact = pfImpact ? (r.getCellValue(pfImpact)?.name ?? '') : '';
        const domain = pfDomain ? r.getCellValueAsString(pfDomain) : '';
        const diffCls = diff === 'Easy' ? 'ptag ptag-easy' : diff === 'Medium' ? 'ptag ptag-medium' : diff === 'Hard' ? 'ptag ptag-hard' : '';
        return (
            <div key={r.id} className={`prob-card diff-${diff}`} onClick={() => setSelProb(r)}>
                <div className="prob-card-inner">
                    <div className="prob-card-top">
                        {id && <span className="prob-card-id">{id}</span>}
                        {impact === 'High' && <span className="prob-card-impact">High Impact</span>}
                    </div>
                    <div className="prob-card-title">{title}</div>
                    {desc && <div className="prob-card-desc">{desc}</div>}
                    <div className="prob-card-footer">
                        <div className="prob-card-tags">
                            {domain && <span className="ptag ptag-domain">{domain}</span>}
                            {diff && diffCls && <span className={diffCls}>{diff}</span>}
                        </div>
                        <div className="prob-card-arrow"><ArrowRightIcon size={14} /></div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="portal">
            <style>{css}</style>

            <div className="portal-header">
                {/* ── HERO ── */}
                <div className="hero">
                    <div className="hero-inner">
                        <div className="hero-left">
                            <div className="hero-eyebrow">GG Digital Acceleration · FY27 · Science Fair March 20</div>
                            <h1>FY27 GG<br /><span className="accent">AI Hackathon</span></h1>
                            <div className="hero-byline">Build something that matters. Win something that counts.</div>
                            <div className="hero-sub">48 hours. Real data. Real problems. Use Airtable, Harvey, or CodePuppy to build an AI-powered solution for Walmart's Global Governance team.</div>
                            <div className="hero-actions">
                                <button className="btn-primary" onClick={() => openModal(0)}>
                                    <SparkIcon size={14} color="#001E60" /> Register Your Team →
                                </button>
                                <button className="btn-outline" onClick={() => setTab('challenges')}>
                                    See the Challenges ↓
                                </button>
                            </div>
                        </div>
                        <div className="hero-orbital">
                            <div className="orb-ring orb-r1" /><div className="orb-ring orb-r2" /><div className="orb-ring orb-r3" />
                            <div className="orb-track orb-t1"><div className="orb-dot" /></div>
                            <div className="orb-track orb-t2"><div className="orb-dot" /></div>
                            <div className="orb-core"><SparkIcon size={24} /></div>
                        </div>
                    </div>
                </div>

                {/* ── STAT BAR ── */}
                <div className="stat-bar">
                    <div className="stat-bar-inner">
                        <div className="stat-item"><div className="stat-num">{totalTeams}</div><div className="stat-label">Teams Registered</div></div>
                        <div className="stat-item"><div className="stat-num">{submittedTeams}</div><div className="stat-label">Submitted</div></div>
                        <div className="stat-item"><div className="stat-num">{freeAgents.length}</div><div className="stat-label">Free Agents</div></div>
                        <div className="stat-item"><div className="stat-num">{probRecords.length || 12}</div><div className="stat-label">Problem Tracks</div></div>
                        <div className="stat-item"><div className={`stat-num${spotsLeft <= 10 ? ' stat-num-red' : ''}`}>{spotsLeft}</div><div className="stat-label">Spots Remaining</div></div>
                        <div className="stat-item"><div className="stat-num-sm">{countdown}</div><div className="stat-label">Registration Closes</div></div>
                    </div>
                </div>

                {/* ── PHASE TIMELINE ── */}
                <div className="phase-section">
                    <div className="phase-timeline">
                        {PHASES.map(p => (
                            <div key={p.label} className="phase-node">
                                <div className={`phase-pill ${p.active ? 'phase-pill-active' : 'phase-pill-inactive'}`}>{p.label}</div>
                                <div className="phase-sub">{p.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── TAB BAR ── */}
                <div className="tab-bar">
                    {TABS.map(([id, label]) => (
                        <button key={id} className={`tab-btn${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
                            {id === 'teams' && <span className="live-dot" />}{label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── TAB CONTENT ── */}
            <div className="portal-body">

                {/* RULES & GUIDELINES */}
                {tab === 'rules' && <>
                    <div className="sec-cloud">
                        <div className="sec-wrap">
                            <span className="sec-label">Eligibility & Format</span>
                            <h2 className="sec-h2">Rules & Guidelines</h2>
                            <p className="sec-sub">Everything you need to know before you build. <a className="rules-link" href={RULES_URL} target="_blank" rel="noreferrer">Full doc ↗</a></p>
                            <div className="rule-cards">
                                <div className="rule-card"><div className="rule-icon"><ClipboardTextIcon size={30} color={T.blue} weight="duotone" /></div><div className="rule-title">Eligibility</div><div className="rule-desc">Open to all Walmart Home Office associates. Teams of 3–5; solo sign-ups will be matched to a team before March 8.</div></div>
                                <div className="rule-card"><div className="rule-icon"><TimerIcon size={30} color={T.blue} weight="duotone" /></div><div className="rule-title">Build Window</div><div className="rule-desc">No building before March 16 at 8am CT. All prototypes must be started and completed during the official 48-hour window.</div></div>
                                <div className="rule-card"><div className="rule-icon"><TrophyIcon size={30} color={T.blue} weight="duotone" /></div><div className="rule-title">Judging</div><div className="rule-desc">Projects scored on Relevance, Business Impact, AI Integration, and Demo Quality. Top 5 present to executive judges.</div></div>
                            </div>
                        </div>
                    </div>
                    <div className="sec-white">
                        <div className="sec-wrap">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: T.deep }}>Key Dates</h3>
                                <a className="rules-link" href={RULES_URL} target="_blank" rel="noreferrer">Full Rules ↗</a>
                            </div>
                            <div className="key-dates-table">
                                <div className="kdt-head"><span>Event</span><span style={{ textAlign: 'center' }}>Date</span><span style={{ textAlign: 'right' }}>Note</span></div>
                                {KEY_DATES.map(row => (
                                    <div key={row.event} className="kdt-row">
                                        <span className="kdt-event">{row.event}</span>
                                        <span className="kdt-date">{row.date}</span>
                                        {row.note && <span className={`kdt-note${row.note.includes('limit') || row.note.includes('before') ? ' kdt-note-warn' : ''}`}>{row.note}</span>}
                                    </div>
                                ))}
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: T.deep, marginBottom: 16 }}>Scoring Rubric</h3>
                            <div className="judge-grid">
                                {JUDGING.map(j => (
                                    <div key={j.label} className="judge-card">
                                        <div className="judge-top"><div className="judge-label">{j.label}</div><div className="judge-weight">{j.weight}</div></div>
                                        <div className="judge-desc">{j.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>}

                {/* REGISTER */}
                {tab === 'register' && <>
                    <div className="sec-white">
                        <div className="sec-wrap">
                            <span className="sec-label">Registration</span>
                            <h2 className="sec-h2">Join the Hackathon</h2>
                            <p className="sec-sub">Registration closes <strong>March 9 at 5pm CT</strong>. Spots are limited to {MAX_TEAMS} teams — {spotsLeft} remaining.</p>
                            <div className="reg-cols">
                                <div className="reg-col-card" style={{ borderTop: `3px solid ${T.blue}` }}>
                                    <div className="reg-col-head">Register a Team</div>
                                    <ol className="step-list">
                                        {['Team captain fills out the registration form.','Teammates receive invitations to confirm and agree to the rules.','Once all members accept, your team is officially registered.'].map((step, i) => (
                                            <li key={i} className="step-item"><div className="step-num">{i + 1}</div><div className="step-text">{step}</div></li>
                                        ))}
                                    </ol>
                                    <div className="warn-note">
                                        <WarningIcon size={16} color="#7A5A00" weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
                                        <span>Minimum 3 members required. Maximum 5. You can add members after registration.</span>
                                    </div>
                                    <button className="btn-primary" onClick={() => openModal(0)}>Register Your Team →</button>
                                </div>
                                <div className="reg-col-card" style={{ borderTop: `3px solid ${T.muted2}` }}>
                                    <div className="reg-col-head">No Team? No Problem.</div>
                                    <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, marginBottom: 18 }}>Sign up as a free agent and we'll match you with a team based on your skills and interests. <strong style={{ color: T.body }}>Matching closes March 8.</strong></p>
                                    <ul className="fa-bullets">
                                        <li className="fa-bullet">Tell us your preferred tool</li>
                                        <li className="fa-bullet">Share your problem area of interest</li>
                                        <li className="fa-bullet">Rate your AI skill level (1–5)</li>
                                    </ul>
                                    <button className="btn-outline-dark" onClick={() => openModal('freeagent')}>Sign Up as Free Agent →</button>
                                </div>
                            </div>
                            <div className="already-reg">
                                <strong style={{ color: T.body }}>Already registered?</strong> Find <strong style={{ color: T.body }}>#gg-hackathon</strong> on Teams for roster changes. Closes <strong style={{ color: T.body }}>March 14</strong>.
                            </div>
                        </div>
                    </div>
                </>}

                {/* REGISTRATION PORTAL */}
                {tab === 'teams' && <>
                    <div className="sec-cloud">
                        <div className="sec-wrap">
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div>
                                    <span className="sec-label">Registration Portal</span>
                                    <h2 className="sec-h2" style={{ marginBottom: 0 }}>Registered Teams</h2>
                                </div>
                                <button className="btn-primary" onClick={() => openModal(0)}>+ Register a Team</button>
                            </div>
                            {liveTeams.length === 0 ? (
                                <div className="team-empty">
                                    <div style={{ marginBottom: 12 }}><CalendarDotsIcon size={40} color={T.muted2} weight="duotone" /></div>
                                    <div>No teams registered yet — be the first.</div>
                                </div>
                            ) : (
                                <div className="team-grid">
                                    {liveTeams.map(r => {
                                        const name   = sfTeamName ? r.getCellValueAsString(sfTeamName) : r.name;
                                        const status = sfStatus   ? r.getCellValueAsString(sfStatus)   : '';
                                        const members = memberFields.flatMap(f => {
                                            if (!f) return [];
                                            try { const v = r.getCellValue(f); return v ? v.map(m => m.name) : []; } catch { return []; }
                                        }).filter(Boolean);
                                        const badgeCls = status === 'Submitted' ? 'team-badge-submitted' : 'team-badge-registered';
                                        return (
                                            <div key={r.id} className="team-card" onClick={() => setSelTeam(r)}>
                                                <div className="team-card-name">{name}</div>
                                                <div className="team-card-meta">
                                                    <span className={`team-badge ${badgeCls}`}>{status || 'Registered'}</span>
                                                    <span className="team-card-count">{members.length} member{members.length !== 1 ? 's' : ''}</span>
                                                </div>
                                                {members.length > 0 && <div className="team-card-members">{members.join(' · ')}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>}

                {/* CHALLENGES & TOOLS */}
                {tab === 'challenges' && <>
                    <div className="sec-cloud">
                        <div className="sec-wrap">
                            <span className="sec-label">Challenges</span>
                            <h2 className="sec-h2">Pick Your Problem</h2>
                            <p className="sec-sub">GG-specific challenges designed for this hackathon. Multiple teams can work on the same problem.</p>
                            <div className="callout-box">
                                <strong>You can define your own problem statement.</strong> Judges evaluate on <strong>relevance to GG</strong>, <strong>business impact</strong>, and <strong>AI integration</strong>.
                            </div>
                            {probRecords.length > 0 ? (
                                <div className="prob-grid">{probRecords.map(renderProbCard)}</div>
                            ) : (
                                <div style={{ padding: '48px 0', textAlign: 'center', color: T.muted, fontSize: 14 }}>Problem statements are being finalized — check back before March 9.</div>
                            )}
                            <div className="prob-note"><strong>Not sure which to pick?</strong> Register first — you can finalize your problem statement after March 9. The build window doesn't open until March 16.</div>
                        </div>
                    </div>
                    <div className="sec-white">
                        <div className="sec-wrap">
                            <span className="sec-label">Tools</span>
                            <h2 className="sec-h2">Choose Your Stack</h2>
                            <p className="sec-sub">Free training is available for all three tools. Pick one — or combine them if your use case calls for it. Confirm access before March 9.</p>
                            <div className="tool-cards">
                                <div className="tool-card"><div className="tool-bar" style={{ background: T.blue }} /><div className="tool-inner"><div className="tool-name">Airtable</div><div className="tool-tagline">Best for: Structured data, interfaces, automations</div><div className="tool-desc">Build operational interfaces, automated workflows, and dashboards on top of GG's existing data — no code required.</div><div className="tool-access-block"><SealCheckIcon size={14} color="#27AE60" weight="fill" style={{ flexShrink: 0, marginTop: 1 }} /><span>Already provisioned for all GG associates. Your license activates automatically at registration.</span></div><a className="tool-link" href="https://airtable.com/academy" target="_blank" rel="noreferrer">Get Training <ArrowRightIcon size={12} /></a></div></div>
                                <div className="tool-card"><div className="tool-bar" style={{ background: '#7C3AED' }} /><div className="tool-inner"><div className="tool-name">Harvey</div><div className="tool-tagline">Best for: Document AI, natural language Q&A</div><div className="tool-desc">Point Harvey at any PDF, policy doc, or regulation — ask questions, extract structured data, and draft content at scale.</div><div className="tool-access-block"><WarningIcon size={14} color="#E67E22" weight="fill" style={{ flexShrink: 0, marginTop: 1 }} /><span>Contact <strong>Abby Worley</strong> to confirm your Harvey license before the event. Allow 2–3 business days.</span></div><span className="tool-note-badge">Training at kickoff</span></div></div>
                                <div className="tool-card"><div className="tool-bar" style={{ background: '#059669' }} /><div className="tool-inner"><div className="tool-name">CodePuppy</div><div className="tool-tagline">Best for: Custom code, integrations, APIs</div><div className="tool-desc">Writes and runs JavaScript/Python. Connect external APIs, transform data, or build automations that go beyond no-code tools.</div><div className="tool-access-block"><WarningIcon size={14} color="#E67E22" weight="fill" style={{ flexShrink: 0, marginTop: 1 }} /><span>Contact <strong>Michael [GG team]</strong> to confirm access early — new user provisioning is limited.</span></div><span className="tool-note-badge">Training at kickoff</span></div></div>
                            </div>
                            <div className="callout-box">💡 <strong>Not sure which tool to pick?</strong> Join weekly office hours — Thursdays 10–11am CT — to talk through your use case before the build window opens.</div>
                        </div>
                    </div>
                </>}

                {/* HELP */}
                {tab === 'help' && <>
                    <div className="sec-white">
                        <div className="sec-wrap">
                            <span className="sec-label">Support</span>
                            <h2 className="sec-h2">We've Got You Covered</h2>
                            <p className="sec-sub">Multiple support channels available before and during the event.</p>
                            <div className="help-cards">
                                <div className="help-card">
                                    <div className="help-card-icon"><QuestionIcon size={30} color={T.blue} weight="duotone" /></div>
                                    <div className="help-card-title">Frequently Asked Questions</div>
                                    <div className="faq-list">
                                        {FAQS.map((item, i) => (
                                            <div key={i} className="faq-item">
                                                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                                    <span>{item.q}</span><span className={`faq-chevron${openFaq === i ? ' open' : ''}`}>▸</span>
                                                </button>
                                                <div className={`faq-a${openFaq === i ? ' open' : ''}`}>{item.a}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="help-card">
                                    <div className="help-card-icon"><HeadsetIcon size={30} color={T.blue} weight="duotone" /></div>
                                    <div className="help-card-title">Associate Support</div>
                                    <div className="contact-blocks">
                                        <div className="contact-block"><div className="contact-topic">Airtable Questions</div><div className="contact-name">Bennett Oliver</div><div className="contact-role">Account Executive</div><div className="contact-note">Office hours: Thursdays 10–11am CT</div></div>
                                        <div className="contact-block"><div className="contact-topic">Harvey Questions</div><div className="contact-name">Abby Worley</div><div className="contact-role">GG Digital Acceleration</div></div>
                                        <div className="contact-block"><div className="contact-topic">CodePuppy Questions</div><div className="contact-name">Michael [GG team]</div><div className="contact-role">GG Digital Acceleration</div></div>
                                    </div>
                                    <div className="help-footer-note">For anything else → <strong>#gg-hackathon</strong> in Teams</div>
                                </div>
                                <div className="help-card">
                                    <div className="help-card-icon"><ChalkboardTeacherIcon size={30} color={T.blue} weight="duotone" /></div>
                                    <div className="help-card-title">Mentor Program</div>
                                    <div className="mentor-body">Every registered team is assigned one internal mentor with relevant domain or technical expertise.</div>
                                    <ul className="mentor-bullets">
                                        <li className="mentor-bullet">1 mentor per team (subject to team count)</li>
                                        <li className="mentor-bullet">Active during the build window March 16–19</li>
                                        <li className="mentor-bullet">Matched on your tool choice and problem area</li>
                                    </ul>
                                    <div style={{ background: T.ice, border: `1px solid ${T.border2}`, borderRadius: 6, padding: '10px 14px', fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
                                        Vendor support from Airtable, Harvey, and CodePuppy is available in addition to your assigned mentor.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>}
            </div>

            {/* ── MODALS ── */}
            {showReg && (
                <RegistrationModal
                    initialScreen={modalInitScreen}
                    onClose={handleModalClose}
                    onRegister={() => setJustRegistered(true)}
                    submissionsTable={subTable}
                    dirRecords={dirRecords}
                    dirNameField={dfName}
                    dirEmailField={dfEmail}
                />
            )}
            {selProb && <ProblemDetailModal prob={selProb} onClose={() => setSelProb(null)} pfId={pfId} pfTitle={pfTitle} pfDesc={pfDesc} pfDiff={pfDiff} pfImpact={pfImpact} pfDomain={pfDomain} pfClaimed={pfClaimed} />}
            {selTeam && <TeamDetailModal team={selTeam} onClose={() => setSelTeam(null)} sfTeamName={sfTeamName} sfStatus={sfStatus} sfUseCase={sfUseCase} memberFields={memberFields} />}
        </div>
    );
}

initializeBlock({ interface: () => <App /> });
