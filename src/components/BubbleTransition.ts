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
 * Fetch the clip once, early, so the first transition is not a pause while
 * 300KB arrives. Runs on import, which happens at app start.
 */
let warmed: HTMLVideoElement | null = null;
function warm(): void {
  if (warmed || isDesktopViewport() || prefersReducedMotion()) return;
  warmed = document.createElement('video');
  warmed.src = CLIP_SRC;
  warmed.preload = 'auto';
  warmed.muted = true;
  warmed.load();
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

  const video = document.createElement('video');
  video.src = CLIP_SRC;
  video.muted = true;
  // Both are needed for an autoplaying clip on iOS; without playsinline it
  // takes over the screen in the native player.
  video.defaultMuted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.preload = 'auto';
  overlay.appendChild(video);

  document.body.appendChild(overlay);
  active = overlay;

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
      overlay.classList.add('is-leaving');
      window.setTimeout(() => {
        overlay.remove();
        if (active === overlay) active = null;
      }, FADE_MS);
      resolve();
    };

    video.addEventListener('ended', finish, { once: true });
    // A blocked autoplay or a decode error must not hold the screen.
    video.addEventListener('error', finish, { once: true });
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
      { once: true }
    );
    window.setTimeout(finish, SAFETY_MS);

    const started = video.play();
    if (started) started.catch(finish);
  });
}

warm();
