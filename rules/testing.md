# Unit Testing Guide

Create or update unit tests for every feature change. Test core behavior and public contracts, not dummy or demo data. Run `npm test` alongside lint and build after implementation when Node.js is available.

## Data-driven convention

All unit tests must follow a data-driven structure.

For each function or behavior under test:

1. Define test cases as explicit data.
2. Every case must contain `name`, `input`, and `expected` properties.
3. When multiple scenarios test the same operation, store them in a list or array.
4. Execute the cases using a single parameterized test with `it.each` or `test.each`.
5. Keep test data separate from test execution logic.
6. Define expected outputs explicitly; do not derive them using the implementation logic under test.
7. Prefer structured input objects over positional arguments for non-trivial functions.
8. Keep tests deterministic and isolated from uncontrolled external state.
9. Represent error scenarios as test data too.
10. Do not create multiple nearly identical test bodies when only the input or expected output changes.

Preferred structure:

```ts
const cases = [
  {
    name: 'describes the scenario',
    input: { value: 'example' },
    expected: { result: 'expected value' },
  },
]

describe('functionName', () => {
  it.each(cases)('$name', ({ input, expected }) => {
    const actual = functionName(input)
    expect(actual).toEqual(expected)
  })
})
```
