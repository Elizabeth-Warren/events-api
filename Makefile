build:
	docker-compose build

run-tests:
	docker-compose run --rm -e MONGODB_URI serverless npm test

test: build run-tests
