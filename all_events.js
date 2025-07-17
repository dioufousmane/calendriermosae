if (typeof events === 'undefined') var events = {};

Promise.all([
  fetch('esgt_events.md').then(res => res.text()),
  fetch('univ_events.md').then(res => res.text())
])
.then(([esgtText, univText]) => {
  events['ESGT'] = eval('[' + esgtText + ']');
  events['UNIV'] = eval('[' + univText + ']');
  createCalendarGrid(); // relancer le rendu après chargement
});


if (typeof events === 'undefined') var events = {};

Promise.all([
  fetch('esgt_events.json').then(res => res.json()),
  fetch('univ_events.json').then(res => res.json())
])
.then(([esgt, univ]) => {
  events['ESGT'] = esgt;
  events['UNIV'] = univ;
  createCalendarGrid();
});
