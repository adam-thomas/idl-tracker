# IDL Tracker

## Setup

* Clone the project and `cd` into the cloned directory.
* Create a virtual environment with `python3 -m venv .`.
* Activate the virtual environment with `source bin/activate`.
* Ensure Postgres is running on your system ([instructions are here](https://www.postgresql.org/) if you need to set it up).
* Install the project with `make install`. Note that this will need a small amount of your input in setting up a user account - it doesn't have to be anything secure, since it's just running on your local machine for test data.

## Building and running

* Compile the React and Less code with `npm run dev`. This will also run a file watcher that recompiles the files after any changes.
* Ensure Django has access to the frontend files with `python manage.py collectstatic`.
* Run the actual server with `make run`.
* Head to `127.0.0.1:8000` in your browser to see the results!
