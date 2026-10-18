var toastTimer;
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4200)}
function showDialog(markup){const d=document.getElementById('command-dialog');d.innerHTML=markup;d.showModal()}
function requestReset(same){
 showDialog(`<span class="eyebrow">${same?'RESTART INVESTIGATION':'OPEN A NEW CASE'}</span><h2>${same?'A fresh look at the same evidence.':'A different file. A new investigation.'}</h2><p>${same?'This resets your current findings and returns case '+S.code+' to Monday.':'This replaces the current review with a newly generated case.'} Your current review will be replaced.</p><div class="dialog-actions"><button class="btn ghost" data-dismiss>Keep working</button><button class="btn" data-confirm-reset="${same?'same':'new'}">${same?'Reset case':'New case'} ↗</button></div>`);
}
function fieldGuide(){
 showDialog(`<button class="dialog-x" data-dismiss aria-label="Close field guide">×</button><span class="eyebrow">THE VALIDATOR'S FIELD GUIDE</span><h2>Five days.<br>One defensible decision.</h2><p class="guide-note">Start in the Model observatory to select a component. Use the Investigation desk for exhibits and findings. Your Decision journal records each review action. These tabs switch views directly.</p><ol class="guide-list"><li><b>Choose your next test.</b><p>Use the test plan to spend your 40-hour budget. You can use up to 9 hours each day. The developer interview provides leads, not proof.</p></li><li><b>Read the evidence.</b><p>Compare the chart, measured result and threshold strip. A watch-band result may be a mild defect or a false alarm. A follow-up can resolve the ambiguity.</p></li><li><b>Make and rate a finding.</b><p>Raise an exception or clear the exhibit. Rate findings High, Medium or Low in the register. A raised but unrated finding is omitted from the final memo.</p></li><li><b>Close the day.</b><p>Unused hours stay in your overall budget, but each day has its own 9-hour limit. Respond to business pressure, vendor offers and escalation decisions.</p></li><li><b>Defend your decision.</b><p>On Friday, answer challenges to up to three findings. Issue your opinion to reveal the score, hidden defects, consequences and committee memo.</p></li></ol><p class="guide-note">Score: findings 50 · precision 10 · challenges 10 · opinion 20 · conduct 10. All scenario data is fictional.</p><button class="btn" data-dismiss>Return to the investigation →</button>`);
}
function downloadMemo(){const blob=new Blob([memoText()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`ATLAS-7-Case-${S.code}-Committee-Memo.txt`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Committee memo downloaded.')}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;const ds=b.dataset;
 if('help'in ds)fieldGuide();
 else if('reset'in ds)requestReset(true);
 else if('new'in ds)requestReset(false);
 else if('dismiss'in ds)document.getElementById('command-dialog').close();
 else if(ds.confirmReset){document.getElementById('command-dialog').close();restart(ds.confirmReset==='same')}
 else if(ds.select){openEvidence(ds.select)}
 else if(ds.filter){U.filter=ds.filter;render()}
 else if(ds.tab){U.tab=ds.tab;render()}
 else if('themeToggle'in ds){const theme=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=theme;try{localStorage.setItem('atlas7-theme',theme)}catch(_){}}
 else if('download'in ds)downloadMemo();
 else if('print'in ds)window.print();
});
document.addEventListener('keydown',e=>{const modal=document.querySelector('.scrim');if(!modal||e.key!=='Tab')return;const all=[...modal.querySelectorAll('button:not(:disabled),[href],input:not(:disabled)')];const first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
