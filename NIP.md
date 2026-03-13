# NIP: Vuelta al Mundo — Quiz Episodes

## Custom Event Kind: 37183 (Addressable Quiz Episode)

This application uses kind **37183** to publish interactive quiz episodes narrating the Magellan-Elcano circumnavigation (1519–1522), as told by Francisco de Albo, boatswain of the Trinidad.

---

## Historical Sources

All episode content is drawn exclusively from primary and verified secondary sources:

| Key | Source | Author | Period |
|-----|--------|--------|--------|
| `albo` | **Derrotero** | Francisco de Albo | c. 1519–1522 |
| `pigafetta` | **Relación del primer viaje alrededor del mundo** | Antonio Pigafetta | c. 1522–1525 |
| `mafra` | **Relación del viaje** | Ginés de Mafra | c. 1544 |
| `gomara` | **Historia General de las Indias** | Francisco López de Gómara | 1552 |
| `martinez` | **Compendio de las historias de la India Oriental** | José Martínez de la Puente | 1681 |
| `rutaelcano` | **rutaelcano.com** | Web resource | Current |

### Source descriptions

- **Derrotero de Francisco de Albo** — The technical navigation journal of the Trinidad's own pilot. Records latitudes, headings, soundings, and daily runs. The most precise nautical source of the entire expedition.
- **Relación de Antonio Pigafetta** — The Italian chronicler who voluntarily embarked on the expedition. His diary is the most complete and vivid source: it describes indigenous peoples, storms, mutinies, and the strait. Indispensable.
- **Relación de Ginés de Mafra** — A sailor who participated in the expedition and was captured in the Moluccas. Written decades later, his account provides unique details of the Trinidad's return voyage and the time spent on the islands.
- **Historia General de las Indias — Francisco López de Gómara (1552)** — Spanish chronicler and historian who, though he did not participate in the expedition, gathered direct testimonies and first-hand documents. His work offers a panoramic view of the discoveries, with a chapter on the Magellan-Elcano voyage of great historiographic value.
- **Compendio de las historias de la India Oriental — José Martínez de la Puente (1681)** — 17th-century synthesis work that compiles and cross-references the principal chronicles of expeditions to the East Indies, including Magellan-Elcano. Especially useful for contextualising events within the Spanish-Portuguese rivalry over the spice trade.
- **rutaelcano.com** — Reference website with historical cartography, detailed chronology, specialist bibliography, and up-to-date documentation on the entire expedition. Excellent for verifying dates and places.

---

## Event Schema

```json
{
  "kind": 37183,
  "content": "<narrative text of the episode in Spanish, first-person voice of Francisco de Albo>",
  "tags": [
    ["d", "<unique episode slug, e.g. 'ep-001-partida-sanlucar'>"],
    ["title", "<episode title>"],
    ["episode", "<episode number, e.g. '1'>"],
    ["date", "<historical date of the event, ISO 8601, e.g. '1519-09-20'>"],
    ["option_a", "<answer option A text>"],
    ["option_b", "<answer option B text>"],
    ["option_c", "<answer option C text>"],
    ["option_d", "<answer option D text>"],
    ["answer", "<correct answer letter: a, b, c, or d>"],
    ["answer_explanation", "<explanation of why the answer is correct, may cite original sources>"],
    ["zap_amount", "<suggested zap amount in sats to answer, e.g. '21'>"],
    ["source", "<source key: albo | pigafetta | mafra | rutaelcano>"],
    ["t", "vuelta-al-mundo"],
    ["alt", "Episodio de quiz histórico sobre la primera circunnavegación del mundo (1519-1522)"]
  ]
}
```

## Required Tags

| Tag | Description |
|-----|-------------|
| `d` | Unique episode identifier (used for addressability) |
| `title` | Human-readable episode title |
| `episode` | Episode number (sequential integer as string) |
| `date` | Historical date of the episode's events (ISO 8601) |
| `option_a` – `option_d` | The four quiz answer options (only one is correct) |
| `answer` | The correct answer letter (`a`, `b`, `c`, or `d`) |
| `answer_explanation` | Explanation of the correct answer, revealed after the user responds |
| `t` | Must include `"vuelta-al-mundo"` for filtering |
| `alt` | NIP-31 human-readable description |

## Optional Tags

| Tag | Description |
|-----|-------------|
| `zap_amount` | Suggested bet amount in sats (default: 21) |
| `source` | Key of the primary historical source consulted: `albo`, `pigafetta`, `mafra`, `gomara`, `martinez`, or `rutaelcano` |
| `image` | URL to an illustration for the episode |

## Security Model

- Only events authored by the narrator's pubkey (`NARRATOR_PUBKEY`) are displayed
- The application filters all episode queries by `authors: [NARRATOR_PUBKEY]`
- This prevents any third party from injecting unauthorized quiz episodes

---

## Answer Events (Kind 1)

Users answer by publishing a **kind 1** note that:
- Tags the episode event with an `e` tag (event ID)
- Tags the episode with an `a` tag (addressable coordinate)
- Includes a `t` tag with `vuelta-al-mundo`
- Includes a `t` tag with `answer:<letter>` (e.g., `answer:b`)

```json
{
  "kind": 1,
  "content": "Mi apuesta: B — <answer text> #vuelta-al-mundo",
  "tags": [
    ["e", "<episode event id>"],
    ["a", "37183:<narrator pubkey>:<d-tag>"],
    ["t", "vuelta-al-mundo"],
    ["t", "answer:b"]
  ]
}
```

After answering, the user is invited to zap the narrator as their "bet". The zap is voluntary but encouraged — it represents the user's stake on their chosen answer.

---

## Design Notes

- **Content fidelity**: Every episode fact must be verifiable in one of the four approved sources
- **Narrative voice**: Written in first person as Francisco de Albo, contramaestre of the Trinidad
- **Quiz design**: Three options must be plausible but false; one is historically documented as correct
- **Publishing cadence**: One episode every 2–3 days
- **Zap amount**: The `zap_amount` field suggests how many sats users should zap when answering
- **Episodes are ordered** by episode number (descending) so the most recent appears first
