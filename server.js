const express = require('express');
const cors = require("cors");
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
const users = [
    {
        userId: 1,
        username: "john",
        password: "john9090",
        isAdmin: true
    },
    {
        userId: 2,
        username: "tim",
        password: "tim8888",
        isAdmin: false
    }
];
var refreshTokens = [];

const getAccessToken = (user) => {
    return jwt.sign({ userid: user.userId, isAdmin: user.isAdmin }, "myPassword123", { expiresIn: "30s" })
}
const getRefreshToken = (user) => {
    return jwt.sign({ userid: user.userId, isAdmin: user.isAdmin }, "myRefreshPassword123",)
}

const verify = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, "myPassword123", (err, user) => {
            if (err)
                res.status(403).json("token is not valid");

            req.user = user;
            next();
        })
    }
    else {

        res.status(401).json("you are not authroised")
    }
}

app.post("/api/refresh", (req, res) => {

    const token = req.body.token;

    if (!token)
        res.status(401).json("token is not valid");

    if (!refreshTokens.includes(token))
        res.status(401).json("Invalid refresh token");


    jwt.verify(token, "myRefreshPassword123", (err, user) => {
        if (err)
            res.status(403).json("token is not valid");


        refreshTokens = refreshTokens.filter(x => x !== token);

        const accessToken = getAccessToken(user);
        const refreshToken = getRefreshToken(user);
        refreshTokens.push(refreshToken);

        res.status(200).json({
            accessToken,
            refreshToken
        })
    });
})

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(x => x.username === username && x.password === password);
    if (user) {
        const accessToken = getAccessToken(user);
        const refreshToken = getRefreshToken(user);
        refreshTokens.push(refreshToken);
        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            req: JSON.stringify(req.headers),
            accessToken,
            refreshToken
        });
    }
    else {
        res.send("No matching users");
    }

})

app.post("/logout", (req, res) => {
    const token = req.body.token;
    refreshTokens = refreshTokens.filter(x => x !== token);
    res.status(200).json("user logged out");
})

app.delete("/api/users/:userId", verify, (req, res) => {
    res.status(200).json("deleted")
})

app.listen(5000, () => { console.log("server app is running") })