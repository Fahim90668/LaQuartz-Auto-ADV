import { EmbedBuilder } from 'discord.js';

const BRAND_COLOR = 0xa020f0;
const SUCCESS_COLOR = 0x3ddc97;
const DANGER_COLOR = 0xff5c7a;
const WARNING_COLOR = 0xffb454;
const NEUTRAL_COLOR = 0x1a1425;

export function successEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(SUCCESS_COLOR)
    .setTitle(title)
    .setTimestamp(new Date());
  if (description) embed.setDescription(description);
  return embed;
}

export function errorEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(DANGER_COLOR)
    .setTitle(title)
    .setTimestamp(new Date());
  if (description) embed.setDescription(description);
  return embed;
}

export function warningEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(WARNING_COLOR)
    .setTitle(title)
    .setTimestamp(new Date());
  if (description) embed.setDescription(description);
  return embed;
}

export function brandEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(title)
    .setTimestamp(new Date());
  if (description) embed.setDescription(description);
  return embed;
}

export function neutralEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(NEUTRAL_COLOR)
    .setTitle(title)
    .setTimestamp(new Date());
  if (description) embed.setDescription(description);
  return embed;
}

export const Colors = {
  BRAND: BRAND_COLOR,
  SUCCESS: SUCCESS_COLOR,
  DANGER: DANGER_COLOR,
  WARNING: WARNING_COLOR,
  NEUTRAL: NEUTRAL_COLOR,
} as const;