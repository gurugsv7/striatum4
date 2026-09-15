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
 * Plays the transition over the current screen, resolving once the bubbles
 * have cleared. Callers navigate in `.then()`, so the new screen arrives as the
 * last bubbles leave rather than behind them.
 *
 * Resolves immediately where the transition does not apply, so every call site
 * reads the same.
 */
export function playBubbleTransition(): Promise<void> {
  if (isDesktopViewport() || prefersReducedMotion()) return Promise.resolve();
  // A second trigger while one is running would stack two layers of bubbles.
  if (active) return Promise.resolve();

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
    let done = false;
    const finish = () => {
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
        const remaining = Math.max(0, (video.duration || 1.6) - video.currentTime);
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
