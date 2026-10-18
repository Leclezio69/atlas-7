"use strict";
var DAYS=[["Mon",12],["Tue",13],["Wed",14],["Thu",15],["Fri",16]];
var FULL=["Monday","Tuesday","Wednesday","Thursday","Friday"];
var BUDGET=40, DAILY=9;
var LEAKF=["days_since_last_collection_call","hardship_flag_updated","payment_plan_count","promise_to_pay_count"];
var pctS=v=>Math.round(v*100)+"%";

/* ---------- the defect pool: one test per potential defect ---------- */
var D={
 leak:{test:"Feature timing review",el:"Conceptual soundness",hrs:5,desc:"Trace each feature to when it is known relative to the decision.",
  title:"Target leakage from post-decision data",hook:"SR 11-7 conceptual soundness · EU AI Act Art. 10",
  remed:"Remove post-decision fields, rebuild, and restate out-of-time performance.",
  m:{label:"Post-decision features",min:0,max:5,int:1,fmt:v=>String(v),bands:[[0,.5,"ok"],[.5,1.5,"watch"],[1.5,5,"breach"]],
     cap:"0 = clean · any feature known only after the decision is leakage",r:{severe:[2,4],border:[1,1],clean:[0,0]}},
  text:{breach:v=>`${v} features are written by the servicing system after an account goes delinquent: ${LEAKF.slice(0,v).join(", ")}. In training they are populated for 58% of defaults and 2% of performing loans.`,
        watch:()=>"One feature, bureau_refresh_date, carries a timestamp that can fall after the decision. It is unclear whether the value is frozen at application or refreshed later.",
        ok:()=>"All 212 features trace to sources captured at or before the application timestamp."},
  fu:{name:"Source-system lineage trace",hrs:2,mild:"bureau_refresh_date refreshes nightly. 0.6% of records carry bureau data pulled up to three days after the decision. Small, but real leakage.",
      noisy:"The timestamp is a warehouse load date. The value itself is frozen at application. No leakage."},
  rb:{spin:"The servicing fields are among our most predictive inputs. Every serious lender uses behavioral data, and removing them would cripple the model.",
      over:"We accept that bureau_refresh_date occasionally pulls late data, but it touches 0.6% of records. That is a fix, not a High.",
      valid:"The attached lineage documentation shows bureau_refresh_date is a warehouse load stamp. The underlying value is frozen at application."},
  sev:["H","M"],hint:"We pulled some servicing data in late in the build. It lifted performance a lot.",
  missed:"Live performance collapses. Realized 12-month defaults run at 2.9× forecast and the book takes $41M in unplanned charge-offs.",
  held:"Leakage caught. The honest out-of-time AUC goes on the record before anyone prices off it."},
 fair:{test:"Disparate impact analysis",el:"Fair lending",hrs:7,desc:"Approval-rate ratios by protected class using BISG proxy estimates.",
  title:"Disparate impact on a protected class",hook:"ECOA / Reg B · EU AI Act Annex III 5(b)",
  remed:"Run a less-discriminatory-alternative search and remove or constrain proxy features.",
  m:{label:"Adverse impact ratio",min:.6,max:1,dp:2,fmt:v=>v.toFixed(2),bands:[[.6,.8,"breach"],[.8,.9,"watch"],[.9,1,"ok"]],
     cap:"Four-fifths screen: below 0.80 indicates adverse impact · 0.80–0.90 warrants review",r:{severe:[.68,.76],border:[.81,.86],clean:[.91,.97]}},
  text:{breach:v=>`Hispanic applicants are approved at ${pctS(v)} of the rate of non-Hispanic white applicants with similar bureau profiles. zip3_default_rate and merchant_category_mix together carry 14% of model gain.`,
        watch:v=>`The ratio for Hispanic applicants is ${v.toFixed(2)}, inside the review band. The raw gap may reflect legitimate credit factors rather than the model.`,
        ok:v=>`Adverse impact ratios across all BISG groups are ${v.toFixed(2)} or higher.`},
  fu:{name:"Controlled disparity analysis",hrs:3,mild:"Holding DTI, bureau score and income constant, the ratio stays at 0.84. Dropping zip3_default_rate closes most of the gap for 0.004 AUC. A less discriminatory alternative exists.",
      noisy:"Holding DTI, bureau score and income constant, the ratio rises to 0.97. The raw gap is explained by legitimate credit factors."},
  rb:{spin:"Our features are race-neutral by construction. We never use protected attributes, so disparate impact cannot arise.",
      over:"We accept a less discriminatory alternative exists, but the controlled ratio is 0.84, above the four-fifths screen. This is Medium, not High.",
      valid:"Our controlled analysis is attached. With DTI, bureau score and income held constant, the ratio is 0.97. The raw gap reflects credit factors."},
  sev:["H","M"],hint:"Zip-level default rates turned out to be one of our strongest features.",
  missed:"The fair lending exam cites disparate impact. Consent order with $18M in restitution and a two-year monitorship.",
  held:"Disparate impact flagged. Fair lending runs an LDA search before any launch."},
 aan:{test:"Reason-code stability test",el:"Explainability",hrs:5,desc:"Rerun SHAP attributions on declined files to see if decline reasons hold.",
  title:"Unstable adverse action reasons",hook:"Reg B §1002.9 principal reasons · EU AI Act Art. 86",
  remed:"Move to a fixed-background attribution method and test reason stability before use in notices.",
  m:{label:"Top-reason flip rate",min:0,max:45,int:1,fmt:v=>v+"%",bands:[[0,10,"ok"],[10,20,"watch"],[20,45,"breach"]],
     cap:"House tolerance for notice reasons: under 10% · above 20% notices are unreliable",r:{severe:[26,40],border:[12,17],clean:[3,8]}},
  text:{breach:v=>`Across 500 declined files and 20 reruns each, the first-ranked decline reason changed in ${v}% of cases. Notices built on these codes would give different reasons for the same file.`,
        watch:v=>`The first-ranked reason changed in ${v}% of reruns. The instability could come from the model or from the random background sample the test uses.`,
        ok:v=>`Top decline reasons held; they changed in only ${v}% of reruns.`},
  fu:{name:"Fixed-background rerun",hrs:2,mild:"With a fixed background set, flips fall to 11%. Still above tolerance for adverse action notices.",
      noisy:"With a fixed background set, flips fall to 2%. The instability came from the test's own sampling."},
  rb:{spin:"SHAP is the industry standard for explanations. Regulators accept it.",
      over:"With a fixed background the flip rate is 11%. That needs tuning, but it does not make every notice wrong.",
      valid:"Attached: rerunning with a fixed background set drops the flip rate to 2%. The variation came from your test's random sampling."},
  sev:["H","M"],hint:"Reason codes come straight out of SHAP. We didn't tune anything there.",
  missed:"Examiners find decline notices did not state principal reasons. 84,000 notices re-issued at the bank's cost.",
  held:"Reason-code instability documented; the attribution method is fixed before any notice goes out."},
 impl:{test:"Independent replication",el:"Implementation",hrs:6,desc:"Rebuild from source and reconcile against production scores.",
  title:"Production does not match the validated model",hook:"SR 11-7 implementation · EU AI Act Art. 15",
  remed:"Correct production missing-value handling and reconcile again before go-live.",
  m:{label:"Scores differing / 10,000",min:0,max:500,int:1,sqrt:1,fmt:v=>String(v),bands:[[0,5,"ok"],[5,40,"watch"],[40,500,"breach"]],
     cap:"Reconciliation tolerance: 5 records · scale is square-root",r:{severe:[180,420],border:[12,30],clean:[0,3]}},
  text:{breach:v=>`${v} of 10,000 holdout scores differ between the rebuild and production, and 1.3% of approve or decline decisions flip.`,
        watch:v=>`${v} of 10,000 scores differ. That could be numeric rounding or a real logic difference.`,
        ok:v=>v?`${v} of 10,000 scores differ, at the seventh decimal. Implementation is faithful.`:"All 10,000 scores match production exactly."},
  fu:{name:"Root-cause the mismatches",hrs:2,mild:"Production imputes missing income as 0; development used the median. 0.2% of decisions flip.",
      noisy:"Every difference is floating-point rounding beyond the sixth decimal. No decision changes."},
  rb:{spin:"The platform team ran full regression testing on production. We trust their sign-off.",
      over:"We accept the income imputation bug, but only 0.2% of decisions flip. Medium at most.",
      valid:"The attached diff log shows every mismatch is rounding beyond the sixth decimal. No decision changes."},
  sev:["H","M"],hint:"Production was rebuilt by the platform team. We haven't compared the two ourselves.",
  missed:"A production bug mis-decides 1.3% of applications. 4,800 customers are remediated.",
  held:"Production corrected and reconciled before go-live."},
 drift:{test:"Population stability analysis",el:"Outcomes analysis",hrs:3,desc:"Compare current applicants to the 2019–2021 development sample.",
  title:"Applicant population has shifted",hook:"SR 11-7 outcomes analysis",
  remed:"Recalibrate on a 2024–2026 sample and add PSI triggers to monitoring.",
  m:{label:"Population stability index",min:0,max:.4,dp:2,fmt:v=>v.toFixed(2),bands:[[0,.1,"ok"],[.1,.25,"watch"],[.25,.4,"breach"]],
     cap:"Rule of thumb: under 0.10 stable · 0.10–0.25 watch · above 0.25 significant shift",r:{severe:[.27,.36],border:[.14,.22],clean:[.03,.08]}},
  text:{breach:v=>`PSI against the development sample is ${v.toFixed(2)}. bnpl_tradelines barely existed in 2019–2021 and now appears on 34% of applications.`,
        watch:v=>`PSI is ${v.toFixed(2)}, in the watch band. The shift could be structural or seasonal.`,
        ok:v=>`PSI is ${v.toFixed(2)}. Current applicants look like the development sample.`},
  fu:{name:"Characteristic-level analysis",hrs:2,mild:"The shift concentrates in bnpl_tradelines. Rank ordering holds, but thin-file calibration is drifting.",
      noisy:"The shift is seasonal. The same tax-refund months last year showed PSI 0.17 and scores held."},
  rb:{spin:"Some drift is normal for any model. We'll recalibrate if performance drops.",
      over:"We accept a BNPL-driven shift, but rank ordering holds. That is a Low.",
      valid:"Attached seasonal comparison: the same months last year showed PSI 0.17 with stable performance."},
  sev:["M","L"],hint:"We haven't refreshed the development sample since 2021.",
  missed:"BNPL-heavy applicants are mis-scored. Approval rates swing 9 points across two quarters.",
  held:"Drift logged with a recalibration condition."},
 vendor:{test:"Vendor component review",el:"Third-party risk",hrs:4,desc:"Assess the BureauVec embedding that supplies 48 features.",
  title:"Unvalidated third-party component",hook:"SR 11-7 vendor products · 2023 interagency third-party guidance",
  remed:"Obtain developmental evidence, contract for change notice, and test on the lending population.",
  m:{label:"Evidence items received (of 6)",min:0,max:6,int:1,fmt:v=>String(v),bands:[[0,2.5,"breach"],[2.5,4.5,"watch"],[4.5,6,"ok"]],
     cap:"SR 11-7 expects vendor development evidence, testing results and stated limitations",r:{severe:[0,1],border:[3,4],clean:[6,6]}},
  text:{breach:v=>`The vendor provided ${v} of 6 required evidence items${v?": an API spec":""}. No development data description, no performance testing, no limitations.`,
        watch:v=>`The vendor provided ${v} of 6 evidence items. Performance testing and stated limitations are not among them.`,
        ok:()=>"The vendor provided all six evidence items, including testing on unsecured personal lending."},
  fu:{name:"Vendor due-diligence call",hrs:2,mild:"Testing exists, but only on prime auto loans. It was never run on unsecured personal lending.",
      noisy:"The missing items were in the SOC 2 report annex. The evidence package is complete."},
  rb:{spin:"BureauVec is used by dozens of banks. If it had a problem, someone would have found it.",
      over:"Testing exists, just on a different product. That is a Low.",
      valid:"The two items you flagged are in the SOC 2 annex, attached. The package is complete."},
  sev:["M","L"],hint:"BureauVec came bundled with the platform license, so we didn't test it ourselves.",
  missed:"The vendor silently ships BureauVec v3. Forty-eight features shift overnight and nobody is told.",
  held:"Vendor component brought into scope with change-notice terms."},
 monitor:{test:"Monitoring plan review",el:"Ongoing monitoring",hrs:2,desc:"Check what will be watched in production and who acts on it.",
  title:"Monitoring without triggers",hook:"SR 11-7 ongoing monitoring",
  remed:"Set trigger thresholds and a named escalation owner for every monitored metric.",
  m:{label:"Metrics with triggers (of 8)",min:0,max:8,int:1,fmt:v=>String(v),bands:[[0,3.5,"breach"],[3.5,6.5,"watch"],[6.5,8,"ok"]],
     cap:"Policy MRM-4: every risk metric on a Tier 1 model needs a trigger and an owner",r:{severe:[0,2],border:[4,6],clean:[8,8]}},
  text:{breach:v=>`Only ${v} of 8 monitored metrics have trigger thresholds, and no escalation owner is named.`,
        watch:v=>`${v} of 8 metrics have triggers. The rest are reported with no breach level.`,
        ok:()=>"All eight metrics have thresholds and named owners."},
  fu:{name:"Owner walkthrough",hrs:1,mild:"Triggers are missing on fairness and drift, the two metrics most likely to move.",
      noisy:"The untriggered metrics are informational by policy MRM-4.2. Coverage is adequate."},
  rb:{spin:"Monitoring is the business's responsibility after launch, not Development's.",
      over:"Only two triggers are missing. That is housekeeping.",
      valid:"Policy MRM-4.2, attached, designates those metrics as informational. No triggers are required."},
  sev:["M","L"],hint:"Monitoring is really the business's job once we launch.",
  missed:"Drift goes unflagged for two quarters because nothing defines a breach.",
  held:"Monitoring now carries triggers and named owners."},
 docs:{test:"Documentation review",el:"Documentation",hrs:3,desc:"Read the 140-page development document against policy.",
  title:"Documentation gaps",hook:"SR 11-7 documentation · EU AI Act Art. 11",
  remed:"Complete the limitations, alternatives-considered and approved-use sections.",
  m:{label:"Required sections missing (of 14)",min:0,max:6,int:1,fmt:v=>String(v),bands:[[0,.5,"ok"],[.5,2.5,"watch"],[2.5,6,"breach"]],
     cap:"Policy MRM-2 lists 14 required sections for Tier 1 documentation",r:{severe:[3,5],border:[1,2],clean:[0,0]}},
  text:{breach:v=>`${v} of 14 required sections are missing, including limitations and approved use.`,
        watch:v=>`${v} required section${v>1?"s appear":" appears"} to be missing from the document.`,
        ok:()=>"All 14 required sections are present."},
  fu:{name:"Policy mapping",hrs:1,mild:"The limitations section is absent. Nothing says where the model should not be used.",
      noisy:"The sections are in the appendix volume. Documentation is complete."},
  rb:{spin:"The document is 140 pages. Nobody reads the boilerplate sections.",
      over:"One missing section is housekeeping, not a finding.",
      valid:"The sections you flagged are in Appendix C, attached."},
  sev:["M","L"],hint:"We wrote the document in a rush before the committee date.",
  missed:"The business extends ATLAS-7 to auto refinance, a use it was never built for.",
  held:"Limitations and approved use written down."},
 overfit:{test:"Out-of-time performance",el:"Outcomes analysis",hrs:4,desc:"Compare in-time AUC to a later, untouched window.",
  title:"Performance degrades out of time",hook:"SR 11-7 outcomes analysis",
  remed:"Re-tune on a time split and report out-of-time performance as primary.",
  m:{label:"AUC drop, in-time to out-of-time",min:0,max:.14,dp:3,fmt:v=>v.toFixed(3),bands:[[0,.03,"ok"],[.03,.06,"watch"],[.06,.14,"breach"]],
     cap:"Typical for stable consumer credit models: under 0.03",r:{severe:[.08,.12],border:[.04,.055],clean:[.01,.025]}},
  text:{breach:v=>`AUC falls ${v.toFixed(3)} from the development window to the out-of-time window. Tuning was done against the holdout.`,
        watch:v=>`AUC falls ${v.toFixed(3)} out of time. That could be overfitting or a real change in the economy.`,
        ok:v=>`AUC moves only ${v.toFixed(3)} out of time.`},
  fu:{name:"Logistic baseline comparison",hrs:2,mild:"A logistic baseline drops only 0.01 on the same window. ATLAS-7 is somewhat overfit.",
      noisy:"A logistic baseline drops by the same amount. The economy moved, not the model."},
  rb:{spin:"Our holdout AUC is excellent, and that's the metric we optimize.",
      over:"There is some overfit, but the drop is small. Low.",
      valid:"Attached: a logistic baseline drops by the same amount on that window. This is macro, not overfitting."},
  sev:["M","L"],hint:"We tuned pretty hard against the holdout set.",
  missed:"Performance decays fast and the model is pulled after nine months.",
  held:"Re-tuned on a time split."},
 calib:{test:"Calibration by risk decile",el:"Outcomes analysis",hrs:4,desc:"Compare predicted to observed default by score decile.",
  title:"Underpredicts default in the riskiest decile",hook:"SR 11-7 outcomes analysis · CECL reliance",
  remed:"Recalibrate and add decile-level calibration to monitoring.",
  m:{label:"Top-decile calibration error",min:0,max:50,int:1,fmt:v=>v+"%",bands:[[0,10,"ok"],[10,25,"watch"],[25,50,"breach"]],
     cap:"Finance relies on these PDs for pricing and reserves · tolerance 10%",r:{severe:[32,48],border:[13,20],clean:[3,8]}},
  text:{breach:v=>`In the riskiest decile, predicted default understates observed default by ${v}%. Pricing and loss reserves inherit the error.`,
        watch:v=>`Top-decile calibration error is ${v}%. It could reflect one unusual vintage.`,
        ok:v=>`Calibration error stays within ${v}% across all deciles.`},
  fu:{name:"Vintage rerun",hrs:2,mild:"The error holds at 15% on the 2025 vintage.",
      noisy:"The error comes from the 2020 stimulus vintage. Recent vintages calibrate within 6%."},
  rb:{spin:"We optimize for ranking. Calibration is Finance's problem.",
      over:"15% is close to tolerance. Low.",
      valid:"Attached by vintage: recent vintages calibrate within 6%. The error is a 2020 stimulus artifact."},
  sev:["M","L"],hint:"We optimized for AUC. Calibration was secondary.",
  missed:"Reserves on the riskiest loans run 40% light and Finance restates the quarter.",
  held:"Recalibrated, with decile monitoring."},
 segment:{test:"Thin-file segment performance",el:"Outcomes analysis",hrs:4,desc:"Test rank ordering for applicants with short credit histories.",
  title:"Weak performance on thin-file applicants",hook:"SR 11-7 outcomes analysis · EU AI Act Art. 15",
  remed:"Restrict use for thin-file applicants or build a segment model.",
  m:{label:"Thin-file AUC",min:.55,max:.82,dp:2,fmt:v=>v.toFixed(2),bands:[[.55,.65,"breach"],[.65,.72,"watch"],[.72,.82,"ok"]],
     cap:"Policy floor for a material segment: 0.65 · target 0.72",r:{severe:[.58,.63],border:[.66,.7],clean:[.74,.78]}},
  text:{breach:v=>`Thin-file AUC is ${v.toFixed(2)}. Thin-file applicants are 11% of volume and a growth target.`,
        watch:v=>`Thin-file AUC is ${v.toFixed(2)}. The segment sample is small, so the estimate is noisy.`,
        ok:v=>`Thin-file AUC is ${v.toFixed(2)}, in line with the overall model.`},
  fu:{name:"Bootstrap the segment",hrs:2,mild:"The bootstrap interval of 0.64–0.71 sits wholly below target. Rank ordering is weak below a score of 620.",
      noisy:"With n = 410, the bootstrap interval of 0.64–0.80 includes overall performance. No evidence of a gap."},
  rb:{spin:"Thin-file is a small segment. It won't move the portfolio.",
      over:"The gap is modest. Low.",
      valid:"Attached bootstrap: with n = 410 the interval includes overall performance."},
  sev:["M","L"],hint:"Thin-file applicants are a big growth target for us this year.",
  missed:"Thin-file losses run at twice plan and the growth campaign is shut down.",
  held:"Thin-file use restricted pending a segment model."}
};
var IDS=Object.keys(D);
var HIGHCAP=["leak","fair","aan","impl"];
var ORDER=["interview","leak","fair","aan","impl","drift","overfit","calib","segment","vendor","monitor","docs"];
var SEVW={H:14,M:9,L:5}, RANK={H:3,M:2,L:1}, SEVN={H:"High",M:"Medium",L:"Low"};

var EVENTS={
  2:{key:"pressure",from:"Dana Whitlock, Head of Consumer Lending",subject:"Launch is booked for Monday",
     body:"Marketing spend is committed and the call center is staffed. I need a preliminary green light from Validation today so we can hold the date. You can finish the paperwork after go-live.",
     options:[{v:"hold",b:"Hold the line",s:"No approval until the review is complete."},
              {v:"prelim",b:"Give a preliminary green light",s:"Keep the launch date and finish the review in parallel."}]},
  3:{key:"vendor",from:"BureauVec Partner Success",subject:"Documentation available under NDA",
     body:"We understand your team has questions about BureauVec v2. If your legal team signs our mutual NDA, we can share our internal model summary. It should shorten your review.",
     options:[{v:"nda",b:"Sign the NDA",s:"Vendor component review drops from 4 hours to 2."},
              {v:"decline",b:"Decline",s:"Review the component with what you have."}]},
  4:{key:"committee",from:"Office of the Chief Risk Officer",subject:"Supervisory review of AI credit models next quarter",
     body:"The regulator has scheduled a horizontal review of machine-learning credit models. The CRO is asking validators whether anything in flight should reach the Model Risk Committee early.",
     options:[{v:"brief",b:"Brief the committee now",s:"Costs 2 analyst hours today."},
              {v:"wait",b:"Wait for the final report",s:"Keep the hours for testing."}]}
};

/* ---------- seeded case generation ---------- */
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(arr,r){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
var CODECH="ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function codeFrom(seed){let s=seed>>>0,c="";for(let i=0;i<4;i++){c+=CODECH[s%CODECH.length];s=Math.floor(s/CODECH.length)}return c}
function seedFrom(code){let s=0;for(let i=code.length-1;i>=0;i--){const k=CODECH.indexOf(code[i]);if(k<0)return null;s=s*CODECH.length+k}return s}
function newSeed(){try{const u=new Uint32Array(1);crypto.getRandomValues(u);return u[0]%(CODECH.length**4)}catch(_){return Math.floor(Math.random()*CODECH.length**4)}}

function buildCase(seed){
  const r=rng(seed*2654435761+17);
  const truth={}; IDS.forEach(id=>truth[id]="clean");
  let pool=shuffle(IDS,r);
  const take=(cands,n,st)=>{const picked=shuffle(cands.filter(id=>truth[id]==="clean"),r).slice(0,n);picked.forEach(id=>truth[id]=st)};
  if(r()<0.8){ take(HIGHCAP,r()<0.5?1:2,"severe"); take(IDS.filter(i=>!HIGHCAP.includes(i)),1,"severe"); }
  else { take(IDS.filter(i=>!HIGHCAP.includes(i)),2,"severe"); }
  take(IDS,2,"mild"); take(IDS,2,"noisy");
  const vals={};
  IDS.forEach(id=>{const m=D[id].m;const st=truth[id];const [a,b]=m.r[st==="severe"?"severe":st==="clean"?"clean":"border"];
    let v=a+(b-a)*r(); vals[id]=m.int?Math.round(v):+v.toFixed(m.dp)});
  const pres=IDS.filter(id=>truth[id]==="severe"||truth[id]==="mild");
  const noisy=IDS.filter(id=>truth[id]==="noisy");
  const hints=shuffle([...shuffle(pres,r).slice(0,2),...noisy.slice(0,1)],r);
  return {truth,vals,hints};
}

/* ---------- state ---------- */
var S;
function fresh(seed){
  seed=seed??newSeed();
  return {v:2,seed,code:codeFrom(seed),...buildCase(seed),day:1,spent:0,today:0,run:{},fu:{},ex:{},findings:{},log:[],choices:{},
    event:null,rbq:[],rbi:0,rbres:{},decision:null,phase:"play",fresh:null};
}
var $=s=>document.querySelector(s);
var esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
var testHrs=id=>id==="interview"?2:id==="vendor"&&S.choices.vendor==="nda"?2:D[id].hrs;
var todayLeft=()=>Math.max(0,Math.min(DAILY-S.today,BUDGET-S.spent));
var zoneOf=id=>{const m=D[id].m,v=S.vals[id];for(const[a,b,z]of m.bands)if(v>=a&&v<=b)return z;return m.bands[m.bands.length-1][2]};
var trueSev=id=>S.truth[id]==="severe"?D[id].sev[0]:S.truth[id]==="mild"?D[id].sev[1]:null;
var claimedAUC=()=>S.truth.leak==="severe"?"0.93":S.truth.leak==="mild"?"0.85":"0.81";

function spend(h){S.spent+=h;S.today+=h}
function runTest(id){
  const c=testHrs(id); if(S.run[id]||c>todayLeft())return;
  S.run[id]=S.day; spend(c); S.log.push(id); S.fresh=id; render();
}
function followUp(id){
  const c=D[id].fu.hrs; if(S.fu[id]||c>todayLeft())return;
  S.fu[id]=S.day; spend(c); S.fresh=null; render();
}
function raise(id){S.ex[id]="raised"; if(!S.findings[id])S.findings[id]={sev:null,day:S.day}; else S.findings[id].sev=null; S.fresh=null; render();}
function clearEx(id){S.ex[id]="cleared"; if(S.findings[id])S.findings[id].sev="X"; S.fresh=null; render();}
function reopen(id){S.ex[id]=null; if(S.findings[id])delete S.findings[id]; S.fresh=null; render();}
function rate(id,v){S.findings[id].sev=v; if(v==="X")S.ex[id]="cleared"; else S.ex[id]="raised"; S.fresh=null; render();}

function closeDay(){
  if(S.day>=5)return;
  S.day++; S.today=0; S.fresh=null;
  if(S.day===3&&S.run.vendor){ /* vendor already reviewed: NDA moot */ }
  else if(EVENTS[S.day]) S.event=S.day;
  if(S.day===5){
    const act=Object.entries(S.findings).filter(([,f])=>f.sev&&f.sev!=="X").sort((a,b)=>RANK[b[1].sev]-RANK[a[1].sev]).slice(0,3).map(([id])=>id);
    S.rbq=act; S.rbi=0; if(act.length) S.event="rb";
  }
  window.scrollTo({top:0}); render();
}
function choose(v){
  const e=EVENTS[S.event]; S.choices[e.key]=v;
  if(e.key==="committee"&&v==="brief") spend(Math.min(2,todayLeft()));
  S.event=null; render();
}
function rbKind(id,sevAtRebuttal){
  const st=S.truth[id];
  if(st==="clean"||st==="noisy") return "valid";
  if(RANK[sevAtRebuttal]>RANK[trueSev(id)]) return "over";
  return "spin";
}
function rbAnswer(v){
  const id=S.rbq[S.rbi]; const f=S.findings[id]; const before=f.sev; const kind=rbKind(id,before);
  const right={valid:"withdraw",over:"downgrade",spin:"hold"}[kind];
  if(v==="withdraw"){f.sev="X";S.ex[id]="cleared"}
  else if(v==="downgrade"){f.sev=before==="H"?"M":"L"}
  S.rbres[id]={before,choice:v,kind,correct:v===right};
  S.rbi++; if(S.rbi>=S.rbq.length) S.event=null;
  render();
}
function issue(){ if(!S.decision)return; S.phase="report"; window.scrollTo({top:0}); render(); }
function restart(same){ S=fresh(same?S.seed:undefined); window.scrollTo({top:0}); render(); }

/* ---------- scoring ---------- */
function grade(){
  const rows=IDS.map(id=>{
    const st=S.truth[id], ts=trueSev(id), f=S.findings[id];
    const call=f&&f.sev&&f.sev!=="X"?f.sev:null;
    let pts=0,w=0,fp=false;
    if(ts){ w=SEVW[ts]; if(call){const d=Math.abs(RANK[call]-RANK[ts]); pts=d===0?w:d===1?w/2:0;} }
    else if(call) fp=true;
    return {id,st,ts,call,pts,w,fp,tested:!!S.run[id],withdrawn:f&&f.sev==="X",unrated:f&&!f.sev};
  });
  const W=rows.reduce((a,r)=>a+r.w,0), P=rows.reduce((a,r)=>a+r.pts,0);
  const findPts=W?P/W*50:50;
  const fps=rows.filter(r=>r.fp).length;
  const precision=Math.max(0,10-3*fps);
  const rbN=Object.keys(S.rbres).length, rbC=Object.values(S.rbres).filter(x=>x.correct).length;
  const rebut=rbN?rbC/rbN*10:0;
  const anyH=rows.some(r=>r.ts==="H"), anyM=rows.some(r=>r.ts==="M");
  const right=anyH?"reject":anyM?"cond":"approve";
  const decTable=anyH?{reject:20,cond:6,approve:0}:anyM?{cond:20,reject:10,approve:4}:{approve:20,cond:14,reject:4};
  const dec=decTable[S.decision]||0;
  const conduct=(S.choices.pressure==="hold"?5:0)+(S.choices.committee==="brief"?5:0);
  const total=Math.round(findPts+precision+rebut+dec+conduct);
  return {rows,findPts,precision,fps,rebut,rbN,rbC,dec,right,conduct,total};
}

/* ---------- visual layer: charts and model map ---------- */
function hashStr(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
var RR=id=>rng((S.seed*7919+hashStr(id))>>>0);
var clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
var norm=a=>{const s=a.reduce((x,y)=>x+y,0);return a.map(x=>x/s)};
function gauss(r){let u=0;while(!u)u=r();const v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function Phi(x){const t=1/(1+0.3275911*Math.abs(x)/Math.SQRT2);const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x/2);return x>=0?(1+y)/2:(1-y)/2}
function PhiInv(p){const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],
 b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],
 c=[-0.007784894002430293,-0.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],
 d=[0.007784695709041462,0.3224671290700398,2.445134137142996,3.754408661907416];let q,r;
 if(p<0.02425){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
 if(p>0.97575){q=Math.sqrt(-2*Math.log(1-p));return-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
 q=p-0.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}
var tp=s=>` data-tip="${esc(s)}" tabindex="0"`;
var f1=x=>(+x).toFixed(1);
var svgOpen=(w,h,label)=>`<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">`;
var legend=items=>`<div class="legend">${items.map(([c,l])=>`<span><i class="sw ${c}"></i>${esc(l)}</span>`).join("")}</div>`;
var yGrid=(x0,x1,y,ticks,fmt)=>ticks.map(t=>`<line class="g" x1="${x0}" x2="${x1}" y1="${f1(y(t))}" y2="${f1(y(t))}"/><text class="ax" x="${x0-6}" y="${f1(y(t)+3.5)}" text-anchor="end">${fmt(t)}</text>`).join("");
function vbar(x,y0,w,h,cls,t){if(h<=.5)return"";const r=Math.min(4,h,w/2),y=y0-h;return `<path class="${cls}" d="M${f1(x)},${f1(y0)}V${f1(y+r)}Q${f1(x)},${f1(y)} ${f1(x+r)},${f1(y)}H${f1(x+w-r)}Q${f1(x+w)},${f1(y)} ${f1(x+w)},${f1(y+r)}V${f1(y0)}Z"${t?tp(t):""}/>`}
function hbar(x0,x1,yc,h,cls,t){const w=x1-x0;if(w<=.5)return"";const r=Math.min(4,w,h/2),y=yc-h/2;return `<path class="${cls}" d="M${f1(x0)},${f1(y)}H${f1(x1-r)}Q${f1(x1)},${f1(y)} ${f1(x1)},${f1(y+r)}V${f1(y+h-r)}Q${f1(x1)},${f1(y+h)} ${f1(x1-r)},${f1(y+h)}H${f1(x0)}Z"${t?tp(t):""}/>`}
var fig=(svg,leg,cap)=>`<figure class="fig">${leg||""}<div class="figbox">${svg}</div>${cap?`<figcaption>${esc(cap)}</figcaption>`:""}</figure>`;

function cDrift(id){
  const v=S.vals[id],N=10,W=520,H=196,ml=40,mr=8,mt=10,mb=30;
  const dev=norm([...Array(N)].map((_,i)=>Math.exp(-((i-5.3)**2)/(2*1.9**2))+.004));
  const psi=c=>c.reduce((a,ci,i)=>a+(ci-dev[i])*Math.log(ci/dev[i]),0);
  let cur=null,mean=3.7;
  for(let k=0;k<8&&!cur;k++){const tg=norm([...Array(N)].map((_,i)=>Math.exp(-((i-mean)**2)/(2*2.3**2))+.004));const mix=w=>dev.map((d,i)=>(1-w)*d+w*tg[i]);
    if(psi(mix(1))>=v){let lo=0,hi=1;for(let j=0;j<32;j++){const m=(lo+hi)/2;psi(mix(m))<v?lo=m:hi=m}cur=mix((lo+hi)/2)}else mean-=.5}
  cur=cur||dev;
  const mx=Math.max(...dev,...cur), top=Math.ceil(mx*100/5)*5/100+.025;
  const y=t=>H-mb-(t/top)*(H-mt-mb), bw=(W-ml-mr)/N, w=Math.min(16,(bw-10)/2);
  let g=yGrid(ml,W-mr,y,[0,.1,.2,.3].filter(t=>t<=top),t=>Math.round(t*100)+"%");
  for(let i=0;i<N;i++){const lo=300+55*i,cx=ml+i*bw+bw/2,lab=`${lo}–${lo+55}`;
    g+=vbar(cx-w-1,y(0),w,y(0)-y(dev[i]),"s1",`Score ${lab} · development ${(dev[i]*100).toFixed(1)}% · current ${(cur[i]*100).toFixed(1)}%`);
    g+=vbar(cx+1,y(0),w,y(0)-y(cur[i]),"s2",`Score ${lab} · development ${(dev[i]*100).toFixed(1)}% · current ${(cur[i]*100).toFixed(1)}%`);
    g+=`<text class="ax" x="${f1(cx)}" y="${H-mb+15}" text-anchor="middle">${lo}</text>`}
  g+=`<line class="base" x1="${ml}" x2="${W-mr}" y1="${y(0)}" y2="${y(0)}"/>`;
  return fig(svgOpen(W,H,"Score distribution, development versus current applicants")+g+`</svg>`,legend([["s1","Development 2019–21"],["s2","Current applicants"]]),"Share of applicants by score band (300–850)");
}
function cOverfit(id){
  const v=S.vals[id],r=RR(id),W=520,H=200,ml=40,mr=46,mt=24,mb=28,base=.795;
  const q=[...Array(20)].map((_,i)=>i<12?base+gauss(r)*.004:base-v*(.2+1.6*(i-12)/7)+gauss(r)*.003);
  const x=i=>ml+i*(W-ml-mr)/19, lo=.64,hi=.84, y=t=>H-mb-(t-lo)/(hi-lo)*(H-mt-mb);
  let g=`<rect class="oot" x="${f1(x(11.5))}" y="${mt-14}" width="${f1(W-mr-x(11.5)+8)}" height="${f1(H-mb-mt+14)}"/>`;
  g+=yGrid(ml,W-mr,y,[.65,.7,.75,.8],t=>t.toFixed(2));
  g+=`<text class="ax" x="${f1(x(5.5))}" y="${mt-4}" text-anchor="middle">DEVELOPMENT 2019–21</text><text class="ax" x="${f1(x(15.5))}" y="${mt-4}" text-anchor="middle">OUT OF TIME 2022–23</text>`;
  g+=`<line class="refl" x1="${f1(x(11.5))}" x2="${f1(x(19))}" y1="${f1(y(base))}" y2="${f1(y(base))}"/>`;
  g+=`<path class="l1" d="${q.map((a,i)=>(i?"L":"M")+f1(x(i))+","+f1(y(a))).join("")}"/>`;
  q.forEach((a,i)=>{const yr=2019+Math.floor(i/4);g+=`<circle class="s1 ring" cx="${f1(x(i))}" cy="${f1(y(a))}" r="${i===19?4.5:3}"${tp(`${yr} Q${i%4+1} · AUC ${a.toFixed(3)}`)}/>`});
  g+=`<line class="brk" x1="${f1(x(19)+12)}" x2="${f1(x(19)+12)}" y1="${f1(y(base))}" y2="${f1(y(q[19]))}"/><text class="lb" x="${f1(x(19)+16)}" y="${f1((y(base)+y(q[19]))/2+4)}">−${(base-q[19]).toFixed(2)}</text>`;
  [0,4,8,12,16].forEach(i=>g+=`<text class="ax" x="${f1(x(i))}" y="${H-mb+15}" text-anchor="middle">${2019+i/4}</text>`);
  return fig(svgOpen(W,H,"Quarterly AUC, development and out-of-time windows")+g+`</svg>`,"","Quarterly AUC. The flat line is the development average.");
}
function cCalib(id){
  const v=S.vals[id],r=RR(id),W=520,H=200,ml=40,mr=10,mt=16,mb=30;
  const pred=[...Array(10)].map((_,i)=>.5*Math.pow(36,i/9));
  const err=pred.map((_,i)=>i===9?v:i===8?v*.35:i===7?v*.12:gauss(r)*1.5);
  const obs=pred.map((p,i)=>p/(1-err[i]/100));
  const top=Math.ceil(Math.max(...obs)*1.12/5)*5, y=t=>H-mb-t/top*(H-mt-mb), bw=(W-ml-mr)/10;
  let g=yGrid(ml,W-mr,y,[0,5,10,15,20,25,30].filter(t=>t<=top),t=>t+"%");
  for(let i=0;i<10;i++){const cx=ml+i*bw+bw/2,t=`Decile ${i+1} · predicted ${pred[i].toFixed(1)}% · observed ${obs[i].toFixed(1)}%`;
    g+=`<line class="conn" x1="${f1(cx)}" x2="${f1(cx)}" y1="${f1(y(pred[i]))}" y2="${f1(y(obs[i]))}"/>`;
    g+=`<circle class="hollow" cx="${f1(cx)}" cy="${f1(y(pred[i]))}" r="4.5"${tp(t)}/><circle class="s2 ring" cx="${f1(cx)}" cy="${f1(y(obs[i]))}" r="4.5"${tp(t)}/>`;
    g+=`<text class="ax" x="${f1(cx)}" y="${H-mb+15}" text-anchor="middle">D${i+1}</text>`}
  const cx=ml+9.5*bw;g+=`<text class="lb" x="${f1(cx-10)}" y="${f1(y(obs[9])-2)}" text-anchor="end">${v}% under</text>`;
  return fig(svgOpen(W,H,"Predicted versus observed default rate by risk decile")+g+`</svg>`,legend([["hollow","Predicted default"],["s2","Observed default"]]),"12-month default rate by score decile, lowest to highest risk");
}
function cRoc(id){
  const v=S.vals[id],W=520,H=214,ml=40,mt=12,P=170;
  const xs=v=>ml+v*P, ys=v=>mt+P-v*P;
  const curve=auc=>{const a=Math.SQRT2*PhiInv(auc);let d="";for(let k=0;k<=40;k++){const f=k/40,t=f===0?0:f===1?1:Phi(a+PhiInv(f));d+=(k?"L":"M")+f1(xs(f))+","+f1(ys(t))}return d};
  let g=`<rect class="plotbg" x="${ml}" y="${mt}" width="${P}" height="${P}"/>`;
  [.25,.5,.75].forEach(t=>g+=`<line class="g" x1="${f1(xs(t))}" x2="${f1(xs(t))}" y1="${mt}" y2="${mt+P}"/><line class="g" x1="${ml}" x2="${ml+P}" y1="${f1(ys(t))}" y2="${f1(ys(t))}"/>`);
  g+=`<line class="diag" x1="${xs(0)}" y1="${ys(0)}" x2="${xs(1)}" y2="${ys(1)}"/>`;
  g+=`<path class="l1" d="${curve(.79)}"/><path class="l2" d="${curve(v)}"/>`;
  g+=`<text class="ax" x="${ml+P/2}" y="${mt+P+18}" text-anchor="middle">False positive rate</text><text class="ax" transform="translate(${ml-12},${mt+P/2}) rotate(-90)" text-anchor="middle">True positive rate</text>`;
  const rx=ml+P+48;
  g+=`<g${tp("All applicants · AUC 0.79")}><rect class="s1" x="${rx}" y="34" width="12" height="12" rx="2"/><text class="ax" x="${rx+20}" y="44">ALL APPLICANTS</text><text class="big" x="${rx+20}" y="78">0.79</text></g>`;
  g+=`<g${tp(`Thin-file applicants · AUC ${v.toFixed(2)}`)}><rect class="s2" x="${rx+150}" y="34" width="12" height="12" rx="2"/><text class="ax" x="${rx+170}" y="44">THIN-FILE · 11%</text><text class="big" x="${rx+170}" y="78">${v.toFixed(2)}</text></g>`;
  g+=`<text class="ax" x="${rx}" y="120">Policy floor 0.65 · target 0.72</text><text class="ax" x="${rx}" y="138">Diagonal = random ranking (0.50)</text>`;
  return fig(svgOpen(W,H,"ROC curves, all applicants versus thin-file")+g+`</svg>`,"","");
}
function cFair(id){
  const v=S.vals[id],r=RR(id),ref=.58+r()*.07;
  const rows=[["White, non-Hispanic",1],["Black",.91+r()*.06],["Hispanic",v],["Asian",.97+r()*.05]];
  const W=520,ml=148,mr=118,mt=22,rh=30,H=mt+rows.length*rh+20, x=t=>ml+t/.8*(W-ml-mr);
  let g=[0,.2,.4,.6].map(t=>`<line class="g" x1="${f1(x(t))}" x2="${f1(x(t))}" y1="${mt-6}" y2="${H-20}"/><text class="ax" x="${f1(x(t))}" y="${H-6}" text-anchor="middle">${t*100}%</text>`).join("");
  const thr=x(ref*.8);
  rows.forEach(([n,ratio],i)=>{const a=ref*ratio,yc=mt+i*rh+rh/2,cls=ratio<.8?"hiF":ratio<.9?"medF":"s1";
    g+=`<text class="ax tx" x="${ml-10}" y="${f1(yc+4)}" text-anchor="end">${esc(n)}</text>`;
    g+=hbar(ml,x(a),yc,16,cls,`${n} · approval ${(a*100).toFixed(1)}% · ratio ${ratio.toFixed(2)}`);
    g+=`<text class="ax tx" x="${f1(x(a)+8)}" y="${f1(yc+4)}">${(a*100).toFixed(0)}% · ${i?"AIR "+ratio.toFixed(2):"reference"}</text>`});
  g+=`<line class="thr" x1="${f1(thr)}" x2="${f1(thr)}" y1="${mt-12}" y2="${H-20}"/><text class="ax thrt" x="${f1(thr)}" y="${mt-14}" text-anchor="middle">FOUR-FIFTHS LINE</text>`;
  return fig(svgOpen(W,H,"Approval rate by group with four-fifths line")+g+`</svg>`,"","Approval rate by BISG-estimated group, applicants with similar bureau profiles");
}
var REASONS=["Debt-to-income","Revolving utilization","Recent delinquency","Short credit history"];
function cAan(id){
  const v=S.vals[id],r=RR(id),rows=10,cols=20,W=520,ml=54,mt=4,ch=14,cw=(W-ml-4)/cols,H=mt+rows*(ch+2)+22;
  let g="",flips=0;
  for(let i=0;i<rows;i++){const m=Math.floor(r()*4);g+=`<text class="ax" x="${ml-8}" y="${mt+i*(ch+2)+11}" text-anchor="end">File ${String(i+1).padStart(2,"0")}</text>`;
    for(let c=0;c<cols;c++){let k=m;if(c&&r()<v/100){k=(m+1+Math.floor(r()*3))%4;flips++}
      g+=`<rect class="s${k+1}" x="${f1(ml+c*cw)}" y="${mt+i*(ch+2)}" width="${f1(cw-2)}" height="${ch}" rx="2"${tp(`File ${i+1}, rerun ${c+1} · top reason: ${REASONS[k]}${k!==m?" (changed)":""}`)}/>`}}
  g+=`<text class="ax" x="${ml}" y="${H-6}">Rerun 1</text><text class="ax" x="${W-4}" y="${H-6}" text-anchor="end">Rerun 20</text>`;
  return fig(svgOpen(W,H,"Top decline reason across reruns for ten sample files")+g+`</svg>`,legend(REASONS.map((n,i)=>["s"+(i+1),n])),"First-ranked decline reason per rerun. A stable model shows solid rows.");
}
function cImpl(id){
  const v=S.vals[id],r=RR(id),z=zoneOf(id),W=520,H=244,ml=44,mr=12,mt=10,mb=32,lo=450,hi=850,cut=660;
  const px=s=>ml+(s-lo)/(hi-lo)*(W-ml-mr), py=s=>H-mb-(s-lo)/(hi-lo)*(H-mt-mb);
  let g=`<rect class="flipz" x="${f1(px(cut))}" y="${f1(py(cut))}" width="${f1(px(hi)-px(cut))}" height="${f1(py(lo)-py(cut))}"/><rect class="flipz" x="${f1(px(lo))}" y="${f1(py(hi))}" width="${f1(px(cut)-px(lo))}" height="${f1(py(cut)-py(hi))}"/>`;
  [500,600,700,800].forEach(t=>g+=`<line class="g" x1="${ml}" x2="${W-mr}" y1="${f1(py(t))}" y2="${f1(py(t))}"/><text class="ax" x="${ml-6}" y="${f1(py(t)+3.5)}" text-anchor="end">${t}</text><text class="ax" x="${f1(px(t))}" y="${H-mb+15}" text-anchor="middle">${t}</text>`);
  g+=`<line class="diag" x1="${px(lo)}" y1="${py(lo)}" x2="${px(hi)}" y2="${py(hi)}"/>`;
  g+=`<line class="cut" x1="${f1(px(cut))}" x2="${f1(px(cut))}" y1="${mt}" y2="${H-mb}"/><line class="cut" y1="${f1(py(cut))}" y2="${f1(py(cut))}" x1="${ml}" x2="${W-mr}"/>`;
  g+=`<text class="ax" x="${f1(px(cut)+5)}" y="${mt+10}">APPROVE ≥ ${cut}</text>`;
  let dots="";for(let i=0;i<340;i++){const s=Math.round(clamp(680+gauss(r)*62,lo+4,hi-4));dots+=`<circle class="dotm" cx="${f1(px(s))}" cy="${f1(py(s))}" r="2.6"/>`}
  const m=z==="breach"?Math.round(v/10000*340*1.6):z==="watch"?3:0;let mis="";
  for(let i=0;i<m;i++){const s=Math.round(i%2?cut+(r()-.5)*60:clamp(680+gauss(r)*60,lo+20,hi-20));const d=(z==="breach"?18+r()*36:2+r()*4)*(r()<.5?-1:1);const p=Math.round(clamp(s+d,lo+4,hi-4));
    mis+=`<circle class="${z==="breach"?"hiF":"medF"} ring" cx="${f1(px(s))}" cy="${f1(py(p))}" r="4.5"${tp(`Rebuild ${s} · production ${p} · difference ${p-s>0?"+":""}${p-s}${(s>=cut)!==(p>=cut)?" · decision flips":""}`)}/>`}
  g+=dots+mis+`<text class="ax" x="${(ml+W-mr)/2}" y="${H-4}" text-anchor="middle">Rebuild score</text><text class="ax" transform="translate(12,${(mt+H-mb)/2}) rotate(-90)" text-anchor="middle">Production score</text>`;
  return fig(svgOpen(W,H,"Rebuild versus production scores")+g+`</svg>`,legend([["dotm","Matching record"],[z==="breach"?"hiF":"medF","Mismatch"],["flipz","Decision would flip"]]),"Holdout sample. Points off the diagonal are reconciliation breaks.");
}
function cLeak(id){
  const v=S.vals[id],z=zoneOf(id);
  const rows=[["bureau_score",-24,0,"s1"],["revolving_util",-12,0,"s1"],["debt_to_income",-3,0,"s1"],["income_verified",-2,0,"s1"]];
  if(z==="watch")rows.push(["bureau_refresh_date",-1,.6,"medF"]);
  if(z==="breach")LEAKF.slice(0,v).forEach((f,i)=>rows.push([f,1+i*1.6,8+i*.8,"hiF"]));
  const W=520,ml=176,mr=14,mt=26,rh=22,H=mt+rows.length*rh+26,x=t=>ml+(t+24)/36*(W-ml-mr);
  let g=`<rect class="after" x="${f1(x(0))}" y="${mt-8}" width="${f1(x(12)-x(0))}" height="${rows.length*rh+8}"/>`;
  g+=`<text class="ax" x="${f1(x(6))}" y="${mt-12}" text-anchor="middle">KNOWN ONLY AFTER</text>`;
  [-24,-12,12].forEach(t=>g+=`<line class="g" x1="${f1(x(t))}" x2="${f1(x(t))}" y1="${mt-8}" y2="${mt+rows.length*rh}"/><text class="ax" x="${f1(x(t))}" y="${H-8}" text-anchor="middle">${t>0?"+":"−"}${Math.abs(t)} mo</text>`);
  rows.forEach(([n,a,b,c],i)=>{const yc=mt+i*rh+rh/2;
    g+=`<text class="ax tx ${c==="hiF"?"bad":""}" x="${ml-10}" y="${f1(yc+4)}" text-anchor="end">${n}</text>`;
    g+=hbar(x(a),x(b),yc,10,c,`${n} · available ${a<0?Math.abs(a)+" mo before":"+"+a.toFixed(1)+" mo after"} the decision`)});
  g+=`<line class="dec" x1="${f1(x(0))}" x2="${f1(x(0))}" y1="${mt-18}" y2="${mt+rows.length*rh+4}"/><text class="lb" x="${f1(x(0))}" y="${H-8}" text-anchor="middle">Decision</text>`;
  return fig(svgOpen(W,H,"When each feature becomes known relative to the credit decision")+g+`</svg>`,"","Sample of features. Bars show when each value exists relative to the decision.");
}
function tiles(names,bad,label){return `<figure class="fig"><div class="tiles" role="list" aria-label="${esc(label)}">${names.map(n=>`<div role="listitem" class="tile ${bad.includes(n)?"miss":"have"}"><i>${bad.includes(n)?"✕":"✓"}</i><span>${esc(n)}</span></div>`).join("")}</div></figure>`}
var VEND=["Methodology","Change management","Development data","Ongoing monitoring","Performance testing","Limitations"];
var MONS=["AUC","Approval rate","Default vs forecast","Override rate","Data quality","Reason stability","PSI drift","Adverse impact ratio"];
var DOCS=["Purpose","Data sources","Methodology","Feature design","Performance","Benchmarking","Sensitivity","Implementation","Governance","Assumptions","Ongoing monitoring","Approved use","Alternatives considered","Limitations"];
var tVendor=id=>tiles(VEND,VEND.slice(S.vals[id]),"Vendor evidence checklist");
var tMon=id=>tiles(MONS,MONS.slice(S.vals[id]),"Metrics with trigger thresholds");
var tDocs=id=>tiles(DOCS,DOCS.slice(DOCS.length-S.vals[id]),"Required documentation sections");
var CHART={drift:cDrift,overfit:cOverfit,calib:cCalib,segment:cRoc,fair:cFair,aan:cAan,impl:cImpl,leak:cLeak,vendor:tVendor,monitor:tMon,docs:tDocs};

/* model map */
var NODES=[
 {k:"data",l:"Application data",s:"Feature timing",t:["leak"],x:16,y:24,w:196,h:60},
 {k:"bureau",l:"Credit bureau files",s:"Source feed",t:[],x:16,y:196,w:196,h:60},
 {k:"vendor",l:"BureauVec v2",s:"Vendor embedding · 48 features",t:["vendor"],x:250,y:196,w:178,h:60},
 {k:"features",l:"Feature pipeline",s:"212 features · stability",t:["drift"],x:468,y:110,w:168,h:60},
 {k:"model",l:"ATLAS-7 · XGBoost",s:"Out-of-time · thin-file",t:["overfit","segment"],x:676,y:100,w:196,h:80,main:1},
 {k:"prod",l:"Production scoring",s:"Replication",t:["impl"],x:912,y:110,w:150,h:60},
 {k:"pd",l:"PD estimates",s:"Calibration",t:["calib"],x:1094,y:24,w:150,h:60},
 {k:"decision",l:"Approve / decline",s:"Fair lending",t:["fair"],x:1094,y:110,w:150,h:60},
 {k:"notice",l:"Decline notices",s:"Reason codes",t:["aan"],x:1094,y:196,w:150,h:60},
 {k:"monitor",l:"Monitoring",s:"Triggers & owners",t:["monitor"],x:676,y:226,w:196,h:54},
 {k:"docs",l:"Model documentation",s:"140-page dossier",t:["docs"],x:468,y:226,w:168,h:54}];
var EDGES=["M212,54 C330,54 350,140 468,140","M212,226 H250","M428,226 C452,226 446,140 468,140","M636,140 H676","M872,140 H912","M1062,130 C1080,130 1076,54 1094,54","M1169,84 V110","M1169,170 V196","M1094,160 C1010,256 960,253 872,253","M774,226 V180","M636,253 C658,253 660,200 690,180"];
var SEVORD={H:3,M:2,L:1};
function nodeState(n){
  if(!n.t.length)return{c:"passive",b:""};
  if(S.phase==="report"){let worst=null;n.t.forEach(id=>{const s=trueSev(id);if(s&&(!worst||SEVORD[s]>SEVORD[worst]))worst=s});
    const calls=n.t.map(id=>{const f=S.findings[id];return f&&f.sev&&f.sev!=="X"?f.sev:null}).filter(Boolean);
    const you=calls.length?calls.sort((a,b)=>SEVORD[b]-SEVORD[a])[0]:null;
    return{c:worst||"clear",b:worst||"✓",sub:`Truth ${worst||"clean"} · you ${you||(n.t.some(id=>S.run[id])?"none":"untested")}`,miss:worst&&you!==worst}}
  let worst=null,run=false,open=false;
  n.t.forEach(id=>{if(S.run[id])run=true;const f=S.findings[id];if(f&&f.sev&&f.sev!=="X"&&(!worst||SEVORD[f.sev]>SEVORD[worst]))worst=f.sev;if(S.run[id]&&!S.ex[id])open=true;if(f&&!f.sev)open=true});
  if(worst)return{c:worst,b:worst};if(open)return{c:"review",b:"?"};if(run)return{c:"clear",b:"✓"};return{c:"idle",b:""};
}
var MAP_INTRO=true;
function modelMap(){
  const report=S.phase==="report";
  let g=`<defs><marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arw" d="M0,0 L10,5 L0,10 z"/></marker></defs>`;
  g+=EDGES.map(d=>`<path class="edge" d="${d}" marker-end="url(#arw)"/><path class="edge-flow" d="${d}"/>`).join("");
  g+=NODES.map((n,i)=>{const st=nodeState(n);const cx=n.x+n.w-2,cy=n.y+2;
    return `<g class="node ${st.c}${n.main?" main":""}" style="--i:${i}" ${n.t.length?`data-node="${n.t[0]}" role="button" tabindex="0" aria-label="${esc(n.l)}: ${st.c}"`:""}>
      <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="3"/>
      <text class="nl" x="${n.x+12}" y="${n.y+(n.main?32:26)}">${esc(n.l)}</text>
      <text class="ns" x="${n.x+12}" y="${n.y+(n.main?52:44)}">${esc(report&&st.sub?st.sub:n.s)}</text>
      ${st.b?`${["H","M","L"].includes(st.c)&&!report?`<circle class="pulse" cx="${cx}" cy="${cy}" r="9"/>`:""}<circle class="badge" cx="${cx}" cy="${cy}" r="9"/><text class="bt" x="${cx}" y="${cy+4}" text-anchor="middle">${st.b}</text>`:""}
      ${report&&st.miss?`<rect class="missring" x="${n.x-4}" y="${n.y-4}" width="${n.w+8}" height="${n.h+8}" rx="5"/>`:""}</g>`}).join("");
  const intro=MAP_INTRO?" intro":""; MAP_INTRO=false;
  const leg=report
    ?[["H","High defect"],["M","Medium"],["L","Low"],["clear","Clean"],["missk","You missed or misrated"]]
    :[["idle","Not tested"],["review","Awaiting your call"],["clear","No exception"],["H","High"],["M","Medium"],["L","Low"]];
  return `<section class="mapwrap"><div class="maphead"><div><span class="eyebrow">${report?"Where the defects really were":"System under review"}</span><h2>Model map</h2></div>
    <div class="mlegend">${leg.map(([c,l])=>`<span><i class="mk ${c}"></i>${l}</span>`).join("")}</div></div>
    <div class="mapscroll"><svg class="map${intro}" viewBox="-6 -10 1268 300" role="img" aria-label="ATLAS-7 system map with review status">${g}</svg></div>
    ${report?"":`<p class="maphint">Select a component to jump to its test.<span class="swipe"> Swipe sideways to see the whole system.</span></p>`}</section>`;
}

function strip(id){
  const m=D[id].m, v=S.vals[id];
  const pos=x=>{const t=Math.min(Math.max(x,m.min),m.max);return m.sqrt?Math.sqrt(t-m.min)/Math.sqrt(m.max-m.min)*100:(t-m.min)/(m.max-m.min)*100};
  const bands=m.bands.map(([a,b,z])=>`<span class="${z}" style="left:${pos(a)}%;width:${pos(b)-pos(a)}%"></span>`).join("");
  return `<div class="strip"><div class="track" role="img" aria-label="${esc(m.label)} ${esc(m.fmt(v))}, ${zoneOf(id)} zone">${bands}<span class="pin" style="left:${Math.min(99.4,Math.max(.6,pos(v)))}%"></span></div><div class="cap">${esc(m.cap)}</div></div>`;
}

var GAME="app/index.html";

/* ---------- hero: live map demo ---------- */
S=fresh(1);
var DEMO=[
 ["Mon","Opening validation file VR-2026-114",null,()=>{}],
 ["Mon","Feature timing review · 0 post-decision features","ok",()=>{S.run.leak=1;S.ex.leak="cleared"}],
 ["Tue","Disparate impact analysis · adverse impact ratio 0.84","M",()=>{S.run.fair=2;S.ex.fair="raised";S.findings.fair={sev:"M",day:2}}],
 ["Wed","Reason-code stability · top reason flips in 31% of reruns","H",()=>{S.run.aan=3;S.ex.aan="raised";S.findings.aan={sev:"H",day:3}}],
 ["Wed","Population stability index 0.31 · breach","M",()=>{S.run.drift=3;S.ex.drift="raised";S.findings.drift={sev:"M",day:3}}],
 ["Thu","Independent replication · 269 of 10,000 scores differ","H",()=>{S.run.impl=4;S.ex.impl="raised";S.findings.impl={sev:"H",day:4}}],
 ["Thu","Monitoring plan · 8 of 8 metrics have triggers","ok",()=>{S.run.monitor=4;S.ex.monitor="cleared"}],
 ["Fri","Developer evidence holds up · disparate impact withdrawn","ok",()=>{S.findings.fair.sev="X";S.ex.fair="cleared"}],
 ["Fri","Opinion issued · return to developer","H",()=>{}]
];
var step=0,timer=null,playing=true;
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
function drawHero(){document.getElementById("hero-map").innerHTML=modelMap().replace(/ data-node="[^"]*" role="button" tabindex="0"/g,"").replace(/<p class="maphint">[\s\S]*?<\/p>/,"<p class=\"maphint\">Illustrative review sequence · The active case starts in the validation room.</p>")}
function showStep(i){const [d,m,sev]=DEMO[i];
  document.getElementById("tk-day").textContent=d;document.getElementById("tk-msg").textContent=m;
  document.getElementById("tk-sev").innerHTML=sev?`<span class="sev ${sev}">${sev==="ok"?"Cleared":sev==="H"?"High":"Medium"}</span>`:"";}
function advance(){
  step++; if(step>=DEMO.length){step=0;const keep=S.seed;S=fresh(keep);}
  DEMO[step][3](); drawHero(); showStep(step);
}
function play(){clearInterval(timer);timer=setInterval(advance,2200);playing=true;document.getElementById("tk-ctrl").textContent="Pause"}
function pause(){clearInterval(timer);playing=false;document.getElementById("tk-ctrl").textContent="Play"}
document.getElementById("tk-ctrl").addEventListener("click",()=>playing?pause():play());
if(reduce){DEMO.forEach(s=>s[3]());step=DEMO.length-1;drawHero();showStep(step);pause()} else {drawHero();showStep(0);play()}
document.addEventListener("visibilitychange",()=>{if(document.hidden)clearInterval(timer);else if(playing)play()});

/* ---------- exhibit viewer ---------- */
var VT=["drift","aan","fair","segment"];
var VNAME={drift:"Population stability",aan:"Reason codes",fair:"Fair lending",segment:"Thin-file ROC"};
var vt="aan",vz="watch";
function readingVal(id,z){const m=D[id].m,r=m.r[z==="breach"?"severe":z==="ok"?"clean":"border"];let v=(r[0]+r[1])/2;return m.int?Math.round(v):+v.toFixed(m.dp)}
function renderViewer(){
  document.getElementById("v-tabs").innerHTML=VT.map(id=>`<button type="button" data-vt="${id}" aria-pressed="${id===vt}">${VNAME[id]}</button>`).join("");
  document.getElementById("v-reads").innerHTML=[["ok","Within tolerance"],["watch","Watch band"],["breach","Breach"]].map(([z,l])=>{const v=readingVal(vt,z);
    return `<button type="button" data-vz="${z}" data-z="${z}" aria-pressed="${z===vz}"><small>${l}</small><span class="mono">${esc(D[vt].m.fmt(v))}</span></button>`}).join("");
  S.vals[vt]=readingVal(vt,vz);
  const d=D[vt],v=S.vals[vt],z=zoneOf(vt),zl={ok:"Within tolerance",watch:"Watch band",breach:"Breach"}[z];
  document.getElementById("v-body").innerHTML=`<span class="eyebrow">${esc(d.el)} · ${esc(d.hook)}</span><h3>${esc(d.test)}</h3>${CHART[vt](vt)}
    <div class="readout"><span class="val">${esc(d.m.fmt(v))}</span><span class="lbl">${esc(d.m.label)}</span><span class="zone ${z}">${zl}</span></div>${strip(vt)}<p class="narr">${esc(d.text[z](v))}</p>`;
}
document.getElementById("v-tabs").addEventListener("click",e=>{const b=e.target.closest("[data-vt]");if(b){vt=b.dataset.vt;renderViewer()}});
document.getElementById("v-reads").addEventListener("click",e=>{const b=e.target.closest("[data-vz]");if(b){vz=b.dataset.vz;renderViewer()}});
renderViewer();

/* ---------- case dealer ---------- */
var deckIds=["interview",...ORDER.slice(1)];
function deal(seed,animate){
  const c=buildCase(seed),code=codeFrom(seed);
  const cnt={severe:0,mild:0,noisy:0,clean:0};Object.values(c.truth).forEach(s=>cnt[s]++);
  const set=()=>{document.getElementById("d-code").textContent=code;document.getElementById("f-code").textContent=code;
    document.getElementById("d-sv").textContent=cnt.severe;document.getElementById("d-mi").textContent=cnt.mild;document.getElementById("d-fa").textContent=cnt.noisy;document.getElementById("d-cl").textContent=cnt.clean;
    document.querySelectorAll("[data-game-case]").forEach(a=>a.href=GAME+"#case-"+code);};
  const deck=document.getElementById("deck");
  if(!animate||reduce){set();return}
  deck.classList.add("flip");setTimeout(()=>{set();deck.classList.remove("flip")},650);
}
document.getElementById("deck").innerHTML=deckIds.map((id,i)=>{const t=id==="interview"?{test:"Developer interview",el:"Leads, not evidence"}:D[id];
  return `<div class="card ${id==="interview"?"interview":""}" style="--i:${i}"><div class="f"><em>${esc(t.el)}</em><b>${esc(t.test)}</b><span class="q">${id==="interview"?"“”":"?"}</span></div><div class="b" aria-hidden="true"></div></div>`}).join("");
var dealSeed=seedFrom("K7QM");
deal(dealSeed,false);
document.getElementById("d-deal").addEventListener("click",()=>{dealSeed=newSeed();deal(dealSeed,true)});

/* ---------- rebuttal ---------- */
var RB=[{k:"spin",txt:D.fair.rb.spin,why:"This is an assertion about intent. Disparate impact is measured in outcomes, and the reply offers none. Hold the finding."},
          {k:"valid",txt:D.fair.rb.valid,why:"This reply attaches analysis you can rerun. If the controlled ratio holds at 0.97, the raw gap was credit factors. Withdraw."}];
function renderRb(ans){
  document.getElementById("rbgrid").innerHTML=RB.map((r,i)=>{const st=ans&&ans.i===i?((ans.c==="withdraw")===(r.k==="valid")?"right":"wrong"):"";
    return `<article class="rbcard ${st}"><span class="who">Reply ${i?"B":"A"} · Priya Raman, Lead Model Developer</span><blockquote>“${esc(r.txt)}”</blockquote>
      <div class="acts"><button class="btn" data-rbi="${i}" data-rbc="hold" type="button">Hold the finding</button><button class="btn ghost" data-rbi="${i}" data-rbc="withdraw" type="button">Withdraw it</button></div>
      ${st?`<p class="verdict2"><b style="color:var(--${st==="right"?"ok":"hi"})">${st==="right"?"Right call.":"Not this time."}</b> ${esc(r.why)}</p>`:""}</article>`}).join("");
}
document.getElementById("rbgrid").addEventListener("click",e=>{const b=e.target.closest("[data-rbi]");if(b)renderRb({i:+b.dataset.rbi,c:b.dataset.rbc})});
renderRb(null);

/* Tooltip handlers are in shared.js */
