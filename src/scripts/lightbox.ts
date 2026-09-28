interface GalleryItem {
  button: HTMLButtonElement;
  src: string;
  alt: string;
  caption: string;
}

const gallery = document.querySelector<HTMLElement>('[data-gallery]');
const lightbox = document.querySelector<HTMLElement>('#lightbox');

if (gallery && lightbox) {
  const image = lightbox.querySelector<HTMLImageElement>('#lightbox-img');
  const counter = lightbox.querySelector<HTMLElement>('#lightbox-counter');
  const caption = lightbox.querySelector<HTMLElement>('#lightbox-caption');
  const stage = lightbox.querySelector<HTMLElement>('#lightbox-stage');
  const closeButton = lightbox.querySelector<HTMLButtonElement>('#lightbox-close');
  const previousButton = lightbox.querySelector<HTMLButtonElement>('#lightbox-prev');
  const nextButton = lightbox.querySelector<HTMLButtonElement>('#lightbox-next');

  const items: GalleryItem[] = [...gallery.querySelectorAll<HTMLButtonElement>('[data-lightbox-item]')]
    .map((button) => ({
      button,
      src: button.dataset.fullSrc ?? '',
      alt: button.dataset.alt ?? '',
      caption: button.dataset.caption ?? '',
    }))
    .filter((item) => item.src.length > 0);

  if (image && counter && caption && stage && closeButton && previousButton && nextButton && items.length > 0) {
    let currentIndex = 0;
    let isOpen = false;
    let lastFocus: HTMLElement | null = null;
    let touchStart: { x: number; y: number } | null = null;

    const show = (nextIndex: number): void => {
      currentIndex = (nextIndex + items.length) % items.length;
      const item = items[currentIndex];
      image.classList.remove('is-loaded');
      image.src = item.src;
      image.alt = item.alt;
      counter.textContent = `${currentIndex + 1} / ${items.length}`;
      caption.textContent = item.caption;

      for (const adjacentIndex of [currentIndex + 1, currentIndex - 1]) {
        const adjacent = items[(adjacentIndex + items.length) % items.length];
        const preload = new Image();
        preload.src = adjacent.src;
      }
    };

    const setOpen = (next: boolean, index = 0): void => {
      isOpen = next;
      if (isOpen) {
        lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        lightbox.hidden = false;
        show(index);
        window.requestAnimationFrame(() => lightbox.classList.add('is-open'));
        document.body.classList.add('is-locked');
        closeButton.focus();
        return;
      }

      lightbox.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      window.setTimeout(() => {
        if (!isOpen) {
          lightbox.hidden = true;
          image.removeAttribute('src');
        }
      }, 420);
      lastFocus?.focus();
    };

    image.addEventListener('load', () => image.classList.add('is-loaded'));
    closeButton.addEventListener('click', () => setOpen(false));
    previousButton.addEventListener('click', () => show(currentIndex - 1));
    nextButton.addEventListener('click', () => show(currentIndex + 1));
    stage.addEventListener('click', (event) => {
      if (event.target === stage) setOpen(false);
    });
    gallery.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>('[data-lightbox-item]');
      if (!button) return;
      const index = items.findIndex((item) => item.button === button);
      if (index >= 0) setOpen(true, index);
    });
    document.addEventListener('keydown', (event) => {
      if (!isOpen) return;
      if (event.key === 'Escape') setOpen(false);
      else if (event.key === 'ArrowLeft') show(currentIndex - 1);
      else if (event.key === 'ArrowRight') show(currentIndex + 1);
      else if (event.key === 'Tab') {
        const controls = [...lightbox.querySelectorAll<HTMLButtonElement>('button')];
        const first = controls.at(0);
        const last = controls.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    stage.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      if (touch) touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    stage.addEventListener('touchend', (event) => {
      const touch = event.changedTouches[0];
      if (!touch || !touchStart) return;
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
        show(currentIndex + (deltaX < 0 ? 1 : -1));
      }
      touchStart = null;
    }, { passive: true });
  }
}
