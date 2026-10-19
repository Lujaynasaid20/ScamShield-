"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ErrorState, Loading, Notice, PageHeader, useApiData, useToast } from "@/components/ui";
import { api } from "@/lib/api-client";

function Quiz({ module, passMark, onGraded }) {
  const toast = useToast();
  const [answers, setAnswers] = useState(() => module.quiz.map(() => null));
  const [grade, setGrade] = useState(null);
  const [busy, setBusy] = useState(false);
  const answered = answers.every(answer => answer !== null);

  const choose = (questionIndex, optionIndex) => {
    if (answers[questionIndex] !== null || grade) return;
    setAnswers(current => current.map((answer, index) => (index === questionIndex ? optionIndex : answer)));
  };
  const submit = async () => {
    setBusy(true);
    try {
      const data = await api(`/api/academy/${module.id}`, { method: "POST", body: { action: "quiz", answers } });
      setGrade(data.grade);
      onGraded(data.progress);
      toast(data.grade.passed ? "Quiz passed. Module complete!" : "Quiz saved. Review the explanations and try again.", data.grade.passed ? "success" : "info");
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card-panel" aria-labelledby="quiz-title">
      <div className="panel-title"><h2 id="quiz-title">Quick quiz</h2><span className="small-print">Pass mark: {passMark} of {module.quiz.length}</span></div>
      {module.quiz.map((question, questionIndex) => {
        const chosen = answers[questionIndex];
        return (
          <fieldset className="quiz-question" key={question.question}>
            <legend className="fs-6 fw-semibold">{questionIndex + 1}. {question.question}</legend>
            {question.options.map((option, optionIndex) => {
              const state = chosen === null ? "" : optionIndex === question.answer ? "correct" : optionIndex === chosen ? "wrong" : "";
              return (
                <button key={option} type="button" className={`quiz-option ${state}`} disabled={chosen !== null} aria-pressed={chosen === optionIndex} onClick={() => choose(questionIndex, optionIndex)}>
                  <i className={`bi ${state === "correct" ? "bi-check-circle-fill text-success" : state === "wrong" ? "bi-x-circle-fill text-danger" : "bi-circle"}`} aria-hidden="true" />
                  <span>{option}</span>
                  {state === "correct" && <span className="visually-hidden">(correct answer)</span>}
                  {state === "wrong" && <span className="visually-hidden">(your answer, incorrect)</span>}
                </button>
              );
            })}
            {chosen !== null && (
              <div className={`quiz-explanation alert-box ${chosen === question.answer ? "tone-safe" : "tone-warn"}`} role="status">
                <i className={`bi ${chosen === question.answer ? "bi-check-circle" : "bi-lightbulb"}`} aria-hidden="true" />
                <div><strong>{chosen === question.answer ? "Correct." : "Not quite."}</strong> {question.explanation}</div>
              </div>
            )}
          </fieldset>
        );
      })}
      <div className="d-flex gap-2 flex-wrap align-items-center mt-3">
        {!grade && <button type="button" className="btn btn-primary" disabled={!answered || busy} onClick={submit}>{busy && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}Submit answers</button>}
        {!answered && !grade && <span className="small-print">Answer every question to submit.</span>}
        {grade && (
          <>
            <span className={`badge-status ${grade.passed ? "tone-safe" : "tone-warn"}`}>Score {grade.score}/{grade.total} · {grade.passed ? "Passed" : "Not passed yet"}</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAnswers(module.quiz.map(() => null)); setGrade(null); }}>Retake quiz</button>
            <Link href="/academy" className="btn btn-outline btn-sm">All modules</Link>
          </>
        )}
      </div>
    </section>
  );
}

export default function ModulePage() {
  const { id } = useParams();
  const toast = useToast();
  const { data, error, loading, reload, setData } = useApiData(`/api/academy/${id}`);
  const module = data?.module;
  const progress = data?.progress;

  const markRead = async () => {
    try {
      const result = await api(`/api/academy/${id}`, { method: "POST", body: { action: "lesson" } });
      setData(current => ({ ...current, progress: result.progress }));
      toast("Lesson marked as read.", "success");
    } catch (requestError) { toast(requestError.message, "error"); }
  };

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/academy" className="text-decoration-none"><i className="bi bi-arrow-left" aria-hidden="true" /> Scam Awareness Academy</Link>}
        title={module?.title || "Lesson"}
        description={module?.summary}
        actions={progress?.completed ? <span className="badge-status tone-safe"><i className="bi bi-check-circle-fill" aria-hidden="true" />Completed</span> : null}
      />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {module && (
        <div className="grid grid-main-side">
          <div className="stack">
            <section className="card-panel lesson-body" aria-labelledby="lesson-title">
              <h2 id="lesson-title">Lesson</h2>
              {module.lesson.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              <h3 className="mt-3">Examples</h3>
              <p className="small-print">These examples were written to illustrate the pattern. They are not real reported incidents.</p>
              {module.examples.map(example => (
                <div className="example-card" key={example.text}>
                  <span className="kind-chip">Illustrative {example.channel}</span>
                  <blockquote>“{example.text}”</blockquote>
                  <div className="small"><i className="bi bi-search me-1" aria-hidden="true" /><strong>Why it's suspicious:</strong> {example.note}</div>
                </div>
              ))}
              <div className="mt-3">
                {progress?.lesson_completed ? <span className="badge-status tone-safe"><i className="bi bi-check2" aria-hidden="true" />Lesson read</span>
                  : <button type="button" className="btn btn-outline btn-sm" onClick={markRead}><i className="bi bi-check2" aria-hidden="true" />Mark lesson as read</button>}
              </div>
            </section>
            <Quiz key={module.id} module={module} passMark={data.passMark} onGraded={next => setData(current => ({ ...current, progress: next }))} />
          </div>
          <aside className="stack">
            <section className="card-panel">
              <h2 className="h6"><i className="bi bi-exclamation-triangle text-warning me-1" aria-hidden="true" />Warning signs</h2>
              <ul className="tick-list small">{module.warningSigns.map(sign => <li key={sign}><i className="bi bi-dot" aria-hidden="true" /><span>{sign}</span></li>)}</ul>
            </section>
            <section className="card-panel">
              <h2 className="h6"><i className="bi bi-shield-check text-success me-1" aria-hidden="true" />How to protect yourself</h2>
              <ul className="tick-list small">{module.tips.map(tip => <li key={tip}><i className="bi bi-check2 text-success" aria-hidden="true" /><span>{tip}</span></li>)}</ul>
            </section>
            {progress && progress.attempts > 0 && <Notice icon="bi-bar-chart">Best score: {progress.best_score}/{module.quiz.length} after {progress.attempts} attempt{progress.attempts === 1 ? "" : "s"}.</Notice>}
          </aside>
        </div>
      )}
    </>
  );
}
