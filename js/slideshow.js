let memes = {};

let currentTheme = null;
let currentIndex = 0;
let interval = null;
let playing = true;
let intervalTime = 90000; // Default 90 seconds

let selectedFolders = []; // Will be set when memes are loaded
let slideshowMemes = [];

const GITHUB_REPO = 'GeoScripting-WUR/geoscripting-memes';
const GITHUB_BRANCH = 'main';
const MEME_DIR = 'memes';
const VIDEO_EXTENSIONS = ['.mp4'];
const MEDIA_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', ...VIDEO_EXTENSIONS];

const ANIMATION_DIR = 'js/animations';
const animations = {}; // id (file name) -> { label, out, in }

async function fetchRepoTree() {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1`;
  const response = await fetch(url);
  const data = await response.json();
  return data.tree;
}

function memesFromTree(tree) {
  const result = {};
  tree.forEach(entry => {
    if (entry.type !== 'blob' || !entry.path.startsWith(`${MEME_DIR}/`)) return;
    const ext = entry.path.slice(entry.path.lastIndexOf('.')).toLowerCase();
    if (!MEDIA_EXTENSIONS.includes(ext)) return;

    const rest = entry.path.slice(MEME_DIR.length + 1);
    const slashIndex = rest.indexOf('/');
    if (slashIndex === -1) return; // skip files directly in memes/, not in a theme folder

    const theme = rest.slice(0, slashIndex);
    if (!result[theme]) result[theme] = [];
    result[theme].push(entry.path);
  });

  Object.values(result).forEach(images => images.sort());
  return result;
}

// When served locally, a directory-listing server lets new animation files show up without pushing.
async function listAnimationFilesLocally() {
  if (!['localhost', '127.0.0.1', ''].includes(location.hostname)) return null;
  try {
    const response = await fetch(`${ANIMATION_DIR}/`);
    if (!response.ok) return null;
    const html = await response.text();
    const files = [...html.matchAll(/href="([^"?#]*\.js)"/gi)].map(m => decodeURIComponent(m[1].split('/').pop()));
    return files.length ? files : null;
  } catch (e) {
    return null;
  }
}

async function listAnimationFiles(tree) {
  const local = await listAnimationFilesLocally();
  if (local) return local;
  return tree
    .filter(e => e.type === 'blob' && e.path.startsWith(`${ANIMATION_DIR}/`) && e.path.endsWith('.js'))
    .map(e => e.path.slice(ANIMATION_DIR.length + 1))
    .filter(name => !name.includes('/'));
}

async function loadAnimations(tree) {
  let files = [];
  try {
    files = await listAnimationFiles(tree);
  } catch (e) {
    console.error('Could not list animations:', e);
  }

  await Promise.all(files.sort().map(async file => {
    try {
      const mod = await import(`./animations/${file}`);
      const anim = mod.default;
      if (!anim || typeof anim.out !== 'function' || typeof anim.in !== 'function') {
        throw new Error('default export needs out() and in() functions');
      }
      animations[file.replace(/\.js$/, '')] = anim;
    } catch (e) {
      console.error(`Skipping animation ${file}:`, e);
    }
  }));

  buildAnimationOptions();
}

function buildAnimationOptions() {
  let saved = null;
  try { saved = localStorage.getItem('animation'); } catch (e) { /* storage unavailable */ }
  const selected = saved === 'off' || animations[saved] ? saved : (animations.swivel ? 'swivel' : 'off');

  const options = [['off', 'Off'], ...Object.entries(animations).map(([id, a]) => [id, a.label || id])];
  const container = document.getElementById('animationOptions');
  container.innerHTML = '';
  options.forEach(([id, label]) => {
    const wrapper = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'animation';
    radio.value = id;
    radio.checked = id === selected;
    wrapper.appendChild(radio);
    wrapper.appendChild(document.createTextNode(label));
    container.appendChild(wrapper);
  });
}

async function loadMemes() {
  const tree = await fetchRepoTree();
  loadAnimations(tree);
  memes = memesFromTree(tree);
  console.log('Memes loaded:', memes);

  // Dynamically generate folder checkboxes in dialog
  const folderCheckboxes = document.getElementById('folderCheckboxes');
  folderCheckboxes.innerHTML = '';
  Object.keys(memes).forEach(theme => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'folder-checkbox';
    checkbox.value = theme;
    checkbox.checked = true;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(theme));
    folderCheckboxes.appendChild(label);
  });

  // Setup dialog controls
  const folderBtn = document.getElementById('folderBtn');
  const dialog = document.getElementById('folderDialog');
  const closeBtn = document.getElementById('closeDialog');
  const applyBtn = document.getElementById('applyFolders');

  // Open dialog
  folderBtn.addEventListener('click', () => {
    dialog.style.display = 'flex';
  });

  // Close dialog
  closeBtn.addEventListener('click', () => {
    dialog.style.display = 'none';
  });

  // Close on overlay click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.style.display = 'none';
    }
  });

  // Select All/None buttons
  const selectAllBtn = document.getElementById('selectAllBtn');
  const selectNoneBtn = document.getElementById('selectNoneBtn');

  if (selectAllBtn && selectNoneBtn) {
    selectAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Select All clicked');
      document.querySelectorAll('.folder-checkbox').forEach(cb => {
        cb.checked = true;
      });
    });

    selectNoneBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Select None clicked');
      document.querySelectorAll('.folder-checkbox').forEach(cb => {
        cb.checked = false;
      });
    });
  } else {
    console.error('Select All/None buttons not found!');
  }

  // Apply folder selection
  applyBtn.addEventListener('click', () => {
    selectedFolders = Array.from(document.querySelectorAll('.folder-checkbox:checked')).map(cb => cb.value);
    updateSlideshowMemes();
    currentIndex = 0;
    showMeme();
    dialog.style.display = 'none';
  });

  // Initialize selectedFolders with all available folders
  selectedFolders = Object.keys(memes);

  updateSlideshowMemes();
  showMeme();
  startSlideshow();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function updateSlideshowMemes() {
  // Combine memes from all selected folders
  slideshowMemes = [];
  selectedFolders.forEach(theme => {
    if (memes[theme]) {
      slideshowMemes = slideshowMemes.concat(memes[theme]);
    }
  });
  slideshowMemes = shuffleArray(slideshowMemes);
}

function getAnimation() {
  const checked = document.querySelector('input[name="animation"]:checked');
  return checked ? checked.value : 'off';
}

function activeMediaElement() {
  const video = document.getElementById('memeVideo');
  return video.style.display === 'block' ? video : document.getElementById('memeImage');
}

let transitionId = 0;

async function runAnimation(fn, el) {
  try {
    const result = fn(el);
    await (result && result.finished ? result.finished : result);
  } catch (e) {
    /* a cancelled or failing animation must not block the slideshow */
  }
}

// Run the selected animation: animate out, swap the meme, animate in.
async function transitionMeme() {
  const id = ++transitionId;
  const hasCurrent = document.getElementById('memeImage').getAttribute('src') || document.getElementById('memeVideo').getAttribute('src');
  if (!animations[getAnimation()] || !hasCurrent) {
    showMeme();
    return;
  }

  const anim = animations[getAnimation()];
  await runAnimation(anim.out, activeMediaElement());
  if (id !== transitionId) return; // superseded by a newer transition

  showMeme();
  const incoming = activeMediaElement();
  incoming.getAnimations().forEach(a => a.cancel());
  runAnimation(anim.in, incoming);
}

function showMeme() {
  if (slideshowMemes.length === 0) return;
  const path = slideshowMemes[currentIndex];
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
  const img = document.getElementById('memeImage');
  const video = document.getElementById('memeVideo');

  video.pause();
  [img, video].forEach(el => el.getAnimations().forEach(a => a.cancel()));

  if (VIDEO_EXTENSIONS.includes(ext)) {
    img.style.display = 'none';
    video.style.display = 'block';
    video.src = path;
    video.play();
  } else {
    video.removeAttribute('src');
    video.style.display = 'none';
    img.style.display = 'block';
    img.src = path;
  }
}

function nextMeme() {
  if (slideshowMemes.length === 0) return;
  currentIndex = (currentIndex + 1) % slideshowMemes.length;
  transitionMeme();
}

function prevMeme() {
  if (slideshowMemes.length === 0) return;
  currentIndex = (currentIndex - 1 + slideshowMemes.length) % slideshowMemes.length;
  transitionMeme();
}

function startSlideshow() {
  if (interval) clearInterval(interval);
  console.log('Starting slideshow with interval:', intervalTime, 'ms');
  interval = setInterval(nextMeme, intervalTime);
}

function togglePlayPause() {
  playing = !playing;
  const btn = document.getElementById('playPauseBtn');
  if (playing) {
    btn.textContent = '⏸';
    startSlideshow();
  } else {
    btn.textContent = '▶';
    clearInterval(interval);
  }
}

function setupAnimationDialog() {
  const dialog = document.getElementById('animationDialog');

  // Options are generated dynamically, so listen on the container.
  document.getElementById('animationOptions').addEventListener('change', (e) => {
    try { localStorage.setItem('animation', e.target.value); } catch (err) { /* ignore */ }
    dialog.style.display = 'none';
  });

  document.getElementById('animationBtn').addEventListener('click', () => {
    dialog.style.display = 'flex';
  });
  document.getElementById('closeAnimationDialog').addEventListener('click', () => {
    dialog.style.display = 'none';
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.style.display = 'none';
  });
}

function updateInterval() {
  const slider = document.getElementById('intervalSlider');
  const valueDisplay = document.getElementById('intervalValue');

  if (!slider || !valueDisplay) {
    console.error('Slider or value display elements not found!');
    return;
  }

  const newInterval = parseInt(slider.value) * 1000; // Convert to milliseconds

  console.log('Slider changed to:', slider.value, 'seconds (', newInterval, 'ms)');

  intervalTime = newInterval;
  valueDisplay.textContent = slider.value;

  // Restart slideshow with new interval if playing
  if (playing) {
    console.log('Restarting slideshow with new interval:', intervalTime);
    startSlideshow();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMemes();
  setupAnimationDialog();

  // Initialize the interval display
  const slider = document.getElementById('intervalSlider');
  const valueDisplay = document.getElementById('intervalValue');

  if (!slider || !valueDisplay) {
    console.error('Could not find slider or value display elements during initialization!');
    return;
  }

  intervalTime = parseInt(slider.value) * 1000;
  valueDisplay.textContent = slider.value;

  console.log('Initialized with slider value:', slider.value, 'intervalTime:', intervalTime);

  // Add event listeners
  document.getElementById('nextBtn').addEventListener('click', nextMeme);
  document.getElementById('prevBtn').addEventListener('click', prevMeme);
  document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
  document.getElementById('intervalSlider').addEventListener('input', updateInterval);
  document.getElementById('intervalSlider').addEventListener('change', updateInterval);

  console.log('DOM loaded, initial interval:', intervalTime);
});
