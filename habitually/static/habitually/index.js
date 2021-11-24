document.addEventListener('DOMContentLoaded', function () {

  // Load dates for the heading of the weekly calendar view
  loadDates();

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
  // Display checked or unchecked boxes depending on Completion status
}

function toggleCompletion(doer, habitId, daysAgo) {
  // Get date from given day
  var today = luxon.DateTime.now();
  var date = today.minus({days: daysAgo}).toFormat('yyyy-MM-dd');

  // API Call using habit name and date
  fetch(`habitually/${doer}/${habitId}/${date}`)
  .then((response) => response.json())
  .then((data) => {
    // Log data onto console
    console.log(data);

    // Change checkbox image to checked or unchecked depending on completion status
    if (data.status) {
      document.querySelector(`#checkbox-${habitId}-${daysAgo}`).src = '/static/habitually/icons/checkbox_checked.png';
    }
    else {
      document.querySelector(`#checkbox-${habitId}-${daysAgo}`).src = '/static/habitually/icons/checkbox_unchecked.png';
    }
  });
}