const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const rateLimiter = require('express-rate-limit');
const compression = require('compression');

app.use(compression({
    level: 5,
    threshold: 0,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

app.set('view engine', 'ejs');
app.set('trust proxy', 1);
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
    );
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url} - ${res.statusCode}`);
    next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, headers: true }));

// Handling player login dashboard
app.all('/player/login/dashboard', function (req, res) {
    const tData = {};
    try {
        const uData = JSON.stringify(req.body).split('"')[1].split("\\n");
        const uName = uData[0].split("|");
        const uPass = uData[1].split("|");
        for (let i = 0; i < uData.length - 1; i++) {
            const d = uData[i].split("|");
            tData[d[0]] = d[1];
        }
        if (uName[1] && uPass[1]) {
            res.redirect('/player/growid/login/validate');
        }
    } catch (why) {
        console.log(`Warning: ${why}`);
    }

    res.render(__dirname + '/public/html/dashboard.ejs', { data: tData });
});

// Validating login details
app.all('/player/growid/login/validate', (req, res) => {
    console.log(req.body);
    let growId = req.body.growId;
    let password = req.body.password;

    if (!growId || !password) {
        // If growId or password is missing, use default
        growId = "guest";
        password = "guest";
    }

    const token = Buffer.from(`&growId=${growId}&password=${password}`).toString('base64');

    res.send(
        `{"status":"success","message":"Account Validated.","token":"${token}","url":"","accountType":"growtopia"}`
    );
});

// Checking token and sending to server
app.all("/player/growid/checktoken", (req, res) => {
    console.log(req.body);
    const refreshToken = req.body.refreshToken;
    console.log(refreshToken);
    res.send(
      `{"status":"success","message":"Account Validated.","token": "${refreshToken}","url":"","accountType":"growtopia"}`
    );
});

// Handling other paths
app.all('/player/*', function (req, res) {
    res.status(301).redirect('https://api.yoruakio.tech/player/' + req.path.slice(8));
});

// Main route (for testing)
app.get('/', function (req, res) {
    res.send('Hello World!');
});

// Listening on port 5000
app.listen(5000, function () {
    console.log('Listening on port 5000');
});
