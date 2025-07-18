import unicodedata
import pytz
import requests
from ics import Calendar
from datetime import datetime

# 📡 Lien ICS (à adapter selon le fichier)
ICS_URL = "https://dioufousmane.github.io/calendriermosae/MOSAE1.ics"
OUTPUT_FILE = "esgt_events.json"
TIMEZONE = pytz.timezone("Europe/Paris")

# 📅 Traduction manuelle des jours
jours_fr = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

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

    day = jours_fr[dtstart.weekday()]  # nom du jour en français
    date_str = dtstart.strftime("%d/%m/%Y")
    start_str = dtstart.strftime("%H:%M")
    end_str = dtend.strftime("%H:%M")

    title = clean_text(event.name or "Sans titre")
    description = clean_text(event.description or "")
    if description:
        title += "\\n" + description

    return {
        "day": day,
        "date": date_str,
        "start": start_str,
        "end": end_str,
        "title": title
    }

def main():
    print("📡 Téléchargement du calendrier...")
    response = requests.get(ICS_URL)
    if response.status_code != 200:
        print(f"❌ Erreur de téléchargement : {response.status_code}")
        return

    calendar = Calendar(response.text)
    events = []

    for event in calendar.events:
        if event.begin and event.end:
            evt = format_event(event)
            dtstart = event.begin.datetime.astimezone(TIMEZONE)
            if dtstart.weekday() < 5:  # Lundi à vendredi
                events.append(evt)
                print(f"✔️ Ajouté : {evt['title']} ({evt['date']} {evt['start']}-{evt['end']})")
            else:
                print(f"⏭️ Ignoré (weekend) : {evt['title']}")

    print(f"✅ {len(events)} événements extraits.")

    import json
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)

    print(f"📄 Fichier JSON généré : {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
