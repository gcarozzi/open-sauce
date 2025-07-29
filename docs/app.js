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



window.addEventListener('DOMContentLoaded', async () => {
  await loadSchedule();

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
