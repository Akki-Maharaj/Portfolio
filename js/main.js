(function () {
      var heroVideo = document.getElementById('vid-base');
      function startLinengrass() {
        var lineVideo = document.getElementById('linengrassVideo');
        if (lineVideo && lineVideo.preload !== 'auto') {
          lineVideo.preload = 'auto';
          lineVideo.load();
        }
      }
      function startThumbnails() {
        window.dispatchEvent(new Event('assets:load-thumbnails'));
      }
      function waitForVideo(vid, next, maxWait) {
        if (!vid) { next(); return; }
        if (vid.readyState >= 2) { next(); return; } 
        var done = false;
        function finish() {
          if (done) return;
          done = true;
          vid.removeEventListener('loadeddata', finish);
          vid.removeEventListener('canplay', finish);
          vid.removeEventListener('error', finish);
          next();
        }
        vid.addEventListener('loadeddata', finish, { once: true });
        vid.addEventListener('canplay', finish, { once: true });
        vid.addEventListener('error', finish, { once: true });
        setTimeout(finish, maxWait);
      }
      waitForVideo(heroVideo, function () {
        startLinengrass();
        startThumbnails();
      }, 4000);
    })();
    (() => {
      const section = document.querySelector('.dark-white-transition');
      const words = section ? [...section.querySelectorAll('.transition-word')] : [];
      if (!section || !words.length) return;
      let target = 0;
      let current = 0;
      let raf = null;
      const clamp01 = v => Math.max(0, Math.min(1, v));
      const ease = v => v * v * (3 - 2 * v);
      const lerp = (a, b, t) => a + (b - a) * t;
      function render() {
        current += (target - current) * 0.05;
        words.forEach((word, i) => {
          const start = parseFloat(word.dataset.start || '0');
          const end = parseFloat(word.dataset.end || '1');
          const local = clamp01((current - start) / (end - start));
          const e = ease(local);
          const x = lerp(85, -95, e);
          const fadeIn = clamp01(local / 0.18);
          const fadeOut = clamp01((1 - local) / 0.18);
          const opacity = ease(Math.min(fadeIn, fadeOut));
          word.style.transform = `translate3d(${x}vw, -50%, 0)`;
          word.style.opacity = opacity.toFixed(3);
          word.style.color = '#f4f7f6';
        });
        raf = requestAnimationFrame(render);
      }
      function updateProgress() {
        const rect = section.getBoundingClientRect();
        const travel = rect.height + window.innerHeight;
        target = clamp01((window.innerHeight - rect.top) / travel);
      }
      window.addEventListener('scroll', updateProgress, { passive: true });
      window.addEventListener('resize', updateProgress);
      updateProgress();
      render();
    })();
