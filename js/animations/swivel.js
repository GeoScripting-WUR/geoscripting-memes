// Swivel: the current meme rotates edge-on, then the next one rotates in.
export default {
  label: 'Swivel',

  // Animate the current meme out. Return an Animation (or a Promise).
  out(el) {
    return el.animate(
      [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(90deg)' }],
      { duration: 250, easing: 'ease-in', fill: 'forwards' }
    );
  },

  // Animate the new meme in. Return an Animation (or a Promise).
  in(el) {
    return el.animate(
      [{ transform: 'rotateY(-90deg)' }, { transform: 'rotateY(0deg)' }],
      { duration: 250, easing: 'ease-out' }
    );
  },
};
