import { ActivityCalendar } from "./components/activity-calendar.js";
import { OverviewDashboard } from "./components/overview-dashboard.js";
import { QuoteRotator } from "./components/quote-rotator.js";
import { RecompositionChart } from "./components/recomposition-chart.js";
import { DataService } from "./data-service.js";

function initTabs() {
  const tabs = document.querySelectorAll("[data-tab]");
  const panels = document.querySelectorAll(".panel");

  tabs.forEach((button) => {
    button.addEventListener("click", () => {
      tabs.forEach((tab) => tab.classList.toggle("active", tab === button));
      panels.forEach((panel) => {
        panel.hidden = panel.id !== button.dataset.tab;
      });
    });
  });
}

async function initDashboard() {
  const dataService = new DataService();
  const overview = new OverviewDashboard(document.querySelector("#dashboard"));
  const activityCalendar = new ActivityCalendar(document.querySelector("#activity-calendar"));
  const recomposition = new RecompositionChart({
    buttonsRoot: document.querySelector("#metric-buttons"),
    chartRoot: document.querySelector("#recomp-chart"),
    noteRoot: document.querySelector("#chart-note"),
    lastMeasurementRoot: document.querySelector("#last-measurement"),
  });
  const quoteRotator = new QuoteRotator({
    textRoot: document.querySelector("#quote-text"),
    sourceRoot: document.querySelector("#quote-source"),
    refreshButton: document.querySelector("#quote-refresh"),
  });

  initTabs();

  const dashboardPromise = dataService.loadDashboard().then(({ data, errors }) => {
    overview.render(data.workouts, data.activities, errors.workouts);
    activityCalendar.render(data.workouts, data.activities, data.measurements);
    recomposition.render(data.measurements, errors.measurements);

    if (Object.keys(errors).length) {
      console.warn("Некоторые источники данных не загрузились:", errors);
    }
  });

  const quotesPromise = dataService
    .loadQuotes()
    .then((quotes) => quoteRotator.render(quotes))
    .catch(() => quoteRotator.showError());

  await Promise.allSettled([dashboardPromise, quotesPromise]);
}

initDashboard().catch((error) => {
  console.error("Не удалось инициализировать дашборд:", error);
  document.querySelector("#dashboard").innerHTML =
    '<p class="error">Не удалось запустить дашборд.</p>';
});
