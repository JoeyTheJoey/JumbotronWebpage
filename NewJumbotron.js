document.addEventListener('DOMContentLoaded', function () {

    let audioPlayedOnLoad = false; // Flag to track if audio has been played on page load

    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', function() {
            main();
            setInterval(main, 1000); // Assuming 'main' manages timers and other logic
            this.style.display = 'none'; // Hide button after clicking
        });
    }

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

    function playShortestTimerAudio() {
        const localSchedule = convertScheduleToLocalTime(etSchedule);
        const resetTimes = getNextResetTimes(localSchedule);

        // Find the color with the shortest remaining time
        const shortestTimeColor = resetTimes[0].color;
        const shortestTimeAudio = document.getElementById(`audio-${shortestTimeColor}`);
        const endingAudio = document.getElementById('audio-ending');

        if (shortestTimeAudio && endingAudio) {
            if (!audioPlayedOnLoad) {
                audioPlayedOnLoad = true; // Set the flag to true after playing audio on load
                return; // Don't play audio on load
            }
            shortestTimeAudio.play()
                .then(() => {
                    console.log(`Audio for ${shortestTimeColor} started playing.`);
                    // Setup onended event handler to play the ending audio after current audio finishes
                    shortestTimeAudio.onended = () => {
                        endingAudio.play()
                            .then(() => {
                                console.log("Ending audio started playing.");
                            })
                            .catch(error => {
                                console.error("Error playing ending audio:", error);
                            });
                    };
                })
                .catch(error => {
                    console.error("Error playing audio for color " + shortestTimeColor + ":", error);
                });
        } else {
            console.error("Audio elements not found for shortest time color.");
        }
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



    function updateProgressBars(resetTimes) {
        resetTimes.forEach((session, index) => {
            const progressBar = document.getElementById(`progress-bar-${index + 1}`);
            const timer = document.getElementById(`timer-${index + 1}`);
            const colorLabel = document.getElementById(`color-label-${index + 1}`);
            const audio = document.getElementById(`audio-${session.color}`);

            if (!progressBar || !timer || !colorLabel || !audio) return;

            const totalDuration = 45 * 60 * 1000; // 45 minutes in milliseconds
            let remainingTimeInMilliseconds = session.remainingTime;

            // Calculate the width percentage based on the remaining time
            let widthPercentage = 100 * remainingTimeInMilliseconds / totalDuration;
            progressBar.style.width = `${widthPercentage}%`;
            progressBar.className = `progress-bar background-${session.color}`;
            colorLabel.textContent = session.color.toUpperCase();

            const minutes = Math.floor(remainingTimeInMilliseconds / (60 * 1000));
            const seconds = Math.floor((remainingTimeInMilliseconds % (60 * 1000)) / 1000);
            timer.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            // Play audio if the progress bar reaches 0% and audio is not already playing
            if (widthPercentage <= 0 && audio.paused) {
                audio.play()
                    .then(() => {
                        console.log(`Audio for ${session.color} started playing.`);
                        // Setup onended event handler to play the ending audio after current audio finishes
                        audio.onended = () => {
                            const endingAudio = document.getElementById('audio-ending');
                            if (endingAudio && endingAudio.paused) {
                                endingAudio.play()
                                    .then(() => {
                                        console.log("Ending audio started playing.");
                                    })
                                    .catch(error => {
                                        console.error("Error playing ending audio:", error);
                                    });
                            }
                        };
                    })
                    .catch(error => {
                        console.error("Error playing audio for color " + session.color + ":", error);
                    });
            }
        });
    }

    function displayLocalTime() {
        const timeContainer = document.getElementById('local-time-container');
        if (!timeContainer) {
            console.warn("Time container not found.");
            return;
        }
        const now = new Date();
        // Convert hours to 12-hour format
        let hours = now.getHours() % 12 || 12;
        let minutes = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
        // Determine if it's AM or PM
        const meridiem = now.getHours() >= 12 ? 'PM' : 'AM';
        // Format time as hh:mm AM/PM
        const timeString = `${hours}:${minutes} ${meridiem}`;
        timeContainer.textContent = timeString; // Display time without any label
    }

    // Update time immediately and every minute
    displayLocalTime();
    setInterval(displayLocalTime, 60000); // Update every minute for accuracy


    function main() {
        const localSchedule = convertScheduleToLocalTime(etSchedule);
        const resetTimes = getNextResetTimes(localSchedule);
        updateProgressBars(resetTimes);

        // Check if any timer has expired
        const anyTimerExpired = resetTimes.some(session => session.remainingTime <= 0);

        // Play audio only if a timer has expired and audio hasn't been played on page load
        if (anyTimerExpired && !audioPlayedOnLoad) {
            const endingAudio = document.getElementById('audio-ending');
            if (endingAudio && endingAudio.paused) {
                endingAudio.play()
                    .then(() => {
                        console.log("Ending audio started playing.");
                    })
                    .catch(error => {
                        console.error("Error playing ending audio:", error);
                    });
            }
            audioPlayedOnLoad = true; // Set the flag to true after playing audio on load
        }
    }

    playShortestTimerAudio();
    setInterval(playShortestTimerAudio, 15 * 60 * 1000); // 15 minutes in milliseconds
});

