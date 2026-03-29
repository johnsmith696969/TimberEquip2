/**
 * WatermarkOverlay – renders a single upright watermark in one corner of a listing image.
 * Pass `index` to cycle which corner is used across a set of images.
 *
 * ~10 % opacity, ~9 % of container width, no rotation.
 */
const WATERMARK_SRC = '/watermark.png';

const corners = [
  { top: '4%', left: '4%' },          // top-left
  { top: '4%', right: '4%' },         // top-right
  { bottom: '4%', right: '4%' },      // bottom-right
  { bottom: '4%', left: '4%' },       // bottom-left
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
        opacity: 0.10,
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
