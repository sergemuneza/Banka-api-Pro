const { transform } = require("@babel/core");

module.exports = {
    transform: {
        "^.+\\.js$": "babel-jest",
    },
};