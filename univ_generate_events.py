import unicodedata
import pytz
import locale
import requests
import json
from ics import Calendar
from datetime import datetime

# Lien ICS Université du Mans
ICS_URL = "http://planning.univ-lemans.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=7209&projectId=08&calType=ical&nbWeeks=52"
OUTPUT_FILE = "univ_events.json"
TIMEZONE = pytz.timezone("Europe/Paris")

# Locale en français
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
    dtstart = event.begin.astimezone(TIMEZONE)
    dtend = event.end.astimezone(TIMEZONE)

    day_name = dtstart.strftime("%A").capitalize()
    date_str = dtstart.strftime("%d/%m/%Y")
    start_str = dtstart.strftime("%H:%M")
    end_str = dtend.strftime("%H:%M")

    title = clean_text(event.name or "Sans titre")
    description = clean_text(event.description or "")
    if description:
        title += "\n" + description

    return {
        "day": day_name,
        "date": date_str,
        "start": start_str,
        "end": end_str,
        "title": title,
        "sort_key": dtstart  # pour trier
    }

def main():
    print("📡 Téléchargement du calendrier UNIV...")
    response = requests.get(ICS_URL)
    if response.status_code != 200:
        print(f"❌ Erreur HTTP {response.status_code}")
        return

    calendar = Calendar(response.text)
    events = []

    for event in calendar.events:
        if event.begin and event.end:
            evt = format_event(event)
            if evt["day"] in ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]:
                events.append(evt)

    # Tri par date
    events.sort(key=lambda x: x["sort_key"])
    for e in events:
        del e["sort_key"]

    # Export JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)

    print(f"✅ {len(events)} événements enregistrés dans {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
