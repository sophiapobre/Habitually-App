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

  // Create delete button image
  const deleteButton = document.createElement('img');
  deleteButton.className = 'delete-button';
  deleteButton.src = '/static/habitually/icons/x_button.png';

  // When each habit is hovered on, display delete button
  document.querySelectorAll('.habit').forEach((habit) => {
    habit.onmouseover = function() {
      document.querySelector(`.habit-${this.dataset.habit}`).prepend(deleteButton);

      // When delete button is clicked, delete the habit and relevant elements
      deleteButton.onclick = function() {
        deleteHabit(habit.dataset.doer, habit.dataset.habit);
      };
    };

    // When cursor is no longer on both the habit and delete button, remove delete button
    var elementsArray = [deleteButton, habit];
    elementsArray.forEach((element) => {
      element.onmouseleave = function() {
        deleteButton.remove();
      };
    });
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

    document.getElementById(`${i}-days-ago`).innerHTML = days_dict[dayOfWeek] + '<br>' + month + '/' + day;
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

function deleteHabit(doer, habitId) {
  fetch(`habitually/${doer}/${habitId}/delete`)
  .then((response) => response.json())
  .then((data) => {
    // Log data onto console
    console.log(data);

    // Remove relevant elements if success message is returned
    if ('message' in data) {
      document.querySelectorAll(`.habit-${habitId}`).forEach((element) => {
        element.remove();
      });
    }
  });
}