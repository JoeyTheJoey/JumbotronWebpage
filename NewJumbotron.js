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
    let upcomingColors = [];
  
    // Flatten all times and colors into a single array
    let allTimes = [];
    localSchedule.forEach(session => {
      session.times.forEach(time => {
        allTimes.push({ time: moment(time, 'hh:mm a'), color: session.color });
      });
    });
  
    // Sort the times
    allTimes.sort((a, b) => a.time.diff(b.time));
  
    // Find the next three unique color sessions
    for (let i = 0; i < allTimes.length; i++) {
      if (allTimes[i].time.isAfter(now) && !upcomingColors.some(c => c.color === allTimes[i].color)) {
        // Find the index of the next color session of the same color
        let nextColorIndex = allTimes.findIndex((t, idx) => t.color === allTimes[i].color && idx > i);
        let endTime = nextColorIndex !== -1 ? allTimes[nextColorIndex].time : allTimes[i].time.clone().add(1, 'day');
        upcomingColors.push({
          ...allTimes[i],
          endTime: endTime
        });
        if (upcomingColors.length === 3) break;
      }
    }
  
    return upcomingColors;
  }
  
  
  function updateProgressBarsAndTimers(localSchedule) {
    const now = moment();
    let nextThreeSessions = getNextThreeColors(localSchedule);
  
    // Update the progress bars and timers
    for (let i = 0; i < nextThreeSessions.length; i++) {
      const session = nextThreeSessions[i];
      const progressBar = document.getElementById(`progress-bar-${i + 1}`);
      const timer = document.getElementById(`timer-${i + 1}`);
  
      // Calculate the remaining time for the current session
      let timeRemaining = session.endTime.diff(now);
      
      // Check if the session has already ended
      if (timeRemaining < 0) {
        progressBar.style.width = `0%`;
        timer.textContent = '00:00';
        continue;
      }
  
      // Calculate the total session duration based on the actual schedule
      let totalSessionDuration = session.endTime.diff(session.time);
      let width = (timeRemaining / totalSessionDuration) * 100;
      progressBar.style.width = `${width}%`;
      progressBar.className = `progress-bar background-${session.color}`;
      
      // Update the timer with the time remaining in minutes and seconds
      let duration = moment.duration(timeRemaining);
      let minutes = Math.floor(duration.asMinutes());
      let seconds = duration.seconds();
      let formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      timer.textContent = formattedTime;
    }
  }
  

  
  // Convert the ET schedule to the local time zone schedule
  const localSchedule = convertScheduleToLocalTime(etSchedule);
  
  // Initial update
  updateProgressBarsAndTimers(localSchedule);
  
  // Set an interval to update progress bars and timers every second
setInterval(() => {
    // Convert the ET schedule to the local time zone schedule on each tick in case the local time zone changes (like daylight saving changes)
    const localSchedule = convertScheduleToLocalTime(etSchedule);
    updateProgressBarsAndTimers(localSchedule);
}, 1000);
  