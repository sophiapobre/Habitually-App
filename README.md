# Habitually
Habitually is a habit tracker that makes building healthy habits simple. With its sleek, user-friendly interface and data visualizations to track completion rates and streaks, Habitually sets users up for long-term success.

View a live demo [here](https://habitually-app.herokuapp.com).

## Table of Contents
* [Technologies Used](#technologies-used)
* [Features](#features)
* [Screenshots](#screenshots)
* [Setup](#setup)

## Technologies Used
* Django version 4.1
* Python version 3.9.7
* JavaScript
* HTML
* CSS
* PostgreSQL
* [Bootstrap](https://getbootstrap.com/) version 4.4.1 - for easier front-end formatting
* [C3.js](https://c3js.org/) version 0.7.20 - for generating habit completion charts
* [Luxon](https://moment.github.io/luxon/#/) - for determining dates and days to show in the calendar view
* [Google Fonts](https://fonts.google.com/) - for ensuring that the Poppins font appears the same to all users

## Features
* Registration and login system
* Input habits and assign categories (e.g., Health, Productivity, Hobbies)
* Choose from suggested habits to add to the tracker
* Delete habits from the tracker
* View tracker as a weekly calendar
* Toggle checkboxes in the tracker to indicate habit completion per day
* Filter habits according to category in the tracker
* Visualize habit completion trends through charts
* Keep track of completion streaks per habit

## Screenshots
### Homepage
![landing-page](https://user-images.githubusercontent.com/65494023/185020516-151b1c3d-196b-435b-8315-64921c81fe54.jpg)
### Habit Tracker
![tracker-view](https://user-images.githubusercontent.com/65494023/185020578-ff28aaf3-b34f-46a3-9934-d650f71f5cda.jpg)
### Adding Habits
![add-habit-form](https://user-images.githubusercontent.com/65494023/185020602-6e50f817-5207-47ee-bcd6-04331a37f8e9.jpg)
### Habit Suggestions
![suggested-habits-form](https://user-images.githubusercontent.com/65494023/185020637-26efaf73-b1f8-4be5-8431-b0f7c10a07a6.jpg)
### Progress Charts
![your-progress-view-1](https://user-images.githubusercontent.com/65494023/185020679-1e9652b3-f627-404c-b638-106507e8c6b8.jpg)

## Setup

**Prerequisites:** Ensure that you have installed [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git), [Python](https://www.python.org/downloads/), [pip](https://pip.pypa.io/en/stable/installation/), [virtualenv](https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments/#installing-virtualenv), and [PostgreSQL](https://www.postgresql.org/download/).

1. Launch Command Prompt (Windows) or Terminal (MacOS).

2. Clone this repository and navigate to the root directory of the project:

    ```sh
    git clone https://github.com/sophiapobre/Habitually-App.git
    cd Habitually-App
    ```

3. Create a virtual environment:

    ```sh
    python -m venv venv
    ```

    ***Note:*** During setup, you may have to use `python3` instead of `python` depending on your installation.

4. Activate the virtual environment:

    **MacOS**
    ```sh
    source venv/bin/activate
    ```

    **Windows**
    ```sh
    venv\Scripts\activate
    ```

5. Install the application's dependencies from `requirements.txt`:

    ```sh
    pip install -r requirements.txt
    ```

6. Generate a secret key for the application:

    ```sh
    python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
    ```

    Copy the secret key that is printed on the next line.

7. Create a `.env` file to store your secret key:

    ```sh
    echo SECRET_KEY="your-secret-key" > finalproject/.env
    ```

    ***Note:*** Replace `your-secret-key` with the secret key you copied in the previous step.

8. Launch PostgreSQL:

    ```sh
    psql -U username
    ```

    ***Note:*** Replace `username` with the username of your PostgreSQL superuser. After running the command, you will be prompted to enter the password of your superuser.

9. Create a new user to manage the database:

    ```sql
    CREATE USER username WITH PASSWORD 'password';
    ```

    ***Note:*** Replace `username` and `password` with your preferred login details. Make sure to enclose the password in single quotation marks.

10. Configure the connection parameters for the new user to ensure alignment with Django settings:
    
    ```sql
    ALTER ROLE username SET client_encoding TO 'utf8';
    ALTER ROLE username SET default_transaction_isolation TO 'read committed';
    ALTER ROLE username SET timezone TO 'UTC';
    ```

    ***Note:*** Replace `username` with the username of the new user.

11. Create a PostgreSQL database with the new user as the owner and exit PostgreSQL:

    ```sql
    CREATE DATABASE dbname OWNER username;
    exit
    ```

    ***Note:*** Replace `dbname` with the name of the database and `username` with the username of the new user.

12. Append the database settings to the `.env` file:

    ```sh
    echo DATABASE_NAME=dbname >> finalproject/.env
    echo DATABASE_USER=username >> finalproject/.env
    echo DATABASE_PASSWORD=password >> finalproject/.env
    ```

    ***Note:*** Replace `dbname` with the name of the database, and `username` and `password` with the login details of the new user.

13. Create migrations based on models and apply the migrations:

    ```sh
    python manage.py makemigrations
    python manage.py migrate
    ```

14. Load initial data into the database using the `base_data.json` fixture:

    ```sh
    python manage.py loaddata base_data.json
    ```

15. Launch the development server:

    ```sh
    python manage.py runserver
    ```

    Click on the provided URL to view the app!
