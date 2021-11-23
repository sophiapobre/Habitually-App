document.addEventListener('DOMContentLoaded', function () {

  loadDates();

  document.querySelectorAll('.form-check-input').forEach((checkbox) => {
    checkbox.onclick = function() {
      toggleCompletion(this.dataset.habit, this.dataset.daysAgo);
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

function toggleCompletion(habit, daysAgo) {
  // Get date from given day
  var today = luxon.DateTime.now();
  var date = today.minus({days: daysAgo});

  // API Call using habit name and date
}