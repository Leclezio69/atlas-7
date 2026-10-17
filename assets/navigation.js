// Apply the selected feature before the page is painted. Real URLs keep
// reload, browser Back, modified clicks and file:// use native and predictable.
(()=>{
 const labels={week:'The week',evidence:'Evidence',cases:'Cases',outputs:'Scoring'};
 const requested=new URLSearchParams(location.search).get('view');
 if(!Object.prototype.hasOwnProperty.call(labels,requested))return;
 document.documentElement.dataset.feature=requested;
 document.title=labels[requested]+' · ATLAS-7';
 document.addEventListener('DOMContentLoaded',()=>{
  const label=document.querySelector('[data-feature-name]');if(label)label.textContent=labels[requested];
  document.querySelectorAll('.top nav a').forEach(link=>{
   const selected=new URL(link.href,location.href).searchParams.get('view')===requested;
   if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
  // Hidden overview animation does not need to run in a feature view.
  if(typeof pause==='function')pause();
 });
})();
