
import os
import unicodedata
import pytz
import locale
from ics import Calendar
from datetime import datetime

ICS_FOLDER = "ics"
OUTPUT_FILE = "events.js"
TIMEZONE = pytz.timezone("Europe/Paris")

try:
    locale.setlocale(locale.LC_TIME, 'fr_FR.UTF-8')
except locale.Error:
    locale.setlocale(locale.LC_TIME, '')

def clean_text(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)
    return text.replace("\n", "\n").replace("\r", "").replace("\n", " ").strip()

def format_event(event):
    dtstart_utc = event.begin.datetime.replace(tzinfo=pytz.UTC)
    dtend_utc = event.end.datetime.replace(tzinfo=pytz.UTC)

    dtstart = dtstart_utc.astimezone(TIMEZONE)
    dtend = dtend_utc.astimezone(TIMEZONE)

    day_name = dtstart.strftime("%A").capitalize()
    date_str = dtstart.strftime("%d/%m/%Y")
    start_str = dtstart.strftime("%H:%M")
    end_str = dtend.strftime("%H:%M")

    title = clean_text(event.name or "Sans titre")
    description = clean_text(event.description or "")

    if description:
        title += "\\n" + description

    return {
        "day": day_name,
        "date": date_str,
        "start": start_str,
        "end": end_str,
        "title": title
    }

def parse_ics_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        calendar = Calendar(f.read())
    events = []
    for event in calendar.events:
        if event.begin and event.end:
            evt = format_event(event)
            if evt["day"] in ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]:
                events.append(evt)
    return events

def generate_js(event_dict):
    lines = ["const events = {"]
    for key, evts in event_dict.items():
        lines.append(f"  '{key}': [")
        for e in evts:
            lines.append(
                f"    {{ day: '{e['day']}', date: '{e['date']}', start: '{e['start']}', end: '{e['end']}', title: '{e['title']}' }},"
            )
        lines.append("  ],")
    lines.append("};")
    return "\n".join(lines)

def main():
    print("📁 Lecture des fichiers ICS dans le dossier /ics/")
    all_events = {}

    for filename in os.listdir(ICS_FOLDER):
        if filename.endswith(".ics"):
            name = os.path.splitext(filename)[0].upper()
            print(f"🔄 Traitement de {filename} → {name}")
            full_path = os.path.join(ICS_FOLDER, filename)
            all_events[name] = parse_ics_file(full_path)

    js_code = generate_js(all_events)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(js_code)

    print(f"✅ Fichier '{OUTPUT_FILE}' généré avec succès avec {len(all_events)} groupes.")

if __name__ == "__main__":
    main()
