build:
	docker build . -t events-api

tests:
	make build
	docker run --rm events-api
