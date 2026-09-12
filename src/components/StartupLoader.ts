import lottie, { AnimationItem } from 'lottie-web';
import '../styles/startup-loader.css';

/** Mounts the supplied Lottie animation while the first app assets are decoded. */
export function mountStartupLoader(): () => Promise<void> {
  if (document.getElementById('striatum-startup')) return async () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div');
  layer.id = 'striatum-startup';
  layer.setAttribute('role', 'status');
  layer.setAttribute('aria-live', 'polite');
  layer.innerHTML = `<div class="s4-loader-animation" aria-hidden="true"></div>`;
  document.body.appendChild(layer);
  const app = document.getElementById('app');
  const wasInert = app?.inert ?? false;
  if (app) app.inert = true;
  const animation: AnimationItem = lottie.loadAnimation({
    container: layer.querySelector('.s4-loader-animation') as HTMLElement,
    renderer: 'svg', loop: true, autoplay: !reduced.matches, path: '/loading.json',
    rendererSettings: { progressiveLoad: true, preserveAspectRatio: 'xMidYMid meet' },
  });
  const applyStriatumPalette = () => {
    const palette = ['#2af1fa', '#0e5b72', '#30d7f2', '#78e5f8', '#041224'];
    layer.querySelectorAll<SVGElement>('.s4-loader-animation svg path, .s4-loader-animation svg ellipse, .s4-loader-animation svg circle').forEach((shape, index) => {
      shape.style.setProperty('fill', palette[index % palette.length], 'important');
      shape.style.setProperty('stroke', palette[index % palette.length], 'important');
    });
  };
  animation.addEventListener('DOMLoaded', applyStriatumPalette);
  setTimeout(applyStriatumPalette, 80);
  if (reduced.matches) animation.goToAndStop(animation.totalFrames - 1, true);

  let closed = false;
  let safety: ReturnType<typeof setTimeout>;
  const remove = () => {
    if (closed) return;
    closed = true;
    clearTimeout(safety);
    animation.destroy();
    layer.classList.add('is-ready');
    setTimeout(() => { layer.remove(); if (app) app.inert = wasInert; }, reduced.matches ? 0 : 420);
  };
  safety = setTimeout(remove, 20000);

  return async () => {
    const urls = new Set(['/onboarding_bg.webp', '/homepage2.webp', '/explore_events1.webp', '/explore_events2.webp']);
    app?.querySelectorAll('img').forEach(image => urls.add(image.currentSrc || image.src));
    app?.querySelectorAll('*').forEach(element => {
      for (const pseudo of [null, '::before', '::after']) {
        const background = getComputedStyle(element, pseudo).backgroundImage;
        for (const match of background.matchAll(/url\(["']?(.*?)["']?\)/g)) urls.add(match[1]);
      }
    });
    await Promise.all([...urls].map(url => new Promise<void>(resolve => {
      const image = new Image();
      const timeout = setTimeout(resolve, 12000);
      const settle = () => { clearTimeout(timeout); resolve(); };
      image.onload = () => { void image.decode().catch(() => {}).then(settle); };
      image.onerror = settle;
      image.src = url;
    })));
    await new Promise(resolve => setTimeout(resolve, 120));
    if (closed) return;
    layer.classList.add('is-loading-complete');
    setTimeout(remove, reduced.matches ? 0 : 420);
  };
}
