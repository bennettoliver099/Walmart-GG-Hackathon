import React, { useState, useMemo } from 'react';
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
const EXTERNAL_FORM_URL = 'https://airtable.com/app4AdZ5m3rWZ4kt8/pagX2wubHXk1Q7Em0/form';
const RULES_URL         = 'https://teams.wal-mart.com/sites/GGDigitalAcceleration';
const TEST_NAMES        = ['Test', 'Test ', 'Test2', 'test 5', 'Rest'];
const TECH_OPTIONS      = ['Airtable', 'CodePuppy', 'Harvey', 'Other'];
const ATTENDANCE_OPTIONS= ['Virtual', 'In Person', 'Hybrid'];

// ─── WALMART SPARK SVG ────────────────────────────────────────────────────────
const SPARK_PATHS = `<path d="M375.663,273.363c12.505-2.575,123.146-53.269,133.021-58.97c22.547-13.017,30.271-41.847,17.254-64.393s-41.847-30.271-64.393-17.254c-9.876,5.702-109.099,76.172-117.581,85.715c-9.721,10.937-11.402,26.579-4.211,39.033C346.945,269.949,361.331,276.314,375.663,273.363z"/><path d="M508.685,385.607c-9.876-5.702-120.516-56.396-133.021-58.97c-14.332-2.951-28.719,3.415-35.909,15.87c-7.191,12.455-5.51,28.097,4.211,39.033c8.482,9.542,107.705,80.013,117.581,85.715c22.546,13.017,51.376,5.292,64.393-17.254S531.231,398.624,508.685,385.607z"/><path d="M266.131,385.012c-14.382,0-27.088,9.276-31.698,23.164c-4.023,12.117-15.441,133.282-15.441,144.685c0,26.034,21.105,47.139,47.139,47.139c26.034,0,47.139-21.105,47.139-47.139c0-11.403-11.418-132.568-15.441-144.685C293.219,394.288,280.513,385.012,266.131,385.012z"/><path d="M156.599,326.637c-12.505,2.575-123.146,53.269-133.021,58.97C1.031,398.624-6.694,427.454,6.323,450c13.017,22.546,41.847,30.271,64.393,17.254c9.876-5.702,109.098-76.172,117.58-85.715c9.722-10.937,11.402-26.579,4.211-39.033S170.931,323.686,156.599,326.637z"/><path d="M70.717,132.746C48.171,119.729,19.341,127.454,6.323,150c-13.017,22.546-5.292,51.376,17.254,64.393c9.876,5.702,120.517,56.396,133.021,58.97c14.332,2.951,28.719-3.415,35.91-15.87c7.191-12.455,5.51-28.096-4.211-39.033C179.815,208.918,80.592,138.447,70.717,132.746z"/><path d="M266.131,0c-26.035,0-47.139,21.105-47.139,47.139c0,11.403,11.418,132.568,15.441,144.685c4.611,13.888,17.317,23.164,31.698,23.164s27.088-9.276,31.698-23.164c4.023-12.117,15.441-133.282,15.441-144.685C313.27,21.105,292.165,0,266.131,0z"/>`;

function SparkIcon({ size = 20, color = 'white' }) {
    return (
        <svg viewBox="0 0 532.262 600" width={size} height={size} xmlns="http://www.w3.org/2000/svg"
            style={{ fill: color, display: 'block', flexShrink: 0 }}
            dangerouslySetInnerHTML={{ __html: SPARK_PATHS }} />
    );
}

// ─── STATIC DATASETS ─────────────────────────────────────────────────────────
const STATIC_DATASETS = [
    { icon: '📋', title: 'Regulatory Documents', desc: '10 government PDFs (BIPA, CCPA, OSHA, UFLPA, NYC AEDT, FLSA, ADA, TCPA, HazCom) parsed into plain-English summaries, deadlines, and Walmart action items.', tags: ['Compliance', 'AI-Parsed', 'PDF', 'Harvey'], rows: '10 docs · 16 AI fields' },
    { icon: '🏪', title: 'Store Locations', desc: 'Store number, format, city, state, region, division, square footage, open date, and coordinates for US stores.', tags: ['Operations', 'Geography', 'CSV'], rows: '36 stores · 20 fields' },
    { icon: '🏭', title: 'Distribution Centers', desc: 'DC type, automation level, stores served, and cold storage capabilities — ideal for supply chain AI ideas.', tags: ['Supply Chain', 'Operations', 'CSV'], rows: '22 DCs · 18 fields' },
    { icon: '👥', title: 'GG Directory', desc: 'Associate records with name, supervisory org, email, and location. Use for routing, auto-assignment, and compliance ownership.', tags: ['People', 'Org Data', 'Live'], rows: '500+ associates' },
    { icon: '🎯', title: 'Problem Statements', desc: '12 GG-specific problems with current state, desired state, data available, and suggested technologies.', tags: ['Strategy', 'GG', 'Live'], rows: '12 problems · 11 fields' },
    { icon: '💡', title: 'Prompt Library', desc: '40 AI prompt templates across 9 categories — paste directly into Harvey or an Airtable AI field.', tags: ['AI', 'Prompts', 'Harvey', 'Airtable'], rows: '40 prompts · 9 categories' },
];

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
    { label: 'Impact', weight: '30%', desc: 'Does this solve a real GG problem? Would it save time, reduce risk, or close a compliance gap?' },
    { label: 'Innovation', weight: '25%', desc: 'Does it use AI meaningfully — not just a dashboard, but something that automates or augments a real decision?' },
    { label: 'Feasibility', weight: '25%', desc: 'Could this be deployed at Walmart with reasonable effort? Is it built on available data and tools?' },
    { label: 'Demo Quality', weight: '20%', desc: 'Is the working prototype clear and compelling? Can you explain the problem it solves in 2 minutes?' },
];

// ─── TECH GUIDES ─────────────────────────────────────────────────────────────
const TECH_GUIDES = [
    { name: 'Airtable', best: 'Structured data, interfaces, automations', desc: 'Build operational interfaces, automated workflows, and dashboards. The base, views, and interface builder are your canvas.' },
    { name: 'Harvey', best: 'Document AI, natural language Q&A', desc: 'Point Harvey at any PDF, policy doc, or regulation — ask questions, extract structured data, and draft content.' },
    { name: 'CodePuppy', best: 'Custom code, integrations, APIs', desc: "Writes and runs JavaScript/Python. Connect external APIs, transform data, or build automations Airtable can't do natively." },
];

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
    blue:    '#0071CE',
    deep:    '#0B2C5F',
    azure:   '#2C8EF4',
    ice:     '#CFE8FF',
    cloud:   '#F4F7FB',
    white:   '#FFFFFF',
    yellow:  '#FFC220',
    body:    '#334155',
    muted:   '#5A7A9A',
    muted2:  '#8BA5BF',
    border:  'rgba(0,113,206,0.14)',
    border2: 'rgba(0,113,206,0.26)',
    heroGrad: 'linear-gradient(135deg,#0B2C5F 0%,#0071CE 60%,#2C8EF4 100%)',
    shadow:  '0 1px 3px rgba(11,44,95,0.08)',
    shadowM: '0 4px 16px rgba(11,44,95,0.10)',
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.portal{background:${T.cloud};color:${T.body};font-family:'Bogle','Brandon Text','Inter',sans-serif;min-height:100vh;font-size:14px;line-height:1.5;}
.nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 40px;height:60px;background:${T.white};border-bottom:1px solid ${T.border};box-shadow:${T.shadow};}
.nav-brand{display:flex;align-items:center;gap:10px;font-family:'Inter',sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${T.muted};font-weight:600;}
.nav-spark{width:30px;height:30px;background:${T.heroGrad};border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.nav-cta{background:${T.yellow};color:${T.deep};border:none;padding:9px 20px;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;border-radius:5px;box-shadow:0 2px 8px rgba(255,194,32,0.3);transition:all 0.18s;}
.nav-cta:hover{background:#FFD050;transform:translateY(-1px);}
.hero{background:${T.heroGrad};padding:36px 40px 44px;position:relative;overflow:hidden;}
.hero::after{content:'';position:absolute;top:-40%;right:-8%;width:55%;height:180%;background:radial-gradient(ellipse,rgba(44,142,244,0.18),transparent 65%);pointer-events:none;}
.hero-inner{max-width:100%;position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:40px;}
.hero-left{flex:1;min-width:0;max-width:600px;}
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
.hero-eyebrow{font-family:'Inter',sans-serif;font-size:10px;letter-spacing:0.26em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:16px;display:flex;align-items:center;gap:10px;}
.hero-eyebrow::before{content:'';display:block;width:24px;height:1px;background:rgba(255,255,255,0.4);}
.hero h1{font-size:48px;font-weight:800;line-height:1.05;letter-spacing:-0.02em;color:${T.yellow};margin-bottom:16px;white-space:nowrap;}
.hero h1 .accent{background:linear-gradient(90deg,#CFE8FF 0%,#7EC8F8 50%,#2C8EF4 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-byline{font-family:'Inter',sans-serif;font-size:13px;font-weight:700;color:${T.white};letter-spacing:0.04em;margin-bottom:16px;}
.hero-sub{font-size:15px;color:rgba(255,255,255,0.72);max-width:520px;line-height:1.65;margin-bottom:28px;}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap;}
.btn-primary{display:inline-flex;align-items:center;gap:8px;background:${T.yellow};color:${T.deep};padding:11px 24px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;border-radius:5px;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(255,194,32,0.35);transition:all 0.18s;text-decoration:none;}
.btn-primary:hover{background:#FFD050;transform:translateY(-1px);}
.btn-outline{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,0.12);color:${T.white};padding:11px 20px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;border-radius:5px;border:1px solid rgba(255,255,255,0.22);cursor:pointer;transition:all 0.18s;text-decoration:none;}
.btn-outline:hover{background:rgba(255,255,255,0.2);}
.stat-bar{background:${T.white};border-bottom:1px solid ${T.border};}
.stat-bar-inner{display:grid;grid-template-columns:repeat(4,1fr);width:100%;}
.stat-item{padding:22px 0;border-right:1px solid ${T.border};display:flex;flex-direction:column;gap:4px;align-items:center;text-align:center;}
.stat-item:last-child{border-right:none;}
.stat-num{font-family:'Inter',sans-serif;font-size:26px;font-weight:700;color:${T.blue};line-height:1;}
.stat-label{font-family:'Inter',sans-serif;font-size:10px;color:${T.muted};letter-spacing:0.08em;text-transform:uppercase;}
.content-wrap{max-width:900px;margin:0 auto;padding:28px 40px 60px;}
.tabs{display:flex;border-bottom:1px solid ${T.border};margin-bottom:24px;overflow-x:auto;scrollbar-width:none;}
.tabs::-webkit-scrollbar{display:none;}
.tab{padding:10px 16px;font-family:'Inter',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${T.muted};cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all 0.18s;background:none;border-top:none;border-left:none;border-right:none;white-space:nowrap;display:flex;align-items:center;gap:5px;}
.tab:hover{color:${T.blue};}
.tab.active{color:${T.blue};border-bottom-color:${T.blue};}
.sh{display:flex;align-items:baseline;gap:12px;margin-bottom:6px;}
.sl{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.26em;text-transform:uppercase;color:${T.blue};padding:3px 8px;border:1px solid ${T.border2};border-radius:3px;background:${T.ice};flex-shrink:0;}
.st{font-size:20px;font-weight:800;letter-spacing:-0.01em;color:${T.deep};}
.ss{font-size:13px;color:${T.muted};margin-bottom:20px;line-height:1.6;max-width:600px;}
.tbl{width:100%;border-collapse:collapse;border:1px solid ${T.border};border-radius:8px;overflow:hidden;margin-bottom:0;}
.tbl thead th{background:${T.cloud};padding:10px 14px;text-align:left;font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${T.muted};border-bottom:1px solid ${T.border};}
.tbl tbody tr{border-bottom:1px solid rgba(0,113,206,0.07);transition:background 0.12s;}
.tbl tbody tr:last-child{border-bottom:none;}
.tbl tbody tr:hover{background:${T.cloud};}
.tbl td{padding:11px 14px;font-size:13px;vertical-align:middle;color:${T.body};}
.row-num{font-family:'Inter',sans-serif;font-size:11px;color:${T.muted2};}
.tnc{font-weight:700;color:${T.deep};}
.empty{text-align:center;padding:40px;color:${T.muted};font-size:13px;}
.prob-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;}
.prob-card{background:${T.white};border:1px solid ${T.border};border-radius:8px;padding:20px 18px;transition:all 0.18s;cursor:pointer;position:relative;overflow:hidden;}
.prob-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${T.deep},${T.blue});opacity:0;transition:opacity 0.18s;}
.prob-card:hover{border-color:${T.border2};box-shadow:${T.shadowM};}
.prob-card:hover::before{opacity:1;}
.prob-id{font-family:'Inter',sans-serif;font-size:10px;color:${T.muted2};letter-spacing:0.08em;margin-bottom:5px;}
.prob-title{font-size:14px;font-weight:700;line-height:1.3;margin-bottom:8px;color:${T.deep};}
.prob-desc{font-size:12px;color:${T.muted};line-height:1.6;margin-bottom:12px;}
.prob-meta{display:flex;gap:5px;flex-wrap:wrap;}
.mt{font-family:'Inter',sans-serif;font-size:10px;font-weight:600;padding:2px 7px;border-radius:3px;}
.mt-easy{background:#E6F4EA;color:#1A7F37;}
.mt-medium{background:#FFF8E6;color:#92610A;}
.mt-hard{background:#FEE2E2;color:#B91C1C;}
.mt-high{background:${T.ice};color:${T.blue};}
.mt-domain{background:${T.cloud};color:${T.muted};}
.prob-claimed{font-family:'Inter',sans-serif;font-size:10px;color:${T.blue};margin-top:10px;font-weight:600;}
.reg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:28px;}
.reg-card{background:${T.white};border:1px solid ${T.border};border-radius:7px;padding:18px 16px;cursor:pointer;transition:all 0.18s;}
.reg-card:hover{border-color:${T.border2};box-shadow:${T.shadowM};}
.reg-name{font-size:13px;font-weight:700;margin-bottom:7px;color:${T.deep};line-height:1.3;}
.reg-sum{font-size:12px;color:${T.muted};line-height:1.6;margin-bottom:10px;}
.risk{display:inline-block;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;}
.risk-h{background:#FEE2E2;color:#B91C1C;}
.risk-m{background:#FFF8E6;color:#92610A;}
.risk-l{background:#E6F4EA;color:#1A7F37;}
.risk-u{background:${T.cloud};color:${T.muted};}
.ds-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;}
.ds-card{background:${T.white};border:1px solid ${T.border};border-radius:7px;padding:18px 16px;}
.ds-icon{font-size:20px;margin-bottom:8px;}
.ds-title{font-size:13px;font-weight:700;margin-bottom:5px;color:${T.deep};}
.ds-desc{font-size:12px;color:${T.muted};line-height:1.6;margin-bottom:10px;}
.ds-tags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px;}
.ds-tag{font-family:'Inter',sans-serif;font-size:10px;font-weight:600;padding:2px 6px;border-radius:3px;background:${T.ice};color:${T.blue};}
.ds-rows{font-family:'Inter',sans-serif;font-size:10px;color:${T.muted2};}
.filter-pills{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px;}
.fp{padding:5px 12px;border:1px solid ${T.border2};border-radius:100px;font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${T.muted};cursor:pointer;transition:all 0.15s;background:none;}
.fp:hover{border-color:${T.blue};color:${T.blue};}
.fp.active{border-color:${T.blue};color:${T.blue};background:${T.ice};}
.prompt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;}
.prompt-card{background:${T.white};border:1px solid ${T.border};border-radius:7px;padding:18px 16px;display:flex;flex-direction:column;gap:8px;}
.pt-title{font-size:13px;font-weight:700;color:${T.deep};line-height:1.3;}
.pt-meta{display:flex;gap:5px;flex-wrap:wrap;}
.pt-cat{font-family:'Inter',sans-serif;font-size:10px;font-weight:600;padding:2px 7px;border-radius:3px;background:${T.ice};color:${T.blue};}
.pt-d-b{font-family:'Inter',sans-serif;font-size:10px;font-weight:600;padding:2px 7px;border-radius:3px;background:#E6F4EA;color:#1A7F37;}
.pt-d-i{font-family:'Inter',sans-serif;font-size:10px;font-weight:600;padding:2px 7px;border-radius:3px;background:#FFF8E6;color:#92610A;}
.pt-d-a{font-family:'Inter',sans-serif;font-size:10px;font-weight:600;padding:2px 7px;border-radius:3px;background:#FEE2E2;color:#B91C1C;}
.pt-produces{font-size:12px;color:${T.muted};line-height:1.5;}
.pt-text-wrap{position:relative;}
.pt-text{font-family:'Inter',sans-serif;font-size:11px;color:${T.body};line-height:1.6;background:${T.cloud};border:1px solid ${T.border};border-radius:5px;padding:10px 40px 10px 12px;white-space:pre-wrap;word-break:break-word;max-height:110px;overflow-y:auto;}
.copy-btn{position:absolute;top:7px;right:7px;background:${T.white};border:1px solid ${T.border2};color:${T.blue};font-family:'Inter',sans-serif;font-size:10px;font-weight:700;padding:3px 8px;border-radius:3px;cursor:pointer;transition:all 0.15s;}
.copy-btn:hover{background:${T.ice};}
.copy-btn.copied{background:#E6F4EA;border-color:#B6DFC0;color:#1A7F37;}
.ins-label{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${T.blue};margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid ${T.border};}
.mashup-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:6px;}
.mashup-card{background:${T.white};border:1px solid ${T.border};border-radius:7px;padding:18px 16px;}
.mashup-icon{font-size:20px;margin-bottom:8px;}
.mashup-title{font-size:13px;font-weight:700;margin-bottom:6px;color:${T.deep};}
.mashup-desc{font-size:12px;color:${T.muted};line-height:1.6;margin-bottom:10px;}
.mashup-tags{display:flex;gap:5px;flex-wrap:wrap;}
.mashup-tag{font-family:'Inter',sans-serif;font-size:10px;font-weight:600;padding:2px 7px;border-radius:3px;background:${T.ice};color:${T.blue};}
.tg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:6px;}
.tg-card{background:${T.white};border:1px solid ${T.border};border-radius:7px;padding:20px 16px;border-top:3px solid ${T.blue};}
.tg-name{font-size:15px;font-weight:800;margin-bottom:3px;color:${T.deep};}
.tg-best{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.05em;color:${T.muted2};text-transform:uppercase;margin-bottom:10px;}
.tg-desc{font-size:12px;color:${T.muted};line-height:1.6;}
.judge-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
.judge-card{background:${T.white};border:1px solid ${T.border};border-radius:7px;padding:18px 16px;}
.judge-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;}
.judge-label{font-size:14px;font-weight:800;color:${T.deep};}
.judge-weight{font-family:'Inter',sans-serif;font-size:18px;font-weight:700;color:${T.blue};}
.judge-desc{font-size:12px;color:${T.muted};line-height:1.6;}
.modal-overlay{position:fixed;inset:0;z-index:999;background:rgba(11,44,95,0.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn 0.18s ease;}
.modal{background:${T.white};border:1px solid ${T.border};border-radius:12px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(11,44,95,0.2);animation:slideUp 0.22s ease;scrollbar-width:thin;scrollbar-color:${T.muted2} transparent;}
.modal-header{padding:24px 28px 18px;border-bottom:1px solid ${T.border};display:flex;align-items:flex-start;justify-content:space-between;gap:12px;position:sticky;top:0;background:${T.white};z-index:10;}
.modal-title{font-size:18px;font-weight:800;color:${T.deep};}
.modal-subtitle{font-size:12px;color:${T.muted};margin-top:3px;}
.modal-close{background:none;border:none;cursor:pointer;color:${T.muted};font-size:18px;line-height:1;padding:2px;border-radius:3px;transition:color 0.15s;flex-shrink:0;}
.modal-close:hover{color:${T.deep};}
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
.success-sub{font-size:13px;color:${T.muted};line-height:1.6;max-width:340px;margin:0 auto 24px;}
.ferr{font-size:12px;color:#B91C1C;margin-top:5px;}
.submit-err{background:#FEE2E2;border:1px solid rgba(185,28,28,0.25);border-radius:5px;padding:9px 12px;font-size:13px;color:#B91C1C;margin-bottom:14px;}
.sbadge{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;padding:2px 8px;border-radius:3px;display:inline-block;}
.sbadge-submitted{background:#E6F4EA;color:#1A7F37;}
.sbadge-registered{background:${T.ice};color:${T.blue};}
.detail-field{margin-bottom:18px;}
.detail-field-label{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${T.muted};margin-bottom:6px;}
.detail-field-value{font-size:13px;color:${T.body};line-height:1.7;}
.detail-avail{background:${T.ice};border:1px solid ${T.border2};border-radius:6px;padding:12px 14px;font-size:13px;color:${T.muted};line-height:1.6;}
.detail-opp{background:${T.ice};border:1px solid ${T.border2};border-radius:6px;padding:12px 14px;}
.live-dot{display:inline-block;width:6px;height:6px;background:#22C55E;border-radius:50%;animation:pulse 2s infinite;margin-right:5px;vertical-align:middle;}
.ins-section{margin-bottom:32px;}
.divider{height:1px;background:${T.border};margin:28px 0;}
.footer{border-top:1px solid ${T.border};padding:18px 40px;display:flex;align-items:center;justify-content:space-between;background:${T.white};}
.footer-brand{font-family:'Inter',sans-serif;font-size:10px;color:${T.muted};letter-spacing:0.1em;}
.footer-links a{color:${T.muted};text-decoration:none;font-family:'Inter',sans-serif;font-size:10px;letter-spacing:0.07em;margin-left:20px;transition:color 0.15s;}
.footer-links a:hover{color:${T.blue};}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(11,44,95,0.25);border-top-color:${T.deep};border-radius:50%;animation:spin .7s linear infinite;}
@media(max-width:680px){
  .content-wrap{padding:20px 16px 48px;}
  .nav{padding:0 16px;}
  .hero{padding:24px 16px 32px;}
  .footer{padding:14px 16px;flex-direction:column;gap:8px;align-items:flex-start;}
  .fr-2{grid-template-columns:1fr;}
  .tg-grid{grid-template-columns:1fr;}
  .judge-grid{grid-template-columns:1fr;}
  .hero-orbital{display:none;}
  .hero-inner{gap:0;}
}
`;

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ value }) {
    if (!value) return <span style={{ color: T.muted2 }}>—</span>;
    const cls = value === 'Submitted'  ? 'sbadge sbadge-submitted'
              : value === 'Registered' ? 'sbadge sbadge-registered'
              : 'sbadge';
    return <span className={cls}>{value}</span>;
}

// ─── PROBLEM DETAIL MODAL ─────────────────────────────────────────────────────
function ProblemDetailModal({ prob, onClose, probIdF, probTitleF, probDescF, probDiffF, probImpactF, probDomainF, probClaimedF }) {
    const id      = probIdF      ? prob.getCellValueAsString(probIdF)      : '';
    const title   = probTitleF   ? prob.getCellValueAsString(probTitleF)   : prob.name;
    const desc    = probDescF    ? prob.getCellValueAsString(probDescF)    : '';
    const domain  = probDomainF  ? prob.getCellValueAsString(probDomainF)  : '';
    const claimed = probClaimedF ? prob.getCellValueAsString(probClaimedF) : '';
    const diff    = probDiffF    ? ((prob.getCellValue(probDiffF))?.name ?? '') : '';
    const impact  = probImpactF  ? ((prob.getCellValue(probImpactF))?.name ?? '') : '';
    const diffCls = diff === 'Easy' ? 'mt mt-easy' : diff === 'Medium' ? 'mt mt-medium' : diff === 'Hard' ? 'mt mt-hard' : 'mt mt-domain';

    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-header">
                    <div>
                        {id && <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: T.muted2, letterSpacing: '0.08em', marginBottom: 4 }}>{id}</div>}
                        <div className="modal-title">{title}</div>
                        {domain && <div className="modal-subtitle">{domain}</div>}
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                        {diff   && <span className={diffCls}>{diff}</span>}
                        {impact === 'High' && <span className="mt mt-high">High Impact</span>}
                        {domain && <span className="mt mt-domain">{domain}</span>}
                    </div>
                    {desc && (
                        <div className="detail-field">
                            <div className="detail-field-label">Problem Description</div>
                            <div className="detail-field-value">{desc}</div>
                        </div>
                    )}
                    {claimed && (
                        <div className="detail-field">
                            <div className="detail-field-label">Being Explored By</div>
                            <div className="detail-field-value" style={{ color: T.blue, fontWeight: 600 }}>🔍 {claimed}</div>
                        </div>
                    )}
                    <div className="detail-avail">
                        Multiple teams can work on the same problem — pick whichever one fits your idea best.
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── REG DOC DETAIL MODAL ─────────────────────────────────────────────────────
function RegDocModal({ reg, onClose, regNameF, regSummaryF, regRiskF, regHackF }) {
    const name    = regNameF    ? reg.getCellValueAsString(regNameF)    : reg.name;
    const summary = regSummaryF ? reg.getCellValueAsString(regSummaryF) : '';
    const risk    = regRiskF    ? reg.getCellValueAsString(regRiskF)    : '';
    const hackOpp = regHackF    ? reg.getCellValueAsString(regHackF)    : '';
    const displayName = name.replace('.pdf', '').replace(/_/g, ' ');
    const u = risk.toUpperCase();
    const riskCls = u.includes('HIGH') ? 'risk risk-h' : u.includes('MEDIUM') ? 'risk risk-m' : u.includes('LOW') ? 'risk risk-l' : 'risk risk-u';

    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-header">
                    <div>
                        <div className="modal-title">{displayName}</div>
                        <div className="modal-subtitle">Regulatory Document</div>
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {summary && (
                        <div className="detail-field">
                            <div className="detail-field-label">Plain-English Summary</div>
                            <div className="detail-field-value">{summary}</div>
                        </div>
                    )}
                    {risk && (
                        <div className="detail-field">
                            <div className="detail-field-label">Enforcement Risk</div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                                <span className={riskCls}>{u.includes('HIGH') ? 'High Risk' : u.includes('MEDIUM') ? 'Medium Risk' : u.includes('LOW') ? 'Low Risk' : 'Unknown'}</span>
                                <div className="detail-field-value" style={{ flex: 1, minWidth: 180 }}>{risk.replace(/^(HIGH|MEDIUM|LOW)\s*[—–-]\s*/i, '')}</div>
                            </div>
                        </div>
                    )}
                    {hackOpp && (
                        <div className="detail-field">
                            <div className="detail-field-label">Hackathon Automation Opportunity</div>
                            <div className="detail-opp">
                                <div className="detail-field-value">{hackOpp}</div>
                            </div>
                        </div>
                    )}
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
            {optional && <div className="fh">Optional — teams can have 1–5 members.</div>}
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
function RegistrationModal({ onClose, onRegister, submissionsTable, dirRecords, dirNameField, dirEmailField }) {
    const [teamName,   setTeamName]   = useState('');
    const [useCase,    setUseCase]    = useState('');
    const [technology, setTechnology] = useState('');
    const [otherTech,  setOtherTech]  = useState('');
    const [attendance, setAttendance] = useState('');
    const [captain,    setCaptain]    = useState(null);
    const [member2,    setMember2]    = useState(null);
    const [member3,    setMember3]    = useState(null);
    const [member4,    setMember4]    = useState(null);
    const [member5,    setMember5]    = useState(null);
    const [agreed,     setAgreed]     = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success,    setSuccess]    = useState(false);
    const [submitError,setSubmitError]= useState('');
    const [errors,     setErrors]     = useState({});

    const validate = () => {
        const e = {};
        if (!teamName.trim())  e.teamName   = 'Team name is required.';
        if (!useCase.trim())   e.useCase    = 'Please describe your use case.';
        if (!technology)       e.technology = 'Select a technology.';
        if (technology === 'Other' && !otherTech.trim()) e.otherTech = 'Please specify.';
        if (!attendance)       e.attendance = 'Select an attendance format.';
        if (!captain)          e.captain    = 'Team Captain is required.';
        if (!agreed)           e.agreed     = 'You must agree to the rules to register.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true); setSubmitError('');
        try {
            const tN  = submissionsTable.getFieldIfExists('Team Name');
            const uC  = submissionsTable.getFieldIfExists('Use Case');
            const tF  = submissionsTable.getFieldIfExists('Technology');
            const oT  = submissionsTable.getFieldIfExists('Other Technology');
            const aF  = submissionsTable.getFieldIfExists('Attendance Format');
            const sF  = submissionsTable.getFieldIfExists('Submission Status');
            const m1F = submissionsTable.getFieldIfExists('Team Member # 1 ( Captain)');
            const m2F = submissionsTable.getFieldIfExists('Team Member # 2');
            const m3F = submissionsTable.getFieldIfExists('Team Member # 3');
            const m4F = submissionsTable.getFieldIfExists('Team Member # 4');
            const m5F = submissionsTable.getFieldIfExists('Team Member # 5');
            const rF  = submissionsTable.getFieldIfExists('By Selecting the checkbox, you attest that you have read the rules linked above and agree that your team will follow them.');
            const rlF = submissionsTable.getFieldIfExists('Link To Hackathon Rules & Guidelines');

            const fields = {};
            if (tN)  fields[tN.id]  = teamName.trim();
            if (uC)  fields[uC.id]  = useCase.trim();
            if (tF)  fields[tF.id]  = { name: technology };
            if (oT && technology === 'Other') fields[oT.id] = otherTech.trim();
            if (aF)  fields[aF.id]  = { name: attendance };
            if (sF)  fields[sF.id]  = { name: 'Registered' };
            if (rF)  fields[rF.id]  = true;
            if (rlF) fields[rlF.id] = RULES_URL;
            if (m1F && captain) fields[m1F.id] = [{ id: captain.id }];
            if (m2F && member2) fields[m2F.id] = [{ id: member2.id }];
            if (m3F && member3) fields[m3F.id] = [{ id: member3.id }];
            if (m4F && member4) fields[m4F.id] = [{ id: member4.id }];
            if (m5F && member5) fields[m5F.id] = [{ id: member5.id }];

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

    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                {success ? (
                    <div className="success-wrap">
                        <div className="success-icon">🎉</div>
                        <div className="success-title">You're registered!</div>
                        <div className="success-sub">
                            <strong>{teamName}</strong> is on the leaderboard. The GG Digital Acceleration team will be in touch.
                        </div>
                        <button className="btn-primary" onClick={onClose}>Back to Portal</button>
                    </div>
                ) : (
                    <>
                        <div className="modal-header">
                            <div>
                                <div className="modal-title">Register Your Team</div>
                                <div className="modal-subtitle">2026 GG AI Hackathon</div>
                            </div>
                            <button className="modal-close" onClick={onClose}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="fs">
                                <div className="fs-title">Your Project</div>
                                <div className="fr">
                                    <label className="form-label">Team Name<span className="req">*</span></label>
                                    <input className="fi" placeholder="e.g. The Compliance Crushers" value={teamName} onChange={e => setTeamName(e.target.value)} />
                                    {errors.teamName && <div className="ferr">{errors.teamName}</div>}
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
                                        <div className="fh">Free training available for all three options.</div>
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
                            </div>

                            <div className="fs">
                                <div className="fs-title">Your Team</div>
                                <MemberSearch label="Team Captain" dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={captain} onSelect={setCaptain} />
                                {errors.captain && <div className="ferr" style={{ marginTop: -8, marginBottom: 10 }}>{errors.captain}</div>}
                                <MemberSearch label="Member 2" optional dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={member2} onSelect={setMember2} />
                                <MemberSearch label="Member 3" optional dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={member3} onSelect={setMember3} />
                                <MemberSearch label="Member 4" optional dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={member4} onSelect={setMember4} />
                                <MemberSearch label="Member 5" optional dirRecords={dirRecords} nameField={dirNameField} emailField={dirEmailField} selected={member5} onSelect={setMember5} />
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

                            {submitError && submitError !== '__EXTERNAL__' && (
                                <div className="submit-err">{submitError}</div>
                            )}
                            {submitError === '__EXTERNAL__' && (
                                <div className="submit-err">
                                    This interface doesn't have write access to the submissions table. Please use the{' '}
                                    <a href={EXTERNAL_FORM_URL} target="_blank" rel="noreferrer" style={{ color: '#B91C1C', fontWeight: 700 }}>registration form</a> instead.
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={onClose}>Cancel</button>
                            <button className="submit-btn" disabled={submitting} onClick={handleSubmit}>
                                {submitting ? <><span className="spinner" /> Registering…</> : '✓ Register Team'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'teams',    label: '👥 Teams'        },
    { id: 'problems', label: '🎯 Problems'      },
    { id: 'data',     label: '📊 Data'          },
    { id: 'prompts',  label: '💡 Prompts'       },
    { id: 'inspired', label: '🚀 Get Inspired'  },
];

function App() {
    const base = useBase();

    // ── Tables ──────────────────────────────────────────────────────────────
    const subTable  = base.getTableByNameIfExists('Hackathon Submissions') ?? base.tables[0];
    const probTable = base.getTableByNameIfExists('Problem Statements')    ?? base.tables[0];
    const dirTable  = base.getTableByNameIfExists('GG Directory')          ?? base.tables[0];
    const prmTable  = base.getTableByNameIfExists('Prompt Library')        ?? base.tables[0];
    const regTable  = base.getTableByNameIfExists('Regulatory Documents')  ?? base.tables[0];

    // ── Records ─────────────────────────────────────────────────────────────
    const submissions = useRecords(subTable);
    const probRecords = useRecords(probTable);
    const dirRecords  = useRecords(dirTable);
    const prmRecords  = useRecords(prmTable);
    const regDocs     = useRecords(regTable);

    // ── UI State ─────────────────────────────────────────────────────────────
    const [tab,       setTab]       = useState('teams');
    const [showReg,   setShowReg]   = useState(false);
    const [selProb,   setSelProb]   = useState(null);
    const [selReg,    setSelReg]    = useState(null);
    const [prmFilter, setPrmFilter] = useState('All');
    const [copiedId,  setCopiedId]  = useState(null);

    // ── Field detection: submissions ─────────────────────────────────────────
    const sfTeamName = subTable.getFieldIfExists('Team Name');
    const sfTech     = subTable.getFieldIfExists('Technology');
    const sfAttend   = subTable.getFieldIfExists('Attendance Format');
    const sfStatus   = subTable.getFieldIfExists('Submission Status');

    // ── Field detection: problems ────────────────────────────────────────────
    const pfId      = probTable.getFieldIfExists('Problem ID');
    const pfTitle   = probTable.getFieldIfExists('Name') ?? probTable.getFieldIfExists('Problem');
    const pfDesc    = probTable.getFieldIfExists('Description') ?? probTable.getFieldIfExists('Current State');
    const pfDiff    = probTable.getFieldIfExists('Difficulty');
    const pfImpact  = probTable.getFieldIfExists('Impact');
    const pfDomain  = probTable.getFieldIfExists('Domain') ?? probTable.getFieldIfExists('Category');
    const pfClaimed = probTable.getFieldIfExists('Claimed By') ?? probTable.getFieldIfExists('Teams Exploring');

    // ── Field detection: directory ───────────────────────────────────────────
    const dfName  = dirTable.getFieldIfExists('Name') ?? dirTable.getFieldIfExists('Associate Name');
    const dfEmail = dirTable.getFieldIfExists('Email') ?? dirTable.getFieldIfExists('Work Email');

    // ── Field detection: prompts ─────────────────────────────────────────────
    const prmfTitle    = prmTable.getFieldIfExists('Name') ?? prmTable.getFieldIfExists('Prompt Name');
    const prmfCat      = prmTable.getFieldIfExists('Category');
    const prmfDiff     = prmTable.getFieldIfExists('Difficulty') ?? prmTable.getFieldIfExists('Level');
    const prmfText     = prmTable.getFieldIfExists('Prompt Text') ?? prmTable.getFieldIfExists('Prompt');
    const prmfProduces = prmTable.getFieldIfExists('What It Produces') ?? prmTable.getFieldIfExists('Output');

    // ── Field detection: reg docs ────────────────────────────────────────────
    const rdfName    = regTable.getFieldIfExists('Name') ?? regTable.getFieldIfExists('Document Name');
    const rdfSummary = regTable.getFieldIfExists('Plain-English Summary') ?? regTable.getFieldIfExists('Summary');
    const rdfRisk    = regTable.getFieldIfExists('Enforcement Risk') ?? regTable.getFieldIfExists('Risk Level');
    const rdfHack    = regTable.getFieldIfExists('Hackathon Automation Opportunity') ?? regTable.getFieldIfExists('AI Opportunity');

    // ── Derived data ─────────────────────────────────────────────────────────
    const liveTeams = useMemo(() =>
        submissions.filter(r => {
            const name = sfTeamName ? r.getCellValueAsString(sfTeamName) : '';
            return !TEST_NAMES.includes(name.trim());
        }),
        [submissions, sfTeamName]
    );

    const prmCategories = useMemo(() => {
        const cats = new Set(prmRecords.map(r => prmfCat ? r.getCellValueAsString(prmfCat) : '').filter(Boolean));
        return ['All', ...Array.from(cats).sort()];
    }, [prmRecords, prmfCat]);

    const filteredPrms = useMemo(() =>
        prmFilter === 'All' ? prmRecords : prmRecords.filter(r => prmfCat && r.getCellValueAsString(prmfCat) === prmFilter),
        [prmRecords, prmFilter, prmfCat]
    );

    const copyPrompt = (id, text) => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const stats = [
        { num: liveTeams.length,         label: 'Teams Registered'  },
        { num: probRecords.length || 12,  label: 'Problem Statements'},
        { num: STATIC_DATASETS.length,   label: 'Datasets Available'},
        { num: prmRecords.length || 40,   label: 'Prompt Templates'  },
    ];

    // ── Renderers ────────────────────────────────────────────────────────────
    const renderTeamRow = (r, i) => {
        const name   = sfTeamName ? r.getCellValueAsString(sfTeamName) : '—';
        const tech   = sfTech     ? (r.getCellValue(sfTech)?.name ?? '—') : '—';
        const attend = sfAttend   ? (r.getCellValue(sfAttend)?.name ?? '—') : '—';
        const status = sfStatus   ? r.getCellValueAsString(sfStatus) : '';
        return (
            <tr key={r.id}>
                <td><span className="row-num">{i + 1}</span></td>
                <td><span className="tnc">{name}</span></td>
                <td>{tech}</td>
                <td>{attend}</td>
                <td><StatusBadge value={status} /></td>
            </tr>
        );
    };

    const renderProbCard = r => {
        const id     = pfId     ? r.getCellValueAsString(pfId)    : '';
        const title  = pfTitle  ? r.getCellValueAsString(pfTitle) : r.name;
        const desc   = pfDesc   ? r.getCellValueAsString(pfDesc)  : '';
        const diff   = pfDiff   ? (r.getCellValue(pfDiff)?.name ?? '') : '';
        const impact = pfImpact ? (r.getCellValue(pfImpact)?.name ?? '') : '';
        const domain = pfDomain ? r.getCellValueAsString(pfDomain) : '';
        const claimed= pfClaimed? r.getCellValueAsString(pfClaimed): '';
        const diffCls = diff === 'Easy' ? 'mt mt-easy' : diff === 'Medium' ? 'mt mt-medium' : diff === 'Hard' ? 'mt mt-hard' : 'mt mt-domain';
        return (
            <div key={r.id} className="prob-card" onClick={() => setSelProb(r)}>
                {id && <div className="prob-id">{id}</div>}
                <div className="prob-title">{title}</div>
                {desc && <div className="prob-desc">{desc.slice(0, 120)}{desc.length > 120 ? '…' : ''}</div>}
                <div className="prob-meta">
                    {diff   && <span className={diffCls}>{diff}</span>}
                    {impact === 'High' && <span className="mt mt-high">High Impact</span>}
                    {domain && <span className="mt mt-domain">{domain}</span>}
                </div>
                {claimed && <div className="prob-claimed">🔍 {claimed}</div>}
            </div>
        );
    };

    const renderRegCard = r => {
        const name    = rdfName    ? r.getCellValueAsString(rdfName)    : r.name;
        const summary = rdfSummary ? r.getCellValueAsString(rdfSummary) : '';
        const risk    = rdfRisk    ? r.getCellValueAsString(rdfRisk)    : '';
        const display = name.replace('.pdf', '').replace(/_/g, ' ');
        const u = risk.toUpperCase();
        const riskCls = u.includes('HIGH') ? 'risk risk-h' : u.includes('MEDIUM') ? 'risk risk-m' : u.includes('LOW') ? 'risk risk-l' : 'risk risk-u';
        const riskLabel = u.includes('HIGH') ? 'High Risk' : u.includes('MEDIUM') ? 'Medium Risk' : u.includes('LOW') ? 'Low Risk' : risk || 'Unknown';
        return (
            <div key={r.id} className="reg-card" onClick={() => setSelReg(r)}>
                <div className="reg-name">{display}</div>
                {summary && <div className="reg-sum">{summary.slice(0, 100)}{summary.length > 100 ? '…' : ''}</div>}
                {risk && <span className={riskCls}>{riskLabel}</span>}
            </div>
        );
    };

    const renderPromptCard = r => {
        const title    = prmfTitle    ? r.getCellValueAsString(prmfTitle)    : r.name;
        const cat      = prmfCat      ? r.getCellValueAsString(prmfCat)      : '';
        const diff     = prmfDiff     ? r.getCellValueAsString(prmfDiff)     : '';
        const text     = prmfText     ? r.getCellValueAsString(prmfText)     : '';
        const produces = prmfProduces ? r.getCellValueAsString(prmfProduces) : '';
        const diffCls  = diff === 'Beginner' ? 'pt-d-b' : diff === 'Intermediate' ? 'pt-d-i' : diff === 'Advanced' ? 'pt-d-a' : '';
        const isCopied = copiedId === r.id;
        return (
            <div key={r.id} className="prompt-card">
                <div className="pt-title">{title}</div>
                <div className="pt-meta">
                    {cat  && <span className="pt-cat">{cat}</span>}
                    {diff && diffCls && <span className={diffCls}>{diff}</span>}
                </div>
                {produces && <div className="pt-produces">{produces}</div>}
                {text && (
                    <div className="pt-text-wrap">
                        <div className="pt-text">{text}</div>
                        <button className={`copy-btn${isCopied ? ' copied' : ''}`} onClick={() => copyPrompt(r.id, text)}>
                            {isCopied ? '✓ Copied' : 'Copy'}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="portal">
            <style>{css}</style>

            {/* ── NAV ── */}
            <nav className="nav">
                <div className="nav-brand">
                    <div className="nav-spark"><SparkIcon size={16} /></div>
                    GG AI Hackathon · 2026
                </div>
                <button className="nav-cta" onClick={() => setShowReg(true)}>Register Your Team →</button>
            </nav>

            {/* ── HERO ── */}
            <section className="hero">
                <div className="hero-inner">
                    <div className="hero-left">
                        <div className="hero-eyebrow">GG Digital Acceleration · 2026</div>
                        <h1>GG AI <span className="accent">Hackathon</span></h1>
                        <div className="hero-byline">Build something that matters. Win something that counts.</div>
                        <div className="hero-sub">
                            48 hours. Real data. Real problems. Use Airtable, Harvey, or CodePuppy to build an AI-powered solution for Walmart's Global Governance team — then pitch it.
                        </div>
                        <div className="hero-actions">
                            <button className="btn-primary" onClick={() => setShowReg(true)}>
                                <SparkIcon size={15} color="#0B2C5F" />
                                Register Your Team
                            </button>
                            <a className="btn-outline" href={RULES_URL} target="_blank" rel="noreferrer">
                                📋 Read the Rules
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
                    {stats.map(s => (
                        <div key={s.label} className="stat-item">
                            <div className="stat-num">{s.num}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div className="content-wrap">
                <div className="tabs">
                    {TABS.map(t => (
                        <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* TEAMS */}
                {tab === 'teams' && (
                    <div>
                        <div className="sh"><span className="sl">Live</span><span className="st">Team Roster</span></div>
                        <p className="ss">
                            <span className="live-dot" />
                            {liveTeams.length} team{liveTeams.length !== 1 ? 's' : ''} registered.{' '}
                            Registration is open —{' '}
                            <button style={{ background: 'none', border: 'none', color: T.blue, cursor: 'pointer', font: 'inherit', padding: 0, fontWeight: 600 }} onClick={() => setShowReg(true)}>add yours</button>.
                        </p>
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Team Name</th>
                                    <th>Technology</th>
                                    <th>Attendance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {liveTeams.length === 0
                                    ? <tr><td colSpan={5} className="empty">No teams registered yet — be the first!</td></tr>
                                    : liveTeams.map(renderTeamRow)
                                }
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PROBLEMS */}
                {tab === 'problems' && (
                    <div>
                        <div className="sh"><span className="sl">Open</span><span className="st">Problem Statements</span></div>
                        <p className="ss">GG-specific challenges. Click any card to see the full brief. Multiple teams can tackle the same problem.</p>
                        <div className="prob-grid">
                            {probRecords.length > 0
                                ? probRecords.map(renderProbCard)
                                : <p style={{ color: T.muted, fontSize: 13 }}>Loading problem statements…</p>
                            }
                        </div>
                    </div>
                )}

                {/* DATA */}
                {tab === 'data' && (
                    <div>
                        <div className="sh"><span className="sl">Regulatory</span><span className="st">Compliance Documents</span></div>
                        <p className="ss">Regulations parsed by Harvey into plain-English summaries, risk levels, and hackathon automation opportunities. Click any card to explore.</p>
                        <div className="reg-grid">
                            {regDocs.length > 0
                                ? regDocs.map(renderRegCard)
                                : <p style={{ color: T.muted, fontSize: 13 }}>Loading regulatory documents…</p>
                            }
                        </div>
                        <div className="divider" />
                        <div className="sh"><span className="sl">Datasets</span><span className="st">Available Data</span></div>
                        <p className="ss">Pre-loaded Airtable tables you can build on. All datasets are live and ready in your hackathon base.</p>
                        <div className="ds-grid">
                            {STATIC_DATASETS.map(d => (
                                <div key={d.title} className="ds-card">
                                    <div className="ds-icon">{d.icon}</div>
                                    <div className="ds-title">{d.title}</div>
                                    <div className="ds-desc">{d.desc}</div>
                                    <div className="ds-tags">{d.tags.map(t => <span key={t} className="ds-tag">{t}</span>)}</div>
                                    <div className="ds-rows">{d.rows}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PROMPTS */}
                {tab === 'prompts' && (
                    <div>
                        <div className="sh"><span className="sl">AI Toolkit</span><span className="st">Prompt Library</span></div>
                        <p className="ss">Ready-to-use prompts. Paste directly into Harvey or an Airtable AI field. Click Copy to grab any prompt.</p>
                        <div className="filter-pills">
                            {prmCategories.map(c => (
                                <button key={c} className={`fp${prmFilter === c ? ' active' : ''}`} onClick={() => setPrmFilter(c)}>{c}</button>
                            ))}
                        </div>
                        <div className="prompt-grid">
                            {filteredPrms.length > 0
                                ? filteredPrms.map(renderPromptCard)
                                : <p style={{ color: T.muted, fontSize: 13 }}>No prompts in this category.</p>
                            }
                        </div>
                    </div>
                )}

                {/* INSPIRED */}
                {tab === 'inspired' && (
                    <div>
                        <div className="ins-section">
                            <div className="ins-label">Mashup Ideas — Combine datasets to build something unexpected</div>
                            <div className="mashup-grid">
                                {MASHUP_IDEAS.map(m => (
                                    <div key={m.title} className="mashup-card">
                                        <div className="mashup-icon">{m.icon}</div>
                                        <div className="mashup-title">{m.title}</div>
                                        <div className="mashup-desc">{m.desc}</div>
                                        <div className="mashup-tags">{m.tables.map(t => <span key={t} className="mashup-tag">{t}</span>)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="divider" />
                        <div className="ins-section">
                            <div className="ins-label">Technology Guides — What each tool does best</div>
                            <div className="tg-grid">
                                {TECH_GUIDES.map(g => (
                                    <div key={g.name} className="tg-card">
                                        <div className="tg-name">{g.name}</div>
                                        <div className="tg-best">{g.best}</div>
                                        <div className="tg-desc">{g.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="divider" />
                        <div className="ins-section">
                            <div className="ins-label">Judging Criteria — How projects will be evaluated</div>
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
                        </div>
                    </div>
                )}
            </div>

            {/* ── FOOTER ── */}
            <footer className="footer">
                <div className="footer-brand">GG DIGITAL ACCELERATION · 2026 AI HACKATHON</div>
                <div className="footer-links">
                    <a href={RULES_URL} target="_blank" rel="noreferrer">Rules</a>
                    <a href={EXTERNAL_FORM_URL} target="_blank" rel="noreferrer">Submit Project</a>
                </div>
            </footer>

            {/* ── MODALS ── */}
            {showReg && (
                <RegistrationModal
                    onClose={() => setShowReg(false)}
                    onRegister={() => {}}
                    submissionsTable={subTable}
                    dirRecords={dirRecords}
                    dirNameField={dfName}
                    dirEmailField={dfEmail}
                />
            )}
            {selProb && (
                <ProblemDetailModal
                    prob={selProb}
                    onClose={() => setSelProb(null)}
                    probIdF={pfId}
                    probTitleF={pfTitle}
                    probDescF={pfDesc}
                    probDiffF={pfDiff}
                    probImpactF={pfImpact}
                    probDomainF={pfDomain}
                    probClaimedF={pfClaimed}
                />
            )}
            {selReg && (
                <RegDocModal
                    reg={selReg}
                    onClose={() => setSelReg(null)}
                    regNameF={rdfName}
                    regSummaryF={rdfSummary}
                    regRiskF={rdfRisk}
                    regHackF={rdfHack}
                />
            )}
        </div>
    );
}

initializeBlock({ interface: () => <App /> });
