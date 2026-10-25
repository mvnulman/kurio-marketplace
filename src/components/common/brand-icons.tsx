import type { SVGProps } from 'react'

const base = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  focusable: false,
  fill: 'currentColor',
} as const

export function GoogleMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M21.35 12.23c0-.68-.06-1.34-.18-1.96H12v3.7h5.24a4.49 4.49 0 0 1-1.94 2.95v2.45h3.14c1.84-1.69 2.91-4.19 2.91-7.14Z" />
      <path
        opacity=".75"
        d="M12 21.75c2.63 0 4.83-.87 6.44-2.38l-3.14-2.45c-.87.58-1.99.93-3.3.93-2.53 0-4.68-1.71-5.45-4.01H3.31v2.52A9.74 9.74 0 0 0 12 21.75Z"
      />
      <path
        opacity=".55"
        d="M6.55 13.84a5.86 5.86 0 0 1 0-3.68V7.64H3.31a9.75 9.75 0 0 0 0 8.72l3.24-2.52Z"
      />
      <path
        opacity=".35"
        d="M12 6.15c1.43 0 2.71.49 3.72 1.46l2.79-2.79A9.34 9.34 0 0 0 12 2.25a9.74 9.74 0 0 0-8.69 5.39l3.24 2.52c.77-2.3 2.92-4.01 5.45-4.01Z"
      />
    </svg>
  )
}

export function FacebookMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.81.22-1.36 1.38-1.36h1.47V5.53c-.25-.03-1.12-.11-2.13-.11-2.1 0-3.54 1.28-3.54 3.64v2.14H8.1V14h2.58v7h2.82Z" />
    </svg>
  )
}

export function InstagramMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function XMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M17.53 3h3.02l-6.6 7.54L21.5 21h-6.06l-4.75-6.2L5.25 21H2.23l7.06-8.07L2.5 3h6.22l4.3 5.68L17.53 3Zm-1.06 16.18h1.67L7.6 4.73H5.81l10.66 14.45Z" />
    </svg>
  )
}

export function YoutubeMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42A2.5 2.5 0 0 0 2.42 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.42-4.81ZM10 15.02V8.98L15.2 12 10 15.02Z" />
    </svg>
  )
}
