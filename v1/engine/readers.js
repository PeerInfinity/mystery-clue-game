// Who the reader is. Each background card (`bk.*` in thoughts.json) is marked for what a
// reader of 1892 and a modern reader know (`reader_1892`, `reader_modern`), and `maps` to the rules that hold it. A
// reader lacks a rule when a card mapping to it carries a mark that reader does not hold; the game then supplies it.

/** The availability marks a background card may carry. */
export const READER_MARKS = /^(yes|likely|partial|rare|period|specialist|racing public|racing-literate|needs the text's gloss)/;
/** The kinds of reader: which of a card's two marks speaks for them, and which marks they hold. "Partial" is lacking. */
export const READERS = {
    modern: { mark: 'reader_modern', holds: /^(yes|period)/ },
    1892: { mark: 'reader_1892', holds: /^(yes|likely|period)/ },
    racing: { mark: 'reader_1892', holds: /^(yes|likely|period|racing)/ },
};
export const READER_KINDS = ['modern', '1892', 'racing'];

/** The rules this kind of reader lacks: id → the background card that marks it. */
export function lackingRules(background, reader) {
    const r = READERS[reader];
    const out = new Map();
    if (!r) return out;
    for (const b of background ?? []) if (!r.holds.test(b[r.mark] ?? '')) for (const id of b.maps ?? []) out.set(id, b.id);
    return out;
}
