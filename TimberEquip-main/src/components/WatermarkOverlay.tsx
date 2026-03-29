/**
 * WatermarkOverlay – renders four corner watermarks on top of listing images.
 * Usage: place inside a `position: relative; overflow: hidden` container,
 *        after the <img> tag.
 *
 * Each corner gets the brand watermark at 10 % opacity and 13 % of the
 * container size, rotated so the logo fans outward from the centre.
 */
const WATERMARK_SRC = '/watermark.png';

const corners = [
  { top: '4%', left: '4%', rotate: '0deg' },          // top-left
  { top: '4%', right: '4%', rotate: '90deg' },         // top-right
  { bottom: '4%', left: '4%', rotate: '-90deg' },      // bottom-left
  { bottom: '4%', right: '4%', rotate: '180deg' },     // bottom-right
] as const;

export default function WatermarkOverlay() {
  return (
    <>
      {corners.map((pos, i) => (
        <img
          key={i}
          src={WATERMARK_SRC}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: 'absolute',
            width: '13%',
            height: 'auto',
            opacity: 0.10,
            transform: `rotate(${pos.rotate})`,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 5,
            ...(('top' in pos)    ? { top: pos.top }       : {}),
            ...(('bottom' in pos) ? { bottom: pos.bottom } : {}),
            ...(('left' in pos)   ? { left: pos.left }     : {}),
            ...(('right' in pos)  ? { right: pos.right }   : {}),
          }}
        />
      ))}
    </>
  );
}
