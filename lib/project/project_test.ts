import { assertEquals } from "https://deno.land/std@0.102.0/testing/asserts.ts";

Deno.test("A should equal A", () => {
  assertEquals("a", "a");
});
