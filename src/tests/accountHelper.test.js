/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/

import { generateAccountNumber } from "../utils/accountHelper.js";

describe("Account Helper Functions", () => {
  it("✅ Should generate a valid account number", () => {
    const accountNumber = generateAccountNumber();
    expect(accountNumber).toMatch(/^BA\d{10}$/); // Ensure valid format
  });
});
