"use client";

import { useState } from "react";
import { QUIZ } from "@/lib/learn/habits";
import { SourceLinks } from "./SourceLinks";

/** "Good habit or bad habit?" One statement at a time, answer revealed with the study behind it. */
export function HabitQuiz() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const done = index >= QUIZ.length;
  const item = QUIZ[Math.min(index, QUIZ.length - 1)];
  const correct = answer !== null && answer === item.good;

  function choose(good: boolean) {
    if (answer !== null) return;
    setAnswer(good);
    if (good === item.good) setScore((s) => s + 1);
  }

  function next() {
    setAnswer(null);
    setIndex((i) => i + 1);
  }

  const choiceClass = (good: boolean) => {
    const base =
      "min-h-12 flex-1 cursor-pointer rounded-xl border px-4 text-[15px] font-semibold transition-colors disabled:cursor-default";
    if (answer === null)
      return `${base} border-white/15 text-starlight hover:border-white/35 hover:bg-white/[0.04]`;
    if (good === item.good) return `${base} border-sage/60 bg-sage/[0.14] text-starlight`;
    if (good === answer) return `${base} border-coral/60 bg-coral/[0.14] text-starlight`;
    return `${base} border-white/10 text-haze/60`;
  };

  return (
    <div className="rounded-2xl border border-white/[0.09] bg-[#0f1429] p-5 sm:p-7">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-starlight">Good habit or bad habit?</span>
        <span className="text-haze tabular" aria-live="polite">
          {done ? `${score} of ${QUIZ.length}` : `${index + 1} of ${QUIZ.length}`}
        </span>
      </div>

      {done ? (
        <div className="py-6" role="status">
          <p className="text-3xl font-semibold tracking-tight text-starlight">
            You got {score} of {QUIZ.length}.
          </p>
          <p className="mt-2 text-haze">
            {score === QUIZ.length
              ? "Every one right. You know your sleep."
              : "Each answer above links to the study behind it in the research list below."}
          </p>
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setScore(0);
              setAnswer(null);
            }}
            className="mt-5 min-h-11 cursor-pointer rounded-full bg-moon px-5 font-semibold text-[#14182b] hover:brightness-105 active:scale-[0.98]"
          >
            Play again
          </button>
        </div>
      ) : (
        <>
          <p className="mt-6 min-h-[3.5rem] text-2xl font-semibold leading-snug tracking-tight text-starlight sm:text-[1.65rem]">
            {item.statement}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={answer !== null}
              onClick={() => choose(true)}
              className={choiceClass(true)}
            >
              Good habit
            </button>
            <button
              type="button"
              disabled={answer !== null}
              onClick={() => choose(false)}
              className={choiceClass(false)}
            >
              Bad habit
            </button>
          </div>
          <div aria-live="polite" className="min-h-[6.5rem]">
            {answer !== null && (
              <div className="mt-5">
                <p className={`font-semibold ${correct ? "text-sage" : "text-coral"}`}>
                  {correct ? "Right." : "Not quite."} It&apos;s a {item.good ? "good" : "bad"}{" "}
                  habit.
                </p>
                <p className="mt-1 leading-relaxed text-haze">{item.explain}</p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <SourceLinks ids={item.sources} />
                  <button
                    type="button"
                    onClick={next}
                    className="min-h-11 shrink-0 cursor-pointer rounded-full bg-moon px-5 font-semibold text-[#14182b] hover:brightness-105 active:scale-[0.98]"
                  >
                    {index === QUIZ.length - 1 ? "See my score" : "Next"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
