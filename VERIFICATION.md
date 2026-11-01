# Verification — 2 November 2026 IST

## Implemented and exercised

`npm test`: **24/24 pass**. Movement and landing, fall recovery, tether constraint/reeling/release, physical opening crossing, encounter gates, spear range/facing/cooldown, dodge protection, bridge release, spitter cover, courtyard activation, boss armour/charge/stun/removal/damage, gate/escape/completion, escape retry, validated checkpoint restoration, dated challenge and ghost recording are covered. Added regressions cover raised stone sides and the optional lookout reached through actual walking/jumping inputs.

The complete integration route uses only normal simulation inputs. It does not teleport, change health, remove enemies or edit progression. The final tested run reaches stage 8 with **zero deaths in 3,478 fixed steps (57.97 simulated seconds)**. The automated driver knows the course and timings: this is reachability evidence, not a first-time player's completion-time estimate. The daily route finishes in 751 steps (12.52 simulated seconds) and records 107 ghost frames.

`npm run build`: TypeScript and Vite pass. The compiled main JS is approximately 6.54 MB raw / 1.46 MB gzip. All compiled assets total approximately 7.60 MB raw. Vite reports a large-chunk warning; this build includes Babylon's renderer and should be profiled on weaker devices before release.

## Browser evidence

Chrome was driven with Playwright CLI, with sound off throughout.

- **Input-driven full chapter in the rendered browser:** every stage reached, ending displayed, completed checkpoint written, no page errors. `output/browser-chapter.log`; screenshots `output/playwright/chapter-stage-1.png` through `chapter-stage-8.png`.
- **Actual keyboard input:** walk, attach, reel and release across the first gap in both development and compiled production builds; reached the terrace with 100 health. `output/production-smoke.log`.
- **Pause:** Escape freezes simulation time; the observed value stayed at 0.9166667 seconds across a one-second wait.
- **Persistence:** reload restores the counterweight checkpoint at z=101, leaves terrace creatures defeated, and resets the incomplete encounter appropriately.
- **Independent daily state:** a successful daily run leaves the story at stage 3. After reload, 107 saved ghost frames are loaded and the ghost actor is visible. `output/browser-persistence.log`, `daily-complete.png`, `daily-ghost.png`.
- **Production boundary:** `window.__game` is `undefined` in the compiled build. The production console contained only the Babylon initialisation message, with no errors during the opening-crossing smoke test.
- **Cloud unavailable state:** the camp dialog accurately says the backend is not connected; it does not falsely offer a successful sync.
- **Laptop layout:** inspected the production title screen at 1366×768; all visible menu buttons fit inside the viewport. Settings exposes sound as unchecked by default. This is a bounded desktop check, not mobile certification.

The complete browser route uses the development observation/step interface with rendering and UI event processing. The opening production smoke test uses real keyboard events without that interface. The former checks the whole route quickly; it does not replace a human playthrough or prove every keyboard mapping over the entire chapter.

## Defects found and fixed during verification

1. An overhead arch could occlude the camera near the first crossing. Camera-to-player obstruction checks now move the camera forward.
2. Raised ledges permitted walking beneath their stone slabs. Side collision now blocks the entry and leaves the ledge jumpable. A regression verifies this.
3. Overhead anchor labels disappeared above the viewport. They now appear as directional edge markers while reachable.
4. The final ending could trigger in mid-air. Completion now requires landing on the refuge.
5. Repeated sound toggles could connect the master output more than once. The connection is created once; audio remains opt-in. Audible quality was not assessed.
6. Old fast daily times could displace a new day's recordings. Retention is now bounded per recorded date.

## Repeat checks

Start the development server, then:

```powershell
npm test
npm run build
npx playwright-cli -s=last-tether open http://127.0.0.1:4173 --headed
npx playwright-cli -s=last-tether run-code --filename=tests/browser-chapter.js
npx playwright-cli -s=last-tether run-code --filename=tests/browser-persistence.js
```

Browser checks create/replace the test browser's own story save and personal daily records. Use a separate browser session from a real player's save. Screenshots suppress transient chapter-title text for inspection; gameplay progression is unchanged.

## Not established

Human enjoyment, first-play duration, commercial-quality visuals/animation, accessibility with diverse players, physical gamepads, mobile controls, weak-device performance, audible sound quality, live cloud transfers/RLS isolation/email delivery, a Vercel deployment, public rankings or multiplayer. No claims of these are made by the prototype. `supabase/SETUP.md` lists the required live backend checks.
