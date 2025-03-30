SHELL := /bin/bash
verbosity=1

help:
	@echo "Usage:"
	@echo " make help           -- display this help"
	@echo " make install        -- install requirements and set up the database"
	@echo " make test           -- run tests"
	@echo " make run            -- run idl-tracker at localhost:8000"

install:
	pip install -r requirements.txt
	if [ `psql -t -c "SELECT COUNT(1) FROM pg_catalog.pg_database WHERE datname = 'idl_tracker'"` -eq 0 ]; then \
		psql  -c "CREATE DATABASE idl_tracker"; \
	fi
	python manage.py migrate
	python manage.py createsuperuser
	npm install

test:
	@python manage.py test --keepdb --verbosity=$(verbosity)

run:
	@python manage.py runserver
