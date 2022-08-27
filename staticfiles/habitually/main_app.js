/* jshint esversion: 6 */

// Create a global variable to track which week the user is viewing
var weeksAgo = 0;

// Create a constant global variable to store the number of days in a week
const daysPerWeek = 7;

// Create a global variable setting new habit form's visibility to false by default
var newHabitFormVisibility = false;

// Create a global variable setting the category dropdown's visibility to false by default
var categoryDropdownVisibility = false;

// Create a global variable for the line chart data
var lineChartData = ['Completion Rate'];

// Create a global variable setting the number of checked checkboxes in the modal to 0 by default
var checkedCheckboxes = 0;

// Create a global variable for storing a list of dates for the line chart
var dayArray = ['x'];

// Create a global variable for storing a list of habit names for bar chart
var barChartHabits = ['x'];

// Create a global variable for storing a list of habit completion rates for bar chart
var barChartRates = ['Completion Rate'];

// When the DOM Content is loaded
document.addEventListener('DOMContentLoaded', function () {
  // When the 'Add habit +' plus button is clicked, toggle the new habit form visibility
  document.querySelector('#plus-button').onclick = function() {
    toggleNewHabitFormVisibility();
  };

  // Check if the calendar view is displayed (when user is on the tracker)
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

// Load the next and previous calendar navigation buttons
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

// Loads the dates in the heading of the weekly calendar view
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

    // Add date only for mobile-only first row div
    document.getElementById(`date-only-${columnKey}`).innerHTML = month + '<br>' + day;
  }
}

// Loads the habit completion checkboxes
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

// Returns the date depending on the number of days ago
function getDate(daysAgo) {
  // Get date from given number of days ago
  var today = luxon.DateTime.now();
  var date = today.minus({days: daysAgo}).toFormat('yyyy-MM-dd');
  return date;
}

// Set the habit completion checkboxes to filled or empty depending on current status
function setCheckboxImage(habitId, columnKey, completionStatus) {
  // Set checkbox image to checked or unchecked depending on completion status
  if (completionStatus) {
    document.querySelector(`#checkbox-${habitId}-${columnKey}`).src = '/static/habitually/icons/checkbox_checked.png';
  }
  else {
    document.querySelector(`#checkbox-${habitId}-${columnKey}`).src = '/static/habitually/icons/checkbox_unchecked.png';
  }
}

// Toggle habit completion
function toggleCompletion(doer, habitId, daysAgo) {
  // Get date from given number of days ago
  var date = getDate(daysAgo);

  // API call to toggle habit completion status
  fetch(`habitually/${doer}/${habitId}/${date}/toggle_status`)
  .then((response) => response.json())
  .then((data) => {
    // Calculate column key of corresponding checkbox
    var columnKey = daysAgo - daysPerWeek * weeksAgo;

    // Change checkbox image to checked or unchecked depending on completion status
    setCheckboxImage(habitId, columnKey, data.status);
  });
}

// Load the delete button for each habit
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

// Delete the habit
function deleteHabit(doer, habitId) {
  fetch(`habitually/${doer}/${habitId}/delete`)
  .then((response) => response.json())
  .then((data) => {
    // Remove relevant elements and refresh page if success message is returned
    if ('message' in data) {
      document.querySelectorAll(`.habit-${habitId}`).forEach((element) => {
        element.remove();
      });

      location.reload(true);
    }
  });
}

// Toggle the visibility of the category filter dropdown menu
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

// Display the relevant habits for user-selected category from dropdown
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

// Opens the select suggested habits modal
// Adapted from A. Aitchison https://dev.to/ara225/how-to-use-bootstrap-modals-without-jquery-3475
function openModal() {
  document.getElementById('backdrop').style.display = 'block';
  document.getElementById('exampleModalCenter').style.display = 'block';
  document.getElementById('exampleModalCenter').classList.add('show');
}

// Closes the select suggested habits modal
// Adapted from A. Aitchison https://dev.to/ara225/how-to-use-bootstrap-modals-without-jquery-3475
function closeModal() {
  document.getElementById('backdrop').style.display = 'none';
  document.getElementById('exampleModalCenter').style.display = 'none';
  document.getElementById('exampleModalCenter').classList.remove('show');
}

// When the user clicks anywhere outside of the modal, close it
// Adapted from A. Aitchison https://dev.to/ara225/how-to-use-bootstrap-modals-without-jquery-3475
window.onclick = function(event) {
  if (event.target === document.getElementById('exampleModalCenter')) {
    closeModal();
  }
};

// Toggle new habit form visibility
function toggleNewHabitFormVisibility() {
  // Check if the new habit form is already visible
  if (newHabitFormVisibility) {
    // Hide the new habit form with animations
    setTimeout(function() {
      slideUp('form-container');
    }, 200);
    fadeOut('form-container');

    // Update the innerHTML and global variable tracking visibility
    document.querySelector('#plus-button').innerHTML = 'ADD HABIT +';
    newHabitFormVisibility = false;
  }
  else {
    // Show the new habit form with animations
    setTimeout(function() {
      fadeIn('form-container');
    }, 200);
    slideDown('form-container');

    // Update the innerHTML and global variable tracking visibility
    document.querySelector('#plus-button').innerHTML = 'ADD HABIT -';
    newHabitFormVisibility = true;
  }
}

// Slide up animation for closing new habit form
// Adapted from https://codepen.io/NoName84/pen/aNbyyz
function slideUp(id) {
  var element = document.getElementById(id);
  element.style.transition = "all 0.5s ease-in-out";
  element.style.height = "0px";
}

// Fade out animation for closing new habit form
// Adapted from https://codepen.io/NoName84/pen/aNbyyz
function fadeOut(id) {
  var element = document.getElementById(id);
  element.style.transition = 'all 0.5s ease-in-out';
  element.style.opacity = '0%';
  element.style.visibility = 'hidden';
}

// Slide down animation for opening new habit form
// Adapted from https://codepen.io/NoName84/pen/aNbyyz
function slideDown(id) {
  var element = document.getElementById(id);
  element.style.transition = 'all 0.5s ease-in-out';
  element.style.height = '240px';
}

// Fade in animation for new habit form
// Adapted from https://codepen.io/NoName84/pen/aNbyyz
function fadeIn(id) {
  var element = document.getElementById(id);
  element.style.transition = 'all 0.5s ease-in-out';
  element.style.opacity = '100%';
  element.style.visibility = 'visible';
}

// Load the profile view displaying user progress
function loadProfile() {
  fetch(`habitually/get_habit_count`)
  .then((response) => response.json())
  .then((data) => {
    // Check if user has habits
    if (data.habit_count > 0) {
      // Get the ompletion streak data for the charts
      getCompletionStreaksPerHabit('current');
    }
    else {
      // Hide the weekly view and charts container
      document.querySelector('#weekly-view-container').style.display = 'none';
      document.querySelector('#charts-container').style.display = 'none';

      // Display the 'no habits' message and profile container
      document.querySelector('#no-habits-message-profile').style.display = 'block';
      document.querySelector('#profile-container').style.display = 'block';
    }
  });
}

// Get the completion streaks for each habit (current or longest streak)
function getCompletionStreaksPerHabit(streak) {
  fetch(`habitually/completion_streaks_per_habit/${streak}`)
  .then((response) => response.json())
  .then((data) => {
    // Store the habit IDs and streaks in variables
    var habitIds = Object.keys(data);
    var habitStreaks = Object.values(data);

    // Create counter variable to access items in habitStreaks array
    var counter = 0;

    // For each habit
    habitIds.forEach((habitId) => {
      // Get the corresponding span tag
      var span = document.querySelector(`#streak-${habitId}`);

      // Depending on the number of days in streak, display 'day' or 'days'
      if (habitStreaks[counter] === 1) {
        // Display streaks in the correct order in the span tag
        if (streak === 'current') {
          span.innerHTML = `${habitStreaks[counter]} day | `;
        }
        else if (streak === 'longest') {
          span.append(`${habitStreaks[counter]} day`);
        }
      }
      else {
        // Display streaks in the correct order in the span tag
        if (streak === 'current') {
          span.innerHTML = `${habitStreaks[counter]} days | `;
        }
        else if (streak === 'longest') {
          span.append(`${habitStreaks[counter]} days`);
        }
      }

      // Add to counter to move onto next item in array
      counter += 1;
    });
  })
  .then(() => {
    // If streak is not longest (meaning it's the first run of function)
    if (streak !== 'longest') {
      // Run the function again to display longest streaks
      getCompletionStreaksPerHabit('longest');
    }
    else {
      // Get the completion rates for the next chart
      getOverallHabitCompletionRates();
    }
  });
}

// Get the percentage of total habits that were completed per day
function getOverallHabitCompletionRates() {
  fetch(`habitually/overall_habit_completion_rate`)
  .then((response) => response.json())
  .then((data) => {
    // For each rate, add it to the lineChartData array
    data.forEach((rate) => {
      lineChartData.push(rate);
    });
  })
  .then(() => {
    // Generate the line chart using the data
    generateOverallCompletionRateChart();

    // Get the rates for the next chart
    getSevenDayHabitCompletionRates();
  });
}

// Generate the overall completion rate line chart using C3's formatting
function generateOverallCompletionRateChart() {
  var lineChart = c3.generate({
    // Select the ID to bind the chart to
    bindto: '#overall-completion-rate-chart',

    // Plug in last seven days and line chart data
    data: {
      x: 'x',
      columns: [
        getLastSevenDays(),
        lineChartData
      ],
    },

    // Set x and y axis details
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          // Convert x axis ticks to month/day
          format: d3.timeFormat("%m/%d"),

          // Hide outer ticks
          outer: false,

          // Display only alternating dates as ticks
          values: getLineChartDateTicks()
        }
      },
      y: {
        label: {
          // Text and positioning of y axis label
          text: 'Percentage of Habits Completed (%)',
          position: 'outer-middle'
        }
      },
    },

    // Hide the legend
    legend: {
      show: false
    }
  });
}

// Returns an array of the dates of the last 7 days
function getLastSevenDays() {
  for (var i = 6; i > -1; i--) {
    var day = luxon.DateTime.now().minus({ days: i });
    dayArray.push(day);
  }
  return dayArray;
}

// Returns a shortened version of the list of dates to display as ticks
function getLineChartDateTicks() {
  // Create an empty array to store date ticks
  var lineChartDateTicks = [];
  var counter = 1;

  // For each date in the dayArray, add every other date
  dayArray.forEach((date) => {
    if (counter % 2 !== 0) {
      lineChartDateTicks.push(date);
    }
    counter += 1;
  });
  return lineChartDateTicks;
}

// Get the habit names and corresponding completion rates in last 7 days
function getSevenDayHabitCompletionRates() {
  fetch(`habitually/seven_day_habit_completion_rates`)
  .then((response) => response.json())
  .then((data) => {
    // For each habit, add the habit name and completion rate to corresponding lists
    for (var habit in data) {
      barChartHabits.push(habit);
      barChartRates.push(data[habit]);
    }
  })
  .then(() => {
    // Generate the habit bar chart
    generateHabitBarChart();

    // Hide the weekly view container and display profile container
    document.querySelector('#weekly-view-container').style.display = 'none';
    document.querySelector('#profile-container').style.display = 'block';
  });
}

// Generate the overall completion rate line chart using C3's formatting
function generateHabitBarChart() {
  var barChart = c3.generate({
    // Select the ID to bind the chart to
    bindto: '#habit-bar-chart',

    // Set bar width
    bar: {
      width: {
        ratio: 0.5
      }
    },

    // Add padding to make space for habit names
    padding: {
      left: 110
    },

    // Set color of bars
    color: {
      pattern: ['#7FB3D5']
    },

    // Plug in habits and rates as bar chart data
    data: {
      x: 'x',
      type: 'bar',
      columns: [
        barChartHabits,
        barChartRates
      ]
    },

    // Set x and y axis details
    axis: {
      // Make bar chart horizontal
      rotated: true,
      x: {
          type: 'category',
      },
      y: {
        // Text and positioning of y axis label
        label: {
          text: 'Completion Rate (%)',
          position: 'outer-middle'
        },
        tick: {
          // Hide outer ticks
          outer: false,
          // Display only certain percentages as ticks
          values: getBarChartRateTicks()
        },
      },
    },
    tooltip: {
      grouped: false
    },

    // Hide legend
    legend: {
      show: false
    }
  });
}

// Returns specific percentages to display as ticks
function getBarChartRateTicks() {
  var counter = 0;
  var allZeroRates = true;

  // For each bar chart rate
  barChartRates.forEach((rate) => {
    if (counter > 0) {
      // If a non-zero completion rate shows up, set allZeroRates to false
      if (rate != 0) {
        allZeroRates = false;
      }
    }
    counter += 1;
  });

  // Check if the array of rates only contains '0%' completion rates (no completions)
  if (allZeroRates) {
    // Return 0
    return 0;
  }
  else {
    // Return specific percentages from 0 to 100
    return [0, 25, 50, 75, 100];
  }
}