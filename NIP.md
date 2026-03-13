# NIP: Vuelta al Mundo — Quiz Episodes

## Custom Event Kind: 37183 (Addressable Quiz Episode)

This application uses kind **37183** to publish interactive quiz episodes narrating the Magellan-Elcano circumnavigation (1519–1522), as told by Francisco de Albo, boatswain of the Trinidad.

### Event Schema

```json
{
  "kind": 37183,
  "content": "<narrative text of the episode in Spanish>",
  "tags": [
    ["d", "<unique episode slug, e.g. 'ep-001-partida-sanlucar'>"],
    ["title", "<episode title>"],
    ["episode", "<episode number, e.g. '1'>"],
    ["date", "<historical date of the event, ISO 8601 or approximate, e.g. '1519-09-20'>"],
    ["option_a", "<answer option A text>"],
    ["option_b", "<answer option B text>"],
    ["option_c", "<answer option C text>"],
    ["option_d", "<answer option D text>"],
    ["answer", "<correct answer letter: a, b, c, or d>"],
    ["answer_explanation", "<explanation of why the answer is correct>"],
    ["zap_amount", "<suggested zap amount in sats to answer, e.g. '21'>"],
    ["t", "vuelta-al-mundo"],
    ["alt", "Episodio de quiz histórico sobre la primera circunnavegación del mundo (1519-1522)"]
  ]
}
```

### Required Tags

| Tag | Description |
|-----|-------------|
| `d` | Unique episode identifier (used for addressability) |
| `title` | Human-readable episode title |
| `episode` | Episode number (sequential integer as string) |
| `date` | Historical date of the episode's events |
| `option_a` – `option_d` | The four quiz answer options |
| `answer` | The correct answer letter (`a`, `b`, `c`, or `d`) |
| `answer_explanation` | Explanation revealed after the quiz closes |
| `t` | Must include `"vuelta-al-mundo"` for filtering |
| `alt` | NIP-31 human-readable description |

### Optional Tags

| Tag | Description |
|-----|-------------|
| `zap_amount` | Suggested bet amount in sats (default: 21) |
| `image` | URL to an illustration for the episode |

### Answer Events (Kind 1)

Users answer by publishing a **kind 1** note that:
- Tags the episode event with an `e` tag
- Tags the episode with an `a` tag (addressable reference)
- Includes a `t` tag with `vuelta-al-mundo`
- Includes a `t` tag with `answer:<letter>` (e.g., `answer:b`)
- Is accompanied by a zap to the episode author as the "bet"

```json
{
  "kind": 1,
  "content": "Mi respuesta: B — <user's reasoning>",
  "tags": [
    ["e", "<episode event id>"],
    ["a", "37183:<author pubkey>:<d-tag>"],
    ["t", "vuelta-al-mundo"],
    ["t", "answer:b"]
  ]
}
```

### Design Notes

- The `answer` tag is **hidden from the UI** until the episode's voting period closes (determined by a future timestamp or the author publishing a reveal)
- The `zap_amount` field suggests how many sats users should zap when answering
- Episodes are published periodically (every 2–3 days) by the narrator (Francisco de Albo)
- The app filters episodes by `t: vuelta-al-mundo` to show only expedition content
