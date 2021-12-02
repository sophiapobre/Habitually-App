// Create a global variable to track which week the user is viewing
var weeksAgo = 0;

// Create a constant global variable to store the number of days in a week
const daysPerWeek = 7;

var categoryDropdownVisibility = false;

document.addEventListener('DOMContentLoaded', function () {
  // Check if the user has habits
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
});

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
    var elementsArray = [deleteButton, habit];
    elementsArray.forEach((element) => {
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

    // Remove relevant elements if success message is returned
    if ('message' in data) {
      document.querySelectorAll(`.habit-${habitId}`).forEach((element) => {
        element.remove();
      });
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

  // Check if user clicked on 'Display All' dropdown item
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

    // If there are no relevant elements, display message
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