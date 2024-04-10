// Include moment and moment-timezone via CDN for this to work.

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
  
  function convertScheduleToLocalTime(etSchedule) {
    // Determine the local timezone of the user's browser
    const localTimeZone = moment.tz.guess();
  
    // Convert each ET time in the schedule to the local time
    return etSchedule.map(session => ({
      color: session.color,
      times: session.etTimes.map(etTime =>
        moment.tz(etTime, 'HH:mm', 'America/New_York').tz(localTimeZone).format('hh:mm a')
      )
    }));
  }
  
  // This function finds the current active color and the two upcoming colors based on the local time
  function getNextThreeColors(localSchedule) {
    const now = moment();
    // Filter sessions that have not started yet
    const futureSessions = localSchedule.filter(session => moment(session.times[0], 'hh:mm a').isAfter(now));
    // Sort sessions by start time
    futureSessions.sort((a, b) => moment(a.times[0], 'hh:mm a').diff(moment(b.times[0], 'hh:mm a')));
    // Take the first three sessions
    return futureSessions.slice(0, 3);
}


  
function updateProgressBarsAndTimers(localSchedule) {
    // Get the next three sessions to be depleted
    let nextThreeSessions = getNextThreeColors(localSchedule);
    // Sort the sessions based on start times
    nextThreeSessions.sort((a, b) => moment(a.times[0], 'hh:mm a').diff(moment(b.times[0], 'hh:mm a')));
    // Get the current time
    const now = moment();
  
    // Iterate through the next three sessions
    for (let i = 0; i < nextThreeSessions.length; i++) {
        const session = nextThreeSessions[i];
        const progressBar = document.getElementById(`progress-bar-${i + 1}`);
        const timer = document.getElementById(`timer-${i + 1}`);
        
        // Calculate the progress bar's width and the remaining time for the current session
        let sessionStartTime = moment(session.times[0], 'hh:mm a');
        let sessionEndTime = moment(session.times[1], 'hh:mm a');
        let totalSessionDuration = sessionEndTime.diff(sessionStartTime);
        let timeElapsed = now.diff(sessionStartTime);
        let timeRemaining = sessionEndTime.diff(now);
        
        // Check if the session has started
        if (timeElapsed >= 0) {
            // Calculate the width of the progress bar (inverse of time elapsed)
            let width = 100 - ((timeElapsed / totalSessionDuration) * 100);
            progressBar.style.width = `${width}%`;
            progressBar.className = `progress-bar background-${session.color}`;
        
            // Update the timer with the time remaining in minutes and seconds
            let duration = moment.duration(timeRemaining);
            let formattedTime = Math.floor(duration.asMinutes()) + ':' + ('0' + duration.seconds()).slice(-2);
            timer.textContent = formattedTime;
        
            // Go to the next session start time
            session.times.shift();
            // If the end of the array is reached, move to the next day
            if (session.times.length === 0) {
                session.times = etSchedule[i].etTimes.map(etTime =>
                moment.tz(etTime, 'HH:mm', 'America/New_York').tz(moment.tz.guess()).add(1, 'days').format('hh:mm a')
                );
            }
        }
    }
}

  
  // Convert the ET schedule to the local time zone schedule
  const localSchedule = convertScheduleToLocalTime(etSchedule);
  
  // Initial update
  updateProgressBarsAndTimers(localSchedule);
  
  // Set an interval to update progress bars and timers every second
  setInterval(() => updateProgressBarsAndTimers(localSchedule), 1000);
  