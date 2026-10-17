/* Shared utilities for ATLAS-7: SVG glyphs, HTML escaping, tooltip handlers. */
const GLYPH_PATHS={leak:'M4 7h16M4 17h16M8 4v6m8 4v6M8 10l8 4',fair:'M12 3v17M4 7h16M6 7l-4 7h8L6 7Zm12 0-4 7h8l-4-7ZM8 21h8',aan:'M4 4h16v12H9l-5 4V4Zm4 4h8m-8 4h5',impl:'M3 6h7v12H3V6Zm11 0h7v12h-7V6Zm-4 6h4',drift:'M3 18l4-8 4 4 4-10 6 5M3 21h18',overfit:'M3 18c4-18 10-18 18 0M3 18c5-3 10-12 18-10',calib:'M4 20 20 4M4 17h4m0-4h4m0-4h4m0-4h4',segment:'M12 3v9h9M9 4a9 9 0 1 0 11 11H9V4Z',vendor:'m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5',monitor:'M3 7h18v13H3V7Zm4-4v4m10-4v4M7 13h2l2-3 2 6 2-3h2',docs:'M6 3h9l4 4v14H6V3Zm9 0v5h4M9 12h7m-7 4h5',interview:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-3a6 6 0 0 1 12 0v3m1-16h7m-7 4h5'};
function glyph(id){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${GLYPH_PATHS[id]||GLYPH_PATHS.docs}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}

function showTip(el,x,y){const t=document.getElementById("tip");t.textContent=el.getAttribute("data-tip");t.hidden=false;const w=t.offsetWidth,h=t.offsetHeight;
  t.style.left=Math.min(window.innerWidth-w-8,Math.max(8,x+14))+"px";t.style.top=(y-h-12<8?y+18:y-h-12)+"px"}
document.addEventListener("pointermove",e=>{const el=e.target.closest&&e.target.closest("[data-tip]");if(el)showTip(el,e.clientX,e.clientY);else document.getElementById("tip").hidden=true});
document.addEventListener("focusin",e=>{const el=e.target.closest&&e.target.closest("[data-tip]");if(el){const r=el.getBoundingClientRect();showTip(el,r.left+r.width/2,r.top)}});
document.addEventListener("focusout",()=>{document.getElementById("tip").hidden=true});
