document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initializeLoader(): void {
  const loader = document.querySelector<HTMLElement>('#loader');
  if (!loader) return;

  let seen = false;
  try {
    seen = sessionStorage.getItem('sa-loaded') === '1';
  } catch {
    // Storage may be disabled. The loader can still complete normally.
  }

  const finishImmediately = (): void => {
    loader.classList.add('is-done');
    loader.hidden = true;
    document.documentElement.classList.add('is-ready');
  };

  if (seen || reducedMotion) {
    finishImmediately();
    return;
  }

  const bar = document.querySelector<HTMLElement>('#loader-bar');
  const startedAt = Date.now();
  let progress = 0;
  let finished = false;

  const updateProgress = (value: number): void => {
    progress = Math.min(100, value);
    bar?.style.setProperty('--progress', `${progress}%`);
  };

  const tick = window.setInterval(() => {
    updateProgress(progress + (90 - progress) * 0.12 + 1);
    if (progress >= 89) window.clearInterval(tick);
  }, 90);

  const finish = (): void => {
    if (finished) return;
    finished = true;
    window.clearInterval(tick);

    window.setTimeout(() => {
      updateProgress(100);
      window.setTimeout(() => {
        loader.classList.add('is-done');
        document.documentElement.classList.add('is-ready');
        try {
          sessionStorage.setItem('sa-loaded', '1');
        } catch {
          // The visual behavior does not depend on storage being available.
        }
        window.setTimeout(() => {
          loader.hidden = true;
        }, 750);
      }, 260);
    }, Math.max(0, 550 - (Date.now() - startedAt)));
  };

  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish, { once: true });
  window.setTimeout(finish, 2200);
}

function initializeHeader(): void {
  const header = document.querySelector<HTMLElement>('#sa-header');
  if (!header) return;

  const hero = document.querySelector<HTMLElement>('.hero');
  let lastScrollY = window.scrollY;
  let ticking = false;

  const update = (): void => {
    const scrollY = window.scrollY;
    header.classList.toggle('is-stuck', scrollY > 8);

    const rawHeaderHeight = getComputedStyle(document.documentElement).getPropertyValue('--header-h');
    const headerHeight = Number.parseFloat(rawHeaderHeight) || 62;
    const overHero = Boolean(hero) && window.innerWidth <= 860 && scrollY < (hero?.offsetHeight ?? 0) - headerHeight;
    header.classList.toggle('is-over', overHero);
    if (overHero) header.classList.remove('is-stuck');

    if (scrollY > 340) {
      if (scrollY > lastScrollY + 6) header.classList.add('is-hidden');
      else if (scrollY < lastScrollY - 6) header.classList.remove('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }

    lastScrollY = scrollY;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

function initializeMobileMenu(): void {
  const button = document.querySelector<HTMLButtonElement>('#nav-toggle');
  const menu = document.querySelector<HTMLElement>('#mobile-menu');
  if (!button || !menu) return;

  let isOpen = false;
  let lastFocus: HTMLElement | null = null;

  const setOpen = (next: boolean): void => {
    isOpen = next;
    button.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('is-locked', isOpen);
    document.body.classList.toggle('is-menu-open', isOpen);

    if (isOpen) {
      lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      menu.hidden = false;
      window.requestAnimationFrame(() => menu.classList.add('is-open'));
      const firstLink = menu.querySelector<HTMLAnchorElement>('a');
      if (firstLink) window.setTimeout(() => firstLink.focus(), 300);
      return;
    }

    menu.classList.remove('is-open');
    window.setTimeout(() => {
      if (!isOpen) menu.hidden = true;
    }, 480);
    lastFocus?.focus();
  };

  button.addEventListener('click', () => setOpen(!isOpen));
  menu.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) setOpen(false);
    if (event.key !== 'Tab' || !isOpen) return;

    const focusable = [...menu.querySelectorAll<HTMLElement>('a, button')];
    const first = focusable.at(0);
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (isOpen && window.innerWidth > 980) setOpen(false);
  });
}

function initializeReveals(): void {
  const elements = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)')];
  if (elements.length === 0) return;

  if (reducedMotion || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '220px 0px -5% 0px', threshold: 0.01 });

  elements.forEach((element) => observer.observe(element));
}

function initializeAnchorLinks(): void {
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!anchor) return;

    const id = anchor.hash.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  });
}

document.addEventListener('error', (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.dataset.saFailed) return;
  image.dataset.saFailed = '1';
  image.hidden = true;
}, true);

initializeLoader();
initializeHeader();
initializeMobileMenu();
initializeReveals();
initializeAnchorLinks();
