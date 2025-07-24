let calendar;
let allEvents = {
  esgt: [],
  univ: []
};

function transformEvent(evt, source) {
  const [d, m, y] = evt.date.split("/").map(Number);
  const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return {
    title: evt.title,
    start: `${date}T${evt.start}`,
    end: `${date}T${evt.end}`,
    groupId: source,
    extendedProps: {
      enseignant: evt.enseignant,
      salle: evt.salle,
      maj: evt.maj,
      startRaw: evt.start,
      endRaw: evt.end
    },
    classNames: [`event-${source}`]
  };
}

function getEventFileNames() {
  const filename = window.location.pathname.split("/").pop();
  if (filename === "mosae2.html") {
    return ["esgt_events2.json", "univ_events2.json"];
  }
  return ["esgt_events.json", "univ_events.json"];
}

function getISOWeekNumber(date) {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
  const yearStart = new Date(tmp.getFullYear(), 0, 1);
  return Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
}

function getDateOfISOWeek(week, year) {
  const simple = new Date(Date.UTC(year, 0, 4)); // 4 janvier = toujours dans la semaine 1 ISO
  const dayOfWeek = simple.getUTCDay() || 7;
  const monday = new Date(simple);
  monday.setUTCDate(simple.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}


function generateWeekOptions() {
  const select = document.getElementById("weekSelect");
  if (!select) return;

  let currentDate = new Date(2025, 8, 1); // 1 sept 2025 (mois=8)
  for (let i = 0; i < 52; i++) {
    const week = getISOWeekNumber(currentDate);
    const year = currentDate.getFullYear();

    const option = document.createElement("option");
    option.value = `${year}-${String(week).padStart(2, "0")}`;
    option.textContent = `Semaine ${week} (${year})`;
    select.appendChild(option);

    currentDate.setDate(currentDate.getDate() + 7);
  }

  // Sélection automatique
  const today = new Date();
  const currWeek = getISOWeekNumber(today);
  const currYear = today.getFullYear();
  const val = `${currYear}-${String(currWeek).padStart(2, "0")}`;
  if ([...select.options].some(o => o.value === val)) {
    select.value = val;
  } else {
    select.value = "2025-36";
  }
}

async function initCalendar() {
  try {
    const [esgtFile, univFile] = getEventFileNames();

    const [esgtData, univData] = await Promise.all([
      fetch(esgtFile).then(r => r.json()),
      fetch(univFile).then(r => r.json())
    ]);

    allEvents.esgt = esgtData.map(evt => transformEvent(evt, "esgt"));
    allEvents.univ = univData.map(evt => transformEvent(evt, "univ"));

    const calendarEl = document.getElementById("calendar");

    generateWeekOptions();

    const weekSelect = document.getElementById("weekSelect");
    let [defaultYear, defaultWeek] = weekSelect.value.split("-").map(Number);
    let initialDate = getDateOfISOWeek(defaultWeek, defaultYear);

    calendar = new FullCalendar.Calendar(calendarEl, {
      locale: "fr",
      timeZone: "Europe/Paris",
      initialView: "timeGridWeek",
      firstDay: 1, // 👈 démarre le calendrier par un lundi
      nowIndicator: true,
      height: "100%",
      expandRows: true,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay"
      },
      initialDate: initialDate,
      events: [...allEvents.esgt, ...allEvents.univ],
      eventDidMount: info => {
        const { enseignant, salle, maj } = info.event.extendedProps;
        info.el.setAttribute("title",
          `${info.event.title}\nEnseignant : ${enseignant}\nSalle : ${salle}\nMAJ : ${maj}`);
      },
      eventClick: info => openModal(info.event),
      datesSet: info => {
        const date = info.start;
        const week = getISOWeekNumber(date);
        const year = date.getFullYear();
        const val = `${year}-${String(week).padStart(2, "0")}`;
        if (weekSelect.value !== val) {
          if ([...weekSelect.options].some(o => o.value === val)) {
            weekSelect.value = val;
          }
        }
      }
    });

    calendar.render();

    weekSelect.addEventListener("change", () => {
      const [y, w] = weekSelect.value.split("-").map(Number);
      const date = getDateOfISOWeek(w, y);
      calendar.gotoDate(date);
    });

  } catch (error) {
    console.error("Erreur de chargement des événements :", error);
  }
}

function openModal(event) {
  const modal = document.getElementById("eventModal");
  const titleEl = document.getElementById("modalTitle");
  
  titleEl.textContent = event.title;
  
  // Définir la couleur de fond selon le groupe
  let bgColor = "";
  if (event.groupId === "esgt") {
    bgColor = "#28a745";  // vert ESGT
  } else if (event.groupId === "univ") {
    bgColor = "#007bff";  // bleu UNIV
  }
  
  // Appliquer la couleur de fond + un peu de style
  titleEl.style.backgroundColor = bgColor;
  titleEl.style.color = "white";
  titleEl.style.padding = "8px 12px";
  titleEl.style.borderRadius = "4px";
  titleEl.style.display = "inline-block";
  
  document.getElementById("modalTime").textContent = `🕒 De ${event.extendedProps.startRaw} à ${event.extendedProps.endRaw}`;
  document.getElementById("modalEnseignant").textContent = `👨‍🏫 Enseignant : ${event.extendedProps.enseignant}`;
  document.getElementById("modalSalle").textContent = `🏫 Salle : ${event.extendedProps.salle}`;
  document.getElementById("modalMaj").textContent = `⚡ Mise à jour : ${event.extendedProps.maj}`;
  
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("eventModal");
  modal.style.display = "none";
}

function toggleCalendar(source) {
  const checkbox = document.getElementById(`toggle-${source}`);
  if (!checkbox || !calendar) return;

  if (checkbox.checked) {
    allEvents[source].forEach(evt => calendar.addEvent(evt));
  } else {
    calendar.getEvents().forEach(e => {
      if (e.groupId === source) e.remove();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initCalendar();

  const closeBtn = document.getElementById("modalClose");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  const modal = document.getElementById("eventModal");
  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal();
    });
  }
});

const token = "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"; // 👉 Ton token GitHub personnel ici
const owner = "dioufousmane";
const repo = "calendriermosae";
const workflowId = "all_events.yml"; // ou l'ID numérique
const ref = "master";

const button = document.getElementById("triggerWorkflowBtn");
const status = document.getElementById("workflowStatus");

button.addEventListener("click", async () => {
  button.disabled = true;
  status.classList.remove("success", "error");
  status.className = "running";
  status.textContent = "⏳ Déclenchement du workflow...";

  try {
    const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ref })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Échec GitHub API : ${resp.status} ${errText}`);
    }

    // ✅ Déclenchement réussi : démarrer le chrono de 5 minutes
    status.className = "success";
    let remaining = 300; // secondes
    const interval = setInterval(() => {
      remaining--;
      const min = Math.floor(remaining / 60);
      const sec = remaining % 60;
      const pad = (n) => n.toString().padStart(2, "0");

      status.textContent = `✅ Déclenchement réussi. Rechargement dans ${pad(min)}:${pad(sec)}...`;

      if (remaining <= 0) {
        clearInterval(interval);
        // 🔄 Recharger sans cache
        window.location.href = window.location.href;
      }
    }, 1000);
  } catch (err) {
    console.error(err);
    status.className = "error";
    status.textContent = `❌ Erreur : ${err.message}`;
    button.disabled = false;
  }
});
