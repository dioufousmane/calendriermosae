/** Visite locale : aucune donnée envoyée, aucune modification du planning. */
export function createWelcomeTour(){
 const key='mosae-v2-welcome-hidden';
 const read=()=>{try{return localStorage.getItem(key)==='true';}catch{return false;}};
 const persist=value=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
 const steps=[
  {target:'.heading',title:'Bienvenue dans votre planning MOSAE',text:'Prenez une minute pour découvrir les repères utiles. Vous pouvez quitter cette visite à tout moment et la retrouver dans le menu.',hint:'Votre planning rassemble les cours de l’ESGT et de l’Université du Mans.'},
  {target:'.filters',title:'Retrouvez les cours qui vous concernent',text:'Choisissez votre promotion, puis recherchez un cours, un enseignant ou une salle. « Plus de filtres » permet d’affiner votre sélection.',hint:'« Réinitialiser » retire les filtres et réactive les deux sources.'},
  {target:'.calendar-toolbar',title:'Naviguez à votre rythme',text:'Les flèches changent de période. « Aujourd’hui » vous ramène à la date du jour. Passez de la semaine au mois, à l’agenda ou aux cartes avec « Liste ».',hint:'Sur téléphone, l’agenda facilite la lecture. Ouvrez un cours pour consulter ses détails.'},
  {target:'.side-section',sidebar:true,title:'Identifiez les cours mutualisés',text:'Activez ou masquez les calendriers ESGT et Université. Cochez « Cours mutualisés » pour afficher uniquement les séances partagées.',hint:'Le badge 🟣 MUTUALISÉ indique plusieurs publics. La fiche du cours précise lesquels et explique la détection.'},
  {target:'#sidebar nav',sidebar:true,title:'Gardez une vue d’ensemble',text:'Le tableau de bord présente les repères du jour. « Salles & charges » récapitule les volumes. « Points de vigilance » signale les chevauchements à vérifier.',hint:'Les indicateurs de période suivent vos filtres. Un point de vigilance demande une vérification humaine.'},
  {target:'#export',title:'Emportez votre emploi du temps',text:'« Exporter » permet de télécharger la sélection en ICS ou de l’enregistrer en PDF depuis l’impression. Dans le menu, « Abonnement calendrier » propose un suivi des mises à jour.',hint:'Vous êtes prêt ! La visite reste accessible via « Tutoriel de bienvenue » dans le menu.'}
 ];
 const dialog=document.createElement('dialog');dialog.id='welcome-tour';dialog.setAttribute('aria-labelledby','welcome-title');dialog.setAttribute('aria-describedby','welcome-description');
 dialog.innerHTML='<button class="welcome-close" aria-label="Fermer le tutoriel">×</button><p class="welcome-step" aria-live="polite"></p><div class="welcome-progress" aria-hidden="true"></div><h2 id="welcome-title" tabindex="-1"></h2><p id="welcome-description"></p><p class="welcome-hint"></p><label class="welcome-choice"><input type="checkbox" id="welcome-hide"> Ne plus afficher ce tutoriel au démarrage</label><p class="welcome-storage" role="status"></p><div class="welcome-actions"><button id="welcome-skip">Passer la visite</button><div><button id="welcome-back">Précédent</button><button id="welcome-next" class="primary">Suivant →</button></div></div>';
 document.body.append(dialog);
 const find=s=>dialog.querySelector(s),sidebar=document.querySelector('#sidebar'),menu=document.querySelector('#menu');
 let index=0,attempted=false,highlighted=null,returnFocus=null,savedScroll=0,savedSidebar=false;
 function showStep(){
  if(highlighted)highlighted.classList.remove('welcome-target');
  const step=steps[index];
  if(innerWidth<=800){sidebar.classList.toggle('open',!!step.sidebar);menu.setAttribute('aria-expanded',String(!!step.sidebar));}
  highlighted=document.querySelector(step.target);highlighted?.classList.add('welcome-target');
  highlighted?.scrollIntoView({behavior:'instant',block:'center'});
  // Keep the target and explanation on opposite halves of the viewport where possible.
  const box=highlighted?.getBoundingClientRect();dialog.classList.toggle('welcome-at-top',!!box&&box.top>innerHeight/2);
  find('.welcome-step').textContent=`DÉCOUVRIR MOSAE · ${index+1} / ${steps.length}`;
  find('.welcome-progress').replaceChildren(...steps.map((_,i)=>{const segment=document.createElement('span');segment.classList.toggle('complete',i<=index);return segment;}));
  find('#welcome-title').textContent=step.title;find('#welcome-description').textContent=step.text;find('.welcome-hint').textContent=step.hint;
  find('#welcome-back').hidden=index===0;find('#welcome-next').textContent=index===steps.length-1?'Ouvrir mon planning':'Suivant →';find('#welcome-skip').hidden=index===steps.length-1;
  find('#welcome-title').focus({preventScroll:true});dialog.scrollTop=0;
 }
 function finish(){dialog.close();}
 dialog.addEventListener('close',()=>{highlighted?.classList.remove('welcome-target');sidebar.classList.toggle('open',savedSidebar);menu.setAttribute('aria-expanded',String(savedSidebar));window.scrollTo({top:savedScroll,behavior:'instant'});if(returnFocus instanceof HTMLElement)returnFocus.focus({preventScroll:true});});
 find('.welcome-close').onclick=finish;find('#welcome-skip').onclick=finish;
 find('#welcome-back').onclick=()=>{if(index>0){index--;showStep();}};
 find('#welcome-next').onclick=()=>{if(index===steps.length-1)finish();else{index++;showStep();}};
 find('#welcome-hide').onchange=e=>{find('.welcome-storage').textContent=persist(e.target.checked)?'':'Votre navigateur ne permet pas de mémoriser ce choix. Le tutoriel pourra réapparaître à la prochaine visite.';};
 // Native dialog handles Escape and keeps keyboard focus within the tutorial.
 function start(){if(dialog.open||document.querySelector('#dialog')?.open)return;returnFocus=document.activeElement;savedScroll=window.scrollY;savedSidebar=sidebar.classList.contains('open');index=0;find('#welcome-hide').checked=read();find('.welcome-storage').textContent='';dialog.showModal();showStep();}
 document.querySelector('#tutorial').onclick=start;
 return{autoStart(){if(attempted)return;attempted=true;if(window.self===window.top&&!read())start();}};
}
