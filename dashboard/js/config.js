export const DATA_URLS = Object.freeze({
  workouts: new URL("../../data/workouts.json", import.meta.url),
  activities: new URL("../../data/activity.json", import.meta.url),
  measurements: new URL("../../data/body-metrics.json", import.meta.url),
  quotes: new URL("../../data/quotes.json", import.meta.url),
});

export const ACTIVITY_GOAL_PER_WEEK = 2;
export const ACTIVITY_WEEKS = 12;
