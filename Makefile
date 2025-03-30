SHELL := /bin/bash
verbosity=1

help:
	@echo "Usage:"
	@echo " make help           -- display this help"
	@echo " make install        -- install requirements and set up the database"
	@echo " make test           -- run tests"
	@echo " make run            -- run idl-tracker at localhost:8000"

install:
	python3 -m venv .
	bin/pip install -r requirements.txt
	if [ `psql -t -c "SELECT COUNT(1) FROM pg_catalog.pg_database WHERE datname = 'idl_tracker'"` -eq 0 ]; then \
		psql  -c "CREATE DATABASE idl_tracker"; \
	fi
	bin/python manage.py migrate
	bin/python manage.py createsuperuser
	npm install

test:
	@python manage.py test --keepdb --verbosity=$(verbosity)

run:
	@DEBUG=1 python manage.py runserver
