# AI Prompt History

These are the primary prompts I used while building the assignment. I mostly used AntiGravity coding assistant to review ideas, help with implementation, debug issues, and do a final review before submitting.

---

# Master Prompt

I'm starting a take-home assignment for a Crypto Price Tracker built with React + TypeScript.

Before we start coding, read the assignment and the mock websocket server carefully. I want to understand how the websocket channels work, what the payloads look like and what the reviewers are probably looking for.

My initial thoughts are:

* Keep the architecture simple and easy to explain.
* Separate websocket logic from UI.
* Avoid unnecessary libraries unless they solve a real problem.
* Use TypeScript properly from the beginning.
* Keep components small instead of ending up with one huge page.
* Think about performance while building instead of trying to optimize everything at the end.

Once you've gone through everything, help me come up with a clean project structure and an implementation plan. If you think any of my assumptions are wrong, tell me before we start writing code.

I started by attaching the assignment PDF

---

## Prompt 1

I think we should start with the websocket layer since almost everything depends on it.

My plan is to keep one place responsible for the socket connection and expose hooks like `useTicker`, `useOrderbook` and `useTrades` so the components don't need to know anything about websocket logic.

Can you review this approach first? If you think there's a cleaner structure, suggest it before we start building.

---

## Prompt 2

Can you go through the websocket server repo once?

I want to make sure I understand the available channels, payloads, subscribe/unsubscribe flow and update frequency before I wire everything together.

Point out anything that might cause issues later.

---

## Prompt 3

Before I create too many files, can you suggest a clean project structure?

I'm thinking something like:

* components
* hooks
* services
* pages
* types
* utils

Feels enough for this assignment. Let me know if you think I'm missing something or adding unnecessary folders.

---

## Prompt 4

Need another opinion on state management.

Favorites will go into localStorage.

Search can stay local.

Connection status might need to be shared.

I don't think this project needs Zustand but I'm not completely sure. Would Context be enough here?

---

## Prompt 5

Let's build the product list now.

Need live ticker updates, search and favorites.

If you notice a cleaner way while implementing it, feel free to change the structure instead of following my idea blindly.

---

## Prompt 6

Moving to the details page.

I don't want one huge component.

Let's split ticker, orderbook and recent trades into separate components and keep each one responsible for its own updates.

---

## Prompt 7

Working on the orderbook now.

Can we only few top like 10 rows and asks with depth bars.

I was planning to calculate cumulative depth every time new data comes in since it's only a few rows.

Is this correct or can we do it better way ?

---

## Prompt 8

The orderbook is working but I'm seeing more rerenders than I expected.

Can you review it and only optimize the places that actually matter?

Lets use React.memo carefully 

---

## Prompt 9

Extreme mode is making the UI struggle.

Can you review the update flow?

If batching updates or using `requestAnimationFrame` makes sense here, let's do that. Otherwise I'd rather keep it simple.

---

## Prompt 10

Need to double check the websocket lifecycle.

Please review subscribe, unsubscribe and cleanup.

I'm mainly worried about duplicate subscriptions when changing products.

---

## Prompt 11

Favorites are done using localStorage.

Do you think it's worth listening for the `storage` event as well so multiple tabs stay in sync?

---

## Prompt 12

React Strict Mode is reconnecting the websocket a lot while developing.

Product listing page updates only after details are loaded is it a strict mode issue ?

---

## Prompt 13

The stress test API is throwing a CORS error.

Can you check the mock server and update whatever is needed so it works locally?

---

## Prompt 14

The chart works but feels a bit basic.

Can we move it to a canvas implementation instead of SVG and keep it dependency free?

---

## Prompt 15

Only issue now is the chart starts almost empty because live data begins from the current tick.

Can we generate some fake historical candles so it looks more natural on first load?

---

## Prompt 16

Can we polish the chart a bit?

Need grid lines, labels and better spacing.

Also thinking about grouping incoming ticks into 5 second candles instead of rendering every tick.

---

## Prompt 17

Let's add dark mode before wrapping up.

Simple toggle in the header.

Remember the preference and fall back to the system theme on first load.

---

## Prompt 18

I think adding a couple of tests would be good.

Maybe one around the websocket manager and another for favorites.

Nothing complex, just enough to cover the important bits.

---

## Prompt 19

Can you review the TypeScript as well?

I moved files around a few times so I probably duplicated some interfaces.

Clean up anything that feels unnecessary.

---

## Prompt 20

Final pass before I submit.

Review the whole project like it's a GitHub PR.

Check the architecture, hooks, websocket lifecycle, performance, TypeScript and README.

If something feels over-engineered or missing, Let me know will review it.
