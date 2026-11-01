# Last Tether — The Broken Spillway

Working specification, 1 November 2026. An original solo chapter based on the design agreed in this chat. Target a desktop browser with keyboard/mouse and gamepad. Original procedural geometry and authored encounters; no purchased/generated media.

Implementation completed as a compact local prototype on 2 November 2026 IST. All six steps below were carried through; see `VERIFICATION.md` for 24 passing checks and browser evidence, `WALKTHROUGH.md` for the player experience, and `supabase/SETUP.md` for the prepared but unconnected cloud integration. Commercial polish, a 15–20 minute duration and human enjoyment remain unvalidated.

## Player promise

Kavi is a skilled routefinder learning to become a hunter. Reach the old floodgate, learn how to defeat the Slateback occupying it, and divert the surge away from the settlement. Movement, combat, and machinery share one tether tool. Progress should be earned through understanding, not damage-number grinding.

## Planned implementation sequence

1. Build a deterministic simulation and a continuous level with physical platforms, gravity, ground detection, jumping, tether constraint/reeling, spear attacks and dodge invulnerability.
2. Render a storm-worn alpine spillway with original character, creature, architecture and landscape meshes. Add third-person camera, directional light, mist, water and readable anchor markers.
3. Implement chapter encounters and progression: first crossing; two scrabblers; optional overlook; counterweight bridge; reefwing crossing; mixed courtyard with cargo trap; shortcut; Slateback; floodgate; escape; ending.
4. Add contextual onboarding, field journal, objective navigation, checkpoints, local saving/resume, pause/settings, gamepad, visual attack warnings and optional sound.
5. Add an explicitly local daily route with dated seed, best times, personal ghost recording/replay, and completion feedback. Keep online leaderboards/cloud saves out of the interface until actually connected.
6. Validate simulation rules and the complete chapter; exercise the rendered browser with real controls, inspect screenshots, check build/persistence/pause/retry and document limitations.

## Route and encounters

World advances along +Z. Height is measured at the player's feet. Checkpoints never respawn over a gap.

| Area | Z range | Play |
|---|---|---|
| Arrival / broken maintenance bridge | 0–38 | Learn movement, jump, tether and reeling; recovery shelf below first gap |
| Supply terrace | 38–64 | Scrabblers telegraph leap attacks; victory opens the route |
| Fork / lookout | 64–98 | Main route and optional elevated supply discovery |
| Counterweight | 98–128 | Attach to pin, reel it out, lower physical bridge |
| Exposed span | 128–160 | Swing across a second gap while a reefwing telegraphs dives |
| Station courtyard | 160–192 | Two scrabblers, elevated spitter, breakable cargo trap, checkpoint shortcut |
| Approach / arena | 192–270 | Read charge tell, bait Slateback into a support, pull armour, attack exposed flank |
| Floodgate escape | 270–330 | Release gate; run, jump and tether through escape route; reach safe overlook |

## Rules

- Fixed anchors pull the player; marked loose targets can be pulled after attaching.
- Spear strikes require range and facing. Dodging offers a short invulnerable window and a cooldown, not infinite protection.
- Enemy attacks have wind-up, commitment and recovery. Spitter attacks respect cover. Health, attack tells and critical information are visible without audio.
- Falls and death restore the current checkpoint. Completed earlier encounters stay completed; unfinished encounters reset coherently.
- Boss armour cannot be removed until a charge hits a support. Boss death unlocks the gate interaction. Gate release starts escape; completion requires reaching the lookout.
- Pause freezes simulation and challenge time. Hidden tabs auto-pause. Save only validated progression/checkpoints, not arbitrary airborne positions.
- Story progress and challenge results are separate. Reset is explicit. Failed runs do not overwrite a successful ghost.

## Controls

WASD / left stick move relative to camera; Space / A jump or release tether; Shift / B dodge; F or primary mouse / X spear; Q / RB attach or detach; R / LB hold to reel or pull; E / Y interact; mouse drag or right stick camera; C recenter; Escape / Start pause; J journal.

## Production boundary

The first release is a chapter prototype, not a commercial-quality campaign. Human enjoyment and a 15–20 minute first-play target require playtesting. No length claim should be inferred from automated completion. Cloud and public competitive features require a real configured backend and validation; local equivalents must be labelled accurately.
