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

        // Pas d'affichage d'heure
        const timeLabel = document.createElement('div');
        timeLabel.className = "time-label";
        timeLabel.innerText = "";
        grid.appendChild(timeLabel);

        for (let d = 0; d < days.length; d++) {
            ['ESGT', 'UNIV'].forEach(cal => {
                const cell = document.createElement('div');
                cell.dataset.day = days[d];
                cell.dataset.calendar = cal;
                cell.dataset.time = timeString;
                cell.classList.add(`col-${cal.toLowerCase()}`);
                grid.appendChild(cell);
            });
        }
    }

    renderEvents();
    updateWeekLabel();
}

function forceNoCacheReload() {
  // Affiche un message temporaire
  showTemporaryMessage("🔄 Rechargement en cours… (sans cache)");

  // Recharge la page en forçant le non-cache via un paramètre unique
  const url = new URL(window.location.href);
  url.searchParams.set('_', Date.now()); // Bypass cache

  setTimeout(() => {
    window.location.href = url.toString(); // Recharge avec nouvelle URL
  }, 1200); // Petite pause pour affichage UX
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

            const baseCol = days.indexOf(evt.day) * 2 + (cal === "ESGT" ? 0 : 1);

            const eventDiv = document.createElement('div');
            eventDiv.className = "event-block";
            eventDiv.classList.add(`event-${cal.toLowerCase()}`);
            eventDiv.style.gridColumn = baseCol + 2;
            eventDiv.style.gridRow = `${rowStart + 2} / span ${span}`;
            eventDiv.innerHTML = `
                <i class="fas fa-book"></i> ${evt.title}<br><br>
                <i class="fas fa-chalkboard-teacher"></i> Enseignant : ${evt.enseignant}<br><br>
                <i class="fas fa-door-open"></i> Salle : ${evt.salle}<br><br>
                <h3><strong><i class="fas fa-clock"></i> ${evt.start} - ${evt.end}</strong></h3><br><br>
                <i class="fas fa-sync-alt"></i> Dernière mise à jour : ${evt.maj}
            `;
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
function prevWeek() {
    if (currentWeekOffset > 0) {
      currentWeekOffset--;
      createCalendarGrid();
      highlightSelectedWeek();
    }
  }
  
  function nextWeek() {
    currentWeekOffset++;
    createCalendarGrid();
    highlightSelectedWeek();
  }
  function highlightSelectedWeek() {
    const allCells = document.querySelectorAll(".week-cell");
    allCells.forEach(cell => cell.classList.remove("selected"));
  
    const currentCell = document.querySelector(`.week-cell[data-index="${currentWeekOffset}"]`);
    if (currentCell) {
      currentCell.classList.add("selected");
      // Scroll auto si weekSelector overflow-x
      currentCell.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }
  

function goToCurrentWeek() {
    currentWeekOffset = 0;
    createCalendarGrid();
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

window.onload = () => {
    createCalendarGrid();
};


const baseWeekNumber = 35;
const weekSelector = document.getElementById("weekSelector");

function generateWeekSelector() {
  const weeks = [];

  // Semaines de fin août à juillet suivant
  for (let i = 0; i < 52; i++) {
    const weekNumber = (baseWeekNumber + i - 1) % 52 + 1;
    weeks.push(weekNumber);
  }

  weeks.forEach((week, index) => {
    const cell = document.createElement("div");
    cell.classList.add("week-cell");
    cell.innerText = week;
    cell.dataset.index = index;

    cell.onclick = () => {
      document.querySelectorAll(".week-cell").forEach(c => c.classList.remove("selected"));
      cell.classList.add("selected");

      currentWeekOffset = index;
      createCalendarGrid(); // ← ta fonction existante
    };

    weekSelector.appendChild(cell);
  });

  // Sélection initiale
  const currentCell = weekSelector.querySelector(`[data-index="0"]`);
  if (currentCell) currentCell.classList.add("selected");
}

window.onload = () => {
  generateWeekSelector();
  createCalendarGrid(); // existant
};

function goToToday() {
    const today = new Date();
    const base = new Date(baseDate); // baseDate = 1er septembre 2025
    const diffDays = Math.floor((today - base) / (1000 * 60 * 60 * 24));
    const newOffset = Math.floor(diffDays / 7);

    currentWeekOffset = newOffset;
    createCalendarGrid();

    // Optionnel : scroll semaine dans le sélecteur si présent
    highlightSelectedWeek();
}

