import type { SlashCommandOptionsOnlyBuilder } from 'discord.js';
import * as createCode from '../commands/create-code.js';
import * as destroyCode from '../commands/destroy-code.js';
import * as codeInfo from '../commands/code-info.js';
import * as stats from '../commands/stats.js';

export interface CommandHandler {
  data: SlashCommandOptionsOnlyBuilder;
  execute: (interaction: import('discord.js').ChatInputCommandInteraction) => Promise<void>;
}

const handlers: CommandHandler[] = [createCode, destroyCode, codeInfo, stats];

export function getCommands(): SlashCommandOptionsOnlyBuilder[] {
  return handlers.map((h) => h.data);
}

export function getHandler(name: string): CommandHandler | null {
  return handlers.find((h) => h.data.name === name) ?? null;
}

export function listCommandNames(): string[] {
  return handlers.map((h) => h.data.name);
}