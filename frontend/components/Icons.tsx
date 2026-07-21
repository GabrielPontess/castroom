import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return <svg fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props} />;
}

export function SparklesIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" {...props}>
      <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
      <path d="M5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9L5 14z" />
    </BaseIcon>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" {...props}>
      <path d="M4 8h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
      <path d="M16 11l6-3v10l-6-3z" />
    </BaseIcon>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" {...props}>
      <path d="M12 15a4 4 0 0 0 4-4V7a4 4 0 0 0-8 0v4a4 4 0 0 0 4 4z" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </BaseIcon>
  );
}

export function ScreenIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </BaseIcon>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" {...props}>
      <path d="M21 15a3 3 0 0 1-3 3H8l-5 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z" />
    </BaseIcon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16.5 3.13a4 4 0 0 1 0 7.75" />
    </BaseIcon>
  );
}

export function TeacherIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" {...props}>
      <path d="M3 8l9-5 9 5-9 5-9-5z" />
      <path d="M7 10.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-4.5" />
      <path d="M21 10v6" />
    </BaseIcon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </BaseIcon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.3 2.3 4.7-5.3" />
    </BaseIcon>
  );
}

export function DoorIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" {...props}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
      <path d="M10 12h11" />
      <path d="M18 8l4 4-4 4" />
    </BaseIcon>
  );
}
