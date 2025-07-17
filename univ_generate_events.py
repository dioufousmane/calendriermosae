import unicodedata
import pytz
import locale
import requests
from ics import Calendar
from datetime import datetime

ICS_URL = "http://planning.univ-lemans.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=7209&projectId=08&calType=ical&nbWeeks=52"
OUTPUT_FILE = "univ_events.js"
TIMEZONE = pytz.timezone("Europe/Paris")

# 🌍 Locale FR pour avoir Lundi/Vendredi et pas Monday/Friday
try:
    locale.setlocale(locale.LC_TIME, 'fr_FR.UTF-8')
except locale.Error:
    locale.setlocale(locale.LC_TIME, '')

def clean_text(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)
    # ➕ Échappement des apostrophes pour JS
    return (
        text.replace("\\", "\\\\")  # d'abord les antislashs
            .replace("'", "\\'")    # ensuite les apostrophes
            .replace("\n", " ")
            .replace("\r", "")
            .strip()
    )

def format_event(event):
    dtstart = event.begin.astimezone(TIMEZONE)
    dtend = event.end.astimezone(TIMEZONE)

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
        "title": title,
        "sort_key": dtstart
    }

def generate_js(events, key="UNIV"):
    lines = [f"const events = {{ '{key}': ["]
    for e in events:
        lines.append(
            f"    {{ day: '{e['day']}', date: '{e['date']}', start: '{e['start']}', end: '{e['end']}', title: '{e['title']}' }},"
        )
    lines.append("  ] };")
    return "\n".join(lines)

def main():
    print("📡 Téléchargement de l'emploi du temps...")
    response = requests.get(ICS_URL)
    if response.status_code != 200:
        print(f"❌ Échec du téléchargement (code {response.status_code})")
        return

    calendar = Calendar(response.text)
    events = []

    for event in calendar.events:
        if event.begin and event.end:
            evt = format_event(event)
            if evt["day"] in ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]:
                events.append(evt)

    events.sort(key=lambda x: x["sort_key"])
    print(f"✅ {len(events)} événements formatés.")

    js_code = generate_js(events)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(js_code)

    print(f"📄 Fichier {OUTPUT_FILE} généré avec succès.")

if __name__ == "__main__":
    main()
