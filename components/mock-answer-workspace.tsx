"use client";

import { useMemo, useState } from "react";

export type MockAnswerQuestion = Readonly<{
  id: string;
  prompt: string;
  options?: readonly string[];
  answer: string;
  explanation?: string;
}>;

export function MockAnswerWorkspace({ questions, sourceUrl, sourceLabel }: { questions: readonly MockAnswerQuestion[]; sourceUrl?: string; sourceLabel?: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const result = useMemo(() => {
    if (!submitted) return null;
    const answered = questions.filter((question) => answers[question.id]);
    const correct = answered.filter((question) => answers[question.id] === question.answer).length;
    return { answered: answered.length, correct };
  }, [answers, questions, submitted]);

  return <section className="mx-auto w-[min(920px,calc(100%-32px))] py-10">
    <div className="jshs-surface-card p-6 md:p-8">
      <p className="jshs-eyebrow">後台已發布答案</p>
      <h2 className="mt-2 text-2xl">逐題對答案</h2>
      <p className="mt-3 text-sm leading-7 jshs-muted-copy">答案與解析由管理後台發布；本站只依目前發布版本計算本次作答結果，不代表正式排名或錄取預測。</p>
      {sourceUrl ? <p className="mt-3 text-sm">答案來源：<a className="font-bold text-[var(--jshs-primary)]" href={sourceUrl} target="_blank" rel="noreferrer">{sourceLabel || "查看來源"} ↗</a></p> : null}
      <div className="mt-6 grid gap-5">
        {questions.map((question, index) => <fieldset key={question.id} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4">
          <legend className="font-black">{index + 1}. {question.prompt}</legend>
          <div className="mt-3 grid gap-2">
            {(question.options?.length ? question.options : [question.answer]).map((option) => <label key={option} className="flex items-center gap-2 text-sm"><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} />{option}</label>)}
          </div>
          {submitted && answers[question.id] ? <p className={`mt-3 text-sm font-bold ${answers[question.id] === question.answer ? "text-emerald-700" : "text-red-700"}`}>{answers[question.id] === question.answer ? "答對" : `正確答案：${question.answer}`}{question.explanation ? `｜${question.explanation}` : ""}</p> : null}
        </fieldset>)}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className="jshs-button-primary px-4 py-3" onClick={() => setSubmitted(true)}>送出答案</button>
        {result ? <p className="text-sm font-bold" role="status">已作答 {result.answered} / {questions.length} 題，答對 {result.correct} 題。</p> : null}
      </div>
    </div>
  </section>;
}
