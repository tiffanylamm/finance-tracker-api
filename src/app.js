"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var port = process.env.PORT;
var app = (0, express_1.default)();
app.listen(port, function () {
    console.log("Listening on port:", port);
});
