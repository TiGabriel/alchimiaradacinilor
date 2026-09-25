"use client";

import { Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { ProductType } from "@/generated/prisma/enums";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { productTypeLabels } from "@/validation/product";

import { DeleteButton } from "../delete-button";
import { AdminCard, adminSelect } from "../ui";

import {
  deleteAnswerAction,
  deleteQuestionAction,
  previewQuizAction,
  saveAnswerAction,
  saveQuestionAction,
} from "./actions";

type Option = { id: string; name: string };
type Weighted = { id: string; weight: number };
export type EditorAnswer = {
  id: string;
  text: string;
  position: number;
  maxPrice: number | null;
  uses: number;
  needs: Weighted[];
  aromas: Weighted[];
  tags: Weighted[];
  productTypes: Array<{ type: ProductType; weight: number }>;
};
export type EditorQuestion = {
  id: string;
  text: string;
  helpText: string | null;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  required: boolean;
  position: number;
  answers: EditorAnswer[];
};
type Options = { needs: Option[]; aromas: Option[]; tags: Option[] };

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (
    fn: () => Promise<{
      ok: boolean;
      error?: string;
      message?: string;
      fieldErrors?: Record<string, string>;
    }>,
    onDone?: () => void,
    onErrors?: (e: Record<string, string>) => void,
  ) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) {
        onErrors?.(r.fieldErrors ?? {});
        toast({ title: r.error ?? "Eroare", variant: "error" });
        return;
      }
      if (r.message) toast({ title: r.message, variant: "success" });
      onDone?.();
      router.refresh();
    });
  return { pending, run };
}

function QuestionDialog({
  question,
  nextPosition,
  onClose,
}: {
  question: EditorQuestion | null;
  nextPosition: number;
  onClose: () => void;
}) {
  const uid = useId();
  const [v, setV] = useState({
    text: question?.text ?? "",
    helpText: question?.helpText ?? "",
    type: question?.type ?? "SINGLE_CHOICE",
    required: question?.required ?? true,
    position: String(question?.position ?? nextPosition),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pending, run } = useRun();
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveQuestionAction(v, question?.id), onClose, setErrors);
      }}
    >
      <Field id={`${uid}-t`} label="Întrebarea" required error={errors.text}>
        {(p) => (
          <Input {...p} value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} />
        )}
      </Field>
      <Field id={`${uid}-h`} label="Text ajutător" error={errors.helpText}>
        {(p) => (
          <Input
            {...p}
            value={v.helpText}
            onChange={(e) => setV({ ...v, helpText: e.target.value })}
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${uid}-type`} label="Tip">
          {(p) => (
            <select
              {...p}
              value={v.type}
              onChange={(e) => setV({ ...v, type: e.target.value as EditorQuestion["type"] })}
              className={cn(adminSelect, "h-11 w-full")}
            >
              <option value="SINGLE_CHOICE">Un singur răspuns</option>
              <option value="MULTIPLE_CHOICE">Mai multe răspunsuri</option>
            </select>
          )}
        </Field>
        <Field id={`${uid}-pos`} label="Ordine" error={errors.position}>
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              value={v.position}
              onChange={(e) => setV({ ...v, position: e.target.value })}
            />
          )}
        </Field>
      </div>
      <Checkbox
        id={`${uid}-req`}
        checked={v.required}
        onCheckedChange={(c) => setV({ ...v, required: c === true })}
        label="Obligatorie"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Renunță
        </Button>
        <Button type="submit" loading={pending}>
          Salvează
        </Button>
      </div>
    </form>
  );
}

function WeightRows({
  label,
  options,
  value,
  onChange,
  idPrefix,
}: {
  label: string;
  options: Option[];
  value: Weighted[];
  onChange: (v: Weighted[]) => void;
  idPrefix: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold">{label}</legend>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {options.map((o) => {
          const current = value.find((w) => w.id === o.id);
          return (
            <div
              key={o.id}
              className="flex items-center justify-between gap-2 rounded-md border border-line px-2 py-1.5"
            >
              <label htmlFor={`${idPrefix}-${o.id}`} className="text-sm">
                {o.name}
              </label>
              <input
                id={`${idPrefix}-${o.id}`}
                type="number"
                min={-10}
                max={10}
                step={1}
                value={current?.weight ?? ""}
                placeholder="—"
                onChange={(e) => {
                  const n = e.target.value === "" ? 0 : Math.trunc(Number(e.target.value));
                  const rest = value.filter((w) => w.id !== o.id);
                  onChange(n ? [...rest, { id: o.id, weight: n }] : rest);
                }}
                className="h-8 w-16 rounded border border-line-strong px-2 text-right text-sm tabular-nums"
              />
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

function AnswerDialog({
  questionId,
  answer,
  nextPosition,
  options,
  onClose,
}: {
  questionId: string;
  answer: EditorAnswer | null;
  nextPosition: number;
  options: Options;
  onClose: () => void;
}) {
  const uid = useId();
  const [v, setV] = useState({
    text: answer?.text ?? "",
    position: String(answer?.position ?? nextPosition),
    maxPrice: answer?.maxPrice != null ? String(answer.maxPrice / 100) : "",
    needs: answer?.needs ?? [],
    aromas: answer?.aromas ?? [],
    tags: answer?.tags ?? [],
    productTypes: (answer?.productTypes ?? []).map((p) => ({
      id: p.type as string,
      weight: p.weight,
    })),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pending, run } = useRun();
  const typeOptions = Object.entries(productTypeLabels).map(([id, name]) => ({ id, name }));
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () =>
            saveAnswerAction(
              questionId,
              { ...v, productTypes: v.productTypes.map((p) => ({ type: p.id, weight: p.weight })) },
              answer?.id,
            ),
          onClose,
          setErrors,
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_6rem_8rem]">
        <Field id={`${uid}-t`} label="Răspuns" required error={errors.text}>
          {(p) => (
            <Input {...p} value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} />
          )}
        </Field>
        <Field id={`${uid}-p`} label="Ordine" error={errors.position}>
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              value={v.position}
              onChange={(e) => setV({ ...v, position: e.target.value })}
            />
          )}
        </Field>
        <Field id={`${uid}-m`} label="Buget max. (lei)" error={errors.maxPrice}>
          {(p) => (
            <Input
              {...p}
              inputMode="decimal"
              value={v.maxPrice}
              onChange={(e) => setV({ ...v, maxPrice: e.target.value })}
            />
          )}
        </Field>
      </div>
      <p className="text-sm text-ink-muted">
        Greutăți între -10 și 10. Negativ = produsele cu această trăsătură coboară în clasament. Gol
        = fără efect.
      </p>
      {Object.entries(errors)
        .filter(([k]) => /needs|aromas|tags|productTypes/.test(k))
        .map(([k, m]) => (
          <p key={k} className="text-sm text-danger">
            {m}
          </p>
        ))}
      <WeightRows
        idPrefix={`${uid}-n`}
        label="Nevoi"
        options={options.needs}
        value={v.needs}
        onChange={(needs) => setV({ ...v, needs })}
      />
      <WeightRows
        idPrefix={`${uid}-a`}
        label="Profiluri aromatice"
        options={options.aromas}
        value={v.aromas}
        onChange={(aromas) => setV({ ...v, aromas })}
      />
      <WeightRows
        idPrefix={`${uid}-g`}
        label="Etichete"
        options={options.tags}
        value={v.tags}
        onChange={(tags) => setV({ ...v, tags })}
      />
      <WeightRows
        idPrefix={`${uid}-y`}
        label="Tipuri de produs"
        options={typeOptions}
        value={v.productTypes}
        onChange={(productTypes) => setV({ ...v, productTypes })}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Renunță
        </Button>
        <Button type="submit" loading={pending}>
          Salvează
        </Button>
      </div>
    </form>
  );
}

type PreviewResult = {
  signals: Array<{ kind: string; label: string; weight: number }>;
  budget: number | null;
  results: Array<{ id: string; name: string; price: number; score: number; explanation: string }>;
};

function QuizPreview({ questions }: { questions: EditorQuestion[] }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [pending, start] = useTransition();
  const pick = (q: EditorQuestion, answerId: string) =>
    setChosen((c) => {
      const others =
        q.type === "SINGLE_CHOICE" ? c.filter((id) => !q.answers.some((a) => a.id === id)) : c;
      return c.includes(answerId) ? others.filter((id) => id !== answerId) : [...others, answerId];
    });
  return (
    <AdminCard title="Previzualizare">
      <p className="-mt-2 text-sm text-ink-muted">
        Alege răspunsuri și rulează motorul real de recomandări (fără salvare, fără date personale).
      </p>
      <div className="flex flex-col gap-4">
        {questions.map((q) => (
          <fieldset key={q.id} className="flex flex-col gap-1.5">
            <legend className="text-sm font-semibold">{q.text}</legend>
            <div className="flex flex-wrap gap-2">
              {q.answers.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={chosen.includes(a.id)}
                  onClick={() => pick(q, a.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm",
                    chosen.includes(a.id)
                      ? "border-forest bg-forest text-ink-inverse"
                      : "border-line hover:border-forest",
                  )}
                >
                  {a.text}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await previewQuizAction(chosen);
              if (!r.ok) toast({ title: r.error, variant: "error" });
              else setResult(r.data);
            })
          }
        >
          <Play aria-hidden /> Rulează
        </Button>
        <Button type="button" variant="ghost" onClick={() => (setChosen([]), setResult(null))}>
          Resetează
        </Button>
      </div>
      {result ? (
        <div className="flex flex-col gap-3 border-t border-line pt-4" aria-live="polite">
          <p className="text-sm">
            <span className="font-semibold">Semnale:</span>{" "}
            {result.signals.length
              ? result.signals
                  .map((s) => `${s.label} ${s.weight > 0 ? "+" : ""}${s.weight}`)
                  .join(" · ")
              : "niciunul"}
            {result.budget != null ? ` · buget ${formatMoney(result.budget)}` : ""}
          </p>
          {result.results.length ? (
            <ol className="flex flex-col gap-2 text-sm">
              {result.results.map((r, i) => (
                <li key={r.id} className="flex flex-col rounded-md border border-line p-3">
                  <span className="flex justify-between gap-3 font-semibold">
                    {i + 1}. {r.name}
                    <span className="text-ink-muted tabular-nums">
                      scor {r.score.toString().replace(".", ",")} · {formatMoney(r.price)}
                    </span>
                  </span>
                  <span className="text-ink-muted">{r.explanation}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-muted">
              Niciun produs nu se potrivește acestor răspunsuri.
            </p>
          )}
        </div>
      ) : null}
    </AdminCard>
  );
}

export function QuizEditor({
  questions,
  options,
}: {
  questions: EditorQuestion[];
  options: Options;
}) {
  const [dialog, setDialog] = useState<
    | { kind: "question"; question: EditorQuestion | null }
    | { kind: "answer"; questionId: string; answer: EditorAnswer | null; next: number }
    | null
  >(null);
  const close = () => setDialog(null);
  const nameOf = (list: Option[], id: string) => list.find((o) => o.id === id)?.name ?? "?";
  const summary = (a: EditorAnswer) =>
    [
      ...a.needs.map((w) => `${nameOf(options.needs, w.id)} ${w.weight > 0 ? "+" : ""}${w.weight}`),
      ...a.aromas.map(
        (w) => `${nameOf(options.aromas, w.id)} ${w.weight > 0 ? "+" : ""}${w.weight}`,
      ),
      ...a.tags.map((w) => `#${nameOf(options.tags, w.id)} ${w.weight > 0 ? "+" : ""}${w.weight}`),
      ...a.productTypes.map(
        (p) => `${productTypeLabels[p.type]} ${p.weight > 0 ? "+" : ""}${p.weight}`,
      ),
      ...(a.maxPrice != null ? [`buget ≤ ${formatMoney(a.maxPrice)}`] : []),
    ].join(" · ") || "fără efect";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="flex flex-col gap-4">
        <div>
          <Button onClick={() => setDialog({ kind: "question", question: null })}>
            <Plus aria-hidden /> Întrebare nouă
          </Button>
        </div>
        {questions.map((q, i) => (
          <AdminCard
            key={q.id}
            title={`${i + 1}. ${q.text}`}
            actions={
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialog({ kind: "question", question: q })}
                >
                  <Pencil aria-hidden /> Editează
                </Button>
                <DeleteButton
                  action={deleteQuestionAction.bind(null, q.id)}
                  confirmText={`Ștergi întrebarea „${q.text}”?`}
                />
              </div>
            }
          >
            <p className="-mt-2 text-xs text-ink-muted">
              {q.type === "SINGLE_CHOICE" ? "Un singur răspuns" : "Mai multe răspunsuri"} ·{" "}
              {q.required ? "obligatorie" : "opțională"}
              {q.helpText ? ` · ${q.helpText}` : ""}
            </p>
            <ul className="flex flex-col divide-y divide-line">
              {q.answers.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">{a.text}</span>
                    <span className="text-xs text-ink-muted">
                      {summary(a)}
                      {a.uses ? ` · ales de ${a.uses} ori` : ""}
                    </span>
                  </span>
                  <span className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDialog({ kind: "answer", questionId: q.id, answer: a, next: a.position })
                      }
                    >
                      <Pencil aria-hidden />
                      <span className="sr-only">Editează răspunsul {a.text}</span>
                    </Button>
                    {a.uses === 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger"
                        onClick={async () => {
                          if (!confirm(`Ștergi răspunsul „${a.text}”?`)) return;
                          const r = await deleteAnswerAction(a.id);
                          toast(
                            r.ok
                              ? { title: "Răspuns șters", variant: "success" }
                              : { title: r.error, variant: "error" },
                          );
                        }}
                        aria-label={`Șterge răspunsul ${a.text}`}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() =>
                setDialog({
                  kind: "answer",
                  questionId: q.id,
                  answer: null,
                  next: (q.answers.at(-1)?.position ?? -1) + 1,
                })
              }
            >
              <Plus aria-hidden /> Răspuns nou
            </Button>
          </AdminCard>
        ))}
      </div>
      <div className="xl:sticky xl:top-6 xl:self-start">
        <QuizPreview questions={questions} />
      </div>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === "question"
                ? dialog.question
                  ? "Editează întrebarea"
                  : "Întrebare nouă"
                : dialog?.answer
                  ? "Editează răspunsul"
                  : "Răspuns nou"}
            </DialogTitle>
          </DialogHeader>
          {dialog?.kind === "question" ? (
            <QuestionDialog
              question={dialog.question}
              nextPosition={questions.length}
              onClose={close}
            />
          ) : dialog?.kind === "answer" ? (
            <AnswerDialog
              questionId={dialog.questionId}
              answer={dialog.answer}
              nextPosition={dialog.next}
              options={options}
              onClose={close}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
