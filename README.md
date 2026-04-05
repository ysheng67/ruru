# 🔨 Hammer Sandbox

A browser-based 2D physics sandbox. Swing a chained hammer at ragdoll humanoids seated in breakable wooden chairs. No objectives — just chaos.

---

## Controls

| Input | Action |
|---|---|
| Mouse | Swing the hammer |
| Hold `Space` | Slow motion |
| `R` | Reset the scene |

---

## How it works

The game is built entirely with the Canvas 2D API and the Web Audio API — no libraries, no build step.

### Physics
All simulation uses **Verlet integration** (`physics.js`). Every simulated object is a graph of `VP` (Verlet Point) nodes connected by `Con` (Constraint) edges. Each frame:
1. Nodes integrate their velocity implicitly from the position delta of the previous frame.
2. The solver iterates over constraints `ITERS` times, pushing nodes back toward their rest lengths.
3. If a constraint stretches past its `breakAt` threshold, it snaps permanently.

### Hammer
The chain (`rope.js`) is a line of `VP` nodes pinned at the cursor. The hammer head is a rigid extension of the last segment's direction — it has no nodes of its own, only derived geometry from `getHammerHead()`.

### Collision
`world.js` computes the hammer head's velocity each frame as the positional delta of its derived centre. If speed exceeds the minimum threshold (10 px/frame), a proximity check against every chair and ragdoll node fires. Impulse scales linearly with speed above the threshold.

### Destruction
Two tunable constants control durability, found at the top of each class constructor:

| File | Variable | Controls |
|---|---|---|
| `ragdoll.js` | `bf` | Torso / spine / shoulders |
| `ragdoll.js` | `lbf` | Arms and legs |
| `chair.js` | `bf` | Seat and cross-braces |
| `chair.js` | `lbf` | Legs and back post |

Higher = tougher. Set to `999` for purely elastic ragdolling with no dismemberment.

---

## File structure

```
hammer-sandbox/
├── index.html          Entry point
├── style.css           Global styles
│
└── js/
    ├── main.js         Game loop, input, rendering orchestration
    ├── config.js       Constants and shared helpers (FY, clamp, etc.)
    ├── state.js        Mutable shared state (mouse, timeScale, shake)
    ├── physics.js      VP (Verlet Point) and Con (Constraint) classes
    ├── rope.js         Chain simulation and hammer head geometry
    ├── chair.js        Breakable wooden chair
    ├── ragdoll.js      16-node humanoid ragdoll
    ├── particles.js    Debris/spark particles and impact flashes
    ├── audio.js        Procedural Web Audio sound effects
    ├── splatter.js     Persistent paint/blood decal canvas
    └── background.js   Pre-rendered room background and ambient dust
```

---

## Running locally

Because ES modules are used, the page must be served over HTTP (not opened as a `file://` URL).

```bash
# Python 3
python -m http.server 8080

# Node (npx)
npx serve .
```

Then open `http://localhost:8080`.
