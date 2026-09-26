import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

// jsdom has no layout; browser/native checks verify the resulting scroll position.
Element.prototype.scrollIntoView = () => {};

// jsdom has no top-layer dialogs; browser/native checks cover their real focus trap.
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
