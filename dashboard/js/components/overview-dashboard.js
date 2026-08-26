import { escapeHtml, latestByDate } from "../utils.js";

export class OverviewDashboard {
  constructor(root) {
    this.root = root;
  }

  render(workouts, activities, workoutsError = null) {
    if (workoutsError) {
      this.root.innerHTML = '<p class="error">Не удалось загрузить тренировки.</p>';
      return;
    }

    const completed = workouts.filter((workout) => workout.status === "completed");
    const lastWorkout = latestByDate(completed);
    const lastActivity = latestByDate(activities);

    this.root.innerHTML = [
      this.#summaryCard(completed.length, "тренировок"),
      this.#summaryCard(lastWorkout?.date ?? "—", "последняя тренировка"),
      this.#summaryCard(
        lastActivity?.durationMinutes != null ? `${lastActivity.durationMinutes} мин` : "—",
        "последняя активность",
      ),
      this.#summaryCard(
        lastActivity?.averageHeartRate != null ? `❤️ ${lastActivity.averageHeartRate}` : "—",
        "средний пульс активности",
      ),
      this.#workoutCard(lastWorkout),
      this.#activityCard(lastActivity),
    ].join("");
  }

  #summaryCard(value, label) {
    return `
      <article class="card">
        <div class="value">${escapeHtml(value)}</div>
        <div class="label">${escapeHtml(label)}</div>
      </article>
    `;
  }

  #workoutCard(workout) {
    if (!workout) {
      return '<article class="card wide"><h2>Последняя тренировка</h2><p class="muted">Пока нет данных.</p></article>';
    }

    const exercises = (workout.exercises ?? [])
      .slice(0, 6)
      .map(
        (exercise) => `
          <tr>
            <td>${escapeHtml(exercise.name)}</td>
            <td>${escapeHtml(exercise.load)} ${escapeHtml(exercise.reps)}</td>
          </tr>
        `,
      )
      .join("");

    return `
      <article class="card wide">
        <h2>Последняя тренировка</h2>
        <table>${exercises}</table>
      </article>
    `;
  }

  #activityCard(activity) {
    if (!activity) {
      return '<article class="card wide"><h2>Активность</h2><p class="muted">Пока нет данных.</p></article>';
    }

    const duration = activity.durationMinutes != null ? `${activity.durationMinutes} мин` : "—";
    const calories = activity.caloriesKcal != null ? `${activity.caloriesKcal} ккал` : "—";
    const heartRate =
      activity.averageHeartRate != null || activity.maximumHeartRate != null
        ? `${activity.averageHeartRate ?? "—"}/${activity.maximumHeartRate ?? "—"}`
        : "—";
    const recovery =
      activity.recoveryEstimateHours != null ? `${activity.recoveryEstimateHours} ч` : "—";

    return `
      <article class="card wide">
        <h2>Активность</h2>
        <table>
          <tr>
            <td>${escapeHtml(activity.title ?? activity.type)}</td>
            <td>${escapeHtml(duration)} · ${escapeHtml(calories)}</td>
          </tr>
          <tr>
            <td>Пульс</td>
            <td>${escapeHtml(heartRate)}</td>
          </tr>
          <tr>
            <td>Восстановление</td>
            <td>${escapeHtml(recovery)}</td>
          </tr>
        </table>
      </article>
    `;
  }
}
