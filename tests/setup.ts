import "@testing-library/jest-dom"
import { beforeAll, afterEach, afterAll } from "vitest"
import { cleanup } from "@testing-library/react"

beforeAll(() => {
  // Setup code before all tests
})

afterEach(() => {
  // Cleanup after each test
  cleanup()
})

afterAll(() => {
  // Cleanup code after all tests
})
