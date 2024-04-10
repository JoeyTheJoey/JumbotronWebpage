
document.addEventListener('DOMContentLoaded', function () {

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

    // Flatten all times into a single array with their associated colors and times converted to moments.
    let allTimes = localSchedule.flatMap(session => 
        session.times.map(time => ({
            time: moment(time, 'hh:mm a'),
            color: session.color,
            endTime: moment(time, 'hh:mm a').add(45, 'minutes') // Assume 45-minute duration for each session.
        }))
    );

    // Sort the array by time.
    allTimes.sort((a, b) => a.time.diff(b.time));

    // Filter for future sessions and limit to the first occurrence of each unique color.
    upcomingColors = allTimes.filter(session => session.time.isAfter(now) || session.endTime.isAfter(now));
    let uniqueColors = [];
    upcomingColors = upcomingColors.filter(session => {
        if (uniqueColors.includes(session.color)) {
            return false;
        } else {
            uniqueColors.push(session.color);
            return true;
        }
    }).slice(0, 3); // Limit to the next three unique colors.

    return upcomingColors;
}

function updateProgressBarsAndTimers() {
    const localSchedule = convertScheduleToLocalTime(etSchedule); // Ensure the schedule is up-to-date.
    const upcomingColors = getNextThreeColors(localSchedule);

    upcomingColors.forEach((session, index) => {
        const progressBar = document.getElementById(`progress-bar-${index + 1}`);
        const timer = document.getElementById(`timer-${index + 1}`);
        if (!progressBar || !timer) return;

        // Calculate time remaining and width percentage.
        let now = moment();
        let timeRemaining = session.endTime.diff(now);
        let totalSessionDuration = 45 * 60 * 1000;
        let widthPercentage = Math.max(0, Math.min(100, (timeRemaining / totalSessionDuration) * 100));

        progressBar.style.width = `${widthPercentage}%`;
        progressBar.className = `progress-bar background-${session.color}`;

        let minutes = Math.floor(timeRemaining / (60 * 1000));
        let seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
        timer.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    });
}

// Initial call and periodic updates.
updateProgressBarsAndTimers();
setInterval(updateProgressBarsAndTimers, 1000);
});