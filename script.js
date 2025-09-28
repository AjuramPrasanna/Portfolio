// ===== Smooth scroll active link =====
const sections = [...document.querySelectorAll('main[id], section[id]')];
const navLinks = [...document.querySelectorAll('header nav a')];
const setActive = () => {
  const y = window.scrollY + 120;
  let cur = sections[0];
  for(const s of sections){ if(s.offsetTop <= y) cur = s; }
  navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur.id));
}
setActive(); window.addEventListener('scroll', setActive);

// ===== Theme toggle with persistence =====
const toggleBtn = document.getElementById('themeToggle');
const preferLight = window.matchMedia('(prefers-color-scheme: light)').matches;
const saved = localStorage.getItem('theme');
if(saved === 'light' || (!saved && preferLight)) document.body.classList.add('light');
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

// ===== Tilt effect + shine following cursor =====
const tilts = document.querySelectorAll('[data-tilt]');
tilts.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const rx = ((y / r.height) - .5) * -6; // tilt
    const ry = ((x / r.width) - .5) * 8;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    card.style.setProperty('--mx', `${(x/r.width)*100}%`);
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ===== Reveal on scroll =====
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){ entry.target.classList.add('visible'); io.unobserve(entry.target); }
  })
}, {threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// ===== Carousel =====
const track = document.getElementById('carouselTrack');
const dotsWrap = document.getElementById('dots');
const slides = [...track.children];
let idx = 0; let timer;
slides.forEach((_,i)=>{
  const d = document.createElement('button'); d.className='dot' + (i===0?' active':''); d.setAttribute('aria-label', 'Go to slide '+(i+1)); d.addEventListener('click',()=>go(i)); dotsWrap.appendChild(d);
})
const dots = [...dotsWrap.children];
function go(i){
  idx = (i+slides.length)%slides.length;
  track.style.transform = `translateX(-${idx*100}%)`;
  dots.forEach((d,di)=>d.classList.toggle('active', di===idx));
  resetTimer();
}
function resetTimer(){ clearInterval(timer); timer = setInterval(()=>go(idx+1), 5000); }
resetTimer();

// ===== Form handler (demo) =====
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  // Demo: pretend to send
  status.textContent = 'Sending…';
  setTimeout(()=>{
    status.textContent = `Thanks, ${data.name || 'friend'}! I will reply to ${data.email || 'your email'} soon.`;
    form.reset();
  }, 900);
});

// ===== Smooth scroll for navigation links =====
document.addEventListener('DOMContentLoaded', () => {
  // Navigation links smooth scroll
  const navLinks = document.querySelectorAll('header nav a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // CTA buttons smooth scroll
  const ctaButtons = document.querySelectorAll('.cta a[href^="#"]');
  ctaButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = button.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Back to top button smooth scroll
  const backToTopBtn = document.querySelector('footer a[href="#home"]');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});

// ===== Year =====
document.getElementById('year').textContent = new Date().getFullYear();

// Function to download resume
function downloadResume() {
  // Create a temporary anchor element
  const link = document.createElement('a');
  
  // Set the href to your resume file path
  link.href = 'files/resume.pdf';
  
  // Set the download attribute to specify the filename
  link.download = 'Ajuram_Resume.pdf';
  
  // Temporarily add the link to the document
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Remove the temporary link
  document.body.removeChild(link);
}

// Add event listener for resume download
document.getElementById('downloadResume').addEventListener('click', function(e) {
  e.preventDefault(); // Prevent default link behavior
  downloadResumeWithErrorHandling(); // Call the download function
});

// Function to download resume with error handling
function downloadResumeWithErrorHandling() {
  const resumePath = 'files/resume.pdf';
  
  // Check if file exists before attempting download
  fetch(resumePath, { method: 'HEAD' })
    .then(response => {
      if (response.ok) {
        // File exists, proceed with download
        const link = document.createElement('a');
        link.href = resumePath;
        link.download = 'HIRE_THIS_GUY.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // File doesn't exist
        alert('Resume file not found. Please contact me directly for my resume.');
      }
    })
    .catch(error => {
      console.error('Error checking resume file:', error);
      alert('Unable to download resume at the moment. Please try again later.');
    });
}