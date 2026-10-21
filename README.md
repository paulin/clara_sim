# CLARA Neurosurgery Resource Game v0.2

Live private site: https://clara-prototype-lab.paulin42.chatgpt.site

A deterministic operations game using fictional staffing, case requirements, durations and USD costs. No AI predictions, clinical decisions, mortality estimates, real patient data or validated staffing recommendations.

## Run locally

Serve `dist`: `python3 -m http.server 8765 --directory dist`, then open http://localhost:8765. No installation or build needed.

Checks: `node tests/game.mjs` and `node tests/sim.mjs`. The original v0.1 engine remains in `dist/sim.mjs` for regression/reference; the current game uses `dist/game-sim.mjs`.

## Play

Adjust on-duty staff and owned equipment with +/−. Expand the surgery editor to change resource quantities, duration, or the type assigned to each case. Setup changes pause and reset the clock; history is retained. Use Play/Next event/scrub to follow resources, or Run full day to score immediately. Last 10 scored runs and the setup persist in this browser. Load a previous run's setup to try it again. Best runs are compared only under identical requirements, case mix, conflict and cost rules.

Goal: finish all six cases by 16:00 with zero start delay, then minimize cost among setups tried. This does not prove global optimality or establish clinically safe minimum staffing. Removing requirements changes the game rather than demonstrating a better solution to the same challenge.

## Fictional day and constraints

Case A/OR1 08:10, B/OR2 08:30, C/OR3 08:50, D/OR1 10:10, E/OR2 10:30, F/OR3 10:50. Default alternating cranial tumor cases (90 min) and spinal decompression (75 min). Each defaults to one neurosurgeon, circulating nurse, anesthesia professional and scrub technologist. Cranial requires US ultrasound, MC microscope and NV navigation; spine requires MC only. These invented requirements are incomplete clinical lists.

Resources are shared pools. Dispatch reserves a complete set atomically, no earlier than plan minus 2 minutes, and only after earlier cases in that room complete 15-minute turnover. Blocked cases can be skipped to dispatch another due case. Every resource travels 2 minutes and must arrive before start. Staff are unavailable for 10 minutes after a case; S/T return to work spaces, N remains for 8 minutes then walks 2, A walks to recovery, remains 3 minutes and walks to the lounge. Equipment stays through case end except ultrasound (first 15 minutes). Equipment needs 3 minutes cleaning and 2 back to the hub; a subsequent dispatch adds another 2. Extra case-A hold extends A and its ultrasound use. Pre-op/recovery capacity is unconstrained, patient transfers instantaneous, and recovery takes 30 minutes. All motion follows replayable simulation time, including the monitors' activity animation.

## Fictional costs

Hourly pay per on-duty person: S $180, N $55, A $130, T $45. Staff are paid while idle. Eight-hour day, no payroll taxes/benefits/overtime modeled. Purchase / upkeep per operating day: US $60,000 / $20; MC $450,000 / $80; NV $250,000 / $50. These are invented game prices, not market estimates.

Daily mode allocates purchase over 1,250 operating days and accrues that daily share and upkeep proportionally to elapsed shift time. Full-purchase mode charges the whole inventory at time zero; upkeep still accrues. Default start delay penalty $25 per case-minute accumulates even for cases that never start. Default missed-case penalty $10,000 applies at 16:00 to every unfinished case, including those still in progress. It is a game consequence and does not represent death, patient harm, or the value of a life. No clinical outcomes are modeled.

Default 2 staff of each type and 1 of each machine: starts 08:10, 09:47, 11:09, 12:46, 14:08, 15:45; five completed by cutoff, one missed, 885 case-minutes delay, $39,443 total in default daily mode. A reference setup with 3 of each staff role, 3 microscopes, 2 ultrasound units and 2 navigation carts completes all cases on time for $11,796. This is a test fixture, not a clinical recommendation.

Blocked-start events are recorded once per case with an observed resource shortage at its due start. A late start is another event; movement counts should not be optimized as a safety proxy. The cost ledger and comparison table expose both late-case counts and delay minutes rather than implying all events have equivalent consequences.

## Concept and sources

Reviewed user-supplied Gemini notes “30 min with Matt (Melinda Yormick),” October 19, 2026, and all five CLARA slide images. Basis: hospital world model and operational event flow at 00:01:20–00:03:25 and 00:40:48–00:42:09; deterministic/learning distinction at 00:52:53–00:55:38; slide illustrating ultrasound conflict. Notes may contain transcription errors. The game does not validate deck claims.

Equipment categories only are grounded by ZEISS neurosurgical microscopy (https://www.zeiss.com/meditec/en/products/surgical-microscopes/neurosurgical-microscopes.html) and Medtronic neurosurgical imaging/navigation (https://www.medtronic.com/se-sv/healthcare-professionals/products/neurological/surgical-navigation-imaging/neurosurgery-imaging-surgical-navigation.html). These sources do not validate game requirements, durations, costs or staffing levels.
