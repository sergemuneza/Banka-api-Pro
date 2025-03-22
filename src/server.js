/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/

import app from "./app.js";

const PORT = process.env.PORT || 5100;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server; // Export server for testing

