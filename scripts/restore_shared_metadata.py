"""Restauration ponctuelle et traçable depuis les ICS joints, sans changer les horaires.

Ne pas exécuter automatiquement après la collecte : les snapshots sont anciens.
Seules des correspondances univoques date/début/fin/intitulé sont acceptées.
"""
import json
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from zoneinfo import ZoneInfo
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from event_metadata import extract_metadata

ROOT = Path(__file__).resolve().parents[1]

def norm(value):
    value = ''.join(c for c in unicodedata.normalize('NFD', value) if not unicodedata.combining(c))
    value = re.sub(r'^\s*\d+(?=\s*(CM|TD|TP)\b)', '', value, flags=re.I)
    return ' '.join(value.lower().split())

def unescape(value):
    return re.sub(r'\\([nN,;\\])', lambda m: '\n' if m[1].lower() == 'n' else m[1], value)

def parse_events(path):
    text = re.sub(r'\n[ \t]', '', path.read_text(encoding='utf-8-sig'))
    for block in text.split('BEGIN:VEVENT')[1:]:
        fields = {}
        for line in block.split('END:VEVENT')[0].splitlines():
            if ':' in line:
                header, value = line.split(':', 1)
                fields[header.split(';')[0]] = (header, value)
        def get(key): return unescape(fields.get(key, ('', ''))[1])
        def dt(key):
            header, value = fields[key]
            if not re.fullmatch(r'\d{8}T\d{6}Z?', value):
                raise ValueError('Événement sans horaire précis')
            date = datetime.strptime(value.rstrip('Z'), '%Y%m%dT%H%M%S')
            if value.endswith('Z'):
                date = date.replace(tzinfo=ZoneInfo('UTC'))
            else:
                tz = re.search(r'TZID=([^;:]+)', header)
                if not tz:
                    raise ValueError('Fuseau absent')
                date = date.replace(tzinfo=ZoneInfo(tz[1]))
            return date.astimezone(ZoneInfo('Europe/Paris'))
        try: start, end = dt('DTSTART'), dt('DTEND')
        except (KeyError, ValueError): continue
        description, title = get('DESCRIPTION'), get('SUMMARY')
        subject = re.search(r'^Matière\s*:\s*(.+)', description, re.M)
        title_key = subject[1] if subject else title
        yield (start.strftime('%d/%m/%Y'), start.strftime('%H:%M'), end.strftime('%H:%M'), norm(title_key)), extract_metadata(SimpleNamespace(description=description, name=title, uid=get('UID'))), get('DTSTAMP')

def main():
    report = []
    for snapshot, filename in [('ESGT_MOSAE_1.ics','esgt_events.json'),('ESGT_MOSAE_2.ics','esgt_events2.json'),('MOSAE_1.ics','univ_events.json'),('MOSAE_2.ics','univ_events2.json')]:
        candidates = {}
        for key, metadata, stamp in parse_events(ROOT/snapshot): candidates.setdefault(key, []).append((metadata, stamp))
        rows = json.loads((ROOT/filename).read_text())
        count = 0
        for row in rows:
            # Existing explicit metadata from newer collection stays authoritative.
            if row.get('uid') or row.get('promotions') or row.get('groups') or row.get('formations'): continue
            key = row['date'], row['start'], row['end'], norm(row['title'])
            matches = candidates.get(key, [])
            if len(matches) != 1: continue
            metadata, stamp = matches[0]
            if not any(metadata.get(k) for k in ('promotions','groups','formations')): continue
            row.update(metadata)
            row['metadata_source'] = snapshot
            row['metadata_snapshot_date'] = stamp
            count += 1
        (ROOT/filename).write_text(json.dumps(rows, indent=2, ensure_ascii=False)+'\n')
        report.append({'file':filename,'metadata_restored':count,'snapshot':snapshot})
    (ROOT/'nouveau/docs/mutualisations-restauration.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(report,ensure_ascii=False))
if __name__ == '__main__':main()
