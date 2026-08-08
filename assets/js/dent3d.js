/* =============================================================================
   Dent Ninja — "The reflection never lies"

   A real-time render of a steel panel sitting under a PDR reflector board.
   The dent is displaced analytically in the vertex shader (position AND
   normal), so the striped reflection bends over the damage exactly the way it
   does on a real panel — and straightens as the metal is worked back.

   Zero CPU geometry work per frame; everything is a uniform.
   ============================================================================= */

const canvas   = document.getElementById('dentCanvas');
const wrap     = canvas && canvas.parentElement;
const fallback = document.getElementById('stageFallback');
const stage    = canvas && canvas.closest('.stage');
const range    = document.getElementById('repair');
const out      = document.getElementById('repairOut');
const hud      = document.getElementById('hudLabel');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function showFallback() {
  if (canvas) canvas.style.display = 'none';
  if (fallback) fallback.hidden = false;
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

if (!canvas) {
  /* nothing to do */
} else if (!hasWebGL()) {
  showFallback();
} else {
  let THREE;
  try {
    THREE = await import('three');
  } catch (e) {
    showFallback();
  }
  if (THREE) boot(THREE);
}

/* ========================================================================== */
function boot(THREE) {

  /* ---------- renderer ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
    });
  } catch (e) { showFallback(); return; }

  const isPhone = window.matchMedia('(max-width: 860px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isPhone ? 1.75 : 2));
  renderer.outputColorSpace   = THREE.SRGBColorSpace;
  renderer.toneMapping        = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 9.4);

  /* ---------------------------------------------------------------------
     Environment: a procedural equirectangular "studio" containing the
     striped reflector board a PDR tech reads dents with.
     --------------------------------------------------------------------- */
  function buildEnvTexture() {
    const W = 2048, H = 1024;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');

    // base falloff — dark room
    const base = g.createLinearGradient(0, 0, 0, H);
    base.addColorStop(0.00, '#161d29');
    base.addColorStop(0.42, '#0b0f16');
    base.addColorStop(0.72, '#05070a');
    base.addColorStop(1.00, '#020305');
    g.fillStyle = base;
    g.fillRect(0, 0, W, H);

    // ---- the reflector board: hard horizontal bars, upper hemisphere ----
    const bandTop = H * 0.03, bandBot = H * 0.74;
    const bars = 10;
    const pitch = (bandBot - bandTop) / bars;

    for (let i = 0; i < bars; i++) {
      const y = bandTop + i * pitch;
      const h = pitch * 0.52;
      // slight brightness variation keeps it from looking CG-perfect
      const v = 0.86 + 0.14 * Math.sin(i * 1.7);
      const grd = g.createLinearGradient(0, y, 0, y + h);
      grd.addColorStop(0.00, 'rgba(255,255,255,0)');
      grd.addColorStop(0.14, `rgba(255,255,255,${v.toFixed(3)})`);
      grd.addColorStop(0.86, `rgba(255,255,255,${v.toFixed(3)})`);
      grd.addColorStop(1.00, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.fillRect(0, y, W, h);
    }

    // ---- cool rim light low and behind (flyer's electric blue) ----
    const rim = g.createRadialGradient(W * 0.72, H * 0.78, 0, W * 0.72, H * 0.78, W * 0.26);
    rim.addColorStop(0, 'rgba(77,141,255,0.34)');
    rim.addColorStop(1, 'rgba(77,141,255,0)');
    g.fillStyle = rim;
    g.fillRect(0, H * 0.6, W, H * 0.4);

    // ---- brand red kicker, low and to the other side ----
    const red = g.createRadialGradient(W * 0.16, H * 0.76, 0, W * 0.16, H * 0.76, W * 0.22);
    red.addColorStop(0, 'rgba(224,24,42,0.4)');
    red.addColorStop(1, 'rgba(224,24,42,0)');
    g.fillStyle = red;
    g.fillRect(0, H * 0.58, W * 0.6, H * 0.42);

    // ---- warm bounce from the floor ----
    const flr = g.createLinearGradient(0, H * 0.86, 0, H);
    flr.addColorStop(0, 'rgba(120,110,100,0)');
    flr.addColorStop(1, 'rgba(120,110,100,0.16)');
    g.fillStyle = flr;
    g.fillRect(0, H * 0.86, W, H * 0.14);

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envTex = buildEnvTexture();
  const envRT = pmrem.fromEquirectangular(envTex);
  scene.environment = envRT.texture;
  envTex.dispose();
  pmrem.dispose();

  /* ---------------------------------------------------------------------
     The panel
     --------------------------------------------------------------------- */
  const PW = 8.2, PH = 4.6;
  const segX = isPhone ? 190 : 260;
  const segY = isPhone ? 120 : 165;

  const geo = new THREE.PlaneGeometry(PW, PH, segX, segY);

  const uniforms = {
    uProgress: { value: 0 }   // 0 = dented, 1 = repaired
  };

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xc2cad6,
    metalness: 0.95,
    roughness: 0.085,
    clearcoat: 1.0,
    clearcoatRoughness: 0.022,
    envMapIntensity: 1.85,
    side: THREE.FrontSide
  });

  // three dents: main strike + two small dings.  vec4( cx, cy, sigma, amp )
  const DENTS = `
    const vec4 D0 = vec4(-1.10,  0.18, 0.55, 0.150);
    const vec4 D1 = vec4( 1.90, -0.70, 0.28, 0.072);
    const vec4 D2 = vec4( 1.15,  0.95, 0.22, 0.048);

    // factory crown. The vertical curve is what makes the reflected board
    // sweep across its bands — a dead-flat panel mirrors one band and shows
    // no stripes at all, which is exactly why a real tech crowns the read.
    const float CROWN_X = 0.008;
    const float CROWN_Y = 0.048;
  `;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uProgress = uniforms.uProgress;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `
        #include <common>
        uniform float uProgress;
        ${DENTS}

        // gaussian dent with a raised rim — how sheet metal actually deforms
        float dentAt(vec2 p, vec4 d, inout vec2 grad) {
          vec2  v  = p - d.xy;
          float s2 = d.z * d.z;
          float r2 = dot(v, v);
          float core = exp(-r2 / (2.0 * s2));
          float ring = (r2 / s2) * core;

          float dcx = core * (-v.x / s2);
          float dcy = core * (-v.y / s2);
          float drx = (2.0 * v.x / s2) * core + (r2 / s2) * dcx;
          float dry = (2.0 * v.y / s2) * core + (r2 / s2) * dcy;

          const float RIM = 0.26;
          grad += d.w * (vec2(-dcx, -dcy) + RIM * vec2(drx, dry));
          return d.w * (-core + RIM * ring);
        }

        float crownAt(vec2 p, inout vec2 grad) {
          grad += vec2(-2.0 * CROWN_X * p.x, -2.0 * CROWN_Y * p.y);
          return -(CROWN_X * p.x * p.x + CROWN_Y * p.y * p.y);
        }

        float surfaceAt(vec2 p, out vec3 nrm) {
          vec2 grad = vec2(0.0);
          float z = crownAt(p, grad);
          float amt = 1.0 - uProgress;
          vec2 dgrad = vec2(0.0);
          float dz = 0.0;
          dz += dentAt(p, D0, dgrad);
          dz += dentAt(p, D1, dgrad);
          dz += dentAt(p, D2, dgrad);
          z    += dz * amt;
          grad += dgrad * amt;
          nrm = normalize(vec3(-grad.x, -grad.y, 1.0));
          return z;
        }
      `)
      .replace('#include <beginnormal_vertex>', `
        vec3 dnNormal;
        float dnZ = surfaceAt(position.xy, dnNormal);
        vec3 objectNormal = dnNormal;
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif
      `)
      .replace('#include <begin_vertex>', `
        vec3 transformed = vec3(position.x, position.y, position.z + dnZ);
      `);
  };

  const panel = new THREE.Mesh(geo, mat);
  panel.rotation.set(-0.055, 0.085, 0.015);
  scene.add(panel);

  /* Polished metal takes essentially all of its look from the environment.
     Point lights would just stamp blown-out specular blobs on it, so the
     red/blue brand kickers live in the env map instead. This is the only
     direct light, and it stays weak — it just gives the form some shape. */
  const key = new THREE.DirectionalLight(0xdfe7f2, 0.35);
  key.position.set(-3, 4.5, 6);
  scene.add(key);

  /* ---------------------------------------------------------------------
     Sizing
     --------------------------------------------------------------------- */
  function resize() {
    const w = wrap.clientWidth || 800;
    const h = wrap.clientHeight || 450;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    // Frame *inside* the panel so its edges never enter shot — the panel is
    // meant to read as a car door, not a floating rectangle.
    const fill = 0.66;
    const fovRad = (camera.fov * Math.PI) / 180;
    const distForH = (PH * fill / 2) / Math.tan(fovRad / 2);
    const distForW = (PW * fill / 2) / (Math.tan(fovRad / 2) * camera.aspect);
    camera.position.z = Math.min(distForH, distForW) + 0.6;

    camera.updateProjectionMatrix();
  }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(wrap);
  else window.addEventListener('resize', resize);
  resize();

  /* ---------------------------------------------------------------------
     Interaction
     --------------------------------------------------------------------- */
  let progress = 0;          // rendered value
  let target   = 0;          // where we're heading
  let auto     = !reduced;   // auto-cycle until the user grabs the slider
  let autoT    = 0;
  let idleTimer = 0;

  function paintSlider(v) {
    if (range) {
      range.value = v;
      range.style.setProperty('--pct', v + '%');
    }
    if (out) out.textContent = Math.round(v) + '%';
  }

  function setHud(v) {
    if (!hud) return;
    const label = v < 12 ? 'DENT DETECTED'
                : v < 88 ? 'WORKING THE METAL'
                : 'PANEL READS TRUE';
    if (hud.textContent !== label) hud.textContent = label;
    if (stage) stage.classList.toggle('is-fixed', v >= 88);
  }

  function userTook() {
    auto = false;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { auto = !reduced; autoT = 0; }, 7000);
  }

  if (range) {
    // The auto-loop repaints the slider by assigning .value directly and never
    // fires 'input', so any input event here really is someone driving it —
    // including assistive tech, which is why this isn't gated on isTrusted.
    range.addEventListener('input', () => {
      userTook();
      target = parseFloat(range.value);
    });
    range.addEventListener('pointerdown', userTook);
  }

  /* pointer parallax on the panel itself */
  let pX = 0, pY = 0, cX = 0, cY = 0;
  if (!reduced) {
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      pX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }, { passive: true });
    wrap.addEventListener('pointerleave', () => { pX = 0; pY = 0; });
  }

  /* ---------------------------------------------------------------------
     Loop — only while on screen
     --------------------------------------------------------------------- */
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => { visible = en.isIntersecting; });
    }, { threshold: 0.02 }).observe(wrap);
  }

  const clock = new THREE.Clock();
  let frameId = 0;

  function tick() {
    frameId = requestAnimationFrame(tick);
    if (!visible) return;

    const dt = Math.min(clock.getDelta(), 0.05);

    if (auto) {
      autoT += dt;
      // dwell dented, work it out, dwell true, let it fall back
      const cycle = 9.0;
      const t = (autoT % cycle) / cycle;
      let v;
      if (t < 0.16)      v = 0;
      else if (t < 0.52) v = ease((t - 0.16) / 0.36) * 100;
      else if (t < 0.74) v = 100;
      else               v = (1 - ease((t - 0.74) / 0.26)) * 100;
      target = v;
      paintSlider(v);
    }

    progress += (target - progress) * Math.min(1, dt * 7.5);
    uniforms.uProgress.value = progress / 100;
    setHud(progress);

    cX += (pX - cX) * Math.min(1, dt * 3.4);
    cY += (pY - cY) * Math.min(1, dt * 3.4);

    const breathe = reduced ? 0 : Math.sin(clock.elapsedTime * 0.42) * 0.022;
    panel.rotation.y = 0.2 + cX * 0.2 + breathe;
    panel.rotation.x = -0.1 - cY * 0.14 + breathe * 0.5;

    renderer.render(scene, camera);
  }

  function ease(x) {
    x = Math.min(1, Math.max(0, x));
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  paintSlider(0);
  setHud(0);
  tick();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; }
    else if (!frameId) { clock.getDelta(); tick(); }
  });

  window.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(frameId);
    showFallback();
  });
}
