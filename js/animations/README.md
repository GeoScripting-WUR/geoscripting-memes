# Adding an animation

Drop a single `.js` file in this folder — nothing else needs to change. It shows up
in the 🎞️ Animations menu automatically (after it is on the deployed branch).

The file must `export default` an object:

```js
export default {
  label: 'My animation',   // text in the menu (optional, defaults to the file name)
  out(el) { /* animate the current meme away; return an Animation or Promise */ },
  in(el)  { /* animate the new meme in; return an Animation or Promise */ },
};
```

`el` is the `<img>` or `<video>` element. Use `el.animate(...)` (Web Animations API)
and return its result; the slideshow swaps the meme between `out` and `in`.
`.meme-display` has `perspective` set, so 3D transforms work.

Testing locally: serve the repo with a static server that lists directories
(e.g. `python -m http.server`); new files here are then picked up without pushing.
