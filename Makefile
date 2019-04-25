build:
	docker-compose build

run-tests:
	docker-compose run --rm -e MONGODB_URI -e MOBILIZE_AMERICA_API_KEY serverless npm test --delay

test: build run-tests
