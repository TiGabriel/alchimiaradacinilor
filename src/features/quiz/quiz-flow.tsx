"use client";

import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import * as m from "framer-motion/m";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { track } from "@/lib/analytics/client";
import { Sprig } from "@/components/botanical";
import { BotanicalFloat, usePrefersReducedMotion } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { easeBotanical } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { QuizView } from "@/services/quiz/quiz";

import { submitQuizAction } from "./actions";

type Selections = Record<string, string[]>;

export function QuizFlow({ quiz }: { quiz: QuizView }) {
  const router = useRouter();
  const reduce = usePrefersReducedMotion();
  const [step, setStep] = useState(-1); // -1 = intro
  const [direction, setDirection] = useState(1);
  const [selections, setSelections] = useState<Selections>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pointerPick = useRef(false);

  const total = quiz.questions.length;
  const question = step >= 0 ? quiz.questions[step] : undefined;
  const picked = question ? (selections[question.id] ?? []) : [];
  const isLast = step === total - 1;

  useEffect(() => {
    if (step >= 0) headingRef.current?.focus();
  }, [step]);

  const go = useCallback(
    (next: number) => {
      setDirection(next > step ? 1 : -1);
      setError(null);
      setStep(next);
    },
    [step],
  );

  const submit = useCallback(
    (all: Selections) => {
      startSubmit(async () => {
        const result = await submitQuizAction({ answerIds: Object.values(all).flat() });
        if (result.ok) router.push(`/quiz/rezultat/${result.resultId}`);
        else setError(result.error);
      });
    },
    [router],
  );

  const advance = useCallback(
    (current: Selections) => {
      if (!question) return;
      if (question.required && (current[question.id]?.length ?? 0) === 0) {
        setError("Alege cel puțin un răspuns pentru a continua.");
        return;
      }
      if (isLast) submit(current);
      else go(step + 1);
    },
    [go, isLast, question, step, submit],
  );

  const toggle = useCallback(
    (answerId: string) => {
      if (!question) return;
      setError(null);
      const current = selections[question.id] ?? [];
      const nextForQuestion =
        question.type === "SINGLE_CHOICE"
          ? [answerId]
          : current.includes(answerId)
            ? current.filter((id) => id !== answerId)
            : [...current, answerId];
      setSelections({ ...selections, [question.id]: nextForQuestion });
      // A tap/click on a single-choice answer moves on; keyboard selection does not.
      if (question.type === "SINGLE_CHOICE" && pointerPick.current && !isLast) {
        setTimeout(() => go(step + 1), reduce ? 0 : 260);
      }
      pointerPick.current = false;
    },
    [go, isLast, question, reduce, selections, step],
  );

  // Number keys 1–9 pick answers; Enter continues.
  useEffect(() => {
    if (!question) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.tagName === "BUTTON" && e.key === "Enter")
        return;
      const n = Number(e.key);
      if (
        Number.isInteger(n) &&
        n >= 1 &&
        n <= question.answers.length &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        toggle(question.answers[n - 1]!.id);
      } else if (e.key === "Enter" && !submitting) {
        e.preventDefault();
        advance(selections);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, question, selections, submitting, toggle]);

  if (step === -1) {
    return (
      <section className="relative overflow-hidden">
        <BotanicalFloat className="absolute top-6 right-[6%] hidden w-40 md:block" drift={12}>
          <Sprig className="w-full text-sage/70" />
        </BotanicalFloat>
        <div className="container-page flex max-w-3xl flex-col items-start gap-6 py-16 md:py-24">
          <p className="text-eyebrow text-clay">{quiz.title}</p>
          <h1 className="text-display-xl">Hai să găsim aromele potrivite ție</h1>
          <p className="max-w-xl text-lg text-ink-muted">
            {quiz.description ?? "Câteva întrebări simple despre ce îți place și ce cauți."} Durează
            cam două minute, iar pentru fiecare recomandare îți spunem de ce am ales-o.
          </p>
          <ul className="flex flex-col gap-2 text-ink-muted">
            <li className="flex items-center gap-2">
              <Check aria-hidden className="size-4 text-forest" /> {total} întrebări, unele
              opționale
            </li>
            <li className="flex items-center gap-2">
              <Check aria-hidden className="size-4 text-forest" /> Fără cont — îl poți crea la final
              ca să salvezi rezultatul
            </li>
          </ul>
          <Button
            size="lg"
            onClick={() => {
              track("quiz_started");
              go(0);
            }}
          >
            Începe quiz-ul <ArrowRight aria-hidden />
          </Button>
        </div>
      </section>
    );
  }

  if (!question) return null;
  const progress = Math.round(((step + 1) / total) * 100);
  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: reduce ? 0 : dir * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: reduce ? 0 : dir * -40 }),
  };
  const inputType = question.type === "SINGLE_CHOICE" ? "radio" : "checkbox";

  return (
    <section
      className="container-page flex max-w-3xl flex-col gap-8 py-10 md:py-16"
      aria-labelledby="quiz-question"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>
            Întrebarea {step + 1} din {total}
          </span>
          <span>{progress}%</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-paper-deep"
          role="progressbar"
          aria-label="Progres quiz"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-forest transition-[width] duration-500 ease-(--ease-botanical)"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <m.div
          key={question.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduce ? 0 : 0.35, ease: easeBotanical }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <h1
              id="quiz-question"
              ref={headingRef}
              tabIndex={-1}
              className="text-display-md focus:outline-none"
            >
              {question.text}
            </h1>
            <p className="text-ink-muted">
              {question.helpText ??
                (question.type === "SINGLE_CHOICE"
                  ? "Alege un răspuns."
                  : "Alege unul sau mai multe.")}
              {!question.required ? " (opțional)" : ""}
            </p>
          </div>

          <fieldset>
            <legend className="sr-only">{question.text}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {question.answers.map((answer, i) => {
                const checked = picked.includes(answer.id);
                return (
                  <label
                    key={answer.id}
                    onPointerDown={() => {
                      pointerPick.current = true;
                    }}
                    className={cn(
                      "group flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border bg-surface px-4 py-3 transition-[border-color,background-color,box-shadow] duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest",
                      checked
                        ? "border-forest bg-forest-soft/60 shadow-soft"
                        : "border-line hover:border-line-strong",
                    )}
                  >
                    <input
                      type={inputType}
                      name={question.id}
                      value={answer.id}
                      checked={checked}
                      onChange={() => toggle(answer.id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-6 shrink-0 place-items-center border text-xs font-bold transition-colors",
                        inputType === "radio" ? "rounded-full" : "rounded-md",
                        checked
                          ? "border-forest bg-forest text-ink-inverse"
                          : "border-line-strong text-ink-muted",
                      )}
                    >
                      {checked ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="font-semibold text-ink">{answer.text}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </m.div>
      </AnimatePresence>

      <div aria-live="assertive" className="min-h-6 text-sm font-medium text-danger">
        {error}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => go(step - 1)} disabled={submitting}>
          <ArrowLeft aria-hidden /> Înapoi
        </Button>
        <div className="flex gap-2">
          {!question.required && picked.length === 0 && !isLast ? (
            <Button variant="outline" onClick={() => go(step + 1)}>
              Sari peste
            </Button>
          ) : null}
          <Button onClick={() => advance(selections)} loading={submitting}>
            {isLast ? (
              <>
                <Sparkles aria-hidden /> Vezi recomandările
              </>
            ) : (
              <>
                Continuă <ArrowRight aria-hidden />
              </>
            )}
          </Button>
        </div>
      </div>
      <p className="hidden text-xs text-ink-muted md:block">
        Sfat: folosește tastele 1–{Math.min(9, question.answers.length)} pentru a alege și Enter
        pentru a continua.
      </p>
    </section>
  );
}
