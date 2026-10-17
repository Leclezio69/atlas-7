(()=>{
  try{const s=JSON.parse(localStorage.getItem('atlas7-command-save')||'null');if(s&&s.v===2&&/^[A-Z0-9]{4}$/.test(s.code)&&s.spent>0){const slot=document.getElementById('resume-slot');const a=document.createElement('a');a.href='app/index.html';a.textContent=s.phase==='report'?`View your debrief · Case ${s.code}`:`Continue case ${s.code} · Day ${s.day} · ${40-s.spent} hours left`;slot.append(a)}}catch(_){}
  document.addEventListener('click',e=>{const game=e.target.closest('[data-game-case]');if(game){try{sessionStorage.setItem('atlas7-requested-case',game.hash.slice(6))}catch(_){}}});
})();
