# CLARA Prototype v0.1

A synthetic, deterministic operating-room dependency sandbox. Open the hosted site, or serve `dist` using `python3 -m http.server 8765 --directory dist` and visit http://localhost:8765. No installation or build required. Run checks with `node tests/sim.mjs`.

## Try it

1. Choose “Jump to first conflict” to see case B waiting at 08:20.
2. Select P-B or OR 2 to inspect the blocked resource.
3. Play at 15×, or use Next event. At 09:00, later cases begin waiting on rooms and dedicated staff.
4. Rewind or drag the clock to revisit any state. Set extra equipment hold to 0 to compare the baseline at the same clock time. Reset restores 08:00 and the default 30-minute hold.

Speed 1× means one simulated minute per real second. Slider edits pause and replay the scenario from the beginning to the selected time. No randomness or AI is used.

## Grounding

Reviewed the user-supplied Gemini meeting notes “30 min with Matt (Melinda Yormick)” dated October 19, 2026, plus all five supplied CLARA slide images. The conceptual basis is the world model and operational event flow described at 00:01:20–00:03:25 and 00:40:48–00:42:09, the deterministic/learning distinction at 00:52:53–00:55:38, and the slide illustrating an ultrasound conflict. The in-app Concept & assumptions panel provides these references and all modeling assumptions. Gemini notes may contain transcription errors. The app does not validate deck claims.

## Synthetic rules

08:00 is minute zero. A starts at 0, duration 45, ultrasound 15. B starts at 20, duration 40, ultrasound 20. C starts at 45, duration 35, ultrasound 20. The injected hold (0–60 minutes, default 30) extends both A's ultrasound use and A's total case duration. Ultrasound turnaround takes 5 minutes; equipment is reserved during this time. A/B/C are served in planned order. D/E/F use their predecessor's OR and dedicated team at planned times 60/75/95 and each lasts 35 minutes. Turnover takes 15 minutes. Recovery lasts 30 minutes and has unconstrained capacity, as does pre-op. Patient transfer time is zero. Each OR has three dedicated staff (S: surgeon, N: nurse, A: anesthesia). These are generic software resource constraints, not clinical readiness rules.

## Verification

Tests cover baseline starts, the 30-minute cascade, exclusive machine occupancy, room turnover constraints, equal-time release behavior, and deterministic replay/no future events for every minute from 08:00 to 11:30 across all 13 allowed conflict settings. The default hold results in 30-minute start delays for B–F (150 case-minutes in total); A starts on time and ends 30 minutes late. No predictions, interventions, notifications, clinical decisions, real patients or real hospital data are used.
