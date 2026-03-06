import React, { useState, useMemo, useEffect, useRef } from 'react';
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
const HERO_COUNTDOWN_TARGET = new Date('2026-05-04T05:00:00Z'); // May 4, 2026 midnight CDT
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
    { label: 'Impact',       weight: '30%', desc: 'Does this solve a real Global Governance problem? Would it save time, reduce risk, or close a compliance gap?' },
    { label: 'Innovation',   weight: '25%', desc: 'Does it use AI meaningfully — not just a dashboard, but something that automates or augments a real decision?' },
    { label: 'Feasibility',  weight: '25%', desc: 'Could this be deployed at Walmart with reasonable effort? Is it built on available data and tools?' },
    { label: 'Demo Quality', weight: '20%', desc: 'Is the working prototype clear and compelling? Can you explain the problem it solves in 2 minutes?' },
];

// ─── PHASE TIMELINE ───────────────────────────────────────────────────────────
const PHASES = [
    { label: 'Register', sub: 'Now Open',         active: true  },
    { label: 'Train',    sub: 'March 10 – May 1', active: false },
    { label: 'Build',    sub: 'Starts May 4',     active: false },
    { label: 'Present',  sub: 'Starts May 7',     active: false },
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

function useCountdown(target) {
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    const diff = target.getTime() - now;
    if (diff <= 0) return null;
    return {
        d: String(Math.floor(diff / 86400000)).padStart(2, '0'),
        h: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
    };
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
html,body{scroll-behavior:auto;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.portal{background:${T.white};color:${T.body};font-family:'Bogle','Brandon Text','Inter',sans-serif;min-height:100vh;font-size:14px;line-height:1.5;}

/* ── NAV ── */
.nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 56px;height:60px;background:${T.white};border-bottom:1px solid ${T.border};box-shadow:${T.shadow};}
.nav-brand{display:flex;align-items:center;gap:10px;font-family:'Inter',sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${T.muted};font-weight:600;flex-shrink:0;}
.nav-spark{width:30px;height:30px;background:${T.heroGrad};border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.nav-links{display:flex;align-items:center;gap:5px;}
.nav-link{font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${T.muted};text-decoration:none;padding:5px 12px;border-radius:100px;border:1px solid transparent;transition:background 0.12s,border-color 0.12s;white-space:nowrap;cursor:pointer;background:none;}
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
.hero{background:${T.heroGrad};padding:72px 48px 100px;position:relative;overflow:hidden;min-height:420px;}
.hero::after{content:'';position:absolute;top:-40%;right:-8%;width:55%;height:180%;background:radial-gradient(ellipse,rgba(44,142,244,0.18),transparent 65%);pointer-events:none;}
.hero-inner{width:100%;position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;}
.hero-left{min-width:0;padding-left:48px;}
.hero-right{display:grid;place-items:center;min-width:0;}.hero-right>*{grid-area:1/1;}
.hero-orbital{position:relative;width:300px;height:300px;display:flex;align-items:center;justify-content:center;}
.orb-ring{position:absolute;border-radius:50%;}
.orb-r1{width:300px;height:300px;border:1px dashed rgba(255,255,255,0.15);animation:lpspin 32s linear infinite;}
.orb-r2{width:218px;height:218px;border:1px solid rgba(255,255,255,0.12);animation:lpspin 22s linear infinite reverse;}
.orb-r3{width:148px;height:148px;border:1px solid rgba(255,255,255,0.2);animation:lpspin 16s linear infinite;}
.orb-core{position:relative;z-index:2;width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,0.12);border:2px solid rgba(255,255,255,0.28);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);}
.orb-track{position:absolute;border-radius:50%;}
.orb-t1{width:264px;height:264px;animation:lpspin 14s linear infinite;}
.orb-t2{width:186px;height:186px;animation:lpspin 9s linear infinite reverse;}
.orb-dot{position:absolute;top:0;left:50%;transform:translate(-50%,-50%);border-radius:50%;}
.orb-t1 .orb-dot{width:11px;height:11px;background:#FFC220;box-shadow:0 0 12px rgba(255,194,32,0.7),0 0 24px rgba(255,194,32,0.3);}
.orb-t2 .orb-dot{width:8px;height:8px;background:white;box-shadow:0 0 9px rgba(255,255,255,0.7),0 0 18px rgba(255,255,255,0.3);}
@keyframes lpspin{to{transform:rotate(360deg);}}
.hero-stepper{position:absolute;bottom:0;left:0;right:0;padding:16px 48px 24px;display:flex;align-items:flex-start;z-index:2;}
.hero-phase-node{display:flex;flex-direction:column;align-items:center;flex:1;position:relative;}
.hero-phase-node:not(:last-child)::after{display:none;}
.hero-step-dot{width:12px;height:12px;border-radius:50%;position:relative;z-index:1;margin-bottom:8px;}
.hero-step-dot-active{background:#FFC220;box-shadow:0 0 0 3px rgba(255,194,32,0.2);}
.hero-step-dot-inactive{background:transparent;border:1.5px solid rgba(255,255,255,0.7);}
.hero-step-label{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;text-align:center;margin-bottom:3px;color:#fff;}
.hero-step-label-active{color:#fff;}
.hero-step-label-inactive{color:#fff;}
.hero-phase-sub{font-family:'Inter',sans-serif;font-size:10px;font-weight:400;text-align:center;line-height:1.4;color:#fff;}
.hero-step-sub-active{color:#fff;}
.hero-step-sub-inactive{color:#fff;}
.hero-h1-pre{display:block;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);-webkit-text-fill-color:rgba(255,255,255,0.5);background:none;margin-bottom:12px;}
.hero h1{font-size:52px;font-weight:800;line-height:1.05;letter-spacing:-0.025em;color:${T.yellow};margin-bottom:16px;}
.hero h1 .accent{background:linear-gradient(90deg,#CFE8FF 0%,#7EC8F8 50%,#2C8EF4 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-byline{font-family:'Inter',sans-serif;font-size:15px;font-weight:700;color:${T.white};letter-spacing:0.01em;margin-bottom:20px;}
.hero-sub{font-size:14px;color:rgba(255,255,255,0.68);max-width:480px;line-height:1.7;margin-bottom:32px;}
.hero-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
.hero-countdown{position:relative;z-index:2;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;}
.hero-countdown-label{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:2px;}
.countdown-blocks{display:flex;align-items:flex-end;gap:2px;}
.countdown-block{display:flex;flex-direction:column;align-items:center;gap:4px;}
.countdown-num{font-family:'Inter',sans-serif;font-size:38px;font-weight:800;line-height:1;color:#fff;min-width:52px;text-align:center;letter-spacing:-0.03em;}
.countdown-unit{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:${T.yellow};}
.countdown-sep{font-size:26px;font-weight:700;color:rgba(255,255,255,0.3);padding-bottom:14px;align-self:flex-end;margin:0 2px;}
.btn-primary{display:inline-flex;align-items:center;gap:8px;background:${T.yellow};color:${T.deep};padding:11px 22px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;border-radius:5px;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(255,194,32,0.35);transition:all 0.18s;text-decoration:none;white-space:nowrap;}
.btn-primary:hover{background:#FFD050;transform:translateY(-1px);}
.btn-outline{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,0.12);color:${T.white};padding:11px 22px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;border-radius:5px;border:1px solid rgba(255,255,255,0.22);cursor:pointer;transition:all 0.18s;text-decoration:none;}
.btn-outline:hover{background:rgba(255,255,255,0.2);}
.btn-outline-dark{display:inline-flex;align-items:center;gap:7px;background:none;color:${T.deep};padding:12px 20px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;border-radius:5px;border:1px solid ${T.border2};cursor:pointer;transition:all 0.18s;text-decoration:none;}
.btn-outline-dark:hover{background:${T.ice};border-color:${T.blue};color:${T.blue};}

/* ── STAT BAR ── */
.stat-bar{background:${T.white};border-bottom:1px solid ${T.border};}
.stat-bar-inner{display:grid;grid-template-columns:repeat(5,1fr);width:100%;}
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

/* ── LEARNING HUB CARDS ── */
.hub-cards{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.hub-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;padding:28px 24px;display:flex;flex-direction:column;transition:box-shadow 0.18s,border-color 0.18s;cursor:pointer;}
.hub-card:hover{box-shadow:${T.shadowM};border-color:rgba(0,113,206,0.4);}
.hub-modal-body{padding:24px 28px 20px;overflow-y:auto;flex:1;font-size:15px;color:#1a2233;scrollbar-width:thin;scrollbar-color:${T.muted2} transparent;}
.hub-modal-footer{padding:14px 28px 20px;border-top:1px solid ${T.border};display:flex;justify-content:flex-end;flex-shrink:0;}
.hub-modal-empty{font-size:14px;color:${T.muted};font-style:italic;}
.hub-card-icon{margin-bottom:14px;display:flex;}
.hub-card-title{font-size:16px;font-weight:800;color:${T.deep};margin-bottom:10px;}
.hub-card-body{font-size:13px;color:${T.muted};line-height:1.65;flex:1;margin-bottom:18px;}
.hub-card-link{font-family:'Inter',sans-serif;font-size:13px;font-weight:700;color:${T.blue};text-decoration:none;display:inline-flex;align-items:center;gap:4px;background:none;border:none;cursor:pointer;padding:0;margin-top:auto;}
.hub-card-link:hover{text-decoration:underline;}

/* ── HUB MARKDOWN ── */
.hub-md{font-family:'Inter',sans-serif;}
.hub-md h2{font-size:17px;font-weight:800;color:#0B2C5F;margin:24px 0 8px;padding-bottom:8px;border-bottom:1px solid #edf2f8;}
.hub-md h3{font-size:15px;font-weight:700;color:#0B2C5F;margin:18px 0 6px;}
.hub-md h4{font-size:13px;font-weight:700;color:#334155;margin:14px 0 4px;}
.hub-md p{font-size:14px;color:#334155;line-height:1.75;margin:0 0 12px;}
.hub-md ul,.hub-md ol{padding-left:22px;margin:4px 0 14px;}
.hub-md li{font-size:14px;color:#334155;line-height:1.7;margin-bottom:4px;}
.hub-md strong{color:#0B2C5F;font-weight:700;}
.hub-md a{color:#0071CE;text-decoration:none;}
.hub-md a:hover{text-decoration:underline;}

/* ── PRODUCT CARDS ── */
.prod-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.prod-card{position:relative;border-radius:16px;overflow:hidden;cursor:pointer;height:220px;border:none;padding:0;font-family:inherit;display:block;width:100%;box-shadow:0 4px 16px rgba(11,44,95,0.12),0 1px 3px rgba(11,44,95,0.08);transition:all 0.35s ease;}
.prod-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(11,44,95,0.18),0 2px 8px rgba(11,44,95,0.1);}
.prod-card-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease;}
.prod-card:hover .prod-card-bg{transform:scale(1.06);}
.prod-card-bg-fallback{position:absolute;inset:0;background:linear-gradient(135deg,#0B2C5F 0%,#0071CE 50%,#A855F7 100%);}
.prod-card-shade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(11,44,95,0.35) 100%);z-index:1;pointer-events:none;}
.prod-card-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(11,44,95,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;transition:opacity 0.35s ease;z-index:2;}
.prod-card:hover .prod-card-overlay{opacity:1;}
.prod-card-hover-label{font-size:14px;font-weight:800;color:white;white-space:nowrap;text-align:center;letter-spacing:0.02em;}
.prod-card-hover-btn{font-family:'Inter',sans-serif;font-size:12px;font-weight:700;color:white;background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.4);border-radius:100px;padding:8px 22px;white-space:nowrap;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);transition:all 0.2s;}
.prod-card:hover .prod-card-hover-btn:hover{background:rgba(255,255,255,0.3);}
/* ── PRODUCT MODAL ── */
.pm-header{display:flex;align-items:center;justify-content:space-between;padding:24px 28px 20px;border-bottom:1px solid ${T.border};}
.pm-header-left{display:flex;align-items:center;gap:16px;}
.pm-logo{width:56px;height:56px;border-radius:14px;object-fit:cover;border:1px solid ${T.border};}
.pm-name{font-size:20px;font-weight:800;color:${T.deep};}
.pm-website{font-size:12px;color:${T.blue};text-decoration:none;font-weight:600;}
.pm-website:hover{text-decoration:underline;}
.pm-body{flex:1;overflow-y:auto;padding:24px 28px;scrollbar-width:thin;}
.pm-desc{font-size:14px;color:${T.body};line-height:1.7;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid ${T.border};}
.pm-resources-label{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${T.muted2};margin-bottom:14px;}
.pm-resources-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;}
.pm-res-card{display:flex;flex-direction:column;background:${T.cloud};border:1px solid ${T.border};border-radius:10px;overflow:hidden;text-decoration:none;transition:all 0.18s;cursor:pointer;}
.pm-res-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(11,44,95,0.1);border-color:${T.blue};}
.pm-res-cover-wrap{height:100px;overflow:hidden;background:${T.white};}
.pm-res-cover{width:100%;height:100%;object-fit:cover;}
.pm-res-info{padding:12px 14px 8px;flex:1;}
.pm-res-name{font-size:13px;font-weight:700;color:${T.deep};margin-bottom:4px;}
.pm-res-notes{font-size:10px;color:${T.muted};line-height:1.5;}
.pm-res-link{padding:4px 14px 12px;font-size:10px;font-weight:700;color:${T.blue};}
.pm-empty{text-align:center;padding:32px 20px;font-size:13px;color:${T.muted2};font-style:italic;}
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

/* ── ACTIVE REGISTRATIONS ── */
.reg-tabs{display:flex;border-bottom:1px solid ${T.border};margin-bottom:24px;}
.reg-tab{padding:12px 20px;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;cursor:pointer;background:none;border:none;border-bottom:2px solid transparent;transition:all 0.15s;color:${T.muted2};}
.reg-tab.active{color:${T.deep};border-bottom-color:${T.blue};}
.reg-tab:hover:not(.active){color:${T.muted};}
.reg-header-row{display:grid;grid-template-columns:2fr 1fr 1.5fr 1fr 0.8fr;gap:12px;padding-bottom:10px;border-bottom:1px solid ${T.border2};margin-bottom:0;}
.reg-header-col{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${T.muted2};}
.reg-row{display:grid;grid-template-columns:2fr 1fr 1.5fr 1fr 0.8fr;gap:12px;padding:13px 8px;border-bottom:1px solid ${T.border};align-items:center;transition:background 0.12s;border-radius:4px;}
.reg-row:hover{background:${T.cloud};}
.reg-cell-name{font-size:14px;font-weight:700;color:${T.deep};}
.reg-cell{font-size:12px;color:${T.muted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.reg-team-link{font-size:14px;font-weight:700;color:${T.deep};cursor:pointer;background:none;border:none;text-align:left;padding:0;font-family:inherit;transition:color 0.12s;}
.reg-team-link:hover{color:${T.blue};text-decoration:underline;}
.roster-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid ${T.border};}
.roster-row:last-child{border-bottom:none;}
.roster-label{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${T.muted2};min-width:64px;}
.roster-name{font-size:14px;font-weight:600;color:${T.deep};}
.roster-badge{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 7px;border-radius:100px;background:#FFF8E6;color:#78500E;margin-left:6px;}
.roster-empty{font-size:13px;color:${T.muted};font-style:italic;}
.reg-pill{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.03em;padding:3px 9px;border-radius:100px;display:inline-block;white-space:nowrap;}
.reg-pill-blue{background:#EFF6FF;color:#1D4ED8;}
.reg-pill-green{background:#ECFDF5;color:#065F46;}
.reg-pill-purple{background:#F5F3FF;color:#5B21B6;}
.reg-pill-gray{background:${T.cloud};color:${T.muted};}
.reg-pill-yellow{background:#FFF8E6;color:#78500E;}
.reg-empty{padding:52px;text-align:center;color:${T.muted};font-size:14px;font-style:italic;}

/* ── WIDER SECTION WRAP ── */
.sec-wrap-wide{max-width:1280px;margin:0 auto;padding:48px 36px;}

/* ── STEP INDICATOR ── */
.step-indicator{display:flex;align-items:flex-start;margin-bottom:40px;position:relative;}
.step-ind-node{display:flex;flex-direction:column;align-items:center;flex:1;position:relative;}
.step-ind-node:not(:last-child)::after{content:'';position:absolute;top:13px;left:50%;width:100%;height:2px;background:rgba(0,113,206,0.14);z-index:0;}
.step-circle{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;position:relative;z-index:1;transition:all 0.2s;}
.step-circle-active{background:#0071CE;color:white;}
.step-circle-done{background:#22C55E;color:white;}
.step-circle-pending{background:#F4F7FB;border:2px solid rgba(0,113,206,0.14);color:#8BA5BF;}
.step-ind-label{margin-top:6px;font-family:'Inter',sans-serif;font-size:10px;font-weight:600;text-align:center;}
.step-ind-label-active{color:#0B2C5F;}
.step-ind-label-inactive{color:#8BA5BF;}

/* ── STEP CONTENT BLOCKS ── */
.step-block{margin-bottom:28px;}
.step-block-header{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#5A7A9A;margin-bottom:10px;}
.step-card{background:#FFFFFF;border:1px solid rgba(0,113,206,0.14);border-radius:10px;padding:20px 22px 18px;box-shadow:0 1px 3px rgba(11,44,95,0.08);}
.step-card-title{font-size:15px;font-weight:800;color:#0B2C5F;margin-bottom:6px;}
.step-card-sub{font-size:12px;color:#5A7A9A;line-height:1.6;margin-bottom:14px;}
/* ── STEP 1 HERO CARD ── */
.step-card-hero{background:${T.heroGrad};border:none;color:white;}
.step-card-hero .step-card-title{color:white;font-size:14px;}
.step-card-hero .step-card-sub{color:rgba(255,255,255,0.7);font-size:11px;}
.step-card-hero .form-label{color:rgba(255,255,255,0.85);font-size:11px;}
.step-card-hero .req{color:${T.yellow};}
.step-card-hero .fi{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.2);color:white;}
.step-card-hero .fi::placeholder{color:rgba(255,255,255,0.4);}
.step-card-hero .fi:focus{border-color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.18);}
.step-card-hero .ck-label{color:rgba(255,255,255,0.85);font-size:11px;}
.step-card-hero .ck-label a{color:${T.yellow};}
.step-card-hero .btn-primary{background:${T.yellow};color:${T.deep};}
.step-card-hero .hub-card-link{color:${T.yellow};font-size:11px;}
.step-card-hero .step-success{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.2);}
.step-card-hero .step-success-text{color:white;}
.step-card-hero .step-warn{background:rgba(255,194,32,0.15);border-color:rgba(255,194,32,0.3);}
.step-card-hero .step-warn-text{color:rgba(255,255,255,0.9);}
.step-card-hero .step-info{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);}
.step-card-hero .step-info-text{color:rgba(255,255,255,0.85);}
.step-card-hero .ferr{color:${T.yellow};background:rgba(185,28,28,0.2);}
.step-card-hero .radio-group label{color:rgba(255,255,255,0.8);font-size:11px;}
.step-card-hero .rp label{color:rgba(255,255,255,0.85);}
.step-card-hero .rp input[type="radio"]:checked + label{color:white;}
.step-card-hero .submit-err{background:rgba(185,28,28,0.2);color:#FCA5A5;}
.step-card-hero .add-self-form{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.15);}
.step-card-hero .add-self-title{color:white;}
.step-card-hero .add-self-highlight{background:rgba(185,28,28,0.25);border-color:rgba(255,100,100,0.6);}
.step-card-hero .add-self-link-alert{color:#FCA5A5 !important;}
.step-card-hero .ms-input{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.2);color:white;}
.step-card-hero .ms-input::placeholder{color:rgba(255,255,255,0.4);}
.step-card-hero .ms-input:focus{border-color:rgba(255,255,255,0.5);}
.step-card-hero .ms-selected{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.2);}
.step-card-hero .ms-selected-name{color:white;}
.step-card-hero .ms-selected-email{color:rgba(255,255,255,0.6);}
.step-card-hero .ms-clear{color:rgba(255,255,255,0.6);}
.step-card-hero .ms-clear:hover{color:white;}
.step-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px;}

/* ── TEAM BUILDER ── */
.tb-container{display:flex;gap:24px;min-height:480px;}
.tb-sidebar{width:240px;min-width:240px;background:#FFFFFF;border:1px solid rgba(0,113,206,0.14);border-radius:10px;padding:14px;display:flex;flex-direction:column;box-shadow:0 1px 3px rgba(11,44,95,0.08);}
.tb-main{flex:1;display:flex;flex-direction:column;gap:16px;}
.tb-sidebar-badge{display:inline-block;font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0071CE;border:1px solid #0071CE;padding:2px 8px;border-radius:3px;margin-bottom:8px;align-self:flex-start;}
.tb-sidebar-count{font-size:20px;font-weight:800;color:#0B2C5F;margin-bottom:4px;}
.tb-sidebar-sub{font-size:11px;color:#5A7A9A;line-height:1.5;margin-bottom:12px;}
.tb-agent-list{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:2px;scrollbar-width:thin;max-height:480px;}
.tb-agent-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;border:1px solid rgba(0,113,206,0.14);background:none;cursor:default;transition:all 0.15s;text-align:left;width:100%;font-family:inherit;}
.tb-agent-row:hover{background:#F4F7FB;border-color:#0071CE;}
.tb-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;flex-shrink:0;}
.tb-agent-info{display:flex;flex-direction:column;gap:1px;}
.tb-agent-name{font-size:11px;font-weight:700;color:#0B2C5F;}
.tb-empty{font-size:12px;color:#8BA5BF;font-style:italic;padding:16px 0;text-align:center;}
.tb-agent-group{margin-bottom:6px;}
.tb-agent-group-label{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8BA5BF;padding:3px 0;border-bottom:1px solid rgba(0,113,206,0.14);margin-bottom:3px;}
.tb-search-wrap{position:relative;margin-bottom:10px;}
.tb-search-input{width:100%;padding:7px 10px 7px 30px;border:1px solid rgba(0,113,206,0.14);border-radius:5px;font-family:'Inter',sans-serif;font-size:11px;background:#F4F7FB;transition:border 0.15s;box-sizing:border-box;outline:none;}
.tb-search-input:focus{border-color:#0071CE;background:#FFFFFF;}
.tb-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px;}
.tb-toolbar-left{display:flex;align-items:center;gap:8px;flex:1;}
.tb-toggle-btn{background:none;border:1px solid rgba(0,113,206,0.14);border-radius:100px;padding:5px 12px;font-family:'Inter',sans-serif;font-size:10px;font-weight:600;color:#5A7A9A;cursor:pointer;transition:all 0.15s;white-space:nowrap;}
.tb-toggle-btn:hover{border-color:#0071CE;color:#0071CE;}
.tb-create-btn{background:#FFC220;color:#0B2C5F;border:none;border-radius:6px;padding:8px 16px;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;cursor:pointer;transition:all 0.15s;white-space:nowrap;}
.tb-create-btn:hover:not(:disabled){background:#FFD050;transform:translateY(-1px);}
.tb-create-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
.tb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;}
.tb-card{background:#FFFFFF;border:1px solid rgba(0,113,206,0.14);border-radius:10px;padding:14px 16px;box-shadow:0 1px 3px rgba(11,44,95,0.08);display:flex;flex-direction:column;transition:border-color 0.15s,box-shadow 0.15s;}
.tb-card-header{margin-bottom:10px;}
.tb-card-name{font-size:13px;font-weight:800;color:#0B2C5F;margin-bottom:4px;}
.tb-card-pills{display:flex;gap:6px;flex-wrap:wrap;}
.tb-pill{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;white-space:nowrap;}
.tb-card-slots{display:flex;flex-direction:column;gap:4px;margin-bottom:10px;flex:1;}
.tb-slot{display:flex;align-items:center;gap:10px;padding:5px 8px;border:1px solid rgba(0,113,206,0.14);border-radius:6px;min-height:32px;transition:all 0.12s;}
.tb-slot-filled{background:#F4F7FB;border-color:rgba(0,113,206,0.2);}
.tb-slot-avatar{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;font-size:9px;font-weight:700;flex-shrink:0;}
.tb-slot-name{font-size:11px;font-weight:600;color:#0B2C5F;flex:1;}
.tb-cap-badge{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.06em;background:#FFC220;color:#0B2C5F;padding:1px 5px;border-radius:3px;text-transform:uppercase;}
.tb-slot-empty-dot{width:22px;height:22px;border-radius:50%;border:2px dashed rgba(0,113,206,0.14);flex-shrink:0;}
.tb-slot-empty-label{font-size:10px;color:#8BA5BF;font-style:italic;}
.tb-card-footer{display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid rgba(0,113,206,0.14);}
.tb-card-count{font-size:10px;color:#5A7A9A;}
.tb-card-join-btn{background:#0071CE;color:white;border:none;border-radius:5px;padding:4px 12px;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;cursor:pointer;transition:all 0.15s;}
.tb-card-join-btn:hover:not(:disabled){background:#0B2C5F;transform:translateY(-1px);}
.tb-card-join-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
.tb-card-full{font-size:10px;color:#8BA5BF;font-weight:600;}
.tb-leave-btn{background:none;color:#B91C1C;border:1px solid rgba(185,28,28,0.35);border-radius:5px;padding:3px 9px;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;cursor:pointer;transition:all 0.15s;}
.tb-leave-btn:hover:not(:disabled){background:#FEF2F2;border-color:#B91C1C;}
.tb-leave-btn:disabled{opacity:0.4;cursor:not-allowed;}
.tb-step1-gate{background:#F4F7FB;border:1px solid rgba(0,113,206,0.14);border-radius:10px;padding:40px;text-align:center;font-size:14px;color:#5A7A9A;}
.tb-page-nav{display:flex;align-items:center;justify-content:space-between;padding:4px 0;}
.tb-page-arrow{background:none;border:1px solid rgba(0,113,206,0.22);border-radius:7px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;color:#0071CE;transition:all 0.15s;flex-shrink:0;}
.tb-page-arrow:hover:not(:disabled){background:#EFF6FF;border-color:#0071CE;}
.tb-page-arrow:disabled{opacity:0.25;cursor:not-allowed;}
.tb-page-dots{display:flex;gap:6px;align-items:center;}
.tb-page-dot{width:7px;height:7px;border-radius:50%;background:rgba(0,113,206,0.2);transition:all 0.2s;cursor:pointer;border:none;padding:0;}
.tb-page-dot.active{background:#0071CE;width:20px;border-radius:4px;}
.tb-page-label{font-size:10px;color:#5A7A9A;font-weight:600;}
.tb-card-confirm{margin-top:8px;padding:10px 12px;background:#EFF6FF;border:1px solid rgba(0,113,206,0.28);border-radius:8px;animation:fadeIn 0.12s ease;}
.tb-card-confirm-text{font-size:11px;color:#0B2C5F;margin-bottom:6px;line-height:1.5;font-weight:500;}
@keyframes fadeIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:translateY(0);}}

/* ── JOIN TEAM LIST ── */
.join-team-list{max-height:320px;overflow-y:auto;border:1px solid rgba(0,113,206,0.14);border-radius:6px;margin-bottom:16px;scrollbar-width:thin;}
.join-team-row{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(0,113,206,0.14);transition:background 0.12s;}
.join-team-row:hover{background:#F4F7FB;}
.join-team-row:last-child{border-bottom:none;}
.join-team-info{display:flex;flex-direction:column;gap:2px;}
.join-team-name{font-size:14px;font-weight:700;color:#0B2C5F;}
.join-team-meta{font-size:12px;color:#5A7A9A;}
.join-btn{background:#0071CE;color:white;border:none;border-radius:5px;padding:6px 16px;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;cursor:pointer;transition:all 0.15s;white-space:nowrap;flex-shrink:0;}
.join-btn:hover:not(:disabled){background:#0B2C5F;transform:translateY(-1px);}
.join-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;}

/* ── INLINE SUCCESS / WARN / INFO ── */
.step-success{display:flex;align-items:flex-start;gap:10px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:14px 18px;margin-top:16px;}
.step-success-text{font-size:13px;font-weight:600;color:#15803D;line-height:1.5;}
.step-warn{display:flex;align-items:flex-start;gap:10px;background:#FFF8E6;border:1px solid #F4D04A;border-radius:8px;padding:14px 18px;margin-top:12px;}
.step-warn-text{font-size:13px;color:#78500E;line-height:1.5;}
.step-info{display:flex;align-items:flex-start;gap:10px;background:#EFF6FF;border:1px solid rgba(0,113,206,0.26);border-radius:8px;padding:14px 18px;margin-top:12px;}
.step-info-text{font-size:13px;color:#1D4ED8;line-height:1.5;}

/* ── FREE AGENT NOTE ── */
.free-agent-note{background:#F4F7FB;border:1px solid rgba(0,113,206,0.14);border-radius:8px;padding:12px 16px;font-size:12px;color:#5A7A9A;line-height:1.65;margin-top:16px;margin-bottom:24px;}
.free-agent-note strong{color:#0B2C5F;}

/* ── CONFIRM DIALOG ── */
.confirm-overlay{background:#FFF8E6;border:1px solid #F4D04A;border-radius:8px;padding:16px 18px;margin-top:12px;}
.confirm-text{font-size:13px;color:#78500E;margin-bottom:12px;line-height:1.5;}
.confirm-btns{display:flex;gap:8px;}
.confirm-btn-yes{background:#0071CE;color:white;border:none;border-radius:5px;padding:7px 18px;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s;}
.confirm-btn-yes:hover{background:#0B2C5F;}
.confirm-btn-no{background:none;border:1px solid rgba(0,113,206,0.26);border-radius:5px;padding:7px 18px;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;color:#5A7A9A;cursor:pointer;transition:all 0.15s;}
.confirm-btn-no:hover{border-color:#0B2C5F;color:#0B2C5F;}

/* ── ADD YOURSELF FORM ── */
.add-self-form{background:#F4F7FB;border:1px solid rgba(0,113,206,0.14);border-radius:8px;padding:20px;margin-top:12px;}
.add-self-title{font-size:13px;font-weight:700;color:#0B2C5F;margin-bottom:14px;}
.add-self-highlight{background:rgba(185,28,28,0.15);border:1.5px solid #B91C1C;border-radius:8px;padding:10px 14px;animation:pulse-red 1.5s ease-in-out 3;}
.add-self-link-alert{color:#B91C1C !important;font-weight:800 !important;font-size:13px !important;}
@keyframes pulse-red{0%,100%{box-shadow:0 0 0 0 rgba(185,28,28,0);}50%{box-shadow:0 0 12px 4px rgba(185,28,28,0.25);}}

/* ── MOBILE ── */
@media(max-width:900px){
  .rule-cards,.prod-grid{grid-template-columns:1fr 1fr;}
  .prod-card{height:180px;}
  .help-cards{grid-template-columns:1fr;}
  .ws-feature-grid{grid-template-columns:repeat(2,1fr);}
  .step-cols{grid-template-columns:1fr;}
  .tb-container{flex-direction:column;}
  .tb-sidebar{width:100%;min-width:0;}
  .tb-grid{grid-template-columns:1fr;}
  .tb-toolbar{flex-wrap:wrap;}
  .tb-toolbar-left{flex:1;min-width:0;}
}
@media(max-width:900px){
  .hero-inner{grid-template-columns:1fr;gap:40px;}
  .hero-right{transform:scale(0.78);transform-origin:center;}
  .hero-stepper{padding:14px 20px 20px;}
}
@media(max-width:680px){
  .nav{padding:0 16px;}
  .nav-links{display:none;}
  .nav-countdown{display:none;}
  .hero{padding:40px 16px 56px;}
  .hero-orbital{display:none;}
  .hero-inner{gap:0;}
  .hero-stepper{display:none;}
  .sec-wrap{padding:40px 20px;}
  .sec-wrap-wide{padding:40px 20px;} .step-indicator{display:none;}
  .stat-bar-inner{grid-template-columns:repeat(3,1fr);}
  .phase-section{padding:16px 16px 12px;}
  .hub-cards,.rule-cards,.prod-grid,.help-cards{grid-template-columns:1fr;}
  .prod-card{height:200px;}
  .pm-resources-grid{grid-template-columns:1fr;}
  .judge-grid{grid-template-columns:1fr;}
  .reg-cols{grid-template-columns:1fr;}
  .ws-feature-grid{grid-template-columns:repeat(2,1fr);}
  .opt-cards{grid-template-columns:1fr;}
  .fr-2{grid-template-columns:1fr;}
  .site-footer{padding:20px 16px;}
  .site-footer-top{flex-direction:column;gap:14px;align-items:flex-start;}
  .site-footer-links{flex-wrap:wrap;gap:12px;}
}

/* ── ADMIN ── */
.adm-wrap{background:#f8fafc;min-height:100vh;font-family:'Inter',sans-serif;}
.adm-nav{position:sticky;top:0;z-index:100;height:60px;background:#0B2C5F;display:flex;align-items:center;padding:0 40px;gap:16px;border-bottom:1px solid rgba(255,255,255,0.1);}
.adm-nav-back{background:none;border:none;color:rgba(255,255,255,0.65);font-family:'Inter',sans-serif;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:5px;transition:all 0.15s;white-space:nowrap;}
.adm-nav-back:hover{color:#fff;background:rgba(255,255,255,0.1);}
.adm-nav-brand{font-family:'Inter',sans-serif;font-size:13px;font-weight:700;color:#fff;flex:1;display:flex;align-items:center;gap:8px;}
.adm-nav-sep{width:1px;height:28px;background:rgba(255,255,255,0.15);flex-shrink:0;}
.adm-nav-tabs{display:flex;gap:4px;}
.adm-nav-tab{background:none;border:none;color:rgba(255,255,255,0.55);font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;padding:7px 14px;border-radius:5px;transition:all 0.15s;}
.adm-nav-tab.active{background:rgba(255,255,255,0.15);color:#fff;}
.adm-nav-tab:hover:not(.active){background:rgba(255,255,255,0.08);color:#fff;}
.adm-badge{background:#FFC220;color:#0B2C5F;font-family:'Inter',sans-serif;font-size:9px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;padding:3px 8px;border-radius:3px;flex-shrink:0;}
.adm-hero{background:linear-gradient(135deg,#0B2C5F 0%,#0071CE 100%);padding:40px 56px;display:grid;grid-template-columns:1fr auto;gap:40px;align-items:center;}
.adm-hero-pre{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:8px;}
.adm-hero-h1{font-size:36px;font-weight:800;color:#FFC220;line-height:1.1;margin-bottom:10px;letter-spacing:-0.02em;}
.adm-hero-sub{font-family:'Inter',sans-serif;font-size:13px;color:rgba(255,255,255,0.6);max-width:420px;line-height:1.6;}
.adm-kickoff{text-align:center;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);border-radius:12px;padding:22px 36px;backdrop-filter:blur(10px);}
.adm-kickoff-num{font-family:'Inter',sans-serif;font-size:56px;font-weight:800;color:#fff;line-height:1;letter-spacing:-0.04em;}
.adm-kickoff-label{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#FFC220;margin-top:6px;}
.adm-stat-bar{background:#fff;border-bottom:1px solid #e2e8f0;display:grid;grid-template-columns:repeat(5,1fr);}
.adm-stat-item{padding:18px 0;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;gap:4px;align-items:center;text-align:center;}
.adm-stat-item:last-child{border-right:none;}
.adm-stat-num{font-family:'Inter',sans-serif;font-size:24px;font-weight:800;color:#0071CE;line-height:1;}
.adm-stat-num-red{color:#B91C1C;}
.adm-stat-label{font-family:'Inter',sans-serif;font-size:9px;color:#5A7A9A;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;}
.adm-warn{background:#FFF8E6;border-left:4px solid #F4D04A;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
.adm-warn-text{font-family:'Inter',sans-serif;font-size:13px;color:#78500E;font-weight:500;}
.adm-warn-btn{background:none;border:1px solid #D4A017;border-radius:5px;color:#78500E;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;cursor:pointer;padding:6px 14px;transition:all 0.15s;}
.adm-warn-btn:hover{background:#D4A017;color:#fff;}
.adm-main{display:grid;grid-template-columns:280px 1fr;min-height:calc(100vh - 220px);border-top:1px solid #e2e8f0;}
.adm-sidebar{background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;overflow:hidden;}
.adm-sidebar-tabs{display:flex;border-bottom:1px solid #e2e8f0;flex-shrink:0;}
.adm-sidebar-tab{flex:1;padding:12px;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5A7A9A;background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s;}
.adm-sidebar-tab.active{color:#0071CE;border-bottom-color:#0071CE;background:#f8fafc;}
.adm-search{padding:12px 14px;border-bottom:1px solid #e2e8f0;flex-shrink:0;}
.adm-search-input{width:100%;background:#f4f7fb;border:1px solid #e2e8f0;border-radius:5px;padding:8px 12px;font-family:'Inter',sans-serif;font-size:12px;color:#0B2C5F;outline:none;transition:border-color 0.15s;}
.adm-search-input:focus{border-color:#0071CE;}
.adm-filters{padding:10px 14px;display:flex;gap:5px;flex-wrap:wrap;border-bottom:1px solid #e2e8f0;flex-shrink:0;}
.adm-filter-pill{background:none;border:1px solid #e2e8f0;border-radius:100px;padding:4px 10px;font-family:'Inter',sans-serif;font-size:9px;font-weight:700;color:#5A7A9A;cursor:pointer;transition:all 0.15s;letter-spacing:0.06em;text-transform:uppercase;}
.adm-filter-pill.active{background:#0071CE;border-color:#0071CE;color:#fff;}
.adm-filter-pill:hover:not(.active){border-color:#0071CE;color:#0071CE;}
.adm-team-list{overflow-y:auto;flex:1;scrollbar-width:thin;scrollbar-color:#cbd5e0 transparent;}
.adm-team-row{padding:12px 14px;border-bottom:1px solid #f0f4f8;transition:background 0.12s;}
.adm-team-row:hover{background:#f8fafc;}
.adm-team-name{font-family:'Inter',sans-serif;font-size:13px;font-weight:700;color:#0B2C5F;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.adm-team-meta{display:flex;gap:5px;align-items:center;flex-wrap:wrap;}
.adm-status-badge{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 7px;border-radius:3px;white-space:nowrap;}
.adm-badge-registered{background:#EFF6FF;color:#1E40AF;}
.adm-badge-submitted{background:#ECFDF5;color:#065F46;}
.adm-badge-issue{background:#FEF2F2;color:#B91C1C;}
.adm-sidebar-footer{padding:10px 14px;border-top:1px solid #e2e8f0;font-family:'Inter',sans-serif;font-size:11px;color:#5A7A9A;flex-shrink:0;}
.adm-content{padding:28px 32px;display:flex;flex-direction:column;gap:20px;overflow-y:auto;}
.adm-card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;}
.adm-card-header{padding:16px 20px;border-bottom:1px solid #f0f4f8;display:flex;align-items:center;justify-content:space-between;gap:12px;}
.adm-card-title{font-family:'Inter',sans-serif;font-size:13px;font-weight:800;color:#0B2C5F;letter-spacing:-0.01em;}
.adm-donut-wrap{display:flex;align-items:center;gap:32px;padding:24px 20px;}
.adm-donut-legend{display:flex;flex-direction:column;gap:12px;flex:1;}
.adm-donut-legend-item{display:flex;align-items:center;gap:8px;}
.adm-donut-legend-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
.adm-donut-legend-label{font-family:'Inter',sans-serif;font-size:12px;color:#5A7A9A;flex:1;}
.adm-donut-legend-val{font-family:'Inter',sans-serif;font-size:13px;font-weight:700;color:#0B2C5F;}
.adm-metrics-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#f0f4f8;}
.adm-metric{background:#fff;padding:22px 16px;text-align:center;}
.adm-metric-num{font-family:'Inter',sans-serif;font-size:30px;font-weight:800;color:#0071CE;line-height:1;}
.adm-metric-label{font-family:'Inter',sans-serif;font-size:9px;color:#5A7A9A;letter-spacing:0.1em;text-transform:uppercase;margin-top:6px;font-weight:600;}
.adm-snapshot-body{padding:20px;font-family:'Inter',sans-serif;font-size:13px;color:#334155;line-height:2;background:#f8fafc;}
.adm-copy-btn{background:none;border:1px solid #e2e8f0;border-radius:5px;padding:5px 12px;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:#5A7A9A;cursor:pointer;transition:all 0.15s;}
.adm-copy-btn:hover{border-color:#0071CE;color:#0071CE;}
.adm-copy-btn.copied{border-color:#22C55E;color:#22C55E;}
.adm-placeholder{padding:80px;text-align:center;color:#5A7A9A;font-family:'Inter',sans-serif;font-size:15px;}
`;

// ─── MEMBER SEARCH ────────────────────────────────────────────────────────────
function MemberSearch({ label, optional, dirRecords, nameField, emailField, selected, onSelect, onNoResults }) {
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

    const hasNoResults = query.trim().length >= 3 && filtered.length === 0;
    useEffect(() => {
        if (onNoResults) onNoResults(hasNoResults);
    }, [hasNoResults, onNoResults]);

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
                    autoComplete="off" autoCorrect="off" autoCapitalize="off"
                    spellCheck={false} data-lpignore="true" data-form-type="other"
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
        if (!teamName.trim()) e.teamName = 'Team name is required.';
        if (!captain)         e.captain  = 'Team Captain is required.';
        if (!agreed)          e.agreed   = 'You must agree to the rules to register.';
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
            try { const f = submissionsTable.getFieldIfExists('Team Member # 1 (Captain)'); if (f && captain) fields[f.id] = [{ id: captain.id }]; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member # 2');    if (f && member2) fields[f.id] = [{ id: member2.id }]; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member # 3');    if (f && member3) fields[f.id] = [{ id: member3.id }]; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member # 4');    if (f && member4) fields[f.id] = [{ id: member4.id }]; } catch (e_) { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member # 5');    if (f && member5) fields[f.id] = [{ id: member5.id }]; } catch (e_) { /* skip */ }
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
            try { const f = submissionsTable.getFieldIfExists('Team Member # 1 (Captain)'); if (f && agentSelf) fields[f.id] = [{ id: agentSelf.id }]; } catch (e_) { /* skip */ }
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
                            <div className="modal-subtitle">2026 Global Governance AI Hackathon</div>
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
                            <div className="modal-subtitle">2026 Global Governance AI Hackathon</div>
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
                        <div className="modal-subtitle">2026 Global Governance AI Hackathon · Spots limited to first {MAX_TEAMS} teams</div>
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="fs">
                        <div className="fs-title">Team Details</div>
                        <div className="fr">
                            <label className="form-label">Team Name<span className="req">*</span></label>
                            <input className="fi" placeholder="e.g. The Compliance Crushers" value={teamName} onChange={e => setTeamName(e.target.value)} />
                            {errors.teamName && <div className="ferr">{errors.teamName}</div>}
                        </div>
                    </div>

                    <div className="fs">
                        <div className="fs-title">Your Team</div>
                        <div className="fh" style={{ marginBottom: 14 }}>Up to 5 members. You can add more after registering.</div>
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

const NAV_SECTIONS = [
    ['rules',    'Rules'    ],
    ['tools',    'Tools'    ],
    ['register', 'Register' ],
    ['help',     'Help'     ],
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

function renderMarkdown(text) {
    if (!text) return null;
    let key = 0;
    const inl = (s) => {
        const out = []; let rem = s, i = 0;
        while (rem) {
            const bm = rem.match(/\*\*(.+?)\*\*/), lm = rem.match(/\[([^\]]+)\]\(([^)]+)\)/);
            const bi = bm ? rem.indexOf(bm[0]) : Infinity, li = lm ? rem.indexOf(lm[0]) : Infinity;
            if (bi === Infinity && li === Infinity) { out.push(rem); break; }
            if (bi <= li) {
                if (bi > 0) out.push(rem.slice(0, bi));
                out.push(<strong key={i++}>{bm[1]}</strong>);
                rem = rem.slice(bi + bm[0].length);
            } else {
                if (li > 0) out.push(rem.slice(0, li));
                out.push(<a key={i++} href={lm[2]} target="_blank" rel="noreferrer" style={{color:'#0071CE'}}>{lm[1]}</a>);
                rem = rem.slice(li + lm[0].length);
            }
        }
        return out.length === 1 && typeof out[0] === 'string' ? out[0] : out;
    };
    // Strip leading # title line
    const rawLines = text.split('\n');
    let start = 0;
    for (let i = 0; i < rawLines.length; i++) {
        if (!rawLines[i].trim()) { start = i + 1; continue; }
        if (/^# /.test(rawLines[i])) { start = i + 1; }
        break;
    }
    const lines = rawLines.slice(start);
    const els = [];
    let listKind = null, listItems = [];
    const flush = () => {
        if (!listItems.length) return;
        const Tag = listKind === 'ol' ? 'ol' : 'ul';
        els.push(<Tag key={key++}>{[...listItems]}</Tag>);
        listItems = []; listKind = null;
    };
    lines.forEach(line => {
        const h3m = line.match(/^### (.+)/);
        const h2m = line.match(/^## (.+)/);
        const h1m = line.match(/^# (.+)/);
        const ulm = line.match(/^[-*] (.+)/);
        const olm = line.match(/^\d+\. (.+)/);
        if (h3m)      { flush(); els.push(<h4 key={key++}>{inl(h3m[1])}</h4>); }
        else if (h2m) { flush(); els.push(<h3 key={key++}>{inl(h2m[1])}</h3>); }
        else if (h1m) { flush(); els.push(<h2 key={key++}>{inl(h1m[1])}</h2>); }
        else if (ulm) { if (listKind !== 'ul') { flush(); listKind = 'ul'; } listItems.push(<li key={key++}>{inl(ulm[1])}</li>); }
        else if (olm) { if (listKind !== 'ol') { flush(); listKind = 'ol'; } listItems.push(<li key={key++}>{inl(olm[1])}</li>); }
        else if (!line.trim()) { flush(); }
        else {
            const lbl = line.match(/^([A-Z][^:\n]{1,30}): (.+)/);
            if (lbl) { flush(); els.push(<p key={key++}><strong>{lbl[1]}: </strong>{inl(lbl[2])}</p>); }
            else { flush(); els.push(<p key={key++}>{inl(line)}</p>); }
        }
    });
    flush();
    return els;
}

function HubDocModal({ title, content, onClose }) {
    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);
    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal" style={{ maxWidth: 720, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="modal-header">
                    <div style={{ flex: 1 }}>
                        <div className="modal-title">{title}</div>
                        <div className="modal-subtitle">FY27 Global Governance AI Hackathon</div>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>
                <div className="hub-modal-body">
                    {content
                        ? <div className="hub-md">{renderMarkdown(content)}</div>
                        : <span className="hub-modal-empty">Content coming soon.</span>
                    }
                </div>
                <div className="hub-modal-footer">
                    <button className="submit-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
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
                        <div className="modal-subtitle">FY27 Global Governance AI Hackathon · Read before registering</div>
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

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView({ onBack, liveTeams, subTable, sfTeamName, sfStatus, totalTeams, submittedTeams, registeredTeams, spotsLeft, probRecords }) {
    const [adminTab,   setAdminTab]   = useState('registration');
    const [sidebarTab, setSidebarTab] = useState('teams');
    const [search,     setSearch]     = useState('');
    const [filter,     setFilter]     = useState('all');
    const [copied,     setCopied]     = useState(false);

    const sfAttendance    = subTable.getFieldIfExists('Attendance Format');
    const sfProbStatement = subTable.getFieldIfExists('Problem Statement');

    const inPersonCount  = sfAttendance
        ? liveTeams.filter(r => { const a = r.getCellValueAsString(sfAttendance); return a === 'In Person' || a === 'Hybrid'; }).length
        : 0;
    const psClaimedCount = sfProbStatement
        ? liveTeams.filter(r => r.getCellValueAsString(sfProbStatement)).length
        : 0;
    const issueTeams  = liveTeams.filter(r => { const s = sfStatus ? r.getCellValueAsString(sfStatus) : ''; return s !== 'Registered' && s !== 'Submitted'; });
    const issueCount  = issueTeams.length;
    const readyPct    = totalTeams > 0 ? Math.round((submittedTeams / totalTeams) * 100) : 0;
    const kickoffDate = new Date('2026-05-04T05:00:00Z');
    const daysToKickoff = Math.max(0, Math.ceil((kickoffDate - new Date()) / 86400000));

    const displayTeams = useMemo(() => {
        if (sidebarTab !== 'teams') return [];
        let teams = liveTeams;
        if (search.trim()) {
            const q = search.toLowerCase();
            teams = teams.filter(r => (sfTeamName ? r.getCellValueAsString(sfTeamName) : '').toLowerCase().includes(q));
        }
        if (filter === 'issues')    teams = teams.filter(r => { const s = sfStatus ? r.getCellValueAsString(sfStatus) : ''; return s !== 'Registered' && s !== 'Submitted'; });
        else if (filter === 'ready' || filter === 'submitted') teams = teams.filter(r => sfStatus && r.getCellValueAsString(sfStatus) === 'Submitted');
        return teams;
    }, [liveTeams, search, filter, sidebarTab, sfTeamName, sfStatus]);

    const snapshotText = `Hackathon Status — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\nTeams Registered: ${totalTeams} of ${MAX_TEAMS} (${spotsLeft} spots left)\nSubmitted: ${submittedTeams} teams ready\nRegistered: ${registeredTeams} teams confirmed\nIssues: ${issueCount} teams need attention\nProblem Tracks: ${probRecords.length || 12}\nDays to Kickoff: ${daysToKickoff}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(snapshotText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const R = 42, C = 2 * Math.PI * R;
    const dashOffset = C - (readyPct / 100) * C;

    return (
        <div className="adm-wrap">
            {/* Admin Nav */}
            <nav className="adm-nav">
                <button className="adm-nav-back" onClick={onBack}>← Portal</button>
                <div className="adm-nav-sep" />
                <div className="adm-nav-brand">
                    <div className="nav-spark"><SparkIcon size={14} /></div>
                    Admin Dashboard
                </div>
                <div className="adm-nav-tabs">
                    {[['registration','Registration'],['judging','Judging'],['export','Export']].map(([id, label]) => (
                        <button key={id} className={`adm-nav-tab${adminTab === id ? ' active' : ''}`} onClick={() => setAdminTab(id)}>{label}</button>
                    ))}
                </div>
                <span className="adm-badge">ADMIN</span>
            </nav>

            {/* Admin Hero */}
            <div className="adm-hero">
                <div>
                    <div className="adm-hero-pre">Global Governance AI Hackathon · FY27</div>
                    <div className="adm-hero-h1">Admin Dashboard</div>
                    <div className="adm-hero-sub">Team registration, status tracking, and event readiness for the GG AI Hackathon.</div>
                </div>
                <div className="adm-kickoff">
                    <div className="adm-kickoff-num">{daysToKickoff}</div>
                    <div className="adm-kickoff-label">Days to Kickoff</div>
                </div>
            </div>

            {/* Stat Bar */}
            <div className="adm-stat-bar">
                <div className="adm-stat-item"><div className="adm-stat-num">{totalTeams}</div><div className="adm-stat-label">Total Teams</div></div>
                <div className="adm-stat-item"><div className="adm-stat-num">{submittedTeams}</div><div className="adm-stat-label">Ready</div></div>
                <div className="adm-stat-item"><div className={`adm-stat-num${issueCount > 0 ? ' adm-stat-num-red' : ''}`}>{issueCount}</div><div className="adm-stat-label">Issues</div></div>
                <div className="adm-stat-item"><div className="adm-stat-num">{psClaimedCount}</div><div className="adm-stat-label">PS Claimed</div></div>
                <div className="adm-stat-item"><div className="adm-stat-num">{inPersonCount}</div><div className="adm-stat-label">In Person</div></div>
            </div>

            {/* Warning Banner */}
            {issueCount > 0 && (
                <div className="adm-warn">
                    <span className="adm-warn-text">⚠️ {issueCount} team{issueCount > 1 ? 's have' : ' has'} a status issue and may need attention.</span>
                    <button className="adm-warn-btn" onClick={() => { setSidebarTab('teams'); setFilter('issues'); setAdminTab('registration'); }}>Show issues →</button>
                </div>
            )}

            {/* Main Content */}
            {adminTab === 'registration' ? (
                <div className="adm-main">
                    {/* Sidebar */}
                    <div className="adm-sidebar">
                        <div className="adm-sidebar-tabs">
                            <button className={`adm-sidebar-tab${sidebarTab === 'teams' ? ' active' : ''}`} onClick={() => setSidebarTab('teams')}>Teams ({totalTeams})</button>
                            <button className={`adm-sidebar-tab${sidebarTab === 'problems' ? ' active' : ''}`} onClick={() => setSidebarTab('problems')}>Problems ({probRecords.length || 12})</button>
                        </div>
                        {sidebarTab === 'teams' ? (
                            <>
                                <div className="adm-search">
                                    <input className="adm-search-input" placeholder="Search teams…" value={search} onChange={e => setSearch(e.target.value)} />
                                </div>
                                <div className="adm-filters">
                                    {[['all','All'],['issues','Issues'],['ready','Ready'],['submitted','Submitted']].map(([val, lbl]) => (
                                        <button key={val} className={`adm-filter-pill${filter === val ? ' active' : ''}`} onClick={() => setFilter(val)}>{lbl}</button>
                                    ))}
                                </div>
                                <div className="adm-team-list">
                                    {displayTeams.length === 0 ? (
                                        <div style={{padding:'32px 16px',textAlign:'center',color:'#5A7A9A',fontSize:13}}>No teams match this filter.</div>
                                    ) : displayTeams.map(r => {
                                        const name   = sfTeamName ? r.getCellValueAsString(sfTeamName) : r.name;
                                        const status = sfStatus   ? r.getCellValueAsString(sfStatus)   : '';
                                        const badgeCls = status === 'Submitted' ? 'adm-badge-submitted' : status === 'Registered' ? 'adm-badge-registered' : 'adm-badge-issue';
                                        return (
                                            <div key={r.id} className="adm-team-row">
                                                <div className="adm-team-name">{name}</div>
                                                <div className="adm-team-meta">
                                                    <span className={`adm-status-badge ${badgeCls}`}>{status || 'Unknown'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="adm-sidebar-footer">{totalTeams} of {MAX_TEAMS} slots filled · {spotsLeft} remaining</div>
                            </>
                        ) : (
                            <div style={{padding:'40px 16px',textAlign:'center',color:'#5A7A9A',fontSize:13,lineHeight:1.7}}>
                                Problem statement tracking coming soon.
                            </div>
                        )}
                    </div>

                    {/* Right Content — Export & Analytics */}
                    <div className="adm-content">
                        {/* Readiness Donut */}
                        <div className="adm-card">
                            <div className="adm-card-header">
                                <div className="adm-card-title">Registration Readiness</div>
                                <span style={{fontSize:11,color:'#5A7A9A',fontFamily:'Inter,sans-serif'}}>{readyPct}% ready to present</span>
                            </div>
                            <div className="adm-donut-wrap">
                                <svg width={110} height={110} viewBox="0 0 110 110">
                                    <circle cx={55} cy={55} r={R} fill="none" stroke="#f0f4f8" strokeWidth={13} />
                                    <circle cx={55} cy={55} r={R} fill="none" stroke="#0071CE" strokeWidth={13}
                                        strokeLinecap="round"
                                        strokeDasharray={C}
                                        strokeDashoffset={dashOffset}
                                        transform="rotate(-90 55 55)"
                                        style={{transition:'stroke-dashoffset 0.5s ease'}} />
                                    <text x={55} y={55} textAnchor="middle" dominantBaseline="middle" fontSize={15} fontWeight={800} fill="#0B2C5F" fontFamily="Inter,sans-serif">{readyPct}%</text>
                                </svg>
                                <div className="adm-donut-legend">
                                    <div className="adm-donut-legend-item">
                                        <div className="adm-donut-legend-dot" style={{background:'#0071CE'}} />
                                        <span className="adm-donut-legend-label">Submitted</span>
                                        <span className="adm-donut-legend-val">{submittedTeams}</span>
                                    </div>
                                    <div className="adm-donut-legend-item">
                                        <div className="adm-donut-legend-dot" style={{background:'#CFE8FF'}} />
                                        <span className="adm-donut-legend-label">Registered</span>
                                        <span className="adm-donut-legend-val">{registeredTeams}</span>
                                    </div>
                                    {issueCount > 0 && (
                                        <div className="adm-donut-legend-item">
                                            <div className="adm-donut-legend-dot" style={{background:'#FCA5A5'}} />
                                            <span className="adm-donut-legend-label">Issues</span>
                                            <span className="adm-donut-legend-val">{issueCount}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="adm-card">
                            <div className="adm-card-header">
                                <div className="adm-card-title">Key Metrics</div>
                            </div>
                            <div className="adm-metrics-grid">
                                <div className="adm-metric">
                                    <div className="adm-metric-num">{daysToKickoff}</div>
                                    <div className="adm-metric-label">Days to Kickoff</div>
                                </div>
                                <div className="adm-metric">
                                    <div className="adm-metric-num">{probRecords.length || 12}</div>
                                    <div className="adm-metric-label">Problem Tracks</div>
                                </div>
                                <div className="adm-metric">
                                    <div className="adm-metric-num">{spotsLeft}</div>
                                    <div className="adm-metric-label">Spots Left</div>
                                </div>
                            </div>
                        </div>

                        {/* Status Snapshot */}
                        <div className="adm-card">
                            <div className="adm-card-header">
                                <div className="adm-card-title">Status Snapshot</div>
                                <button className={`adm-copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>{copied ? '✓ Copied' : 'Copy'}</button>
                            </div>
                            <div className="adm-snapshot-body">
                                <div><strong>Teams Registered:</strong> {totalTeams} of {MAX_TEAMS} ({spotsLeft} spots left)</div>
                                <div><strong>Submitted:</strong> {submittedTeams} teams ready to present</div>
                                <div><strong>Registered:</strong> {registeredTeams} teams confirmed</div>
                                <div><strong>Issues:</strong> {issueCount} teams need attention</div>
                                <div><strong>Problem Tracks:</strong> {probRecords.length || 12}</div>
                                <div><strong>Days to Kickoff:</strong> {daysToKickoff}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="adm-placeholder">
                    {adminTab === 'judging' ? '🏆 Judging tools — coming soon.' : '📤 Export tools — coming soon.'}
                </div>
            )}
        </div>
    );
}

// ─── REGISTRATION SECTION ─────────────────────────────────────────────────────
function RegistrationSection({
    dirTable, subTable, dirRecords, liveTeams, freeAgents,
    dfName, dfEmail,
    selfRegistered, setSelfRegistered, step1Complete, setStep1Complete,
}) {
    // ── Step 1 state ──────────────────────────────────────────────────────────
    const [selfSelected,    setSelfSelected]   = useState(null);
    const [agreed,          setAgreed]         = useState(false);
    const [tshirtSize,      setTshirtSize]     = useState('');
    const [step1Submitting, setStep1Submitting]= useState(false);
    const [step1Error,      setStep1Error]     = useState('');
    const [step1Done,       setStep1Done]      = useState(false);
    const [duplicateStatus, setDuplicateStatus]= useState(null); // null | 'on-team' | 'free-agent'
    const [duplicateTeamName, setDuplicateTeamName] = useState('');

    // ── Add Yourself form state ───────────────────────────────────────────────
    const [showAddSelf,     setShowAddSelf]    = useState(false);
    const [noDirectoryMatch, setNoDirectoryMatch] = useState(false);
    const [addFirstName,    setAddFirstName]   = useState('');
    const [addLastName,     setAddLastName]    = useState('');
    const [addEmail,        setAddEmail]       = useState('');
    const [addAssocType,    setAddAssocType]   = useState('');
    const [addSubmitting,   setAddSubmitting]  = useState(false);
    const [addError,        setAddError]       = useState('');
    const [addEmailMatch,   setAddEmailMatch]  = useState(null);

    // ── Step 2 state ──────────────────────────────────────────────────────────
    const [joinConfirmTeam,   setJoinConfirmTeam]  = useState(null);
    const [joinSubmitting,    setJoinSubmitting]   = useState(false);
    const [joinError,         setJoinError]        = useState('');
    const [joinSuccess,       setJoinSuccess]      = useState('');
    const [createName,        setCreateName]       = useState('');
    const [createSubmitting,  setCreateSubmitting] = useState(false);
    const [createError,       setCreateError]      = useState('');
    const [createSuccess,     setCreateSuccess]    = useState('');
    const [hideFullTeams,     setHideFullTeams]    = useState(false);
    const [teamPage,          setTeamPage]         = useState(0);
    const [captainLeaveChoice, setCaptainLeaveChoice] = useState(null); // null | 'reassign' | 'disband'
    const [reassignTo,         setReassignTo]          = useState('');
    const [leaveConfirm,       setLeaveConfirm]        = useState(null); // null | teamRec
    const [leaveSubmitting,    setLeaveSubmitting]      = useState(false);
    const [leaveSuccess,       setLeaveSuccess]         = useState('');
    const [agentSearch,        setAgentSearch]         = useState('');
    const [teamSearch,         setTeamSearch]          = useState('');
    const [showCreateModal,    setShowCreateModal]     = useState(false);

    const userDirId = selfRegistered ? selfRegistered.id : null;

    const dirRecordsRef = useRef(dirRecords);
    dirRecordsRef.current = dirRecords;

    // ── Check if selected person is already registered ────────────────────────
    function checkDuplicate(selected) {
        if (!selected) { setDuplicateStatus(null); return; }
        const rec = dirRecords.find(r => r.id === selected.id);
        const confirmed   = rec ? safeGetCellValue(rec, 'Confirmed') : false;
        const isFreeAgent = rec ? safeGetCellValue(rec, 'Free Agent Registration') : false;
        const onTeam      = findUserOnTeam(liveTeams, selected.id);
        if (onTeam) {
            setDuplicateStatus('on-team');
            setDuplicateTeamName(onTeam.teamName);
            // Already on a team — still identify them so Step 2 is accessible
            setSelfRegistered({ id: selected.id, name: selected.name, email: selected.email || '' });
            setStep1Complete(true);
        } else if (confirmed || isFreeAgent) {
            setDuplicateStatus('free-agent');
            setDuplicateTeamName('');
            // Already registered as free agent — unlock Step 2 immediately
            setSelfRegistered({ id: selected.id, name: selected.name, email: selected.email || '' });
            setStep1Complete(true);
        } else {
            setDuplicateStatus(null);
        }
    }

    function handleSelfSelect(val) {
        setSelfSelected(val);
        checkDuplicate(val);
    }

    // ── Step 1 submit ─────────────────────────────────────────────────────────
    async function handleStep1Submit() {
        if (!selfSelected) { setStep1Error('Please find and select yourself from the directory first.'); return; }
        if (!agreed)        { setStep1Error('You must agree to the rules to register.'); return; }
        if (!tshirtSize)    { setStep1Error('Please select a T-Shirt size.'); return; }
        setStep1Error('');
        setStep1Submitting(true);
        try {
            const confirmedField     = dirTable.getFieldIfExists('Confirmed');
            const rulesField         = dirTable.getFieldIfExists('Rules Attestation');
            const freeAgentField     = dirTable.getFieldIfExists('Free Agent Registration');
            const tshirtField        = dirTable.getFieldIfExists('T-Shirt Size');
            const updates = {};
            if (confirmedField)     updates[confirmedField.id]     = true;
            if (rulesField)         updates[rulesField.id]         = true;
            if (freeAgentField)     updates[freeAgentField.id]     = true;
            if (tshirtField)        updates[tshirtField.id]        = { name: tshirtSize };
            await dirTable.updateRecordAsync(selfSelected.id, updates);
            setSelfRegistered({ id: selfSelected.id, name: selfSelected.name, email: selfSelected.email });
            setStep1Complete(true);
            setStep1Done(true);
        } catch (err) {
            const msg = (err?.message ?? '').toLowerCase();
            const isPerms = msg.includes('permission') || msg.includes('not authorized') || msg.includes('read only');
            setStep1Error(isPerms
                ? `Write access required. Please complete registration via the external form: ${EXTERNAL_FORM_URL}`
                : (err?.message || 'Something went wrong. Please try again.')
            );
        } finally {
            setStep1Submitting(false);
        }
    }

    // ── Add Yourself ──────────────────────────────────────────────────────────
    function resetAddSelfForm() {
        setAddFirstName('');
        setAddLastName('');
        setAddEmail('');
        setAddAssocType('');
        setAddError('');
        setAddEmailMatch(null);
    }

    async function handleAddSelf() {
        if (!addFirstName.trim() || !addLastName.trim() || !addEmail.trim() || !addAssocType) {
            setAddError('All fields are required.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addEmail.trim())) {
            setAddError('Please enter a valid work email.');
            return;
        }
        setAddError('');
        const emailLower = addEmail.trim().toLowerCase();
        const existing = dirRecords.find(r => safeGetCellValueAsString(r, 'Work Email').trim().toLowerCase() === emailLower);
        if (existing) {
            setAddEmailMatch(existing);
            return;
        }
        // Capture values before async/reset clears state
        const capturedFirstName = addFirstName.trim();
        const capturedLastName  = addLastName.trim();
        const capturedEmail     = addEmail.trim();
        const capturedAssocType = addAssocType;

        setAddSubmitting(true);
        try {
            const f1 = dirTable.getFieldIfExists('First Name');
            const f2 = dirTable.getFieldIfExists('Last Name');
            const f3 = dirTable.getFieldIfExists('Work Email');
            const f4 = dirTable.getFieldIfExists('Associate Type');
            const fields = {};
            if (f1) fields[f1.id] = capturedFirstName;
            if (f2) fields[f2.id] = capturedLastName;
            if (f3) fields[f3.id] = capturedEmail;
            if (f4) fields[f4.id] = { name: capturedAssocType };
            await dirTable.createRecordAsync(fields);
            setShowAddSelf(false);
            resetAddSelfForm();
            // Poll for the new record using ref for fresh dirRecords
            const pollForRecord = (attempts = 0) => {
                if (attempts > 10) return;
                const currentRecords = dirRecordsRef.current;
                const newRec = currentRecords.find(r =>
                    safeGetCellValueAsString(r, 'Work Email').trim().toLowerCase() === emailLower
                );
                if (newRec) {
                    const name  = dfName  ? newRec.getCellValueAsString(dfName)  : `${capturedFirstName} ${capturedLastName}`;
                    const email = dfEmail ? newRec.getCellValueAsString(dfEmail) : capturedEmail;
                    handleSelfSelect({ id: newRec.id, name, email });
                } else {
                    setTimeout(() => pollForRecord(attempts + 1), 500);
                }
            };
            pollForRecord();
        } catch (err) {
            setAddError(err?.message || 'Failed to add. Please try again.');
        } finally {
            setAddSubmitting(false);
        }
    }

    function handleEmailMatchSelect(rec) {
        const name  = dfName  ? rec.getCellValueAsString(dfName)  : safeGetCellValueAsString(rec, 'Full Name');
        const email = dfEmail ? rec.getCellValueAsString(dfEmail) : safeGetCellValueAsString(rec, 'Work Email');
        handleSelfSelect({ id: rec.id, name, email });
        setAddEmailMatch(null);
        setShowAddSelf(false);
    }

    // ── Step 2: Join Team ─────────────────────────────────────────────────────
    async function handleJoinTeam(teamRecord) {
        if (!userDirId) { setJoinError('Complete Step 1 first.'); return; }
        setJoinSubmitting(true);
        setJoinError('');
        try {
            // Check if already on a team → need to leave first
            const existing = findUserOnTeam(liveTeams, userDirId);
            if (existing) {
                if (!existing.isCaptain) {
                    // Simple removal
                    const oldField = subTable.getFieldIfExists(existing.slot);
                    if (oldField) {
                        await subTable.updateRecordAsync(existing.team.id, { [oldField.id]: [] });
                    }
                }
                // If captain, the UI should have prevented this path — skip for safety
            }
            // Find first empty slot
            const slots = ['Team Member # 2', 'Team Member # 3', 'Team Member # 4', 'Team Member # 5'];
            let placed = false;
            for (const slotName of slots) {
                const val = safeGetCellValue(teamRecord, slotName);
                if (!val || (Array.isArray(val) && val.length === 0)) {
                    const f = subTable.getFieldIfExists(slotName);
                    if (f) {
                        await subTable.updateRecordAsync(teamRecord.id, { [f.id]: [{ id: userDirId }] });
                        placed = true;
                        break;
                    }
                }
            }
            if (!placed) { setJoinError('This team is full.'); return; }
            // Remove from free agent pool
            const faField = dirTable.getFieldIfExists('Free Agent Registration');
            if (faField) await dirTable.updateRecordAsync(userDirId, { [faField.id]: false });
            const tName = safeGetCellValueAsString(teamRecord, 'Team Name');
            setJoinSuccess(`✓ You've joined ${tName}! You can see your team in the Active Participants list below.`);
            setJoinConfirmTeam(null);
        } catch (err) {
            setJoinError(err?.message || 'Failed to join team. Please try again.');
        } finally {
            setJoinSubmitting(false);
        }
    }

    // ── Step 2: Leave Team → back to free agent pool ─────────────────────────
    async function handleLeaveTeam(teamRecord) {
        if (!userDirId) return;
        const membership = findUserOnTeam([teamRecord], userDirId);
        if (!membership) return;
        if (membership.isCaptain) { setLeaveConfirm(null); return; } // shouldn't reach here
        setLeaveSubmitting(true);
        try {
            const slotField = subTable.getFieldIfExists(membership.slot);
            if (slotField) await subTable.updateRecordAsync(teamRecord.id, { [slotField.id]: [] });
            const faField = dirTable.getFieldIfExists('Free Agent Registration');
            if (faField) await dirTable.updateRecordAsync(userDirId, { [faField.id]: true });
            setLeaveConfirm(null);
            setLeaveSuccess('✓ You\'ve left the team and returned to the free agent pool.');
            setJoinSuccess('');
        } catch (err) {
            setLeaveConfirm(null);
        } finally {
            setLeaveSubmitting(false);
        }
    }

    // ── Step 2: Create Team ───────────────────────────────────────────────────
    async function handleCreateTeam() {
        if (!userDirId) { setCreateError('Complete Step 1 first.'); return; }
        if (!createName.trim()) { setCreateError('Team name is required.'); return; }
        const nameExists = liveTeams.some(r =>
            safeGetCellValueAsString(r, 'Team Name').trim().toLowerCase() === createName.trim().toLowerCase()
        );
        if (nameExists) { setCreateError('A team with this name already exists.'); return; }
        setCreateSubmitting(true);
        setCreateError('');
        try {
            // If already on a team (non-captain), leave first
            const existing = findUserOnTeam(liveTeams, userDirId);
            if (existing && !existing.isCaptain) {
                const oldField = subTable.getFieldIfExists(existing.slot);
                if (oldField) await subTable.updateRecordAsync(existing.team.id, { [oldField.id]: [] });
            }
            const fields = {};
            const f1 = subTable.getFieldIfExists('Team Name');
            const f2 = subTable.getFieldIfExists('Submission Status');
            const f3 = subTable.getFieldIfExists('Team Member # 1 (Captain)');
            if (f1) fields[f1.id] = createName.trim();
            if (f2) fields[f2.id] = { name: 'Registered' };
            if (f3) fields[f3.id] = [{ id: userDirId }];
            await subTable.createRecordAsync(fields);
            const faField = dirTable.getFieldIfExists('Free Agent Registration');
            if (faField) await dirTable.updateRecordAsync(userDirId, { [faField.id]: false });
            setCreateSuccess(`✓ ${createName.trim()} created! You're the team captain. Share this page with teammates so they can join.`);
            setCreateName('');
        } catch (err) {
            setCreateError(err?.message || 'Failed to create team. Please try again.');
        } finally {
            setCreateSubmitting(false);
        }
    }

    // ── Computed values ───────────────────────────────────────────────────────
    const currentMembership = userDirId ? findUserOnTeam(liveTeams, userDirId) : null;
    const step1State = step1Done || (selfRegistered && selfRegistered.id) ? 'done' : 'active';
    const step2State = (step1Done || (selfRegistered && selfRegistered.id)) ? 'active' : 'pending';

    return (
        <>
        {/* Step Indicator */}
        <div className="step-indicator">
            {[
                { num: '1', label: 'Register Yourself', state: step1State },
                { num: '2', label: 'Join or Create a Team', state: step2State },
            ].map(({ num, label, state }) => (
                <div key={num} className="step-ind-node">
                    <div className={`step-circle ${state === 'done' ? 'step-circle-done' : state === 'active' ? 'step-circle-active' : 'step-circle-pending'}`}>
                        {state === 'done' ? '✓' : num}
                    </div>
                    <div className={`step-ind-label ${state === 'pending' ? 'step-ind-label-inactive' : 'step-ind-label-active'}`}>{label}</div>
                </div>
            ))}
        </div>

        {/* BLOCK 1: Register Yourself */}
        <div className="step-block">
            <div className="step-block-header">Step 1 — Register for the Event</div>
            <div className="step-card step-card-hero">
                <div className="step-card-title">Register for the Event</div>
                <div className="step-card-sub">Find yourself in the Walmart directory, agree to the rules, and register as a participant. Everyone starts as a free agent — you'll join or create a team in Step 2.</div>

                {step1Done || (selfRegistered && selfRegistered.id) ? (
                    <div className="step-success">
                        <span style={{fontSize:18}}>✓</span>
                        <div className="step-success-text">
                            You're registered as <strong>{selfRegistered ? selfRegistered.name : 'a participant'}</strong>! Join or create a team below — or stay in the free agent pool for assignment.
                        </div>
                    </div>
                ) : (
                    <>
                        <MemberSearch
                            label="Find Yourself in the Directory"
                            dirRecords={dirRecords}
                            nameField={dfName}
                            emailField={dfEmail}
                            selected={selfSelected}
                            onSelect={handleSelfSelect}
                            onNoResults={setNoDirectoryMatch}
                        />

                        {duplicateStatus === 'on-team' && (
                            <div className="step-warn">
                                <span>⚠️</span>
                                <div className="step-warn-text">You have already registered and are on team <strong>{duplicateTeamName}</strong>. If you need to make changes, please reach out to the Internal Support Team.</div>
                            </div>
                        )}
                        {duplicateStatus === 'free-agent' && (
                            <div className="step-info">
                                <span>ℹ️</span>
                                <div className="step-info-text">You're already registered and in the free agent pool. Scroll down to Step 2 to join or create a team.</div>
                            </div>
                        )}

                        <div style={{marginTop:12}} className={noDirectoryMatch ? 'add-self-highlight' : ''}>
                            <button className={`hub-card-link${noDirectoryMatch ? ' add-self-link-alert' : ''}`} onClick={() => setShowAddSelf(true)}>
                                {noDirectoryMatch ? '⚠ Not found — ' : ''}Can't find your name? Add yourself to the directory →
                            </button>
                        </div>

                        <div className="fr" style={{marginTop:12}}>
                            <label className="form-label">T-Shirt Size<span className="req">*</span></label>
                            <div className="radio-group" style={{marginTop:6,flexWrap:'wrap'}}>
                                {['XXS','XS','S','M','L','XL','XXL','XXXL','XXXXL'].map(size => (
                                    <div className="rp" key={size}>
                                        <input type="radio" id={`ts-${size}`} name="tshirtSize" value={size} checked={tshirtSize === size} onChange={() => setTshirtSize(size)} autoComplete="off" />
                                        <label htmlFor={`ts-${size}`}>{size}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="fr" style={{marginTop:16}}>
                            <div className="ck-row">
                                <input type="checkbox" id="s1agreed" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                                <label className="ck-label" htmlFor="s1agreed">
                                    I have read the <a href={RULES_URL} target="_blank" rel="noreferrer">hackathon rules & guidelines</a> and agree to follow them.
                                </label>
                            </div>
                        </div>

                        {step1Error && <div className="submit-err" style={{marginTop:8}}>{step1Error}</div>}

                        <button
                            className="btn-primary"
                            style={{marginTop:16}}
                            disabled={step1Submitting || duplicateStatus !== null}
                            onClick={handleStep1Submit}
                        >
                            {step1Submitting ? <><span className="spinner"/> Registering…</> : 'Register as Participant →'}
                        </button>
                    </>
                )}
            </div>
        </div>

        {/* BLOCK 2: Team Builder */}
        <div className="step-block">
            <div className="step-block-header">Step 2 — Join or Create a Team</div>

            {(() => { return null; })() /* gate removed — builder always visible */}
                <div className="tb-container">
                    {/* LEFT: Free Agent Pool */}
                    <div className="tb-sidebar">
                        <span className="tb-sidebar-badge">Free Agent Pool</span>
                        <div className="tb-sidebar-count">{freeAgents.length} unplaced</div>

                        {/* Search bar */}
                        <div className="tb-search-wrap">
                            <MagnifyingGlassIcon size={14} color={T.muted} style={{position:'absolute',left:10,top:9}} />
                            <input
                                className="tb-search-input"
                                placeholder="Search free agents..."
                                autoComplete="off" autoCorrect="off" autoCapitalize="off"
                                spellCheck={false} data-lpignore="true" data-form-type="other"
                                value={agentSearch}
                                onChange={e => setAgentSearch(e.target.value)}
                            />
                        </div>

                        {/* Grouped agent list */}
                        <div className="tb-agent-list">
                            {(() => {
                                const filtered = freeAgents.filter(a => {
                                    const name = safeGetCellValueAsString(a, 'Full Name').toLowerCase();
                                    return name.includes(agentSearch.toLowerCase());
                                });
                                if (filtered.length === 0) return (
                                    <div className="tb-empty">{agentSearch ? 'No matches' : 'No free agents'}</div>
                                );
                                const groups = {};
                                filtered.forEach(a => {
                                    const lastName = safeGetCellValueAsString(a, 'Last Name').trim();
                                    const initial = lastName ? lastName[0].toUpperCase() : '#';
                                    if (!groups[initial]) groups[initial] = [];
                                    groups[initial].push(a);
                                });
                                return Object.keys(groups).sort().map(letter => (
                                    <div key={letter} className="tb-agent-group">
                                        <div className="tb-agent-group-label">{letter}</div>
                                        {groups[letter].map(agent => {
                                            const name = safeGetCellValueAsString(agent, 'Full Name');
                                            const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
                                            const isMe = userDirId && agent.id === userDirId;
                                            return (
                                                <div key={agent.id} className="tb-agent-row" style={isMe ? {borderColor:T.blue,background:'#EFF6FF'} : {}}>
                                                    <div className="tb-avatar" style={{background: isMe ? T.blue : '#334155', color:'white'}}>{initials}</div>
                                                    <div className="tb-agent-info">
                                                        <div className="tb-agent-name">{name}{isMe ? ' (you)' : ''}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* RIGHT: Team Grid */}
                    <div className="tb-main">
                        {/* Toolbar: search + hide full + create */}
                        <div className="tb-toolbar">
                            <div className="tb-toolbar-left">
                                <div className="tb-search-wrap" style={{flex:1}}>
                                    <MagnifyingGlassIcon size={14} color={T.muted} style={{position:'absolute',left:10,top:9}} />
                                    <input
                                        className="tb-search-input"
                                        placeholder="Search teams or members..."
                                        autoComplete="off" autoCorrect="off" autoCapitalize="off"
                                        spellCheck={false} data-lpignore="true" data-form-type="other"
                                        value={teamSearch}
                                        onChange={e => { setTeamSearch(e.target.value); setTeamPage(0); }}
                                    />
                                </div>
                                <button className="tb-toggle-btn" onClick={() => setHideFullTeams(h => !h)}>
                                    {hideFullTeams ? 'Show full' : 'Hide full'}
                                </button>
                            </div>
                            <button
                                className="tb-create-btn"
                                disabled={!!(currentMembership && currentMembership.isCaptain) || !userDirId}
                                onClick={() => setShowCreateModal(true)}
                            >
                                + Create Team
                            </button>
                        </div>

                        {createSuccess && <div className="step-success" style={{marginTop:0}}><span>✓</span><div className="step-success-text">{createSuccess}</div></div>}

                        {/* Team Cards — Paginated Gallery */}
                        {(() => {
                            const PAGE_SIZE = 6;
                            const slotFields = ['Team Member # 1 (Captain)','Team Member # 2','Team Member # 3','Team Member # 4','Team Member # 5'];
                            const displayTeams = liveTeams.filter(t => {
                                if (hideFullTeams) {
                                    const count = slotFields.filter(s => { const v = safeGetCellValue(t, s); return v && Array.isArray(v) && v.length > 0; }).length;
                                    if (count >= 5) return false;
                                }
                                if (teamSearch.trim()) {
                                    const q = teamSearch.toLowerCase();
                                    if (safeGetCellValueAsString(t, 'Team Name').toLowerCase().includes(q)) return true;
                                    for (const s of slotFields) {
                                        const val = safeGetCellValue(t, s);
                                        if (Array.isArray(val) && val.length > 0 && val[0].name && val[0].name.toLowerCase().includes(q)) return true;
                                    }
                                    return false;
                                }
                                return true;
                            });
                            const totalPages = Math.max(1, Math.ceil(displayTeams.length / PAGE_SIZE));
                            const safePage   = Math.min(teamPage, totalPages - 1);
                            const pageTeams  = displayTeams.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

                            if (displayTeams.length === 0) return (
                                <div className="tb-empty" style={{padding:'40px 0',textAlign:'center'}}>
                                    {liveTeams.length === 0 ? 'No teams yet — create the first one above.' : 'All teams are full.'}
                                </div>
                            );

                            return (
                                <>
                                    {/* Pagination Nav */}
                                    {totalPages > 1 && (
                                        <div className="tb-page-nav">
                                            <button className="tb-page-arrow" disabled={safePage === 0} onClick={() => setTeamPage(p => Math.max(0, p - 1))}>‹</button>
                                            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                                                <div className="tb-page-dots">
                                                    {Array.from({length:totalPages}).map((_,i) => (
                                                        <button key={i} className={`tb-page-dot${i === safePage ? ' active' : ''}`} onClick={() => setTeamPage(i)} />
                                                    ))}
                                                </div>
                                                <div className="tb-page-label">Page {safePage + 1} of {totalPages} · {displayTeams.length} teams</div>
                                            </div>
                                            <button className="tb-page-arrow" disabled={safePage >= totalPages - 1} onClick={() => setTeamPage(p => Math.min(totalPages - 1, p + 1))}>›</button>
                                        </div>
                                    )}

                                    <div className="tb-grid">
                                        {pageTeams.map(teamRec => {
                                            const tName      = safeGetCellValueAsString(teamRec, 'Team Name');
                                            const status     = safeGetCellValueAsString(teamRec, 'Submission Status');
                                            const attendance = safeGetCellValueAsString(teamRec, 'Attendance Format');
                                            const memberSlotDefs = [
                                                { label:'Captain',  field:'Team Member # 1 (Captain)', isCaptain:true  },
                                                { label:'Member 2', field:'Team Member # 2',            isCaptain:false },
                                                { label:'Member 3', field:'Team Member # 3',            isCaptain:false },
                                                { label:'Member 4', field:'Team Member # 4',            isCaptain:false },
                                                { label:'Member 5', field:'Team Member # 5',            isCaptain:false },
                                            ];
                                            let filledCount = 0;
                                            const slots = memberSlotDefs.map(({ label, field, isCaptain }) => {
                                                const link = safeGetCellValue(teamRec, field);
                                                const filled = Array.isArray(link) && link.length > 0;
                                                if (filled) filledCount++;
                                                return { label, field, isCaptain, filled, memberName: filled ? link[0].name : null };
                                            });
                                            const openCount = 5 - filledCount;
                                            const isOnThisTeam = userDirId ? findUserOnTeam([teamRec], userDirId) !== null : false;
                                            const isCurrentCaptain = currentMembership && currentMembership.isCaptain;
                                            const isConfirming = joinConfirmTeam?.id === teamRec.id;
                                            const statusColor = status === 'Registered' ? '#15803D' : status === 'Pending' ? '#A16207' : '#1D4ED8';
                                            const statusBg    = status === 'Registered' ? '#DCFCE7'  : status === 'Pending' ? '#FEF3C7'  : '#EFF6FF';

                                            return (
                                                <div key={teamRec.id} id={`tb-card-${teamRec.id}`} className="tb-card" style={isConfirming ? {borderColor:'#0071CE',boxShadow:'0 0 0 2px rgba(0,113,206,0.18)'} : {}}>
                                                    <div className="tb-card-header">
                                                        <div className="tb-card-name">{tName}</div>
                                                        <div className="tb-card-pills">
                                                            {status    && <span className="tb-pill" style={{background:statusBg,color:statusColor}}>{status}</span>}
                                                            {attendance && <span className="tb-pill" style={{background:'#F4F7FB',color:'#5A7A9A'}}>{attendance}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="tb-card-slots">
                                                        {slots.map(({ label, field, isCaptain, filled, memberName }) => (
                                                            <div key={field} className={`tb-slot${filled ? ' tb-slot-filled' : ''}`}>
                                                                {filled ? (
                                                                    <>
                                                                        <div className="tb-slot-avatar" style={{background:'#0071CE',color:'white'}}>
                                                                            {(memberName||'').split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?'}
                                                                        </div>
                                                                        <div className="tb-slot-name">{memberName}</div>
                                                                        {isCaptain && <span className="tb-cap-badge">CAP</span>}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="tb-slot-empty-dot" />
                                                                        <div className="tb-slot-empty-label">{label} — open</div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="tb-card-footer">
                                                        <div className="tb-card-count">{filledCount}/5 · {openCount} open</div>
                                                        {isOnThisTeam ? (
                                                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                                                                <span style={{fontSize:11,fontWeight:700,color:'#15803D'}}>You're here ✓</span>
                                                                {!isCurrentCaptain && (
                                                                    <button
                                                                        className="tb-leave-btn"
                                                                        disabled={leaveSubmitting}
                                                                        onClick={() => setLeaveConfirm(leaveConfirm?.id === teamRec.id ? null : teamRec)}
                                                                    >
                                                                        Leave
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : openCount > 0 ? (
                                                            <button
                                                                className="tb-card-join-btn"
                                                                disabled={joinSubmitting || !!isCurrentCaptain}
                                                                style={isConfirming ? {background:'#0B2C5F'} : {}}
                                                                onClick={() => {
                                                                    if (isCurrentCaptain) { setJoinError('Assign a new captain before joining another team.'); return; }
                                                                    setJoinConfirmTeam(isConfirming ? null : teamRec);
                                                                    setJoinError('');
                                                                    if (!isConfirming) {
                                                                        setTimeout(() => {
                                                                            const el = document.getElementById(`tb-card-${teamRec.id}`);
                                                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        }, 50);
                                                                    }
                                                                }}
                                                            >
                                                                {isConfirming ? 'Cancel' : currentMembership && !isOnThisTeam ? 'Switch →' : 'Join →'}
                                                            </button>
                                                        ) : (
                                                            <span className="tb-card-full">Full</span>
                                                        )}
                                                    </div>

                                                    {/* Leave confirm — inline on this card */}
                                                    {leaveConfirm?.id === teamRec.id && (
                                                        <div className="tb-card-confirm" style={{background:'#FFF8E6',borderColor:'rgba(161,98,7,0.3)'}}>
                                                            <div className="tb-card-confirm-text" style={{color:'#78500E'}}>
                                                                Leave <strong>{tName}</strong> and return to the free agent pool?
                                                            </div>
                                                            <div className="confirm-btns">
                                                                <button className="confirm-btn-yes" style={{background:'#B91C1C'}} disabled={leaveSubmitting} onClick={() => handleLeaveTeam(teamRec)}>
                                                                    {leaveSubmitting ? <><span className="spinner"/> Leaving…</> : 'Leave Team'}
                                                                </button>
                                                                <button className="confirm-btn-no" onClick={() => setLeaveConfirm(null)}>Cancel</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Inline confirm — appears on this card */}
                                                    {isConfirming && (
                                                        <div className="tb-card-confirm">
                                                            <div className="tb-card-confirm-text">
                                                                {currentMembership
                                                                    ? <>Leave <strong>{currentMembership.teamName}</strong> and join <strong>{tName}</strong>?</>
                                                                    : <>Join <strong>{tName}</strong>? You'll be added as a member.</>
                                                                }
                                                            </div>
                                                            {joinError && <div className="ferr" style={{marginBottom:8}}>{joinError}</div>}
                                                            <div className="confirm-btns">
                                                                <button className="confirm-btn-yes" disabled={joinSubmitting} onClick={() => handleJoinTeam(teamRec)}>
                                                                    {joinSubmitting ? <><span className="spinner"/> Joining…</> : 'Confirm'}
                                                                </button>
                                                                <button className="confirm-btn-no" onClick={() => { setJoinConfirmTeam(null); setJoinError(''); }}>Cancel</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Bottom pagination for quick navigation */}
                                    {totalPages > 1 && (
                                        <div className="tb-page-nav" style={{marginTop:4}}>
                                            <button className="tb-page-arrow" disabled={safePage === 0} onClick={() => setTeamPage(p => Math.max(0, p - 1))}>‹</button>
                                            <span className="tb-page-label">{safePage + 1} / {totalPages}</span>
                                            <button className="tb-page-arrow" disabled={safePage >= totalPages - 1} onClick={() => setTeamPage(p => Math.min(totalPages - 1, p + 1))}>›</button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                        {joinError && !joinConfirmTeam && <div className="ferr" style={{marginTop:8}}>{joinError}</div>}
                        {joinSuccess && <div className="step-success" style={{marginTop:12}}><span>✓</span><div className="step-success-text">{joinSuccess}</div></div>}
                        {leaveSuccess && <div className="step-success" style={{marginTop:12}}><span>✓</span><div className="step-success-text">{leaveSuccess}</div></div>}
                    </div>
                </div>

            {/* Free Agent Note */}
            <div className="free-agent-note" style={{marginTop:24}}>
                <strong>Don't have a team yet?</strong> No problem — you're already in the free agent pool after completing Step 1. The organizing committee will assign you to a team before kickoff. Once you're placed on a team, you'll automatically be removed from the free agent pool.
            </div>
        </div>

        {/* Add Yourself Modal */}
        {showAddSelf && (
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowAddSelf(false); resetAddSelfForm(); } }}>
                <div className="modal" style={{maxWidth:480}}>
                    <div className="modal-header">
                        <div>
                            <div className="modal-title">Add Yourself to the Directory</div>
                            <div className="modal-subtitle">Fill out the fields below to register for the hackathon.</div>
                        </div>
                        <button className="modal-close" onClick={() => { setShowAddSelf(false); resetAddSelfForm(); }}>✕</button>
                    </div>
                    <div className="modal-body">
                        {addEmailMatch ? (
                            <div className="step-info" style={{marginBottom:12}}>
                                <div>
                                    <div className="step-info-text">
                                        We found <strong>{safeGetCellValueAsString(addEmailMatch, 'Full Name') || 'someone'}</strong> with that email. Is this you?
                                    </div>
                                    <button className="join-btn" style={{marginTop:8}} onClick={() => { handleEmailMatchSelect(addEmailMatch); setShowAddSelf(false); resetAddSelfForm(); }}>
                                        Yes, Select Me
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="fr-2">
                                    <div className="fr">
                                        <label className="form-label">First Name<span className="req">*</span></label>
                                        <input className="fi" placeholder="First" value={addFirstName} onChange={e => setAddFirstName(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-lpignore="true" data-form-type="other" />
                                    </div>
                                    <div className="fr">
                                        <label className="form-label">Last Name<span className="req">*</span></label>
                                        <input className="fi" placeholder="Last" value={addLastName} onChange={e => setAddLastName(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-lpignore="true" data-form-type="other" />
                                    </div>
                                </div>
                                <div className="fr">
                                    <label className="form-label">Work Email<span className="req">*</span></label>
                                    <input className="fi" type="email" placeholder="you@walmart.com" value={addEmail} onChange={e => setAddEmail(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-lpignore="true" data-form-type="other" />
                                </div>
                                <div className="fr">
                                    <label className="form-label">Associate Type<span className="req">*</span></label>
                                    <div className="radio-group" style={{marginTop:6}}>
                                        {['Full-Time','Temp','Part-Time','Volunteer','Other'].map(t => (
                                            <div className="rp" key={t}>
                                                <input type="radio" id={`at-${t}`} name="addAssocType" value={t} checked={addAssocType===t} onChange={() => setAddAssocType(t)} autoComplete="off" />
                                                <label htmlFor={`at-${t}`}>{t}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {addError && <div className="ferr">{addError}</div>}
                            </>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button className="cancel-btn" onClick={() => { setShowAddSelf(false); resetAddSelfForm(); }}>Cancel</button>
                        {!addEmailMatch && (
                            <button className="submit-btn" disabled={addSubmitting} onClick={async () => {
                                await handleAddSelf();
                            }}>
                                {addSubmitting ? <><span className="spinner"/> Adding…</> : 'Register & Add to Directory'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
                <div className="modal" style={{maxWidth:480}}>
                    <div className="modal-header">
                        <div>
                            <div className="modal-title">Create a New Team</div>
                            <div className="modal-subtitle">You will be assigned as team captain.</div>
                        </div>
                        <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
                    </div>
                    <div className="modal-body">
                        <div className="fr">
                            <label className="form-label">Team Name<span className="req">*</span></label>
                            <input
                                className="fi"
                                placeholder="e.g. The Compliance Crushers"
                                autoComplete="off" autoCorrect="off" autoCapitalize="off"
                                spellCheck={false} data-lpignore="true" data-form-type="other"
                                value={createName}
                                onChange={e => setCreateName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && createName.trim() && !createSubmitting) handleCreateTeam().then(() => { if (!createError) setShowCreateModal(false); }); }}
                            />
                        </div>
                        <div className="fr" style={{marginTop:12}}>
                            <label className="form-label">Team Captain</label>
                            <div style={{padding:'10px 14px',background:T.cloud,border:'1px solid '+T.border,borderRadius:6,fontSize:13,color:T.deep,fontWeight:600}}>
                                {selfRegistered ? selfRegistered.name : 'You'} <span style={{fontSize:10,color:T.muted,fontWeight:400,marginLeft:6}}>Captain</span>
                            </div>
                        </div>
                        {createError && <div className="ferr" style={{marginTop:8}}>{createError}</div>}
                    </div>
                    <div className="modal-footer">
                        <button className="cancel-btn" onClick={() => { setShowCreateModal(false); setCreateError(''); setCreateName(''); }}>Cancel</button>
                        <button
                            className="submit-btn"
                            disabled={createSubmitting || !createName.trim()}
                            onClick={async () => {
                                await handleCreateTeam();
                                if (!createError) setShowCreateModal(false);
                            }}
                        >
                            {createSubmitting ? <><span className="spinner"/> Creating…</> : 'Create Team →'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

// ─── FIND USER ON TEAM ────────────────────────────────────────────────────────
function findUserOnTeam(liveTeams, userId) {
    const slots = [
        'Team Member # 1 (Captain)',
        'Team Member # 2',
        'Team Member # 3',
        'Team Member # 4',
        'Team Member # 5',
    ];
    for (const team of liveTeams) {
        for (const slot of slots) {
            const val = safeGetCellValue(team, slot);
            if (Array.isArray(val) && val.some(link => link.id === userId)) {
                return {
                    team,
                    slot,
                    teamName: safeGetCellValueAsString(team, 'Team Name'),
                    isCaptain: slot.includes('Captain'),
                };
            }
        }
    }
    return null;
}

// ─── ROSTER MODAL ─────────────────────────────────────────────────────────────
function RosterModal({ record: r, onClose }) {
    const name       = safeGetCellValueAsString(r, 'Team Name');
    const tech       = safeGetCellValueAsString(r, 'Technology');
    const status     = safeGetCellValueAsString(r, 'Submission Status');
    const useCase    = safeGetCellValueAsString(r, 'Use Case');
    const attendance = safeGetCellValueAsString(r, 'Attendance Format');
    const memberData = [
        { label: 'Captain',   value: safeGetCellValue(r, 'Team Member # 1 (Captain)'), isCaptain: true  },
        { label: 'Member 2',  value: safeGetCellValue(r, 'Team Member # 2'),           isCaptain: false },
        { label: 'Member 3',  value: safeGetCellValue(r, 'Team Member # 3'),           isCaptain: false },
        { label: 'Member 4',  value: safeGetCellValue(r, 'Team Member # 4'),           isCaptain: false },
        { label: 'Member 5',  value: safeGetCellValue(r, 'Team Member # 5'),           isCaptain: false },
    ];
    const techPill   = tech === 'Airtable' ? 'reg-pill-blue' : tech === 'CodePuppy' ? 'reg-pill-green' : tech === 'Harvey' ? 'reg-pill-purple' : 'reg-pill-gray';
    const statusPill = status === 'Submitted' ? 'reg-pill-blue' : status === 'Registered' ? 'reg-pill-green' : status === 'Pending' ? 'reg-pill-yellow' : 'reg-pill-gray';
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" style={{maxWidth:520}} onClick={e => e.stopPropagation()}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                    <h2 style={{fontSize:22,fontWeight:800,color:'var(--deep,#0B2C5F)',margin:0,lineHeight:1.2}}>{name || 'Team Roster'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
                    {tech    && <span className={`reg-pill ${techPill}`}>{tech}</span>}
                    {status  && <span className={`reg-pill ${statusPill}`}>{status}</span>}
                    {attendance && <span className="reg-pill reg-pill-gray">{attendance}</span>}
                </div>
                {useCase && (
                    <blockquote style={{margin:'0 0 20px',padding:'10px 14px',background:'#F8FAFC',borderLeft:'3px solid #3B82F6',borderRadius:'0 6px 6px 0',fontSize:13,color:'#334155',fontStyle:'italic',lineHeight:1.5}}>
                        {useCase}
                    </blockquote>
                )}
                <div style={{marginBottom:8}}>
                    {memberData.map(({ label, value, isCaptain }) => {
                        const memberName = Array.isArray(value) && value.length > 0 ? value[0].name : null;
                        return (
                            <div key={label} className="roster-row">
                                <span className="roster-label">{label}</span>
                                {memberName
                                    ? <><span className="roster-name">{memberName}</span>{isCaptain && <span className="roster-badge">Captain</span>}</>
                                    : <span className="roster-empty">Not assigned</span>
                                }
                            </div>
                        );
                    })}
                </div>
                <button className="submit-btn" style={{marginTop:16,width:'100%'}} onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

// ─── PRODUCT MODAL ────────────────────────────────────────────────────────────
function ProductModal({ record, prodResRecords, onClose }) {
    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [onClose]);

    const name    = safeGetCellValueAsString(record, 'Name');
    const website = safeGetCellValueAsString(record, 'website');
    const logo    = safeGetCellValue(record, 'Logo');
    const logoUrl = Array.isArray(logo) && logo.length > 0
        ? (logo[0].thumbnails?.large?.url || logo[0].url)
        : null;
    const desc     = safeGetCellValue(record, 'Product Description');
    const descText = desc && typeof desc === 'object' && desc.value
        ? desc.value
        : safeGetCellValueAsString(record, 'Product Description');

    const linkedResIds = safeGetCellValue(record, 'Product Resources');
    const resourceIds  = Array.isArray(linkedResIds) ? linkedResIds.map(r => r.id) : [];
    const resources    = prodResRecords.filter(r => resourceIds.includes(r.id));

    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal" style={{maxWidth:800,maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column'}}>
                <div className="pm-header">
                    <div className="pm-header-left">
                        {logoUrl && <img src={logoUrl} alt={name} className="pm-logo" />}
                        <div>
                            <div className="pm-name">{name}</div>
                            {website && (
                                <a href={website} target="_blank" rel="noreferrer" className="pm-website">
                                    {website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗
                                </a>
                            )}
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="pm-body">
                    {descText && <div className="pm-desc">{descText}</div>}

                    {resources.length > 0 && (
                        <>
                            <div className="pm-resources-label">Resources &amp; Training</div>
                            <div className="pm-resources-grid">
                                {resources.map(res => {
                                    const resName  = safeGetCellValueAsString(res, '\uFEFFName') || safeGetCellValueAsString(res, 'Name') || 'Resource';
                                    const resNotes = safeGetCellValueAsString(res, 'Notes');
                                    const resLink  = safeGetCellValueAsString(res, 'Open Resource') || safeGetCellValueAsString(res, 'Resource Link');
                                    const resCover = safeGetCellValue(res, 'Cover Image');
                                    const coverUrl = Array.isArray(resCover) && resCover.length > 0
                                        ? (resCover[0].thumbnails?.large?.url || resCover[0].url)
                                        : null;
                                    return (
                                        <a key={res.id} href={resLink || '#'} target="_blank" rel="noreferrer" className="pm-res-card">
                                            {coverUrl && (
                                                <div className="pm-res-cover-wrap">
                                                    <img src={coverUrl} alt={resName} className="pm-res-cover" />
                                                </div>
                                            )}
                                            <div className="pm-res-info">
                                                <div className="pm-res-name">{resName}</div>
                                                {resNotes && <div className="pm-res-notes">{resNotes.length > 100 ? resNotes.slice(0, 100) + '…' : resNotes}</div>}
                                            </div>
                                            <div className="pm-res-link">Open ↗</div>
                                        </a>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {resources.length === 0 && (
                        <div className="pm-empty">Resources coming soon. Check back before kickoff.</div>
                    )}
                </div>

                <div className="modal-footer" style={{justifyContent:'flex-end'}}>
                    {website && (
                        <a href={website} target="_blank" rel="noreferrer" className="btn-outline-dark" style={{marginRight:'auto',textDecoration:'none'}}>
                            Visit {name} ↗
                        </a>
                    )}
                    <button className="submit-btn" onClick={onClose}>Close</button>
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
    const regTable      = base.getTableByNameIfExists('Regulatory Documents')  ?? base.tables[0];
    const docTable      = base.getTableByNameIfExists('Hackathon Documents')   ?? null;
    const prodTable     = base.getTableByNameIfExists('Products')              ?? base.tables[0];
    const prodResTable  = base.getTableByNameIfExists('Product Resources')     ?? base.tables[0];

    // ── Records ─────────────────────────────────────────────────────────────
    const submissions   = useRecords(subTable);
    const probRecords   = useRecords(probTable);
    const dirRecords    = useRecords(dirTable);
    const prmRecords    = useRecords(prmTable);
    const regDocs       = useRecords(regTable);
    const hackDocs      = useRecords(docTable ?? subTable);  // fallback avoids null crash
    const prodRecords   = useRecords(prodTable);
    const prodResRecords = useRecords(prodResTable);

    // ── UI State ─────────────────────────────────────────────────────────────
    const [currentView,     setCurrentView]    = useState('portal');
    const [regTab,          setRegTab]         = useState('teams');
    const [rosterTeam,      setRosterTeam]     = useState(null);
    const [showReg,         setShowReg]        = useState(false);
    const [modalInitScreen, setModalInitScreen]= useState(0);
    const [showRulesModal,  setShowRulesModal] = useState(false);
    const [hubDocModal,     setHubDocModal]    = useState(null); // null | 'rules'|'prizes'|'reginfo'|'faqs'
    const [selfRegistered,  setSelfRegistered] = useState(null);
    const [step1Complete,   setStep1Complete]  = useState(false);
    const [showRubric,      setShowRubric]     = useState(false);
    const [productModal,    setProductModal]   = useState(null);
    const [countdown,       setCountdown]      = useState(getCountdown);
    const cd = useCountdown(HERO_COUNTDOWN_TARGET);

    useEffect(() => {
        const id = setInterval(() => setCountdown(getCountdown()), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const ids = ['hero', 'rules', 'tools', 'register', 'help'];
        const handleScroll = () => {
            let active = ids[0];
            for (const id of ids) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= 80) active = id;
            }
            ids.forEach(id => {
                const link = document.querySelector(`.nav-link[data-navid="${id}"]`);
                if (link) link.classList.toggle('active', id === active);
            });
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // One-time cleanup: remove any stale localStorage from previous version
    useEffect(() => {
        try { localStorage.removeItem('gg_hackathon_user'); } catch {}
    }, []);

    // ── Field detection: submissions ─────────────────────────────────────────
    const sfTeamName     = subTable.getFieldIfExists('Team Name');
    const sfStatus       = subTable.getFieldIfExists('Submission Status');

    // ── Field detection: hackathon docs ─────────────────────────────────────
    const dfDocName         = docTable ? docTable.getFieldIfExists('Name')                    : null;
    const dfDocSummary      = docTable ? docTable.getFieldIfExists('Attachment Summary')       : null;
    const dfDocDetails      = docTable ? docTable.getFieldIfExists('Documented Details')       : null;
    const dfDocCategorized  = docTable ? docTable.getFieldIfExists('Categorized Rules')        : null;
    const dfDocEligibility  = docTable ? docTable.getFieldIfExists('Eligibility and Team Rules') : null;
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

    const hubDocs = useMemo(() => {
        if (!dfDocName || !dfDocDetails) return {};
        const find = (name, field) => {
            const rec = hackDocList.find(r => r.getCellValueAsString(dfDocName).trim() === name);
            if (!rec) return '';
            const f = field ?? dfDocDetails;
            return f ? rec.getCellValueAsString(f) : '';
        };
        return {
            rules:   find('Official Rules'),
            prizes:  find('Prizes and Payout'),
            reginfo: `## Eligibility & Team Formation

- **Open Participation:** The event is open to all domestic and international Walmart associates across all departments.
- **Team Size:** Teams may consist of up to 5 members.
- **Team Allocation:** The Global Governance hosting committee may assign individual participants to teams with fewer than 5 members to ensure full participation.
- **Mentorship:** Each team will be assigned a dedicated technical mentor.

## Hourly Associates

- Hourly (non-exempt) associates may participate only during their scheduled work hours.
- Participation must adhere to the Walmart Associate Pay Policy.
- "Off-the-Clock" work is strictly prohibited. All hackathon time must be recorded and compensated.
- Participation does not authorize overtime. Associates and managers must ensure no hours beyond regular shifts.`,
            faqs:    find('FAQs'),
        };
    }, [hackDocList, dfDocName, dfDocDetails, dfDocEligibility]);

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
    const freeAgents      = dirRecords.filter(r => safeGetCellValue(r, 'Free Agent Registration'));

    const openModal = (screen = 0) => { setModalInitScreen(screen); setShowReg(true); };

    return (
        <>
        <style>{css}</style>
        {currentView === 'admin' ? (
            <AdminView
                onBack={() => setCurrentView('portal')}
                liveTeams={liveTeams}
                subTable={subTable}
                sfTeamName={sfTeamName}
                sfStatus={sfStatus}
                totalTeams={totalTeams}
                submittedTeams={submittedTeams}
                registeredTeams={registeredTeams}
                spotsLeft={spotsLeft}
                probRecords={probRecords}
            />
        ) : (
        <div className="portal">

            {/* ── STICKY NAV ── */}
            <nav className="nav">
                <div className="nav-brand">
                    <div className="nav-spark"><SparkIcon size={16} /></div>
                    FY27 Global Governance AI Hackathon
                </div>
                <div className="nav-links">
                    {NAV_SECTIONS.map(([id, label]) => (
                        <button key={id} data-navid={id} className={`nav-link${id === 'hero' ? ' active' : ''}`}
                            onClick={() => {
                                document.querySelectorAll('.nav-link[data-navid]').forEach(el => el.classList.remove('active'));
                                document.querySelector(`.nav-link[data-navid="${id}"]`)?.classList.add('active');
                                document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
                            }}>
                            {label}
                        </button>
                    ))}
                </div>
                <div className="nav-right">
                    <button className="nav-cta" onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}>Register Now →</button>
                </div>
            </nav>

            {/* ── SECTION 1: HERO ── */}
            <section id="hero" className="hero">
                <div className="hero-inner">
                    <div className="hero-left">
                        <h1><span className="hero-h1-pre">FY27</span>Global Governance<br /><span className="accent">AI Hackathon</span></h1>
                        <div className="hero-byline">Build something that matters. Win something that counts.</div>
                        <div className="hero-sub">
                            48 hours. Real data. Real problems. Use Airtable, Harvey, or CodePuppy to build an AI-powered solution for Walmart's Global Governance team — then pitch it.
                        </div>
                    </div>
                    <div className="hero-right">
                        <div className="hero-orbital">
                            <div className="orb-ring orb-r1" />
                            <div className="orb-ring orb-r2" />
                            <div className="orb-ring orb-r3" />
                            <div className="orb-track orb-t1"><div className="orb-dot" /></div>
                            <div className="orb-track orb-t2"><div className="orb-dot" /></div>
                            <div className="orb-core" />
                        </div>
                        {cd ? (
                            <div className="hero-countdown">
                                <div className="hero-countdown-label">Hackathon Begins</div>
                                <div className="countdown-blocks">
                                    <div className="countdown-block">
                                        <div className="countdown-num">{cd.d}</div>
                                        <div className="countdown-unit">Days</div>
                                    </div>
                                    <div className="countdown-sep">:</div>
                                    <div className="countdown-block">
                                        <div className="countdown-num">{cd.h}</div>
                                        <div className="countdown-unit">Hours</div>
                                    </div>
                                    <div className="countdown-sep">:</div>
                                    <div className="countdown-block">
                                        <div className="countdown-num">{cd.m}</div>
                                        <div className="countdown-unit">Min</div>
                                    </div>
                                    <div className="countdown-sep">:</div>
                                    <div className="countdown-block">
                                        <div className="countdown-num">{cd.s}</div>
                                        <div className="countdown-unit">Sec</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="hero-countdown">
                                <div className="hero-countdown-label">Hackathon Begins</div>
                                <div style={{fontSize:'22px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>Soon</div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="hero-stepper">
                    {PHASES.map(p => (
                        <div key={p.label} className="hero-phase-node">
                            <div className={`hero-step-dot ${p.active ? 'hero-step-dot-active' : 'hero-step-dot-inactive'}`} />
                            <div className={`hero-step-label ${p.active ? 'hero-step-label-active' : 'hero-step-label-inactive'}`}>{p.label}</div>
                            <div className={`hero-phase-sub ${p.active ? 'hero-step-sub-active' : 'hero-step-sub-inactive'}`}>{p.sub}</div>
                        </div>
                    ))}
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
                </div>
            </div>


            {/* ── SECTION 2: LEARNING HUB ── */}
            <section id="rules" className="sec-white">
                <div className="sec-wrap">
                    <span className="sec-label">Learning Hub</span>
                    <h2 className="sec-h2">Learning Hub</h2>
                    <p className="sec-sub">Everything you need to know before you build.</p>

                    <div className="hub-cards">
                        <div className="hub-card" style={{ borderTop: `3px solid ${T.blue}` }} onClick={() => setHubDocModal('rules')}>
                            <div className="hub-card-icon"><ClipboardTextIcon size={28} color={T.blue} weight="duotone" /></div>
                            <div className="hub-card-title">Rules & Guidelines</div>
                            <div className="hub-card-body">Official hackathon rules, eligibility requirements, and code of conduct. Read this before registering.</div>
                            <span className="hub-card-link">Read the Rules →</span>
                        </div>
                        <div className="hub-card" style={{ borderTop: `3px solid ${T.yellow}` }} onClick={() => setHubDocModal('prizes')}>
                            <div className="hub-card-icon"><TrophyIcon size={28} color={T.yellow} weight="duotone" /></div>
                            <div className="hub-card-title">Payouts & Prizes</div>
                            <div className="hub-card-body">What's at stake. Prize tiers, judging criteria, and how winners are selected.</div>
                            <span className="hub-card-link">View Prize Details →</span>
                        </div>
                        <div className="hub-card" style={{ borderTop: `3px solid ${T.azure}` }} onClick={() => setHubDocModal('reginfo')}>
                            <div className="hub-card-icon"><NotePencilIcon size={28} color={T.azure} weight="duotone" /></div>
                            <div className="hub-card-title">Registration Info</div>
                            <div className="hub-card-body">How to register your team, deadlines, team size requirements, and free agent sign-up.</div>
                            <span className="hub-card-link">Go to Registration →</span>
                        </div>
                        <div className="hub-card" style={{ borderTop: `3px solid ${T.muted}` }} onClick={() => setHubDocModal('faqs')}>
                            <div className="hub-card-icon"><QuestionIcon size={28} color={T.muted} weight="duotone" /></div>
                            <div className="hub-card-title">FAQs</div>
                            <div className="hub-card-body">Common questions about tools, submissions, team formation, and the 48-hour sprint format.</div>
                            <span className="hub-card-link">View FAQs →</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SECTION 3: TOOLS & ACCESS ── */}
            <section id="tools" className="sec-cloud">
                <div className="sec-wrap">
                    <span className="sec-label">Tools</span>
                    <h2 className="sec-h2">Tool Selection</h2>
                    <p className="sec-sub">Free training is available for all tools. Pick one — or combine them if your use case calls for it.</p>
                    <p className="sec-sub" style={{marginTop:6}}><strong>Click any card for details, resources, and training links.</strong></p>

                    <div className="prod-grid">
                        {(() => {
                            const ORDER = ['airtable','harvey','code puppy','dataiku'];
                            const sorted = [...prodRecords].sort((a, b) => {
                                const ai = ORDER.indexOf(safeGetCellValueAsString(a, 'Name').toLowerCase());
                                const bi = ORDER.indexOf(safeGetCellValueAsString(b, 'Name').toLowerCase());
                                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
                            });
                            return sorted.map(prod => {
                                const name    = safeGetCellValueAsString(prod, 'Name');
                                const logo    = safeGetCellValue(prod, 'Logo');
                                const logoUrl = Array.isArray(logo) && logo.length > 0
                                    ? (logo[0].thumbnails?.large?.url || logo[0].url)
                                    : null;
                                return (
                                    <button key={prod.id} className="prod-card" onClick={() => setProductModal(prod)}>
                                        {logoUrl
                                            ? <img src={logoUrl} alt={name} className="prod-card-bg" />
                                            : <div className="prod-card-bg-fallback" />
                                        }
                                        <div className="prod-card-shade" />
                                        <div className="prod-card-overlay">
                                            <div className="prod-card-hover-label">View Product Details</div>
                                            <div className="prod-card-hover-btn">Explore {name} →</div>
                                        </div>
                                    </button>
                                );
                            });
                        })()}
                    </div>
                </div>
            </section>

            {/* ── SECTION 4: REGISTRATION ── */}
            <section id="register" className="sec-white">
                <div className="sec-wrap-wide">
                    <span className="sec-label">Get Involved</span>
                    <h2 className="sec-h2">Hackathon Registration</h2>
                    <p className="sec-sub" style={{marginBottom:32}}>Follow the steps below to register for the event, form or join a team, and get started.</p>
                    <RegistrationSection
                        dirTable={dirTable}
                        subTable={subTable}
                        dirRecords={dirRecords}
                        liveTeams={liveTeams}
                        freeAgents={freeAgents}
                        dfName={dfName}
                        dfEmail={dfEmail}
                        selfRegistered={selfRegistered}
                        setSelfRegistered={setSelfRegistered}
                        step1Complete={step1Complete}
                        setStep1Complete={setStep1Complete}
                    />
                </div>
            </section>

            {/* ── SECTION 5: HELP & SUPPORT ── */}
            <section id="help" className="sec-cloud">
                <div className="sec-wrap">
                    <span className="sec-label">Support</span>
                    <h2 className="sec-h2">We've Got You Covered</h2>
                    <p className="sec-sub">Multiple support channels available before and during the event.</p>

                    <div className="help-cards">
                        {/* Card 1: Internal Support Team */}
                        <div className="help-card">
                            <div className="help-card-icon"><UsersThreeIcon size={28} color={T.blue} weight="duotone" /></div>
                            <div className="help-card-title">Internal Support Team</div>
                            <div className="contact-blocks">
                                <div className="contact-block">
                                    <div className="contact-topic">Hackathon Lead</div>
                                    <div className="contact-name">Nick Hammons</div>
                                    <div className="contact-role">GG Digital Acceleration</div>
                                </div>
                                <div className="contact-block">
                                    <div className="contact-topic">Operations Lead</div>
                                    <div className="contact-name">Abby Worley</div>
                                    <div className="contact-role">GG Digital Acceleration</div>
                                </div>
                                <div className="contact-block">
                                    <div className="contact-topic">Technical Lead</div>
                                    <div className="contact-name">Michael Chapman</div>
                                    <div className="contact-role">GG Digital Acceleration</div>
                                </div>
                            </div>
                            <div className="help-footer-note">For anything else → <strong>#gg-hackathon</strong> in Teams</div>
                        </div>

                        {/* Card 2: Product Support */}
                        <div className="help-card">
                            <div className="help-card-icon"><HeadsetIcon size={28} color={T.blue} weight="duotone" /></div>
                            <div className="help-card-title">Product Support</div>
                            <div className="contact-blocks">
                                <div className="contact-block">
                                    <div className="contact-topic">Airtable Support</div>
                                    <div className="contact-name">Bennett Oliver</div>
                                    <div className="contact-role">bennett.oliver@airtable.com</div>
                                </div>
                                <div className="contact-block">
                                    <div className="contact-topic">Airtable Support</div>
                                    <div className="contact-name">Chris Cain</div>
                                    <div className="contact-role">chris.cain@airtable.com</div>
                                </div>
                                <div className="contact-block">
                                    <div className="contact-topic">Harvey Support</div>
                                    <div className="contact-name">TBD</div>
                                    <div className="contact-role">Contact coming soon</div>
                                </div>
                                <div className="contact-block">
                                    <div className="contact-topic">CodePuppy Support</div>
                                    <div className="contact-name">TBD</div>
                                    <div className="contact-role">Contact coming soon</div>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Mentor Program */}
                        <div className="help-card">
                            <div className="help-card-icon"><ChalkboardTeacherIcon size={28} color={T.blue} weight="duotone" /></div>
                            <div className="help-card-title">Mentor Program</div>
                            <div className="mentor-body">
                                Every registered team is assigned one internal mentor with relevant domain or technical expertise. Please reach out to the Internal Support Team for help regarding mentor assignments.
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
                        <button className="site-footer-link-cta" onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}>Register →</button>
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
            {hubDocModal && (
                <HubDocModal
                    title={{ rules: 'Rules & Guidelines', prizes: 'Payouts & Prizes', reginfo: 'Registration Info', faqs: 'FAQs' }[hubDocModal]}
                    content={hubDocs[hubDocModal]}
                    onClose={() => setHubDocModal(null)}
                />
            )}
            {rosterTeam && (
                <RosterModal
                    record={rosterTeam}
                    onClose={() => setRosterTeam(null)}
                />
            )}
            {productModal && (
                <ProductModal
                    record={productModal}
                    prodResRecords={prodResRecords}
                    onClose={() => setProductModal(null)}
                />
            )}
        </div>
        )}
        </>
    );
}

initializeBlock({ interface: () => <App /> });
