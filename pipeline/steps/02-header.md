# Step: the case header

The story's opening paragraphs are below. Say who narrates the story to the reader.

- A first-person narrator is a character: give them an entity id (short snake case, the surname if they have one:
  `hale`), their name as the page will use it in "Hale's own", and `kind: "first-person"`.
- An impersonal third-person narrator is `{"id": "narrator", "name": "the narrator", "kind": "third-person"}`.
- If the story has several narrators (a part told by another character), list each.

Also give `subtitle`: the page's name beside the title, "<name>'s timeline" for a first-person narrator, else
"the timeline".

Output one line: `{"narrators": [...], "subtitle": "..."}`.

## The story's opening

{{opening}}
