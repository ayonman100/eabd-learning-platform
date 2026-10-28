import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CirclePlay,
  Clock3,
  Compass,
  ListChecks,
  Target,
} from "lucide-react";
import { learningPaths } from "../data/learningPaths.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  isSupabaseConfigured,
  supabase,
} from "../lib/supabase.js";
import {
  getProgressSummary,
  getWeekStatus,
  loadProgress,
} from "../utils/progress.js";

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchLearnerProfile() {
      if (!user?.id || !isSupabaseConfigured || !supabase) {
        if (active) {
          setProfile(null);
          setProfileLoading(false);
        }
        return;
      }

      setProfileLoading(true);

      try {
        const { data, error } = await supabase
          .from("learner_profiles")
          .select("learner_name, account_type")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (active) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Could not load learner profile:", error);

        if (active) {
          setProfile(null);
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    fetchLearnerProfile();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const accountName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "";

  const name = profileLoading
    ? "Learner"
    : profile?.learner_name?.trim() ||
      (profile?.account_type === "guardian"
        ? "your learner"
        : accountName || "Learner");

  const pathwayParam = searchParams.get("pathway");
  const storageKey = user?.id
    ? `eabd-selected-pathway:${user.id}`
    : null;

  const pathway = useMemo(() => {
    let savedPathwayId = "";

    if (storageKey) {
      try {
        savedPathwayId = localStorage.getItem(storageKey) || "";
      } catch {
        savedPathwayId = "";
      }
    }

    const requestedId = pathwayParam || savedPathwayId;
    return learningPaths.find((item) => item.id === requestedId) || null;
  }, [pathwayParam, storageKey]);

  useEffect(() => {
    if (!storageKey || !pathwayParam || !pathway) return;

    try {
      localStorage.setItem(storageKey, pathway.id);
    } catch {
      // The dashboard remains usable without browser storage.
    }
  }, [storageKey, pathwayParam, pathway]);

  const progress = useMemo(() => {
    if (!user?.id || !pathway) return null;
    return loadProgress(user.id, pathway);
  }, [user?.id, pathway]);

  const summary = useMemo(() => {
    if (!pathway || !progress) return null;
    return getProgressSummary(pathway, progress);
  }, [pathway, progress]);

  const nextActivity = useMemo(() => {
    if (!pathway || !progress) return null;

    for (let weekIndex = 0; weekIndex < pathway.weeks.length; weekIndex += 1) {
      const week = pathway.weeks[weekIndex];
      const status = getWeekStatus(pathway, progress, weekIndex);

      if (status === "locked" || status === "complete") continue;

      const task = week.tasks.find(
        (item) => !progress.completedTasks.includes(item.id)
      );

      if (task) {
        const awaitingReview =
          progress.reviewFlags[task.id]?.status === "pending";

        return {
          ...task,
          weekTitle: week.title,
          weekIndex,
          awaitingReview,
        };
      }
    }

    return null;
  }, [pathway, progress]);

  const completed = summary?.completedCount ?? 0;
  const percentage = summary?.percentage ?? 0;
  const totalTasks = summary?.totalTasks ?? 0;
  const remaining = summary?.remainingCount ?? 0;

  return (
    <main id="main-content" className="dashboard-page" tabIndex="-1">
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
          <p className="dashboard-eyebrow">LEARNING DASHBOARD</p>
          <h1>Welcome back, {name}.</h1>
          <p>
            Keep your learning moving. Pick up where you left off and take
            the next step towards your goal.
          </p>
        </div>

        <div className="dashboard-welcome-mark" aria-hidden="true">
          <Target size={42} strokeWidth={1.7} />
        </div>
      </section>

      {pathway && summary ? (
        <>
          <section
            className="dashboard-stats-grid"
            aria-label="Learning overview"
          >
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon dashboard-stat-blue">
                <BookOpen size={22} aria-hidden="true" />
              </span>
              <p className="dashboard-stat-label">My course</p>
              <strong className="dashboard-stat-value">1</strong>
              <span className="dashboard-stat-note">Selected pathway</span>
            </article>

            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon dashboard-stat-teal">
                <CheckCircle2 size={22} aria-hidden="true" />
              </span>
              <p className="dashboard-stat-label">Tasks completed</p>
              <strong className="dashboard-stat-value">{completed}</strong>
              <span className="dashboard-stat-note">Out of {totalTasks} tasks</span>
            </article>

            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon dashboard-stat-orange">
                <Clock3 size={22} aria-hidden="true" />
              </span>
              <p className="dashboard-stat-label">Tasks remaining</p>
              <strong className="dashboard-stat-value">{remaining}</strong>
              <span className="dashboard-stat-note">
                {remaining === 0 ? "Course tasks completed" : "Ready when you are"}
              </span>
            </article>
          </section>

          <section
            className="dashboard-section dashboard-course-section"
            aria-labelledby="course-heading"
          >
            <div className="dashboard-section-heading">
              <div>
                <p className="dashboard-eyebrow">YOUR LEARNING</p>
                <h2 id="course-heading">My course</h2>
              </div>
              <span className="dashboard-pilot-label">
                {pathway.status === "pilot" ? "Pilot project" : "In progress"}
              </span>
            </div>

            <article className="dashboard-pathway-card">
              <div className="dashboard-pathway-banner">
                <div className="dashboard-card-icon" aria-hidden="true">
                  <BookOpen size={28} />
                </div>
                <div>
                  <p className="dashboard-pathway-category">
                    {pathway.category}
                  </p>
                  <h3>{pathway.title}</h3>
                  <p>{pathway.description}</p>
                  <div className="dashboard-course-meta">
                    <span><Clock3 size={15} aria-hidden="true" /> Four weeks</span>
                    <span><ListChecks size={15} aria-hidden="true" /> {totalTasks} activities</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-progress-area">
                <div className="dashboard-progress-heading">
                  <div>
                    <span className="dashboard-progress-label">
                      OVERALL PROGRESS
                    </span>
                    <p>{completed} of {totalTasks} tasks completed</p>
                  </div>
                  <strong className="dashboard-progress-percentage">
                    {percentage}%
                  </strong>
                </div>

                <progress
                  className="dashboard-progress-bar"
                  value={completed}
                  max={totalTasks || 1}
                  aria-label={`${percentage}% of course tasks completed`}
                />

                <p className="dashboard-progress-footnote">
                  {remaining === 0
                    ? "You've completed every task in this pathway."
                    : `${remaining} ${remaining === 1 ? "task" : "tasks"} left in your learning plan.`}
                </p>
              </div>

              <div className="dashboard-outcome">
                <CheckCircle2 size={19} aria-hidden="true" />
                <p>
                  <strong>Course outcome</strong>
                  <span>{pathway.outcome}</span>
                </p>
              </div>

              <div className="dashboard-pathway-actions">
                <Link
                  className="dashboard-primary-link"
                  to={`/learning-journey?pathway=${encodeURIComponent(pathway.id)}`}
                >
                  Continue learning
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  className="dashboard-secondary-link"
                  to={`/onboarding?pathway=${encodeURIComponent(pathway.id)}`}
                >
                  Learner details
                </Link>
              </div>
            </article>
          </section>

          <section
            className="dashboard-next-task"
            aria-labelledby="next-task-heading"
          >
            <div className="dashboard-next-task-icon" aria-hidden="true">
              {remaining === 0
                ? <CheckCircle2 size={26} />
                : <CirclePlay size={26} />}
            </div>

            <div className="dashboard-next-task-content">
              <p className="dashboard-eyebrow">
                {remaining === 0 ? "COURSE COMPLETE" : "UP NEXT"}
              </p>
              <h2 id="next-task-heading">
                {remaining === 0
                  ? "You've reached your course goal."
                  : nextActivity?.awaitingReview
                    ? "Your task is awaiting review"
                    : nextActivity?.title || "Continue your learning"}
              </h2>
              <p>
                {remaining === 0
                  ? "Your completed activities are recorded in this browser."
                  : nextActivity?.awaitingReview
                    ? "This activity has been submitted for review. Check your learning journey for its status."
                    : nextActivity
                      ? `${nextActivity.weekTitle}: ${nextActivity.description}`
                      : "Open your learning journey to see your available activities."}
              </p>
              <Link
                className="dashboard-primary-link"
                to={`/learning-journey?pathway=${encodeURIComponent(pathway.id)}`}
              >
                {remaining === 0 ? "Review course activities" : "Open learning activity"}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section
            className="dashboard-section dashboard-outline-section"
            aria-labelledby="outline-heading"
          >
            <div className="dashboard-section-heading">
              <div>
                <p className="dashboard-eyebrow">YOUR PLAN</p>
                <h2 id="outline-heading">Course outline</h2>
              </div>
              <Link
                className="dashboard-outline-link"
                to={`/learning-journey?pathway=${encodeURIComponent(pathway.id)}`}
              >
                View all activities <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="dashboard-week-list">
              {pathway.weeks.map((week, index) => {
                const status = progress
                  ? getWeekStatus(pathway, progress, index)
                  : "locked";

                return (
                  <article className="dashboard-week-item" key={week.id}>
                    <span className={`dashboard-week-number dashboard-week-${status}`}>
                      {status === "complete"
                        ? <CheckCircle2 size={20} aria-label="Complete" />
                        : String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="dashboard-week-copy">
                      <h3>{week.title}</h3>
                      <p>{week.objective}</p>
                      <span>{week.tasks.length} activities</span>
                    </div>
                    <span className={`dashboard-week-status dashboard-status-${status}`}>
                      {status === "complete"
                        ? "Completed"
                        : status === "locked"
                          ? "Locked"
                          : status === "review"
                            ? "Under review"
                            : "Available"}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="dashboard-section" aria-labelledby="journey-heading">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">YOUR LEARNING</p>
              <h2 id="journey-heading">Choose your learning pathway</h2>
            </div>
          </div>

          <article className="dashboard-empty-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              <Compass size={28} />
            </div>
            <div>
              <h3>Find a skill you want to build.</h3>
              <p>
                Explore the available pathway and choose a starting point
                that connects with your interests.
              </p>
              <Link className="dashboard-primary-link" to="/explore">
                Explore learning pathways
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </article>
        </section>
      )}
    </main>
  );
}
