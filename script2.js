const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const startHour = 8;
const endHour = 18.5;
const interval = 15;

const baseDate = new Date(2025, 8, 1); // 1er septembre 2025
let currentWeekOffset = 0;

function createCalendarGrid() {
    const grid = document.getElementById("calendarGrid");
    grid.innerHTML = "";

    const currentWeekStart = new Date(baseDate);
    currentWeekStart.setDate(currentWeekStart.getDate() + currentWeekOffset * 7);

    // Coin vide
    const corner = document.createElement('div');
    grid.appendChild(corner);

    // Entêtes (deux par jour : ESGT2 et UNIV2)
    days.forEach((day, index) => {
        ['ESGT2', 'UNIV2'].forEach(cal => {
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

        // Pas d'affichage d'heure (timeLabel)

        for (let d = 0; d < days.length; d++) {
            ['ESGT2', 'UNIV2'].forEach(cal => {
                const cell = document.createElement('div');
                cell.dataset.day = days[d];
                cell.dataset.calendar = cal;
                cell.dataset.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                cell.classList.add(`col-${cal.toLowerCase()}`);
                grid.appendChild(cell);
            });
        }
    }

    renderEvents();
    updateWeekLabel();
}

function renderEvents() {
    const grid = document.getElementById("calendarGrid");
    const oldEvents = grid.querySelectorAll(".event-block");
    oldEvents.forEach(e => e.remove());

    const currentWeekStart = new Date(baseDate);
    currentWeekStart.setDate(currentWeekStart.getDate() + currentWeekOffset * 7);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 4);

    Object.keys(events).forEach(cal => {
        const checkbox = document.querySelector(`input[type="checkbox"][onchange*="${cal}"]`);
        if (checkbox && !checkbox.checked) return;

        events[cal].forEach(evt => {
            const [day, month, year] = evt.date.split("/").map(Number);
            const eventDate = new Date(year, month - 1, day);
            if (eventDate < currentWeekStart || eventDate > currentWeekEnd) return;

            const startParts = evt.start.split(":").map(Number);
            const endParts = evt.end.split(":").map(Number);
            const startTotal = startParts[0] * 60 + startParts[1];
            const endTotal = endParts[0] * 60 + endParts[1];

            const rowStart = Math.floor((startTotal - startHour * 60) / interval);
            const span = Math.ceil((endTotal - startTotal) / interval);

            const baseCol = days.indexOf(evt.day) + 2;
            const calOffset = (cal === "ESGT2") ? 0 : 1;
            const colIndex = baseCol * 2 + calOffset - 2;

            const eventDiv = document.createElement('div');
            eventDiv.className = "event-block";
            eventDiv.classList.add(`event-${cal.toLowerCase()}`);
            eventDiv.style.gridColumn = colIndex;
            eventDiv.style.gridRow = `${rowStart + 2} / span ${span}`; // +2 = ligne d'entête + 1-based grid
            eventDiv.innerHTML = `
  ${evt.title}<br><br>
  Enseignant : ${evt.enseignant}<br><br>
  Salle : ${evt.salle}<br><br>
  <h3><strong>${evt.start} - ${evt.end}</strong></h3>
`;


            grid.appendChild(eventDiv);
        });
    });
}
function forceNoCacheReload() {
    showTemporaryMessage("Chargement en cours… sans cache 🧹");

    const url = new URL(window.location.href);
    url.searchParams.set('_', Date.now());

    setTimeout(() => {
      window.location.href = url.toString();
    }, 1500);
  }

  function showTemporaryMessage(text) {
    const message = document.createElement('div');
    message.className = 'temp-message';
    message.textContent = text;

    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 1400);
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
