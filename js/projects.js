(() => {
      const section = document.getElementById('projects');
      const space = section?.querySelector('.projects-scroll-space');
      const wheel = section?.querySelector('.projects-wheel');
      const numbers = [...(section?.querySelectorAll('.wheel-number') || [])];
      const copy = document.getElementById('projectsCopy');
      const thumb = document.getElementById('projectsThumb');
      const thumbImage = document.getElementById('projectsThumbImage');
      const count = document.getElementById('projectsCount');
      const title = document.getElementById('projectsTitle');
      const subtitle = document.getElementById('projectsSubtitle');
      const description = document.getElementById('projectsDescription');
      const link = document.getElementById('projectsLink');
      const progress = document.getElementById('projectsProgress');
      if (!section || !space || !wheel || !numbers.length || !copy) return;
      const projects = [
        {
          title: 'SLM (Small Language Model)',
          subtitle: 'Language Model · PyTorch · From Scratch',
          description: "A 30M-parameter decoder-only GPT built entirely from scratch \u2014 custom byte-level BPE tokenizer, FlashAttention, and a memory-mapped data pipeline to train on English Wikipedia within Colab's RAM limits. Fine-tuned for Q&A on Dolly-15k and Alpaca, including debugging a subtle target-alignment bug in the training loop. Currently being scaled up to a 124M-parameter version.",
          image: 'assets/images/SLM.png',
          link: 'https://github.com/Akki-Maharaj/SLM'
        },
        {
          title: 'Treasury',
          subtitle: 'AI Thrift Marketplace · FastAPI · Supabase',
          description: 'OLX-style thrift marketplace with AI sell-assist (category detection, attribute extraction, adaptive questions) and a MiniLM-powered personalized recommender. FastAPI, Supabase, scikit-learn.',
          image: 'assets/images/Treasury.png',
          link: 'https://treasury-1.onrender.com/'
        },
        {
          title: 'Metal Defect Detection',
          subtitle: 'Classical Computer Vision + ML',
          description: 'CPU-based computer vision system to classify and localize metal surface defects using handcrafted image features and SVM, achieving 94.1% test accuracy.',
          image: 'assets/images/metal.png',
          link: 'https://github.com/Akki-Maharaj/Metal-Defect-Detection'
        },
        {
          title: 'Genshin RAG Assistant',
          subtitle: 'Local RAG + LLM + Damage Calculator',
          description: 'Fully local Genshin assistant combining RAG for game knowledge with a formula-based damage calculator for accurate numeric answers, with no LLM-hallucinated numbers.',
          image: 'assets/images/genshin.png',
          link: 'https://github.com/Akki-Maharaj/Genshin-RAG-Assistant'
        },
        {
          title: 'Fake Job Detection',
          subtitle: 'NLP + Fine-Tuned DistilBERT',
          description: 'Fine-tuned DistilBERT classifier to detect fraudulent job postings on an imbalanced dataset of 17,880 postings, achieving 99% accuracy and 0.989 AUC-ROC.',
          image: 'assets/images/job.png',
          link: 'https://github.com/Akki-Maharaj/Fake-Job-Detection'
        },
        {
          title: 'Hospital Dashboard',
          subtitle: 'Power BI · DAX · Power Query',
          description: 'Interactive 6-page hospital analytics dashboard covering patients, doctors, operations, inventory and finance — surfacing peak-hour staffing, stock and billing trends.',
          image: 'assets/images/Hospital.png',
          link: 'https://github.com/Akki-Maharaj/Hospital-Dashboard'
        },
        {
          title: 'Tableau HR Dashboard',
          subtitle: 'Tableau · Python · Pandas',
          description: 'Interactive HR analytics dashboard for workforce demographics, hiring and termination trends, salary and performance comparisons, with drill-down filtering.',
          image: 'assets/images/HR.png',
          link: 'https://github.com/Akki-Maharaj/Tableau-HR-Dashboard'
        }
      ];
      function preloadProjectThumbs() {
        projects.forEach(p => {
          if (p.image) {
            const img = new Image();
            img.src = p.image;
          }
        });
      }
      window.addEventListener('assets:load-thumbnails', preloadProjectThumbs, { once: true });
      window.addEventListener('load', () => {
        setTimeout(() => window.dispatchEvent(new Event('assets:load-thumbnails')), 8000);
      });
      let active = 0;
      let rendered = -1;
      let switchingTimer = null;
      let ticking = false;
      let orbitAngle = 0;
      let orbitFrom = 0;
      let orbitTo = 0;
      let orbitStart = 0;
      let orbitFrame = null;
      const orbitDuration = 520;
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const ease = t => t * t * (3 - 2 * t);
      function shortestAngleDelta(from, to) {
        let d = to - from;
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        return d;
      }
      const angleStep = 360 / projects.length;
      function paintOrbit() {
        const radius = Math.min(315, wheel.clientWidth * 0.4375);
        numbers.forEach((n, i) => {
          const rad = (i * angleStep + orbitAngle) * Math.PI / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          n.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        });
      }
      function animateOrbit(targetAngle) {
        orbitFrom = orbitAngle;
        orbitTo = orbitAngle + shortestAngleDelta(orbitAngle, targetAngle);
        orbitStart = performance.now();
        cancelAnimationFrame(orbitFrame);
        const step = now => {
          const t = clamp((now - orbitStart) / orbitDuration, 0, 1);
          orbitAngle = orbitFrom + (orbitTo - orbitFrom) * ease(t);
          paintOrbit();
          if (t < 1) {
            orbitFrame = requestAnimationFrame(step);
          } else {
            orbitAngle = targetAngle;
            paintOrbit();
          }
        };
        orbitFrame = requestAnimationFrame(step);
      }
      function setProject(index, animate = true) {
        index = clamp(index, 0, projects.length - 1);
        if (index === rendered && animate) return;
        active = index;
        numbers.forEach((n, i) => n.classList.toggle('active', i === active));
        if (animate && rendered !== -1) {
          copy.classList.add('switching');
          if (thumb) thumb.classList.add('switching');
          clearTimeout(switchingTimer);
          switchingTimer = setTimeout(() => {
            fillCopy(index);
            copy.classList.remove('switching');
            if (thumb) requestAnimationFrame(() => thumb.classList.remove('switching'));
          }, 190);
        } else {
          fillCopy(index);
          copy.classList.remove('switching');
          if (thumb) thumb.classList.remove('switching');
        }
        rendered = index;
      }
      function fillCopy(index) {
        const p = projects[index];
        const totalFormatted = String(projects.length).padStart(2, '0');
        const currentFormatted = String(index + 1).padStart(2, '0');
        count.textContent = `${currentFormatted} / ${totalFormatted}`;
        title.textContent = p.title;
        subtitle.textContent = p.subtitle;
        description.textContent = p.description;
        if (thumbImage) {
          thumbImage.alt = `${p.title} preview`;
          thumbImage.src = p.image;
        }
        progress.textContent = `${currentFormatted} — ${totalFormatted}`;
        if (p.link) {
          link.href = p.link;
          link.textContent = 'View Project ↗';
          link.style.display = 'inline-flex';
        } else {
          link.removeAttribute('href');
          link.textContent = 'Case Study Soon';
          link.style.display = 'inline-flex';
        }
      }
      function render() {
        ticking = false;
        const rect = space.getBoundingClientRect();
        const maxScroll = Math.max(1, space.offsetHeight - window.innerHeight);
        const p = clamp(-rect.top / maxScroll, 0, 1);
        const continuous = p * (projects.length - 1);
        const index = Math.round(continuous);
        const displayPosition = index;
        wheel.style.transform = 'translateY(-50%)';
        const targetAngle = -index * angleStep;
        if (index !== active) {
          setProject(index, true);
          animateOrbit(targetAngle);
        } else if (!orbitFrame && Math.abs(orbitAngle - targetAngle) > 0.01) {
          orbitAngle = targetAngle;
          paintOrbit();
        }
        numbers.forEach((n, i) => {
          const distance = Math.abs(i - index);
          const wrapped = Math.min(distance, projects.length - distance);
          const blur = Math.min(5, wrapped * 1.7);
          const opacity = clamp(1 - wrapped * .25, .22, 1);
          n.style.filter = i === index ? 'blur(0)' : `blur(${blur}px)`;
          n.style.opacity = opacity.toFixed(2);
        });
      }
      function onScroll() {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            const rect = space.getBoundingClientRect();
            const maxScroll = Math.max(1, space.offsetHeight - window.innerHeight);
            const p = clamp(-rect.top / maxScroll, 0, 1);
            render();
          });
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      numbers.forEach((n, i) => {
        n.addEventListener('click', () => {
          const maxScroll = space.offsetHeight - window.innerHeight;
          const target = (i / (projects.length - 1)) * maxScroll;
          window.scrollTo({ top: section.offsetTop + target, behavior: 'smooth' });
        });
      });
      orbitAngle = 0;
      paintOrbit();
      setProject(0, false);
      render();
    })();
