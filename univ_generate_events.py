import unicodedata
import pytz
import locale
import requests
from ics import Calendar
from datetime import datetime

# 🔗 Mets ici ton lien ICS (depuis l'ENT ou Hyperplanning UNIV par exemple)
ICS_URL = "http://planning.univ-lemans.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=7209&projectId=08&calType=ical&nbWeeks=52"
OUTPUT_FILE = "univ_events.js"
TIMEZONE = pytz.timezone("Europe/Paris")

# 🌍 Définir la locale française pour les noms de jours
try:
    locale.setlocale(locale.LC_TIME, 'fr_FR.UTF-8')
except locale.Error:
    locale.setlocale(locale.LC_TIME, '')

def clean_text(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)
    return text.replace("\n", " ").replace("\r", "").strip()

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

def generate_js(events, key="UNIV"):
    lines = [f"const events = {{ '{key}': ["]
    for e in events:
        lines.append(
            f"    {{ day: '{e['day']}', date: '{e['date']}', start: '{e['start']}', end: '{e['end']}', title: '{e['title']}' }},"
        )
    lines.append("  ] };")
    return "\n".join(lines)

def main():
    print("📡 Téléchargement du fichier ICS...")
    response = requests.get(ICS_URL)
    if response.status_code != 200:
        print(f"❌ Échec du téléchargement (code {response.status_code}).")
        return

    calendar = Calendar(response.text)
    events = []

    for event in calendar.events:
        if event.begin and event.end:
            evt = format_event(event)
            if evt["day"] in ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]:
                events.append(evt)

    print(f"✅ {len(events)} événements extraits.")

    js_code = generate_js(events, key="UNIV")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(js_code)

    print(f"📄 Fichier {OUTPUT_FILE} généré avec succès.")

if __name__ == "__main__":
    main()
