async function loadSchedule(){
  const res = await fetch('agenda.json');
  const data = await res.json();
  const scheduleEl = document.getElementById('schedule');
  const days = {
    friday: 'Friday, July 25, 2025',
    saturday: 'Saturday, July 26, 2025',
    sunday: 'Sunday, July 27, 2025'
  };
  for(const key of Object.keys(days)){
    const events = data[key];
    const dayEl = document.createElement('section');
    dayEl.className = 'day';
    dayEl.innerHTML = `<h2>${days[key]}</h2>`;
    events.forEach(evt => {
      const wrapper = document.createElement('div');
      wrapper.className = 'event';
      const imgSrc = evt.speakers && evt.speakers[0] ? evt.speakers[0].media : (evt.moderator ? evt.moderator.media : '');
      const img = document.createElement('img');
      if(imgSrc) img.src = imgSrc;
      img.alt = '';
      const details = document.createElement('div');
      details.className = 'event-details';
      const speakerNames = [];
      if(evt.moderator) speakerNames.push(`Moderator: ${evt.moderator.name}`);
      if(Array.isArray(evt.speakers)){
        evt.speakers.forEach(s => speakerNames.push(s.name));
      }
      details.innerHTML = `<div class="event-time">${evt.time} &middot; ${evt.where}</div>
        <h3>${evt.title}</h3>
        <p>${speakerNames.join(', ')}</p>
        ${evt.description ? `<p>${evt.description}</p>` : ''}`;
      wrapper.appendChild(img);
      wrapper.appendChild(details);
      dayEl.appendChild(wrapper);
    });
    scheduleEl.appendChild(dayEl);
  }
  return data;
}

function to24(dateStr, timeStr){
  const [t, ampm] = timeStr.split(' ');
  let [h,m] = t.split(':').map(Number);
  if(ampm === 'PM' && h !== 12) h += 12;
  if(ampm === 'AM' && h === 12) h = 0;
  const date = new Date(dateStr);
  date.setHours(h,m,0,0);
  return date;
}

function formatICS(d){
  const pad=n=>String(n).padStart(2,'0');
  return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'T'+pad(d.getHours())+pad(d.getMinutes())+'00';
}

async function downloadCalendar(){
  const data = await loadSchedule();
  const map = {friday:'2025-07-25', saturday:'2025-07-26', sunday:'2025-07-27'};
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Open Sauce//Schedule//EN\nCALSCALE:GREGORIAN\n';
  for(const day of Object.keys(map)){
    data[day].forEach(evt => {
      const start = to24(map[day], evt.time);
      const end = new Date(start.getTime() + (parseInt(evt.length||'0')*60000));
      ics += 'BEGIN:VEVENT\n';
      ics += 'DTSTART:'+formatICS(start)+'\n';
      ics += 'DTEND:'+formatICS(end)+'\n';
      ics += 'SUMMARY:'+evt.title.replace(/\n/g,' ')+'\n';
      if(evt.where) ics += 'LOCATION:'+evt.where.replace(/\n/g,' ')+'\n';
      if(evt.description) ics += 'DESCRIPTION:'+evt.description.replace(/\n/g,' ')+'\n';
      ics += 'END:VEVENT\n';
    });
  }
  ics += 'END:VCALENDAR';
  const blob = new Blob([ics], {type:'text/calendar'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'open-sauce-schedule.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


window.addEventListener('DOMContentLoaded', async () => {
  await loadSchedule();
  document.getElementById('downloadBtn').addEventListener('click', downloadCalendar);

  // magnetic hover effect
  const btn = document.getElementById('downloadBtn');
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2;
    const y = e.clientY - r.top - r.height/2;
    gsap.to(btn, {x:x*0.3, y:y*0.3, duration:0.3, ease:'power2.out'});
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, {x:0, y:0, duration:0.4, ease:'power2.out'});
  });

  // GSAP scroll animations
  if(window.gsap){
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.event').forEach(el => {
      gsap.to(el, {
        opacity:1,
        y:0,
        duration:0.6,
        ease:'power1.out',
        scrollTrigger:{
          trigger:el,
          start:'top 85%'
        }
      });
    });

    // hero fade and scale when scrolling into main content
    gsap.to('.hero-content', {
      opacity:0,
      scale:0.9,
      ease:'none',
      scrollTrigger:{
        trigger:'#schedule',
        start:'top top',
        end:'+=150',
        scrub:true
      }
    });
  }

  // sticky header fading
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(ent=>{
      if(ent.intersectionRatio<1){
        ent.target.dataset.stuck='true';
      }else{
        delete ent.target.dataset.stuck;
      }
    });
  },{threshold:[1]});
  document.querySelectorAll('.day h2').forEach(h=>observer.observe(h));
});
