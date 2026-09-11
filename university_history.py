"""Historique cumulatif des séances universitaires, indépendant du navigateur."""
import json
import os
import unicodedata
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


def event_date(event):
    return datetime.strptime(event['date'], '%d/%m/%Y').date()


def signature(event):
    title = ' '.join(unicodedata.normalize('NFC', event.get('title', '')).casefold().split())
    return (event['date'], event.get('start'), event.get('end'), title)


def merge_records(*collections):
    # Later input wins; UID is scoped to a day to preserve recurring sessions.
    result = []
    for rows in collections:
        for event in rows:
            event_date(event)  # Fail rather than silently discard malformed history.
            uid = event.get('uid')
            matches = [i for i, old in enumerate(result) if
                       (uid and old.get('uid') == uid and old['date'] == event['date']) or
                       (signature(old) == signature(event) and
                        (not uid or not old.get('uid') or old['uid'] == uid))]
            for i in reversed(matches):
                result.pop(i)
            result.append(dict(event))
    return sorted(result, key=lambda e: (event_date(e), e.get('start', ''), e.get('title', '')))


def read_records(path):
    path = Path(path)
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(data, list):
        raise ValueError(f'Historique invalide : {path}')
    return data


def atomic_write(path, rows):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temporary, path)


def save_with_history(output_file, fresh, today=None):
    """fresh=None sauvegarde le disponible sans supposer une collecte réussie."""
    today = today or datetime.now(ZoneInfo('Europe/Paris')).date()
    output = Path(output_file)
    archive = output.parent / 'history' / output.name
    old = read_records(output)
    past = lambda rows: [e for e in rows if event_date(e) < today]
    historic = merge_records(past(read_records(archive)), past(old))
    if fresh is not None:
        historic = merge_records(historic, past(fresh))
    # Write archive first; a failed later write cannot destroy the saved history.
    atomic_write(archive, historic)
    combined = merge_records(historic, old if fresh is None else fresh)
    atomic_write(output, combined)
    return combined


if __name__ == '__main__':
    for filename in ('univ_events.json', 'univ_events2.json'):
        rows = save_with_history(filename, None)
        print(f'{filename} : {len(rows)} événements, historique sauvegardé')
