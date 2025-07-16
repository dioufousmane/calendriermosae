import requests
from generate_events import Calendar
from datetime import datetime
import pytz
import locale
import unicodedata

# Assure l'affichage en français pour les noms de jour
try:
    locale.setlocale(locale.LC_TIME, 'fr_FR.UTF-8')
except locale.Error:
    locale.setlocale(locale.LC_TIME, '')

# Config
ICS_URL = "https://dioufousmane.github.io/calendriermosae/mosae.ics"
OUTPUT_FILE = "events.js"
TIMEZONE = pytz.timezone("Europe/Paris")


def clean_text(text):
    if not text:
        return ""
    # Normalise les accents et nettoie les \n
    text = unicodedata.normalize("NFC", text)
    text = text.replace("\\n", "\n").replace("\r", "").replace("\n", " ").strip()
    return text


def format_event(event):
    # Convertir UTC → Europe/Paris
    dtstart_utc = event.begin.datetime.replace(tzinfo=pytz.UTC)
    dtend_utc = event.end.datetime.replace(tzinfo=pytz.UTC)

    dtstart = dtstart_utc.astimezone(TIMEZONE)
    dtend = dtend_utc.astimezone(TIMEZONE)

    day_name = dtstart.strftime("%A").capitalize()
    date_str = dtstart.strftime("%d/%m/%Y")
    start_str = dtstart.strftime("%H:%M")
    end_str = dtend.strftime("%H:%M")

    # Nettoyage des champs
    title = clean_text(event.name or "Sans titre")
    description = clean_text(event.description or "")

    # Titre enrichi
    if description:
        title += "\\n" + description

    return {
        "day": day_name,
        "date": date_str,
        "start": start_str,
        "end": end_str,
        "title": title
    }


def generate_js(events_list):
    js_lines = ["const events = {", "  MOSAE1: ["]
    for evt in events_list:
        js_lines.append(
            f"    {{ day: '{evt['day']}', date: '{evt['date']}', start: '{evt['start']}', end: '{evt['end']}', title: '{evt['title']}' }},"
        )
    js_lines.append("  ]")
    js_lines.append("};")
    return "\n".join(js_lines)


def main():
    print("📥 Téléchargement du fichier ICS...")
    response = requests.get(ICS_URL)
    response.raise_for_status()

    print("📖 Parsing du fichier ICS avec encodage correct...")
    calendar = Calendar(response.content.decode('utf-8', errors='replace'))

    events_parsed = []

    for event in calendar.events:
        if event.begin and event.end:
            evt = format_event(event)
            if evt['day'] in ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']:
                events_parsed.append(evt)

    print(f"✅ {len(events_parsed)} événements extraits.")
    js_code = generate_js(events_parsed)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(js_code)

    print(f"📦 Fichier '{OUTPUT_FILE}' généré avec succès.")


if __name__ == "__main__":
    main()
