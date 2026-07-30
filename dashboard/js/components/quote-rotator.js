export class QuoteRotator {
  constructor({ textRoot, sourceRoot, refreshButton }) {
    this.textRoot = textRoot;
    this.sourceRoot = sourceRoot;
    this.refreshButton = refreshButton;
    this.quotes = [];
    this.currentIndex = -1;
  }

  render(quotes) {
    this.quotes = quotes;
    if (!quotes.length) {
      this.#showUnavailable();
      return;
    }

    this.showNext();
    this.refreshButton.addEventListener("click", () => this.showNext());
  }

  showNext() {
    let nextIndex = Math.floor(Math.random() * this.quotes.length);
    if (nextIndex === this.currentIndex && this.quotes.length > 1) {
      nextIndex = (nextIndex + 1) % this.quotes.length;
    }

    this.currentIndex = nextIndex;
    const quote = this.quotes[nextIndex];
    this.textRoot.textContent = quote.text;
    this.sourceRoot.textContent = quote.source ?? "";
  }

  showError() {
    this.#showUnavailable();
  }

  #showUnavailable() {
    this.textRoot.textContent = "Цитаты временно недоступны.";
    this.sourceRoot.textContent = "";
    this.refreshButton.hidden = true;
  }
}
