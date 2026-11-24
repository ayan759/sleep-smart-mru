/**
 * Shared night-sky geometry. The sky layer is wider AND taller than the scene so it can drift
 * left and lag behind the page as it scrolls without ever revealing an empty edge.
 */
export const SKY_WIDTH = 1.6; // sky layer width as a multiple of the scene width
export const SKY_HEIGHT = 1.4; // sky layer height; the extra 0.4 sits above the scene
/** Max sideways drift, as a fraction of the sky layer's own width (0.3 × 1.6 = 48% of the scene). */
export const SKY_DRIFT = 0.3;
/** Max downward lag, as a fraction of the layer's own height (so the sky scrolls at ~60% speed). */
export const SKY_LAG = (SKY_HEIGHT - 1) / SKY_HEIGHT;
/** Where the moon sits on screen before scrolling (fractions of the scene). */
const MOON_ON_SCREEN = { x: 0.74, y: 0.24 };
/** The moon's centre as fractions of the (larger) sky layer. */
export const MOON_CENTER = {
  x: MOON_ON_SCREEN.x / SKY_WIDTH,
  y: (MOON_ON_SCREEN.y + (SKY_HEIGHT - 1)) / SKY_HEIGHT,
};
