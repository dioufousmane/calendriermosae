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
      allDaySlot: false, // 👈 Empêche l’affichage du slot "toute la journée"
      timeZone: "Europe/Paris",
      slotMinTime: "06:00:00",
      slotMaxTime: "19:00:00",
      initialView: "timeGridWeek",
      firstDay: 1, // 👈 démarre le calendrier par un lundi
      nowIndicator: true,
      hiddenDays: [0, 6], // 0 = dimanche, 6 = samedi
      height: "100%",
      expandRows: true,
      headerToolbar: {
        left: "listMonth,listWeek,listDay",
        center: "prev title next today",
        right: "dayGridMonth,timeGridWeek,timeGridDay"
      },      
      buttonText: {
        today: "Aujourd'hui",   
        day: "Vue journée",
        week: "Vue semaine",
        month: "Vue mois",
        listWeek: "Liste semaine",
        listDay: "Liste journée",
        listMonth: "Liste mois"
      },
      initialDate: initialDate,
      events: [...allEvents.esgt, ...allEvents.univ],
      eventDidMount: info => {
        const { enseignant, salle, maj } = info.event.extendedProps;
        info.el.setAttribute("title",
          `${info.event.title}\n 👨‍🏫 Enseignant : ${enseignant}\n 🏫 Salle : ${salle}\n ⚡MAJ : ${maj}`);
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
    // 📊 Bouton de récapitulatif
// 📊 Bouton de récapitulatif (à gauche du bouton "prev")
const recapButton = document.createElement("button");
recapButton.textContent = "📊 Récapitulatif";
recapButton.classList.add("fc-button", "fc-button-primary");

setTimeout(() => {
  const centerChunk = document.querySelector(".fc-toolbar-chunk:nth-child(2)");
  const prevBtn = centerChunk?.querySelector(".fc-prev-button");

  if (centerChunk && prevBtn) {
    centerChunk.insertBefore(recapButton, prevBtn);
  }
}, 0);


// Ouvrir le récapitulatif
recapButton.addEventListener("click", () => {
  const visibleEvents = calendar.getEvents();
  const mode = calendar.view.type;

  let startDate = new Date(calendar.view.currentStart);
  let endDate = new Date(calendar.view.currentEnd);

  // Ajustement si vue "jour"
  if (mode.includes("Day")) {
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);
  }

  const summary = {};

  visibleEvents.forEach(evt => {
    const eventStart = new Date(evt.start);
    const eventEnd = new Date(evt.end);
  
    if (eventEnd <= startDate || eventStart >= endDate) return;
  
    const durationHours = (eventEnd - eventStart) / (1000 * 60 * 60);
  
    // 🧼 Nettoyage du nom
    const rawTitle = evt.title;
    let cleanTitle = rawTitle.toLowerCase()
      .replace(/^(cm|td)\s+/i, "")                // supprime préfixes
      .replace(/(cm|td)/gi, "")                   // supprime suffixes
      .replace(/insertion pro(fes+ion+)?nelle?/i, "insertion professionnelle")
      .replace(/asso\s+egee/i, "")                // optionnel
      .replace(/\s+/g, " ")                       // espaces multiples
      .trim();                                    // trim
  
    // Capitalisation
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  
    const key = `${cleanTitle}__${evt.groupId}`;
  
    if (!summary[key]) {
      summary[key] = {
        title: cleanTitle,
        group: evt.groupId,
        total: 0
      };
    }
  
    summary[key].total += durationHours;
  });
  
  showRecapModal(summary, mode);
});


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
  const recapStyles = document.createElement("style");
recapStyles.innerHTML = `
  #recapModal h3 {
    font-size: 1.5em;
    color: #333;
    margin-bottom: 5px;
  }

  #recapModal table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    font-size: 0.95em;
    background: #f9f9f9;
    border-radius: 6px;
    overflow: hidden;
  }

  #recapModal th, #recapModal td {
    padding: 10px;
    text-align: left;
  }

  #recapModal th {
    background-color: #e0e0e0;
    font-weight: 600;
    color: #333;
  }

  #recapModal tr:nth-child(even) td {
    background-color: #f1f1f1;
  }

  #recapModal button {
    transition: background-color 0.3s ease;
  }

  #recapModal button:hover {
    filter: brightness(1.1);
  }

  #recapModal .chart-container canvas {
    margin: 20px auto 10px auto;
    display: block;
    max-width: 300px;
    max-height: 300px;
  }

  #recapModal .tab-button {
    font-size: 1em;
    padding: 10px;
    border: none;
    border-radius: 4px 4px 0 0;
    margin-right: 5px;
    cursor: pointer;
    background-color: #dcdcdc;
    color: #333;
  }

  #recapModal .tab-button.active {
    background-color: #007bff;
    color: white;
  }

  #recapModal .date-range {
    font-style: italic;
    margin-bottom: 12px;
    color: #555;
  }
`;
document.head.appendChild(recapStyles);

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
const workflowId = "all_events.yml";
const ref = "master";

const button = document.getElementById("triggerWorkflowBtn");
const status = document.getElementById("workflowStatus");
const progressBar = document.getElementById("progressBar");

const COOLDOWN_DURATION = 2 * 60 * 60 * 1000;       // 2 heures
const PROGRESS_BAR_DURATION = 2 * 60 * 1000;       // 2 minutes

function startProgressAnimation(startTime, endTime) {
  const total = endTime - startTime;

  function update() {
    const now = Date.now();
    const percent = Math.min(((now - startTime) / total) * 100, 100);
    progressBar.style.width = `${percent}%`;

    if (percent < 100) {
      requestAnimationFrame(update);
    }
  }

  update();
}

function checkCooldown() {
  const nextAllowedTime = localStorage.getItem("nextWorkflowTrigger");
  const now = Date.now();

  if (nextAllowedTime && now < parseInt(nextAllowedTime)) {
    button.disabled = true;

    const next = parseInt(nextAllowedTime);
    const barStart = next - COOLDOWN_DURATION;
    const barEnd = Math.min(barStart + PROGRESS_BAR_DURATION, next);

    startProgressAnimation(barStart, barEnd);
    return true;
  }

  progressBar.style.width = "0%";
  return false;
}



// 🟢 Au chargement
checkCooldown();

button.addEventListener("click", async () => {
  button.disabled = true;
  status.classList.remove("success", "error");
  status.className = "running";
  status.textContent = "⏳ En cours...";

  try {
    const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`, // 👈 Assurez-vous que `token` est défini
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ref })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Échec GitHub API : ${resp.status} ${errText}`);
    }

    // ✅ Sauvegarde du cooldown
    const now = Date.now();
    const next = now + COOLDOWN_DURATION;
    localStorage.setItem("nextWorkflowTrigger", next.toString());

    // ⏳ Démarre la barre de 10 min
    startProgressAnimation(now, now + PROGRESS_BAR_DURATION);

    // 🔄 Rechargement automatique dans 2 minutes
status.className = "success";
let remaining = 120; // ⏱️ 2 minutes (au lieu de 600)

// 💬 Compte à rebours visuel
const interval = setInterval(() => {
  remaining--;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const pad = (n) => n.toString().padStart(2, "0");

  status.textContent = `✅ Effectué. Rechargement de la page dans ${pad(min)}:${pad(sec)}...`;

  if (remaining <= 0) {
    clearInterval(interval);
    window.location.href = window.location.href;
  }
}, 1000);

  } catch (err) {
    console.error(err);
    status.className = "error";
    status.textContent = `❌ Erreur : ${err.message}`;
    button.disabled = false;
    progressBar.style.width = "0%";
  }
});

document.getElementById("forceReloadBtn").addEventListener("click", () => {
  window.location.reload(true);
});
const toggleBtn = document.getElementById("themeToggleBtn");

// Appliquer le thème au chargement si déjà stocké
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  toggleBtn.textContent = "☀️ Mode clair";
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  toggleBtn.textContent = isDark ? "☀️ Mode clair" : "🌙 Mode sombre";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Récupère la semaine ISO actuelle au format "YYYY-WW"
function getCurrentISOWeek() {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  return `${now.getFullYear()}-${week.toString().padStart(2, '0')}`;
}

// Ajout du bouton "Télécharger"
const dlBtn = document.createElement("button");
dlBtn.textContent = "📥 Télécharger les EDT en PDF";
dlBtn.id = "downloadEdtBtn";
document.querySelector(".calendar-controls").appendChild(dlBtn);

dlBtn.addEventListener("click", () => {
  // Vérification de la vue
  const currentView = calendar.view.type;

  // Les vues "semaine" valides selon FullCalendar
  const validWeekViews = ["timeGridWeek", "dayGridWeek", "week"];

  if (!validWeekViews.includes(currentView)) {
    showPopupMessage('Veuillez sélectionner la "Vue semaine" svp.');
    return; // On stoppe la suite
  }

  openWeekSelectionModal();
});

function showPopupMessage(message) {
  // Si popup déjà présent, on sort
  if (document.getElementById("customPopupMessage")) return;

  const overlay = document.createElement("div");
  overlay.id = "customPopupMessage";
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0, left: 0,
    width: "100%", height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  });

  const box = document.createElement("div");
  Object.assign(box.style, {
    backgroundColor: "#fff",
    padding: "20px 30px",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.3)",
    maxWidth: "300px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    color: "#333"
  });

  const text = document.createElement("p");
  text.textContent = message;

  const btn = document.createElement("button");
  btn.textContent = "OK";
  Object.assign(btn.style, {
    marginTop: "15px",
    padding: "8px 16px",
    border: "none",
    backgroundColor: "#007bff",
    color: "white",
    borderRadius: "4px",
    cursor: "pointer"
  });

  btn.onclick = () => {
    document.body.removeChild(overlay);
  };

  box.appendChild(text);
  box.appendChild(btn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}


function openWeekSelectionModal() {
  const modal = document.createElement("div");
  modal.id = "weekSelectionOverlay";

  const box = document.createElement("div");
  box.id = "weekSelectionModal";

  const title = document.createElement("h3");
  title.textContent = "📅 Sélectionnez les semaines à inclure";
  box.appendChild(title);

  const select = document.getElementById("weekSelect");
  const options = [...select.options];
  const currentWeek = getDisplayedWeek();

  // 🧭 Orientation du PDF
  const orientationLabel = document.createElement("label");
  orientationLabel.textContent = "Orientation du PDF : ";
  orientationLabel.style.display = "block";
  orientationLabel.style.margin = "10px 0 4px";

  const orientationSelect = document.createElement("select");
  orientationSelect.id = "pdfOrientation";

  const portraitOption = document.createElement("option");
  portraitOption.value = "portrait";
  portraitOption.textContent = "Portrait";

  const paysageOption = document.createElement("option");
  paysageOption.value = "paysage";
  paysageOption.textContent = "Paysage";

  const isMobile = window.innerWidth < 768;
  orientationSelect.appendChild(portraitOption);
  orientationSelect.appendChild(paysageOption);
  orientationSelect.value = isMobile ? "portrait" : "paysage";

  box.appendChild(orientationLabel);
  box.appendChild(orientationSelect);

  // 🗓️ Liste des semaines
  const list = document.createElement("div");
  list.id = "weekSelectionList";

  const currentWeekLabel = document.createElement("div");
  currentWeekLabel.textContent = "Semaine en cours";
  currentWeekLabel.style.fontWeight = "bold";
  currentWeekLabel.style.marginBottom = "6px";
  list.appendChild(currentWeekLabel);

  const currentLabel = document.createElement("label");
  currentLabel.style.color = "#999";

  const currentCheckbox = document.createElement("input");
  currentCheckbox.type = "checkbox";
  currentCheckbox.value = currentWeek;
  currentCheckbox.checked = true;
  currentLabel.appendChild(currentCheckbox);

  currentLabel.appendChild(document.createTextNode(` Semaine ${currentWeek.split("-")[1]} (${currentWeek})`));
  list.appendChild(currentLabel);

  const separator = document.createElement("hr");
  separator.style.margin = "8px 0";
  list.appendChild(separator);

  options.forEach(opt => {
    if (opt.value === currentWeek) return;

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = opt.value;
    checkbox.checked = false;
    label.appendChild(checkbox);
    label.append(` ${opt.textContent}`);
    list.appendChild(label);
  });

  box.appendChild(list);

  const actions = document.createElement("div");
  actions.className = "modal-actions";

  const confirmBtn = document.createElement("button");
  confirmBtn.className = "confirm";
  confirmBtn.textContent = "📄 Générer PDF";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "cancel";
  cancelBtn.textContent = "Annuler";

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  box.appendChild(actions);
  modal.appendChild(box);
  document.body.appendChild(modal);

  cancelBtn.onclick = () => modal.remove();

  function sortWeeksChronologically(weeks) {
    return weeks.sort((a, b) => {
      const [yearA, weekA] = a.split("-").map(Number);
      const [yearB, weekB] = b.split("-").map(Number);
  
      if (yearA !== yearB) return yearA - yearB;
      return weekA - weekB;
    });
  }
  
  confirmBtn.onclick = async () => {
    const checked = box.querySelectorAll("input[type='checkbox']:checked");
    if (checked.length === 0) return alert("Veuillez choisir au moins une semaine.");
  
    const selectedWeeks = [...checked].map(cb => cb.value);
    const sortedWeeks = sortWeeksChronologically(selectedWeeks);
  
    const orientation = document.getElementById("pdfOrientation").value;
    modal.remove();
  
    await downloadPdfForWeeks(sortedWeeks, orientation);
  };
  
}

// 🔎 Récupère la légende en fonction des filtres actifs
function getActiveCalendarsLegend() {
  const legend = [];
  const isESGT = document.getElementById("toggle-esgt")?.checked ?? true;
  const isUNIV = document.getElementById("toggle-univ")?.checked ?? true;

  if (isESGT) legend.push({ label: "ESGT", color: "#2e7d32" });
  if (isUNIV) legend.push({ label: "UNIV", color: "#007bff" });

  return legend;
}

// 🔎 Récupère le titre visible dans le <h2> (ex: "Calendrier du MOSAE 1 – …")
function getPageTitleForPdf() {
  const h2 = document.querySelector("h2");
  if (!h2) return "edt";

  const rawText = h2.childNodes[1]?.textContent || h2.textContent || "";
  const match = rawText.match(/MOSAE\s+\d+/i);
  const mosTitle = match ? match[0].replace(/\s+/g, "_").toLowerCase() : "edt";

  return `calendrier_${mosTitle}`;
}

function getPageTitleForDisplay() {
  const h2 = document.querySelector("h2");
  if (!h2) return "MOSAE";

  const rawText = h2.childNodes[1]?.textContent || h2.textContent || "";
  const match = rawText.match(/MOSAE\s+\d+/i);
  return match ? match[0].trim() : "MOSAE";
}

// 📸 Chemins des logos
const logoESGT = "https://dioufousmane.github.io/calendriermosae/img/esgt.png";
const logoUNIV = "https://dioufousmane.github.io/calendriermosae/img/lemans.png";

// 📥 Fonction principale de génération PDF
async function downloadPdfForWeeks(selectedWeeks, orientation = "paysage") {
  const { jsPDF } = window.jspdf;
  const margin = 15; // marge de 15mm de chaque côté
  const pdf = new jsPDF(orientation === "portrait" ? "portrait" : "landscape", "mm", "a4");
  const originalScroll = window.scrollY;
  const body = document.body;
  const hadDarkMode = body.classList.contains("dark-mode");

  // Forcer le mode clair
  body.classList.remove("dark-mode");

  for (let i = 0; i < selectedWeeks.length; i++) {
    // 🖋️ Copyright en bas de page
const footerText = "© https://dioufousmane.github.io/calendriermosae";
const pageWidth = pdf.internal.pageSize.getWidth();
const pageHeight = pdf.internal.pageSize.getHeight();

pdf.setFontSize(9);
pdf.setTextColor(120); // gris doux
pdf.setFont("helvetica", "italic");
pdf.text(footerText, pageWidth / 2, pageHeight - 7, { align: "center" });

    const [year, week] = selectedWeeks[i].split("-").map(Number);
    const date = getDateOfISOWeek(week, year);

    calendar.setOption("slotMinTime", "08:00:00");
    calendar.setOption("slotMaxTime", "18:30:00");
    calendar.gotoDate(date);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const calendarEl = document.getElementById("calendar");
    calendarEl.style.minHeight = "900px";

    const canvas = await html2canvas(calendarEl, {
      backgroundColor: null,
      scale: 2,
      useCORS: true
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = canvas.height * (pdfWidth / canvas.width);

    if (i !== 0) pdf.addPage();

    // 🧾 Titre en haut du PDF
    const title = getPageTitleForDisplay();
    pdf.setFontSize(22);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, pdfWidth / 2, 15, { align: "center" });

    // 🖼️ Logos
    const logoWidth = 30;
    const logoHeight = 15;

    await new Promise(resolve => {
      const imgESGT = new Image();
      imgESGT.crossOrigin = "anonymous";
      imgESGT.src = logoESGT;
      imgESGT.onload = () => {
        pdf.addImage(imgESGT, "PNG", 15, 5, logoWidth, logoHeight);
        resolve();
      };
      imgESGT.onerror = () => resolve();
    });

    await new Promise(resolve => {
      const imgUNIV = new Image();
      imgUNIV.crossOrigin = "anonymous";
      imgUNIV.src = logoUNIV;
      imgUNIV.onload = () => {
        pdf.addImage(imgUNIV, "PNG", pdfWidth - 15 - logoWidth, 5, logoWidth, logoHeight);
        resolve();
      };
      imgUNIV.onerror = () => resolve();
    });

    const zoom = 1.1; // 5% plus grand

    const usableWidth = (pdf.internal.pageSize.getWidth() - margin * 2) * zoom;
    const scaledHeight = canvas.height * (usableWidth / canvas.width);
    
    // Centrer horizontalement si l'image dépasse un peu
    const x = (pdf.internal.pageSize.getWidth() - usableWidth) / 2;
    
    pdf.addImage(imgData, "PNG", x, 25, usableWidth, scaledHeight);
    


    // 📌 Légende dynamique
    const legend = getActiveCalendarsLegend();
    const startY = imgHeight + 28;
    const iconSize = 6;
    const spacing = 65;

    legend.forEach((item, index) => {
      const x = 15 + index * spacing;
      pdf.setFillColor(item.color);
      pdf.rect(x, startY, iconSize, iconSize, "F");
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
      pdf.text(item.label, x + iconSize + 4, startY + iconSize - 1);
    });
  }
  if (hadDarkMode) {
    body.classList.add("dark-mode");
  }


  window.scrollTo(0, originalScroll);

  const baseTitle = getPageTitleForPdf();
  pdf.save(`${baseTitle}_${selectedWeeks.join("_")}.pdf`);
  
};
function getDisplayedWeek() {
  const displayedDate = calendar.getDate(); // Date affichée dans le calendrier
  const year = displayedDate.getFullYear();
  const week = getISOWeekNumber(displayedDate);
  return `${year}-${week.toString().padStart(2, '0')}`;
}

function getISOWeekNumber(date) {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  // Jeudi de la semaine pour ISO (la semaine commence lundi)
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function showRecapModal(summaryData, mode) {
    const body = document.body;
  const hadDarkMode = body.classList.contains("dark-mode");
  body.classList.remove("dark-mode"); // On force le mode clair pour la modale

  
  const existing = document.getElementById("recapModal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "recapModal";
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0, left: 0,
    width: "100%", height: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  });

  const box = document.createElement("div");
  Object.assign(box.style, {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    maxWidth: "700px",
    width: "95%",
    maxHeight: "90%",
    overflowY: "auto",
    fontFamily: "Arial, sans-serif"
  });

  const title = document.createElement("h3");
  title.textContent = `⏱️ Récapitulatif des heures (${mode.includes("Month") ? "mois" : mode.includes("Day") ? "jour" : "semaine"})`;
  title.style.marginBottom = "10px";
  box.appendChild(title);
  // 📆 Affichage de la période visible
const dateRange = document.createElement("div");
dateRange.style.marginBottom = "15px";
dateRange.style.fontStyle = "italic";
dateRange.style.color = "#555";

const view = calendar.view;
const start = view.currentStart;
const end = new Date(view.currentEnd.getTime() - 1); // Pour inclure le dernier jour

function formatDate(d) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatShort(d) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

let rangeText = "";

if (mode.includes("Month")) {
  rangeText = `${start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`;
} else if (mode.includes("Day")) {
  rangeText = `${formatDate(start)}`;
} else {
  rangeText = `Semaine du ${formatShort(start)} au ${formatShort(end)}`;
}

dateRange.textContent = `📅 ${rangeText}`;
box.appendChild(dateRange);


  // Onglets
  const tabContainer = document.createElement("div");
  tabContainer.style.display = "flex";
  tabContainer.style.marginBottom = "15px";

  const tabESGT = document.createElement("button");
  const tabUNIV = document.createElement("button");

  [tabESGT, tabUNIV].forEach(btn => {
    Object.assign(btn.style, {
      flex: 1,
      padding: "10px",
      border: "none",
      cursor: "pointer",
      fontWeight: "bold",
      color: "white"
    });
  });
  tabESGT.classList.add("tab-button");
tabUNIV.classList.add("tab-button");

tabESGT.classList.add("active"); // par défaut

tabESGT.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ESGT`;
tabESGT.style.backgroundColor = "#28a745";

tabUNIV.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> UNIV`;
tabUNIV.style.backgroundColor = "#007bff";


  tabContainer.appendChild(tabESGT);
  tabContainer.appendChild(tabUNIV);
  tabESGT.onclick = () => {
    tabESGT.classList.add("active");
    tabUNIV.classList.remove("active");
    renderTable("esgt");
  };
  
  tabUNIV.onclick = () => {
    tabUNIV.classList.add("active");
    tabESGT.classList.remove("active");
    renderTable("univ");
  };
  
  box.appendChild(tabContainer);

  const content = document.createElement("div");
  content.id = "recapContent";
  box.appendChild(content);

  const closeBtn = document.createElement("button");
closeBtn.textContent = "Fermer";
closeBtn.style.marginTop = "20px";
closeBtn.style.padding = "8px 16px";
closeBtn.style.background = "#6c757d";
closeBtn.style.color = "white";
closeBtn.style.border = "none";
closeBtn.style.borderRadius = "5px";
closeBtn.style.cursor = "pointer";

closeBtn.onclick = () => {
  overlay.remove();

  // 🌓 Remettre le dark mode après un petit délai
  setTimeout(() => {
    if (hadDarkMode) {
      body.classList.add("dark-mode");
    }
  }, 100);
};


  box.appendChild(closeBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function renderTable(groupId) {
    const filtered = Object.values(summaryData).filter(item => item.group === groupId);
    if (filtered.length === 0) {
      content.innerHTML = `<p style="color:#666;">Aucune donnée à afficher pour ${groupId.toUpperCase()}.</p>`;
      return;
    }

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.innerHTML = `
      <thead>
        <tr>
          <th style="border-bottom: 1px solid #ccc; text-align: left;">Matière</th>
          <th style="border-bottom: 1px solid #ccc; text-align: center;">Heures</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(item => `
          <tr>
            <td style="padding: 6px 0;">${item.title}</td>
            <td style="text-align: center;">${item.total.toFixed(2)}</td>
          </tr>
        `).join("")}
      </tbody>
    `;

    const chartBtn = document.createElement("button");
    chartBtn.textContent = "📈 Diagramme";
    chartBtn.style.marginTop = "15px";
    chartBtn.style.padding = "6px 12px";
    chartBtn.style.background = groupId === "esgt" ? "#28a745" : "#007bff";
    chartBtn.style.color = "white";
    chartBtn.style.border = "none";
    chartBtn.style.borderRadius = "5px";
    chartBtn.style.cursor = "pointer";

    const chartContainer = document.createElement("div");
    chartContainer.style.marginTop = "10px";

    chartBtn.onclick = () => renderChart(groupId, filtered, chartContainer);
    
    content.innerHTML = "";
    content.appendChild(table);
    content.appendChild(chartBtn);
    content.appendChild(chartContainer);
  }

  function renderChart(groupId, data, container) {
  container.innerHTML = "";

  // 🧱 Conteneur flex pour le graphique + légende
  const chartWrapper = document.createElement("div");
  chartWrapper.style.display = "flex";
  chartWrapper.style.alignItems = "center";
  chartWrapper.style.justifyContent = "center";
  chartWrapper.style.gap = "20px"; // espace entre le graphe et la légende
  chartWrapper.style.flexWrap = "wrap"; // permet le passage en colonne sur petits écrans

  // 📊 Canvas pour le camembert
  const canvas = document.createElement("canvas");
  canvas.id = `chart-${groupId}`;
  canvas.style.width = "350px";
  canvas.style.height = "350px";

  chartWrapper.appendChild(canvas);
  container.appendChild(chartWrapper);

  const ctx = canvas.getContext("2d");

  const chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: data.map(e => e.title),
      datasets: [{
        label: "Heures",
        data: data.map(e => e.total.toFixed(2)),
        backgroundColor: data.map((_, i) =>
          `hsl(${(i * 50) % 360}, 70%, 60%)`
        )
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // On cache la légende native
        },
        title: {
          display: true,
          text: `Répartition – ${groupId.toUpperCase()}`,
          font: {
            size: 16
          }
        }
      }
    }
  });

  // 📋 Légende personnalisée à droite
  const legendContainer = document.createElement("div");
  legendContainer.style.display = "flex";
  legendContainer.style.flexDirection = "column";
  legendContainer.style.fontSize = "0.9em";
  legendContainer.style.maxWidth = "250px";

  data.forEach((e, i) => {
    const legendItem = document.createElement("div");
    legendItem.style.display = "flex";
    legendItem.style.alignItems = "center";
    legendItem.style.marginBottom = "5px";

    const colorBox = document.createElement("span");
    colorBox.style.display = "inline-block";
    colorBox.style.width = "12px";
    colorBox.style.height = "12px";
    colorBox.style.backgroundColor = chart.data.datasets[0].backgroundColor[i];
    colorBox.style.marginRight = "8px";
    colorBox.style.borderRadius = "2px";

    const labelText = document.createElement("span");
    labelText.textContent = `${e.title} (${e.total.toFixed(2)}h)`;

    legendItem.appendChild(colorBox);
    legendItem.appendChild(labelText);
    legendContainer.appendChild(legendItem);
  });

  chartWrapper.appendChild(legendContainer);
}


  renderTable("esgt");

  tabESGT.onclick = () => renderTable("esgt");
  tabUNIV.onclick = () => renderTable("univ");
}
