# [0.8.0]

## Feature

- posts: Added isLikedByCurrentUser and count to all like-related routes (like, unlike, countLikes, like-toggle)

## Improvement

- posts: Improved response structure and unified like endpoints for a better user experience

# [0.7.0]

## Feature

- posts: new endpoint for get posts by user

# [0.6.0]

## Feature

- users: Added new field ( bio , skills , university )

# [0.5.0]

## Feature

- connection: Implemented a new module for managing user connections (friendship system).
- users: new dto for better transfer data between modules(connections and users).

## Improvement

- Discussed and applied naming conventions (camelCase in TypeScript, snake_case for database columns where
  applicable).

# [0.4.0]

## feature

- add deploy workflow for ci cd

# [0.3.0]

## feature

- likes: add and implement module likes
- posts: implement like posts

# [0.2.0]

## fix

- auth: fix jwt check guard

## improvement

- users: improve upload profile scenario
- auth: encrypt password before save

## feature

- posts: add endpoints crud
- files: add endpoints crud
- common: add public interface and schedule clean files

# [0.1.1]

## feature

- auth: add endpoint signup and sign in
- users: add endpoint update profile and get profile

# [0.1.0]

## feature

- init