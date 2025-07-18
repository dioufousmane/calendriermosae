if (typeof events === 'undefined') var events = {};

Promise.all([
  fetch("esgt_events2.json").then(res => res.json()),
  fetch("univ_events2.json").then(res => res.json())
])
.then(([esgtEvents, univEvents]) => {
  events['ESGT2'] = esgtEvents;
  events['UNIV2'] = univEvents;
  createCalendarGrid(); // Affiche le calendrier une fois les données chargées
})