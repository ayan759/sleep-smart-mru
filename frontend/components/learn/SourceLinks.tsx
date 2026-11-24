import { cite } from "@/lib/learn/cite";

/** Small citation links that jump to the study in the research library below. */
export function SourceLinks({ ids }: { ids: string[] }) {
  return (
    <span className="text-xs text-haze/80">
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && ", "}
          <a
            href={`#study-${id}`}
            className="underline decoration-haze/40 underline-offset-2 hover:text-starlight hover:decoration-starlight"
          >
            {cite(id)}
          </a>
        </span>
      ))}
    </span>
  );
}
