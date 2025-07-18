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
