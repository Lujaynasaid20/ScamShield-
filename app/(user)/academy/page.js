"use client";

import Link from "next/link";
import { ErrorState, Loading, PageHeader, useApiData } from "@/components/ui";

export default function AcademyPage() {
  const { data, error, loading, reload } = useApiData("/api/academy");
  const percent = data ? Math.round((data.completed / data.total) * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow={<><i className="bi bi-mortarboard" aria-hidden="true" />Scam Awareness Academy</>}
        title="Learn to spot scams"
        description="Short lessons on the most common scams, each with warning signs, prevention tips and a quick quiz. Pass a quiz (2 of 3 correct) to complete a module."
      />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <div className="stack">
          <div className="card-panel">
            <div className="d-flex justify-content-between flex-wrap gap-2 mb-2"><strong>Your progress</strong><span className="small-print">{data.completed} of {data.total} modules completed</span></div>
            <div className="progress-bar-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Academy progress"><div className="progress-bar-fill" style={{ width: `${percent}%` }} /></div>
          </div>
          <div className="grid grid-3">
            {data.modules.map(module => (
              <Link key={module.id} href={`/academy/${module.id}`} className="card-panel module-card">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <span className="row-icon"><i className={`bi ${module.icon}`} aria-hidden="true" /></span>
                  {module.completed ? <span className="badge-status tone-safe"><i className="bi bi-check-circle-fill" aria-hidden="true" />Completed</span>
                    : module.lesson_completed || module.best_score !== null ? <span className="badge-status tone-info"><i className="bi bi-hourglass-split" aria-hidden="true" />In progress</span>
                    : <span className="badge-status tone-neutral">Not started</span>}
                </div>
                <h2 className="h6 mb-0">{module.title}</h2>
                <p className="small muted mb-0">{module.summary}</p>
                <div className="small-print mt-auto">{module.minutes} min read · {module.quiz_total}-question quiz{module.best_score !== null ? ` · Best score ${module.best_score}/${module.quiz_total}` : ""}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
