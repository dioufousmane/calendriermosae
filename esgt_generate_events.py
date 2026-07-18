import unicodedata
import pytz
import requests
import re
from ics import Calendar
import json
from datetime import datetime

# 🗂️ Configurations des calendriers ESGT
CALENDARS = [
    {
        "name": "MOSAE1",
        "url": "https://dioufousmane.github.io/calendriermosae/ESGT_MOSAE_1.ics",
        "output": "esgt_events.json"
    },
    {
        "name": "MOSAE2",
        "url": "https://dioufousmane.github.io/calendriermosae/ESGT_MOSAE_2.ics",
        "output": "esgt_events2.json"
    }
]

TIMEZONE = pytz.timezone("Europe/Paris")
jours_fr = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

def clean_text(text):
    if not text:
        return ""

    # tentative de réparation UTF8/Latin1
    try:
        repaired = text.encode("latin1").decode("utf-8")
        if "Ã" not in repaired:
            text = repaired
    except Exception:
        pass

    text = unicodedata.normalize("NFC", text)

    # espaces multiples
    text = re.sub(r"\s+", " ", text)

    return text.strip()
def extract_with_regex(label, text):
    pattern = rf"{label}\s*:\s*(.*?)(?=\s*\w+\s*:|$)"
    match = re.search(pattern, text)
    return match.group(1).strip() if match else ""

def format_event(event, maj_str):
    dtstart = event.begin.astimezone(TIMEZONE)
    dtend = event.end.astimezone(TIMEZONE)

    day = jours_fr[dtstart.weekday()]
    date_str = dtstart.strftime("%d/%m/%Y")
    start_str = dtstart.strftime("%H:%M")
    end_str = dtend.strftime("%H:%M")

    raw_title = clean_text(event.name or "Sans titre")
    description = clean_text(event.description or "")

    matiere = extract_with_regex("Matière", description)
    enseignant_nom = extract_with_regex("Enseignant", description) or "non renseigné"
    salle = extract_with_regex("Salle", description) or "non renseignée"
    title = matiere if matiere else raw_title

    return {
        "day": day,
        "date": date_str,
        "start": start_str,
        "end": end_str,
        "title": title,
        "salle": salle,
        "enseignant": enseignant_nom,
        "maj": maj_str
    }

def process_calendar(name, url, output_file):
    print(f"\n📡 Téléchargement du calendrier {name}...")
    try:
        response = requests.get(url)
        response.encoding = 'utf-8'
        if response.status_code != 200:
            print(f"❌ Erreur HTTP {response.status_code} pour {name}")
            return
    except Exception as e:
        print(f"❌ Erreur lors de la requête pour {name} : {e}")
        return

    calendar = Calendar(response.text)
    events = []
    maj_str = datetime.now(TIMEZONE).strftime("%d-%m-%Y %H:%M:%S")

    for event in calendar.events:
        if event.begin and event.end:
            dtstart = event.begin.astimezone(TIMEZONE)
            if dtstart.weekday() < 5:
                evt = format_event(event, maj_str)
                events.append(evt)
                print(f"✔️ {evt['title']} ({evt['date']} {evt['start']}-{evt['end']})")
            else:
                print(f"⏭️ Ignoré (weekend) : {event.name}")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)

    print(f"✅ {len(events)} événements extraits pour {name}.")
    print(f"📄 Fichier JSON généré : {output_file}")

def main():
    for cal in CALENDARS:
        process_calendar(cal["name"], cal["url"], cal["output"])

if __name__ == "__main__":
    main()
