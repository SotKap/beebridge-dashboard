# BeeBridge Dashboard Iteration Log

This file tracks visible product iterations of the BeeBridge web app. Use the commit IDs with GitHub Desktop History to show how the app changed over time.

## Current Direction

BeeBridge is a field monitoring dashboard for pollinator activity and local environmental conditions. The app should stay useful as a real tool, while the iteration history shows how the team improved the solution through testing and feedback.

## Versions

| Version | Commit | Change | Why it mattered |
| --- | --- | --- | --- |
| v0.1 | `50baa94` | Added UV light to the environment cards. | The dashboard started tracking a fuller set of environmental factors. |
| v0.2 | `65439d9` | Added live sensor charts. | Sensor values became easier to observe over time. |
| v0.3 | `bae1c0f` | Moved charts out of Home and into Analytics. | Home stayed focused on the live station view. |
| v0.4 | `de9f9b0` | Made tab switching more robust. | Navigation worked even if external scripts were slow or unavailable. |
| v0.5 | `184030f` | Added the pollinator Learn tab. | The app gained educational value without becoming a presentation. |
| v0.6 | `bab0847` | Added Greek content to Learn. | The outreach material became useful for Greek-speaking students and visitors. |
| v0.7 | `6b8aeaa` | Expanded Analytics with summary panels. | The first attempt made Analytics fuller, but it repeated too much from Home. |
| v0.8 | `d108014` | Changed Analytics to trends and patterns. | Analytics became more useful by interpreting recent samples instead of repeating live values. |
| v0.9 | `877a64d` | Added Field Journal. | The app now supports real field observations alongside sensor data. |

## How To Show Previous Versions

1. Open GitHub Desktop.
2. Go to the BeeBridge dashboard repository.
3. Open the History tab.
4. Select one of the commit IDs above.
5. Use the diff to explain what changed and why.

For a live demo of an older state, check out the commit locally, run the dashboard, then return to `main`.
