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
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay"
    },
      buttonText: {
        today: "Ajourd''hui",
        day: 'Jour',
        week:'Semaine',
        month:'Mois'
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
dlBtn.textContent = "📥 Télécharger le / les EDT";
dlBtn.id = "downloadEdtBtn";
document.querySelector(".calendar-controls").appendChild(dlBtn);

dlBtn.addEventListener("click", () => {
  // Vérification de la vue
  const currentView = calendar.view.type;

  // Les vues "semaine" valides selon FullCalendar
  const validWeekViews = ["timeGridWeek", "dayGridWeek", "week"];

  if (!validWeekViews.includes(currentView)) {
    showPopupMessage('Veuillez sélectionner la vue "week" svp.');
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

  const currentWeek = getCurrentISOWeek();

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

  confirmBtn.onclick = async () => {
    const checked = box.querySelectorAll("input[type='checkbox']:checked");
    if (checked.length === 0) return alert("Veuillez choisir au moins une semaine.");
    const selectedWeeks = [...checked].map(cb => cb.value);
    const orientation = document.getElementById("pdfOrientation").value;
    modal.remove();
    await downloadPdfForWeeks(selectedWeeks, orientation);
  };
}

// 🔎 Récupère la légende en fonction des filtres actifs
function getActiveCalendarsLegend() {
  const legend = [];
  const isESGT = document.getElementById("toggle-esgt")?.checked ?? true;
  const isUNIV = document.getElementById("toggle-univ")?.checked ?? true;

  if (isESGT) legend.push({ label: "Cours ESGT", color: "#007bff" });
  if (isUNIV) legend.push({ label: "Cours UNIV", color: "#2e7d32" });

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
  const pdf = new jsPDF(orientation === "portrait" ? "portrait" : "landscape", "mm", "a4");
  const originalScroll = window.scrollY;

  for (let i = 0; i < selectedWeeks.length; i++) {
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

    // 📆 Image du calendrier
    pdf.addImage(imgData, "PNG", 0, 25, pdfWidth, imgHeight);

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

  window.scrollTo(0, originalScroll);

  const baseTitle = getPageTitleForPdf();
  pdf.save(`${baseTitle}_${selectedWeeks.join("_")}.pdf`);
}
