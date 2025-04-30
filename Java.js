const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const configPanel = document.getElementById('config-panel');
const togglePanel = document.getElementById('toggle-panel');

togglePanel.addEventListener('click', () => {
  configPanel.classList.toggle('collapsed');
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let particles = [];
let particleCount = 150;
let maxVelocity = 4;
let mouseForce = 4;
let temporaryMouseForce = mouseForce;
let connectionDistance = 70;

const mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 33,
  isActive: false
};

canvas.addEventListener('mousemove', function(e) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
  mouse.isActive = true;
});

canvas.addEventListener('mouseout', function() {
  mouse.isActive = false;
});

canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.touches[0].clientX - rect.left;
  mouse.y = e.touches[0].clientY - rect.top;
  mouse.isActive = true;
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.touches[0].clientX - rect.left;
  mouse.y = e.touches[0].clientY - rect.top;
  mouse.isActive = true;
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
  e.preventDefault();
  mouse.isActive = false;
}, { passive: false });

canvas.addEventListener('click', function(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  let particleClicked = false;

  particles.forEach((p, index) => {
    const dx = p.x - clickX;
    const dy = p.y - clickY;
    const dist = Math.hypot(dx, dy);

    if (dist <= p.radius) {
      explodeParticle(index);
      particleClicked = true;
    }
  });

  if (particleClicked) {
    temporaryMouseForce = mouseForce * 3;
    setTimeout(() => {
      temporaryMouseForce = mouseForce;
    }, 500);
  }
});

function explodeParticle(index) {
  const parentParticle = particles[index];
  particles.splice(index, 1);

  const fragmentCount = 8;
  const newRadius = parentParticle.radius / Math.sqrt(fragmentCount);

  if (newRadius >= 1) {
    for (let i = 0; i < fragmentCount; i++) {
      const angle = (Math.PI * 2 / fragmentCount) * i;
      const speed = Math.random() * maxVelocity * 2 + maxVelocity;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      particles.push(new Particle(parentParticle.x, parentParticle.y, vx, vy, newRadius, parentParticle.color));
    }
  }
}

function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 100%, 50%)`;
}

class Particle {
  constructor(x, y, vx, vy, radius, color) {
    this.x = x;
    this.y = y;
    this.vx = vx !== undefined ? vx : (Math.random() * maxVelocity * 2) - maxVelocity;
    this.vy = vy !== undefined ? vy : (Math.random() * maxVelocity * 2) - maxVelocity;
    this.radius = radius !== undefined ? radius : Math.random() * 10 + 5;
    this.color = color || getRandomColor();
  }

  update() {
    if (mouse.isActive) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.hypot(dx, dy);

      if (dist < mouse.radius + this.radius) {
        const angle = Math.atan2(dy, dx);
        const repelForce = (mouse.radius + this.radius - dist) / (mouse.radius + this.radius);
        this.vx += Math.cos(angle) * repelForce * temporaryMouseForce;
        this.vy += Math.sin(angle) * repelForce * temporaryMouseForce;
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx *= -1;
    }
    if (this.x + this.radius > canvas.width) {
      this.x = canvas.width - this.radius;
      this.vx *= -1;
    }
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy *= -1;
    }
    if (this.y + this.radius > canvas.height) {
      this.y = canvas.height - this.radius;
      this.vy *= -1;
    }

    this.vx *= 0.99;
    this.vy *= 0.99;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
  }
}

initParticles();

let breatheAngle = 0;

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[j].x - particles[i].x;
      const dy = particles[j].y - particles[i].y;
      const dist = Math.hypot(dx, dy);

      if (dist < connectionDistance) {
        const alpha = 1 - dist / connectionDistance;
        ctx.strokeStyle = `hsla(${(particles[i].color.match(/\d+/)[0])}, 100%, 50%, ${alpha})`;
        ctx.lineWidth = alpha * 2;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();

        const force = (dist - 50) * 0.0001;
        const fx = force * dx;
        const fy = force * dy;
        particles[i].vx += fx;
        particles[i].vy += fy;
        particles[j].vx -= fx;
        particles[j].vy -= fy;
      }
    }
  }

  if (mouse.isActive) {
    breatheAngle += 0.05;
    const breatheEffect = Math.sin(breatheAngle) * 5 + 5;

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    const gradient = ctx.createRadialGradient(
      mouse.x, mouse.y, mouse.radius,
      mouse.x, mouse.y, mouse.radius + breatheEffect
    );
    gradient.addColorStop(0, 'rgba(0, 24, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, mouse.radius + breatheEffect, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  requestAnimationFrame(animate);
}

animate();

// Configuration panel controls
const particleCountSlider = document.getElementById('particle-count');
const particleCountValue = document.getElementById('particle-count-value');
particleCountSlider.addEventListener('input', () => {
  particleCount = parseInt(particleCountSlider.value);
  particleCountValue.textContent = particleCount;
  initParticles();
});

const maxVelocitySlider = document.getElementById('max-velocity');
const maxVelocityValue = document.getElementById('max-velocity-value');
maxVelocitySlider.addEventListener('input', () => {
  maxVelocity = parseFloat(maxVelocitySlider.value);
  maxVelocityValue.textContent = maxVelocity.toFixed(1);
  initParticles();
});

const mouseRadiusSlider = document.getElementById('mouse-radius');
const mouseRadiusValue = document.getElementById('mouse-radius-value');
mouseRadiusSlider.addEventListener('input', () => {
  mouse.radius = parseInt(mouseRadiusSlider.value);
  mouseRadiusValue.textContent = mouse.radius;
});

const mouseForceSlider = document.getElementById('mouse-force');
const mouseForceValue = document.getElementById('mouse-force-value');
mouseForceSlider.addEventListener('input', () => {
  mouseForce = parseFloat(mouseForceSlider.value);
  mouseForceValue.textContent = mouseForce.toFixed(1);
});

const connectionDistanceSlider = document.getElementById('connection-distance');
const connectionDistanceValue = document.getElementById('connection-distance-value');
connectionDistanceSlider.addEventListener('input', () => {
  connectionDistance = parseInt(connectionDistanceSlider.value);
  connectionDistanceValue.textContent = connectionDistance;
});

// Fullscreen toggle functionality
const fullscreenBtn = document.getElementById('fullscreenBtn');
fullscreenBtn.addEventListener('click', toggleFullScreen);

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}