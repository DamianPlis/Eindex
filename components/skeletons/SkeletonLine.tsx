export default function SkeletonLine({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`skeleton-line ${className}`.trim()} style={style} aria-hidden="true" />;
}