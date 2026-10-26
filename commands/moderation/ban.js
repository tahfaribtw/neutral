import { registerConfirmedAction } from './_shared.js';

export function setup(bot) {
  registerConfirmedAction(bot, 'ban');
}