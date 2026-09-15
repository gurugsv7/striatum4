import { isDesktopViewport } from '../desktop/index.ts';

/**
 * The bubble transition.
 *
 * Bubbles rise over the screen you are leaving, and when they clear you are on
 * the next one. Sign-in hands over to the homepage this way, and submitting a
 * payment hands over to the confirmation.
 *
 * HOW IT IS TRANSPARENT WITHOUT AN ALPHA CHANNEL. A <video> element cannot show
 * per-pixel alpha — the mascot pipeline this came from established that, and it
 * rules out keying the green to transparency and playing the result. The sprite
 * sheet it recommends instead is right for a small character but not for this:
 * 46 full-screen frames would be a 16,000px-wide image, past what browsers will
 * reliably decode, for far more than the 300KB this weighs.
 *
 * So the bubbles are composited onto pure black at build time and the layer is
 * blended with `screen`. Screen leaves the backdrop untouched wherever the clip
 * is black and brightens it wherever the bubbles are, so the black disappears
 * and the bubbles float over the live page. That is also why the clip must be
 * keyed onto #000 exactly and not the near-black abyss colour — anything above
 * zero would wash the page with a grey veil.
 *
 * Phones only, deliberately. The desktop layer is a different surface with its
 * own route choreography, and a full-bleed overlay there would fight it.
 */

const CLIP_SRC = '/bubble-transition.mp4';
/** Lets the last few bubbles leave the frame rather than cutting them off. */
const FADE_MS = 320;
/**
 * How far into the clip the screen behind the bubbles is swapped.
 *
 * The bubbles are densest around the middle and thin out towards the end, so
 * the swap happens once they are thick enough to hide it and early enough that
 * the new screen has finished fading in by the time they clear. Swapping at the
 * very end would show the change instead of covering it.
 */
const SWAP_AT = 0.58;
/** Matches the reveal animation in motion.css. */
const REVEAL_MS = 900;
/**
 * Absolute ceiling on how long the overlay may stay up.
 *
 * Every other path that ends it depends on the clip behaving. This one does
 * not, so a stalled decode or a device that refuses to autoplay can never
 * strand the delegate mid-transition.
 */
const SAFETY_MS = 4000;

let active: HTMLElement | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The clip, fetched and buffered once during the startup loader and then reused
 * for every transition.
 *
 * Reusing the element rather than making a fresh one each time is the point: a
 * new element would re-request the file and could stall on a slow connection at
 * the exact moment the bubbles are supposed to be playing. This way the only
 * fetch happens behind the splash, where waiting is free.
 */
let clip: HTMLVideoElement | null = null;
let ready: Promise<void> | null = null;

/** How long startup will wait for the clip before going on without it. */
const PREPARE_TIMEOUT_MS = 6000;

/**
 * Fetches and buffers the clip. Safe to call more than once; the work happens
 * on the first call and later callers get the same promise.
 *
 * Always resolves, never rejects: a clip that cannot be fetched means a
 * transition that falls back to a plain navigation, which is not a reason to
 * hold the splash screen or fail startup.
 */
export function prepareBubbleTransition(): Promise<void> {
  if (ready) return ready;
  if (isDesktopViewport() || prefersReducedMotion()) {
    ready = Promise.resolve();
    return ready;
  }

  const video = document.createElement('video');
  video.src = CLIP_SRC;
  video.preload = 'auto';
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  clip = video;

  ready = new Promise<void>(resolve => {
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    // canplaythrough means the whole clip can play without pausing to buffer,
    // which is the guarantee worth waiting for. loadeddata is the fallback for
    // browsers that are stingy about firing it.
    video.addEventListener('canplaythrough', settle, { once: true });
    video.addEventListener('loadeddata', () => window.setTimeout(settle, 400), { once: true });
    video.addEventListener('error', settle, { once: true });
    window.setTimeout(settle, PREPARE_TIMEOUT_MS);
    video.load();
  });

  return ready;
}

/**
 * Fades the incoming screen up behind the bubbles.
 *
 * Without this the swap is a hard cut: the new screen is simply there, and at
 * the moment the bubbles are thinning that reads as a flicker rather than an
 * arrival.
 */
function revealApp(): void {
  const app = document.getElementById('app');
  if (!app) return;
  app.classList.remove('s4-bubble-reveal');
  // Force the removal to take effect so re-adding restarts the animation.
  void app.offsetWidth;
  app.classList.add('s4-bubble-reveal');
  window.setTimeout(() => app.classList.remove('s4-bubble-reveal'), REVEAL_MS + 80);
}

/**
 * Plays the transition over the current screen.
 *
 * `swap` is what changes the screen underneath, and it is called partway
 * through — while the bubbles are thick — so the new screen fades up behind
 * them and is settled by the time they clear. The promise resolves once the
 * bubbles are gone.
 *
 * Where the transition does not apply the swap still happens, immediately, so
 * every call site reads the same.
 */
export function playBubbleTransition(swap?: () => void): Promise<void> {
  if (isDesktopViewport() || prefersReducedMotion()) {
    swap?.();
    return Promise.resolve();
  }
  // A second trigger while one is running would stack two layers of bubbles.
  if (active) {
    swap?.();
    return Promise.resolve();
  }

  const overlay = document.createElement('div');
  overlay.className = 's4-bubbles';
  overlay.setAttribute('aria-hidden', 'true');

  // Reuse the buffered clip where startup managed to get one; only fall back to
  // a cold element if preparation never ran or failed.
  const video = clip ?? document.createElement('video');
  if (!clip) video.src = CLIP_SRC;
  video.muted = true;
  // Both are needed for an autoplaying clip on iOS; without playsinline it
  // takes over the screen in the native player.
  video.defaultMuted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.preload = 'auto';
  // A reused element is wherever the last transition left it.
  try {
    video.currentTime = 0;
  } catch {
    /* not seekable yet; it will start from the beginning anyway */
  }
  overlay.appendChild(video);

  document.body.appendChild(overlay);
  active = overlay;

  // Every listener below is bound to this run only. Without that they would
  // pile up on the reused element and a later transition would be ended by a
  // previous run's handler.
  const run = new AbortController();

  return new Promise<void>(resolve => {
    let swapped = false;
    const doSwap = () => {
      if (swapped) return;
      swapped = true;
      swap?.();
      revealApp();
    };

    let done = false;
    const finish = () => {
      // However the clip ends, the screen behind it must have changed.
      doSwap();
      if (done) return;
      done = true;
      run.abort();
      video.pause();
      overlay.classList.add('is-leaving');
      window.setTimeout(() => {
        overlay.remove();
        if (active === overlay) active = null;
      }, FADE_MS);
      resolve();
    };

    video.addEventListener('ended', finish, { once: true, signal: run.signal });
    // A blocked autoplay or a decode error must not hold the screen.
    video.addEventListener('error', finish, { once: true, signal: run.signal });
    // Only once playback is really under way is the clip's length meaningful.
    // Timing from the call instead would cut the bubbles short whenever the
    // file had to be fetched first.
    video.addEventListener(
      'playing',
      () => {
        const length = video.duration || 2.43;
        const remaining = Math.max(0, length - video.currentTime);
        window.setTimeout(doSwap, Math.max(0, length * SWAP_AT - video.currentTime) * 1000);
        window.setTimeout(finish, remaining * 1000);
      },
      { once: true, signal: run.signal }
    );
    window.setTimeout(finish, SAFETY_MS);

    const started = video.play();
    if (started) started.catch(finish);
  });
}

// Start the fetch as soon as the app boots; the startup loader awaits it.
void prepareBubbleTransition();
