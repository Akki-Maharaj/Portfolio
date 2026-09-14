(() => {
      const section = document.getElementById('linengrass');
      const stage = section ? section.querySelector('.sticky-stage') : null;
      const shell = document.getElementById('videoShell');
      const video = document.getElementById('linengrassVideo');
      const content = document.getElementById('content');
      const contentInner = content ? content.querySelector('.content-inner') : null;
      const ambient = section ? section.querySelector('.ambient') : null;
      const veil = section ? section.querySelector('.video-veil') : null;
      const rule = section ? section.querySelector('.rule') : null;
      const hint = document.getElementById('scrollHint');
      const progressBar = document.getElementById('progressBar');
      if (!section || !shell || !video || !content) return;
      let targetProgress = 0;
      let smoothProgress = 0;
      let duration = 0;
      let metadataReady = false;
      let seeking = false;
      let pendingTime = null;
      let lastRequestedTime = -1;
      let lastSeekAt = 0;
      let isMobile = window.matchMedia('(max-width: 760px)').matches;
      let videoAspect = 16 / 9;
      const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
      const ease = t => t * t * (3 - 2 * t);
      const easeOut = t => 1 - Math.pow(1 - t, 3);
      const map = (v, a, b) => clamp((v - a) / (b - a));
      function onMobileChange() {
        isMobile = window.matchMedia('(max-width: 760px)').matches;
      }
      if ('IntersectionObserver' in window) {
        const preloadObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (video.preload !== 'auto') video.preload = 'auto';
              video.load();
              preloadObserver.disconnect();
            }
          });
        }, { rootMargin: '100% 0px 100% 0px' });
        preloadObserver.observe(section);
      }
      function sectionProgress() {
        const rect = section.getBoundingClientRect();
        const travel = section.offsetHeight - window.innerHeight;
        if (travel <= 0) return 0;
        const leadIn = window.innerHeight * 0.5;
        return clamp((leadIn - rect.top) / (travel + leadIn));
      }
      function updateTarget() {
        targetProgress = sectionProgress();
        if (progressBar) {
          progressBar.style.transform = `scaleX(${targetProgress})`;
        }
      }
      function requestVideoSeek(progress, now) {
        if (!metadataReady || !duration) return;
        const time = clamp(progress / 0.78) * duration;
        if (Math.abs(time - lastRequestedTime) < 1 / 36) return;
        if (now - lastSeekAt < 30) {
          pendingTime = time;
          return;
        }
        pendingTime = time;
        flushSeek(now);
      }
      function flushSeek(now = performance.now()) {
        if (seeking || pendingTime == null || !metadataReady) return;
        if (now - lastSeekAt < 30) return;
        const time = pendingTime;
        pendingTime = null;
        lastRequestedTime = time;
        lastSeekAt = now;
        seeking = true;
        video.currentTime = time;
      }
      video.addEventListener('seeked', () => {
        seeking = false;
        flushSeek();
      }, { passive: true });
      video.addEventListener('loadedmetadata', () => {
        metadataReady = true;
        duration = video.duration;
        if (!Number.isFinite(duration) || duration <= 0) {
          duration = 1;
        }
        if (video.videoWidth && video.videoHeight) {
          videoAspect = video.videoWidth / video.videoHeight;
        }
        video.autoplay = true;
        video.loop = true;
        video.play().catch(() => {});
        video.classList.add('ready');
      }, { once: true });
      video.addEventListener('error', () => {
        shell.style.background = '#f7f8f7';
      });
      function render(now) {
        smoothProgress += (targetProgress - smoothProgress) * 0.105;
        if (Math.abs(targetProgress - smoothProgress) < 0.0005) smoothProgress = targetProgress;
        const p = smoothProgress;
        video.style.opacity = 1;
        if (ambient) {
          ambient.style.opacity = 0.15 * ease(map(p, 0.02, 0.25));
          ambient.style.transform = `scale(${1.04 - 0.04 * p})`;
        }
        const transformP = easeOut(map(p, 0.34, 0.62));
        if (window.innerWidth > 760) {
          video.style.transform = 'none';
          if (stage) stage.style.height = '';
          shell.style.width = `${100 - 51 * transformP}%`;
          shell.style.height = `${100 - 20 * transformP}%`;
          shell.style.left = `${2.5 * transformP}%`;
          shell.style.top = `${10 * transformP}%`;
          shell.style.borderRadius = `${28 * transformP}px`;
          shell.style.boxShadow = transformP > 0.02
            ? `0 24px 70px rgba(17,23,19,${0.10 * transformP})`
            : 'none';
        } else {
          const vw = shell.parentElement.clientWidth || window.innerWidth;
          const fitHeight = vw / videoAspect;
          const innerHeight = contentInner ? contentInner.scrollHeight : 0;
          const contentPad = 48;
          const contentHeight = innerHeight + contentPad;
          if (stage) {
            const mobileStageHeight = Math.round(fitHeight + contentHeight);
            stage.style.height = `${mobileStageHeight}px`;
            section.style.height = `${Math.max(window.innerHeight, mobileStageHeight)}px`;
          }
          shell.style.width = '100%';
          shell.style.height = `${fitHeight}px`;
          shell.style.left = '0';
          shell.style.top = '0';
          shell.style.borderRadius = '0';
          shell.style.boxShadow = 'none';
          content.style.top = `${fitHeight}px`;
          content.style.height = `${contentHeight}px`;
          const zoomT = easeOut(map(p, 0, 0.4));
          const zoomScale = 1.35 - 0.35 * zoomT;
          video.style.transform = `scale(${zoomScale})`;
        }
        const copyP = easeOut(map(p, 0.47, 0.68));
        content.style.opacity = isMobile ? 1 : copyP;
        content.style.transform = isMobile ? 'none' : `translate3d(${42 - 42 * copyP}px,0,0)`;
        if (rule) {
          rule.style.transform = `scaleX(${ease(map(p, 0.54, 0.72))})`;
        }
        if (veil) {
          veil.style.opacity = 0.16 * transformP;
        }
        if (hint) {
          hint.style.opacity = p > 0.08 ? 0 : 1;
        }
        requestAnimationFrame(render);
      }
      window.addEventListener('scroll', updateTarget, { passive: true });
      window.addEventListener('resize', () => {
        onMobileChange();
        updateTarget();
      }, { passive: true });
      updateTarget();
      requestAnimationFrame(render);
    })();
