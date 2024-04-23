import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import 'dotenv/config'


const app = express();
const port = 3000;
const API_URL = "https://api-football-v1.p.rapidapi.com/v3";
const apiKey = `${process.env.FOOTBALL_APP_API_KEY}`

const config = {headers: {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
  }}


app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
var leagueId;
var specifiedDate;
var specifiedSeason;

function getSeason(date){
    var year = parseInt(date.slice(0,5));
    var month = parseInt(date.slice(6,8));
    var day = parseInt(date.slice(9));

    if(month < 6){
        year -= 1;
    }

    return year;
}

app.get("/", (req,res)=>{
    res.render("index.ejs");
})

app.get("/LeagueFixtures/:id/:date", async (req,res) => {
    leagueId = req.params.id;
    specifiedDate = req.params.date;
    specifiedSeason = getSeason(specifiedDate);
    
    axios.all([
        axios.get(API_URL + "/fixtures", {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            params:{
                league: leagueId,
                date: specifiedDate,
                season: specifiedSeason
            } 

        }),
        axios.get(API_URL + "/standings", {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            params: {
                league: leagueId,
                season: specifiedSeason
            }
        })
    ])
    .then(axios.spread((obj1, obj2)=>{
        const fixturesResult = obj1.data.response;
        const standings = obj2.data.response;
        res.render("fixturePage.ejs", {fixtures: fixturesResult, standings: standings[0]});

    }));
});

app.post("/DateFixtures", async (req,res) => {
    specifiedDate = req.body["date"];
    specifiedSeason = getSeason(specifiedDate);
    axios.all([
        axios.get(API_URL + "/fixtures", {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            params:{
                league: leagueId,
                date: specifiedDate,
                season: specifiedSeason
            }
        }),
        axios.get(API_URL + "/standings", {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            params: {
                league: leagueId,
                season: specifiedSeason
            }
        })
    ])
    .then(axios.spread((obj1,obj2)=>{
        const fixtures = obj1.data.response;
        const standings = obj2.data.response;
        res.render("fixturePage.ejs", {fixtures:fixtures, specifiedDate: specifiedDate, standings:standings[0]});
    }));
});

app.get("/matchDetails/:matchid/:homeId/:awayId", async (req,res) =>{
    const matchId = req.params.matchid;
    const homeId = req.params.homeId;
    const awayId = req.params.awayId;
    //Use axios.all to be able to call multiple endpoints with one call 
    axios.all([
        axios.get(API_URL + "/odds", {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            params: {
                fixture: matchId,
                bet: '1',
                bookmaker:"8"
            }
        }),
        axios.get(API_URL + "/standings", {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            params: {
                league: leagueId,
                team: homeId,
                season: specifiedSeason
            }
        }),
        axios.get(API_URL + "/standings", {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            params: {
                league: leagueId,
                team: awayId,
                season: specifiedSeason
            }
        }),
        axios.get(API_URL + "/fixtures/lineups", {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            params: {
                fixture: matchId
            }     
        }),
        axios.get(API_URL + "/fixtures",{
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            params: {
                id: matchId
            }
        })
    ])
    .then(axios.spread((obj1, obj2, obj3, obj4, obj5)=>{
        const odds = obj1.data.response;
        const homeStandings = obj2.data.response;
        const awayStandings = obj3.data.response;
        const lineups = obj4.data.response;
        const venue = obj5.data.response;
        res.render("matchPage.ejs", {odds:odds[0],homeStandings: homeStandings[0], awayStandings: awayStandings[0], homeLineup: lineups[0], awayLineup: lineups[1], venue: venue[0]});
    }));
})




app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });