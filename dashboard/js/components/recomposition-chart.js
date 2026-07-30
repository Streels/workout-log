import { dateFormatter, escapeHtml, parseIsoDate } from "../utils.js";

const METRICS = Object.freeze({
  weightKg: { label: "Вес", unit: "кг", color: "#79d7b1", minimumRange: 2 },
  bodyFatPercent: { label: "Жир", unit: "%", color: "#e3b86d", minimumRange: 1 },
  waistCm: { label: "Талия", unit: "см", color: "#92b9ee", minimumRange: 2 },
});

export class RecompositionChart {
  constructor({ buttonsRoot, chartRoot, noteRoot, lastMeasurementRoot }) {
    this.buttonsRoot = buttonsRoot;
    this.chartRoot = chartRoot;
    this.noteRoot = noteRoot;
    this.lastMeasurementRoot = lastMeasurementRoot;
    this.measurements = [];
  }

  render(measurements = [], error = null) {
    if (error || !measurements.length) {
      const message = error ? "Не удалось загрузить замеры." : "Пока нет замеров.";
      this.buttonsRoot.replaceChildren();
      this.chartRoot.innerHTML = `<p class="muted">${message}</p>`;
      this.noteRoot.textContent = "";
      this.lastMeasurementRoot.innerHTML = `<h2>Последний замер</h2><p class="muted">${message}</p>`;
      return;
    }

    this.measurements = [...measurements].sort((left, right) => left.date.localeCompare(right.date));
    this.#renderButtons();
    this.#renderLastMeasurement();
    this.#renderMetric("weightKg");
  }

  #renderButtons() {
    this.buttonsRoot.innerHTML = Object.entries(METRICS)
      .map(
        ([key, metric], index) => `
          <button class="metric-button ${index === 0 ? "active" : ""}" type="button" data-metric="${key}">
            ${metric.label}
          </button>
        `,
      )
      .join("");

    this.buttonsRoot.addEventListener("click", (event) => {
      const button = event.target.closest("[data-metric]");
      if (!button) return;
      this.buttonsRoot
        .querySelectorAll("[data-metric]")
        .forEach((item) => item.classList.toggle("active", item === button));
      this.#renderMetric(button.dataset.metric);
    });
  }

  #renderLastMeasurement() {
    const last = this.measurements.at(-1);
    this.lastMeasurementRoot.innerHTML = `
      <h2>Последний замер · ${dateFormatter.format(parseIsoDate(last.date))}</h2>
      <table>
        <tr><td>Вес</td><td>${Number(last.weightKg).toFixed(1)} кг</td></tr>
        <tr><td>Жир</td><td>${Number(last.bodyFatPercent).toFixed(1)}%</td></tr>
        <tr><td>Талия</td><td>${escapeHtml(last.waistCm)} см</td></tr>
        <tr><td>Источник</td><td>${escapeHtml(last.source || "—")}</td></tr>
      </table>
    `;
  }

  #renderMetric(metricKey) {
    const metric = METRICS[metricKey];
    const points = this.measurements
      .filter((measurement) => Number.isFinite(Number(measurement[metricKey])))
      .map((measurement) => ({ ...measurement, value: Number(measurement[metricKey]) }));

    if (!points.length) {
      this.chartRoot.innerHTML = '<p class="muted">Для этой метрики пока нет данных.</p>';
      this.noteRoot.textContent = "";
      return;
    }

    const values = points.map(({ value }) => value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, metric.minimumRange);
    const lower = min - range * 0.45;
    const upper = max + range * 0.45;
    const xValues = points.map((_, index) =>
      points.length === 1 ? 300 : 48 + (index * 504) / (points.length - 1),
    );
    const yValues = values.map((value) => 12 + ((upper - value) / (upper - lower)) * 152);
    const path = xValues.map((x, index) => `${index ? "L" : "M"} ${x} ${yValues[index]}`).join(" ");

    this.chartRoot.innerHTML = `
      <svg class="chart" viewBox="0 0 600 200" role="img" aria-label="${metric.label}">
        <line class="gridline" x1="0" y1="12" x2="600" y2="12"></line>
        <line class="gridline" x1="0" y1="88" x2="600" y2="88"></line>
        <line class="gridline" x1="0" y1="164" x2="600" y2="164"></line>
        <text class="axis-label" x="1" y="9">${upper.toFixed(1)} ${metric.unit}</text>
        <text class="axis-label" x="1" y="185">${lower.toFixed(1)} ${metric.unit}</text>
        <path class="path" style="stroke:${metric.color}" d="${path}"></path>
        ${points
          .map(
            (point, index) => `
              <circle class="point" style="fill:${metric.color}" cx="${xValues[index]}" cy="${yValues[index]}" r="4"></circle>
              <text class="point-label" x="${xValues[index]}" y="${yValues[index] - 10}" text-anchor="middle">
                ${point.value.toFixed(1)} ${metric.unit}
              </text>
              <text class="axis-label" x="${xValues[index]}" y="198" text-anchor="middle">
                ${dateFormatter.format(parseIsoDate(point.date))}
              </text>
            `,
          )
          .join("")}
      </svg>
    `;

    this.noteRoot.textContent =
      points.length === 1
        ? "Первая контрольная точка. После следующего замера здесь появится линия динамики."
        : `Изменение от первой точки: ${(values.at(-1) - values[0]).toFixed(1)} ${metric.unit}.`;
  }
}
