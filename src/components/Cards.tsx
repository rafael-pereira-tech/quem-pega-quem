/** Mostra amarelos/vermelhos (só quando > 0). */
export function Cards({
  yellow,
  red,
  className = "",
}: {
  yellow: number;
  red: number;
  className?: string;
}) {
  if (!yellow && !red) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] text-text-mid ${className}`}>
      {yellow > 0 && (
        <span className="inline-flex items-center gap-0.5">
          <span className="w-[7px] h-[10px] rounded-[1px] bg-card-yellow inline-block" />
          {yellow}
        </span>
      )}
      {red > 0 && (
        <span className="inline-flex items-center gap-0.5">
          <span className="w-[7px] h-[10px] rounded-[1px] bg-card-red inline-block" />
          {red}
        </span>
      )}
    </span>
  );
}
