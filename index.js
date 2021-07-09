const app = require('express')();
const fetch = require('node-fetch');
const redis = require('redis');

require('dotenv').config();
const PORT = process.env.SERVER_PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const setResponse = (username, repos) => { return `<h3><i>${username} has ${repos} public github repos.</i></h3>`; }

// Fetch data from Github
const getRepos = async (req, res, _next) =>
    {
        try
        {
            console.log('Fetching Data...');

            const { username } = req.params;
            const response = await fetch(`https://api.github.com/users/${username}`);
            const data = await response.json();
            const repos = data.public_repos;

            // Set data to Redis
            client.setex(username, (60 * 60), repos);

            res.send(setResponse(username, repos));
        }
        catch (err)
        {
            console.error(err);
            res.status(500);
        };
    };

// Middleware
const cache = (req, res, next) =>
    {
        const { username } = req.params;

        client.get(username, (err, data) =>
        {
            if (err) throw err;

            if (data !== null) res.send(setResponse(username, data));
            else next();
        });
    };


// Route
app.get('/repos/:username', cache, getRepos);

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));