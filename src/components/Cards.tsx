/** Mostra amarelos/vermelhos (só quando > 0). */
export function Cards({
  yellow,
  red,
  className = '',
}: {
  yellow: number;
  red: number;
  className?: string;
}) {
  if (!yellow && !red) return null;
  return (
    <span
      className={`text-text-mid inline-flex items-center gap-1.5 font-mono text-[10px] ${className}`}
    >
      {yellow > 0 && (
        <span className="inline-flex items-center gap-0.5">
          <span className="bg-card-yellow inline-block h-[10px] w-[7px] rounded-[1px]" />
          {yellow}
        </span>
      )}
      {red > 0 && (
        <span className="inline-flex items-center gap-0.5">
          <span className="bg-card-red inline-block h-[10px] w-[7px] rounded-[1px]" />
          {red}
        </span>
      )}
    </span>
  );
}
