import unicodedata
import pytz
import locale
import requests
import json
from ics import Calendar
from datetime import datetime

# 🔗 Lien ICS à personnaliser
ICS_URL = "https://hpesgt.cnam.fr/hp/Telechargements/ical/Edt_DIOUF.ics?version=2022.0.5.0&idICal=5D5AA505E9E5736EE4D7FF2AB864E3FC&param=643d5b312e2e36325d2666683d3126663d31"
OUTPUT_FILE = "esgt_events.json"
TIMEZONE = pytz.timezone("Europe/Paris")

# 🌍 Locale pour affichage des jours en français
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
        title += "\n" + description

    return {
        "day": day_name,
        "date": date_str,
        "start": start_str,
        "end": end_str,
        "title": title
    }

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

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)

    print(f"📄 Fichier {OUTPUT_FILE} généré avec succès.")

if __name__ == "__main__":
    main()
