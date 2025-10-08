/*
Developer:
- SERGE MUNEZA
*/

import { generateAccountNumber } from "../utils/accountHelper.js";

describe("Account Helper Functions", () => {
  it("✅ Should generate a valid account number", () => {
    const accountNumber = generateAccountNumber();
    expect(accountNumber).toMatch(/^BA\d{10}$/); // Ensure valid format
  });
});
