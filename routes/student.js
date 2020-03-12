const express = require("express"),
    router = express.Router(),
    request = require("request"),
    middleware = require("../middleware"),
    cors = require("cors"),
    // Pokemon = require("../models/pokemon"),
    // Comment = require("../models/comments"),
    Faculty = require("../models/faculty"),
    Student = require("../models/student"),
    passport = require("passport");
const fs = require("fs");
const multer = require("multer");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const path = require("path");

//==========================================================================
//download file

// const mongoUrl =
//     "mongodb+srv://raghav:qwerty12345@cluster0-lru38.mongodb.net/test?retryWrites=true&w=majority";
// const conn = mongoose.createConnection(mongoUrl);
// let gfs;
// conn.once("open", function() {
//     gfs = Grid(conn.db, mongoose.mongo);
//     gfs.collection("uploads");
// });
// const storage = new GridFsStorage({
//     url: mongoUrl,
//     file: (req, file) => {
//         return new Promise((resolve, reject) => {
//             const fileInfo = {
//                 filename: file.originalname,
//                 bucketName: "uploads"
//             };
//             resolve(fileInfo);
//         });
//     }
// });
// const upload = multer({ storage });
//show reg form
// router.get("/new", (req, res) => {
//     res.render("signup");
// });

//==========================================================================

//create a new student
router.post("/", function(req, res) {
    var newUser = new Student({ username: req.body.username, role: "Student" });
    Student.register(newUser, req.body.password, function(error, user) {
        if (error) {
            console.log(error.message);
            // req.flash('error', error.message);
            return res.redirect("/signup");
        }
        passport.authenticate("student")(req, res, function() {
            // req.flash("success", "Welcome " + user.username);
            res.redirect("/");
        });
    });
});

//==========================================================================

//show login form
router.get("/login", (req, res) => {
    res.render("/login");
});

//==========================================================================
//handle login logic

router.post(
    "/login",
    passport.authenticate("student", {
        successRedirect: "/student",
        failureRedirect: "/student/login"
    }),
    function(req, res) {}
);

//==========================================================================
//logout route

router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

//==========================================================================
//show resource page

router.get("/", middleware.isStudent, (req, res) => {
    console.log(req.query);
    let keywords;
    //==========================================================================
    //running python script

    var spawn = require("child_process").spawn;
    var process = spawn("python", ["./app.py"]);
    process.stdout.on("data", function(data) {
        keywords = data.toString();
        keywords = keywords.substring(1, keywords.length);
        keywords = keywords.split(",");
        x = keywords[1];
        for (var i = 2; i < 4; i++) {
            x += "+" + keywords[i];
        }
        let query = x;
        // let query = req.query.topic;
        var parj = "citedby-count",
            pary = "relevance",
            parb = "relevance",
            parg = "stars";
        if (req.query.journal != undefined) parj = req.query.jounals;
        if (req.query.video != undefined) pary = req.query.video;
        if (req.query.book != undefined) parb = req.query.book;
        if (req.query.project != undefined) parg = req.query.project;

        if (query == null) query = "computer science";
        console.log(query);
        let url =
            "https://api.elsevier.com/content/search/scopus?query=" +
            query +
            "&sort=" +
            parj +
            "&count=4&apikey=c8b5999be830e938f47c956e63168fad&format=json";
        request(url, (err, response, body) => {
            if (!err && response.statusCode === 200) {
                var data = JSON.parse(body);
                let url2 =
                    "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" +
                    query +
                    "&order=" +
                    pary +
                    "&type=video&maxResults=4&key=AIzaSyCcagNgMX6WBzu-Lw5xWjJyiafAnQQl6bU";
                request(url2, (error, resp, bd) => {
                    if (!error && resp.statusCode === 200) {
                        var data2 = JSON.parse(bd);
                        var urlb =
                            "https://www.googleapis.com/books/v1/volumes?q=" +
                            query +
                            "&maxResults=4&orderBy=" +
                            parb +
                            "&key=AIzaSyBM8K8711ozt2BRO7gKIBxctzAMHedFdPA";

                        request(urlb, (errb, respb, bb) => {
                            if (!errb && respb.statusCode == 200) {
                                var db = JSON.parse(bb);
                                var urlg =
                                    "https://api.github.com/search/repositories?q=" +
                                    query +
                                    "&sort=" +
                                    parg +
                                    "&order=desc&per_page=4";
                                if (parg == "default")
                                    urlg =
                                        "https://api.github.com/search/repositories?q=" +
                                        query +
                                        "&per_page=4";
                                var options = {
                                    url: urlg,
                                    headers: {
                                        "User-Agent": "request"
                                    }
                                };
                                request(options, (errg, respg, bg) => {
                                    if (!errg && respg.statusCode == 200) {
                                        var dg = JSON.parse(bg);
                                        res.render("resources", {
                                            data: data,
                                            data2: data2,
                                            data3: db,
                                            data4: dg,
                                            query: query
                                        });
                                    } else {
                                        console.log(respg.statusCode);
                                        res.render("resources", {
                                            data: data,
                                            data2: data2,
                                            data3: db,
                                            data4: undefined,
                                            query: query
                                        });
                                    }
                                });
                            } else {
                                console.log(errb + " " + respb + "book");
                                res.render("resources", {
                                    data: data,
                                    data2: data2,
                                    data3: undefined,
                                    data4: undefined,
                                    query: query
                                });
                            }
                        });
                    } else {
                        console.log(error + " " + resp + "youtube");
                        res.render("resources", {
                            data: data,
                            data2: undefined,
                            data3: undefined,
                            data4: undefined,
                            query: query
                        });
                    }
                });
            } else {
                console.log(err + " " + response + "scopus");
                res.render("resources", {
                    data: undefined,
                    data2: undefined,
                    data3: undefined,
                    data4: undefined,
                    query: query
                });
            }
        });
    });
});

//==========================================================================
module.exports = router;