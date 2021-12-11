// Create a global variable to track which week the user is viewing
var weeksAgo = 0;

// Create a constant global variable to store the number of days in a week
const daysPerWeek = 7;

var newHabitFormVisibility = false;

var categoryDropdownVisibility = false;

var lineChartData = ['Completion Rate'];

var checkedCheckboxes = 0;

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#plus-button').onclick = function() {
    toggleNewHabitFormVisibility();
  };

  if (document.querySelector('.calendar') !== null) {

    // Load calendar navigation buttons
    loadCalendarNavButtons();

    // Load dates for the heading of the weekly calendar view
    loadDates(weeksAgo);

    // Load checked or unchecked boxes depending on habit completion status
    loadCheckboxes(weeksAgo);

    // Load delete button
    loadDeleteButton();

    // When each checkbox is clicked, toggle habit completion for that day
    document.querySelectorAll('.checkbox-image').forEach((checkbox) => {
      checkbox.onclick = function() {
        // Call toggleCompletion() function, passing through data attributes and calculating number of days ago from today
        toggleCompletion(this.dataset.doer, this.dataset.habit, (parseInt(this.dataset.columnkey) + daysPerWeek * weeksAgo));
      };
    });

    // When the category dropdown button is clicked
    document.querySelector('.category-dropdown-button').onclick = function() {
      // Show or hide category dropdown menu depending on its current visibility
      toggleCategoryDropdownVisibility();
    };

    // When a category in the dropdown menu is clicked on
    document.querySelectorAll('.category-dropdown-item').forEach((item) => {
      item.onclick = function() {
        // Display the relevant category elements
        displayCategory(this.dataset.category);
      };
    });
  }

  // When the profile link is clicked, get the completion streaks per habit
  document.querySelector('#profile-link').onclick = function() {
    loadProfile();
  };

  // By default, disable the add button in the suggested habits modal
  document.querySelector('#add-suggested-habit-button').disabled = true;

  // For each checkbox
  document.querySelectorAll('.form-check-input').forEach((checkbox) => {
    checkbox.onchange = function() {
      // Keep track of how many checkboxes are checked
      if (checkbox.checked) {
        checkedCheckboxes += 1;
      }
      else {
        checkedCheckboxes -= 1;
      }

      // Enable the add button in the suggested habits modal when at least one checkbox is checked
      if (checkedCheckboxes >= 1) {
        document.querySelector('#add-suggested-habit-button').disabled = false;
      }
      else {
        // Disable the add button in the suggested habits modal
        document.querySelector('#add-suggested-habit-button').disabled = true;
      }
    };
  });
});

function loadProfile() {
  fetch(`habitually/get_habit_count`)
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    if (data.habit_count > 0) {
      getCompletionStreaksPerHabit('current');
    }
    else {
      document.querySelector('#weekly-view-container').style.display = 'none';
      document.querySelector('#charts-container').style.display = 'none';
      document.querySelector('#no-habits-message-profile').style.display = 'block';
      document.querySelector('#profile-container').style.display = 'block';
    }
  });
}

function getCompletionStreaksPerHabit(streak) {
  fetch(`habitually/completion_streaks_per_habit/${streak}`)
  .then((response) => response.json())
  .then((data) => {
    habitIds = Object.keys(data);
    habitStreaks = Object.values(data);

    var counter = 0;
    habitIds.forEach((habitId) => {
      var span = document.querySelector(`#streak-${habitId}`);
      if (habitStreaks[counter] === 1) {
        if (streak === 'current') {
          span.innerHTML = `${habitStreaks[counter]} day | `;
        }
        else if (streak === 'longest') {
          span.append(`${habitStreaks[counter]} day`);
        }
      }
      else {
        if (streak === 'current') {
          span.innerHTML = `${habitStreaks[counter]} days | `;
        }
        else if (streak === 'longest') {
          span.append(`${habitStreaks[counter]} days`);
        }
      }

      counter += 1;
    });
  })
  .then(() => {
    if (streak !== 'longest') {
      getCompletionStreaksPerHabit('longest');
    }
    else {
      getOverallHabitCompletionRates();
    }
  });
}

function getOverallHabitCompletionRates() {
  fetch(`habitually/overall_habit_completion_rate`)
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    data.forEach((rate) => {
      lineChartData.push(rate);
    });
  })
  .then(() => {
    generateOverallCompletionRateChart();
    getSevenDayHabitCompletionRates();
  });
}

function generateOverallCompletionRateChart() {
  var lineChart = c3.generate({
    bindto: '#overall-completion-rate-chart',
    data: {
      x: 'x',
      columns: [
        getLastSevenDays(),
        lineChartData
      ],
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          format: d3.timeFormat("%m/%d")
        }
      },
      y: {
        label: {
          text: 'Percentage of Habits Completed (%)',
          position: 'outer-middle'
        }
      },
    },
    legend: {
      show: false
    }
  });
}

var dayArray = ['x'];

function getLastSevenDays() {
  for (var i = 6; i > -1; i--) {
    var day = luxon.DateTime.now().minus({ days: i });
    dayArray.push(day);
  }
  return dayArray;
}

var barChartHabits = ['x'];

var barChartRates = ['Completion Rate'];

function getSevenDayHabitCompletionRates() {
  fetch(`habitually/seven_day_habit_completion_rates`)
  .then((response) => response.json())
  .then((data) => {
    for (var habit in data) {
      barChartHabits.push(habit);
      barChartRates.push(data[habit]);
    }
  })
  .then(() => {
    generateHabitBarChart();
    document.querySelector('#weekly-view-container').style.display = 'none';
    document.querySelector('#profile-container').style.display = 'block';
  });
}

function generateHabitBarChart() {
  var barChart = c3.generate({
    bindto: '#habit-bar-chart',
    bar: {
        width: {
          ratio: 0.5
        }
    },
    padding: {
        left: 110
    },
    color: {
        pattern: ['#7FB3D5']
    },
    data: {
        x: 'x',
        columns:
            [
          barChartHabits,
          barChartRates
          ],
        type: 'bar',
    },
    axis: {
        rotated: true,
        x: {
            type: 'category',
        },
        y: {
          label: {
            text: 'Completion Rate (%)',
            position: 'outer-middle'
          },
        },
    },
    tooltip: {
        grouped: false
    },
    legend: {
        show: false
    }
});
}

// Adapted from Anna Aitchison https://dev.to/ara225/how-to-use-bootstrap-modals-without-jquery-3475
function openModal() {
  document.getElementById('backdrop').style.display = 'block';
  document.getElementById('exampleModalCenter').style.display = 'block';
  document.getElementById('exampleModalCenter').classList.add('show');
}

// Adapted from Anna Aitchison https://dev.to/ara225/how-to-use-bootstrap-modals-without-jquery-3475
function closeModal() {
  document.getElementById('backdrop').style.display = 'none';
  document.getElementById('exampleModalCenter').style.display = 'none';
  document.getElementById('exampleModalCenter').classList.remove('show');
}

// Adapted from Anna Aitchison https://dev.to/ara225/how-to-use-bootstrap-modals-without-jquery-3475
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target === document.getElementById('exampleModalCenter')) {
    closeModal();
  }
};

function toggleNewHabitFormVisibility() {
  if (newHabitFormVisibility) {
    setTimeout(function() {
      slideUp('form-container');
    }, 200);
    fadeOut('form-container');
    document.querySelector('#plus-button').innerHTML = 'ADD HABIT +';
    newHabitFormVisibility = false;
  }
  else {
    setTimeout(function() {
      fadeIn('form-container');
    }, 200);
    slideDown('form-container');
    document.querySelector('#plus-button').innerHTML = 'ADD HABIT -';
    newHabitFormVisibility = true;
  }
}

// Adapted from https://codepen.io/NoName84/pen/aNbyyz
function slideUp(id) {
  var element = document.getElementById(id);
  element.style.transition = "all 0.5s ease-in-out";
  element.style.height = "0px";
}

// Adapted from https://codepen.io/NoName84/pen/aNbyyz
function fadeOut(id) {
  var element = document.getElementById(id);
  element.style.transition = 'all 0.5s ease-in-out';
  element.style.opacity = '0%';
  element.style.visibility = 'hidden';
}

// Adapted from https://codepen.io/NoName84/pen/aNbyyz
function slideDown(id) {
  var element = document.getElementById(id);
  element.style.transition = 'all 0.5s ease-in-out';
  element.style.height = '240px';
}

// Adapted from https://codepen.io/NoName84/pen/aNbyyz
function fadeIn(id) {
  var element = document.getElementById(id);
  element.style.transition = 'all 0.5s ease-in-out';
  element.style.opacity = '100%';
  element.style.visibility = 'visible';
}

function loadCalendarNavButtons() {
  // By default (i.e. user is on current week), the next button should be disabled
  document.querySelector('#next-week-button').disabled = true;

  // When the previous button is clicked
  document.querySelector('#previous-week-button').onclick = function() {
    // Add 1 to weeksAgo to indicate which week the user is viewing
    weeksAgo++;

    // Load dates and checkboxes for the week, passing through the number of weeks ago
    loadDates(weeksAgo);
    loadCheckboxes(weeksAgo);

    // Enable the next button
    document.querySelector('#next-week-button').disabled = false;
  };

  // When the next button is clicked
  document.querySelector('#next-week-button').onclick = function() {
    // Subtract 1 from weeksAgo to indicate which week the user is viewing
    weeksAgo--;

    // Load dates and checkboxes for the week, passing through the number of weeks ago
    loadDates(weeksAgo);
    loadCheckboxes(weeksAgo);

    // If the user is on the current week, disable the next button
    if (weeksAgo === 0) {
      document.querySelector('#next-week-button').disabled = true;
    }
  };
}

function loadDates() {
  // Dict containing keys to the days of the week
  var daysDict = {
    1: 'MON',
    2: 'TUE',
    3: 'WED',
    4: 'THU',
    5: 'FRI',
    6: 'SAT',
    7: 'SUN'
  };

  // Display day of week, month, and day in the first row of the weekly calendar view
  for (var i = (0 + daysPerWeek * weeksAgo); i < (7 + daysPerWeek * weeksAgo); i++) {
    var today = luxon.DateTime.now();

    var date = today.minus({days: i});
    var month = date.toFormat('MM');
    var day = date.toFormat('dd');
    var dayOfWeek = date.weekday;

    // Calculate column key of corresponding day heading in first row
    var columnKey = i - daysPerWeek * weeksAgo;

    // Display weekday and date in first row
    document.getElementById(`${columnKey}`).innerHTML = daysDict[dayOfWeek] + '<br>' + month + '/' + day;
  }
}

function loadCheckboxes() {
  // For each checkbox image, load the appropriate checkbox image (unchecked/checked)
  document.querySelectorAll('.checkbox-image').forEach((checkbox) => {
    // Get given doer and habit ID
    var doer = checkbox.dataset.doer;
    var habitId = checkbox.dataset.habit;

    // Get date from given number of days ago
    var daysAgo = (parseInt(checkbox.dataset.columnkey) + daysPerWeek * weeksAgo);
    var date = getDate(daysAgo);

    // API call to get habit completion status
    fetch(`habitually/${doer}/${habitId}/${date}/get_status`)
    .then((response) => response.json())
    .then((data) => {
      // Set checkbox image to checked or unchecked depending on completion status
      setCheckboxImage(habitId, checkbox.dataset.columnkey, data.status);
    });
  });
}

function getDate(daysAgo) {
  // Get date from given number of days ago
  var today = luxon.DateTime.now();
  var date = today.minus({days: daysAgo}).toFormat('yyyy-MM-dd');
  return date;
}

function setCheckboxImage(habitId, columnKey, completionStatus) {
  // Set checkbox image to checked or unchecked depending on completion status
  if (completionStatus) {
    document.querySelector(`#checkbox-${habitId}-${columnKey}`).src = '/static/habitually/icons/checkbox_checked.png';
  }
  else {
    document.querySelector(`#checkbox-${habitId}-${columnKey}`).src = '/static/habitually/icons/checkbox_unchecked.png';
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

    // Calculate column key of corresponding checkbox
    var columnKey = daysAgo - daysPerWeek * weeksAgo;

    // Change checkbox image to checked or unchecked depending on completion status
    setCheckboxImage(habitId, columnKey, data.status);
  });
}

function loadDeleteButton() {
  // Create delete button image
  const deleteButton = document.createElement('img');
  deleteButton.className = 'delete-button';
  deleteButton.src = '/static/habitually/icons/x_button.png';

  document.querySelectorAll('.habit').forEach((habit) => {
    // When each habit is hovered on, display delete button
    habit.onmouseover = function() {
      document.querySelector(`.habit-${this.dataset.habit}`).prepend(deleteButton);

      // When delete button is clicked, delete the habit and relevant elements
      deleteButton.onclick = function() {
        deleteHabit(habit.dataset.doer, habit.dataset.habit);
      };
    };

    // When cursor is no longer hovering on both the habit and delete button, remove delete button
    var relevantElements = [deleteButton, habit];
    relevantElements.forEach((element) => {
      element.onmouseleave = function() {
        deleteButton.remove();
      };
    });
  });
}

function deleteHabit(doer, habitId) {
  fetch(`habitually/${doer}/${habitId}/delete`)
  .then((response) => response.json())
  .then((data) => {
    // Log data onto console
    console.log(data);

    // Remove relevant elements and refresh page if success message is returned
    if ('message' in data) {
      document.querySelectorAll(`.habit-${habitId}`).forEach((element) => {
        element.remove();
      });

      location.reload(true);
    }
  });
}

function toggleCategoryDropdownVisibility() {
  if (categoryDropdownVisibility) {
    // If dropdown is currently visible, hide it and set status to false
    document.querySelector('.category-dropdown-menu').style.display = 'none';
    categoryDropdownVisibility = false;
  }
  else {
    // If dropdown is currently not visible, show it and set status to true
    document.querySelector('.category-dropdown-menu').style.display = 'block';
    categoryDropdownVisibility = true;
  }
}

function displayCategory(category) {
  // Hide 'no habits' message
  document.querySelector('.no-habits-message').style.display = 'none';

  // Hide dropdown menu
  toggleCategoryDropdownVisibility();

  // Check if user clicked on 'All Categories' dropdown item
  if (category === 'all') {
    // Display all habits and checkboxes
    document.querySelectorAll('.habit, .checkbox').forEach((element) => {
      element.style.display = 'block';
    });
  }
  else {
    // Hide all habits and checkboxes
    document.querySelectorAll('.habit, .checkbox').forEach((element) => {
      element.style.display = 'none';
    });

    // Find the habits and checkboxes with the category as a class
    var relevantElements = document.querySelectorAll(`.habit.${category}, .checkbox.${category}`);

    // If there are no relevant elements, display "no habits" message
    if (relevantElements.length === 0) {
      document.querySelector('.no-habits-message').style.display = 'block';
    }
    else {
      // Display relevant elements
      relevantElements.forEach((element) => {
        element.style.display = 'block';
      });
    }
  }
}