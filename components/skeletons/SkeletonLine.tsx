import sk from "./Skeletons.module.css";

export default function SkeletonLine({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`${sk.skeletonLine} ${className}`.trim()} style={style} aria-hidden="true" />;
}