import { cn } from "../../utils/cn";

export function NeonBorderCard({ children, className }) {
  return (
    <div className={cn("group relative overflow-hidden bg-transparent rounded-[1px]", className)}>
      <div className="absolute inset-0 w-[200%] h-[200%] top-[-50%] left-[-50%] bg-[conic-gradient(from_0deg,transparent_70%,rgba(0,245,255,1)_100%)] animate-[spin_3s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-[1px] bg-[#0a0a0a] rounded-[1px] z-10 transition-colors duration-300 group-hover:bg-opacity-95" />
      <div className="relative z-20 h-full w-full">
        {children}
      </div>
    </div>
  );
}
