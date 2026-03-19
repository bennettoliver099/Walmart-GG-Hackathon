import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import './style.css';
import {
    NotePencilIcon, ClipboardTextIcon, TrophyIcon,
    QuestionIcon, HeadsetIcon, ChalkboardTeacherIcon, UsersThreeIcon,
    HandWavingIcon, MagnifyingGlassIcon,
} from '@phosphor-icons/react';
import {
    initializeBlock,
    useBase,
    useRecords,
    useSession,
} from '@airtable/blocks/interface/ui';

// ─── SAFE FIELD HELPERS ──────────────────────────────────────────────────────
function safeGetCellValue(record, fieldName) {
    try { return record.getCellValue(fieldName); } catch { return null; }
}
function safeGetCellValueAsString(record, fieldName) {
    try { return record.getCellValueAsString(fieldName); } catch { return ''; }
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const EXTERNAL_FORM_URL     = 'https://airtable.com/app4AdZ5m3rWZ4kt8/pagX2wubHXk1Q7Em0/form';
const RULES_URL             = 'https://teams.wal-mart.com/sites/GGDigitalAcceleration';
const TEST_NAMES            = ['Test', 'Test ', 'Test2', 'test 5', 'Rest'];
const TECH_OPTIONS          = ['Airtable', 'CodePuppy', 'Harvey', 'Other'];
const ATTENDANCE_OPTIONS    = ['Virtual', 'In Person', 'Hybrid'];
const MAX_TEAMS             = 50;
const HUB_DOC_TITLES        = { rules: 'Rules & Guidelines', prizes: 'Payouts & Prizes', reginfo: 'Registration Info', faqs: 'FAQs' };

// ─── WALMART SPARK SVG ────────────────────────────────────────────────────────
const SPARK_PATHS = `<path d="M375.663,273.363c12.505-2.575,123.146-53.269,133.021-58.97c22.547-13.017,30.271-41.847,17.254-64.393s-41.847-30.271-64.393-17.254c-9.876,5.702-109.099,76.172-117.581,85.715c-9.721,10.937-11.402,26.579-4.211,39.033C346.945,269.949,361.331,276.314,375.663,273.363z"/><path d="M508.685,385.607c-9.876-5.702-120.516-56.396-133.021-58.97c-14.332-2.951-28.719,3.415-35.909,15.87c-7.191,12.455-5.51,28.097,4.211,39.033c8.482,9.542,107.705,80.013,117.581,85.715c22.546,13.017,51.376,5.292,64.393-17.254S531.231,398.624,508.685,385.607z"/><path d="M266.131,385.012c-14.382,0-27.088,9.276-31.698,23.164c-4.023,12.117-15.441,133.282-15.441,144.685c0,26.034,21.105,47.139,47.139,47.139c26.034,0,47.139-21.105,47.139-47.139c0-11.403-11.418-132.568-15.441-144.685C293.219,394.288,280.513,385.012,266.131,385.012z"/><path d="M156.599,326.637c-12.505,2.575-123.146,53.269-133.021,58.97C1.031,398.624-6.694,427.454,6.323,450c13.017,22.546,41.847,30.271,64.393,17.254c9.876-5.702,109.098-76.172,117.58-85.715c9.722-10.937,11.402-26.579,4.211-39.033S170.931,323.686,156.599,326.637z"/><path d="M70.717,132.746C48.171,119.729,19.341,127.454,6.323,150c-13.017,22.546-5.292,51.376,17.254,64.393c9.876,5.702,120.517,56.396,133.021,58.97c14.332,2.951,28.719-3.415,35.91-15.87c7.191-12.455,5.51-28.096-4.211-39.033C179.815,208.918,80.592,138.447,70.717,132.746z"/><path d="M266.131,0c-26.035,0-47.139,21.105-47.139,47.139c0,11.403,11.418,132.568,15.441,144.685c4.611,13.888,17.317,23.164,31.698,23.164s27.088-9.276,31.698-23.164c4.023-12.117,15.441-133.282,15.441-144.685C313.27,21.105,292.165,0,266.131,0z"/>`;

const SparkIcon = React.memo(function SparkIcon({ size = 20, color = 'white' }) {
    return (
        <svg viewBox="0 0 532.262 600" width={size} height={size} xmlns="http://www.w3.org/2000/svg"
            style={{ fill: color, display: 'block', flexShrink: 0 }}
            dangerouslySetInnerHTML={{ __html: SPARK_PATHS }} />
    );
});



// ─── HOME DASHBOARD CONSTANTS ────────────────────────────────────────────────
const KEY_DATES = [
    { label: 'Registration Closes', date: 'April 10, 2026' },
    { label: 'Hackathon Kickoff',   date: 'May 4 @ 9am CT' },
    { label: 'Submission Deadline', date: 'May 6 @ 5pm CT' },
    { label: 'Judging Day',         date: 'May 7 @ 9am CT' },
];
const ANNOUNCEMENTS = [
    { date: 'May 1',  title: 'Final prep resources posted',       body: 'Check the Resources tab for updated problem statement guides and judging rubric.' },
    { date: 'Apr 25', title: 'Office Hours this Friday @ 2pm CT', body: 'Teams with questions about problem statement selection are encouraged to join.' },
    { date: 'Apr 10', title: 'Registration closes April 10',      body: 'Make sure all team members have submitted their attestation before the deadline.' },
];
const TOOL_NAMES_ORDERED = ['Airtable', 'Harvey', 'CodePuppy', 'Dataiku'];
const HOME_TARGETS = {
    kickoff:  new Date('2026-05-04T14:00:00Z'),
    deadline: new Date('2026-05-06T22:00:00Z'),
    judging:  new Date('2026-05-07T14:00:00Z'),
};
function daysUntil(target) {
    const diff = target.getTime() - Date.now();
    return diff <= 0 ? '0' : String(Math.max(0, Math.floor(diff / 86400000)));
}

function HomeCountdownCell({ label, target }) {
    const [days, setDays] = useState(() => daysUntil(target));
    useEffect(() => {
        const id = setInterval(() => setDays(daysUntil(target)), 60000);
        return () => clearInterval(id);
    }, [target]);
    return (
        <div className="hcd-cell">
            <div className="hcd-num">{days}</div>
            <div className="hcd-label">{label}</div>
        </div>
    );
}

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



// ─── MEMBER SEARCH ────────────────────────────────────────────────────────────
const MemberSearch = React.memo(function MemberSearch({ label, optional, dirRecords, nameField, emailField, selected, onSelect, onNoResults }) {
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
});

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

// ─── UPDATE RECORD (RETRY ON RATE LIMIT / CONFLICT) ───────────────────────────
async function updateRecordWithRetry(table, recordId, fields, attempts = 4) {
    let lastErr = null;
    for (let i = 0; i < attempts; i++) {
        try {
            return await table.updateRecordAsync(recordId, fields);
        } catch (err) {
            lastErr = err;
            const msg = (err?.message ?? '').toLowerCase();
            const isRetryable = msg.includes('conflict') || msg.includes('rate limit') || msg.includes('429');
            if (!isRetryable) throw err;
            await new Promise(r => setTimeout(r, 300 * Math.pow(2, i)));
        }
    }
    throw lastErr;
}

// ─── IN-FLIGHT DEDUP GUARDS (cross-session race condition protection) ──────────
const _pendingTeamNames = new Set();
const _pendingEmails    = new Set();
let   _addSelfPollId    = null;

// ─── REGISTRATION MODAL ───────────────────────────────────────────────────────
function RegistrationModal({ onClose, onRegister, submissionsTable, dirRecords, dirNameField, dirEmailField, initialScreen = 0 }) {
    // screen: 0 = choice, 'team' = team form, 'agent' = free agent form
    const [screen,        setScreen]       = useState(() => initialScreen === 'freeagent' ? 'agent' : initialScreen);

    // ── Team form state ──
    const [teamName,      setTeamName]     = useState('');
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
            try { const f = submissionsTable.getFieldIfExists('Team Name');          if (f) fields[f.id] = teamName.trim(); } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Submission Status');  if (f) fields[f.id] = { name: 'Registered' }; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member # 1 (Captain)'); if (f && captain) fields[f.id] = [{ id: captain.id }]; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member # 2');    if (f && member2) fields[f.id] = [{ id: member2.id }]; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member # 3');    if (f && member3) fields[f.id] = [{ id: member3.id }]; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member # 4');    if (f && member4) fields[f.id] = [{ id: member4.id }]; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member # 5');    if (f && member5) fields[f.id] = [{ id: member5.id }]; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Rules Agreement Checkbox'); if (f) fields[f.id] = true; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Link To Hackathon Rules & Guidelines'); if (f) fields[f.id] = RULES_URL; } catch { /* skip */ }

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
            try { const f = submissionsTable.getFieldIfExists('Team Name');          if (f) fields[f.id] = 'Free Agent Pool'; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Submission Status');  if (f) fields[f.id] = { name: 'Registered' }; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Technology');         if (f && agentTool) fields[f.id] = { name: agentTool }; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Attendance Format');  if (f) fields[f.id] = { name: agentAttend }; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Team Member # 1 (Captain)'); if (f && agentSelf) fields[f.id] = [{ id: agentSelf.id }]; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Rules Agreement Checkbox'); if (f) fields[f.id] = true; } catch { /* skip */ }
            try { const f = submissionsTable.getFieldIfExists('Use Case');           if (f && agentInterest) fields[f.id] = agentInterest; } catch { /* skip */ }

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
                                : <><strong>Teammates will receive an invitation to confirm.</strong> Your team won&apos;t be locked in until all members accept.</>
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
                                <div className="opt-card-desc">No team yet? We&apos;ll match you based on your skills and problem interest.</div>
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
                                    I have read the <button className="inline-link" onClick={() => document.getElementById('rules-card')?.scrollIntoView({ behavior: 'smooth' })}>hackathon rules & guidelines</button> and agree to follow them.
                                </label>
                            </div>
                            {errors.agentAgreed && <div className="ferr">{errors.agentAgreed}</div>}
                        </div>

                        {submitError && submitError !== '__EXTERNAL__' && <div className="submit-err">{submitError}</div>}
                        {submitError === '__EXTERNAL__' && (
                            <div className="submit-err">
                                This interface doesn&apos;t have write access. Please use the{' '}
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
                            This interface doesn&apos;t have write access. Please use the{' '}
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

function HubDocModal({ title, content, onClose, onRegisterNow }) {
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
                    {onRegisterNow && (
                        <button className="btn-primary" onClick={onRegisterNow}>Register Now →</button>
                    )}
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
function AdminView({ onBack, liveTeams, subTable, sfTeamName, sfStatus, totalTeams, submittedTeams, registeredTeams }) {
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

    const snapshotText = `Hackathon Status — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\nTeams Registered: ${totalTeams} of ${MAX_TEAMS}\nSubmitted: ${submittedTeams} teams ready\nRegistered: ${registeredTeams} teams confirmed\nIssues: ${issueCount} teams need attention\nDays to Kickoff: ${daysToKickoff}`;

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
                            <button className={`adm-sidebar-tab${sidebarTab === 'problems' ? ' active' : ''}`} onClick={() => setSidebarTab('problems')}>Problems</button>
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
                                <div className="adm-sidebar-footer">{totalTeams} of {MAX_TEAMS} slots filled</div>
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
                            </div>
                        </div>

                        {/* Status Snapshot */}
                        <div className="adm-card">
                            <div className="adm-card-header">
                                <div className="adm-card-title">Status Snapshot</div>
                                <button className={`adm-copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>{copied ? '✓ Copied' : 'Copy'}</button>
                            </div>
                            <div className="adm-snapshot-body">
                                <div><strong>Teams Registered:</strong> {totalTeams} of {MAX_TEAMS}</div>
                                <div><strong>Submitted:</strong> {submittedTeams} teams ready to present</div>
                                <div><strong>Registered:</strong> {registeredTeams} teams confirmed</div>
                                <div><strong>Issues:</strong> {issueCount} teams need attention</div>
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
const MEMBER_SLOT_DEFS = [
    { label:'Captain',  field:'Team Member # 1 (Captain)', isCaptain:true  },
    { label:'Member 2', field:'Team Member # 2',            isCaptain:false },
    { label:'Member 3', field:'Team Member # 3',            isCaptain:false },
    { label:'Member 4', field:'Team Member # 4',            isCaptain:false },
    { label:'Member 5', field:'Team Member # 5',            isCaptain:false },
];
const SLOT_FIELDS = MEMBER_SLOT_DEFS.map(d => d.field);

// ─── TEAM CARD (memoized — only re-renders when its specific record or active UI state changes) ──
const TeamCard = React.memo(function TeamCard({
    teamRec, userDirId, currentMembership,
    joinConfirmTeam, joinError, joinSubmitting, leaveSubmitting, captainActionSubmitting,
    captainPanel, captainReassignSlot, captainActionError, leaveConfirm,
    setJoinConfirmTeam, setJoinError, setCaptainPanel,
    setCaptainReassignSlot, setCaptainActionError, setLeaveConfirm,
    handleJoinTeam, handleLeaveTeam, handleCaptainReassignAndLeave, handleDeleteTeam,
}) {
    // All field reads memoized — runs once per record update, not on every parent render
    const { slots, tName, status, attendance, filledCount, openCount, statusColor, statusBg } = useMemo(() => {
        const tName_      = safeGetCellValueAsString(teamRec, 'Team Name');
        const status_     = safeGetCellValueAsString(teamRec, 'Submission Status');
        const attendance_ = safeGetCellValueAsString(teamRec, 'Attendance Format');
        let filledCount_ = 0;
        const slots_ = MEMBER_SLOT_DEFS.map(({ label, field, isCaptain }) => {
            const link   = safeGetCellValue(teamRec, field);
            const filled = Array.isArray(link) && link.length > 0;
            if (filled) filledCount_++;
            return { label, field, isCaptain, filled, memberName: filled ? link[0].name : null };
        });
        const openCount_    = 5 - filledCount_;
        const statusColor_  = status_ === 'Registered' ? '#15803D' : status_ === 'Pending' ? '#A16207' : '#1D4ED8';
        const statusBg_     = status_ === 'Registered' ? '#DCFCE7'  : status_ === 'Pending' ? '#FEF3C7'  : '#EFF6FF';
        return { slots: slots_, tName: tName_, status: status_, attendance: attendance_, filledCount: filledCount_, openCount: openCount_, statusColor: statusColor_, statusBg: statusBg_ };
    }, [teamRec]);

    const membershipOnThisTeam = userDirId ? findUserOnTeam([teamRec], userDirId) : null;
    const isOnThisTeam         = membershipOnThisTeam !== null;
    const isCaptainOfThisTeam  = membershipOnThisTeam?.isCaptain ?? false;
    const isCurrentCaptain     = currentMembership && currentMembership.isCaptain;
    const isConfirming         = joinConfirmTeam?.id === teamRec.id;

    return (
        <div id={`tb-card-${teamRec.id}`} className="tb-card" style={isConfirming ? {borderColor:'#0071CE',boxShadow:'0 0 0 2px rgba(0,113,206,0.18)'} : {}}>
            <div className="tb-card-header">
                <div className="tb-card-name">{tName}</div>
                <div className="tb-card-pills">
                    {status     && <span className="tb-pill" style={{background:statusBg,color:statusColor}}>{status}</span>}
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
                        <span style={{fontSize:11,fontWeight:700,color:'#15803D'}}>You&apos;re here ✓</span>
                        <button
                            className="tb-leave-btn"
                            disabled={leaveSubmitting || captainActionSubmitting}
                            onClick={() => {
                                if (isCaptainOfThisTeam) {
                                    const isOpen = captainPanel?.id === teamRec.id;
                                    setCaptainPanel(isOpen ? null : teamRec);
                                    setCaptainReassignSlot('');
                                    setCaptainActionError('');
                                    setLeaveConfirm(null);
                                } else {
                                    setLeaveConfirm(leaveConfirm?.id === teamRec.id ? null : teamRec);
                                    setCaptainPanel(null);
                                }
                            }}
                        >
                            Leave
                        </button>
                    </div>
                ) : openCount > 0 ? (
                    <button
                        className="tb-card-join-btn"
                        disabled={joinSubmitting}
                        style={isConfirming ? {background:'#0B2C5F'} : {}}
                        onClick={() => {
                            setJoinConfirmTeam(isConfirming ? null : teamRec);
                            setJoinError('');
                            if (!isConfirming) {
                                requestAnimationFrame(() => {
                                    const el = document.getElementById(`tb-card-${teamRec.id}`);
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                });
                            }
                        }}
                    >
                        {isConfirming ? 'Cancel' : currentMembership && !isOnThisTeam ? 'Switch →' : 'Join →'}
                    </button>
                ) : (
                    <span className="tb-card-full">Full</span>
                )}
            </div>

            {/* Captain management panel */}
            {captainPanel?.id === teamRec.id && (() => {
                const teammates = slots
                    .filter(s => !s.isCaptain && s.filled)
                    .map(s => ({ slot: s.field, name: s.memberName }));
                const hasTeammates = teammates.length > 0;
                return (
                    <div className="tb-card-confirm" style={{background:'#FFF8E6',borderColor:'rgba(161,98,7,0.3)'}}>
                        {hasTeammates ? (
                            <>
                                <div className="tb-card-confirm-text" style={{color:'#78500E',marginBottom:10}}>
                                    <strong>You&apos;re the team captain.</strong> Transfer captainship to a teammate before leaving.
                                </div>
                                <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:10}}>
                                    {teammates.map(({ slot, name }) => (
                                        <label key={slot} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:'#78500E'}}>
                                            <input
                                                type="radio"
                                                name={`reassign-${teamRec.id}`}
                                                value={slot}
                                                checked={captainReassignSlot === slot}
                                                onChange={() => setCaptainReassignSlot(slot)}
                                            />
                                            {name}
                                        </label>
                                    ))}
                                </div>
                                {captainActionError && <div className="ferr" style={{marginBottom:8}}>{captainActionError}</div>}
                                <div className="confirm-btns">
                                    <button
                                        className="confirm-btn-yes"
                                        style={{background: captainReassignSlot ? '#B91C1C' : '#9CA3AF'}}
                                        disabled={!captainReassignSlot || captainActionSubmitting}
                                        onClick={() => handleCaptainReassignAndLeave(teamRec, captainReassignSlot)}
                                    >
                                        {captainActionSubmitting ? <><span className="spinner"/> Transferring…</> : 'Transfer & Leave'}
                                    </button>
                                    <button className="confirm-btn-no" onClick={() => { setCaptainPanel(null); setCaptainReassignSlot(''); setCaptainActionError(''); }}>Cancel</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="tb-card-confirm-text" style={{color:'#78500E',marginBottom:8}}>
                                    <strong>You&apos;re the only member.</strong> Leaving will permanently delete this team.
                                </div>
                                {captainActionError && <div className="ferr" style={{marginBottom:8}}>{captainActionError}</div>}
                                <div className="confirm-btns">
                                    <button
                                        className="confirm-btn-yes"
                                        style={{background:'#B91C1C'}}
                                        disabled={captainActionSubmitting}
                                        onClick={() => handleDeleteTeam(teamRec)}
                                    >
                                        {captainActionSubmitting ? <><span className="spinner"/> Deleting…</> : 'Delete Team & Leave'}
                                    </button>
                                    <button className="confirm-btn-no" onClick={() => { setCaptainPanel(null); setCaptainActionError(''); }}>Cancel</button>
                                </div>
                            </>
                        )}
                    </div>
                );
            })()}

            {/* Non-captain leave confirm */}
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

            {/* Join / Switch confirm */}
            {isConfirming && (
                <div className="tb-card-confirm">
                    {isCurrentCaptain ? (
                        <>
                            <div className="tb-card-confirm-text">
                                To join another team, first use the <strong>Leave</strong> button on your current team to transfer captainship or delete the team.
                            </div>
                            <div className="confirm-btns">
                                <button className="confirm-btn-no" onClick={() => { setJoinConfirmTeam(null); setJoinError(''); }}>Got it</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="tb-card-confirm-text">
                                {currentMembership
                                    ? <>Leave <strong>{currentMembership.teamName}</strong> and join <strong>{tName}</strong>?</>
                                    : <>Join <strong>{tName}</strong>? You&apos;ll be added as a member.</>
                                }
                            </div>
                            {joinError && <div className="ferr" style={{marginBottom:8}}>{joinError}</div>}
                            <div className="confirm-btns">
                                <button className="confirm-btn-yes" disabled={joinSubmitting} onClick={() => handleJoinTeam(teamRec)}>
                                    {joinSubmitting ? <><span className="spinner"/> Joining…</> : 'Confirm'}
                                </button>
                                <button className="confirm-btn-no" onClick={() => { setJoinConfirmTeam(null); setJoinError(''); }}>Cancel</button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
});

const RegistrationSection = React.memo(function RegistrationSection({
    dirTable, subTable, dirRecords, liveTeams, freeAgents, volunteerAgents,
    dfName, dfEmail,
    selfRegistered, setSelfRegistered, setStep1Complete,
    sessionEmail, sessionUserRec,
}) {
    // ── Registration type & pool mode ────────────────────────────────────────
    const [registrationType, setRegistrationType] = useState('participant'); // 'participant' | 'volunteer'
    const [submittedType,    setSubmittedType]     = useState(null);          // set on successful submit
    const [poolMode,         setPoolMode]          = useState('agents');      // 'agents' | 'volunteers'

    // ── Step 1 state ──────────────────────────────────────────────────────────
    const [selfSelected,    setSelfSelected]   = useState(null);
    const [sessionPrefilled, setSessionPrefilled] = useState(false);
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
    const [captainPanel,           setCaptainPanel]           = useState(null); // null | teamRec
    const [captainReassignSlot,    setCaptainReassignSlot]    = useState('');   // slot field name
    const [captainActionSubmitting, setCaptainActionSubmitting] = useState(false);
    const [captainActionError,     setCaptainActionError]     = useState('');
    const [leaveConfirm,       setLeaveConfirm]        = useState(null); // null | teamRec
    const [leaveSubmitting,    setLeaveSubmitting]      = useState(false);
    const [leaveSuccess,       setLeaveSuccess]         = useState('');
    const [agentSearch,        setAgentSearch]         = useState('');
    const [teamSearch,         setTeamSearch]          = useState('');
    const [debouncedTeamSearch, setDebouncedTeamSearch] = useState('');
    const teamSearchDebounceRef = useRef(null);
    const [showCreateModal,    setShowCreateModal]     = useState(false);

    // ── Team card pagination — memoized to avoid O(n) work on every render ────
    const PAGE_SIZE = 6;
    const { teamDisplayTeams, teamTotalPages, teamSafePage, teamPageTeams } = useMemo(() => {
        const filtered = liveTeams.filter(t => {
            if (hideFullTeams) {
                const count = SLOT_FIELDS.filter(s => { const v = safeGetCellValue(t, s); return v && Array.isArray(v) && v.length > 0; }).length;
                if (count >= 5) return false;
            }
            if (debouncedTeamSearch.trim()) {
                const q = debouncedTeamSearch.toLowerCase();
                if (safeGetCellValueAsString(t, 'Team Name').toLowerCase().includes(q)) return true;
                for (const s of SLOT_FIELDS) {
                    const val = safeGetCellValue(t, s);
                    if (Array.isArray(val) && val.length > 0 && val[0].name && val[0].name.toLowerCase().includes(q)) return true;
                }
                return false;
            }
            return true;
        });
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        const safePage   = Math.min(teamPage, totalPages - 1);
        const pageTeams  = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
        return { teamDisplayTeams: filtered, teamTotalPages: totalPages, teamSafePage: safePage, teamPageTeams: pageTeams };
    }, [liveTeams, hideFullTeams, debouncedTeamSearch, teamPage]);

    // ── Pre-computed agent list (volunteerAgents comes from App-level prop) ──────
    const agentListData = useMemo(() => {
        const sourceList = poolMode === 'volunteers' ? volunteerAgents : freeAgents;
        const q = agentSearch.toLowerCase();
        const filtered = q
            ? sourceList.filter(a => safeGetCellValueAsString(a, 'Full Name').toLowerCase().includes(q))
            : sourceList;
        const groups = {};
        filtered.forEach(a => {
            const lastName = safeGetCellValueAsString(a, 'Last Name').trim();
            const initial = lastName ? lastName[0].toUpperCase() : '#';
            if (!groups[initial]) groups[initial] = [];
            const name = safeGetCellValueAsString(a, 'Full Name');
            const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
            groups[initial].push({ agent: a, name, initials });
        });
        return { filtered, groups, sortedKeys: Object.keys(groups).sort(), count: sourceList.length };
    }, [poolMode, volunteerAgents, freeAgents, agentSearch]);

    // Session-verified record takes priority; localStorage identity is fallback only
    const userDirId = sessionUserRec?.id ?? selfRegistered?.id ?? null;

    const dirRecordsRef = useRef(dirRecords);
    dirRecordsRef.current = dirRecords;

    // ── Auto-identify: session email is the authority for Step 2 identity ─────
    useEffect(() => {
        if (step1Done || dirRecords.length === 0) return;

        // 1. Session email is always tried first — it's the Airtable-verified identity
        let rec = null;
        if (sessionEmail) {
            rec = dirRecords.find(r =>
                safeGetCellValueAsString(r, 'Work Email').toLowerCase().trim() === sessionEmail
            ) ?? null;
        }

        if (!rec) {
            // No session match — clear any in-session identity and show Step 1 form
            if (selfRegistered?.id) setSelfRegistered(null);
            return;
        }

        const confirmed   = safeGetCellValue(rec, 'Confirmed');
        const isFreeAgent = safeGetCellValue(rec, 'Free Agent Registration');
        const onTeam      = findUserOnTeam(liveTeams, rec.id);

        if (confirmed || isFreeAgent || onTeam) {
            const name  = safeGetCellValueAsString(rec, 'Full Name') || safeGetCellValueAsString(rec, 'First Name');
            const email = safeGetCellValueAsString(rec, 'Work Email');
            setSelfRegistered({ id: rec.id, name, email });
            setStep1Done(true);
            setStep1Complete(true);
            if (onTeam) { setDuplicateStatus('on-team'); setDuplicateTeamName(onTeam.teamName); }
        } else if (selfRegistered?.id) {
            setSelfRegistered(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dirRecords.length, liveTeams.length, sessionEmail]);

    // ── Prefill Step 1 from session-matched directory record ──────────────────
    useEffect(() => {
        if (step1Done || !sessionUserRec) return;
        if (selfSelected?.id === sessionUserRec.id) return;
        const name  = safeGetCellValueAsString(sessionUserRec, 'Full Name')
                   || safeGetCellValueAsString(sessionUserRec, 'First Name');
        const email = safeGetCellValueAsString(sessionUserRec, 'Work Email');
        const prefill = { id: sessionUserRec.id, name, email };
        setSelfSelected(prefill);
        checkDuplicate(prefill);
        setSessionPrefilled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionUserRec, step1Done]);

    // ── Check if selected person is already registered ────────────────────────
    const checkDuplicate = useCallback((selected) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dirRecords, liveTeams]);

    const handleSelfSelect = useCallback((val) => {
        setSelfSelected(val);
        checkDuplicate(val);
    }, [checkDuplicate]);

    function handleNotYou() {
        setSelfSelected(null);
        setDuplicateStatus(null);
        setSessionPrefilled(false);
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
            const volunteerField     = dirTable.getFieldIfExists('Volunteer');
            const updates = {};
            if (confirmedField)     updates[confirmedField.id]     = true;
            if (rulesField)         updates[rulesField.id]         = true;
            if (freeAgentField)     updates[freeAgentField.id]     = registrationType !== 'volunteer';
            if (tshirtField)        updates[tshirtField.id]        = { name: tshirtSize };
            if (volunteerField)     updates[volunteerField.id]     = registrationType === 'volunteer';
            await updateRecordWithRetry(dirTable, selfSelected.id, updates);
            setSubmittedType(registrationType);
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
        // In-flight dedup: prevent two sessions adding the same email simultaneously
        if (_pendingEmails.has(emailLower)) {
            setAddError('This email is currently being registered. Please wait a moment.');
            return;
        }
        _pendingEmails.add(emailLower);
        // Capture values before async/reset clears state
        const capturedFirstName = addFirstName.trim();
        const capturedLastName  = addLastName.trim();
        const capturedEmail     = addEmail.trim();
        const capturedAssocType = addAssocType;

        setAddSubmitting(true);
        _addSelfPollId = null;
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
            // Poll for the new record using ref for fresh dirRecords; store timeout ID for cleanup
            const pollForRecord = (attempts = 0) => {
                if (attempts > 20) return;
                const currentRecords = dirRecordsRef.current;
                const newRec = currentRecords.find(r =>
                    safeGetCellValueAsString(r, 'Work Email').trim().toLowerCase() === emailLower
                );
                if (newRec) {
                    const name  = dfName  ? newRec.getCellValueAsString(dfName)  : `${capturedFirstName} ${capturedLastName}`;
                    const email = dfEmail ? newRec.getCellValueAsString(dfEmail) : capturedEmail;
                    handleSelfSelect({ id: newRec.id, name, email });
                } else {
                    _addSelfPollId = setTimeout(() => pollForRecord(attempts + 1), 500);
                }
            };
            pollForRecord();
        } catch (err) {
            clearTimeout(_addSelfPollId); _addSelfPollId = null;
            setAddError(err?.message || 'Failed to add. Please try again.');
        } finally {
            _pendingEmails.delete(emailLower);
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
    const handleJoinTeam = useCallback(async function handleJoinTeam(teamRecord) {
        if (!userDirId) { setJoinError('Complete Step 1 first.'); return; }
        setJoinSubmitting(true);
        setJoinError('');
        try {
            const slots = ['Team Member # 2', 'Team Member # 3', 'Team Member # 4', 'Team Member # 5'];

            // Snapshot current membership BEFORE any writes — used for old-team removal
            const existing = findUserOnTeam(liveTeams, userDirId);

            // Race guard: re-read from liveTeams immediately before writing — not the stale prop
            const freshTeam = liveTeams.find(t => t.id === teamRecord.id);
            if (!freshTeam) { setJoinError('This team no longer exists. Please refresh.'); return; }

            // Confirm target team has an open slot using fresh data
            let targetField = null;
            let targetSlotName = null;
            for (const slotName of slots) {
                const val = safeGetCellValue(freshTeam, slotName);
                if (!val || (Array.isArray(val) && val.length === 0)) {
                    const f = subTable.getFieldIfExists(slotName);
                    if (f) { targetField = f; targetSlotName = slotName; break; }
                }
            }
            if (!targetField) { setJoinError('This team is full.'); return; }

            // 1. JOIN new team first — user is never momentarily on zero teams
            await updateRecordWithRetry(subTable, freshTeam.id, { [targetField.id]: [{ id: userDirId }] });

            // 2. Clear old slot (non-captain switch only), using pre-write snapshot
            if (existing && !existing.isCaptain) {
                const oldField = subTable.getFieldIfExists(existing.slot);
                if (oldField) await updateRecordWithRetry(subTable, existing.team.id, { [oldField.id]: [] });
            }

            // 3. Ensure FA = false
            const faField = dirTable.getFieldIfExists('Free Agent Registration');
            if (faField) await updateRecordWithRetry(dirTable, userDirId, { [faField.id]: false });

            // 4. Post-write verification: confirm our ID is actually in the slot
            const verifiedTeam = liveTeams.find(t => t.id === freshTeam.id);
            if (verifiedTeam) {
                const slotVal = safeGetCellValue(verifiedTeam, targetSlotName);
                const confirmed = Array.isArray(slotVal) && slotVal.some(r => r.id === userDirId);
                if (!confirmed) {
                    setJoinError('Your spot was taken by another user just now. Please try joining again.');
                    return;
                }
            }

            const tName = safeGetCellValueAsString(freshTeam, 'Team Name');
            setJoinSuccess(`✓ You've joined ${tName}! You can see your team in the Active Participants list below.`);
            setLeaveSuccess('');
            setJoinConfirmTeam(null);
        } catch (err) {
            setJoinError(err?.message || 'Failed to join team. Please try again.');
        } finally {
            setJoinSubmitting(false);
        }
    }, [userDirId, liveTeams, subTable, dirTable]);

    // ── Step 2: Leave Team → back to free agent pool ─────────────────────────
    const handleLeaveTeam = useCallback(async function handleLeaveTeam(teamRecord) {
        if (!userDirId) return;
        const membership = findUserOnTeam([teamRecord], userDirId);
        if (!membership) return;
        setLeaveSubmitting(true);
        try {
            const slotField = subTable.getFieldIfExists(membership.slot);
            if (slotField) await updateRecordWithRetry(subTable, teamRecord.id, { [slotField.id]: [] });
            const faField = dirTable.getFieldIfExists('Free Agent Registration');
            if (faField) await updateRecordWithRetry(dirTable, userDirId, { [faField.id]: true });
            setLeaveConfirm(null);
            setLeaveSuccess('✓ You\'ve left the team and returned to the free agent pool.');
            setJoinSuccess('');
        } catch {
            setLeaveConfirm(null);
        } finally {
            setLeaveSubmitting(false);
        }
    }, [userDirId, subTable, dirTable]);

    // ── Step 2: Captain Reassigns Captainship + Leaves ───────────────────────
    const handleCaptainReassignAndLeave = useCallback(async function handleCaptainReassignAndLeave(teamRecord, newCaptainSlot) {
        if (!userDirId || !newCaptainSlot) return;
        setCaptainActionSubmitting(true);
        setCaptainActionError('');
        try {
            // Race-condition guard: verify selected slot is still filled
            const freshTeam = liveTeams.find(t => t.id === teamRecord.id);
            if (!freshTeam) { setCaptainActionError('Team no longer exists.'); return; }
            const slotVal = safeGetCellValue(freshTeam, newCaptainSlot);
            if (!Array.isArray(slotVal) || slotVal.length === 0) {
                setCaptainActionError('That teammate has already left. Please select another.');
                return;
            }
            const newCaptainId = slotVal[0].id;
            // Overwrite slot 1 with new captain, clear their old slot — one update
            const f1   = subTable.getFieldIfExists('Team Member # 1 (Captain)');
            const fOld = subTable.getFieldIfExists(newCaptainSlot);
            if (f1 && fOld) {
                await updateRecordWithRetry(subTable, teamRecord.id, {
                    [f1.id]:   [{ id: newCaptainId }],
                    [fOld.id]: [],
                });
            }
            // Return departing captain to free agent pool
            const faField = dirTable.getFieldIfExists('Free Agent Registration');
            if (faField) await updateRecordWithRetry(dirTable, userDirId, { [faField.id]: true });
            setCaptainPanel(null);
            setCaptainReassignSlot('');
            setLeaveSuccess('✓ Captainship transferred. You\'ve returned to the free agent pool.');
            setJoinSuccess('');
        } catch (err) {
            setCaptainActionError(err?.message || 'Something went wrong. Please try again.');
        } finally {
            setCaptainActionSubmitting(false);
        }
    }, [userDirId, liveTeams, subTable, dirTable]);

    // ── Step 2: Captain Deletes Solo Team + Leaves ───────────────────────────
    const handleDeleteTeam = useCallback(async function handleDeleteTeam(teamRecord) {
        if (!userDirId) return;
        setCaptainActionSubmitting(true);
        setCaptainActionError('');
        try {
            if (typeof subTable.deleteRecordAsync === 'function') {
                await subTable.deleteRecordAsync(teamRecord.id);
            } else {
                // Fallback: clear all slots + mark Disbanded
                const updates = {};
                for (const s of SLOT_FIELDS) {
                    const f = subTable.getFieldIfExists(s);
                    if (f) updates[f.id] = [];
                }
                const statusF = subTable.getFieldIfExists('Submission Status');
                if (statusF) updates[statusF.id] = { name: 'Disbanded' };
                await updateRecordWithRetry(subTable, teamRecord.id, updates);
            }
            const faField = dirTable.getFieldIfExists('Free Agent Registration');
            if (faField) await updateRecordWithRetry(dirTable, userDirId, { [faField.id]: true });
            setCaptainPanel(null);
            setLeaveSuccess('✓ Team deleted. You\'ve returned to the free agent pool.');
            setJoinSuccess('');
        } catch (err) {
            setCaptainActionError(err?.message || 'Failed to delete team. Please try again.');
        } finally {
            setCaptainActionSubmitting(false);
        }
    }, [userDirId, subTable, dirTable]);

    // ── Step 2: Create Team ───────────────────────────────────────────────────
    async function handleCreateTeam() {
        if (!userDirId) { setCreateError('Complete Step 1 first.'); return; }
        if (!createName.trim()) { setCreateError('Team name is required.'); return; }
        const nameExists = liveTeams.some(r =>
            safeGetCellValueAsString(r, 'Team Name').trim().toLowerCase() === createName.trim().toLowerCase()
        );
        if (nameExists) { setCreateError('A team with this name already exists.'); return; }
        // In-flight dedup: prevent two users creating same team name simultaneously
        const normalizedName = createName.trim().toLowerCase();
        if (_pendingTeamNames.has(normalizedName)) {
            setCreateError('A team with this name is being created right now. Please wait a moment.');
            return;
        }
        _pendingTeamNames.add(normalizedName);
        setCreateSubmitting(true);
        setCreateError('');
        try {
            // If already on a team (non-captain), leave first
            const existing = findUserOnTeam(liveTeams, userDirId);
            if (existing && !existing.isCaptain) {
                const oldField = subTable.getFieldIfExists(existing.slot);
                if (oldField) await updateRecordWithRetry(subTable, existing.team.id, { [oldField.id]: [] });
            }
            const fields = {};
            const f1 = subTable.getFieldIfExists('Team Name');
            const f2 = subTable.getFieldIfExists('Submission Status');
            const f3 = subTable.getFieldIfExists('Team Member # 1 (Captain)');
            if (f1) fields[f1.id] = createName.trim();
            if (f2) fields[f2.id] = { name: 'Registered' };
            if (f3) fields[f3.id] = [{ id: userDirId }];
            await createRecordWithRetry(subTable, fields);
            const faField = dirTable.getFieldIfExists('Free Agent Registration');
            if (faField) await updateRecordWithRetry(dirTable, userDirId, { [faField.id]: false });
            setCreateSuccess(`✓ ${createName.trim()} created! You're the team captain. Share this page with teammates so they can join.`);
            setCreateName('');
        } catch (err) {
            setCreateError(err?.message || 'Failed to create team. Please try again.');
        } finally {
            _pendingTeamNames.delete(normalizedName);
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
                <div className="step-card-sub">Find yourself in the Walmart directory, agree to the rules, and register. Participants join teams in Step 2; volunteers support the event without joining a team.</div>

                {!(step1Done || (selfRegistered && selfRegistered.id)) && (
                    <div style={{display:'flex',gap:8,marginBottom:20}}>
                        <button
                            style={{padding:'8px 16px',borderRadius:5,border:`1px solid ${T.blue}`,background:registrationType==='participant'?T.blue:'white',color:registrationType==='participant'?'white':T.blue,cursor:'pointer',fontSize:13,fontWeight:600,transition:'all 0.15s'}}
                            onClick={() => setRegistrationType('participant')}
                        >
                            Participant
                        </button>
                        <button
                            style={{padding:'8px 16px',borderRadius:5,border:`1px solid ${T.blue}`,background:registrationType==='volunteer'?T.blue:'white',color:registrationType==='volunteer'?'white':T.blue,cursor:'pointer',fontSize:13,fontWeight:600,transition:'all 0.15s'}}
                            onClick={() => setRegistrationType('volunteer')}
                        >
                            Volunteer
                        </button>
                    </div>
                )}

                {step1Done || (selfRegistered && selfRegistered.id) ? (
                    <div className="step-success">
                        <span style={{fontSize:18}}>✓</span>
                        <div className="step-success-text">
                            {submittedType === 'volunteer' ? (
                                <>You&apos;re registered as a <strong>Volunteer</strong>{selfRegistered ? ` — ${selfRegistered.name}` : ''}! You can view all free agents, teams, and other volunteers below.</>
                            ) : (
                                <>You&apos;re registered as <strong>{selfRegistered ? selfRegistered.name : 'a participant'}</strong>! Registered as a participant? Join or create a team below — or stay in the free agent pool for assignment.</>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {sessionPrefilled ? (
                            <div className="fr">
                                <label className="form-label">Associate Directory<span className="req">*</span></label>
                                <div className="ms-sel">
                                    <div>
                                        <div className="session-prefill-badge">Matched to your login</div>
                                        <div className="ms-sel-name">{selfSelected?.name}</div>
                                        <div className="ms-sel-email">{selfSelected?.email}</div>
                                    </div>
                                    <button className="not-you-btn" onClick={handleNotYou}>Not You?</button>
                                </div>
                            </div>
                        ) : sessionEmail && dirRecords.length > 0 && !sessionUserRec ? (
                            <div className="signup-prompt">
                                <div className="signup-prompt-text">You&apos;re not in the Walmart Associate Directory yet.</div>
                                <button className="btn-primary" onClick={() => setShowAddSelf(true)}>Sign Up →</button>
                            </div>
                        ) : (
                            <>
                                <MemberSearch
                                    label="Associate Directory"
                                    dirRecords={dirRecords}
                                    nameField={dfName}
                                    emailField={dfEmail}
                                    selected={selfSelected}
                                    onSelect={handleSelfSelect}
                                    onNoResults={setNoDirectoryMatch}
                                />
                                <div style={{marginTop:12}} className={noDirectoryMatch ? 'add-self-highlight' : ''}>
                                    <button className={`hub-card-link${noDirectoryMatch ? ' add-self-link-alert' : ''}`} onClick={() => setShowAddSelf(true)}>
                                        {noDirectoryMatch ? '⚠ Not found — ' : ''}Can&apos;t find your name? Add yourself to the directory →
                                    </button>
                                </div>
                            </>
                        )}

                        {duplicateStatus === 'on-team' && (
                            <div className="step-warn">
                                <span>⚠️</span>
                                <div className="step-warn-text">You have already registered and are on team <strong>{duplicateTeamName}</strong>. If you need to make changes, please reach out to the Internal Support Team.</div>
                            </div>
                        )}
                        {duplicateStatus === 'free-agent' && (
                            <div className="step-info">
                                <span>ℹ️</span>
                                <div className="step-info-text">You&apos;re already registered and in the free agent pool. Scroll down to Step 2 to join or create a team.</div>
                            </div>
                        )}

                        <div className="fr" style={{marginTop:16,marginBottom:40}}>
                            <label className="form-label">T-Shirt Size<span className="req">*</span></label>
                            <select className="fi hero-select" value={tshirtSize} onChange={e => setTshirtSize(e.target.value)}>
                                <option value="">Select Size...</option>
                                {['XXS','XS','S','M','L','XL','XXL','XXXL','XXXXL'].map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>

                        <div className="fr">
                            <div className="ck-row">
                                <input type="checkbox" id="s1agreed" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                                <label className="ck-label" htmlFor="s1agreed">
                                    I have read the <button className="inline-link" onClick={() => document.getElementById('rules-card')?.scrollIntoView({ behavior: 'smooth' })}>hackathon rules & guidelines</button> and agree to follow them.
                                </label>
                            </div>
                        </div>

                        {step1Error && <div className="submit-err" style={{marginTop:8}}>{step1Error}</div>}

                        <div style={{display:'flex',justifyContent:'flex-end',marginTop:20}}>
                            <button
                                className="btn-primary"
                                disabled={step1Submitting || duplicateStatus !== null}
                                onClick={handleStep1Submit}
                            >
                                {step1Submitting ? <><span className="spinner"/> Registering…</> : registrationType === 'volunteer' ? 'Register as Volunteer →' : 'Register as Participant →'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* BLOCK 2: Team Builder */}
        <div className="step-block">
            <div className="step-block-header">Step 2 — Join or Create a Team</div>

            {registrationType === 'volunteer' && step1Done && (
                <div className="step-card step-card-hero" style={{marginBottom:16}}>
                    <div className="step-card-title">Volunteer Registration Complete</div>
                    <div className="step-info" style={{marginTop:16}}>
                        <span>✓</span>
                        <div className="step-info-text">
                            Thank you for supporting the hackathon as a volunteer! You&apos;re all set. Browse teams and the volunteer pool below — toggle to &quot;Volunteers&quot; in the sidebar to find yourself.
                        </div>
                    </div>
                </div>
            )}
                <div className="tb-container">
                    {/* LEFT: Free Agent Pool */}
                    <div className="tb-sidebar">
                        <div style={{display:'flex',gap:6,marginBottom:8}}>
                            <button
                                style={{padding:'5px 11px',borderRadius:4,border:`1px solid ${T.blue}`,background:poolMode==='agents'?T.blue:'white',color:poolMode==='agents'?'white':T.blue,cursor:'pointer',fontSize:11,fontWeight:600,transition:'all 0.15s'}}
                                onClick={() => setPoolMode('agents')}
                            >
                                Free Agent Pool
                            </button>
                            <button
                                style={{padding:'5px 11px',borderRadius:4,border:`1px solid ${T.blue}`,background:poolMode==='volunteers'?T.blue:'white',color:poolMode==='volunteers'?'white':T.blue,cursor:'pointer',fontSize:11,fontWeight:600,transition:'all 0.15s'}}
                                onClick={() => setPoolMode('volunteers')}
                            >
                                Volunteers
                            </button>
                        </div>
                        <div className="tb-sidebar-count">
                            {poolMode === 'agents' ? `${freeAgents.length} unplaced` : `${volunteerAgents.length} available`}
                        </div>

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
                            {agentListData.filtered.length === 0 ? (
                                <div className="tb-empty">{agentSearch ? 'No matches' : (poolMode === 'volunteers' ? 'No volunteers' : 'No free agents')}</div>
                            ) : agentListData.sortedKeys.map(letter => (
                                <div key={letter} className="tb-agent-group">
                                    <div className="tb-agent-group-label">{letter}</div>
                                    {agentListData.groups[letter].map(({ agent, name, initials }) => {
                                        const isMe = userDirId && agent.id === userDirId;
                                        return (
                                            <div key={agent.id} className={`tb-agent-row${isMe ? ' tb-agent-row-me' : poolMode === 'volunteers' ? ' tb-agent-row-vol' : ''}`}>
                                                <div className={`tb-avatar${isMe ? ' tb-avatar-me' : poolMode === 'volunteers' ? ' tb-avatar-vol' : ' tb-avatar-default'}`}>{initials}</div>
                                                <div className="tb-agent-info">
                                                    <div className="tb-agent-name">{name}{isMe ? ' (you)' : ''}{poolMode === 'volunteers' ? ' · volunteer' : ''}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
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
                                        onChange={e => {
                                            const v = e.target.value;
                                            setTeamSearch(v);
                                            setTeamPage(0);
                                            clearTimeout(teamSearchDebounceRef.current);
                                            teamSearchDebounceRef.current = setTimeout(() => setDebouncedTeamSearch(v), 200);
                                        }}
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
                            const displayTeams = teamDisplayTeams;
                            const totalPages   = teamTotalPages;
                            const safePage     = teamSafePage;
                            const pageTeams    = teamPageTeams;

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
                                        {pageTeams.map(teamRec => (
                                            <TeamCard
                                                key={teamRec.id}
                                                teamRec={teamRec}
                                                userDirId={userDirId}
                                                currentMembership={currentMembership}
                                                joinConfirmTeam={joinConfirmTeam}
                                                joinError={joinError}
                                                joinSubmitting={joinSubmitting}
                                                leaveSubmitting={leaveSubmitting}
                                                captainActionSubmitting={captainActionSubmitting}
                                                captainPanel={captainPanel}
                                                captainReassignSlot={captainReassignSlot}
                                                captainActionError={captainActionError}
                                                leaveConfirm={leaveConfirm}
                                                setJoinConfirmTeam={setJoinConfirmTeam}
                                                setJoinError={setJoinError}
                                                setCaptainPanel={setCaptainPanel}
                                                setCaptainReassignSlot={setCaptainReassignSlot}
                                                setCaptainActionError={setCaptainActionError}
                                                setLeaveConfirm={setLeaveConfirm}
                                                handleJoinTeam={handleJoinTeam}
                                                handleLeaveTeam={handleLeaveTeam}
                                                handleCaptainReassignAndLeave={handleCaptainReassignAndLeave}
                                                handleDeleteTeam={handleDeleteTeam}
                                            />
                                        ))}
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

            {registrationType !== 'volunteer' && (
                <div className="free-agent-note" style={{marginTop:24}}>
                    <strong>Don&apos;t have a team yet?</strong> No problem — you&apos;re already in the free agent pool after completing Step 1. The organizing committee will assign you to a team before kickoff. Once you&apos;re placed on a team, you&apos;ll automatically be removed from the free agent pool.
                </div>
            )}
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
});

// ─── FIND USER ON TEAM ────────────────────────────────────────────────────────
function findUserOnTeam(liveTeams, userId) {
    for (const team of liveTeams) {
        for (const slot of SLOT_FIELDS) {
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

                    {/* Product Information Pills */}
                    <div style={{display:'flex',gap:16,marginBottom:24,width:'100%'}}>
                        {[
                            { label:'Product Liaison',               field:'Product Liaison',               isEmail:false },
                            { label:'Product Support',               field:'Product Support',               isEmail:true  },
                            { label:'Digital Acceleration Support',  field:'Digital Acceleration Support',  isEmail:true  },
                        ].map(({ label, field, isEmail }) => {
                            const value = safeGetCellValueAsString(record, field);
                            const display = value || 'Coming soon';
                            const isLink  = isEmail && value && value.includes('@');
                            return (
                                <div key={field} style={{display:'flex',flexDirection:'column',alignItems:'flex-start',padding:'14px 18px',borderRadius:6,background:'linear-gradient(135deg,#0071CE 0%,#2C8EF4 100%)',color:'white',flex:1,minWidth:0}}>
                                    <div style={{fontSize:10,fontWeight:600,opacity:0.9,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.04em',width:'100%'}}>{label}</div>
                                    {isLink ? (
                                        <a href={`mailto:${value}`} style={{fontSize:13,fontWeight:500,wordBreak:'break-word',width:'100%',color:'white',textDecoration:'underline'}}>{display}</a>
                                    ) : (
                                        <div style={{fontSize:13,fontWeight:500,wordBreak:'break-word',width:'100%'}}>{display}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

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
    const base    = useBase();
    const session = useSession();
    const sessionEmail = session?.currentUser?.email?.toLowerCase().trim() ?? '';

    // ── Tables ──────────────────────────────────────────────────────────────
    const subTable  = base.getTableByNameIfExists('Hackathon Submissions') ?? base.tables[0];
    const probTable = base.getTableByNameIfExists('Problem Statements')    ?? base.tables[0];
    const dirTable  = base.getTableByNameIfExists('WM Directory')          ?? base.tables[0];
    const docTable      = base.getTableByNameIfExists('Hackathon Documents')   ?? null;
    const prodTable     = base.getTableByNameIfExists('Products')              ?? base.tables[0];
    const prodResTable  = base.getTableByNameIfExists('Product Resources')     ?? base.tables[0];

    // ── Records ─────────────────────────────────────────────────────────────
    const submissions   = useRecords(subTable);
    const probRecords   = useRecords(probTable);
    const dirRecords    = useRecords(dirTable);

    // ── Session-verified WM Directory record — ground truth for team writes ───
    const sessionUserRec = useMemo(() => {
        if (!sessionEmail || dirRecords.length === 0) return null;
        return dirRecords.find(r =>
            safeGetCellValueAsString(r, 'Work Email').toLowerCase().trim() === sessionEmail
        ) ?? null;
    }, [sessionEmail, dirRecords]);

    const hackDocs      = useRecords(docTable ?? subTable);  // fallback avoids null crash
    const prodRecords   = useRecords(prodTable);
    const prodResRecords = useRecords(prodResTable);

    // ── UI State ─────────────────────────────────────────────────────────────
    const [currentView,     setCurrentView]    = useState('home');
    const [rosterTeam,      setRosterTeam]     = useState(null);
    const [showReg,         setShowReg]        = useState(false);
    const [showRulesModal,  setShowRulesModal] = useState(false);
    const [hubDocModal,     setHubDocModal]    = useState(null); // null | 'rules'|'prizes'|'reginfo'|'faqs'
    const [selfRegistered,  setSelfRegistered] = useState(null);
    const [step1Complete,   setStep1Complete]  = useState(false);
    const [productModal,    setProductModal]   = useState(null);

    // One-time cleanup: remove all stale localStorage identity keys
    useEffect(() => {
        try {
            localStorage.removeItem('gg_hackathon_user');
            localStorage.removeItem('gg_reg_user');
        } catch { /* ignore */ }
    }, []);

    // ── Field detection: submissions ─────────────────────────────────────────
    const sfTeamName     = useMemo(() => subTable.getFieldIfExists('Team Name'),            [subTable]);
    const sfStatus       = useMemo(() => subTable.getFieldIfExists('Submission Status'),    [subTable]);

    // ── Field detection: hackathon docs ─────────────────────────────────────
    const dfDocName         = docTable ? docTable.getFieldIfExists('Name')                    : null;
    const dfDocDetails      = docTable ? docTable.getFieldIfExists('Documented Details')       : null;
    const dfDocCategorized  = docTable ? docTable.getFieldIfExists('Categorized Rules')        : null;
    const hackDocList      = useMemo(() => docTable ? hackDocs : [], [docTable, hackDocs]);

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
    }, [hackDocList, dfDocName, dfDocDetails]);

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
    const registeredTeams = dirTable ? dirRecords.filter(r => {
        const rulesField = dirTable.getFieldIfExists('Rules Attestation');
        return rulesField && r.getCellValue(rulesField) === true;
    }).length : 0;
    const spotsLeft       = Math.max(0, MAX_TEAMS - totalTeams);
    const freeAgents      = dirRecords.filter(r => safeGetCellValue(r, 'Free Agent Registration') && !safeGetCellValue(r, 'Volunteer'));
    const volunteerAgents = dirRecords.filter(r => safeGetCellValue(r, 'Volunteer'));


    return (
        <>
        {currentView === 'admin' ? (
            <AdminView
                onBack={() => setCurrentView('home')}
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
                <button className="nav-brand-btn" onClick={() => setCurrentView('home')}>
                    <div className="nav-spark"><SparkIcon size={16} /></div>
                    GG AI HACKATHON FY27
                </button>
                <div className="nav-links">
                    {[['home','Home'],['rules','Rules'],['tools','Tools'],['register','Register'],['help','Help']].map(([id, label]) => (
                        <button key={id} className={`nav-link${currentView === id ? ' active' : ''}`}
                            onClick={() => setCurrentView(id)}>
                            {label}
                        </button>
                    ))}
                </div>
                <div className="nav-right">
                    <button className="nav-cta" onClick={() => setCurrentView('help')}>Get Help</button>
                </div>
            </nav>

            {/* ── VIEW ROUTING ── */}
            {currentView === 'home' && (
                <HomeView
                    sessionUserRec={sessionUserRec}
                    liveTeams={liveTeams}
                    prodRecords={prodRecords}
                    totalTeams={totalTeams}
                    onNavigate={setCurrentView}
                />
            )}

            {currentView === 'rules' && (
                <div className="section-view">
                    <section id="rules" className="sec-white">
                        <div className="sec-wrap">
                            <span className="sec-label">Learning Hub</span>
                            <h2 className="sec-h2">Learning Hub</h2>
                            <p className="sec-sub">Everything you need to know before you build.</p>

                            <div className="hub-cards">
                                <div id="rules-card" className="hub-card" style={{ borderTop: `3px solid ${T.blue}` }} onClick={() => setHubDocModal('rules')}>
                                    <div className="hub-card-icon"><ClipboardTextIcon size={28} color={T.blue} weight="duotone" /></div>
                                    <div className="hub-card-title">Rules &amp; Guidelines</div>
                                    <div className="hub-card-body">Official hackathon rules, eligibility requirements, and code of conduct. Read this before registering.</div>
                                    <span className="hub-card-link">Read the Rules →</span>
                                </div>
                                <div className="hub-card" style={{ borderTop: `3px solid ${T.yellow}` }} onClick={() => setHubDocModal('prizes')}>
                                    <div className="hub-card-icon"><TrophyIcon size={28} color={T.yellow} weight="duotone" /></div>
                                    <div className="hub-card-title">Payouts &amp; Prizes</div>
                                    <div className="hub-card-body">What&apos;s at stake. Prize tiers, judging criteria, and how winners are selected.</div>
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
                </div>
            )}

            {currentView === 'tools' && (
                <div className="section-view">
                    <section id="tools" className="sec-cloud">
                        <div className="sec-wrap">
                            <span className="sec-label">Tools</span>
                            <h2 className="sec-h2">Tool Selection</h2>
                            <p className="sec-sub">Free training is available for all tools. Pick one &mdash; or combine them if your use case calls for it.</p>
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
                </div>
            )}

            {currentView === 'register' && (
                <div className="section-view">
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
                                volunteerAgents={volunteerAgents}
                                dfName={dfName}
                                dfEmail={dfEmail}
                                selfRegistered={selfRegistered}
                                setSelfRegistered={setSelfRegistered}
                                step1Complete={step1Complete}
                                setStep1Complete={setStep1Complete}
                                sessionEmail={sessionEmail}
                                sessionUserRec={sessionUserRec}
                            />
                        </div>
                    </section>
                </div>
            )}

            {currentView === 'help' && (
                <div className="section-view">
                    <section id="help" className="sec-cloud">
                        <div className="sec-wrap">
                            <span className="sec-label">Support</span>
                            <h2 className="sec-h2">We&apos;ve Got You Covered</h2>
                            <p className="sec-sub">Multiple support channels available before and during the event.</p>

                            <div className="help-cards">
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
                                    <div className="card-footer-email">Email: ggda@email.wal-mart.com</div>
                                </div>

                                <div className="help-card">
                                    <div className="help-card-icon"><HeadsetIcon size={28} color={T.blue} weight="duotone" /></div>
                                    <div className="help-card-title">Product Support</div>
                                    <div className="contact-blocks">
                                        {prodRecords && prodRecords.length > 0 ? (
                                            prodRecords.map(product => {
                                                const productName  = safeGetCellValueAsString(product, 'Name');
                                                const supportEmail = safeGetCellValueAsString(product, 'Product Support');
                                                return (
                                                    <div className="contact-block" key={product.id}>
                                                        <div className="contact-topic">{productName} Support</div>
                                                        <div className="contact-email">{supportEmail || 'Contact coming soon'}</div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="contact-block">
                                                <div className="contact-topic">Product Support</div>
                                                <div className="contact-email">Loading products&hellip;</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="help-card">
                                    <div className="help-card-icon"><ChalkboardTeacherIcon size={28} color={T.blue} weight="duotone" /></div>
                                    <div className="help-card-title">Mentor Program</div>
                                    <div className="mentor-body">
                                        Every registered team is assigned one internal mentor with relevant domain or technical expertise. Please reach out to the Internal Support Team for help regarding mentor assignments.
                                    </div>
                                    <ul className="mentor-bullets">
                                        <li className="mentor-bullet">1 mentor per team (subject to team count)</li>
                                        <li className="mentor-bullet">Available during the build week</li>
                                        <li className="mentor-bullet">Matched based on your tool choice and problem area</li>
                                    </ul>
                                    <div className="mentor-note">
                                        Vendor support (Airtable, Harvey, CodePuppy) is available in addition to your mentor.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* ── REGISTRATION MODAL ── */}
            {showReg && (
                <RegistrationModal
                    initialScreen={0}
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
                    title={HUB_DOC_TITLES[hubDocModal]}
                    content={hubDocs[hubDocModal]}
                    onClose={() => setHubDocModal(null)}
                    onRegisterNow={hubDocModal === 'reginfo' ? () => { setHubDocModal(null); setTimeout(() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' }), 50); } : undefined}
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

// ─── HOME VIEW ────────────────────────────────────────────────────────────────
function HomeView({ sessionUserRec, liveTeams, prodRecords, totalTeams, onNavigate }) {
    // Derive user's team from liveTeams
    const myTeam = useMemo(() => {
        if (!sessionUserRec) return null;
        const userId = sessionUserRec.id;
        for (const team of liveTeams) {
            for (const slot of SLOT_FIELDS) {
                const val = safeGetCellValue(team, slot);
                if (Array.isArray(val) && val.some(link => link.id === userId)) return team;
            }
        }
        return null;
    }, [sessionUserRec, liveTeams]);

    const teamName = myTeam ? safeGetCellValueAsString(myTeam, 'Team Name') : '';

    const toolSelected = myTeam ? safeGetCellValueAsString(myTeam, 'Technology') : '';
    const subStatus    = myTeam ? safeGetCellValueAsString(myTeam, 'Submission Status') : '';
    const useCase      = myTeam ? safeGetCellValueAsString(myTeam, 'Use Case') : '';

    // Build member roster for team card
    const memberRows = useMemo(() => {
        if (!myTeam) return [];
        return MEMBER_SLOT_DEFS.map(({ field, isCaptain }) => {
            const val = safeGetCellValue(myTeam, field);
            if (!Array.isArray(val) || val.length === 0) return null;
            const name = val[0].name || '';
            const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
            return { name, initials, isCaptain };
        }).filter(Boolean);
    }, [myTeam]);

    // Tool grid — match prodRecords to TOOL_NAMES_ORDERED
    const toolCards = useMemo(() => {
        return TOOL_NAMES_ORDERED.map(toolName => {
            const rec = prodRecords.find(r => safeGetCellValueAsString(r, 'Name').toLowerCase() === toolName.toLowerCase());
            let logoUrl = null;
            if (rec) {
                const logo = safeGetCellValue(rec, 'Logo');
                logoUrl = Array.isArray(logo) && logo.length > 0
                    ? (logo[0].thumbnails?.large?.url || logo[0].url)
                    : null;
            }
            const isSelected = toolSelected.toLowerCase() === toolName.toLowerCase();
            return { toolName, logoUrl, isSelected };
        });
    }, [prodRecords, toolSelected]);

    const step1Done = !!sessionUserRec;
    const step2Done = !!myTeam;
    const step3Done = !!toolSelected;
    const step4Done = subStatus === 'Submitted';

    return (
        <div className="home-layout">
            {/* LEFT COLUMN */}
            <div className="home-left">
                {/* Welcome Card */}
                <div className="home-welcome">
                    <div className="home-welcome-eyebrow">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <SparkIcon size={12} color="white" />
                            GG AI HACKATHON FY27
                        </div>
                        <div className="home-welcome-stat">{totalTeams} teams registered</div>
                    </div>
                    <div className="home-welcome-title">Welcome to the Hackathon</div>
                    <div className="home-welcome-sub">
                        {myTeam
                            ? <>You&apos;re on Team <span style={{ color: '#FFC220', fontWeight: 700 }}>{teamName}</span>.</>
                            : 'You are not yet matched to a registered team. Contact your team captain.'
                        }
                    </div>
                    <div className="home-countdown-row">
                        <HomeCountdownCell label="days to Kickoff"  target={HOME_TARGETS.kickoff}  />
                        <HomeCountdownCell label="days to Deadline" target={HOME_TARGETS.deadline} />
                        <HomeCountdownCell label="days to Judging"  target={HOME_TARGETS.judging}  />
                    </div>
                </div>

                {/* Key Dates */}
                <div className="home-card">
                    <div className="home-card-title">Key Dates</div>
                    <div className="home-key-dates">
                        {KEY_DATES.map(({ label, date }) => (
                            <div key={label} className="hkd-row">
                                <div className="hkd-dot" />
                                <div className="hkd-label">{label}</div>
                                <div className="hkd-date">{date}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Announcements */}
                <div className="home-card">
                    <div className="home-card-title">Announcements</div>
                    <div className="home-announcements">
                        {ANNOUNCEMENTS.map(({ date, title, body }, i) => (
                            <div key={date} className={`han-item${i < ANNOUNCEMENTS.length - 1 ? ' han-item-divider' : ''}`}>
                                <div className="han-date">{date}</div>
                                <div className="han-title">{title}</div>
                                <div className="han-body">{body}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="home-card">
                    <div className="home-card-title">Quick Links</div>
                    <div className="hql-grid">
                        <button className="hql-card" onClick={() => onNavigate('rules')}>
                            <ClipboardTextIcon size={18} color={T.blue} weight="duotone" />
                            <div className="hql-label">Rules &amp; Guidelines</div>
                            <div className="hql-desc">Eligibility, code of conduct, prizes</div>
                        </button>
                        <button className="hql-card" onClick={() => onNavigate('tools')}>
                            <ChalkboardTeacherIcon size={18} color={T.blue} weight="duotone" />
                            <div className="hql-label">Tools &amp; Access</div>
                            <div className="hql-desc">Airtable, Harvey, CodePuppy, Dataiku</div>
                        </button>
                        <button className="hql-card" onClick={() => onNavigate('register')}>
                            <UsersThreeIcon size={18} color={T.blue} weight="duotone" />
                            <div className="hql-label">Registration</div>
                            <div className="hql-desc">Join or create a team</div>
                        </button>
                        <button className="hql-card" onClick={() => onNavigate('help')}>
                            <HeadsetIcon size={18} color={T.blue} weight="duotone" />
                            <div className="hql-label">Help &amp; Support</div>
                            <div className="hql-desc">Contact the hackathon team</div>
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="home-right">
                {/* Team Card */}
                <div className="home-card">
                    <div className="home-card-label">Team</div>
                    {myTeam ? (
                        <>
                            <div className="home-card-teamname">{teamName}</div>
                            <div className="home-roster">
                                {memberRows.map(({ name, initials, isCaptain }) => (
                                    <div key={name} className="home-member-row">
                                        <div className="home-avatar">{initials}</div>
                                        <div className="home-member-name">{name}</div>
                                        {isCaptain && <div className="home-cap-badge">CAP</div>}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="home-no-team-msg">
                            You haven&apos;t joined a team yet.{' '}
                            <button className="inline-link" onClick={() => onNavigate('register')}>Go to Registration →</button>
                        </div>
                    )}
                </div>

                {/* Tool Selection Card */}
                <div className="home-card">
                    <div className="home-card-label">Tool Selection</div>
                    <div className="home-card-subtext">Free training is available for all tools. Pick one &mdash; or combine them if your use case calls for it.</div>
                    <div className="home-tool-grid">
                        {toolCards.map(({ toolName, logoUrl, isSelected }) => (
                            <div key={toolName} className={`home-tool-card${isSelected ? ' home-tool-card-sel' : ''}`}>
                                {isSelected && <div className="home-tool-check">✓</div>}
                                {logoUrl
                                    ? <img src={logoUrl} alt={toolName} className="home-tool-logo" />
                                    : <div className="home-tool-fallback">{toolName}</div>
                                }
                            </div>
                        ))}
                    </div>
                </div>

                {/* Draft Problem Statement (only if on a team) */}
                {myTeam && (
                    <div className="home-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div className="home-card-label" style={{ marginBottom: 0 }}>Draft Problem Statement</div>
                            <div className={`home-draft-badge${useCase ? ' home-draft-badge-done' : ''}`}>
                                {useCase ? 'Filled In' : 'Drafting'}
                            </div>
                        </div>
                        <div className="home-draft-field">
                            {useCase || <span style={{ fontStyle: 'italic', color: '#8BA5BF' }}>Not yet filled in</span>}
                        </div>
                    </div>
                )}

                {/* Submission Progress */}
                <div className="home-card">
                    <div className="home-card-label">Submission Progress</div>
                    <div className="home-steps">
                        {[
                            { num: 1, label: 'Registered',    done: step1Done, navId: 'register' },
                            { num: 2, label: 'Team Formed',   done: step2Done, navId: 'register' },
                            { num: 3, label: 'Tool Selected', done: step3Done, navId: 'tools'    },
                            { num: 4, label: 'Submitted',     done: step4Done, navId: null        },
                        ].map(({ num, label, done, navId }) => (
                            <div key={num} className="home-step-row">
                                <div className={`home-step-circle${done ? ' home-step-done' : ''}`}>
                                    {done ? '✓' : num}
                                </div>
                                <div className={`home-step-label${done ? ' home-step-label-done' : ''}`}>{label}</div>
                                {navId && (
                                    <button className="inline-link" style={{ fontSize: 11 }} onClick={() => onNavigate(navId)}>Go →</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(err) { return { error: err }; }
    componentDidCatch(err, info) { console.error('[GG Hackathon]', err, info); }
    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Inter, sans-serif', background: '#F4F7FB', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: '#0071CE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                        <span style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>!</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0B2C5F' }}>Something went wrong</div>
                    <div style={{ fontSize: 13, color: '#5A7A9A', maxWidth: 320 }}>{this.state.error?.message ?? 'An unexpected error occurred.'}</div>
                    <button
                        onClick={() => this.setState({ error: null })}
                        style={{ marginTop: 8, padding: '10px 24px', background: '#0071CE', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

initializeBlock({ interface: () => <ErrorBoundary><App /></ErrorBoundary> });
