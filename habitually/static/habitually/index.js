document.addEventListener('DOMContentLoaded', function () {
  // Load dates for the heading of the weekly calendar view
  loadDates();

  // Load checked or unchecked boxes depending on habit completion status
  loadCheckboxes();

  // When each checkbox is clicked, toggle habit completion for that day
  document.querySelectorAll('.checkbox-image').forEach((checkbox) => {
    checkbox.onclick = function() {
      toggleCompletion(this.dataset.doer, this.dataset.habit, this.dataset.daysago);
    };
  });
});

function loadDates() {
  // Dict containing keys to the days of the week
  var days_dict = {
    1: 'MON',
    2: 'TUE',
    3: 'WED',
    4: 'THU',
    5: 'FRI',
    6: 'SAT',
    7: 'SUN'
  };

  // Display day of week, month, and day in the first row of the weekly calendar view
  for (var i = 0; i < 7; i++) {
    var today = luxon.DateTime.now();

    var date = today.minus({days: i});
    var month = date.toFormat('MM');
    var day = date.toFormat('dd');
    var dayOfWeek = date.weekday;

    document.querySelector(`#day${6 - i}`).innerHTML = days_dict[dayOfWeek] + '<br>' + month + '/' + day;
  }
}

function loadCheckboxes() {
  // For each checkbox image, load the appropriate checkbox image (unchecked/checked)
  document.querySelectorAll('.checkbox-image').forEach((checkbox) => {
    // Get given doer and habit ID
    var doer = checkbox.dataset.doer;
    var habitId = checkbox.dataset.habit;

    // Get date from given number of days ago
    var daysAgo = checkbox.dataset.daysago;
    var date = getDate(daysAgo);

    // API call to get habit completion status
    fetch(`habitually/${doer}/${habitId}/${date}/get_status`)
    .then((response) => response.json())
    .then((data) => {
      // Set checkbox image to checked or unchecked depending on completion status
      setCheckboxImage(habitId, daysAgo, data.status);
    });
  });
}

function getDate(daysAgo) {
  // Get date from given number of days ago
  var today = luxon.DateTime.now();
  var date = today.minus({days: daysAgo}).toFormat('yyyy-MM-dd');
  return date;
}

function setCheckboxImage(habitId, daysAgo, completionStatus) {
  // Set checkbox image to checked or unchecked depending on completion status
  if (completionStatus) {
    document.querySelector(`#checkbox-${habitId}-${daysAgo}`).src = '/static/habitually/icons/checkbox_checked.png';
  }
  else {
    document.querySelector(`#checkbox-${habitId}-${daysAgo}`).src = '/static/habitually/icons/checkbox_unchecked.png';
  }
}

function toggleCompletion(doer, habitId, daysAgo) {
  // Get date from given number of days ago
  var date = getDate(daysAgo);

  // API call to toggle habit completion status
  fetch(`habitually/${doer}/${habitId}/${date}/toggle_status`)
  .then((response) => response.json())
  .then((data) => {
    // Log data onto console
    console.log(data);

    // Change checkbox image to checked or unchecked depending on completion status
    setCheckboxImage(habitId, daysAgo, data.status);
  });
}