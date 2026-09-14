(function () {
      "use strict";
      var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var wavePath = document.getElementById("wavePath");
      var baseText = document.getElementById("baseText");
      var pctEl = document.getElementById("pct");
      var loader = document.getElementById("loader");
      var DURATION = window.matchMedia('(max-width: 700px)').matches ? 1400 : 3200;
      var start = null;
      var lastFrameTime = 0;
      var FRAME_INTERVAL = 1000 / 30;
      var SAMPLES = 25;
      var top = 40, bottom = 220, left = -100, right = 1100;
      function measure() {
        try {
          var bb = baseText.getBBox();
          var pad = bb.height * 0.15;
          top = bb.y - pad;
          bottom = bb.y + bb.height + pad;
          left = bb.x - bb.width * 0.1;
          right = bb.x + bb.width * 1.1;
        } catch (e) {  }
      }
      function buildPath(fillFrac, phase, amplitude) {
        var span = bottom - top;
        var topOvershoot = span * 0.08;
        var bottomOvershoot = span * 0.15;
        var travel = span + topOvershoot + bottomOvershoot;
        var baseY = (bottom + bottomOvershoot) - fillFrac * travel;
        var amp1 = amplitude * span;
        var amp2 = amp1 * 0.45;
        function waveY(frac) {
          return baseY
            + amp1 * Math.sin(frac * 6.28318 + phase)
            + amp2 * Math.sin(frac * 12.56636 - phase * 1.6);
        }
        var d = "M " + left.toFixed(1) + "," + waveY(0).toFixed(1);
        for (var i = 1; i < SAMPLES; i++) {
          var frac = i / (SAMPLES - 1);
          var x = left + (right - left) * frac;
          d += " L " + x.toFixed(1) + "," + waveY(frac).toFixed(1);
        }
        d += " L " + right.toFixed(1) + "," + (bottom + span).toFixed(1);
        d += " L " + left.toFixed(1) + "," + (bottom + span).toFixed(1);
        d += " Z";
        return d;
      }
      function waitForAssets() {
        var videoPromise = new Promise(function (resolve) {
          var vid = document.getElementById("vid-base");
          if (!vid || vid.readyState >= 3) {
            resolve();
            return;
          }
          var settled = false;
          var settle = function () {
            if (settled) return;
            settled = true;
            vid.removeEventListener("canplaythrough", onCanPlay);
            vid.removeEventListener("canplay", onCanPlay);
            vid.removeEventListener("error", onCanPlay);
            resolve();
          };
          var onCanPlay = function () { settle(); };
          vid.addEventListener("canplaythrough", onCanPlay, { once: true });
          vid.addEventListener("canplay", onCanPlay, { once: true });
          vid.addEventListener("error", onCanPlay, { once: true });
          var maxWait = window.matchMedia('(max-width: 700px)').matches ? 1800 : 3500;
          setTimeout(settle, maxWait);
        });
        var images = Array.from(document.querySelectorAll("img"));
        var imgPromises = images.map(function (img) {
          if (img.complete) return Promise.resolve();
          return new Promise(function (resolve) {
            var onDone = function () {
              img.removeEventListener("load", onDone);
              img.removeEventListener("error", onDone);
              resolve();
            };
            img.addEventListener("load", onDone, { once: true });
            img.addEventListener("error", onDone, { once: true });
          });
        });
        return Promise.all([videoPromise].concat(imgPromises));
      }
      function hideLoader() {
        pctEl.textContent = "loading\u2026\u00A0\u00A0100%";
        wavePath.setAttribute("d", buildPath(1, 0, 0));
        setTimeout(function () {
          loader.classList.add("done");
          document.body.classList.remove("is-loading");
          setTimeout(function () {
            loader.style.display = "none";
          }, 800);
        }, 250);
      }
      function runReduced() {
        var t0 = null;
        var timerPromise = new Promise(function (resolve) {
          function stepReduced(ts) {
            if (t0 === null) t0 = ts;
            var t = Math.min(1, (ts - t0) / DURATION);
            var progress = Math.floor(t * 100);
            pctEl.textContent = "loading\u2026\u00A0\u00A0" + progress + "%";
            wavePath.setAttribute("d", buildPath(progress / 100, 0, 0));
            if (t < 1) requestAnimationFrame(stepReduced); else resolve();
          }
          requestAnimationFrame(stepReduced);
        });
        Promise.all([timerPromise, waitForAssets()]).then(hideLoader);
      }
      function run() {
        var timerPromise = new Promise(function (resolve) {
          function step(ts) {
            if (start === null) start = ts;
            if (ts - lastFrameTime < FRAME_INTERVAL) {
              requestAnimationFrame(step);
              return;
            }
            lastFrameTime = ts;
            var elapsed = ts - start;
            var t = Math.min(1, elapsed / DURATION);
            var progress = Math.floor(t * 100);
            pctEl.textContent = "loading\u2026\u00A0\u00A0" + progress + "%";
            var fillFrac = t;
            var amplitude = 0.11 * (1 - t * 0.5);
            var phase = elapsed * 0.0038;
            wavePath.setAttribute("d", buildPath(fillFrac, phase, amplitude));
            if (t < 1) {
              requestAnimationFrame(step);
            } else {
              resolve();
            }
          }
          requestAnimationFrame(step);
        });
        Promise.all([timerPromise, waitForAssets()]).then(hideLoader);
      }
      function start_() {
        measure();
        wavePath.setAttribute("d", buildPath(0, 0, 0));
        if (reduceMotion) runReduced(); else run();
      }
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(start_).catch(start_);
      } else {
        setTimeout(start_, 50);
      }
      var rows = document.querySelectorAll(".row");
      var lastPointerX = null;
      var lastPointerY = null;
      var activeRow = null;
      function updateProjectHover(x, y) {
        if (x == null || y == null) return;
        var el = document.elementFromPoint(x, y);
        var row = el ? el.closest(".row") : null;
        if (row !== activeRow) {
          rows.forEach(function (r) { r.classList.remove("active"); });
          if (row) row.classList.add("active");
          activeRow = row;
        }
      }
      document.addEventListener("pointermove", function (e) {
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        updateProjectHover(lastPointerX, lastPointerY);
      }, { passive: true });
      var hoverCheckQueued = false;
      function checkProjectHoverAfterScroll() {
        if (hoverCheckQueued) return;
        hoverCheckQueued = true;
        requestAnimationFrame(function () {
          hoverCheckQueued = false;
          updateProjectHover(lastPointerX, lastPointerY);
        });
      }
      window.addEventListener("scroll", checkProjectHoverAfterScroll, { passive: true });
      window.addEventListener("resize", checkProjectHoverAfterScroll, { passive: true });
      rows.forEach(function (row) {
        row.addEventListener("click", function (e) {
          if (e.target.closest("a")) return;
          var wasActive = row.classList.contains("active");
          rows.forEach(function (r) { r.classList.remove("active"); });
          if (!wasActive) {
            row.classList.add("active");
            activeRow = row;
          } else {
            activeRow = null;
          }
        });
      });
    })();
