(() => {
      const stage = document.getElementById('stage');
      if (!stage) return;
      const $ = id => document.getElementById(id);
      const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
      const ease = x => x * x * (3 - 2 * x);
      const phase = (p, a, b) => ease(clamp((p - a) / (b - a)));
      const lerp = (a, b, t) => a + (b - a) * t;
      const first = {
        this: { sx: 6, sy: 10, sr: -9, tx: 0, ty: 14, group: 'top' },
        was: { sx: 44, sy: 6, sr: 6, tx: 0, ty: 14, group: 'top' },
        my: { sx: 82, sy: 14, sr: -5, tx: 0, ty: 14, group: 'top' },
        first: { sx: 10, sy: 38, sr: 8, tx: 0, ty: 36, group: 'top' },
        ever: { sx: 46, sy: 44, sr: -7, tx: 0, ty: 36, group: 'top' },
        deployed: { sx: 80, sy: 36, sr: 5, tx: 0, ty: 36, group: 'bottom' },
        web: { sx: 6, sy: 70, sr: -6, tx: 0, ty: 58, group: 'bottom' },
        development: { sx: 42, sy: 78, sr: 7, tx: 0, ty: 58, group: 'bottom' },
        project: { sx: 78, sy: 66, sr: -8, tx: 0, ty: 58, group: 'bottom' }
      };
      const ids = Object.keys(first);
      function layoutFirst() {
        const gap = 32;
        const edge = 8; 
        const vw = window.innerWidth / 100;
        const px = id => $(id) ? $(id).getBoundingClientRect().width : 0;
        const placeLine = (line, y) => {
          const widths = line.map(px);
          const total = widths.reduce((sum, w) => sum + w, 0) + gap * (line.length - 1);
          let left = Math.max(edge, (window.innerWidth - total) / 2);
          line.forEach((id, i) => {
            const w = widths[i];
            const maxLeft = Math.max(edge, window.innerWidth - edge - w);
            const clampedLeft = Math.min(left, maxLeft);
            if (first[id]) {
              first[id].tx = clampedLeft / vw;
              first[id].ty = y;
            }
            left = clampedLeft + w + gap;
          });
        };
        placeLine(['this', 'was', 'my'], 14);
        placeLine(['first', 'ever', 'deployed'], 36);
        if (isMobileTypo) {
          placeLine(['web', 'development'], 56);
          placeLine(['project'], 72);
        } else {
          placeLine(['web', 'development', 'project'], 58);
        }
      }
      const isMobileTypo = window.matchMedia('(max-width: 700px)').matches;
      const ANIM_VH_BASE = isMobileTypo ? 280 : 1160;
      const SEC1_SHIFT = 0.06;
      const sh = (a, b) => [a - SEC1_SHIFT, b - SEC1_SHIFT];
      const TAIL_START = 0.56 - SEC1_SHIFT; 
      const TAIL_SCALE = isMobileTypo ? 1 : 0.25;
      const HOLD_VH_BASE = 1650 - ANIM_VH_BASE; 
      const TAIL_VH_BASE = (1 - TAIL_START) * ANIM_VH_BASE; 
      const TAIL_VH_NEW = TAIL_VH_BASE * TAIL_SCALE;
      const ANIM_VH = TAIL_START * ANIM_VH_BASE + TAIL_VH_NEW;
      const HOLD_VH = HOLD_VH_BASE * TAIL_SCALE;
      if (!isMobileTypo) {
        stage.style.height = `${ANIM_VH + HOLD_VH}vh`;
      }
      function compressProc(x) {
        if (x <= TAIL_START) return x;
        const vh = TAIL_START * ANIM_VH_BASE + (x - TAIL_START) * ANIM_VH_BASE * TAIL_SCALE;
        return vh / ANIM_VH;
      }
      const shp = (a, b) => {
        const [na, nb] = sh(a, b);
        return [compressProc(na), compressProc(nb)];
      };
      function finalPhase(a, b) {
        const [na, nb] = shp(a, b);
        const width = nb - na;
        const scale = isMobileTypo ? 0.4 : 0.3;
        return [na, na + width * scale];
      }
      function render() {
        const rect = stage.getBoundingClientRect();
        const maxTravel = Math.max(1, stage.offsetHeight - window.innerHeight);
        const sectionScrolled = -rect.top;
        const animMax = Math.max(1, (ANIM_VH / 100) * window.innerHeight);
        const p = clamp(sectionScrolled / animMax);
        const counterEl = $('counter');
        if (counterEl) {
          counterEl.textContent = String(Math.round(p * 100)).padStart(2, '0') + '%';
        }
        const move = phase(p, compressProc(0), compressProc(0.0378));
        const topFade = 1 - phase(p, compressProc(0.119), compressProc(0.14));
        const bottomFade = topFade;
        const wordColorVal = Math.round(lerp(185, 0, move));
        const wordColor = `rgb(${wordColorVal},${wordColorVal},${wordColorVal})`;
        ids.forEach((id) => {
          const c = first[id], el = $(id);
          if (!el) return;
          const x = c.sx + (c.tx - c.sx) * move;
          const y = c.sy + (c.ty - c.sy) * move;
          const r = c.sr * (1 - move);
          el.style.transform = `translate3d(${x}vw,${y}vh,0) rotate(${r}deg)`;
          el.style.opacity = c.group === 'top' ? topFade : bottomFade;
          el.style.color = wordColor;
        });
        const tin = phase(p, ...shp(0.248, 0.278));
        const tout = 1 - phase(p, ...shp(0.332, 0.356));
        const threeEl = $('three');
        if (threeEl) {
          threeEl.style.opacity = Math.min(tin, tout);
          threeEl.style.transform = `translateY(${24 * (1 - tin)}px)`;
        }
        const bgT = phase(p, ...shp(0.362, 0.452));
        const bgVal = Math.round(lerp(245, 0, bgT));
        const bgVal2 = Math.round(lerp(242, 0, bgT));
        const bgEl = $('bg');
        if (bgEl) {
          bgEl.style.background = `rgb(${bgVal},${bgVal},${bgVal2})`;
        }
        const qWrapIn = phase(p, ...shp(0.416, 0.446));
        const qWrapOut = 1 - phase(p, ...shp(0.545, 0.585));
        const qEl = $('question');
        if (qEl) qEl.style.opacity = Math.min(qWrapIn, qWrapOut);
        const [qA, qB] = shp(0.4222, 0.4222 + 0.150);
        const q = clamp((p - qA) / (qB - qA));
        const qText = $('questionText');
        if (qText) {
          if (window.matchMedia('(max-width: 760px)').matches) {
            const textWidth = qText.getBoundingClientRect().width;
            const startX = window.innerWidth;
            const endX = -textWidth;
            const easedQ = ease(q);
            const qx = startX + (endX - startX) * easedQ;
            qText.style.transform = `translate3d(${qx}px,-50%,0)`;
          } else {
            const qx = 110 + (-220) * ease(q);
            qText.style.transform = `translate3d(${qx}vw,-50%,0)`;
          }
        }
        const procIn = phase(p, ...shp(0.56, 0.60));
        const procOut = 1 - phase(p, ...shp(0.80, 0.83));
        const procEl = $('process');
        if (procEl) procEl.style.opacity = Math.min(procIn, procOut);
        const positions = [
          ['learn', 9, 8, -7, 1.1],
          ['research', 52, 4, 3, 0.8],
          ['try', 81, 21, 7, 1.25],
          ['rethink', 2, 33, -4, 0.85],
          ['explore', 29, 29, -2, 0.95],
          ['break', 53, 29, -9, 1.0],
          ['fail', 85, 42, 5, 0.9],
          ['repeat', 16, 50, 4, 1.15],
          ['adapt', 41, 63, -6, 1.05],
          ['debug', 83, 58, -2, 0.7],
          ['build', 5, 71, 3, 1.3],
          ['ship', 47, 84, -8, 0.95],
          ['again', 73, 73, 6, 0.8]
        ];
        positions.forEach((a, i) => {
          const el = $(a[0]);
          if (!el) return;
          const e = phase(p, ...shp(0.605 + i * 0.0055, 0.645 + i * 0.0055));
          const x = a[1] + (i % 2 ? -7 : 7) * (1 - e);
          const y = a[2] + (i % 2 ? 2 : -2) * (1 - e);
          const s = a[4];
          el.style.transform = `translate3d(${x}vw,${y}vh,0) rotate(${a[3]}deg) scale(${s})`;
          el.style.opacity = Math.min(1, e) * Math.min(1, procOut * 1.5);
        });
        const figIn = phase(p, ...shp(0.84, 0.86));
        const figOut = 1 - phase(p, ...shp(0.94, 0.955));
        const fig = Math.min(figIn, figOut);
        const figureEl = $('figure');
        if (figureEl) {
          figureEl.style.opacity = fig;
          figureEl.style.transform = `scale(${0.97 + 0.03 * figIn})`;
        }
        const fin = phase(p, ...finalPhase(0.965, 0.978));
        const finalEl = $('final');
        if (finalEl) finalEl.style.opacity = fin;
        [
          [$('f1'), ...finalPhase(0.965, 0.9689)],
          [$('f2'), ...finalPhase(0.972, 0.9772)],
          [$('f3'), ...finalPhase(0.980, 0.9865)]
        ].forEach(([el, a, b]) => {
          if (!el) return;
          const t = phase(p, a, b);
          el.style.opacity = t;
          el.style.transform = `translateY(${35 * (1 - t)}px)`;
        });
      }
      let raf = 0;
      window.addEventListener('scroll', () => {
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); });
      }, { passive: true });
      window.addEventListener('resize', () => { layoutFirst(); render(); });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          layoutFirst(); render();
          setTimeout(() => { layoutFirst(); render(); }, 120);
          setTimeout(() => { layoutFirst(); render(); }, 500);
        });
      }
      layoutFirst();
      render();
    })();
