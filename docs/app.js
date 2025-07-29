async function loadAgenda() {
  const res = await fetch("agenda.json");
  return await res.json();
}

function to24(dateStr, timeStr) {
  const [t, ampm] = timeStr.split(" ");
  let [h, m] = t.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  const date = new Date(dateStr);
  date.setHours(h, m, 0, 0);
  return date;
}

function formatICS(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    "00"
  );
}

async function downloadCalendar() {
  const data = await loadAgenda();
  const map = {
    friday: "2025-07-25",
    saturday: "2025-07-26",
    sunday: "2025-07-27",
  };
  let ics =
    "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Open Sauce//Schedule//EN\nCALSCALE:GREGORIAN\n";
  for (const day of Object.keys(map)) {
    data[day].forEach((evt) => {
      const start = to24(map[day], evt.time);
      const end = new Date(
        start.getTime() + parseInt(evt.length || "0") * 60000,
      );
      ics += "BEGIN:VEVENT\n";
      ics += "DTSTART:" + formatICS(start) + "\n";
      ics += "DTEND:" + formatICS(end) + "\n";
      ics += "SUMMARY:" + evt.title.replace(/\n/g, " ") + "\n";
      if (evt.where) ics += "LOCATION:" + evt.where.replace(/\n/g, " ") + "\n";
      if (evt.description)
        ics += "DESCRIPTION:" + evt.description.replace(/\n/g, " ") + "\n";
      ics += "END:VEVENT\n";
    });
  }
  ics += "END:VCALENDAR";
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "open-sauce-schedule.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

window.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".hero-cta");
  btn.addEventListener("click", downloadCalendar);

  // magnetic hover effect
  btn.addEventListener("mousemove", (e) => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: "power2.out" });
  });
  btn.addEventListener("mouseleave", () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.4, ease: "power2.out" });
  });
});
