import {teachingDuration} from './teaching-hours.mjs';
import {dayAdd} from '../../js/data.mjs';
// Fin exclusive : une séance n'est comptée qu'à sa date de début.
export function cumulativeVolumes(events, end) {
  const last = dayAdd(end, -1);
  const year = Number(last.slice(0, 4)) - (last.slice(5, 7) < '09' ? 1 : 0);
  const start = `${year}-09-01`;
  const courses = events.filter(e => !e.reportOf && !e.allDay && !e.invalid && Number.isFinite(e.hours) && e.hours > 0 && e.date >= start && e.date < end);
  const volumes = {ESGT:{specific:0,shared:0}, UNIV:{specific:0,shared:0}};
  for (const e of courses) for (const source of ['ESGT','UNIV']) {
    if ((e.accountingSource ? e.accountingSource === source : e.sources.includes(source))) volumes[source][e.shared ? 'shared' : 'specific'] += teachingDuration(e).hours;
  }
  return {start, end, last, courses, volumes};
}
