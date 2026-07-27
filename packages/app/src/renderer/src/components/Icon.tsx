/**
 * Icon — a single home for every inline SVG used across the renderer.
 *
 * Keeping them here avoids copy-pasted `<svg>` blocks scattered through
 * components and makes stroke colour uniform (currentColor). Each icon is a
 * named export rendered as a function component that spreads extra props
 * (className, size overrides) onto the root <svg>.
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

/** A base so each icon only spells out its paths. */
function svg(size: number | undefined, viewBox: string, children: React.ReactNode, props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={props.width ?? size ?? 16}
      height={props.height ?? size ?? 16}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  )
}

/* ---- chevrons (collapse / expand) ---- */
export function ChevronRight({ size = 13, ...p }: IconProps) {
  return svg(size, '0 0 13 13', <path d="M5 3L9 6.5L5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />, p)
}
export function ChevronLeft({ size = 13, ...p }: IconProps) {
  return svg(size, '0 0 13 13', <path d="M8 3L4 6.5L8 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />, p)
}

/* ---- window controls (Win/Linux) ---- */
export function WinMinimize({ size = 11, ...p }: IconProps) {
  return svg(size, '0 0 11 11', <rect x="1" y="5" width="9" height="1" rx="0.5" fill="currentColor" />, p)
}
export function WinMaximize({ size = 11, ...p }: IconProps) {
  return svg(size, '0 0 11 11', <rect x="1.5" y="1.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" />, p)
}
export function WinClose({ size = 11, ...p }: IconProps) {
  return svg(size, '0 0 11 11', <path d="M2 2L9 9M9 2L2 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />, p)
}

/* ---- theme toggle ---- */
export function Sun({ size = 15, ...p }: IconProps) {
  return svg(
    size,
    '0 0 15 15',
    <>
      <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7.5 1.5v1.5M7.5 12v1.5M1.5 7.5H3M12 7.5h1.5M3.4 3.4l1 1M10.6 10.6l1 1M3.4 11.6l1-1M10.6 4.4l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </>,
    p
  )
}
export function Moon({ size = 15, ...p }: IconProps) {
  return svg(size, '0 0 15 15', <path d="M12.5 8.5A4.5 4.5 0 016.5 2.5a5 5 0 106 6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />, p)
}
