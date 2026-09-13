// Un bloc standard de n séances dure n × 75 + (n − 1) × 15 minutes.
export function teachingDuration(event) {
  const gross = Number.isFinite(event.hours) ? Math.max(0,event.hours) : 0;
  if (event.allDay || event.invalid || event.excludedFromHours) return {hours:0,breakMinutes:0,nonstandard:false};
  const esgt = event.accountingSource ? event.accountingSource === 'ESGT' : event.sources?.includes('ESGT');
  if (!esgt || gross === 0) return {hours:gross,breakMinutes:0,nonstandard:false};
  const minutes = Math.round(gross * 60);
  const sessions = (minutes + 15) / 90;
  if (Number.isInteger(sessions) && sessions >= 1) {
    const breakMinutes = (sessions - 1) * 15;
    return {hours:(minutes-breakMinutes)/60,breakMinutes,nonstandard:false};
  }
  // Sans horaires de pause explicites, ne pas inventer un découpage.
  return {hours:gross,breakMinutes:0,nonstandard:minutes>75};
}
