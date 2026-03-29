/**
 * WatermarkOverlay – renders a single watermark in one corner of a listing image.
 * Pass `index` to rotate which corner is used across a set of images.
 *
 * 28 % opacity, ~9 % of container width, one corner per image.
 */
const WATERMARK_SRC = '/watermark.png';

const corners = [
  { top: '4%', left: '4%', rotate: '0deg' },          // top-left
  { top: '4%', right: '4%', rotate: '90deg' },         // top-right
  { bottom: '4%', right: '4%', rotate: '180deg' },     // bottom-right
  { bottom: '4%', left: '4%', rotate: '-90deg' },      // bottom-left
] as const;

interface WatermarkOverlayProps {
  /** Index used to pick which corner (cycles through 4 corners). Defaults to 0. */
  index?: number;
}

export default function WatermarkOverlay({ index = 0 }: WatermarkOverlayProps) {
  const pos = corners[((index % corners.length) + corners.length) % corners.length];

  return (
    <img
      src={WATERMARK_SRC}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{
        position: 'absolute',
        width: '9%',
        height: 'auto',
        opacity: 0.28,
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
  );
}
