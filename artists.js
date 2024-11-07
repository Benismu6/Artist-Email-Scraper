const fs = require('fs').promises;
const axios = require('axios');
const cheerio = require('cheerio');

async function fetchTop25() {
    try {
        const response = await axios.get('http://www.popvortex.com/music/charts/top-rap-songs.php');
        const $ = cheerio.load(response.data);
        const filterResults = [[]];
        
        // Get artists to filter from command line
        const artists = process.argv.slice(2);

        $('p.title-artist').each((i, element) => {
            const songTitle = $(element).find('.title').text();
            const artistName = $(element).find('.artist').text();
            // console.log(`Rank: ${i}, Song: ${songTitle}, Artist: ${artistName}`);

            if (artists.includes(artistName)) {
                filterResults.push([songTitle, artistName]);
            }
            
            if (i == 25) {
                return false;
            }
            
        });

        console.log(filterResults);

    }catch (error) {
        console.error('Error reading file:', error);
    }
}


fetchTop25();