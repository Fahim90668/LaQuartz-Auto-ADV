# Design System

Dark-first. Purple/pink is **accent**, never background. Restraint = premium.

## Colors (CSS variables in `styles/tokens.css`)

### Surfaces
| Token | Hex |
|-------|-----|
| `--bg-canvas` | `#0A0710` |
| `--bg-surface` | `#120D1A` |
| `--bg-surface-2` | `#1A1425` |
| `--bg-surface-3` | `#241B33` |

### Borders
| Token | Hex |
|-------|-----|
| `--border-subtle` | `#2A2138` |
| `--border-strong` | `#3D2E52` |
| `--border-glow` | `#BF00FF33` |

### Text
| Token | Hex | Use |
|-------|-----|-----|
| `--text-primary` | `#F4EEFF` | Headings |
| `--text-secondary` | `#B8AEC9` | Body |
| `--text-tertiary` | `#7A6E8C` | Meta |
| `--text-disabled` | `#4D4259` | Disabled |

### Brand
| Token | Hex | Use |
|-------|-----|-----|
| `--brand-primary` | `#A020F0` | Primary buttons, links |
| `--brand-neon` | `#BF00FF` | Focus glow, active tabs |
| `--brand-pink` | `#E85BFF` | Hover accent |

### Semantic
| Token | Hex |
|-------|-----|
| `--success` | `#3DDC97` |
| `--warning` | `#FFB454` |
| `--danger` | `#FF5C7A` |
| `--info` | `#5BB8FF` |

### Gradients
```css
--grad-brand: linear-gradient(135deg, #A020F0 0%, #E85BFF 100%);
--grad-surface: linear-gradient(180deg, #120D1A 0%, #0A0710 100%);