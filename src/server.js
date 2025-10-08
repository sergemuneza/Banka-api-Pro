/*
Developer:
- SERGE MUNEZA
*/

import app from "./app.js";

const PORT = process.env.PORT || 5100;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server; // Export server for testing

