build:
	docker-compose build

run-tests:
	docker-compose run --rm serverless npm test

test: build run-tests
