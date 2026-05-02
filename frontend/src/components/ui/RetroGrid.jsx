import { cn } from '../../utils/cn.js';

// Preserved from v1: cyan perspective grid background, animated upward
// via the `animate-grid` Tailwind keyframe defined in tailwind.config.js.

export const RetroGrid = ({ className, angle = 65 }) => (
  <div
    className={cn(
      'pointer-events-none absolute h-full w-full overflow-hidden opacity-20 [perspective:200px]',
      className,
    )}
    style={{ '--grid-angle': `${angle}deg` }}
  >
    <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
      <div
        className={cn(
          'animate-grid',
          '[background-repeat:repeat] [background-size:60px_60px] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]',
          '[background-image:linear-gradient(to_right,rgba(56,189,248,0.1)_1px,transparent_0),linear-gradient(to_bottom,rgba(56,189,248,0.1)_1px,transparent_0)]',
        )}
      />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#0f172a] to-90%" />
  </div>
);
