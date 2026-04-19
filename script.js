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
if (track && dotsWrap) {
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
}

// ===== Form handler =====
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.textContent = 'Sending…';

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Use subject field as email subject if provided
  if (!data.subject) {
    formData.set('subject', `Portfolio contact from ${data.name || 'someone'}`);
  }

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    const json = await res.json();
    if (res.ok && json.success) {
      status.textContent = `Thanks, ${data.name || 'friend'}! I'll be in touch soon.`;
      form.reset();
    } else {
      status.textContent = json.message || 'Something went wrong. Please try again.';
    }
  } catch {
    status.textContent = 'Network error. Please try again.';
  }
});

// ===== Smooth scroll for navigation links =====
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const headerHeight = document.querySelector('header').offsetHeight;
  const top = el.getBoundingClientRect().top + window.scrollY - headerHeight;
  window.scrollTo({ top, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  // Navigation links smooth scroll
  const navLinks = document.querySelectorAll('header nav a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToSection(link.getAttribute('href').substring(1));
    });
  });

  // CTA buttons smooth scroll
  const ctaButtons = document.querySelectorAll('.cta a[href^="#"]');
  ctaButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToSection(button.getAttribute('href').substring(1));
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

// ===== KEEP-ALIVE PING (prevents Render cold starts) =====
(function () {
  const HEALTH_URL = 'https://portfolio-07rr.onrender.com/health';
  function ping() { fetch(HEALTH_URL).catch(() => {}); }
  ping();
  setInterval(ping, 2 * 60 * 1000);
})();

// ===== AI CHAT WIDGET =====
(function () {
  const API_ENDPOINT = 'https://portfolio-07rr.onrender.com/api/chat';
  const MAX_MESSAGES = 5;

  const widget   = document.getElementById('chatWidget');
  const toggle   = document.getElementById('chatToggle');
  const messages = document.getElementById('chatMessages');
  const input    = document.getElementById('chatInput');
  const sendBtn  = document.getElementById('chatSend');
  const limitBar = document.getElementById('chatLimitBar');
  const resetBtn = document.getElementById('chatReset');

  // history only stores user/assistant turns; system prompt lives on the server
  let history = [];
  let userMsgCount = 0;

  // ── Toggle open/close ──
  const bubble   = document.getElementById('chatBubble');

  toggle.addEventListener('click', () => {
    const isOpen = widget.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      if (bubble) bubble.classList.add('hidden');
      setTimeout(() => input.focus(), 250);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && widget.classList.contains('open')) {
      widget.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // ── Helpers ──
  function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    const span = document.createElement('span');
    span.textContent = text;
    div.appendChild(span);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'chat-typing';
    div.id = 'chatTyping';
    div.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('chatTyping');
    if (t) t.remove();
  }

  function lockInput() {
    input.disabled = true;
    sendBtn.disabled = true;
    input.placeholder = 'Limit reached — reset to continue.';
    limitBar.hidden = false;
  }

  function resetSession() {
    history = [];
    userMsgCount = 0;
    messages.innerHTML = '';
    appendMessage('assistant', "Session reset! Ask me anything about Ajuram. \uD83D\uDC4B");
    input.disabled = false;
    sendBtn.disabled = false;
    input.placeholder = 'Ask me anything\u2026';
    limitBar.hidden = true;
    input.focus();
  }

  // ── Send message ──
  function _friendlyError(status) {
    if (status === 429) return "You're going a bit fast! Please wait a moment before trying again.";
    if (status === 502 || status === 503) return "The AI service is temporarily unavailable. Please try again shortly.";
    if (status === 0 || !status) return "Couldn't reach the server. Please check your connection and try again.";
    return "Something went wrong. Please try again in a moment.";
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || userMsgCount >= MAX_MESSAGES) return;

    input.value = '';
    sendBtn.disabled = true;
    input.disabled = true;

    userMsgCount++;
    appendMessage('user', text);
    history.push({ role: 'user', content: text });

    showTyping();

    try {
      // Send full conversation history; server prepends the system prompt
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });

      removeTyping();

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        const friendly = error || _friendlyError(res.status);
        throw new Error(friendly);
      }

      const data = await res.json();
      const reply = data.reply || "I couldn't generate a response. Please try again!";
      history.push({ role: 'assistant', content: reply });
      appendMessage('assistant', reply);
    } catch (err) {
      removeTyping();
      // Don't count a failed request against the limit
      userMsgCount--;
      history.pop();
      const msg = err.message || _friendlyError(0);
      appendMessage('assistant', msg);
    } finally {
      if (userMsgCount >= MAX_MESSAGES) {
        lockInput();
      } else {
        sendBtn.disabled = false;
        input.disabled = false;
        input.focus();
      }
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  resetBtn.addEventListener('click', resetSession);
})();