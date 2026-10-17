/* glyph() is provided by shared.js */
(()=>{
 const cards=[...document.querySelectorAll('#deck .card')];cards.forEach((card,i)=>{const icon=card.querySelector('.q');if(icon)icon.innerHTML=glyph(deckIds[i]);const f=card.querySelector('.f');if(f){const n=document.createElement('span');n.className='card-number';n.textContent=String(i+1).padStart(2,'0');f.append(n)}});
 document.querySelectorAll('.week5 .wd').forEach((day,i)=>{const art=document.createElement('div');art.className='day-signature';art.setAttribute('aria-hidden','true');const size=18,paths=[];for(let k=0;k<8;k++){const h=12+((k*7+i*11)%31);paths.push('<rect x="'+(k*7)+'" y="'+(48-h)+'" width="3" height="'+h+'" rx="1"/>')}art.innerHTML='<svg viewBox="0 0 60 52">'+paths.join('')+'</svg>';day.append(art)});
})();
