import { ACTIVITY_GOAL_PER_WEEK, ACTIVITY_WEEKS } from "../config.js";
import { escapeHtml, isoDate, mondayOf, parseIsoDate } from "../utils.js";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export class ActivityCalendar {
  constructor(root) {
    this.root = root;
  }

  render(workouts = [], activities = [], measurements = []) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentWeek = mondayOf(today);
    const firstWeek = new Date(currentWeek);
    firstWeek.setDate(firstWeek.getDate() - (ACTIVITY_WEEKS - 1) * 7);

    const completed = workouts.filter((workout) => workout.status === "completed");
    const workoutCounts = this.#countByDate(completed);
    const activitiesByDate = this.#groupByDate(activities);
    const measurementDates = new Set(measurements.map(({ date }) => date));
    const activeWeekCounts = this.#activeWeekCounts(completed, activities);
    const monthPrefix = isoDate(today).slice(0, 7);
    const monthCount = completed.filter(({ date }) => date.startsWith(monthPrefix)).length;
    const streak = this.#streak(currentWeek, activeWeekCounts);

    this.root.innerHTML = `
      <div class="activity-head">
        <div>
          <h2>График активности · ${ACTIVITY_WEEKS} недель</h2>
          <div class="muted">Зелёный — тренировка, синий — другая активность, оранжевый — замер формы.</div>
        </div>
        <div class="activity-summary">
          <span class="pill">${monthCount} трен. в этом месяце</span>
          <span class="pill">цель: ${ACTIVITY_GOAL_PER_WEEK} в неделю</span>
          <span class="pill">серия активных недель: ${streak || "—"}</span>
        </div>
      </div>
      <div class="calendar">${this.#calendarCells(
        firstWeek,
        today,
        workoutCounts,
        activitiesByDate,
        measurementDates,
      )}</div>
      <div class="legend">
        <span><i class="workout-mark"></i>тренировка</span>
        <span><i class="activity-mark"></i>другая активность</span>
        <span><i class="measurement-mark"></i>замер формы</span>
        <span><i></i>отдых</span>
      </div>
    `;
  }

  #calendarCells(firstWeek, today, workoutCounts, activitiesByDate, measurementDates) {
    const cells = [
      "<div></div>",
      ...WEEKDAYS.map((weekday) => `<div class="dow">${weekday}</div>`),
    ];

    for (let weekIndex = 0; weekIndex < ACTIVITY_WEEKS; weekIndex += 1) {
      const monday = new Date(firstWeek);
      monday.setDate(firstWeek.getDate() + weekIndex * 7);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      cells.push(`<div class="week">${this.#weekLabel(monday, sunday)}</div>`);

      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + dayIndex);
        const key = isoDate(date);
        const workoutCount = workoutCounts[key] ?? 0;
        const dayActivities = activitiesByDate[key] ?? [];
        const hasMeasurement = measurementDates.has(key);
        const events = [
          workoutCount ? `тренировка${workoutCount > 1 ? `: ${workoutCount}` : ""}` : null,
          ...dayActivities.map(({ type }) => type),
          hasMeasurement ? "замер формы" : null,
        ].filter(Boolean);
        const label = `${key}: ${events.join(" · ") || "отдых"}`;
        const classes = [
          "day",
          workoutCount ? "workout" : "",
          dayActivities.length ? "other-activity" : "",
          hasMeasurement ? "measurement" : "",
          key === isoDate(today) ? "today" : "",
        ]
          .filter(Boolean)
          .join(" ");

        cells.push(
          `<div class="${classes}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"></div>`,
        );
      }
    }

    return cells.join("");
  }

  #countByDate(items) {
    return items.reduce((counts, { date }) => {
      counts[date] = (counts[date] ?? 0) + 1;
      return counts;
    }, {});
  }

  #groupByDate(items) {
    return items.reduce((groups, item) => {
      groups[item.date] = [...(groups[item.date] ?? []), item];
      return groups;
    }, {});
  }

  #activeWeekCounts(workouts, activities) {
    const uniqueDates = new Set([
      ...workouts.map(({ date }) => date),
      ...activities.map(({ date }) => date),
    ]);

    return [...uniqueDates].reduce((counts, date) => {
      const week = isoDate(mondayOf(parseIsoDate(date)));
      counts[week] = (counts[week] ?? 0) + 1;
      return counts;
    }, {});
  }

  #streak(currentWeek, activeWeekCounts) {
    let streak = 0;
    const week = new Date(currentWeek);

    // The current week is still in progress, so missing its goal must not erase
    // the streak already earned in previous completed weeks.
    if ((activeWeekCounts[isoDate(week)] ?? 0) < ACTIVITY_GOAL_PER_WEEK) {
      week.setDate(week.getDate() - 7);
    }

    while ((activeWeekCounts[isoDate(week)] ?? 0) >= ACTIVITY_GOAL_PER_WEEK) {
      streak += 1;
      week.setDate(week.getDate() - 7);
    }

    return streak;
  }

  #weekLabel(monday, sunday) {
    const short = (date) =>
      `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
    return `${short(monday)}–${short(sunday)}`;
  }
}
