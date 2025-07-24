async function fetchSchedule() {
    const response = await fetch('../agenda.json');
    if (!response.ok) {
        console.error('Failed to load agenda.json');
        return null;
    }
    return await response.json();
}

function createEventElement(event) {
    const div = document.createElement('div');
    div.className = 'event';
    const time = document.createElement('div');
    time.className = 'time';
    time.textContent = event.time;
    const title = document.createElement('div');
    title.textContent = event.title;
    const where = document.createElement('div');
    where.textContent = event.where;
    div.append(time, title, where);
    return div;
}

function renderSchedule(data) {
    const schedule = document.getElementById('schedule');
    ['friday', 'saturday', 'sunday'].forEach((day, index) => {
        const daySection = document.createElement('section');
        daySection.className = 'day';
        const heading = document.createElement('h2');
        const date = ['July 25, 2025', 'July 26, 2025', 'July 27, 2025'][index];
        heading.textContent = day.charAt(0).toUpperCase() + day.slice(1) + ' - ' + date;
        daySection.appendChild(heading);
        data[day].forEach(ev => {
            daySection.appendChild(createEventElement(ev));
        });
        schedule.appendChild(daySection);
    });
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function convertTo24(timeStr) {
    const [time, ampm] = timeStr.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (ampm.toLowerCase() === 'pm' && h !== 12) h += 12;
    if (ampm.toLowerCase() === 'am' && h === 12) h = 0;
    return pad(h) + pad(m) + '00';
}

function addMinutes(timeStr, minutes) {
    const dt = new Date('1970-01-01T' + timeStr.slice(0,2) + ':' + timeStr.slice(2,4) + ':00');
    dt.setMinutes(dt.getMinutes() + minutes);
    return pad(dt.getHours()) + pad(dt.getMinutes()) + '00';
}

function generateICS(data) {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Open Sauce//Schedule//EN',
        'CALSCALE:GREGORIAN'
    ];
    const days = ['20250725', '20250726', '20250727'];
    ['friday','saturday','sunday'].forEach((day, index) => {
        data[day].forEach(ev => {
            const start = convertTo24(ev.time);
            const end = addMinutes(start, parseInt(ev.length || '30'));
            lines.push('BEGIN:VEVENT');
            lines.push('UID:' + btoa(ev.title + start));
            lines.push('SUMMARY:' + ev.title);
            lines.push('DTSTART;TZID=America/Los_Angeles:' + days[index] + 'T' + start);
            lines.push('DTEND;TZID=America/Los_Angeles:' + days[index] + 'T' + end);
            if (ev.where) lines.push('LOCATION:' + ev.where);
            if (ev.description) lines.push('DESCRIPTION:' + ev.description.replace(/\n/g,'\\n'));
            lines.push('END:VEVENT');
        });
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
}

function setupICSButton(data) {
    const btn = document.getElementById('download-ics');
    btn.addEventListener('click', () => {
        const ics = generateICS(data);
        const blob = new Blob([ics], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'schedule.ics';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const data = await fetchSchedule();
    if (!data) return;
    renderSchedule(data);
    setupICSButton(data);
});
