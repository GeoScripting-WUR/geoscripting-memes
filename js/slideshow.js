let memes = {};
let currentTheme = null;
let currentIndex = 0;
let interval = null;
let playing = true;
let intervalTime = 30000; // Default 30 seconds

async function loadMemes() {
  const response = await fetch('memes.json');
  memes = await response.json();

  const selector = document.getElementById('themeSelector');
  selector.innerHTML = '';
  Object.keys(memes).forEach(theme => {
    let option = document.createElement('option');
    option.value = theme;
    option.textContent = theme;
    selector.appendChild(option);
  });

  selector.addEventListener('change', () => {
    currentTheme = selector.value;
    currentIndex = 0;
    showMeme();
  });

  currentTheme = Object.keys(memes)[0];
  selector.value = currentTheme;
  showMeme();
  startSlideshow();
}

function showMeme() {
  if (!currentTheme || memes[currentTheme].length === 0) return;
  const img = document.getElementById('memeImage');
  img.src = memes[currentTheme][currentIndex];
}

function nextMeme() {
  if (!currentTheme) return;
  currentIndex = (currentIndex + 1) % memes[currentTheme].length;
  showMeme();
}

function prevMeme() {
  if (!currentTheme) return;
  currentIndex = (currentIndex - 1 + memes[currentTheme].length) % memes[currentTheme].length;
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
