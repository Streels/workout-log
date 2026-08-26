import { DATA_URLS } from "./config.js?v=20260826";

const OVERLAY_URL = new URL("../../data/dashboard-overlay.json", import.meta.url);

export class DataService {
  async loadDashboard() {
    const sources = {
      workouts: [DATA_URLS.workouts, "workouts"],
      activities: [DATA_URLS.activities, "activities"],
      measurements: [DATA_URLS.measurements, "measurements"],
    };

    const [entries, overlay] = await Promise.all([
      Promise.all(
        Object.entries(sources).map(async ([name, [url, key]]) => {
          try {
            const json = await this.#fetchJson(url);
            return [name, Array.isArray(json[key]) ? json[key] : [], null];
          } catch (error) {
            return [name, [], error];
          }
        }),
      ),
      this.#loadOverlay(),
    ]);

    const result = entries.reduce(
      (acc, [name, data, error]) => {
        acc.data[name] = data;
        if (error) acc.errors[name] = error;
        return acc;
      },
      { data: {}, errors: {} },
    );

    result.data.workouts = this.#mergeByKey(
      result.data.workouts,
      overlay.workouts,
      (item) => `${item.date}|${item.title ?? ""}`,
    );
    result.data.activities = this.#mergeByKey(
      result.data.activities,
      overlay.activities,
      (item) => `${item.date}|${item.type ?? ""}|${item.title ?? ""}`,
    );

    return result;
  }

  async loadQuotes() {
    const json = await this.#fetchJson(DATA_URLS.quotes);
    return Array.isArray(json.quotes) ? json.quotes : [];
  }

  async #loadOverlay() {
    try {
      const json = await this.#fetchJson(OVERLAY_URL);
      return {
        workouts: Array.isArray(json.workouts) ? json.workouts : [],
        activities: Array.isArray(json.activities) ? json.activities : [],
      };
    } catch (error) {
      console.warn("Не удалось загрузить dashboard-overlay.json:", error);
      return { workouts: [], activities: [] };
    }
  }

  #mergeByKey(base = [], overlay = [], keyOf) {
    const merged = new Map(base.map((item) => [keyOf(item), item]));
    overlay.forEach((item) => merged.set(keyOf(item), item));
    return [...merged.values()];
  }

  async #fetchJson(url) {
    const requestUrl = new URL(url);
    requestUrl.searchParams.set("v", Date.now().toString());

    const response = await fetch(requestUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}: ${url.pathname}`);
    }
    return response.json();
  }
}
