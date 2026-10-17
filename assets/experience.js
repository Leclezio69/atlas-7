/* The experience layer uses observed state during play; truth is used only in report.
   glyph() is provided by shared.js. */
const AREA_LABELS={leak:'Data lineage',fair:'Fair lending',aan:'Reason codes',impl:'Replication',drift:'Population drift',overfit:'Validation',calib:'Calibration',segment:'Thin-file cohort',vendor:'Vendor model',monitor:'Monitoring',docs:'Documentation'};
const OBS_IDS=['leak','fair','aan','impl','drift','overfit','calib','segment','vendor','monitor','docs'];
const EXPERIENCE_PREFS={motion:true,exploded:false};
try{EXPERIENCE_PREFS.motion=localStorage.getItem('atlas7-motion')!=='off'}catch(_){}
function observedState(id){if(!S.run[id])return'idle';const f=S.findings[id];if(f?.sev&&f.sev!=='X')return f.sev;if(S.ex[id]==='cleared')return'clear';return'review'}
function statusLabel(state){return{idle:'Unexamined',review:'Awaiting your call',clear:'Cleared by you',H:'High finding',M:'Medium finding',L:'Low finding'}[state]}
function commandTabs(){if(S.phase==='report')return `<nav class="experience-tabs report-tabs" aria-label="Debrief sections">${[['summary','Debrief'],['answers','Answer key'],['consequences','Consequences'],['memo','Committee memo']].map(([id,label],i)=>`<button data-report-tab="${id}" aria-pressed="${(U.reportTab||'summary')===id}"><span>0${i+1}</span>${label}</button>`).join('')}</nav>`;return `<nav class="experience-tabs" aria-label="Validation workspace"><div>${[['overview','Model observatory'],['desk','Investigation desk'],['journal','Decision journal']].map(([id,label],i)=>`<button data-screen="${id}" aria-pressed="${(U.screen||'overview')===id}"><span>0${i+1}</span>${label}${id==='journal'?`<em>${(S.journal||[]).length}</em>`:''}</button>`).join('')}</div><span class="case-stamp">VR–2026–114 <i> / </i> ${S.code}</span></nav>`}
function nextAction(){
 if(!S.log.length)return{kind:'run',id:'interview',label:'Interview the developers',tag:'START WITH A LEAD',title:'Find your first thread.',text:'Spend 2 hours with the build team. Their answers suggest where to look; your tests establish the facts.'};
 const unrated=Object.entries(S.findings).find(([,f])=>f.sev===null);if(unrated)return{kind:'rate',id:unrated[0],label:'Rate this finding',tag:'A DECISION IS INCOMPLETE',title:'Give the finding its weight.',text:AREA_LABELS[unrated[0]]+' has a finding without a severity. It will be omitted from the memo until you rate it.'};
 const pending=[...S.log].reverse().find(id=>id!=='interview'&&!S.ex[id]);if(pending)return{kind:'evidence',id:pending,label:'Read this exhibit',tag:'EVIDENCE AWAITS YOUR CALL',title:'What does the result support?',text:AREA_LABELS[pending]+' is on file. Read the result, use a follow-up if appropriate, then raise or clear the finding.'};
 const candidates=ORDER.filter(id=>!S.run[id]&&testHrs(id)<=todayLeft());
 if(!candidates.length)return{kind:S.day<5?'close':'opinion',label:S.day<5?'Close '+FULL[S.day-1]:'Prepare your opinion',tag:S.day<5?'THE REVIEW MOVES ON':'THE COMMITTEE IS WAITING',title:S.day<5?'Make the next day count.':'Commit to a defensible opinion.',text:S.day<5?'No remaining test fits today’s available hours. Close the day to continue the review.':'Check your findings and choose whether to approve, impose conditions, or return the model.'};
 const lead=S.run.interview?S.hints.find(id=>candidates.includes(id)):null,id=lead||candidates[0];
 return{kind:'inspect',id,label:'Inspect '+(AREA_LABELS[id]||'interview'),tag:lead?'FOLLOW A DEVELOPER LEAD':'YOUR NEXT INVESTIGATION',title:lead?'A claim worth testing.':'Choose where the hours go.',text:(lead?'The interview pointed toward '+AREA_LABELS[id].toLowerCase()+'. ':D[id]?.desc+' ')+testHrs(id)+' hours for the test. This is a suggested next step, not a risk ranking.'};
}
function guidance(){const a=nextAction();return `<aside class="guidance"><div class="guidance-symbol">↗</div><div><span>${a.tag}</span><h3>${a.title}</h3><p>${esc(a.text)}</p></div><button class="btn" data-next="${a.kind}" ${a.id?`data-next-id="${a.id}"`:''}>${esc(a.label)} <b>→</b></button></aside>`}
function inspectorFact(id,d,done){
 return `<div class="inspector-fact"><span>${done?'Observed result':'Test allocation'}</span><b>${done?esc(d.m.fmt(S.vals[id])):testHrs(id)+'<small> hours</small>'}</b><small>${done?esc(d.m.label):'Of '+todayLeft()+' hours available today'}</small></div>`;
}
function inspectorAction(id,d,done){
 if(done)return `<button class="btn inspector-launch" data-open-evidence="${id}">Open the evidence <span>↗</span></button>`;
 const disabled=testHrs(id)>todayLeft();
 return `<button class="btn inspector-launch" data-run="${id}" ${disabled?'disabled':''}>${disabled?'Not enough time today':'Run '+d.test} <span>↗</span></button>`;
}
function selectedInspector(){
 const id=OBS_IDS.includes(U.inspect)?U.inspect:'leak',d=D[id],state=observedState(id),done=!!S.run[id];
 return `<aside class="component-inspector" data-status="${state}">
  <div class="inspector-top"><span class="eyebrow">COMPONENT ${String(OBS_IDS.indexOf(id)+1).padStart(2,'0')} / 11</span><span class="status-pill ${state}">${statusLabel(state)}</span></div>
  <div class="component-glyph">${glyph(id)}</div>
  <span class="eyebrow">${esc(d.el)}</span><h3>${AREA_LABELS[id]}</h3><p>${esc(d.desc)}</p>
  ${inspectorFact(id,d,done)}
  ${inspectorAction(id,d,done)}
  <p class="inspector-foot">${done?'The marker reflects your review status. Final truth is revealed in the debrief.':'No result has been revealed. This component has not been tested.'}</p></aside>`;
}
function orbitalLabels(){
 return OBS_IDS.map((id,i)=>{
  const angle=(i/11-.25)*Math.PI*2;
  return `<button data-inspect="${id}" data-state="${observedState(id)}" aria-pressed="${(U.inspect||'leak')===id}" style="--x:${50+Math.cos(angle)*39}%;--y:${49+Math.sin(angle)*38}%" aria-label="${AREA_LABELS[id]}: ${statusLabel(observedState(id))}"><i></i><span>${AREA_LABELS[id]}</span><b>${String(i+1).padStart(2,'0')}</b></button>`;
 }).join('');
}
function observatoryReadouts(tested,cleared,open){
 return `<div class="observatory-readouts">
  <div><span>01 / TEST COVERAGE</span><b>${Math.round(tested/11*100)}<small>%</small></b><p>${tested} of 11 defect areas investigated</p></div>
  <div><span>02 / YOUR REGISTER</span><b>${String(open).padStart(2,'0')}<small> findings</small></b><p>${cleared} components cleared by you</p></div>
  <div><span>03 / REMAINING CAPACITY</span><b>${BUDGET-S.spent}<small> hours</small></b><p>${5-S.day} review days after today</p></div>
  <div class="observatory-note"><span>THE INDEPENDENCE PRINCIPLE</span><p>Confidence is a claim.<br><em>Evidence earns the decision.</em></p></div></div>`;
}
function observatoryView(){
 const tested=OBS_IDS.filter(id=>S.run[id]).length,cleared=OBS_IDS.filter(id=>observedState(id)==='clear').length,open=Object.values(S.findings).filter(f=>f.sev!=='X').length;
 return `<section class="observatory">
  <header class="observatory-heading"><div><span class="eyebrow">LIVE INVESTIGATION MODEL</span><h2>A system of claims.<br><em>Find the weak connection.</em></h2></div><p>Select a component to inspect it. Run a test to expose evidence. The model changes as you make your calls.</p></header>
  <div class="observatory-grid">
   <div class="orbital-instrument">
    <div class="instrument-header"><span><i></i> ATLAS–7 / MODEL OBSERVATORY</span><div><button data-explode aria-pressed="${EXPERIENCE_PREFS.exploded}" title="Separate the model layers">${EXPERIENCE_PREFS.exploded?'Collapse layers':'Separate layers'}</button><button data-motion aria-pressed="${!EXPERIENCE_PREFS.motion}" aria-label="${EXPERIENCE_PREFS.motion?'Pause':'Resume'} animation">${EXPERIENCE_PREFS.motion?'Ⅱ Pause':'▷ Animate'}</button></div></div>
    <div class="core-stage"><canvas id="model-observatory" aria-label="Interactive model sculpture. Drag to rotate. Select a labeled component to inspect its test."></canvas><div class="orbital-labels">${orbitalLabels()}</div><span class="rotation-hint">DRAG TO ROTATE <span>↔</span></span></div>
    <div class="instrument-footer"><span><i class="unexamined"></i> Unexamined</span><span><i class="review"></i> Review</span><span><i class="clear"></i> Cleared</span><span><i class="high"></i> Finding</span><b>${tested}<small> / 11 tested</small></b></div>
   </div>
   ${selectedInspector()}
  </div>
  ${observatoryReadouts(tested,cleared,open)}
 </section>
 ${guidance()}
 <div class="observatory-bottom"><button data-screen="desk" class="btn ghost">Open full investigation desk ↗</button><p>Visual states show your recorded calls, not hidden case truth.</p></div>`;
}
function journalEvent(kind,title,detail){if(!Array.isArray(S.journal))S.journal=[];S.journal.push({day:S.day,hours:S.spent,kind,title,detail});if(S.journal.length>300)S.journal=S.journal.slice(-300)}
function journalView(){const entries=S.journal||[];return `<section class="journal-view"><div class="journal-heading"><span class="eyebrow">THE RECORD OF YOUR REVIEW</span><h2>Every call leaves a trace.</h2><p>Your tests, findings and decisions, recorded in the order you made them.</p></div>${entries.length?`<div class="journal-list">${entries.map((entry,i)=>`<article class="journal-entry"><div class="journal-time"><span>${DAYS[entry.day-1][0]}</span><b>${String(i+1).padStart(2,'0')}</b><small>${entry.hours} h used</small></div><div class="journal-copy"><span class="eyebrow">${esc(entry.kind)}</span><h3>${esc(entry.title)}</h3><p>${esc(entry.detail||'')}</p></div></article>`).reverse().join('')}</div>`:`<div class="journal-empty">${glyph('docs')}<h3>Your review is ready to begin.</h3><p>${S.spent?'This saved case predates the decision journal. New actions will appear here.':'Run your first test and your decision trail will start here.'}</p><button class="btn" data-screen="desk">Enter the investigation →</button></div>`}</section>`}
function evidenceContext(id){const paths={leak:['Source data','Feature timing','Credit decision'],fair:['Applicant cohorts','Approval rates','Fair lending'],aan:['Model attribution','Reason stability','Decline notice'],impl:['Reference build','Production scores','Loan decision'],drift:['Development data','Live applicants','Population drift'],overfit:['Training sample','Out-of-time test','Model validity'],calib:['Predicted risk','Observed defaults','Risk calibration'],segment:['Thin-file cohort','Ranking quality','Restricted use'],vendor:['Credit bureau','Vendor embedding','Feature pipeline'],monitor:['Live outcomes','Trigger thresholds','Accountable owners'],docs:['Model dossier','Known limitations','Approved use']};return `<div class="evidence-context"><span>EVIDENCE CHAIN</span><div>${paths[id].map((label,i)=>`<b class="${i===1?'current':''}">${label}</b>${i<2?'<i>→</i>':''}`).join('')}</div></div>`}
function evidenceHero(id){const z=zoneOf(id),d=D[id];return `<div class="evidence-titlebar" data-zone="${z}"><div class="evidence-glyph">${glyph(id)}</div><div><span>EXHIBIT / ${esc(d.el)}</span><h3>${esc(d.test)}</h3></div><div class="evidence-state"><i></i>${z==='breach'?'TOLERANCE BREACH':z==='watch'?'REVIEW REQUIRED':'WITHIN TOLERANCE'}</div></div>`}
function reviewReceipt(){if(!S.fresh)return'';const id=S.fresh;return `<div class="review-receipt" aria-live="polite"><i>✓</i><span><b>${id==='interview'?'Interview recorded':'Test completed'}</b> ${testHrs(id)} analyst hours used. ${todayLeft()} hours remain today.</span><button data-receipt-close aria-label="Dismiss test completion message">×</button></div>`}
function debriefHero(g,title,blurb){const missed=g.rows.filter(r=>r.ts&&!r.call).length,correct=g.rows.filter(r=>r.ts&&r.pts===r.w).length,actual=g.rows.filter(r=>r.ts).length;return `<div class="debrief-hero"><img src="../assets/committee-room.webp" alt="An empty committee room overlooking the city at dusk"><div class="debrief-shade"></div><div class="debrief-copy"><span class="eyebrow">CASE ${S.code} / THE FINAL RECORD</span><h2>${title}</h2><p>${blurb}</p><div class="opinion-seal"><span>YOUR OPINION</span><b>${OPN[S.decision]}</b></div></div><div class="score-medallion"><svg viewBox="0 0 220 220" aria-hidden="true"><circle class="score-base" cx="110" cy="110" r="91"/><circle class="score-progress" cx="110" cy="110" r="91" pathLength="100" stroke-dasharray="${g.total} 100"/></svg><div><span>VALIDATION SCORE</span><b>${g.total}<small>/100</small></b><span>REVIEW COMPLETE</span></div></div></div><div class="debrief-stats"><div><span>Correctly rated</span><b>${correct}<small> / ${actual} defects</small></b></div><div><span>Missed defects</span><b class="${missed?'bad':''}">${missed}</b></div><div><span>False alarms</span><b>${g.fps}</b></div><div><span>Hours invested</span><b>${S.spent}<small> / 40</small></b></div></div>`}
function scoreProfile(g){const dimensions=[['Findings',g.findPts,50],['Precision',g.precision,10],['Challenges',g.rebut,10],['Opinion',g.dec,20],['Conduct',g.conduct,10]],point=(i,r)=>{const a=(i/5-.25)*Math.PI*2;return [140+Math.cos(a)*r,140+Math.sin(a)*r]},poly=r=>dimensions.map((_,i)=>point(i,r).join(',')).join(' ');return `<section class="review-profile"><div><span class="eyebrow">FIVE DIMENSIONS OF JUDGMENT</span><h3>Where your review stood up.</h3><p>Each axis is normalised to its own maximum. Your total uses the original scoring weights.</p><button class="btn ghost" data-report-tab="answers">Explore the answer key →</button></div><svg class="judgment-radar" viewBox="0 0 280 280" role="img" aria-label="${dimensions.map(([n,v,m])=>n+': '+Math.round(v)+' of '+m).join('; ')}">${[26,52,78,104].map(r=>`<polygon points="${poly(r)}" fill="none" stroke="currentColor" opacity=".15"/>`).join('')}${dimensions.map((_,i)=>`<path d="M140 140L${point(i,104).join(' ')}" stroke="currentColor" opacity=".15"/>`).join('')}<polygon points="${dimensions.map(([,v,m],i)=>point(i,104*v/m).join(',')).join(' ')}" fill="#d6a47b33" stroke="#d6a47b" stroke-width="1.5"/>${dimensions.map(([n,v,m],i)=>{const p=point(i,126),q=point(i,104*v/m);return `<circle cx="${q[0]}" cy="${q[1]}" r="3" fill="#e5bd90"/><text x="${p[0]}" y="${p[1]+3}" text-anchor="middle">${n}</text>`}).join('')}</svg><div class="profile-scores">${dimensions.map(([n,v,m])=>`<div><span>${n}</span><b>${Math.round(v)}<small> / ${m}</small></b><i style="--score:${v/m*100}%"></i></div>`).join('')}</div></section>`}
function eventArtwork(){if(S.event==='rb')return `<div class="event-scene committee"><img src="../assets/committee-room.webp" alt=""><div><span>FRIDAY / DEFEND YOUR FINDINGS</span><h4>Evidence meets<br><em>resistance.</em></h4></div></div>`;if(!S.event)return'';const words={2:['TUESDAY / BUSINESS PRESSURE','The launch has<br>a powerful sponsor.'],3:['WEDNESDAY / VENDOR EVIDENCE','Open the<br>black box.'],4:['THURSDAY / ESCALATION','The next decision<br>travels upward.']};return `<div class="event-scene"><img src="../assets/${S.event===3?'evidence-landscape.webp':'committee-room.webp'}" alt=""><div><span>${words[S.event][0]}</span><h4>${words[S.event][1]}</h4></div></div>`}
function experienceRender(){
 window.AtlasCore?.destroy();
 const canvas=document.getElementById('model-observatory');
 if(canvas?.getContext)window.AtlasCore?.mount(canvas,{states:OBS_IDS.map(observedState),selected:OBS_IDS.indexOf(U.inspect||'leak'),motion:EXPERIENCE_PREFS.motion,exploded:EXPERIENCE_PREFS.exploded});
 document.documentElement.dataset.motion=EXPERIENCE_PREFS.motion?'on':'off';
 const event=document.querySelector('.scrim .memo');if(event&&!event.querySelector('.event-scene'))event.insertAdjacentHTML('afterbegin',eventArtwork());
}
function changeScreen(screen){if(!['overview','desk','journal'].includes(screen))return;U.screen=screen;render();window.scrollTo({top:0,behavior:'instant'})}
function openEvidence(id){if(!S.run[id])return;U.screen='desk';U.selected=id;U.tab='evidence';render();window.scrollTo({top:0,behavior:'instant'})}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
 if(d.screen)changeScreen(d.screen);
 else if(d.inspect){U.inspect=d.inspect;U.screen='overview';render()}
 else if(d.openEvidence)openEvidence(d.openEvidence);
 else if('explode'in d){EXPERIENCE_PREFS.exploded=!EXPERIENCE_PREFS.exploded;render()}
 else if('motion'in d){EXPERIENCE_PREFS.motion=!EXPERIENCE_PREFS.motion;try{localStorage.setItem('atlas7-motion',EXPERIENCE_PREFS.motion?'on':'off')}catch(_){}render()}
 else if(d.reportTab&&S.phase==='report'){U.reportTab=d.reportTab;render();window.scrollTo({top:0,behavior:'instant'})}
 else if('receiptClose'in d){S.fresh=null;render()}
 else if(d.next){const id=d.nextId;if(d.next==='run')runTest(id);else if(d.next==='evidence')openEvidence(id);else if(d.next==='rate'){U.screen='desk';U.tab='findings';render();window.scrollTo({top:0,behavior:'instant'})}else if(d.next==='inspect'){U.inspect=id;U.screen='overview';render()}else if(d.next==='close')closeDay();else changeScreen('desk')}
});
