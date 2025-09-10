let memes = {};

let currentTheme = null;
let currentIndex = 0;
let interval = null;
let playing = true;
let intervalTime = 30000; // Default 30 seconds

let selectedFolders = []; // Will be set when memes are loaded
let slideshowMemes = [];

async function loadMemes() {
  const response = await fetch('memes.json');
  memes = await response.json();

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

function showMeme() {
  if (slideshowMemes.length === 0) return;
  const img = document.getElementById('memeImage');
  img.src = slideshowMemes[currentIndex];
}

function nextMeme() {
  if (slideshowMemes.length === 0) return;
  currentIndex = (currentIndex + 1) % slideshowMemes.length;
  showMeme();
}

function prevMeme() {
  if (slideshowMemes.length === 0) return;
  currentIndex = (currentIndex - 1 + slideshowMemes.length) % slideshowMemes.length;
  showMeme();
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
