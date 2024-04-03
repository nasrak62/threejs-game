# General Coding Practices

-   simple code
-   clean code
-   optimize code

## functions

1. a function / method should be short (<= 30L top)
    1. https://www.linkedin.com/pulse/rule-30-when-your-method-class-packages-too-big-maaz-rehman/
2. a function should have a single responsibility, if a function does 2 things it should be broken down into two functions

```python
    # ❌ bad
    def get_good_apples_and_oranges():
        good_apples = []
        good_oranges = []

        for apple in apples:
            if apple.is_good:
                good_apples.append(apple)

        for orange in oranges:
            if orange.is_good:
                good_oranges.append(orange)


        return good_apples + good_oranges





    # ✅ good
    def get_good_apples():
        good_apples = []

        for apple in apples:
            if apple.is_good_apple:
                good_apples.append(apple)

        return good_apples


    def get_good_oranges():
        good_oranges = []

        for orange in oranges:
            if orange.is_good_orange:
                good_oranges.append(orange)


    def get_good_fruits():
        good_oranges = get_good_oranges()
        good_apples = get_good_apples()


        return good_apples + good_oranges

```
