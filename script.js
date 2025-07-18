const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const startHour = 8;
const endHour = 18;
const interval = 15;

const baseDate = new Date(2025, 8, 1); // 1er septembre 2025
let currentWeekOffset = 0;

function createCalendarGrid() {
    const grid = document.getElementById("calendarGrid");
    grid.innerHTML = "";

    const currentWeekStart = new Date(baseDate);
    currentWeekStart.setDate(currentWeekStart.getDate() + currentWeekOffset * 7);

    // Coin vide (coin haut-gauche)
    const corner = document.createElement('div');
    corner.className = "corner";
    grid.appendChild(corner);

    // Entêtes (deux colonnes par jour : ESGT et UNIV)
    days.forEach((day, index) => {
        ['ESGT', 'UNIV'].forEach(cal => {
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + index);
            const formattedDate = dayDate.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit'
            });
            const div = document.createElement('div');
            div.className = `header header-${cal.toLowerCase()}`;
            div.innerText = `${day} (${cal})\n${formattedDate}`;
            grid.appendChild(div);
        });
    });

    const intervalsPerHour = 60 / interval;
    const totalRows = (endHour - startHour) * intervalsPerHour;

    for (let i = 0; i < totalRows; i++) {
        const hour = startHour + Math.floor(i * interval / 60);
        const minute = (i * interval) % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // ⛔ Suppression de l'affichage de l'heure
        const timeLabel = document.createElement('div');
        timeLabel.className = "time-label";
        timeLabel.innerText = ""; // ← pas d'heure affichée
        grid.appendChild(timeLabel);

        // Cellules du calendrier (10 colonnes : 5 jours × 2)
        for (let d = 0; d < days.length; d++) {
            ['ESGT', 'UNIV'].forEach(cal => {
                const cell = document.createElement('div');
                cell.dataset.day = days[d];
                cell.dataset.calendar = cal;
                cell.dataset.time = timeString;
                cell.classList.add(`col-${cal.toLowerCase()}`);
                cell.textContent = ""; // pas d'heure ici non plus
                grid.appendChild(cell);
            });
        }
    }

    renderEvents();
    updateWeekLabel();
}
eventDiv.innerHTML = `
  <div class="event-title">${evt.title}</div>
  <div class="event-time"><strong>${evt.date} ${evt.start} - ${evt.end}</strong></div>`
  
function renderEvents() {
    const grid = document.getElementById("calendarGrid");
    
    // Supprimer les anciens événements
    grid.querySelectorAll(".event-block").forEach(e => e.remove());

    // Déterminer les bornes de la semaine actuelle
    const currentWeekStart = new Date(baseDate);
    currentWeekStart.setDate(currentWeekStart.getDate() + currentWeekOffset * 7);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 4); // du lundi au vendredi

    Object.keys(events).forEach(cal => {
        const checkbox = document.querySelector(`input[type="checkbox"][onchange*="${cal}"]`);
        if (checkbox && !checkbox.checked) return;

        events[cal].forEach(evt => {
            // Conversion de la date de l'événement
            const [day, month, year] = evt.date.split("/").map(Number);
            const eventDate = new Date(year, month - 1, day);
            if (eventDate < currentWeekStart || eventDate > currentWeekEnd) return;

            // Heure de début et de fin en minutes depuis minuit
            const [startHourVal, startMinVal] = evt.start.split(":").map(Number);
            const [endHourVal, endMinVal] = evt.end.split(":").map(Number);
            const startTotal = startHourVal * 60 + startMinVal;
            const endTotal = endHourVal * 60 + endMinVal;

            // Ligne de départ + durée en "span"
            const rowStart = Math.floor((startTotal - startHour * 60) / interval) + 2; // +2 car première ligne = coin + entêtes
            const span = (endTotal - startTotal) / interval;

            // Colonne à cibler : 2 colonnes par jour (ESGT puis UNIV), après la colonne des heures
            const dayIndex = days.indexOf(evt.day); // de 0 à 4
            const calOffset = (cal === "ESGT") ? 0 : 1;
            const colIndex = dayIndex * 2 + calOffset + 2; // +1 pour les heures, +1 pour le coin vide

            // Création de l’élément événement
            const eventDiv = document.createElement('div');
            eventDiv.className = "event-block";
            eventDiv.classList.add(`event-${cal.toLowerCase()}`);
            eventDiv.style.gridColumn = colIndex;
            eventDiv.style.gridRow = `${rowStart} / span ${span}`;
            eventDiv.innerText = `${evt.title}\n${evt.date} ${evt.start} - ${evt.end}`;
            grid.appendChild(eventDiv);
        });
    });
}


function updateWeekLabel() {
    const weekLabel = document.getElementById("weekLabel");
    const start = new Date(baseDate);
    start.setDate(start.getDate() + currentWeekOffset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 4);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    weekLabel.innerText = `Semaine du ${start.toLocaleDateString('fr-FR', options)} au ${end.toLocaleDateString('fr-FR', options)}`;
}

function toggleCalendar(name) {
    createCalendarGrid();
}

function refreshCalendar(name) {
    createCalendarGrid();
}

function nextWeek() {
    currentWeekOffset++;
    createCalendarGrid();
}

function prevWeek() {
    currentWeekOffset--;
    createCalendarGrid();
}

function goToCurrentWeek() {
    currentWeekOffset = 0;
    createCalendarGrid();
}

window.onload = () => {
    createCalendarGrid();
};

document.getElementById("generateBtn").addEventListener("click", () => {
    fetch("/generate-json", { method: "POST" })
        .then(res => res.json())
        .then(data => {
            document.getElementById("status").innerText = data.message || "OK !";
        })
        .catch(err => {
            document.getElementById("status").innerText = "Erreur : " + err;
        });
});
