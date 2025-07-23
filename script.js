let calendar;
let allEvents = {
  esgt: [],
  univ: []
};

// Transforme un événement brut JSON vers FullCalendar
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
      maj: evt.maj
    },
    classNames: [`event-${source}`]
  };
}

// Détermine les bons fichiers JSON selon la page
function getEventFileNames() {
  const filename = window.location.pathname.split("/").pop();
  if (filename === "mosae2.html") {
    return ["esgt_events2.json", "univ_events2.json"];
  }
  // Par défaut (index.html ou autre)
  return ["esgt_events.json", "univ_events.json"];
}

// Initialise le calendrier
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
    calendar = new FullCalendar.Calendar(calendarEl, {
      locale: "fr",
      timeZone: "Europe/Paris",
      initialView: "timeGridWeek",
      nowIndicator: true,
      height: "100%",
      expandRows: true,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay"
      },
      events: [...allEvents.esgt, ...allEvents.univ],
      eventDidMount: function (info) {
        const { enseignant, salle, maj } = info.event.extendedProps;
        info.el.setAttribute(
          "title",
          `${info.event.title}\nEnseignant : ${enseignant}\nSalle : ${salle}\nMAJ : ${maj}`
        );
      },
      eventClick: function(info) {
        openModal(info.event);
      }
    });

    calendar.render();
  } catch (error) {
    console.error("Erreur de chargement des événements :", error);
  }
}

// Gère l’affichage dynamique des événements
function toggleCalendar(source) {
  const checkbox = document.getElementById(`toggle-${source}`);
  if (!checkbox || !calendar) return;

  const isChecked = checkbox.checked;
  if (isChecked) {
    allEvents[source].forEach(evt => calendar.addEvent(evt));
  } else {
    calendar.getEvents().forEach(e => {
      if (e.groupId === source) e.remove();
    });
  }
}

// Ouvre le modal avec les infos de l'événement
function openModal(event) {
  const modal = document.getElementById("eventModal");
  document.getElementById("modalTitle").textContent = event.title;

  const start = event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const end = event.end ? event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "";

  document.getElementById("modalTime").textContent = `🕒 De ${start} à ${end}`;
  document.getElementById("modalEnseignant").textContent = `👨‍🏫 Enseignant : ${event.extendedProps.enseignant}`;
  document.getElementById("modalSalle").textContent = `🏫 Salle : ${event.extendedProps.salle}`;
  document.getElementById("modalMaj").textContent = `⚡ Mise à jour : ${event.extendedProps.maj}`;

  modal.style.display = "flex";
}

// Ferme le modal
function closeModal() {
  const modal = document.getElementById("eventModal");
  modal.style.display = "none";
}

// Attache gestionnaires de fermeture du modal après chargement DOM
document.addEventListener("DOMContentLoaded", () => {
  initCalendar();

  const closeBtn = document.getElementById("modalClose");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  const modal = document.getElementById("eventModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
});
