import unicodedata
import pytz
import requests
from ics import Calendar
from datetime import datetime
import json
import re

# 🔗 Liens ICS et fichiers de sortie
CALENDARS = [
    {
        "name": "UNIV",
        "url": "http://planning.univ-lemans.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=7209&projectId=08&calType=ical&nbWeeks=52",
        "output": "univ_events.json"
    },
    {
        "name": "UNIV2",
        "url": "http://planning.univ-lemans.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=809&projectId=08&calType=ical&nbWeeks=52",
        "output": "univ_events2.json"
    }
]

TIMEZONE = pytz.timezone("Europe/Paris")
jours_fr = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

formations_regex = r"""
    (?:M\d?\s+)?                  
    (MOSAE|URBANISTIC|MATTERRE|MIDEC|
     VILLE\s+ET\s+ENVIRONNEMENT[S]*\s*URBAIN[S]*|
     GEOGRAPHIE.*?DEVELOPPEMENT|
     HISTOIRE.*?PATRIMOINE|
     DDL.*?|LEA.*?|MEEF.*?|
     LP.*?|UEO.*?)
"""

def clean_text(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)
    return text.replace("\n", " ").replace("\r", "").strip()

def extract_title(raw_title):
    line = raw_title.split("\\n")[0].strip()
    line = re.sub(formations_regex, "", line, flags=re.IGNORECASE | re.VERBOSE).strip()
    return line

def extract_enseignant(text, title):
    keywords = ["campus en fête", "soutenance", "alternance"]
    if any(k in title.lower() for k in keywords):
        return "non renseigné"

    text = re.sub(r"\(Exported.*?\)", "", text)
    text = re.sub(formations_regex, "", text, flags=re.IGNORECASE | re.VERBOSE)

    match = re.search(r"([A-ZÉÈÊÛÎ\-]{2,}(?:\s+[A-ZÉÈÊÛÎ\-]{2,}){1,2})\s*$", text.strip())
    return match.group(1).strip() if match else "non renseigné"

def extract_salle(description):
    match = re.search(r"(Salle|Amphi|Bâtiment|Salle informatique)\s*[^\n()]*", description, re.IGNORECASE)
    return match.group(0).strip() if match else "non renseignée"

def format_event(event, maj_str):
    dtstart_utc = event.begin.datetime.replace(tzinfo=pytz.UTC)
    dtend_utc = event.end.datetime.replace(tzinfo=pytz.UTC)

    dtstart = dtstart_utc.astimezone(TIMEZONE)
    dtend = dtend_utc.astimezone(TIMEZONE)

    day = jours_fr[dtstart.weekday()]
    date_str = dtstart.strftime("%d/%m/%Y")
    start_str = dtstart.strftime("%H:%M")
    end_str = dtend.strftime("%H:%M")

    raw_title = clean_text(event.name or "Sans titre")
    description = clean_text(event.description or "")

    title = extract_title(raw_title)
    enseignant = extract_enseignant(description or raw_title, title)
    salle = extract_salle(description)

    return {
        "day": day,
        "date": date_str,
        "start": start_str,
        "end": end_str,
        "title": title,
        "salle": salle,
        "enseignant": enseignant,
        "maj": maj_str
    }

def process_calendar(name, url, output_file):
    print(f"📡 Téléchargement du calendrier {name}...")
    response = requests.get(url)
    if response.status_code != 200:
        print(f"❌ Erreur {response.status_code} pour {name}")
        return

    calendar = Calendar(response.text)
    events = []
    maj_str = datetime.now(TIMEZONE).strftime("%d-%m-%Y %H:%M:%S")

    for event in calendar.events:
        if event.begin and event.end:
            dtstart = event.begin.datetime.astimezone(TIMEZONE)
            if dtstart.weekday() < 5:  # Ignore samedi/dimanche
                evt = format_event(event, maj_str)
                events.append(evt)
                print(f"✔️ {name} : {evt['title']} ({evt['date']} {evt['start']}-{evt['end']})")
            else:
                print(f"⏭️ {name} : Ignoré (weekend) : {event.name}")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)

    print(f"✅ {len(events)} événements extraits pour {name}.")
    print(f"📄 Fichier généré : {output_file}\n")

def main():
    for cal in CALENDARS:
        process_calendar(cal["name"], cal["url"], cal["output"])

if __name__ == "__main__":
    main()
