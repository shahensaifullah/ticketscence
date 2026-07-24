import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
};

export function TicketMark(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        {...strokeProps}
        d="M5.25 5.5h13.5v3a2.25 2.25 0 0 0 0 4.5v5.5H5.25V13a2.25 2.25 0 0 0 0-4.5v-3Z"
      />
      <path {...strokeProps} d="M10 8v8M14 8v2M14 13v3" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path {...strokeProps} d="M3.5 6.5h17v11h-17z" />
      <path {...strokeProps} d="m4.5 7.5 7.5 6 7.5-6" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect {...strokeProps} x="5" y="10" width="14" height="10" rx="2" />
      <path {...strokeProps} d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2.5" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle {...strokeProps} cx="12" cy="8" r="3.5" />
      <path {...strokeProps} d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path {...strokeProps} d="M4 20V5h10v15M14 10h6v10M8 9h2M8 13h2M8 17h2M17 14h1M17 17h1M2 20h20" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path {...strokeProps} d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.76 2.98-4.34 2.98-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.42l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.79-5.61-4.2H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.8A6 6 0 0 1 6.08 12c0-.62.11-1.22.31-1.8V7.58H3.04A10 10 0 0 0 2 12c0 1.6.38 3.12 1.04 4.42l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.47 0 2.8.51 3.84 1.51l2.87-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.96 5.58l3.35 2.62C7.18 7.79 9.39 6 12 6Z"
      />
    </svg>
  );
}

export function MicrosoftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#f25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7fba00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00a4ef" d="M2 12.5h9.5V22H2z" />
      <path fill="#ffb900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}
