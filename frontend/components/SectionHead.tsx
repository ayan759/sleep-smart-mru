/** Large section heading with a short intro, used on the guide and About pages. */
export function SectionHead({
  id,
  title,
  intro,
}: {
  id: string;
  title: string;
  intro: React.ReactNode;
}) {
  return (
    <div className="max-w-[62ch]">
      <h2
        id={id}
        className="scroll-mt-8 text-[2rem] font-semibold leading-[1.1] tracking-[-0.02em] text-starlight sm:text-[2.5rem]"
      >
        {title}
      </h2>
      <p className="mt-3 text-lg leading-relaxed text-haze">{intro}</p>
    </div>
  );
}
