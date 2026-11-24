import { authorBlock, sortReferences, titleSentence, type Reference } from "@/lib/references";

/** One APA 7 entry: journal article, or web page when there is no journal. */
function Entry({ r }: { r: Reference }) {
  return (
    <li id={`ref-${r.id}`} className="scroll-mt-24">
      {authorBlock(r)} ({r.date}).{" "}
      {r.journal ? (
        <>
          {titleSentence(r.title)}{" "}
          <em>
            {r.journal}
            {r.volume ? `, ${r.volume}` : ""}
          </em>
          {r.issue ? `(${r.issue})` : ""}
          {r.pages ? `, ${r.pages}` : r.article ? `, Article ${r.article}` : ""}.{" "}
        </>
      ) : (
        <>
          <em>{r.title}</em>. {r.site ? `${r.site}. ` : ""}
        </>
      )}
      <a
        href={r.url}
        className="text-starlight/90 underline decoration-white/25 underline-offset-4 [overflow-wrap:anywhere] hover:decoration-starlight"
      >
        {r.url}
      </a>
    </li>
  );
}

/** APA reference list with hanging indents, sorted the APA way. */
export function ReferenceList({ refs, className = "" }: { refs: Reference[]; className?: string }) {
  return (
    <ul
      className={`grid gap-4 text-[15px] leading-relaxed text-haze [&>li]:pl-8 [&>li]:-indent-8 ${className}`}
    >
      {sortReferences(refs).map((r) => (
        <Entry key={r.id} r={r} />
      ))}
    </ul>
  );
}
