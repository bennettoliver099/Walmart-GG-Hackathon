import React, { useState, useMemo, useEffect } from 'react';
import {
    CalendarBlankIcon, FolderSimpleIcon, ChatCircleIcon, CheckSquareIcon,
    NotePencilIcon, UserCircleIcon, ClipboardTextIcon, TimerIcon, TrophyIcon,
    QuestionIcon, HeadsetIcon, ChalkboardTeacherIcon, UsersThreeIcon,
    HandWavingIcon, MagnifyingGlassIcon, LockSimpleIcon,
} from '@phosphor-icons/react';
import {
    initializeBlock,
    useBase,
    useRecords,
} from '@airtable/blocks/interface/ui';

// ─── SAFE FIELD HELPERS ──────────────────────────────────────────────────────
function safeGetCellValue(record, fieldName) {
    try { return record.getCellValue(fieldName); } catch (e) { return null; }
}
function safeGetCellValueAsString(record, fieldName) {
    try { return record.getCellValueAsString(fieldName); } catch (e) { return ''; }
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const EXTERNAL_FORM_URL     = 'https://airtable.com/app4AdZ5m3rWZ4kt8/pagX2wubHXk1Q7Em0/form';
const RULES_URL             = 'https://teams.wal-mart.com/sites/GGDigitalAcceleration';
const TEST_NAMES            = ['Test', 'Test ', 'Test2', 'test 5', 'Rest'];
const TECH_OPTIONS          = ['Airtable', 'CodePuppy', 'Harvey', 'Other'];
const ATTENDANCE_OPTIONS    = ['Virtual', 'In Person', 'Hybrid'];
const HACKATHON_DEADLINE    = new Date('2026-03-09T17:00:00');
const MAX_TEAMS             = 50;

// ─── WALMART SPARK SVG ────────────────────────────────────────────────────────
const SPARK_PATHS = `<path d="M375.663,273.363c12.505-2.575,123.146-53.269,133.021-58.97c22.547-13.017,30.271-41.847,17.254-64.393s-41.847-30.271-64.393-17.254c-9.876,5.702-109.099,76.172-117.581,85.715c-9.721,10.937-11.402,26.579-4.211,39.033C346.945,269.949,361.331,276.314,375.663,273.363z"/><path d="M508.685,385.607c-9.876-5.702-120.516-56.396-133.021-58.97c-14.332-2.951-28.719,3.415-35.909,15.87c-7.191,12.455-5.51,28.097,4.211,39.033c8.482,9.542,107.705,80.013,117.581,85.715c22.546,13.017,51.376,5.292,64.393-17.254S531.231,398.624,508.685,385.607z"/><path d="M266.131,385.012c-14.382,0-27.088,9.276-31.698,23.164c-4.023,12.117-15.441,133.282-15.441,144.685c0,26.034,21.105,47.139,47.139,47.139c26.034,0,47.139-21.105,47.139-47.139c0-11.403-11.418-132.568-15.441-144.685C293.219,394.288,280.513,385.012,266.131,385.012z"/><path d="M156.599,326.637c-12.505,2.575-123.146,53.269-133.021,58.97C1.031,398.624-6.694,427.454,6.323,450c13.017,22.546,41.847,30.271,64.393,17.254c9.876-5.702,109.098-76.172,117.58-85.715c9.722-10.937,11.402-26.579,4.211-39.033S170.931,323.686,156.599,326.637z"/><path d="M70.717,132.746C48.171,119.729,19.341,127.454,6.323,150c-13.017,22.546-5.292,51.376,17.254,64.393c9.876,5.702,120.517,56.396,133.021,58.97c14.332,2.951,28.719-3.415,35.91-15.87c7.191-12.455,5.51-28.096-4.211-39.033C179.815,208.918,80.592,138.447,70.717,132.746z"/><path d="M266.131,0c-26.035,0-47.139,21.105-47.139,47.139c0,11.403,11.418,132.568,15.441,144.685c4.611,13.888,17.317,23.164,31.698,23.164s27.088-9.276,31.698-23.164c4.023-12.117,15.441-133.282,15.441-144.685C313.27,21.105,292.165,0,266.131,0z"/>`;

function SparkIcon({ size = 20, color = 'white' }) {
    return (
        <svg viewBox="0 0 532.262 600" width={size} height={size} xmlns="http://www.w3.org/2000/svg"
            style={{ fill: color, display: 'block', flexShrink: 0 }}
            dangerouslySetInnerHTML={{ __html: SPARK_PATHS }} />
    );
}

// ─── MASHUP IDEAS ─────────────────────────────────────────────────────────────
const MASHUP_IDEAS = [
    { title: 'Compliance Exposure Map', desc: 'Cross Illinois BIPA with the GG Directory to identify which associates are at biometric-timekeeping locations — then flag for consent documentation.', tables: ['Regulatory Documents', 'Store Locations', 'GG Directory'], icon: '🗺️' },
    { title: 'Risk Score by Store', desc: 'Join Store Locations with Regulatory Documents filtered by state to produce a per-store compliance risk score.', tables: ['Store Locations', 'Regulatory Documents'], icon: '📊' },
    { title: 'DC Safety Watchlist', desc: 'Combine OSHA rules with DC data to generate a prioritized list of distribution centers that need policy updates first.', tables: ['Regulatory Documents', 'Distribution Centers'], icon: '🛡️' },
    { title: 'Compliance Question Router', desc: 'Use the GG Directory and Prompt Library routing prompts to build an agent that reads a question and routes it to the right supervisor.', tables: ['GG Directory', 'Prompt Library'], icon: '🤖' },
    { title: 'Forced Labor Scanner', desc: 'Match DC locations against UFLPA requirements to flag distribution centers receiving goods from high-risk origin regions.', tables: ['Regulatory Documents', 'Distribution Centers'], icon: '⚠️' },
    { title: 'AI Ethics Review Pipeline', desc: 'Collect AI project details via form, score risk using Prompt Library classification prompts, route to the right GG reviewer.', tables: ['Problem Statements', 'GG Directory', 'Prompt Library'], icon: '🧠' },
];

// ─── JUDGING ──────────────────────────────────────────────────────────────────
const JUDGING = [
    { label: 'Impact',       weight: '30%', desc: 'Does this solve a real GG problem? Would it save time, reduce risk, or close a compliance gap?' },
    { label: 'Innovation',   weight: '25%', desc: 'Does it use AI meaningfully — not just a dashboard, but something that automates or augments a real decision?' },
    { label: 'Feasibility',  weight: '25%', desc: 'Could this be deployed at Walmart with reasonable effort? Is it built on available data and tools?' },
    { label: 'Demo Quality', weight: '20%', desc: 'Is the working prototype clear and compelling? Can you explain the problem it solves in 2 minutes?' },
];

// ─── PHASE TIMELINE ───────────────────────────────────────────────────────────
const PHASES = [
    { label: 'Register', sub: 'Now Open',                active: true  },
    { label: 'Train',    sub: 'Week of March 9',          active: false },
    { label: 'Build',    sub: 'March 16–19',              active: false },
    { label: 'Present',  sub: 'March 20 · Science Fair',  active: false },
];

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
    blue:     '#0071CE',
    deep:     '#0B2C5F',
    azure:    '#2C8EF4',
    ice:      '#CFE8FF',
    cloud:    '#F4F7FB',
    white:    '#FFFFFF',
    yellow:   '#FFC220',
    body:     '#334155',
    muted:    '#5A7A9A',
    muted2:   '#8BA5BF',
    border:   'rgba(0,113,206,0.14)',
    border2:  'rgba(0,113,206,0.26)',
    heroGrad: 'linear-gradient(135deg,#0B2C5F 0%,#0071CE 60%,#2C8EF4 100%)',
    shadow:   '0 1px 3px rgba(11,44,95,0.08)',
    shadowM:  '0 4px 16px rgba(11,44,95,0.10)',
};

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function getCountdown() {
    const diff = HACKATHON_DEADLINE - new Date();
    if (diff <= 0) return 'Closed';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${d}d ${h}h ${m}m`;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
html,body{scroll-behavior:smooth;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.portal{background:${T.white};color:${T.body};font-family:'Bogle','Brandon Text','Inter',sans-serif;min-height:100vh;font-size:14px;line-height:1.5;}

/* ── NAV ── */
.nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 56px;height:60px;background:${T.white};border-bottom:1px solid ${T.border};box-shadow:${T.shadow};}
.nav-brand{display:flex;align-items:center;gap:10px;font-family:'Inter',sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${T.muted};font-weight:600;flex-shrink:0;}
.nav-spark{width:30px;height:30px;background:${T.heroGrad};border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.nav-links{display:flex;align-items:center;gap:5px;}
.nav-link{font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${T.muted};text-decoration:none;padding:5px 12px;border-radius:100px;border:1px solid transparent;transition:all 0.15s;white-space:nowrap;}
.nav-link:hover{color:${T.blue};border-color:${T.border2};}
.nav-link.active{color:${T.white};background:${T.blue};border-color:${T.blue};}
.nav-right{display:flex;align-items:center;gap:12px;flex-shrink:0;}
.nav-countdown{font-family:'Inter',sans-serif;font-size:11px;color:${T.muted};white-space:nowrap;}
.nav-cta{background:${T.yellow};color:${T.deep};border:none;padding:9px 20px;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;border-radius:5px;box-shadow:0 2px 8px rgba(255,194,32,0.3);transition:all 0.18s;white-space:nowrap;}
.nav-cta:hover{background:#FFD050;transform:translateY(-1px);}

/* ── SECTIONS ── */
section[id]{scroll-margin-top:70px;}
.sec-wrap{max-width:1160px;margin:0 auto;padding:72px 56px;}
.sec-white{background:${T.white};border-bottom:1px solid ${T.border};}
.sec-cloud{background:${T.cloud};border-bottom:1px solid ${T.border};}
.sec-dark{background:${T.heroGrad};}
.sec-label{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${T.blue};padding:3px 8px;border:1px solid ${T.border2};border-radius:3px;background:${T.ice};display:inline-block;margin-bottom:10px;}
.sec-label-dark{background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.25);color:rgba(255,255,255,0.9);}
.sec-h2{font-size:26px;font-weight:800;letter-spacing:-0.01em;color:${T.deep};margin-bottom:10px;line-height:1.2;}
.sec-h2-white{color:${T.white};}
.sec-sub{font-size:14px;color:${T.muted};line-height:1.65;max-width:640px;margin-bottom:36px;}
.sec-sub-white{color:rgba(255,255,255,0.72);}

/* ── HERO ── */
.hero{background:${T.heroGrad};padding:64px 56px 72px;position:relative;overflow:hidden;}
.hero::after{content:'';position:absolute;top:-40%;right:-8%;width:55%;height:180%;background:radial-gradient(ellipse,rgba(44,142,244,0.18),transparent 65%);pointer-events:none;}
.hero-inner{max-width:100%;position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:40px;}
.hero-left{flex:1;min-width:0;max-width:700px;}
.hero-orbital{flex-shrink:0;position:relative;width:220px;height:220px;display:flex;align-items:center;justify-content:center;}
.orb-ring{position:absolute;border-radius:50%;}
.orb-r1{width:220px;height:220px;border:1px dashed rgba(255,255,255,0.15);animation:lpspin 32s linear infinite;}
.orb-r2{width:160px;height:160px;border:1px solid rgba(255,255,255,0.12);animation:lpspin 22s linear infinite reverse;}
.orb-r3{width:108px;height:108px;border:1px solid rgba(255,255,255,0.2);animation:lpspin 16s linear infinite;}
.orb-core{position:relative;z-index:2;width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.12);border:2px solid rgba(255,255,255,0.28);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);}
.orb-track{position:absolute;border-radius:50%;}
.orb-t1{width:194px;height:194px;animation:lpspin 14s linear infinite;}
.orb-t2{width:136px;height:136px;animation:lpspin 9s linear infinite reverse;}
.orb-dot{position:absolute;top:0;left:50%;transform:translate(-50%,-50%);border-radius:50%;}
.orb-t1 .orb-dot{width:9px;height:9px;background:#FFC220;box-shadow:0 0 10px rgba(255,194,32,0.7),0 0 20px rgba(255,194,32,0.3);}
.orb-t2 .orb-dot{width:6px;height:6px;background:white;box-shadow:0 0 8px rgba(255,255,255,0.7),0 0 16px rgba(255,255,255,0.3);}
@keyframes lpspin{to{transform:rotate(360deg);}}
.hero-phases{display:flex;align-items:flex-start;margin-bottom:20px;gap:0;}
.hero-phase-node{display:flex;flex-direction:column;align-items:center;flex:1;position:relative;}
.hero-phase-node:not(:last-child)::after{content:'';position:absolute;top:14px;left:50%;width:100%;height:1px;background:rgba(255,255,255,0.2);}
.hero-phase-sub{font-family:'Inter',sans-serif;font-size:10px;color:rgba(255,255,255,0.5);text-align:center;line-height:1.4;max-width:90px;margin-top:5px;}
.hero h1{font-size:52px;font-weight:800;line-height:1.05;letter-spacing:-0.02em;color:${T.yellow};margin-bottom:18px;}
.hero h1 .accent{background:linear-gradient(90deg,#CFE8FF 0%,#7EC8F8 50%,#2C8EF4 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-byline{font-family:'Inter',sans-serif;font-size:14px;font-weight:700;color:${T.white};letter-spacing:0.03em;margin-bottom:14px;}
.hero-sub{font-size:15px;color:rgba(255,255,255,0.72);max-width:520px;line-height:1.65;margin-bottom:32px;}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap;}
.btn-primary{display:inline-flex;align-items:center;gap:8px;background:${T.yellow};color:${T.deep};padding:12px 24px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;border-radius:5px;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(255,194,32,0.35);transition:all 0.18s;text-decoration:none;white-space:nowrap;}
.btn-primary:hover{background:#FFD050;transform:translateY(-1px);}
.btn-outline{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,0.12);color:${T.white};padding:12px 20px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;border-radius:5px;border:1px solid rgba(255,255,255,0.22);cursor:pointer;transition:all 0.18s;text-decoration:none;}
.btn-outline:hover{background:rgba(255,255,255,0.2);}
.btn-outline-dark{display:inline-flex;align-items:center;gap:7px;background:none;color:${T.deep};padding:12px 20px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;border-radius:5px;border:1px solid ${T.border2};cursor:pointer;transition:all 0.18s;text-decoration:none;}
.btn-outline-dark:hover{background:${T.ice};border-color:${T.blue};color:${T.blue};}

/* ── STAT BAR ── */
.stat-bar{background:${T.white};border-bottom:1px solid ${T.border};}
.stat-bar-inner{display:grid;grid-template-columns:repeat(6,1fr);width:100%;}
.stat-item{padding:18px 0;border-right:1px solid ${T.border};display:flex;flex-direction:column;gap:4px;align-items:center;text-align:center;}
.stat-item:last-child{border-right:none;}
.stat-num{font-family:'Inter',sans-serif;font-size:22px;font-weight:700;color:${T.blue};line-height:1;}
.stat-num-red{color:#B91C1C;}
.stat-num-sm{font-family:'Inter',sans-serif;font-size:14px;font-weight:700;color:${T.blue};line-height:1.2;letter-spacing:-0.01em;}
.stat-label{font-family:'Inter',sans-serif;font-size:9px;color:${T.muted};letter-spacing:0.08em;text-transform:uppercase;}

/* ── PHASE TIMELINE ── */
.phase-section{background:${T.white};border-bottom:1px solid ${T.border};padding:20px 56px 16px;}
.phase-timeline{display:flex;align-items:flex-start;max-width:1160px;margin:0 auto;}
.phase-node{display:flex;flex-direction:column;align-items:center;flex:1;position:relative;}
.phase-node:not(:last-child)::after{content:'';position:absolute;top:14px;left:50%;width:100%;height:1px;background:${T.border};}
.phase-pill{padding:5px 14px;border-radius:100px;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;margin-bottom:7px;white-space:nowrap;position:relative;z-index:1;}
.phase-pill-active{background:${T.yellow};color:${T.deep};box-shadow:0 2px 8px rgba(255,194,32,0.35);}
.phase-pill-inactive{background:${T.cloud};border:1px solid ${T.border};color:${T.muted2};}
.phase-sub{font-family:'Inter',sans-serif;font-size:10px;color:${T.muted};text-align:center;line-height:1.4;max-width:90px;}

/* ── OFFICIAL RULES CARD ── */
.official-rules-card{background:${T.white};border:1px solid ${T.border};border-radius:10px;padding:24px 26px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px;box-shadow:${T.shadow};}
.official-rules-card-left{display:flex;align-items:center;gap:14px;}
.official-rules-card-icon{width:42px;height:42px;border-radius:8px;background:${T.ice};border:1px solid ${T.border2};display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.official-rules-card-title{font-size:15px;font-weight:700;color:${T.deep};margin-bottom:2px;}
.official-rules-card-sub{font-size:12px;color:${T.muted};}
.rules-open-btn{display:inline-flex;align-items:center;gap:6px;background:${T.blue};color:${T.white};border:none;border-radius:6px;padding:9px 16px;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s;white-space:nowrap;flex-shrink:0;}
.rules-open-btn:hover{background:${T.deep};transform:translateY(-1px);}
/* ── RULES MODAL ── */
.modal-xl{max-width:820px;}
.rules-section{margin-bottom:28px;}
.rules-section:last-child{margin-bottom:0;}
.rules-section-header{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${T.blue};padding-bottom:8px;border-bottom:2px solid ${T.ice};margin-bottom:14px;}
.rules-section-body{font-size:13px;color:${T.body};line-height:1.8;white-space:pre-wrap;}
.rules-raw-body{font-size:13px;color:${T.body};line-height:1.8;white-space:pre-wrap;}
/* ── RULE CARDS ── */
.rule-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px;}
.rule-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;padding:24px 20px;transition:box-shadow 0.18s;}
.rule-card:hover{box-shadow:${T.shadowM};}
.rule-icon{margin-bottom:14px;display:flex;}
.rule-title{font-size:14px;font-weight:700;color:${T.deep};margin-bottom:8px;}
.rule-desc{font-size:13px;color:${T.muted};line-height:1.65;}
.rules-link{font-family:'Inter',sans-serif;font-size:13px;font-weight:700;color:${T.blue};text-decoration:none;display:inline-flex;align-items:center;gap:5px;margin-bottom:24px;}
.rules-link:hover{text-decoration:underline;}
.rubric-toggle{padding:8px 16px;border:1px solid ${T.border2};border-radius:5px;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;color:${T.blue};cursor:pointer;background:none;transition:all 0.15s;display:inline-flex;align-items:center;gap:7px;}
.rubric-toggle:hover{background:${T.ice};}
.judge-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:16px;}
.judge-card{background:${T.white};border:1px solid ${T.border};border-radius:7px;padding:18px 16px;}
.judge-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;}
.judge-label{font-size:14px;font-weight:800;color:${T.deep};}
.judge-weight{font-family:'Inter',sans-serif;font-size:18px;font-weight:700;color:${T.blue};}
.judge-desc{font-size:12px;color:${T.muted};line-height:1.6;}

/* ── TOOL CARDS ── */
.tool-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;}
.tool-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;overflow:hidden;display:flex;flex-direction:column;transition:box-shadow 0.18s;}
.tool-card:hover{box-shadow:${T.shadowM};}
.tool-bar{height:3px;flex-shrink:0;}
.tool-inner{padding:20px 18px;display:flex;flex-direction:column;flex:1;}
.tool-name{font-size:18px;font-weight:800;color:${T.deep};margin-bottom:4px;}
.tool-tagline{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:${T.muted2};margin-bottom:12px;}
.tool-desc{font-size:13px;color:${T.muted};line-height:1.65;flex:1;margin-bottom:14px;}
.tool-access-block{background:${T.cloud};border:1px solid ${T.border};border-radius:6px;padding:12px 14px;font-size:12px;color:${T.muted};line-height:1.6;margin-bottom:14px;}
.tool-link{font-family:'Inter',sans-serif;font-size:12px;font-weight:700;color:${T.blue};text-decoration:none;display:inline-flex;align-items:center;gap:4px;cursor:pointer;}
.tool-link:hover{text-decoration:underline;}
.callout-box{background:${T.ice};border:1px solid ${T.border2};border-radius:8px;padding:16px 20px;font-size:13px;color:${T.muted};line-height:1.7;}
.callout-box strong{color:${T.deep};}
/* ── HACKATHON DOCS ── */
.doc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.doc-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;padding:20px 20px 18px;display:flex;flex-direction:column;gap:10px;transition:box-shadow 0.18s;}
.doc-card:hover{box-shadow:${T.shadowM};}
.doc-card-name{font-size:14px;font-weight:700;color:${T.deep};line-height:1.3;}
.doc-card-summary{font-size:12px;color:${T.muted};line-height:1.65;flex:1;overflow:hidden;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;}
.doc-card-empty{text-align:center;padding:52px 20px;color:${T.muted};font-size:14px;}

/* ── REGISTRATION COLS ── */
.reg-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;}
.reg-col-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;padding:28px 24px;display:flex;flex-direction:column;}
.reg-col-head{font-size:16px;font-weight:800;color:${T.deep};margin-bottom:20px;}
.step-list{list-style:none;display:flex;flex-direction:column;gap:14px;margin-bottom:20px;}
.step-item{display:flex;gap:14px;align-items:flex-start;}
.step-num{width:24px;height:24px;border-radius:50%;background:${T.blue};color:${T.white};font-family:'Inter',sans-serif;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
.step-text{font-size:13px;color:${T.body};line-height:1.55;}
.warn-note{background:#FFF8E6;border:1px solid #F4D04A;border-radius:6px;padding:10px 14px;font-size:12px;color:#78500E;margin-bottom:20px;line-height:1.5;}
.fa-bullets{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:20px;}
.fa-bullet{font-size:13px;color:${T.body};padding-left:16px;position:relative;line-height:1.5;}
.fa-bullet::before{content:'→';position:absolute;left:0;color:${T.muted2};}
.already-reg{background:${T.cloud};border:1px solid ${T.border};border-radius:8px;padding:18px 22px;font-size:13px;color:${T.muted};line-height:1.6;}

/* ── WORKSPACE PREVIEW ── */
.ws-preview-card{background:${T.white};border-radius:12px;padding:32px;box-shadow:0 8px 40px rgba(11,44,95,0.15);}
.ws-lock-row{display:flex;align-items:center;gap:14px;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid ${T.border};}
.ws-lock-icon{font-size:32px;line-height:1;}
.ws-lock-label{font-size:13px;color:${T.muted};font-weight:500;}
.ws-feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;}
.ws-tile{background:${T.cloud};border:1px solid ${T.border};border-radius:8px;padding:16px 14px;}
.ws-tile-icon{margin-bottom:10px;display:flex;}
.ws-tile-label{font-size:13px;font-weight:700;color:${T.deep};margin-bottom:4px;}
.ws-tile-desc{font-size:12px;color:${T.muted};line-height:1.5;}
.ws-note{font-size:12px;color:${T.muted};font-style:italic;line-height:1.6;}

/* ── HELP CARDS ── */
.help-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start;}
.help-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;padding:24px 20px;display:flex;flex-direction:column;}
.help-card-icon{margin-bottom:12px;display:flex;}
.help-card-title{font-size:15px;font-weight:800;color:${T.deep};margin-bottom:16px;}

/* ── FAQ ACCORDION ── */
.faq-list{display:flex;flex-direction:column;}
.faq-item{border-bottom:1px solid ${T.border};}
.faq-item:first-child{border-top:1px solid ${T.border};}
.faq-q{width:100%;text-align:left;background:none;border:none;padding:12px 0;font-size:13px;font-weight:600;color:${T.deep};cursor:pointer;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;transition:color 0.15s;font-family:inherit;line-height:1.45;}
.faq-q:hover{color:${T.blue};}
.faq-chevron{font-size:11px;flex-shrink:0;margin-top:2px;transition:transform 0.2s ease;color:${T.muted2};}
.faq-chevron.open{transform:rotate(90deg);}
.faq-a{font-size:13px;color:${T.muted};line-height:1.65;max-height:0;overflow:hidden;transition:max-height 0.25s ease,opacity 0.2s,padding 0.2s;opacity:0;padding-bottom:0;}
.faq-a.open{max-height:120px;opacity:1;padding-bottom:12px;}

/* ── CONTACT BLOCKS ── */
.contact-blocks{display:flex;flex-direction:column;gap:10px;margin-bottom:16px;}
.contact-block{background:${T.cloud};border:1px solid ${T.border};border-radius:6px;padding:12px 14px;}
.contact-topic{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${T.muted};margin-bottom:4px;}
.contact-name{font-size:13px;font-weight:700;color:${T.deep};}
.contact-role{font-size:12px;color:${T.muted};}
.contact-note{font-size:11px;color:${T.muted2};margin-top:2px;font-style:italic;}
.help-footer-note{font-size:12px;color:${T.muted};margin-top:auto;padding-top:14px;border-top:1px solid ${T.border};}

/* ── MENTOR ── */
.mentor-body{font-size:13px;color:${T.muted};line-height:1.65;margin-bottom:14px;}
.mentor-bullets{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:14px;}
.mentor-bullet{font-size:13px;color:${T.body};padding-left:18px;position:relative;line-height:1.5;}
.mentor-bullet::before{content:'✓';position:absolute;left:0;color:${T.blue};font-weight:700;}
.mentor-note{font-size:12px;color:${T.muted2};font-style:italic;line-height:1.5;margin-top:auto;}

/* ── FOOTER ── */
.site-footer{background:${T.white};border-top:1px solid ${T.border};padding:24px 40px 20px;}
.site-footer-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid ${T.border};}
.site-footer-brand{display:flex;align-items:center;gap:10px;}
.site-footer-brand-text{font-family:'Inter',sans-serif;font-size:12px;font-weight:600;color:${T.muted};}
.site-footer-links{display:flex;align-items:center;gap:20px;}
.site-footer-link{font-family:'Inter',sans-serif;font-size:12px;color:${T.muted};text-decoration:none;cursor:pointer;transition:color 0.15s;background:none;border:none;}
.site-footer-link:hover{color:${T.blue};}
.site-footer-link-cta{font-family:'Inter',sans-serif;font-size:12px;font-weight:700;color:${T.blue};cursor:pointer;background:none;border:none;transition:color 0.15s;}
.site-footer-link-cta:hover{color:${T.deep};}
.site-footer-bottom{font-family:'Inter',sans-serif;font-size:11px;color:${T.muted2};letter-spacing:0.06em;text-align:center;}

/* ── MODAL (unchanged) ── */
.modal-overlay{position:fixed;inset:0;z-index:999;background:rgba(11,44,95,0.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn 0.18s ease;}
.modal{background:${T.white};border:1px solid ${T.border};border-radius:12px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(11,44,95,0.2);animation:slideUp 0.22s ease;scrollbar-width:thin;scrollbar-color:${T.muted2} transparent;}
.modal-header{padding:24px 28px 18px;border-bottom:1px solid ${T.border};display:flex;align-items:flex-start;justify-content:space-between;gap:12px;position:sticky;top:0;background:${T.white};z-index:10;}
.modal-title{font-size:18px;font-weight:800;color:${T.deep};}
.modal-subtitle{font-size:12px;color:${T.muted};margin-top:3px;}
.modal-close{background:none;border:none;cursor:pointer;color:${T.muted};font-size:18px;line-height:1;padding:2px;border-radius:3px;transition:color 0.15s;flex-shrink:0;}
.modal-close:hover{color:${T.deep};}
.modal-back{background:none;border:none;cursor:pointer;color:${T.muted};font-size:12px;display:flex;align-items:center;gap:4px;padding:0;transition:color 0.15s;font-family:'Inter',sans-serif;font-weight:600;}
.modal-back:hover{color:${T.deep};}
.modal-body{padding:22px 28px 24px;}
.fs{margin-bottom:24px;}
.fs-title{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${T.blue};margin-bottom:14px;padding-bottom:7px;border-bottom:1px solid ${T.border};}
.fr{margin-bottom:14px;}
.fr-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
.form-label{display:block;font-size:13px;font-weight:700;margin-bottom:5px;color:${T.deep};}
.form-label .req{color:#B91C1C;margin-left:2px;}
.fh{font-size:12px;color:${T.muted};margin-bottom:7px;line-height:1.5;}
.fi{width:100%;background:${T.cloud};border:1px solid ${T.border2};border-radius:5px;padding:9px 12px;color:${T.deep};font-family:'Inter',sans-serif;font-size:13px;outline:none;transition:border-color 0.15s;}
.fi:focus{border-color:${T.blue};box-shadow:0 0 0 3px rgba(0,113,206,0.08);}
.fi::placeholder{color:${T.muted2};}
textarea.fi{resize:vertical;min-height:76px;line-height:1.5;}
.radio-group{display:flex;gap:7px;flex-wrap:wrap;}
.rp{position:relative;}
.rp input{position:absolute;opacity:0;width:0;height:0;}
.rp label{display:inline-block;padding:6px 12px;border:1px solid ${T.border2};border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;color:${T.muted};white-space:nowrap;}
.rp input:checked + label{border-color:${T.blue};color:${T.blue};background:${T.ice};}
.rp label:hover{border-color:${T.blue};color:${T.blue};}
.ms-wrap{position:relative;}
.ms-results{position:absolute;top:calc(100% + 3px);left:0;right:0;background:${T.white};border:1px solid ${T.border2};border-radius:6px;z-index:20;max-height:180px;overflow-y:auto;box-shadow:${T.shadowM};}
.ms-item{padding:9px 12px;cursor:pointer;transition:background 0.12s;border-bottom:1px solid rgba(0,113,206,0.06);}
.ms-item:last-child{border-bottom:none;}
.ms-item:hover{background:${T.cloud};}
.ms-name{font-size:13px;font-weight:600;color:${T.deep};}
.ms-email{font-size:11px;color:${T.muted};margin-top:1px;font-family:'Inter',sans-serif;}
.ms-sel{display:flex;align-items:center;justify-content:space-between;background:${T.ice};border:1px solid ${T.border2};border-radius:5px;padding:8px 12px;margin-top:4px;}
.ms-sel-name{font-size:13px;font-weight:600;color:${T.deep};}
.ms-sel-email{font-size:11px;color:${T.muted};font-family:'Inter',sans-serif;}
.ms-clear{background:none;border:none;cursor:pointer;color:${T.muted2};font-size:15px;padding:2px;transition:color 0.15s;}
.ms-clear:hover{color:#B91C1C;}
.ck-row{display:flex;align-items:flex-start;gap:10px;}
.ck-row input[type="checkbox"]{width:16px;height:16px;margin-top:2px;flex-shrink:0;accent-color:${T.blue};cursor:pointer;}
.ck-label{font-size:13px;line-height:1.5;color:${T.body};}
.ck-label a{color:${T.blue};text-decoration:none;}
.ck-label a:hover{text-decoration:underline;}
.modal-footer{padding:16px 28px 22px;border-top:1px solid ${T.border};display:flex;align-items:center;justify-content:space-between;gap:12px;}
.submit-btn{background:${T.yellow};color:${T.deep};border:none;padding:11px 28px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;border-radius:5px;cursor:pointer;box-shadow:0 2px 8px rgba(255,194,32,0.3);transition:all 0.18s;display:flex;align-items:center;gap:8px;}
.submit-btn:hover{background:#FFD050;transform:translateY(-1px);}
.submit-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;box-shadow:none;}
.cancel-btn{background:none;border:none;color:${T.muted};font-size:13px;cursor:pointer;transition:color 0.15s;}
.cancel-btn:hover{color:${T.deep};}
.success-wrap{text-align:center;padding:48px 32px;}
.success-icon{font-size:40px;margin-bottom:14px;}
.success-title{font-size:20px;font-weight:800;margin-bottom:8px;color:${T.deep};}
.success-sub{font-size:13px;color:${T.muted};line-height:1.6;max-width:380px;margin:0 auto 24px;}
.ferr{font-size:12px;color:#B91C1C;margin-top:5px;}
.submit-err{background:#FEE2E2;border:1px solid rgba(185,28,28,0.25);border-radius:5px;padding:9px 12px;font-size:13px;color:#B91C1C;margin-bottom:14px;}
.opt-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.opt-card{background:${T.white};border:1px solid ${T.border};border-radius:10px;padding:24px 18px;cursor:pointer;transition:all 0.18s;display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden;}
.opt-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${T.deep},${T.blue});opacity:0;transition:opacity 0.18s;}
.opt-card:hover{border-color:${T.border2};box-shadow:${T.shadowM};}
.opt-card:hover::before{opacity:1;}
.opt-card-dis{opacity:0.4;cursor:not-allowed;pointer-events:none;}
.opt-card-icon{margin-bottom:4px;display:flex;}
.opt-card-title{font-size:14px;font-weight:800;color:${T.deep};}
.opt-card-desc{font-size:12px;color:${T.muted};line-height:1.6;flex:1;}
.opt-card-cta{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:${T.blue};}
.opt-card-soon{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:${T.muted2};padding:3px 8px;background:${T.cloud};border:1px solid ${T.border};border-radius:3px;display:inline-block;}
.hint-toggle{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:${T.blue};cursor:pointer;background:none;border:none;padding:0;display:flex;align-items:center;gap:5px;margin-bottom:8px;}
.hint-box{background:${T.ice};border:1px solid ${T.border2};border-radius:5px;padding:10px 14px;font-size:12px;color:${T.muted};line-height:1.7;margin-bottom:4px;}

/* ── SHARED ── */
.live-dot{display:inline-block;width:6px;height:6px;background:#22C55E;border-radius:50%;animation:pulse 2s infinite;margin-right:5px;vertical-align:middle;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(11,44,95,0.25);border-top-color:${T.deep};border-radius:50%;animation:spin .7s linear infinite;}

/* ── MOBILE ── */
@media(max-width:900px){
  .rule-cards,.tool-cards{grid-template-columns:1fr 1fr;}
  .help-cards{grid-template-columns:1fr;}
  .ws-feature-grid{grid-template-columns:repeat(2,1fr);}
}
@media(max-width:680px){
  .nav{padding:0 16px;}
  .nav-links{display:none;}
  .nav-countdown{display:none;}
  .hero{padding:32px 16px 40px;}
  .hero-orbital{display:none;}
  .hero-inner{gap:0;}
  .sec-wrap{padding:40px 20px;}
  .stat-bar-inner{grid-template-columns:repeat(3,1fr);}
  .phase-section{padding:16px 16px 12px;}
  .rule-cards,.tool-cards,.help-cards{grid-template-columns:1fr;}
  .judge-grid{grid-template-columns:1fr;}
  .reg-cols{grid-template-columns:1fr;}
  .ws-feature-grid{grid-template-columns:repeat(2,1fr);}
  .opt-cards{grid-template-columns:1fr;}
  .fr-2{grid-template-columns:1fr;}
  .site-footer{padding:20px 16px;}
  .site-footer-top{flex-direction:column;gap:14px;align-items:flex-start;}
  .site-footer-links{flex-wrap:wrap;gap:12px;}
}
`;

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
                <div>
                    <div className="ms-sel-name">{selected.name}</div>
                    <div className="ms-sel-email">{selected.email}</div>
                </div>
                <button className="ms-clear" onClick={() => onSelect(null)}>✕</button>
            </div>
        </div>
    );

    return (
        <div className="fr">
            <label className="form-label">{label}{!optional && <span className="req">*</span>}</label>
            {label.includes('Captain') && <div className="fh">Primary contact — submits the final project.</div>}
            {optional && <div className="fh">Optional — teams can have 3–5 members total.</div>}
            <div className="ms-wrap">
                <input className="fi" placeholder="Search by name or email…"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 200)} />
                {open && filtered.length > 0 && (
                    <div className="ms-results">
                        {filtered.map(r => {
                            const name  = nameField  ? r.getCellValueAsString(nameField).trim()  : '';
                            const email = emailField ? r.getCellValueAsString(emailField).trim() : '';
                            return (
                                <div key={r.id} className="ms-item"
                                    onMouseDown={() => { onSelect({ id: r.id, name, email }); setQuery(''); setOpen(false); }}>
                                    <div className="ms-name">{name}</div>
                                    <div className="ms-email">{email}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── CREATE RECORD (RETRY ON CONFLICT) ────────────────────────────────────────
async function createRecordWithRetry(table, fields, attempts = 3) {
    let lastErr = null;
    for (let i = 0; i < attempts; i++) {
        try {
            return await table.createRecordAsync(fields);
        } catch (err) {
            lastErr = err;
            const msg = (err?.message ?? '').toLowerCase();
            const isConflict = msg.includes('conflict') || msg.includes('conflicted with another change');
            if (!isConflict) throw err;
            await new Promise(r => setTimeout(r, 200 * Math.pow(2, i)));
        }
    }
    throw lastErr;
}

// ─── REGISTRATION MODAL ───────────────────────────────────────────────────────
function RegistrationModal({ onClose, onRegister, submissionsTable, dirRecords, dirNameField, dirEmailField, initialScreen = 0 }) {
    // screen: 0 = choice, 'team' = team form, 'agent' = free agent form
    const [screen,        setScreen]       = useState(() => initialScreen === 'freeagent' ? 'agent' : initialScreen);

    // ── Team form state ──
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

    // ── Free agent state ──
    const [agentSelf,     setAgentSelf]    = useState(null);
    const [agentInterest, setAgentInterest]= useState('');
    const [agentTool,     setAgentTool]    = useState('');
    const [agentSkill,    setAgentSkill]   = useState('');
    const [agentAttend,   setAgentAttend]  = useState('');
    const [agentAgreed,   setAgentAgreed]  = useState(false);

    // ── Shared ──
    const [submitting,    setSubmitting]   = useState(false);
    const [success,       setSuccess]      = useState(false);
    const [submitError,   setSubmitError]  = useState('');
    const [errors,        setErrors]       = useState({});

    const validateTeam = () => {
        const e = {};
        if (!teamName.trim())  e.teamName    = 'Team name is required.';
        if (!useCase.trim())   e.useCase     = 'Please describe your use case.';
        if (!technology)       e.technology  = 'Select a technology.';
        if (technology === 'Other' && !otherTech.trim()) e.otherTech = 'Please specify.';
        if (!attendance)       e.attendance  = 'Select an attendance format.';
        if (!captain)          e.captain     = 'Team Captain is required.';
        const memberCount = [captain, member2, member3, member4, member5].filter(Boolean).length;
        if (memberCount < 3)   e.members     = 'Teams require at least 3 members (captain + 2). You can add more later.';
        if (!agreed)           e.agreed      = 'You must agree to the rules to register.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateAgent = () => {
        const e = {};
        if (!agentSelf)        e.agentSelf   = 'Please search and select yourself from the directory.';
        if (!agentTool)        e.agentTool   = 'Select a preferred tool.';
        if (!agentSkill)       e.agentSkill  = 'Select your skill level.';
        if (!agentAttend)      e.agentAttend = 'Select an attendance format.';
        if (!agentAgreed)      e.agentAgreed = 'You must agree to the rules.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleTeamSubmit = async () => {
        if (!validateTeam()) return;
        setSubmitting(true); setSubmitError('');
        try {
            const fields = {};
            try { const f = submissionsTable.getFieldIfExists('Team Name');          if (f) fields[f.id] = teamName.trim(); } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Use Case');           if (f) fields[f.id] = useCase.trim(); } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Technology');         if (f) fields[f.id] = { name: technology }; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Other Technology');   if (f && technology === 'Other') fields[f.id] = otherTech.trim(); } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Attendance Format');  if (f) fields[f.id] = { name: attendance }; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Submission Status');  if (f) fields[f.id] = { name: 'Registered' }; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member #1 (Captain)'); if (f && captain) fields[f.id] = [{ id: captain.id }]; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member #2');    if (f && member2) fields[f.id] = [{ id: member2.id }]; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member #3');    if (f && member3) fields[f.id] = [{ id: member3.id }]; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member #4');    if (f && member4) fields[f.id] = [{ id: member4.id }]; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member #5');    if (f && member5) fields[f.id] = [{ id: member5.id }]; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Rules Agreement Checkbox'); if (f) fields[f.id] = true; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Link To Hackathon Rules & Guidelines'); if (f) fields[f.id] = RULES_URL; } catch (e_) { /* skip */ }

            await createRecordWithRetry(submissionsTable, fields, 3);
            if (onRegister) onRegister();
            setSuccess(true);
        } catch (err) {
            const msg = err?.message ?? '';
            const isPerms = msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('not authorized') || msg.toLowerCase().includes('read only');
            setSubmitError(isPerms ? '__EXTERNAL__' : msg || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAgentSubmit = async () => {
        if (!validateAgent()) return;
        setSubmitting(true); setSubmitError('');
        try {
            const fields = {};
            try { const f = submissionsTable.getFieldIfExists('Team Name');          if (f) fields[f.id] = 'Free Agent Pool'; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Submission Status');  if (f) fields[f.id] = { name: 'Registered' }; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Technology');         if (f && agentTool) fields[f.id] = { name: agentTool }; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Attendance Format');  if (f) fields[f.id] = { name: agentAttend }; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member #1 (Captain)'); if (f && agentSelf) fields[f.id] = [{ id: agentSelf.id }]; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Rules Agreement Checkbox'); if (f) fields[f.id] = true; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Use Case');           if (f && agentInterest) fields[f.id] = agentInterest; } catch (e_) { /* skip */ }

            await createRecordWithRetry(submissionsTable, fields, 3);
            if (onRegister) onRegister();
            setSuccess(true);
        } catch (err) {
            const msg = err?.message ?? '';
            const isPerms = msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('not authorized') || msg.toLowerCase().includes('read only');
            setSubmitError(isPerms ? '__EXTERNAL__' : msg || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        const isAgent = screen === 'agent';
        return (
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="modal">
                    <div className="success-wrap">
                        <div className="success-icon">{isAgent ? '✋' : '🎉'}</div>
                        <div className="success-title">{isAgent ? "You're in the pool!" : 'Your team is registered!'}</div>
                        <div className="success-sub">
                            {isAgent
                                ? 'The hackathon team will reach out to match you with a team based on your skills and interests.'
                                : <><strong>Teammates will receive an invitation to confirm.</strong> Your team won't be locked in until all members accept.</>
                            }
                        </div>
                        <button className="btn-primary" onClick={onClose}>Back to Portal</button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Screen 0: Participation selector ─────────────────────────────────────
    if (screen === 0) {
        return (
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="modal">
                    <div className="modal-header">
                        <div>
                            <div className="modal-title">How do you want to participate?</div>
                            <div className="modal-subtitle">2026 GG AI Hackathon</div>
                        </div>
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>
                    <div className="modal-body">
                        <div className="opt-cards">
                            <div className="opt-card" onClick={() => setScreen('team')}>
                                <div className="opt-card-icon"><UsersThreeIcon size={28} color={T.blue} weight="duotone" /></div>
                                <div className="opt-card-title">Form a Team</div>
                                <div className="opt-card-desc">Register your team of 3–5. You lead the build and submit at the end.</div>
                                <div className="opt-card-cta">Get Started →</div>
                            </div>
                            <div className="opt-card" onClick={() => setScreen('agent')}>
                                <div className="opt-card-icon"><HandWavingIcon size={28} color={T.blue} weight="duotone" /></div>
                                <div className="opt-card-title">Join as Free Agent</div>
                                <div className="opt-card-desc">No team yet? We'll match you based on your skills and problem interest.</div>
                                <div className="opt-card-cta">Sign Up →</div>
                            </div>
                            <div className="opt-card opt-card-dis">
                                <div className="opt-card-icon"><MagnifyingGlassIcon size={28} color={T.muted2} weight="duotone" /></div>
                                <div className="opt-card-title">Find a Team</div>
                                <div className="opt-card-desc">Browse teams actively looking for members to join.</div>
                                <div className="opt-card-soon">Coming Soon</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Screen 1b: Free Agent form ────────────────────────────────────────────
    if (screen === 'agent') {
        return (
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="modal">
                    <div className="modal-header">
                        <div>
                            <button className="modal-back" onClick={() => setScreen(0)}>← Back</button>
                            <div className="modal-title" style={{ marginTop: 6 }}>Join as Free Agent</div>
                            <div className="modal-subtitle">2026 GG AI Hackathon</div>
                        </div>
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>
                    <div className="modal-body">
                        <MemberSearch label="Find Yourself" dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={agentSelf} onSelect={setAgentSelf} />
                        {errors.agentSelf && <div className="ferr" style={{ marginTop: -8, marginBottom: 10 }}>{errors.agentSelf}</div>}

                        <div className="fr">
                            <label className="form-label">Problem Space Interest</label>
                            <div className="fh">What kind of problem do you want to work on?</div>
                            <textarea className="fi" placeholder="e.g. Compliance automation, workforce tools, supply chain risk…" value={agentInterest} onChange={e => setAgentInterest(e.target.value)} />
                        </div>

                        <div className="fr-2">
                            <div>
                                <label className="form-label">Preferred Tool<span className="req">*</span></label>
                                <div className="radio-group" style={{ marginTop: 7 }}>
                                    {TECH_OPTIONS.map(t => (
                                        <div className="rp" key={t}>
                                            <input type="radio" id={`agt-${t}`} name="agentTool" value={t} checked={agentTool === t} onChange={() => setAgentTool(t)} />
                                            <label htmlFor={`agt-${t}`}>{t}</label>
                                        </div>
                                    ))}
                                </div>
                                {errors.agentTool && <div className="ferr">{errors.agentTool}</div>}
                            </div>
                            <div>
                                <label className="form-label">Attendance<span className="req">*</span></label>
                                <div className="radio-group" style={{ marginTop: 7 }}>
                                    {ATTENDANCE_OPTIONS.map(a => (
                                        <div className="rp" key={a}>
                                            <input type="radio" id={`aga-${a}`} name="agentAttend" value={a} checked={agentAttend === a} onChange={() => setAgentAttend(a)} />
                                            <label htmlFor={`aga-${a}`}>{a}</label>
                                        </div>
                                    ))}
                                </div>
                                {errors.agentAttend && <div className="ferr">{errors.agentAttend}</div>}
                            </div>
                        </div>

                        <div className="fr">
                            <label className="form-label">AI Skill Level<span className="req">*</span></label>
                            <div className="fh">1 = Never used it · 5 = Power user</div>
                            <div className="radio-group">
                                {['1','2','3','4','5'].map(n => (
                                    <div className="rp" key={n}>
                                        <input type="radio" id={`agsk-${n}`} name="agentSkill" value={n} checked={agentSkill === n} onChange={() => setAgentSkill(n)} />
                                        <label htmlFor={`agsk-${n}`}>{n}</label>
                                    </div>
                                ))}
                            </div>
                            {errors.agentSkill && <div className="ferr">{errors.agentSkill}</div>}
                        </div>

                        <div className="fr">
                            <div className="ck-row">
                                <input type="checkbox" id="agAgreed" checked={agentAgreed} onChange={e => setAgentAgreed(e.target.checked)} />
                                <label className="ck-label" htmlFor="agAgreed">
                                    I have read the <a href={RULES_URL} target="_blank" rel="noreferrer">hackathon rules & guidelines</a> and agree to follow them.
                                </label>
                            </div>
                            {errors.agentAgreed && <div className="ferr">{errors.agentAgreed}</div>}
                        </div>

                        {submitError && submitError !== '__EXTERNAL__' && <div className="submit-err">{submitError}</div>}
                        {submitError === '__EXTERNAL__' && (
                            <div className="submit-err">
                                This interface doesn't have write access. Please use the{' '}
                                <a href={EXTERNAL_FORM_URL} target="_blank" rel="noreferrer" style={{ color: '#B91C1C', fontWeight: 700 }}>registration form</a> instead.
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button className="submit-btn" disabled={submitting} onClick={handleAgentSubmit}>
                            {submitting ? <><span className="spinner" /> Submitting…</> : '✓ Join Free Agent Pool'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Screen 1a: Team Registration ──────────────────────────────────────────
    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-header">
                    <div>
                        <button className="modal-back" onClick={() => setScreen(0)}>← Back</button>
                        <div className="modal-title" style={{ marginTop: 6 }}>Register Your Team</div>
                        <div className="modal-subtitle">2026 GG AI Hackathon · Spots limited to first {MAX_TEAMS} teams</div>
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="fs">
                        <div className="fs-title">Your Project</div>
                        <div className="fr">
                            <label className="form-label">Team Name<span className="req">*</span></label>
                            <div className="fh">Spots are limited to the first {MAX_TEAMS} teams.</div>
                            <input className="fi" placeholder="e.g. The Compliance Crushers" value={teamName} onChange={e => setTeamName(e.target.value)} />
                            {errors.teamName && <div className="ferr">{errors.teamName}</div>}
                            <button className="hint-toggle" style={{ marginTop: 10 }} onClick={() => setShowHint(h => !h)}>
                                {showHint ? '▾' : '▸'} Recommended Team Structure
                            </button>
                            {showHint && <div className="hint-box">One person on business case · one on the tech build · one on UX/presentation.</div>}
                        </div>
                        <div className="fr">
                            <label className="form-label">Use Case<span className="req">*</span></label>
                            <div className="fh">Briefly describe the problem you plan to solve. You can refine this later.</div>
                            <textarea className="fi" placeholder="We plan to build an AI agent that…" value={useCase} onChange={e => setUseCase(e.target.value)} />
                            {errors.useCase && <div className="ferr">{errors.useCase}</div>}
                        </div>
                        <div className="fr-2">
                            <div>
                                <label className="form-label">Technology<span className="req">*</span></label>
                                <div className="fh">Free training available for all three.</div>
                                <div className="radio-group">
                                    {TECH_OPTIONS.map(t => (
                                        <div className="rp" key={t}>
                                            <input type="radio" id={`tech-${t}`} name="technology" value={t} checked={technology === t} onChange={() => setTechnology(t)} />
                                            <label htmlFor={`tech-${t}`}>{t}</label>
                                        </div>
                                    ))}
                                </div>
                                {errors.technology && <div className="ferr">{errors.technology}</div>}
                                {technology === 'Other' && (
                                    <div style={{ marginTop: 10 }}>
                                        <input className="fi" placeholder="Specify technology…" value={otherTech} onChange={e => setOtherTech(e.target.value)} />
                                        {errors.otherTech && <div className="ferr">{errors.otherTech}</div>}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="form-label">Attendance<span className="req">*</span></label>
                                <div className="fh">How will your team participate?</div>
                                <div className="radio-group">
                                    {ATTENDANCE_OPTIONS.map(a => (
                                        <div className="rp" key={a}>
                                            <input type="radio" id={`att-${a}`} name="attendance" value={a} checked={attendance === a} onChange={() => setAttendance(a)} />
                                            <label htmlFor={`att-${a}`}>{a}</label>
                                        </div>
                                    ))}
                                </div>
                                {errors.attendance && <div className="ferr">{errors.attendance}</div>}
                            </div>
                        </div>
                        <div className="fr">
                            <label className="form-label">AI Skill Level</label>
                            <div className="fh">1 = Never used it · 5 = Power user</div>
                            <div className="radio-group">
                                {['1','2','3','4','5'].map(n => (
                                    <div className="rp" key={n}>
                                        <input type="radio" id={`sk-${n}`} name="skillLevel" value={n} checked={skillLevel === n} onChange={() => setSkillLevel(n)} />
                                        <label htmlFor={`sk-${n}`}>{n}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="fs">
                        <div className="fs-title">Your Team</div>
                        <div className="fh" style={{ marginBottom: 14 }}>Teams of 3–5. You can add members later.</div>
                        <MemberSearch label="Team Captain" dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={captain} onSelect={setCaptain} />
                        {errors.captain && <div className="ferr" style={{ marginTop: -8, marginBottom: 10 }}>{errors.captain}</div>}
                        <MemberSearch label="Member 2" optional dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={member2} onSelect={setMember2} />
                        <MemberSearch label="Member 3" optional dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={member3} onSelect={setMember3} />
                        <MemberSearch label="Member 4" optional dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={member4} onSelect={setMember4} />
                        <MemberSearch label="Member 5" optional dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={member5} onSelect={setMember5} />
                        {errors.members && <div className="ferr">{errors.members}</div>}
                    </div>

                    <div className="fr">
                        <div className="ck-row">
                            <input type="checkbox" id="agreed" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                            <label className="ck-label" htmlFor="agreed">
                                I have read the <a href={RULES_URL} target="_blank" rel="noreferrer">hackathon rules & guidelines</a> and agree that my team will follow them.
                            </label>
                        </div>
                        {errors.agreed && <div className="ferr">{errors.agreed}</div>}
                    </div>

                    {submitError && submitError !== '__EXTERNAL__' && <div className="submit-err">{submitError}</div>}
                    {submitError === '__EXTERNAL__' && (
                        <div className="submit-err">
                            This interface doesn't have write access. Please use the{' '}
                            <a href={EXTERNAL_FORM_URL} target="_blank" rel="noreferrer" style={{ color: '#B91C1C', fontWeight: 700 }}>registration form</a> instead.
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="submit-btn" disabled={submitting} onClick={handleTeamSubmit}>
                        {submitting ? <><span className="spinner" /> Registering…</> : '✓ Register Team'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const WORKSPACE_TILES = [
    { Icon: CalendarBlankIcon, label: 'Training Calendar',    desc: 'All office hours, sessions, and deadlines in one place.'               },
    { Icon: FolderSimpleIcon,  label: 'Resource Library',     desc: 'Rules, templates, data sets, and tool guides.'                         },
    { Icon: ChatCircleIcon,    label: 'Team Announcements',   desc: 'Push notifications from the hackathon team directly to your workspace.' },
    { Icon: CheckSquareIcon,   label: 'Submission Checklist', desc: 'Track your deliverables and submit your final project.'                 },
    { Icon: NotePencilIcon,    label: 'Team Notes',           desc: 'Shared scratchpad for your team during the build window.'              },
    { Icon: UserCircleIcon,    label: 'Mentor Access',        desc: "Your assigned mentor's contact info and office hours."                 },
];

const FAQS = [
    { q: 'Can I use more than one tool?',                               a: 'Yes, if your use case calls for it. Just note one primary tool on your registration.' },
    { q: "What if a teammate can't participate?",                       a: 'Submit a team change request via the #gg-hackathon Teams channel. Changes must be finalized before March 14.' },
    { q: 'Do we need to have a problem statement picked before registering?', a: 'No. You can refine your use case after registration. Use the Problem Statements section in the main portal for inspiration.' },
    { q: 'When does the build window start?',                           a: 'Monday March 16. No building before then — but you can plan, research tools, and attend training.' },
    { q: 'Who judges the submissions?',                                 a: 'A panel of GG leadership and invited executives. Top 5 teams present at the Science Fair on March 20.' },
];

const NAV_SECTIONS = [
    ['rules',     'Rules'    ],
    ['tools',     'Tools'    ],
    ['resources', 'Resources'],
    ['register',  'Register' ],
    ['workspace', 'Workspace'],
    ['help',      'Help'     ],
];

// ─── RULES MODAL ──────────────────────────────────────────────────────────────
function parseRuleSections(text) {
    if (!text) return [];
    // Split on double newlines; treat short lines (≤60 chars, no trailing period) as headers
    const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
    const sections = [];
    let current = null;
    blocks.forEach(block => {
        const firstLine = block.split('\n')[0].trim();
        const isHeader = firstLine.length <= 70 && !firstLine.endsWith('.') && !firstLine.endsWith(',');
        const rest = block.split('\n').slice(1).join('\n').trim();
        if (isHeader && rest) {
            // Header line + body below it in same block
            if (current) sections.push(current);
            current = { header: firstLine.replace(/^[*#\s]+|[*#\s]+$/g, ''), body: rest };
        } else if (isHeader && !rest) {
            // Standalone header line — next block will be its body
            if (current) sections.push(current);
            current = { header: firstLine.replace(/^[*#\s]+|[*#\s]+$/g, ''), body: '' };
        } else {
            // Body block
            if (current) { current.body += (current.body ? '\n\n' : '') + block; }
            else { sections.push({ header: '', body: block }); }
        }
    });
    if (current) sections.push(current);
    return sections;
}

function RulesModal({ categorized, fallback, onClose }) {
    const sections = parseRuleSections(categorized);
    const useSections = sections.length > 1;
    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal modal-xl">
                <div className="modal-header">
                    <div style={{ flex: 1 }}>
                        <div className="modal-title">Official Rules & Guidelines</div>
                        <div className="modal-subtitle">FY27 GG AI Hackathon · Read before registering</div>
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {useSections ? sections.map((s, i) => (
                        <div key={i} className="rules-section">
                            {s.header && <div className="rules-section-header">{s.header}</div>}
                            {s.body && <div className="rules-section-body">{s.body}</div>}
                        </div>
                    )) : (
                        <div className="rules-raw-body">{categorized || fallback}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
function App() {
    const base = useBase();

    // ── Tables ──────────────────────────────────────────────────────────────
    const subTable  = base.getTableByNameIfExists('Hackathon Submissions') ?? base.tables[0];
    const probTable = base.getTableByNameIfExists('Problem Statements')    ?? base.tables[0];
    const dirTable  = base.getTableByNameIfExists('WM Directory')          ?? base.tables[0];
    const prmTable  = base.getTableByNameIfExists('Sample Prompts')        ?? base.tables[0];
    const regTable  = base.getTableByNameIfExists('Regulatory Documents')  ?? base.tables[0];
    const docTable  = base.getTableByNameIfExists('Hackathon Documents')   ?? null;

    // ── Records ─────────────────────────────────────────────────────────────
    const submissions = useRecords(subTable);
    const probRecords = useRecords(probTable);
    const dirRecords  = useRecords(dirTable);
    const prmRecords  = useRecords(prmTable);
    const regDocs     = useRecords(regTable);
    const hackDocs    = useRecords(docTable ?? subTable);  // fallback avoids null crash

    // ── UI State ─────────────────────────────────────────────────────────────
    const [showReg,         setShowReg]        = useState(false);
    const [modalInitScreen, setModalInitScreen]= useState(0);
    const [showRulesModal,  setShowRulesModal] = useState(false);
    const [activeSection,   setActiveSection]  = useState('hero');
    const [openFaq,         setOpenFaq]        = useState(null);
    const [showRubric,      setShowRubric]     = useState(false);
    const [countdown,       setCountdown]      = useState(getCountdown);

    useEffect(() => {
        const id = setInterval(() => setCountdown(getCountdown()), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const ids = ['hero', 'rules', 'tools', 'resources', 'register', 'workspace', 'help'];
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
        }, { threshold: 0.25, rootMargin: '-70px 0px -40% 0px' });
        ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
        return () => obs.disconnect();
    }, []);

    // ── Field detection: submissions ─────────────────────────────────────────
    const sfTeamName     = subTable.getFieldIfExists('Team Name');
    const sfStatus       = subTable.getFieldIfExists('Submission Status');

    // ── Field detection: hackathon docs ─────────────────────────────────────
    const dfDocName        = docTable ? docTable.getFieldIfExists('Name')               : null;
    const dfDocSummary     = docTable ? docTable.getFieldIfExists('Attachment Summary') : null;
    const dfDocDetails     = docTable ? docTable.getFieldIfExists('Documented Details') : null;
    const dfDocCategorized = docTable ? docTable.getFieldIfExists('Categorized Rules')  : null;
    const hackDocList      = docTable ? hackDocs : [];

    const { officialRulesText, officialRulesCategorized } = useMemo(() => {
        if (!dfDocName) return { officialRulesText: '', officialRulesCategorized: '' };
        const rec = hackDocList.find(r => r.getCellValueAsString(dfDocName).trim() === 'Official Rules');
        if (!rec) return { officialRulesText: '', officialRulesCategorized: '' };
        return {
            officialRulesText:        dfDocDetails     ? rec.getCellValueAsString(dfDocDetails)     : '',
            officialRulesCategorized: dfDocCategorized ? rec.getCellValueAsString(dfDocCategorized) : '',
        };
    }, [hackDocList, dfDocName, dfDocDetails, dfDocCategorized]);

    // ── Field detection: directory ───────────────────────────────────────────
    const dfName  = dirTable.getFieldIfExists('Full Name');
    const dfEmail = dirTable.getFieldIfExists('Work Email');

    // ── Derived data ─────────────────────────────────────────────────────────
    const { liveTeams } = useMemo(() => {
        const live = [];
        submissions.forEach(r => {
            const name   = sfTeamName ? r.getCellValueAsString(sfTeamName) : '';
            const status = sfStatus   ? r.getCellValueAsString(sfStatus)   : '';
            if (TEST_NAMES.includes(name.trim())) return;
            if (status !== 'Free Agent') live.push(r);
        });
        return { liveTeams: live };
    }, [submissions, sfTeamName, sfStatus]);

    const totalTeams      = liveTeams.length;
    const submittedTeams  = liveTeams.filter(r => sfStatus && r.getCellValueAsString(sfStatus) === 'Submitted').length;
    const registeredTeams = liveTeams.filter(r => sfStatus && r.getCellValueAsString(sfStatus) === 'Registered').length;
    const spotsLeft       = Math.max(0, MAX_TEAMS - totalTeams);

    const openModal = (screen = 0) => { setModalInitScreen(screen); setShowReg(true); };

    return (
        <div className="portal">
            <style>{css}</style>

            {/* ── STICKY NAV ── */}
            <nav className="nav">
                <div className="nav-brand">
                    <div className="nav-spark"><SparkIcon size={16} /></div>
                    FY27 GG AI Hackathon
                </div>
                <div className="nav-links">
                    {NAV_SECTIONS.map(([id, label]) => (
                        <a key={id} href={`#${id}`} className={`nav-link${activeSection === id ? ' active' : ''}`}>{label}</a>
                    ))}
                </div>
                <div className="nav-right">
                    <span className="nav-countdown">Closes {countdown}</span>
                    <button className="nav-cta" onClick={() => openModal(0)}>Register Now →</button>
                </div>
            </nav>

            {/* ── SECTION 1: HERO ── */}
            <section id="hero" className="hero">
                <div className="hero-inner">
                    <div className="hero-left">
                        <div className="hero-phases">
                            {PHASES.map(p => (
                                <div key={p.label} className="hero-phase-node">
                                    <div className={`phase-pill ${p.active ? 'phase-pill-active' : 'phase-pill-inactive'}`}>{p.label}</div>
                                    <div className="hero-phase-sub">{p.sub}</div>
                                </div>
                            ))}
                        </div>
                        <h1>FY27 GG<br /><span className="accent">AI Hackathon</span></h1>
                        <div className="hero-byline">Build something that matters. Win something that counts.</div>
                        <div className="hero-sub">
                            48 hours. Real data. Real problems. Use Airtable, Harvey, or CodePuppy to build an AI-powered solution for Walmart's Global Governance team — then pitch it.
                        </div>
                        <div className="hero-actions">
                            <button className="btn-primary" onClick={() => openModal(0)}>
                                <SparkIcon size={15} color="#0B2C5F" />
                                Register Your Team →
                            </button>
                            <a className="btn-outline" href={RULES_URL} target="_blank" rel="noreferrer">
                                Read the Rules ↗
                            </a>
                        </div>
                    </div>
                    <div className="hero-orbital">
                        <div className="orb-ring orb-r1" />
                        <div className="orb-ring orb-r2" />
                        <div className="orb-ring orb-r3" />
                        <div className="orb-track orb-t1"><div className="orb-dot" /></div>
                        <div className="orb-track orb-t2"><div className="orb-dot" /></div>
                        <div className="orb-core"><SparkIcon size={28} /></div>
                    </div>
                </div>
            </section>

            {/* ── STAT BAR ── */}
            <div className="stat-bar">
                <div className="stat-bar-inner">
                    <div className="stat-item">
                        <div className="stat-num">{totalTeams}</div>
                        <div className="stat-label">Teams Registered</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-num">{submittedTeams}</div>
                        <div className="stat-label">Submitted</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-num">{registeredTeams}</div>
                        <div className="stat-label">Registered</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-num">{probRecords.length || 12}</div>
                        <div className="stat-label">Problem Tracks</div>
                    </div>
                    <div className="stat-item">
                        <div className={`stat-num${spotsLeft <= 10 ? ' stat-num-red' : ''}`}>{spotsLeft}</div>
                        <div className="stat-label">Spots Left</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-num-sm">{countdown}</div>
                        <div className="stat-label">Registration Closes</div>
                    </div>
                </div>
            </div>


            {/* ── SECTION 2: RULES & GUIDELINES ── */}
            <section id="rules" className="sec-white">
                <div className="sec-wrap">
                    <span className="sec-label">Rules</span>
                    <h2 className="sec-h2">Rules & Guidelines</h2>
                    <p className="sec-sub">Everything you need to know before you build. Read this before registering.</p>

                    <div className="official-rules-card">
                        <div className="official-rules-card-left">
                            <div className="official-rules-card-icon">
                                <ClipboardTextIcon size={22} color={T.blue} weight="duotone" />
                            </div>
                            <div>
                                <div className="official-rules-card-title">Official Rules</div>
                                <div className="official-rules-card-sub">
                                    {officialRulesCategorized || officialRulesText ? 'Full hackathon rules & eligibility requirements' : 'Rules document not yet available'}
                                </div>
                            </div>
                        </div>
                        {(officialRulesCategorized || officialRulesText) && (
                            <button className="rules-open-btn" onClick={() => setShowRulesModal(true)}>
                                <ClipboardTextIcon size={13} /> Open Rules
                            </button>
                        )}
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <button className="rubric-toggle" onClick={() => setShowRubric(s => !s)}>
                            {showRubric ? '▾' : '▸'} View Scoring Rubric
                        </button>
                        {showRubric && (
                            <div className="judge-grid">
                                {JUDGING.map(j => (
                                    <div key={j.label} className="judge-card">
                                        <div className="judge-top">
                                            <div className="judge-label">{j.label}</div>
                                            <div className="judge-weight">{j.weight}</div>
                                        </div>
                                        <div className="judge-desc">{j.desc}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── SECTION 3: TOOLS & ACCESS ── */}
            <section id="tools" className="sec-cloud">
                <div className="sec-wrap">
                    <span className="sec-label">Tools</span>
                    <h2 className="sec-h2">Choose Your Stack</h2>
                    <p className="sec-sub">Free training is available for all three tools. Pick one — or combine them if your use case calls for it.</p>

                    <div className="tool-cards">
                        <div className="tool-card">
                            <div className="tool-bar" style={{ background: T.blue }} />
                            <div className="tool-inner">
                                <div className="tool-name">Airtable</div>
                                <div className="tool-tagline">Best for: Structured data, interfaces, automations</div>
                                <div className="tool-desc">Build operational interfaces, automated workflows, and dashboards. The base, views, and interface builder are your canvas.</div>
                                <div className="tool-access-block">
                                    Already provisioned for GG associates. If you don't have access, your license will be provisioned automatically when you register.
                                </div>
                                <a className="tool-link" href="https://airtable.com/academy" target="_blank" rel="noreferrer">Get Training →</a>
                            </div>
                        </div>
                        <div className="tool-card">
                            <div className="tool-bar" style={{ background: '#7C3AED' }} />
                            <div className="tool-inner">
                                <div className="tool-name">Harvey</div>
                                <div className="tool-tagline">Best for: Document AI, natural language Q&A</div>
                                <div className="tool-desc">Point Harvey at any PDF, policy doc, or regulation — ask questions, extract structured data, and draft content.</div>
                                <div className="tool-access-block">
                                    Contact Abby Worley to confirm your Harvey license before the event.
                                </div>
                                <span className="tool-link" style={{ cursor: 'default', opacity: 0.5 }}>Training available at kickoff</span>
                            </div>
                        </div>
                        <div className="tool-card">
                            <div className="tool-bar" style={{ background: '#059669' }} />
                            <div className="tool-inner">
                                <div className="tool-name">CodePuppy</div>
                                <div className="tool-tagline">Best for: Custom code, integrations, APIs</div>
                                <div className="tool-desc">Writes and runs JavaScript/Python. Connect external APIs, transform data, or build automations Airtable can't do natively.</div>
                                <div className="tool-access-block">
                                    Contact Michael [GG team] to confirm access. Note: new user provisioning is currently limited — request early.
                                </div>
                                <span className="tool-link" style={{ cursor: 'default', opacity: 0.5 }}>Training available at kickoff</span>
                            </div>
                        </div>
                    </div>

                    <div className="callout-box">
                        💡 <strong>Not sure which tool to pick?</strong> Join the weekly office hours — Thursdays 10–11am — to talk through your use case before the build window opens.
                    </div>
                </div>
            </section>

            {/* ── SECTION 4: HACKATHON RESOURCES ── */}
            <section id="resources" className="sec-white">
                <div className="sec-wrap">
                    <span className="sec-label">Resources</span>
                    <h2 className="sec-h2">Hackathon Documents</h2>
                    <p className="sec-sub">Reference materials, guides, and supporting documents for the event — AI-summarized for quick review.</p>
                    {hackDocList.length === 0 ? (
                        <div className="doc-card-empty">Documents will appear here once uploaded to the Hackathon Documents table.</div>
                    ) : (
                        <div className="doc-grid">
                            {hackDocList.map(r => {
                                const name    = dfDocName    ? r.getCellValueAsString(dfDocName)    : r.name;
                                const summary = dfDocSummary ? r.getCellValueAsString(dfDocSummary) : '';
                                const details = dfDocDetails ? r.getCellValueAsString(dfDocDetails) : '';
                                return (
                                    <div key={r.id} className="doc-card">
                                        <div className="doc-card-name">{name}</div>
                                        {summary && <div className="doc-card-summary">{summary}</div>}
                                        {!summary && details && <div className="doc-card-summary">{details}</div>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ── SECTION 5: HOW TO REGISTER ── */}
            <section id="register" className="sec-white">
                <div className="sec-wrap">
                    <span className="sec-label">Registration</span>
                    <h2 className="sec-h2">Join the Hackathon</h2>
                    <p className="sec-sub">Registration closes March 9 at 5pm CT. Spots are limited to 50 teams.</p>

                    <div className="reg-cols">
                        <div className="reg-col-card" style={{ borderTop: `3px solid ${T.blue}` }}>
                            <div className="reg-col-head">Team Registration</div>
                            <ol className="step-list">
                                {[
                                    'Team captain fills out the registration form below.',
                                    'Each teammate receives an email invitation to confirm and agree to the rules.',
                                    'Once all members accept, your team is officially registered.',
                                    "You'll receive a link to your Team Workspace.",
                                ].map((step, i) => (
                                    <li key={i} className="step-item">
                                        <div className="step-num">{i + 1}</div>
                                        <div className="step-text">{step}</div>
                                    </li>
                                ))}
                            </ol>
                            <div className="warn-note">⚠️ Minimum 3 members required. Maximum 5.</div>
                            <button className="btn-primary" onClick={() => openModal(0)}>Register Your Team →</button>
                        </div>

                        <div className="reg-col-card" style={{ borderTop: `3px solid ${T.muted2}` }}>
                            <div className="reg-col-head">No Team? No Problem.</div>
                            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, marginBottom: 16 }}>
                                Sign up as a free agent and we'll match you with a team based on your skills and interests. Matching closes March 8.
                            </p>
                            <ul className="fa-bullets">
                                <li className="fa-bullet">Tell us your preferred tool</li>
                                <li className="fa-bullet">Share your problem area of interest</li>
                                <li className="fa-bullet">Rate your AI skill level (1–5)</li>
                            </ul>
                            <button className="btn-outline-dark" onClick={() => openModal('freeagent')}>
                                Sign Up as Free Agent →
                            </button>
                        </div>
                    </div>

                    <div className="already-reg">
                        <strong style={{ color: T.deep }}>Already registered?</strong> Need to make a change to your team?{' '}
                        Email the hackathon team or find us in the <strong style={{ color: T.deep }}>#gg-hackathon</strong> Teams channel.
                    </div>
                </div>
            </section>

            {/* ── SECTION 6: TEAM WORKSPACE PREVIEW ── */}
            <section id="workspace" className="sec-dark">
                <div className="sec-wrap">
                    <span className="sec-label sec-label-dark">Workspace</span>
                    <h2 className="sec-h2 sec-h2-white">Your Team Workspace</h2>
                    <p className="sec-sub sec-sub-white">
                        Every registered team gets a private Airtable workspace — unlocked once your registration is confirmed.
                    </p>

                    <div className="ws-preview-card">
                        <div className="ws-lock-row">
                            <div className="ws-lock-icon"><LockSimpleIcon size={32} color={T.muted} weight="duotone" /></div>
                            <div className="ws-lock-label">Unlocks after registration is confirmed</div>
                        </div>
                        <div className="ws-feature-grid">
                            {WORKSPACE_TILES.map(tile => (
                                <div key={tile.label} className="ws-tile">
                                    <div className="ws-tile-icon"><tile.Icon size={22} color={T.blue} weight="duotone" /></div>
                                    <div className="ws-tile-label">{tile.label}</div>
                                    <div className="ws-tile-desc">{tile.desc}</div>
                                </div>
                            ))}
                        </div>
                        <div className="ws-note">
                            This page will be a separate interface in the same Airtable app — you'll receive the link once your team is confirmed.
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SECTION 7: HELP & SUPPORT ── */}
            <section id="help" className="sec-cloud">
                <div className="sec-wrap">
                    <span className="sec-label">Support</span>
                    <h2 className="sec-h2">We've Got You Covered</h2>
                    <p className="sec-sub">Multiple support channels available before and during the event.</p>

                    <div className="help-cards">
                        {/* Card 1: FAQs */}
                        <div className="help-card">
                            <div className="help-card-icon"><QuestionIcon size={28} color={T.blue} weight="duotone" /></div>
                            <div className="help-card-title">Frequently Asked Questions</div>
                            <div className="faq-list">
                                {FAQS.map((item, i) => (
                                    <div key={i} className="faq-item">
                                        <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                            <span>{item.q}</span>
                                            <span className={`faq-chevron${openFaq === i ? ' open' : ''}`}>▸</span>
                                        </button>
                                        <div className={`faq-a${openFaq === i ? ' open' : ''}`}>{item.a}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Card 2: Associate Support */}
                        <div className="help-card">
                            <div className="help-card-icon"><HeadsetIcon size={28} color={T.blue} weight="duotone" /></div>
                            <div className="help-card-title">Associate Support</div>
                            <div className="contact-blocks">
                                <div className="contact-block">
                                    <div className="contact-topic">Airtable Questions</div>
                                    <div className="contact-name">Bennett Oliver</div>
                                    <div className="contact-role">Account Executive</div>
                                    <div className="contact-note">Office hours: Thursdays 10–11am CT</div>
                                </div>
                                <div className="contact-block">
                                    <div className="contact-topic">Harvey Questions</div>
                                    <div className="contact-name">Abby Worley</div>
                                    <div className="contact-role">GG Digital Acceleration</div>
                                </div>
                                <div className="contact-block">
                                    <div className="contact-topic">CodePuppy Questions</div>
                                    <div className="contact-name">Michael [GG team]</div>
                                    <div className="contact-role">GG Digital Acceleration</div>
                                </div>
                            </div>
                            <div className="help-footer-note">For anything else → <strong>#gg-hackathon</strong> in Teams</div>
                        </div>

                        {/* Card 3: Mentor Program */}
                        <div className="help-card">
                            <div className="help-card-icon"><ChalkboardTeacherIcon size={28} color={T.blue} weight="duotone" /></div>
                            <div className="help-card-title">Mentor Program</div>
                            <div className="mentor-body">
                                Every registered team is assigned one internal mentor with relevant domain or technical expertise.
                            </div>
                            <ul className="mentor-bullets">
                                <li className="mentor-bullet">1 mentor per team (subject to team count)</li>
                                <li className="mentor-bullet">Available during the build window March 16–19</li>
                                <li className="mentor-bullet">Matched based on your tool choice and problem area</li>
                            </ul>
                            <div className="mentor-note">
                                Vendor support (Airtable, Harvey, CodePuppy) is available in addition to your mentor.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="site-footer">
                <div className="site-footer-top">
                    <div className="site-footer-brand">
                        <div className="nav-spark"><SparkIcon size={14} /></div>
                        <span className="site-footer-brand-text">GG Digital Acceleration · AI Hackathon 2026</span>
                    </div>
                    <div className="site-footer-links">
                        <button className="site-footer-link-cta" onClick={() => openModal(0)}>Register →</button>
                        <a className="site-footer-link" href={RULES_URL} target="_blank" rel="noreferrer">Rules ↗</a>
                        <span className="site-footer-link">#gg-hackathon</span>
                    </div>
                </div>
                <div className="site-footer-bottom">
                    50-team limit · Registration closes March 9 · Science Fair: March 20 · Bentonville & Virtual
                </div>
            </footer>

            {/* ── REGISTRATION MODAL ── */}
            {showReg && (
                <RegistrationModal
                    initialScreen={modalInitScreen}
                    onClose={() => setShowReg(false)}
                    onRegister={() => {}}
                    submissionsTable={subTable}
                    dirRecords={dirRecords}
                    dirNameField={dfName}
                    dirEmailField={dfEmail}
                />
            )}
            {showRulesModal && (
                <RulesModal
                    categorized={officialRulesCategorized}
                    fallback={officialRulesText}
                    onClose={() => setShowRulesModal(false)}
                />
            )}
        </div>
    );
}

initializeBlock({ interface: () => <App /> });
