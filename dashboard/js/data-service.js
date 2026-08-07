import { DATA_URLS } from "./config.js";

export class DataService {
  async loadDashboard() {
    const sources = {
      workouts: [DATA_URLS.workouts, "workouts"],
      activities: [DATA_URLS.activities, "activities"],
      measurements: [DATA_URLS.measurements, "measurements"],
    };

    const entries = await Promise.all(
      Object.entries(sources).map(async ([name, [url, key]]) => {
        try {
          const json = await this.#fetchJson(url);
          return [name, Array.isArray(json[key]) ? json[key] : [], null];
        } catch (error) {
          return [name, [], error];
        }
      }),
    );

    return entries.reduce(
      (result, [name, data, error]) => {
        result.data[name] = data;
        if (error) result.errors[name] = error;
        return result;
      },
      { data: {}, errors: {} },
    );
  }

  async loadQuotes() {
    const json = await this.#fetchJson(DATA_URLS.quotes);
    return Array.isArray(json.quotes) ? json.quotes : [];
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
