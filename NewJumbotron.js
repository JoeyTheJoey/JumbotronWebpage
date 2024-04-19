document.addEventListener('DOMContentLoaded', function () {

    if (typeof moment === "undefined" || typeof moment.tz === "undefined") {
        console.error("Moment.js or Moment-Timezone is not loaded.");
        return;
    }

    // Define the main function that sets up timers and checks periodically
    function main() {
        // Check if etSchedule is correctly loaded and formatted
        if (!Array.isArray(etSchedule) || !etSchedule.length) {
            console.error("Schedule data is not available or incorrect.");
            return;
        }
        const localSchedule = convertScheduleToLocalTime(etSchedule);
        const resetTimes = getNextResetTimes(localSchedule);
        updateProgressBars(resetTimes);
    }

    // Setup the audio enabling button
    const enableAudioButton = document.getElementById('enableAudioButton');
    if (enableAudioButton) {
        enableAudioButton.addEventListener('click', function() {
            // Play each audio element silently and pause immediately to satisfy autoplay policies
            document.querySelectorAll('audio').forEach(audio => {
                audio.play().then(() => {
                    audio.pause(); // Pause the audio after starting
                    audio.currentTime = 0; // Reset the audio position
                }).catch(error => {
                    console.error("Error initiating audio playback:", error);
                });
            });
            this.remove(); // Optionally remove the button after enabling audio
        });
    }

    scheduleAudioPlay();

    // Define your schedule in Eastern Time (ET) since the schedule provided is likely in local time
  const etSchedule = [
    { color: 'black', etTimes: ['10:30', '13:00', '15:30', '18:00', '20:30', '23:00'] },
    { color: 'orange', etTimes: ['10:45', '13:15', '15:45', '18:15', '20:45', '23:15'] },
    { color: 'silver', etTimes: ['11:00', '13:30', '16:00', '18:30', '21:00', '23:30'] },
    { color: 'pink', etTimes: ['11:15', '13:45', '16:15', '18:45', '21:15', '23:45'] },
    { color: 'blue', etTimes: ['11:30', '14:00', '16:30', '19:00', '21:30', '00:00'] },
    { color: 'gold', etTimes: ['11:45', '14:15', '16:45', '19:15', '21:45', '00:15'] },
    { color: 'purple', etTimes: ['12:00', '14:30', '17:00', '19:30', '22:00', '00:30'] },
    { color: 'yellow', etTimes: ['12:15', '14:45', '17:15', '19:45', '22:15', '00:45'] },
    { color: 'red', etTimes: ['12:30', '15:00', '17:30', '20:00', '22:30', '01:00'] },
    { color: 'green', etTimes: ['12:45', '15:15', '17:45', '20:15', '22:45', '01:15'] },
  ];

    // Load timezone data
    moment.tz.load({
        zones: [
          'America/New_York|EST EDT|50 40|0101|1Lz50 1zb0 Op0',
          'America/Chicago|CST CDT|60 50|0101|1Lz50 1zb0 Op0',
          'America/Los_Angeles|PST PDT|80 70|0101|1Lz50 1zb0 Op0'
        ],
        links: [
          'America/New_York|America/Toronto',
          'America/Chicago|America/Mexico_City',
          'America/Los_Angeles|America/Tijuana'
        ]
      });
    
      function convertScheduleToLocalTime(schedule) {
        const localTimeZone = moment.tz.guess();
        return schedule.map(session => ({
            color: session.color,
            times: session.etTimes.map(etTime =>
                moment.tz(etTime, 'HH:mm', 'America/New_York').tz(localTimeZone)
            )
        }));
    }

    function getNextResetTimes(localSchedule) {
        const now = moment();
        return localSchedule.map(session => {
            // Get times for today and clone them for tomorrow
            let timesToday = session.times.filter(time => time.isSameOrAfter(now));
            let timesTomorrow = session.times.map(time => time.clone().add(1, 'days'));
    
            // Combine today's and tomorrow's times
            let allTimes = timesToday.concat(timesTomorrow).filter(time => time.isSameOrAfter(now));
    
            // Find the next reset time
            let nextResetTime = allTimes.sort((a, b) => a.diff(b))[0];
    
            return {
                color: session.color,
                nextResetTime: nextResetTime,
                remainingTime: nextResetTime.diff(now)
            };
        }).sort((a, b) => a.remainingTime - b.remainingTime); // Sort sessions by the nearest upcoming event
    }
    
    let currentUrgentColor = '';
    let previousPlayedColor = '';

    function updateProgressBars(resetTimes) {
        // Sort reset times to find the three with the least remaining time
        resetTimes.sort((a, b) => a.remainingTime - b.remainingTime);
    
        // Update only the first three entries
        resetTimes.slice(0, 3).forEach((session, index) => {
            const progressBar = document.getElementById(`progress-bar-${index + 1}`);
            const timer = document.getElementById(`timer-${index + 1}`);
            const colorLabel = document.getElementById(`color-label-${index + 1}`);
    
            if (!progressBar || !timer || !colorLabel) {
                console.error("One or more elements couldn't be found for", session.color);
                return;
            }
    
            const totalDuration = 45 * 60 * 1000; // Each interval duration
            const remainingTimeInMilliseconds = session.remainingTime;
            const widthPercentage = 100 * (remainingTimeInMilliseconds / totalDuration);
    
            progressBar.style.width = `${widthPercentage}%`;
            progressBar.className = `progress-bar background-${session.color.toLowerCase()}`; // Ensures color classes are applied correctly
    
            colorLabel.textContent = session.color.toUpperCase();
            const minutes = Math.floor(remainingTimeInMilliseconds / (60 * 1000));
            const seconds = Math.floor((remainingTimeInMilliseconds % (60 * 1000)) / 1000);
            timer.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
            // Track the most urgent color for audio purposes
            if (index === 0) {  // Only update the currentUrgentColor for the most urgent entry
                currentUrgentColor = session.color.toLowerCase();
            }
        });
    }
    
     

    function timeUntilNextQuarterHour() {
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();
        let minutesToNextQuarterHour = 15 - (minutes % 15);
        if (minutesToNextQuarterHour === 15 && seconds === 0 && milliseconds === 0) {
            // It's exactly on the quarter hour, play immediately
            return 0;
        } else {
            // Calculate milliseconds until the next 15-minute mark
            let secondsToNextQuarterHour = (minutesToNextQuarterHour * 60) - seconds;
            let millisecondsToNextQuarterHour = (secondsToNextQuarterHour * 1000) - milliseconds;
            return millisecondsToNextQuarterHour;
        }
    }
    

    function playScheduledAudio() {
        // Define urgentAudio based on the current urgent color
        const urgentAudio = document.getElementById(`audio-${currentUrgentColor}`);
        
        if (urgentAudio && currentUrgentColor !== previousPlayedColor) {
            if (urgentAudio.paused) {
                urgentAudio.play().then(() => {
                    console.log(`Playing urgent audio for color: ${currentUrgentColor}`);
                    previousPlayedColor = currentUrgentColor; // Track last played color
                    urgentAudio.onended = () => playAudioEnding();
                }).catch(error => {
                    console.error(`Failed to play urgent audio for ${currentUrgentColor}:`, error);
                });
            }
        }
    }
    
    

    function playAudioEnding() {
        const audioEnding = document.getElementById('audio-ending');
        if (audioEnding) {
            audioEnding.play().then(() => {
                console.log("Audio ending playing successfully.");
            }).catch(error => {
                console.error("Failed to play audio-ending:", error);
            });
        } else {
            console.error("Audio-ending element not found.");
        }
    }

    function scheduleAudioPlay() {
        const firstDelay = timeUntilNextQuarterHour();
        setTimeout(() => {
            playScheduledAudio();
            // After playing the first time, set an interval to play every 15 minutes
            setInterval(playScheduledAudio, 15 * 60 * 1000);
        }, firstDelay);
    }

    let audioQueue = [];  // Queue to manage audio plays

function queueAudio(color) {
    if (!audioQueue.includes(color)) {
        audioQueue.push(color);
    }
    playNextInQueue();
}

function playNextInQueue() {
    if (audioQueue.length > 0 && !urgentAudio.isPlaying) {
        let nextAudioColor = audioQueue.shift();  // Get next color to play
        const nextAudio = document.getElementById(`audio-${nextAudioColor}`);
        if (nextAudio.paused) {
            nextAudio.play().then(() => {
                console.log(`Playing audio for color: ${nextAudioColor}`);
                nextAudio.onended = () => {
                    if (audioQueue.length > 0) {
                        playNextInQueue();  // Play next in queue after current ends
                    } else {
                        playAudioEnding();
                    }
                };
            }).catch(error => {
                console.error(`Failed to play audio for ${nextAudioColor}:`, error);
            });
        }
    }
}

    
    function displayLocalTime() {
        const now = new Date();
        const hours = now.getHours() % 12 || 12; // Adjust for 12-hour clock format
        const minutes = now.getMinutes();
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes; // Ensure double digits
        const meridiem = now.getHours() >= 12 ? 'PM' : 'AM';
    
        const timeContainer = document.getElementById('local-time-container');
        if (timeContainer) {
            timeContainer.textContent = `${hours}:${formattedMinutes} ${meridiem}`; // Update display
        } else {
            console.warn("Time container not found.");
        }
    }


// Update time immediately and every minute
displayLocalTime();
setInterval(displayLocalTime, 1000); // Update every second for accuracy

main();
setInterval(main, 1000);
});
