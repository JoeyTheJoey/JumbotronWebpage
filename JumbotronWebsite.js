// Include moment and moment-timezone via CDN in your HTML for this to work.

// Set reference date in Eastern Time (this will handle EST/EDT automatically)
const referenceDate = moment.tz("2024-01-01 00:00:00", "America/New_York");

// Your countdown duration and color list remain unchanged
const countdownDuration = 15 * 60 * 1000;  // 15 minutes in milliseconds
const colorList = ['black', 'orange', 'silver', 'pink', 'blue', 'gold', 'purple', 'yellow', 'red', 'green'];
const audioCues = [
    'BLACK_TO_ORANGE.mp3',
    'ORANGE_TO_SILVER.mp3',
    'SILVER_TO_PINK.mp3',
    'PINK_TO_BLUE.mp3',
    'BLUE_TO_GOLD.mp3',
    'GOLD_TO_PURPLE.mp3',
    'PURPLE_TO_YELLOW.mp3',
    'YELLOW_TO_RED.mp3',
    'RED_TO_GREEN.mp3',
    'GREEN_TO_BLACK.mp3'
]

function formatTimeComponent(value) {
    return value < 10 ? `0${value}` : value;
}

function getCurrentColorIndex() {
    const now = moment.tz("America/New_York");
    const elapsedTime = now.diff(referenceDate);
    const totalIntervalsPassed = Math.floor(elapsedTime / countdownDuration);
    return totalIntervalsPassed % colorList.length;
}

function getPreviousColorIndex(currentIndex) {
    // If currentIndex is 0, wrap around to the last color in the list
    return currentIndex === 0 ? colorList.length - 1 : currentIndex - 1;
}

function getNextColorIndex(currentIndex) {
    return (currentIndex + 1) % colorList.length;
}

function updateCountdownDisplay(timeRemaining) {
    const minutes = Math.floor(timeRemaining / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    document.getElementById('countdown').textContent = `${formatTimeComponent(minutes)}:${formatTimeComponent(seconds)}`;
}

function updateCountdown() {
    const now = moment.tz("America/New_York");
    const elapsedTime = now.diff(referenceDate);
    const timeUntilNextChange = countdownDuration - (elapsedTime % countdownDuration);
    const currentColorIndex = getCurrentColorIndex();

    // Update the color box immediately
    const currentColor = colorList[currentColorIndex];
    const colorBox = document.getElementById('color-box');
    colorBox.className = 'background-' + currentColor;
    colorBox.textContent = currentColor.toUpperCase();

    const previousColorIndex = getPreviousColorIndex(currentColorIndex);
    const previousColor = colorList[previousColorIndex];
    // Update the previous color box
    const previousColorBox = document.getElementById('previous-color-box');
    previousColorBox.className = 'background-' + previousColor;
    previousColorBox.textContent = previousColor.toUpperCase();

    const nextColorIndex = getNextColorIndex(currentColorIndex);
    const nextColor = colorList[nextColorIndex];

     // Update the next color box
     const nextColorBox = document.getElementById('next-color-box');
     nextColorBox.className = 'background-' + nextColor; // This assumes you have background-color classes set up like your current color box
     nextColorBox.textContent = nextColor.toUpperCase();

    if (timeUntilNextChange <= 1000) {  // 1 second tolerance
        playResetSound();
        playAudioCue();  // Play the audio cue when the countdown resets
    }

    // Prevent negative display
    const timeRemaining = Math.max(timeUntilNextChange, 0);
    updateCountdownDisplay(timeRemaining);
}


function playResetSound() {
    const resetAudioElement = document.getElementById('reset-audio');
    resetAudioElement.currentTime = 0;
    resetAudioElement.play();
}

function playAudioCue() {
    const currentColorIndex = getCurrentColorIndex();

    // Check if the current color index is valid
    if (currentColorIndex >= 0 && currentColorIndex < colorList.length) {
        const audioCueId = `audio-cue-${colorList[currentColorIndex]}`;
        const audioCueElement = document.getElementById(audioCueId);

        if (audioCueElement) {
            audioCueElement.currentTime = 0;
            audioCueElement.play();
        }
    }
}

// Initial function calls
updateCountdown();
setInterval(updateCountdown, 1000);
//setInterval(playAudioCue, 900000);  // Play audio cue every 15 minutes
