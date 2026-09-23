# NUI Settings

The Settings page inside EasyAdmin's menu remembers your choices and stores them locally on your computer, so they apply to that machine and are still there the next time you open the menu. None of these settings are configured through server convars.

Open the menu and go to Settings to change any of them.

## Accessibility

### Font Size

Adjusts the text size across the whole menu with a slider.

- Range: 10 to 20 pixels
- Default: 12

### High Contrast

Boosts the color contrast of the menu for easier reading. Use the toggle to turn it on or off.

### UI Density

Controls how much space sits between the elements in the menu. The options are Cramped, Cozy, Default, Spacious and Airy, and the default is Default.

Choose Spacious or Airy if the menu feels cramped, or Cramped or Cozy to fit more on screen at once.

## Layout

### Sidebar Mode

Choose where the navigation sits. Each option shows a preview of the layout:

| Option | Layout |
|---|---|
| Left sidebar (default) | Navigation on the left, content opens to the right |
| Right sidebar | Navigation on the right, content opens to the left |
| Top taskbar | Navigation along the top, content opens downward |
| Bottom taskbar | Navigation along the bottom, content opens upward |

### Fold Opacity

Sets how see-through the menu becomes when it is folded into the background.

- Range: 10% to 100%
- Default: 85%

Lower values let more of the game show through while the menu is folded in. At 100% the menu stays fully solid.

### Window Position and Size

The menu remembers where you moved it and how you resized it.

- Default size: 1210 × 750 pixels
- First open: centered on the screen

## Data Refresh

The Data section pulls fresh information from the server without closing the menu:

- **Refresh ban list** — re-checks the ban list and clears out expired bans.
- **Refresh cached players** — reloads the list of players the server has seen.
- **Refresh permissions** — re-checks your own permissions, which is handy right after they were changed.

## Anonymous Mode

In the Privacy section, use the toggle to hide your admin name in moderation logs and Discord webhook messages for the actions you take.

Anonymous mode lasts for the current session only and turns off again when you leave the server. The option is only shown to admins with the `easyadmin.anon` permission.
