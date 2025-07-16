const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const startHour = 8;
const endHour = 20;
const interval = 15;

const baseDate = new Date(2025, 8, 1); // 1er septembre 2025 (mois = 8 car janvier = 0)
let currentWeekOffset = 0;

/*const events = {
    'MOSAE1': [
        { day: 'Lundi', date: '15/07/2025', start: '08:00', end: '09:45', title: 'RENTREE\nDIOUF, DURAND' },
        { day: 'Mardi', date: '02/09/2025', start: '10:00', end: '11:15', title: 'SIG - DIOUF' },
        { day: 'Mercredi', date: '03/09/2025', start: '10:00', end: '11:15', title: 'SIG - DIOUF' },
        { day: 'Jeudi', date: '04/09/2025', start: '10:00', end: '11:15', title: 'SIG - DIOUF' },
        { day: 'Vendredi', date: '05/09/2025', start: '10:00', end: '11:15', title: 'SIG - DIOUF' },
        { day: 'Jeudi', date: '04/09/2025', start: '14:00', end: '15:15', title: 'Réf. Jur & Foncier - BOTREL' },
        { day: 'Vendredi', date: '05/09/2025', start: '14:00', end: '15:15', title: 'Réf. Jur & Foncier - GOUSSOUTOU' },
        { day: 'Vendredi', date: '05/09/2025', start: '15:30', end: '16:45', title: 'Géodésie - MOREL' }
    ],
    'CAL2': [],
    'CAL3': [],
    'CAL4': []
};*/

async function loadICSForCAL2() {
    try {
        const response = await fetch("https://dioufousmane.github.io/calendriermosae/mosae.ics"); // Ton vrai lien ici
        const icsText = await response.text();
        const parsedEvents = parseICS(icsText);
        events['CAL2'] = parsedEvents;
        createCalendarGrid();
    } catch (error) {
        console.error("Erreur de chargement du fichier CAL2.ics :", error);
    }
}

function parseICS(icsText) {
    const lines = icsText.split(/\r?\n/);
    const result = [];
    let current = {};

    lines.forEach(line => {
        if (line.startsWith("BEGIN:VEVENT")) {
            current = {};
        } else if (line.startsWith("DTSTART:")) {
            const date = parseICSTime(line.slice(8));
            current.date = formatDate(date);
            current.start = formatTime(date);
            current._jsDate = date; // pour récupérer le jour ensuite
        } else if (line.startsWith("DTEND:")) {
            const date = parseICSTime(line.slice(6));
            current.end = formatTime(date);
        } else if (line.startsWith("SUMMARY")) {
            const value = line.split(":").slice(1).join(":").trim();
            current.title = value;
        } else if (line.startsWith("DESCRIPTION")) {
            const value = line.split(":").slice(1).join(":").replace(/\\n/g, '\n').trim();
            current.description = value;
        } else if (line.startsWith("LOCATION")) {
            const value = line.split(":").slice(1).join(":").trim();
            current.location = value;
        } else if (line.startsWith("END:VEVENT")) {
            const weekdayIndex = current._jsDate.getDay(); // 0 = dimanche, 1 = lundi
            if (weekdayIndex >= 1 && weekdayIndex <= 5) {
                current.day = days[weekdayIndex - 1];
                result.push(current);
            }
        }
    });

    return result;
}

function parseICSTime(value) {
    const year = parseInt(value.slice(0, 4));
    const month = parseInt(value.slice(4, 6)) - 1;
    const day = parseInt(value.slice(6, 8));
    const hour = parseInt(value.slice(9, 11));
    const minute = parseInt(value.slice(11, 13));
    return new Date(Date.UTC(year, month, day, hour, minute)); // UTC → converti local
}

function formatTime(date) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
    return date.toLocaleDateString('fr-FR');
}

function createCalendarGrid() {
    const grid = document.getElementById("calendarGrid");
    grid.innerHTML = "";

    const currentWeekStart = new Date(baseDate);
    currentWeekStart.setDate(currentWeekStart.getDate() + currentWeekOffset * 7);

    grid.appendChild(document.createElement('div')); // coin vide

    days.forEach((day, index) => {
        const dayDate = new Date(currentWeekStart);
        dayDate.setDate(dayDate.getDate() + index);
        const formattedDate = dayDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit'
        });
        const div = document.createElement('div');
        div.className = "header";
        div.innerText = `${day} ${formattedDate}`;
        grid.appendChild(div);
    });

    const intervalsPerHour = 60 / interval;
    const totalRows = (endHour - startHour) * intervalsPerHour;

    for (let i = 0; i < totalRows; i++) {
        const hour = startHour + Math.floor(i * interval / 60);
        const minute = (i * interval) % 60;
        const timeLabel = document.createElement('div');
        timeLabel.className = "time-label";
        timeLabel.innerText = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        grid.appendChild(timeLabel);

        for (let d = 0; d < days.length; d++) {
            const cell = document.createElement('div');
            cell.dataset.day = days[d];
            cell.dataset.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            grid.appendChild(cell);
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
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

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

            const rowStart = Math.floor((startTotal - startHour * 60) / interval) + 1;
            const span = (endTotal - startTotal) / interval;
            const colIndex = days.indexOf(evt.day) + 2;

            const eventDiv = document.createElement('div');
            eventDiv.className = "event-block";
            eventDiv.classList.add(`event-${cal.toLowerCase()}`);
            eventDiv.style.gridColumn = colIndex;
            eventDiv.style.gridRow = `${rowStart + 1} / span ${span}`;
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
    if (name === "CAL2" && events["CAL2"].length === 0) {
        loadICSForCAL2();
    } else {
        createCalendarGrid();
    }
}

function refreshCalendar(name) {
    if (name === "CAL2") {
        loadICSForCAL2();
    } else {
        createCalendarGrid();
    }
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

function downloadICS(name) {
    window.location.href = `${name}.ics`;
}

window.onload = async () => {
    await loadICSForCAL2();
    createCalendarGrid();
};
