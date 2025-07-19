import unicodedata
import pytz
import requests
import re
from ics import Calendar
import json

# 📡 Lien ICS à adapter
ICS_URL = "https://dioufousmane.github.io/calendriermosae/MOSAE2.ics"
OUTPUT_FILE = "esgt_events2.json"
TIMEZONE = pytz.timezone("Europe/Paris")

# 📅 Traduction manuelle des jours
jours_fr = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

def clean_text(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", text)
    return text.replace("\n", " ").replace("\r", "").strip()

def extract_with_regex(label, text):
    pattern = rf"{label}\s*:\s*(.*?)(?=\s*\w+\s*:|$)"
    match = re.search(pattern, text)
    return match.group(1).strip() if match else ""

def format_event(event):
    dtstart = event.begin.astimezone(TIMEZONE)
    dtend = event.end.astimezone(TIMEZONE)

    day = jours_fr[dtstart.weekday()]
    date_str = dtstart.strftime("%d/%m/%Y")
    start_str = dtstart.strftime("%H:%M")
    end_str = dtend.strftime("%H:%M")

    raw_title = clean_text(event.name or "Sans titre")
    description = clean_text(event.description or "")

    matiere = extract_with_regex("Matière", description)
    enseignant_nom = extract_with_regex("Enseignant", description)
    salle = extract_with_regex("Salle", description)

    # 🧠 Construction du titre
    if matiere and enseignant_nom:
        title = f"{matiere} - Enseignant : {enseignant_nom}"
    else:
        title = raw_title

    enseignant = f"Enseignant : {enseignant_nom}" if enseignant_nom else ""

    return {
        "day": day,
        "date": date_str,
        "start": start_str,
        "end": end_str,
        "title": title,
        "enseignant": enseignant,
        "salle": salle
    }

def main():
    print("📡 Téléchargement du calendrier...")
    response = requests.get(ICS_URL)
    response.encoding = 'utf-8'

    if response.status_code != 200:
        print(f"❌ Erreur de téléchargement : {response.status_code}")
        return

    calendar = Calendar(response.text)
    events = []

    for event in calendar.events:
        if event.begin and event.end:
            dtstart = event.begin.astimezone(TIMEZONE)
            if dtstart.weekday() < 5:
                evt = format_event(event)
                events.append(evt)
                print(f"✔️ Ajouté : {evt['title']} ({evt['date']} {evt['start']}-{evt['end']})")
            else:
                print(f"⏭️ Ignoré (weekend) : {event.name}")

    print(f"✅ {len(events)} événements extraits.")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)

    print(f"📄 Fichier JSON généré : {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
