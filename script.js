/**
 * GEOMETRÍA FRACTAL — Graficación por Computadora
 * Script Maestro de Presentación (28 Diapositivas en 10 Subtemas)
 * Expositor: Pedro Antonio Cauich Pat
 * Incluye: Navegación de doble nivel, cámara web draggable y motores de Canvas interactivos
 */

document.addEventListener('DOMContentLoaded', () => {
  initPresentationDeck();
  initDraggableCamera();
  initWebcam();
  initFullscreen();

  // Inicialización de motores Canvas interactivos
  initMandelbulbPreview();
  initRetroTerminal();
  initHilbertCanvas();
  initKochCanvas();
  initLorenzCanvas();
  initEscapeTimeCanvas();
  initMandelbrotZoomCanvas();
  initBarnsleyCanvas();
  initFbmCanvas();
  initSierpinskiCanvas();
  initChaosCryptoCanvas();
  initSocMonitorCanvas();
  initMandelbulb3DCanvas();
  initBachCanvas();
  initCoastlineCanvas();
});

/* ==========================================================================
   1. CONTROL DE DIAPOSITIVAS Y NAVEGACIÓN (28 SLIDES / 10 SUBTEMAS)
   ========================================================================== */
function initPresentationDeck() {
  const slides = Array.from(document.querySelectorAll('.presentation-slide'));
  const tabsContainer = document.getElementById('presTabsContainer');
  const btnPrev = document.getElementById('btnPrevSlide');
  const btnNext = document.getElementById('btnNextSlide');
  const globalCounter = document.getElementById('globalSlideCounter');

  let currentSlideIndex = 0;
  const totalSlides = slides.length;
  const slidePills = [];

  // Recuperar última diapositiva visitada para no reiniciar al recargar
  let savedSlideIndex = 0;
  try {
    const stored = localStorage.getItem('presentation_saved_slide');
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < totalSlides) {
        savedSlideIndex = parsed;
      }
    }
  } catch (e) {}

  // Generar píldoras de navegación para todas las diapositivas (1 a total)
  if (tabsContainer) {
    tabsContainer.innerHTML = '';
    slides.forEach((slide, idx) => {
      const btn = document.createElement('button');
      btn.className = `pres-tab-pill ${idx === 0 ? 'active' : ''}`;
      btn.setAttribute('data-slide-index', idx);

      const titleElem = slide.querySelector('h2, h1, .cover-title');
      const titleText = titleElem ? titleElem.textContent.trim().replace(/\s+/g, ' ') : `Diapositiva ${idx + 1}`;
      btn.title = `${idx + 1}. ${titleText}`;
      btn.setAttribute('aria-label', `Ir a diapositiva ${idx + 1}`);

      btn.innerHTML = `<span class="pres-pill-num">${idx + 1}</span>`;
      btn.addEventListener('click', () => {
        goToSlide(idx);
      });

      tabsContainer.appendChild(btn);
      slidePills.push(btn);
    });
  }

  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    currentSlideIndex = index;
    window.currentSlideIndex = currentSlideIndex;

    // Guardar posición actual para recordar en recargas
    try {
      localStorage.setItem('presentation_saved_slide', currentSlideIndex);
    } catch (e) {}

    const targetSlide = slides[currentSlideIndex];

    // Activar diapositiva
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentSlideIndex);
    });

    // Actualizar píldoras de la barra inferior para todas las diapositivas
    slidePills.forEach((pill, idx) => {
      pill.classList.toggle('active', idx === currentSlideIndex);
    });

    const activePill = slidePills[currentSlideIndex];
    if (activePill && typeof activePill.scrollIntoView === 'function') {
      activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    // Actualizar contador global
    if (globalCounter) {
      globalCounter.textContent = `${currentSlideIndex + 1} / ${totalSlides}`;
    }

    // Estado botones Prev / Next
    if (btnPrev) btnPrev.disabled = (currentSlideIndex === 0);
    if (btnNext) btnNext.disabled = (currentSlideIndex === totalSlides - 1);

    // Manejo de reproducción de video en la diapositiva activa
    const allVideos = document.querySelectorAll('video:not(#cameraVideo)');
    allVideos.forEach((v) => {
      if (!v.closest('.presentation-slide.active')) {
        v.pause();
      }
    });

    const activeVideos = targetSlide.querySelectorAll('video:not(#cameraVideo)');
    activeVideos.forEach((activeVideo) => {
      if (currentSlideIndex === 0) {
        activeVideo.muted = false;
        activeVideo.volume = 1.0;
      } else {
        activeVideo.muted = true;
      }
      activeVideo.playbackRate = 1.0;
      activeVideo.play().catch(() => {
        activeVideo.muted = true;
        activeVideo.play().catch(() => { });
      });
    });

    // Alternar modo cine puro para Diapositiva 1, y ocultar cámara en portada y diapositivas de referencias
    const wrap = document.querySelector('.presentation-wrap');
    const isRefSlide = targetSlide && (targetSlide.dataset.subtopic === '11' || currentSlideIndex >= totalSlides - 3);
    if (wrap) {
      wrap.classList.toggle('first-slide-cinema', currentSlideIndex === 0);
      wrap.classList.toggle('hide-camera', currentSlideIndex <= 1 || isRefSlide);
      wrap.classList.toggle('ref-slide-mode', isRefSlide);
    }

    // Disparar redibujado de canvas activos si la diapositiva tiene uno
    triggerActiveSlideCanvases(targetSlide);
  }

  // Activar sonido automáticamente en la primera interacción si el navegador restringió el autoplay
  const enableSound = () => {
    const vid = document.getElementById('hookVideo');
    if (vid) {
      vid.muted = false;
      vid.volume = 1.0;
      if (vid.paused && currentSlideIndex === 0) {
        vid.play().catch(() => { });
      }
    }
  };
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach((evt) => {
    window.addEventListener(evt, enableSound, { once: true });
  });

  // Clic en botones Prev / Next
  if (btnPrev) {
    btnPrev.addEventListener('click', () => goToSlide(currentSlideIndex - 1));
  }
  if (btnNext) {
    btnNext.addEventListener('click', () => goToSlide(currentSlideIndex + 1));
  }

  // Diapositiva 1: Al terminar el video o al hacer clic, avanzar automáticamente a la portada
  const hookVideo = document.getElementById('hookVideo');
  if (hookVideo) {
    hookVideo.addEventListener('ended', () => {
      if (currentSlideIndex === 0) {
        goToSlide(1);
      }
    });
    hookVideo.addEventListener('click', () => {
      if (currentSlideIndex === 0) {
        goToSlide(1);
      }
    });
  }

  // Clic en el video de la Curva de Peano para pausar / reanudar
  const peanoVideo = document.getElementById('peanoFractalVideo');
  if (peanoVideo) {
    peanoVideo.addEventListener('click', () => {
      if (peanoVideo.paused) {
        peanoVideo.play();
      } else {
        peanoVideo.pause();
      }
    });
  }

  // Clic en el video del Copo de Koch para pausar / reanudar
  const kochVideo = document.getElementById('kochFractalVideo');
  if (kochVideo) {
    kochVideo.addEventListener('click', () => {
      if (kochVideo.paused) {
        kochVideo.play();
      } else {
        kochVideo.pause();
      }
    });
  }

  // Clic en el video de Impacto en GPUs / Mapas para pausar / reanudar
  const gpuVideo = document.getElementById('gpuFractalVideo');
  if (gpuVideo) {
    gpuVideo.addEventListener('click', () => {
      if (gpuVideo.paused) {
        gpuVideo.play();
      } else {
        gpuVideo.pause();
      }
    });
  }

  // Clic en el video del Atractor de Lorenz para pausar / reanudar
  const lorenzVideo = document.getElementById('lorenzFractalVideo');
  if (lorenzVideo) {
    lorenzVideo.addEventListener('click', () => {
      if (lorenzVideo.paused) {
        lorenzVideo.play();
      } else {
        lorenzVideo.pause();
      }
    });
  }

  // Clic en el video del Algoritmo de Tiempo de Escape para pausar / reanudar
  const escapeTimeVideo = document.getElementById('escapeTimeFractalVideo');
  if (escapeTimeVideo) {
    escapeTimeVideo.addEventListener('click', () => {
      if (escapeTimeVideo.paused) {
        escapeTimeVideo.play();
      } else {
        escapeTimeVideo.pause();
      }
    });
  }

  // Clic en el video de Deep Zoom de Mandelbrot para pausar / reanudar
  const mandelZoomVideo = document.getElementById('mandelbrotZoomVideo');
  if (mandelZoomVideo) {
    mandelZoomVideo.addEventListener('click', () => {
      if (mandelZoomVideo.paused) {
        mandelZoomVideo.play();
      } else {
        mandelZoomVideo.pause();
      }
    });
  }

  // Clic en la animación del Helecho de Barnsley para pausar / reanudar
  const barnsleyVideo = document.getElementById('barnsleyFernVideo');
  if (barnsleyVideo) {
    barnsleyVideo.addEventListener('click', () => {
      if (barnsleyVideo.paused) {
        barnsleyVideo.play();
      } else {
        barnsleyVideo.pause();
      }
    });
  }

  // Clic en el video del Árbol Bronquial para pausar / reanudar
  const respVideo = document.getElementById('respiratoryVideo');
  if (respVideo) {
    respVideo.addEventListener('click', () => {
      if (respVideo.paused) {
        respVideo.play();
      } else {
        respVideo.pause();
      }
    });
  }

  // Clic en el video de Vol Libre para pausar / reanudar
  const vlVideo = document.getElementById('volLibreVideo');
  if (vlVideo) {
    vlVideo.addEventListener('click', () => {
      if (vlVideo.paused) {
        vlVideo.play();
      } else {
        vlVideo.pause();
      }
    });
  }

  // Clic en el video de Star Trek II para pausar / reanudar
  const stVideo = document.getElementById('starTrekVideo');
  if (stVideo) {
    stVideo.addEventListener('click', () => {
      if (stVideo.paused) {
        stVideo.play();
      } else {
        stVideo.pause();
      }
    });
  }

  // Clic en el video de No Man's Sky para pausar / reanudar
  const nmsVideo = document.getElementById('noMansSkyVideo');
  if (nmsVideo) {
    nmsVideo.addEventListener('click', () => {
      if (nmsVideo.paused) {
        nmsVideo.play();
      } else {
        nmsVideo.pause();
      }
    });
  }

  // Clic en el video de Detección de Redes SOC para pausar / reanudar
  const socVideo = document.getElementById('socNetworkVideo');
  if (socVideo) {
    socVideo.addEventListener('click', () => {
      if (socVideo.paused) {
        socVideo.play();
      } else {
        socVideo.pause();
      }
    });
  }

  // Clic en el video de Doctor Strange para pausar / reanudar
  const dsVideo = document.getElementById('doctorStrangeVideo');
  if (dsVideo) {
    dsVideo.addEventListener('click', () => {
      if (dsVideo.paused) {
        dsVideo.play();
      } else {
        dsVideo.pause();
      }
    });
  }


  // Navegación con teclado
  document.addEventListener('keydown', (e) => {
    const activeElem = document.activeElement;
    if (
      activeElem &&
      (activeElem.isContentEditable ||
        activeElem.tagName === 'INPUT' ||
        activeElem.tagName === 'TEXTAREA')
    ) {
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      goToSlide(currentSlideIndex - 1);
    } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      if (e.key === ' ') e.preventDefault();
      goToSlide(currentSlideIndex + 1);
    }
  });

  window.goToSlide = goToSlide;
  goToSlide(savedSlideIndex);
}

function triggerActiveSlideCanvases(slide) {
  // Notifica a los lienzos interactivos para recalcular dimensiones o animar si acaban de mostrarse
  window.dispatchEvent(new Event('resize'));
}

/* ==========================================================================
   2. CÁMARA WEB ARRASTRABLE (DRAGGABLE)
   ========================================================================== */
function initDraggableCamera() {
  const box = document.getElementById('cameraBox');
  const deck = document.getElementById('presentationDeck');
  if (!box || !deck) return;

  let isDragging = false;
  let startX, startY;
  let initialLeft, initialTop;

  box.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = box.getBoundingClientRect();
    const parentRect = deck.getBoundingClientRect();
    initialLeft = rect.left - parentRect.left;
    initialTop = rect.top - parentRect.top;

    box.style.bottom = 'auto';
    box.style.right = 'auto';
    box.style.left = `${initialLeft}px`;
    box.style.top = `${initialTop}px`;
    box.style.cursor = 'grabbing';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const parentRect = deck.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    let newLeft = Math.max(0, Math.min(initialLeft + dx, parentRect.width - boxRect.width));
    let newTop = Math.max(0, Math.min(initialTop + dy, parentRect.height - boxRect.height));

    box.style.left = `${newLeft}px`;
    box.style.top = `${newTop}px`;
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      box.style.cursor = 'grab';
    }
  });

  box.addEventListener('dblclick', () => {
    box.style.left = '';
    box.style.top = '';
    box.style.right = '8px';
    box.style.bottom = '8px';
  });
}

/* ==========================================================================
   3. CÁMARA WEB EN VIVO (HTML5 GETUSERMEDIA)
   ========================================================================== */
function initWebcam() {
  const box = document.getElementById('cameraBox');
  const video = document.getElementById('cameraVideo');
  const btnToggle = document.getElementById('btnToggleCamera');

  let stream = null;

  async function startCamera() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador requiere HTTPS o localhost para encender la cámara.');
        return;
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      if (box) box.classList.add('active-stream');
      if (btnToggle) btnToggle.classList.add('active');
    } catch (err) {
      console.warn('Cámara web no accesible:', err);
      alert('No se pudo acceder a la cámara web. Puedes continuar la presentación normalmente.');
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (video) video.srcObject = null;
    if (box) box.classList.remove('active-stream');
    if (btnToggle) btnToggle.classList.remove('active');
  }

  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      if (stream) stopCamera();
      else startCamera();
    });
  }
}

/* ==========================================================================
   4. PANTALLA COMPLETA
   ========================================================================== */
function initFullscreen() {
  const btnFs = document.getElementById('btnFullscreen');
  function toggle() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }
  if (btnFs) btnFs.addEventListener('click', toggle);
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) {
      const a = document.activeElement;
      if (!a || (a.tagName !== 'INPUT' && a.tagName !== 'TEXTAREA')) {
        toggle();
      }
    }
  });
}

/* ==========================================================================
   5. MOTORES DE CANVAS INTERACTIVOS
   ========================================================================== */

/** 5.1 Preview animado de Mandelbulb en Portada */
function initMandelbulbPreview() {
  const canvas = document.getElementById('canvasMandelbulbPreview');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let angle = 0;

  function render() {
    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxR = Math.min(cx, cy) * 0.75;

    // Dibujar aureola fractal 3D estilizada
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.rotate((Math.PI * 2) / 8);
      const grad = ctx.createLinearGradient(0, 0, maxR, maxR);
      grad.addColorStop(0, 'rgba(0, 245, 212, 0.4)');
      grad.addColorStop(0.5, 'rgba(255, 0, 127, 0.3)');
      grad.addColorStop(1, 'rgba(123, 44, 191, 0)');
      ctx.fillStyle = grad;

      ctx.arc(maxR * 0.45, 0, maxR * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Núcleo central
    const coreGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, maxR * 0.5);
    coreGrad.addColorStop(0, '#00F5D4');
    coreGrad.addColorStop(0.4, '#7B2CBF');
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, maxR * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    angle += 0.008;
    requestAnimationFrame(render);
  }
  render();
}

/** 5.2 Terminal Retro 1975 (Slide 1.2) */
function initRetroTerminal() {
  const canvas = document.getElementById('canvasRetroTerminal');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let t = 0;

  function draw() {
    ctx.fillStyle = '#02120b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ejes vectoriales fósforo verde
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let x = 20; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 20; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Intentos de curvas "nubes" con círculos toscos
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    for (let a = 0; a < Math.PI * 2; a += 0.1) {
      const r = 45 + Math.sin(a * 4 + t) * 8 + Math.cos(a * 2) * 5;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Texto vector en pantalla
    ctx.fillStyle = '#34d399';
    ctx.font = '10px monospace';
    ctx.fillText('VECTOR DISPLAY [1975] - CLOUD_MODEL::FAILED', 15, 20);
    ctx.fillText('RESOLUTION: 256x256 VECTORS', 15, 34);

    t += 0.03;
    requestAnimationFrame(draw);
  }
  draw();
}

/** 5.3 Curva de Hilbert Interactiva (Slide 3.2) */
function initHilbertCanvas() {
  const canvas = document.getElementById('canvasHilbert');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const btnPrev = document.getElementById('btnHilbertPrev');
  const btnNext = document.getElementById('btnHilbertNext');
  const btnPlay = document.getElementById('btnHilbertPlay');
  const label = document.getElementById('hilbertOrderLabel');

  let order = 3;
  let isPlaying = false;
  let playStep = 0;

  function d2xy(n, d) {
    let rx, ry, s, t = d;
    let x = 0, y = 0;
    for (s = 1; s < n; s *= 2) {
      rx = 1 & (t / 2);
      ry = 1 & (t ^ rx);
      if (ry === 0) {
        if (rx === 1) {
          x = s - 1 - x;
          y = s - 1 - y;
        }
        let temp = x; x = y; y = temp;
      }
      x += s * rx;
      y += s * ry;
      t = Math.floor(t / 4);
    }
    return { x, y };
  }

  function draw() {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const n = Math.pow(2, order);
    const totalPoints = n * n;
    const padding = 20;
    const w = canvas.width - padding * 2;
    const h = canvas.height - padding * 2;
    const side = Math.min(w, h);
    const stepSize = side / n;
    const ox = (canvas.width - side) / 2;
    const oy = (canvas.height - side) / 2;

    const limit = isPlaying ? playStep : totalPoints;

    ctx.strokeStyle = '#00F5D4';
    ctx.lineWidth = order >= 5 ? 1 : 2;
    ctx.beginPath();

    for (let i = 0; i < limit; i++) {
      const pt = d2xy(n, i);
      const px = ox + pt.x * stepSize + stepSize / 2;
      const py = oy + pt.y * stepSize + stepSize / 2;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    if (label) {
      label.innerHTML = `Orden: <b>${order}</b> (${totalPoints} vértices)`;
    }

    if (isPlaying) {
      playStep += Math.max(1, Math.floor(totalPoints / 120));
      if (playStep > totalPoints) {
        playStep = totalPoints;
        isPlaying = false;
        if (btnPlay) btnPlay.textContent = '▶ Auto-recorrido';
      } else {
        requestAnimationFrame(draw);
      }
    }
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (order > 1) { order--; isPlaying = false; draw(); }
    });
  }
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (order < 5) { order++; isPlaying = false; draw(); }
    });
  }
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      isPlaying = !isPlaying;
      playStep = 0;
      btnPlay.textContent = isPlaying ? '⏸ Pausar' : '▶ Auto-recorrido';
      if (isPlaying) draw();
    });
  }

  draw();
}

/** 5.4 Copo de Koch Interactivo (Slide 3.3) */
function initKochCanvas() {
  const canvas = document.getElementById('canvasKoch');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const btnPrev = document.getElementById('btnKochPrev');
  const btnNext = document.getElementById('btnKochNext');
  const iterLabel = document.getElementById('kochIterLabel');
  const segLabel = document.getElementById('kochSegmentsVal');
  const perimLabel = document.getElementById('kochPerimeterVal');

  let iter = 2;

  function kochCurve(p1, p2, depth) {
    if (depth === 0) {
      ctx.lineTo(p2.x, p2.y);
      return;
    }
    const dx = (p2.x - p1.x) / 3;
    const dy = (p2.y - p1.y) / 3;

    const a = { x: p1.x + dx, y: p1.y + dy };
    const c = { x: p1.x + dx * 2, y: p1.y + dy * 2 };

    const sin60 = Math.sin(-Math.PI / 3);
    const cos60 = Math.cos(-Math.PI / 3);
    const bx = a.x + dx * cos60 - dy * sin60;
    const by = a.y + dx * sin60 + dy * cos60;
    const b = { x: bx, y: by };

    kochCurve(p1, a, depth - 1);
    kochCurve(a, b, depth - 1);
    kochCurve(b, c, depth - 1);
    kochCurve(c, p2, depth - 1);
  }

  function draw() {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 10;
    const r = Math.min(canvas.width, canvas.height) * 0.42;

    const p1 = { x: cx, y: cy - r };
    const p2 = { x: cx + r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) };
    const p3 = { x: cx - r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) };

    ctx.strokeStyle = '#FFB703';
    ctx.fillStyle = 'rgba(255, 183, 3, 0.08)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    kochCurve(p1, p2, iter);
    kochCurve(p2, p3, iter);
    kochCurve(p3, p1, iter);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const segments = 3 * Math.pow(4, iter);
    const perimRatio = Math.pow(4 / 3, iter).toFixed(2);

    if (iterLabel) iterLabel.innerHTML = `Iteración: <b>${iter}</b>`;
    if (segLabel) segLabel.textContent = `${segments}`;
    if (perimLabel) perimLabel.textContent = `(4/3)^${iter} ≈ ${perimRatio}× inicial`;
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (iter > 0) { iter--; draw(); }
    });
  }
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (iter < 4) { iter++; draw(); }
    });
  }

  draw();
}

/** 5.5 Atractor de Lorenz 3D en Vivo (Slide 4.1) */
function initLorenzCanvas() {
  const canvas = document.getElementById('canvasLorenz');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let x = 0.1, y = 0, z = 0;
  const sigma = 10, rho = 28, beta = 8 / 3;
  const dt = 0.01;
  const points = [];
  let rot = 0;

  function render() {
    // Calcular 5 pasos por frame para mayor fluidez
    for (let i = 0; i < 5; i++) {
      const dx = sigma * (y - x) * dt;
      const dy = (x * (rho - z) - y) * dt;
      const dz = (x * y - beta * z) * dt;
      x += dx; y += dy; z += dz;
      points.push({ x, y, z });
      if (points.length > 800) points.shift();
    }

    ctx.fillStyle = 'rgba(9, 13, 22, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = 5.2;

    ctx.lineWidth = 1.2;
    ctx.beginPath();

    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      // Rotar en el eje Y
      const rx = pt.x * cosR - pt.z * sinR;
      const rz = pt.x * sinR + pt.z * cosR;

      const px = cx + rx * scale;
      const py = cy - (pt.y - 25) * scale;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.strokeStyle = '#00F5D4';
    ctx.shadowColor = '#00F5D4';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    rot += 0.006;
    requestAnimationFrame(render);
  }
  render();
}

/** 5.6 Simulador de Tiempo de Escape (Slide 4.3) */
function initEscapeTimeCanvas() {
  const canvas = document.getElementById('canvasEscapeTime');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const btnA = document.getElementById('btnTestPointA');
  const btnB = document.getElementById('btnTestPointB');
  const btnC = document.getElementById('btnTestPointC');

  let currentPoint = { x: 0.8, y: 0.7, label: 'A (Escape Rápido)', color: '#0284C7' };

  function draw() {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const rEscape = 80;

    // Ejes complejos
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height);
    ctx.stroke();

    // Círculo de escape |z| = 2
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, rEscape, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.fillText('Radio de escape (|z| = 2)', cx + rEscape - 30, cy - rEscape - 6);

    // Iterar la trayectoria de currentPoint
    let zx = 0, zy = 0;
    const cx0 = currentPoint.x;
    const cy0 = currentPoint.y;
    const scale = rEscape / 2;

    ctx.strokeStyle = currentPoint.color;
    ctx.fillStyle = currentPoint.color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < 25; i++) {
      const px = cx + zx * scale;
      const py = cy - zy * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);

      ctx.fillRect(px - 2, py - 2, 4, 4);

      // z_next = z^2 + c
      const nx = zx * zx - zy * zy + cx0;
      const ny = 2 * zx * zy + cy0;
      zx = nx;
      zy = ny;

      if (zx * zx + zy * zy > 4) {
        // Marcador de punto de escape
        const epX = cx + zx * scale;
        const epY = cy - zy * scale;
        ctx.lineTo(epX, epY);
        break;
      }
    }
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '11px monospace';
    ctx.fillText(`Punto evaluado: c = (${cx0}, ${cy0}i)`, 15, 20);
    ctx.fillText(`Destino: ${currentPoint.label}`, 15, 36);
  }

  if (btnA) {
    btnA.addEventListener('click', () => {
      currentPoint = { x: 0.6, y: 0.8, label: 'Escape en Iteración 3 → Azul', color: '#38BDF8' };
      draw();
    });
  }
  if (btnB) {
    btnB.addEventListener('click', () => {
      currentPoint = { x: -0.74, y: 0.11, label: 'Borde Complejo: Escape en Iteración 22 → Naranja', color: '#FB923C' };
      draw();
    });
  }
  if (btnC) {
    btnC.addEventListener('click', () => {
      currentPoint = { x: -0.1, y: 0.2, label: 'Órbita Atrapada Eterna → Negro', color: '#10B981' };
      draw();
    });
  }

  draw();
}

/** 5.7 Mandelbrot Deep Zoom Simulado en 60fps (Slide 4.4) */
function initMandelbrotZoomCanvas() {
  const canvas = document.getElementById('canvasMandelbrotZoom');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let zoom = 1;
  let counterElem = document.getElementById('zoomLevelCounter');

  function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Renderizar espirales de Seahorse Valley en movimiento continuo
    for (let r = 20; r < 340; r += 12) {
      ctx.beginPath();
      const phase = (r * 0.05 - zoom * 0.04) % (Math.PI * 2);
      ctx.arc(cx, cy, r, phase, phase + Math.PI * 1.5);
      const hue = (r * 2 + zoom * 20) % 360;
      ctx.strokeStyle = `hsl(${hue}, 85%, 55%)`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    zoom += 0.8;
    if (counterElem && Math.floor(zoom) % 15 === 0) {
      const exp = 4 + Math.floor(zoom / 20);
      counterElem.textContent = `Magnificación: 10^${exp}×`;
    }

    requestAnimationFrame(render);
  }
  render();
}

/** 5.8 Helecho de Barnsley por Caos (Slide 5.2) */
function initBarnsleyCanvas() {
  const canvas = document.getElementById('canvasBarnsley');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const btnRegen = document.getElementById('btnRegenBarnsley');

  function draw() {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let x = 0, y = 0;
    const totalPoints = 18000;
    const cx = canvas.width / 2;
    const cy = canvas.height - 15;
    const scale = canvas.height / 11;

    ctx.fillStyle = 'rgba(16, 185, 129, 0.65)';

    for (let i = 0; i < totalPoints; i++) {
      const r = Math.random();
      let nx, ny;
      if (r < 0.01) {
        nx = 0;
        ny = 0.16 * y;
      } else if (r < 0.86) {
        nx = 0.85 * x + 0.04 * y;
        ny = -0.04 * x + 0.85 * y + 1.6;
      } else if (r < 0.93) {
        nx = 0.2 * x - 0.26 * y;
        ny = 0.23 * x + 0.22 * y + 1.6;
      } else {
        nx = -0.15 * x + 0.28 * y;
        ny = 0.26 * x + 0.24 * y + 0.44;
      }
      x = nx;
      y = ny;

      const px = cx + x * scale;
      const py = cy - y * scale;
      ctx.fillRect(px, py, 1.2, 1.2);
    }
  }

  if (btnRegen) {
    btnRegen.addEventListener('click', draw);
  }
  draw();
}

/** 5.9 Ruido Fractal fBm para Montañas (Slide 6.2) */
function initFbmCanvas() {
  const canvas = document.getElementById('canvasFbmTerrain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const b1 = document.getElementById('btnToggleOctave1');
  const b2 = document.getElementById('btnToggleOctave2');
  const b3 = document.getElementById('btnToggleOctave3');

  let oct1 = true, oct2 = true, oct3 = true;

  function draw() {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const baseLine = canvas.height - 25;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    for (let x = 0; x <= canvas.width; x += 2) {
      let h = 0;
      if (oct1) h += Math.sin(x * 0.01) * 45;
      if (oct2) h += Math.sin(x * 0.035 + 1.2) * 22;
      if (oct3) h += Math.sin(x * 0.1 + 3.4) * 8;

      const y = baseLine - h;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 50, 0, canvas.height);
    grad.addColorStop(0, '#38BDF8');
    grad.addColorStop(0.6, '#0284C7');
    grad.addColorStop(1, '#0F172A');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#00F5D4';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  if (b1) b1.addEventListener('click', () => { oct1 = !oct1; b1.classList.toggle('btn-accent', oct1); draw(); });
  if (b2) b2.addEventListener('click', () => { oct2 = !oct2; b2.classList.toggle('btn-accent', oct2); draw(); });
  if (b3) b3.addEventListener('click', () => { oct3 = !oct3; b3.classList.toggle('btn-accent', oct3); draw(); });

  if (b1) b1.classList.add('btn-accent');
  if (b2) b2.classList.add('btn-accent');
  if (b3) b3.classList.add('btn-accent');
  draw();
}

/** 5.10 Ondas en Antena Sierpinski (Slide 7.2) */
function initSierpinskiCanvas() {
  const canvas = document.getElementById('canvasSierpinskiAntenna');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let waveOffset = 0;

  function drawTriangle(p1, p2, p3, depth) {
    if (depth === 0) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();
      return;
    }
    const mid12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const mid23 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
    const mid31 = { x: (p3.x + p1.x) / 2, y: (p3.y + p1.y) / 2 };

    drawTriangle(p1, mid12, mid31, depth - 1);
    drawTriangle(mid12, p2, mid23, depth - 1);
    drawTriangle(mid31, mid23, p3, depth - 1);
  }

  function render() {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = 80;

    const p1 = { x: cx, y: cy - r };
    const p2 = { x: cx + r * 1.15, y: cy + r * 0.85 };
    const p3 = { x: cx - r * 1.15, y: cy + r * 0.85 };

    ctx.fillStyle = '#C98A2C';
    drawTriangle(p1, p2, p3, 3);

    // Ondas electromagnéticas animadas
    const waveColors = ['#0284C7', '#10B981', '#F59E0B', '#7B2CBF'];
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = waveColors[i];
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const radius = ((waveOffset + i * 25) % 110) + 15;
      ctx.arc(cx, cy, radius, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }

    waveOffset += 0.8;
    requestAnimationFrame(render);
  }
  render();
}

/** 5.11 Criptografía del Caos (Slide 8.1 - Arnold's Cat Map interactivo con Img/9.png) */
function initChaosCryptoCanvas() {
  const canvas = document.getElementById('canvasChaosCrypto');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const btnStep = document.getElementById('btnArnoldStep');
  const btnUnstep = document.getElementById('btnArnoldUnstep');
  const btnAuto = document.getElementById('btnArnoldAuto');
  const btnReset = document.getElementById('btnArnoldReset');
  const iterCountEl = document.getElementById('arnoldIterCount');
  const stateDescEl = document.getElementById('arnoldStateDesc');

  const N = 240;
  const PERIOD = 60; // Periodo de Poincaré exacto para N=240 en el toro 2D
  canvas.width = N;
  canvas.height = N;

  let originalData = null;
  let currentPixels = null;
  let iteration = 0;
  let isAutoPlaying = false;
  let autoTimer = null;

  // Función para inicializar píxeles desde imagen cargada
  function onCatImageReady(img) {
    try {
      ctx.clearRect(0, 0, N, N);
      ctx.drawImage(img, 0, 0, N, N);
      const imgData = ctx.getImageData(0, 0, N, N);
      originalData = new Uint32Array(imgData.data.buffer);
      currentPixels = new Uint32Array(originalData);
      updateUI();
    } catch (err) {
      console.warn('Canvas bloqueado por política local file://, activando renderizador directo del gato:', err);
      initFallbackCat();
    }
  }

  // Generador de respaldo de alta fidelidad dibujado en canvas (inmune a restricciones CORS locales)
  function initFallbackCat() {
    ctx.fillStyle = '#0B132B';
    ctx.fillRect(0, 0, N, N);

    // Silueta de cabeza
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(N / 2, N / 2 + 15, 65, 0, Math.PI * 2);
    ctx.fill();

    // Orejas
    ctx.beginPath();
    ctx.moveTo(N / 2 - 55, N / 2 - 15);
    ctx.lineTo(N / 2 - 70, N / 2 - 70);
    ctx.lineTo(N / 2 - 15, N / 2 - 40);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(N / 2 + 55, N / 2 - 15);
    ctx.lineTo(N / 2 + 70, N / 2 - 70);
    ctx.lineTo(N / 2 + 15, N / 2 - 40);
    ctx.closePath();
    ctx.fill();

    // Ojos
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.ellipse(N / 2 - 25, N / 2 + 5, 12, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(N / 2 + 25, N / 2 + 5, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#05080E';
    ctx.beginPath();
    ctx.ellipse(N / 2 - 25, N / 2 + 5, 4, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(N / 2 + 25, N / 2 + 5, 4, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nariz
    ctx.fillStyle = '#EC4899';
    ctx.beginPath();
    ctx.moveTo(N / 2 - 8, N / 2 + 26);
    ctx.lineTo(N / 2 + 8, N / 2 + 26);
    ctx.lineTo(N / 2, N / 2 + 35);
    ctx.closePath();
    ctx.fill();

    // Bigotes
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(N / 2 - 18, N / 2 + 30); ctx.lineTo(N / 2 - 75, N / 2 + 22);
    ctx.moveTo(N / 2 - 18, N / 2 + 35); ctx.lineTo(N / 2 - 80, N / 2 + 38);
    ctx.moveTo(N / 2 - 18, N / 2 + 40); ctx.lineTo(N / 2 - 70, N / 2 + 52);
    ctx.moveTo(N / 2 + 18, N / 2 + 30); ctx.lineTo(N / 2 + 75, N / 2 + 22);
    ctx.moveTo(N / 2 + 18, N / 2 + 35); ctx.lineTo(N / 2 + 80, N / 2 + 38);
    ctx.moveTo(N / 2 + 18, N / 2 + 40); ctx.lineTo(N / 2 + 70, N / 2 + 52);
    ctx.stroke();

    const imgData = ctx.getImageData(0, 0, N, N);
    originalData = new Uint32Array(imgData.data.buffer);
    currentPixels = new Uint32Array(originalData);
    updateUI();
  }

  const catImg = new Image();
  catImg.onload = () => onCatImageReady(catImg);
  catImg.onerror = () => {
    console.warn('Error al cargar imagen del gato, activando fallback procedural');
    initFallbackCat();
  };

  // Cargar desde base64 embebido si existe para saltar restricciones locales
  if (window.ARNOLD_CAT_BASE64) {
    catImg.src = window.ARNOLD_CAT_BASE64;
  } else {
    catImg.src = 'Img/9.png';
  }

  if (catImg.complete && catImg.naturalWidth !== 0) {
    onCatImageReady(catImg);
  }

  function applyArnoldMap(direction = 1) {
    if (!currentPixels) {
      initFallbackCat();
    }
    if (!currentPixels) return;

    const nextPixels = new Uint32Array(N * N);

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let nx, ny;
        if (direction === 1) {
          // Mapeo directo: [1 1; 1 2] mod N
          nx = (x + y) % N;
          ny = (x + 2 * y) % N;
        } else {
          // Mapeo inverso: [2 -1; -1 1] mod N
          nx = (2 * x - y + N * 10) % N;
          ny = (-x + y + N * 10) % N;
        }
        nextPixels[ny * N + nx] = currentPixels[y * N + x];
      }
    }

    currentPixels = nextPixels;
    iteration = (iteration + direction + PERIOD) % PERIOD;

    const imgData = ctx.createImageData(N, N);
    new Uint32Array(imgData.data.buffer).set(currentPixels);
    ctx.putImageData(imgData, 0, 0);

    updateUI();
  }

  function resetOriginal() {
    stopAuto();
    if (!originalData) {
      initFallbackCat();
      return;
    }
    currentPixels = new Uint32Array(originalData);
    iteration = 0;
    const imgData = ctx.createImageData(N, N);
    new Uint32Array(imgData.data.buffer).set(currentPixels);
    ctx.putImageData(imgData, 0, 0);
    updateUI();
  }

  function toggleAuto() {
    if (isAutoPlaying) {
      stopAuto();
    } else {
      isAutoPlaying = true;
      if (btnAuto) btnAuto.textContent = '⏸ Pausar ciclo';
      autoTimer = setInterval(() => {
        applyArnoldMap(1);
      }, 95);
    }
  }

  function stopAuto() {
    isAutoPlaying = false;
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
    if (btnAuto) btnAuto.textContent = '▶ Animar ciclo';
  }

  function updateUI() {
    if (iterCountEl) iterCountEl.textContent = `${iteration} / ${PERIOD}`;
    if (stateDescEl) {
      if (iteration === 0) {
        stateDescEl.textContent = 'Imagen original intacta';
        stateDescEl.style.color = '#10B981';
      } else if (iteration === 1) {
        stateDescEl.textContent = 'Corte y estiramiento del plano (Paso 1)';
        stateDescEl.style.color = '#F59E0B';
      } else if (iteration === 2) {
        stateDescEl.textContent = 'Dispersión geométrica multiplicativa';
        stateDescEl.style.color = '#F59E0B';
      } else if (iteration === PERIOD - 1) {
        stateDescEl.textContent = 'Alineación de fases previas al retorno';
        stateDescEl.style.color = '#00F5D4';
      } else {
        stateDescEl.textContent = 'Cifrado caótico irreversible (Ruido puro)';
        stateDescEl.style.color = '#EF4444';
      }
    }
  }

  if (btnStep) btnStep.addEventListener('click', () => { stopAuto(); applyArnoldMap(1); });
  if (btnUnstep) btnUnstep.addEventListener('click', () => { stopAuto(); applyArnoldMap(-1); });
  if (btnAuto) btnAuto.addEventListener('click', toggleAuto);
  if (btnReset) btnReset.addEventListener('click', resetOriginal);
  canvas.addEventListener('click', () => { stopAuto(); applyArnoldMap(1); });
}

/** 5.12 Monitor SOC DDoS (Slide 8.2) */
function initSocMonitorCanvas() {
  const canvas = document.getElementById('canvasSocMonitor');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const btnNorm = document.getElementById('btnSimNormalTraffic');
  const btnDdos = document.getElementById('btnSimDdosAttack');
  const alertCard = document.getElementById('socAlertCard');
  const warnBox = document.getElementById('socWarningBox');

  let isDdos = false;
  let t = 0;

  function render() {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);

    for (let x = 0; x < canvas.width; x += 4) {
      let val;
      if (!isDdos) {
        // Tráfico autosimilar fractal con exponente de Hurst
        val = (Math.sin(x * 0.05 + t) * 15) + (Math.sin(x * 0.15 + t * 2) * 8) + (Math.random() * 12 - 6);
      } else {
        // Pico plano artificial saturado de DDoS
        val = 65 + Math.random() * 3;
      }
      ctx.lineTo(x, canvas.height / 2 - val);
    }

    ctx.strokeStyle = isDdos ? '#EF4444' : '#10B981';
    ctx.lineWidth = 2;
    ctx.stroke();

    t += 0.05;
    requestAnimationFrame(render);
  }

  if (btnNorm) {
    btnNorm.addEventListener('click', () => {
      isDdos = false;
      if (warnBox) warnBox.style.display = 'none';
      if (alertCard) alertCard.style.borderColor = '#334155';
    });
  }
  if (btnDdos) {
    btnDdos.addEventListener('click', () => {
      isDdos = true;
      if (warnBox) warnBox.style.display = 'block';
      if (alertCard) alertCard.style.borderColor = '#EF4444';
    });
  }

  render();
}

/** 5.12b Renderizador WebGL Ray Marching del Mandelbulb 3D (Slide 9.1) */
function initMandelbulb3DCanvas() {
  const canvas = document.getElementById('canvasMandelbulb3D');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance' }) ||
             canvas.getContext('experimental-webgl');
  if (!gl) {
    console.warn('WebGL no disponible para Mandelbulb 3D');
    return;
  }

  const vsSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;

    // Estimador de Distancia del Mandelbulb (Orden 8 - White & Nylander)
    float mandelbulbDE(vec3 p, out float trap) {
      vec3 z = p;
      float dr = 1.0;
      float r = 0.0;
      const float power = 8.0;
      trap = 1e5;

      for (int i = 0; i < 6; i++) {
        r = length(z);
        if (r > 2.0) break;
        trap = min(trap, length(z.xz));

        float invr = max(r, 1e-5);
        float theta = acos(clamp(z.z / invr, -1.0, 1.0));
        float phi = atan(z.y, z.x);

        dr = pow(r, power - 1.0) * power * dr + 1.0;

        float zr = pow(r, power);
        theta = theta * power;
        phi = phi * power;

        z = zr * vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta)) + p;
      }
      return 0.5 * log(r) * r / dr;
    }

    vec3 calcNormal(vec3 p) {
      float dummy;
      float d = mandelbulbDE(p, dummy);
      vec2 e = vec2(0.003, 0.0);
      return normalize(vec3(
        mandelbulbDE(p + e.xyy, dummy) - d,
        mandelbulbDE(p + e.yxy, dummy) - d,
        mandelbulbDE(p + e.yyx, dummy) - d
      ));
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

      // Rotación orbital suave con interacción de arrastre
      float angleY = u_time * 0.22 + u_mouse.x * 3.14159;
      float angleX = clamp(0.32 + u_mouse.y * 1.1, -1.1, 1.1);

      vec3 ro = vec3(2.5 * sin(angleY) * cos(angleX), 2.5 * sin(angleX), 2.5 * cos(angleY) * cos(angleX));
      vec3 ta = vec3(0.0, 0.0, 0.0);
      vec3 ww = normalize(ta - ro);
      vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
      vec3 vv = cross(uu, ww);
      vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.65 * ww);

      float t = 0.0;
      float trap = 0.0;
      float hit = 0.0;
      float minDist = 1e5;

      for (int i = 0; i < 54; i++) {
        vec3 p = ro + rd * t;
        float d = mandelbulbDE(p, trap);
        minDist = min(minDist, d);
        if (d < 0.0018) {
          hit = 1.0;
          break;
        }
        t += d * 0.72;
        if (t > 4.5) break;
      }

      vec3 col = vec3(0.025, 0.04, 0.075);

      if (hit > 0.5) {
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);
        vec3 l1 = normalize(vec3(1.2, 1.8, 1.4));
        vec3 l2 = normalize(vec3(-1.2, -1.0, -0.8));

        float diff1 = max(dot(n, l1), 0.0);
        float diff2 = max(dot(n, l2), 0.0) * 0.35;
        vec3 ref = reflect(rd, n);
        float spec = pow(max(dot(ref, l1), 0.0), 20.0);

        // Estética mística Doctor Strange: oro cósmico, ámbar, cian y violeta
        vec3 baseCol = mix(vec3(0.98, 0.65, 0.18), vec3(0.12, 0.88, 0.95), clamp(trap * 2.4, 0.0, 1.0));
        baseCol = mix(baseCol, vec3(0.72, 0.28, 0.88), clamp(p.y * 0.5 + 0.5, 0.0, 1.0));

        col = baseCol * (diff1 * 0.85 + diff2 + 0.25) + vec3(1.0, 0.95, 0.75) * spec * 0.75;

        float fresnel = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);
        col += vec3(0.2, 0.85, 1.0) * fresnel * 0.55;
        col = mix(col, vec3(0.025, 0.04, 0.075), smoothstep(2.2, 4.5, t));
      } else {
        col += vec3(0.95, 0.6, 0.15) * (0.028 / (minDist * 9.0 + 0.45));
      }

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function createShader(gl, type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Error al compilar shader:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Error al enlazar programa WebGL:', gl.getProgramInfoLog(prog));
    return;
  }

  const positionLocation = gl.getAttribLocation(prog, 'a_position');
  const resolutionLocation = gl.getUniformLocation(prog, 'u_resolution');
  const timeLocation = gl.getUniformLocation(prog, 'u_time');
  const mouseLocation = gl.getUniformLocation(prog, 'u_mouse');

  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]), gl.STATIC_DRAW);

  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let isDragging = false;
  let prevDragX = 0, prevDragY = 0;

  function onPointerDown(e) {
    isDragging = true;
    prevDragX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    prevDragY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const curX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const curY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const dx = (curX - prevDragX) / canvas.clientWidth;
    const dy = (curY - prevDragY) / canvas.clientHeight;
    targetMouseX += dx * 2.0;
    targetMouseY -= dy * 2.0;
    prevDragX = curX;
    prevDragY = curY;
  }

  function onPointerUp() {
    isDragging = false;
  }

  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  const startTime = performance.now();
  const slideParent = canvas.closest('.presentation-slide');

  function render() {
    requestAnimationFrame(render);

    // Renderizar solo cuando la diapositiva esté activa
    if (slideParent && !slideParent.classList.contains('active')) {
      return;
    }

    mouseX += (targetMouseX - mouseX) * 0.1;
    mouseY += (targetMouseY - mouseY) * 0.1;

    const elapsedTime = (performance.now() - startTime) * 0.001;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(prog);

    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, elapsedTime);
    gl.uniform2f(mouseLocation, mouseX, mouseY);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  requestAnimationFrame(render);
}

/** 5.13 Visualizador Musical de Bach (Slide 9.2) */
function initBachCanvas() {
  const canvas = document.getElementById('canvasBachMusic');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let t = 0;

  function render() {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barCount = 32;
    const barWidth = canvas.width / barCount;

    for (let i = 0; i < barCount; i++) {
      // Distribución 1/f (ruido rosa musical)
      const f = (i + 1) / barCount;
      const pinkNoise = (1 / Math.sqrt(f)) * (Math.sin(t + i * 0.3) * 0.3 + 0.7);
      const h = Math.min(canvas.height - 10, pinkNoise * 22);

      const grad = ctx.createLinearGradient(0, canvas.height - h, 0, canvas.height);
      grad.addColorStop(0, '#A855F7');
      grad.addColorStop(1, '#6366F1');
      ctx.fillStyle = grad;

      ctx.fillRect(i * barWidth + 2, canvas.height - h, barWidth - 4, h);
    }

    t += 0.08;
    requestAnimationFrame(render);
  }
  render();
}

/** 5.14 Paradoja de la Costa Británica - Animación Fractal Dinámica (Slide 9.3) */
function initCoastlineCanvas() {
  const canvas = document.getElementById('canvasCoastline');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hudScale = document.getElementById('rulerScaleText');
  const hudDist = document.getElementById('coastDistText');
  const slideParent = canvas.closest('.presentation-slide');

  // Coordenadas georreferenciadas de la costa de Gran Bretaña
  const basePoints = [
    [300, 395], [315, 405], [350, 395], [380, 385], [420, 380], [455, 375],
    [495, 365], [500, 350], [470, 345], [490, 325], [500, 305], [510, 280],
    [455, 260], [460, 245], [455, 220], [455, 200], [445, 180], [440, 165],
    [430, 140], [425, 110], [415, 90], [385, 80], [405, 70], [390, 60],
    [410, 40], [405, 25], [355, 30], [365, 20], [380, 10], [370, 5],
    [330, 12], [320, 32], [305, 52], [295, 72], [310, 90], [300, 120],
    [325, 115], [330, 135], [310, 155], [350, 160], [350, 180], [360, 200],
    [355, 212], [350, 226], [340, 234], [322, 234], [306, 236], [294, 254],
    [314, 280], [289, 300], [309, 315], [322, 320], [350, 320], [334, 340],
    [309, 350], [304, 370]
  ];

  // Subdivisión fractal por desplazamiento de punto medio (Midpoint displacement)
  function subdivide(pts, roughness, depth) {
    let current = pts;
    for (let d = 0; d < depth; d++) {
      const next = [];
      for (let i = 0; i < current.length; i++) {
        const p1 = current[i];
        const p2 = current[(i + 1) % current.length];
        next.push(p1);

        const mx = (p1[0] + p2[0]) / 2;
        const my = (p1[1] + p2[1]) / 2;
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const len = Math.hypot(dx, dy);

        const seed = Math.sin(i * 127.1 + d * 311.7) * 43758.5453;
        const rnd = (seed - Math.floor(seed)) * 2 - 1;
        const perpX = -dy / len;
        const perpY = dx / len;
        const disp = rnd * len * roughness;

        next.push([mx + perpX * disp, my + perpY * disp]);
      }
      current = next;
    }
    return current;
  }

  const fractalCoast = subdivide(basePoints, 0.22, 3);

  // Fases de escala de regla (de mayor a menor)
  const scales = [
    { label: '200 km', stepDist: 80, distText: '2,400 km', color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.45)', speed: 1 },
    { label: '100 km', stepDist: 40, distText: '2,800 km', color: '#10B981', glow: 'rgba(16, 185, 129, 0.45)', speed: 2 },
    { label: '50 km',  stepDist: 20, distText: '3,450 km', color: '#00F5D4', glow: 'rgba(0, 245, 212, 0.45)', speed: 3 },
    { label: '20 km',  stepDist: 10, distText: '4,800 km', color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.45)', speed: 5 },
    { label: '1 mm (microscópica)', stepDist: 4, distText: '→ ∞ (Tiende al infinito)', color: '#FF007F', glow: 'rgba(255, 0, 127, 0.55)', speed: 12 }
  ];

  // Pre-computar segmentos para cada escala según el método de Richardson
  function computeSegments(pts, stepDist) {
    const segs = [];
    let curIdx = 0;
    while (curIdx < pts.length) {
      let nextIdx = curIdx + 1;
      let found = false;
      while (nextIdx < pts.length) {
        const d = Math.hypot(pts[nextIdx][0] - pts[curIdx][0], pts[nextIdx][1] - pts[curIdx][1]);
        if (d >= stepDist) {
          segs.push({ p1: pts[curIdx], p2: pts[nextIdx], dist: d });
          curIdx = nextIdx;
          found = true;
          break;
        }
        nextIdx++;
      }
      if (!found) {
        const d = Math.hypot(pts[0][0] - pts[curIdx][0], pts[0][1] - pts[curIdx][1]);
        if (d > 2) {
          segs.push({ p1: pts[curIdx], p2: pts[0], dist: d });
        }
        break;
      }
    }
    return segs;
  }

  const precomputedScales = scales.map(sc => ({
    ...sc,
    segments: computeSegments(fractalCoast, sc.stepDist)
  }));

  let currentScaleIdx = 0;
  let drawnSegmentsCount = 0;
  let animTimer = 0;
  let holdTimer = 0;
  let isPaused = false;

  canvas.addEventListener('click', () => {
    isPaused = !isPaused;
  });

  function render() {
    requestAnimationFrame(render);

    if (slideParent && !slideParent.classList.contains('active')) {
      return;
    }

    if (!isPaused) {
      const currentScale = precomputedScales[currentScaleIdx];

      if (drawnSegmentsCount < currentScale.segments.length) {
        animTimer += currentScale.speed;
        if (animTimer >= 2) {
          drawnSegmentsCount++;
          animTimer = 0;
        }
      } else {
        // Pausa de observación al completar la vuelta
        holdTimer++;
        if (holdTimer > 120) { // ~2 segundos a 60fps
          holdTimer = 0;
          drawnSegmentsCount = 0;
          currentScaleIdx = (currentScaleIdx + 1) % precomputedScales.length;
        }
      }
    }

    const currentScale = precomputedScales[currentScaleIdx];
    const segs = currentScale.segments;

    // Actualizar HUD
    if (hudScale) hudScale.textContent = currentScale.label;
    if (hudDist) {
      if (drawnSegmentsCount >= segs.length) {
        hudDist.textContent = currentScale.distText;
      } else {
        const fraction = Math.min(1, drawnSegmentsCount / segs.length);
        if (currentScaleIdx === precomputedScales.length - 1) {
          hudDist.textContent = `Midiendo... (${Math.round(fraction * 100)}%)`;
        } else {
          const approxKm = Math.round(parseInt(currentScale.distText.replace(/\D/g, ''), 10) * fraction);
          hudDist.textContent = `Midiendo: ${approxKm.toLocaleString()} km`;
        }
      }
    }

    // Dibujado del lienzo
    ctx.fillStyle = '#05080E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rejilla de coordenadas y cartografía
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 40; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 40; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Silueta de la masa continental (Isla de Gran Bretaña)
    ctx.fillStyle = '#0B1526';
    ctx.beginPath();
    fractalCoast.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt[0], pt[1]);
      else ctx.lineTo(pt[0], pt[1]);
    });
    ctx.closePath();
    ctx.fill();

    // Contorno real detallado de la costa
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    fractalCoast.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt[0], pt[1]);
      else ctx.lineTo(pt[0], pt[1]);
    });
    ctx.closePath();
    ctx.stroke();

    // Dibujar segmentos de la regla fractal
    const activeSegCount = Math.min(drawnSegmentsCount, segs.length);
    if (activeSegCount > 0) {
      ctx.save();
      ctx.strokeStyle = currentScale.color;
      ctx.lineWidth = currentScaleIdx >= 3 ? 2 : 3;
      ctx.shadowColor = currentScale.glow;
      ctx.shadowBlur = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      for (let i = 0; i < activeSegCount; i++) {
        const s = segs[i];
        if (i === 0) ctx.moveTo(s.p1[0], s.p1[1]);
        ctx.lineTo(s.p2[0], s.p2[1]);
      }
      ctx.stroke();

      // Alfileres de medición en cada punto de apoyo
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < activeSegCount; i++) {
        const s = segs[i];
        ctx.beginPath();
        ctx.arc(s.p1[0], s.p1[1], currentScaleIdx >= 3 ? 1.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Cursor o compás animado en el punto de medición activo
      if (drawnSegmentsCount < segs.length && activeSegCount > 0) {
        const activeSeg = segs[activeSegCount - 1];
        ctx.save();
        ctx.fillStyle = currentScale.color;
        ctx.shadowColor = currentScale.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(activeSeg.p2[0], activeSeg.p2[1], 5, 0, Math.PI * 2);
        ctx.fill();

        // Anillo de pulso radar
        const pulseR = 5 + (performance.now() * 0.015) % 12;
        ctx.strokeStyle = currentScale.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(activeSeg.p2[0], activeSeg.p2[1], pulseR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Leyenda informativa fija en esquina inferior izquierda
    ctx.fillStyle = '#EEF1F5';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText('Simulación del Experimento de Richardson & Mandelbrot (1967)', 20, canvas.height - 35);
    ctx.fillStyle = 'rgba(238, 241, 245, 0.6)';
    ctx.font = '400 11px system-ui, sans-serif';
    ctx.fillText('Segmentos trazados: ' + activeSegCount + ' de ' + segs.length + (isPaused ? ' · ⏸ PAUSADO (Clic para reanudar)' : ' · Auto-animación continua'), 20, canvas.height - 18);
  }

  render();
}
