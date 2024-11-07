const fs = require('fs').promises;
const axios = require('axios');
const cheerio = require('cheerio');
const nodeMailer = require('nodemailer');

async function fetchTop25() {
    try {
        // Axios and cheerio to get html document and parse for wanted data
        const response = await axios.get('http://www.popvortex.com/music/charts/top-rap-songs.php');
        const $ = cheerio.load(response.data);
        const filterResults = [[]];  // Array of Tuples to store Artist name and song title
        
        // Get artists to filter from command line and change case to small case
        const artists = process.argv.slice(2);
        const artistsLowerCase = artists.map(artist => artist.toLowerCase());

        $('p.title-artist').each((i, element) => {
            // Temporaly save song title and artist name
            const songTitle = $(element).find('.title').text();
            const artistName = $(element).find('.artist').text();
            // console.log(`Rank: ${i}, Song: ${songTitle}, Artist: ${artistName}`);

            // Check if desired artists are in top25
            if (artistsLowerCase.includes(artistName.toLowerCase())) {
                filterResults.push([songTitle, artistName]);
            }
            
            // Quit loop after getting top 25
            if (i == 25) {
                return false;
            }
            
        });

        console.log(filterResults);

    }catch (error) {
        console.error('Error reading file:', error);
    }
}

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'yameanben@gmail.com',
        pass: 'cosc-484'
    }
});

let emailContent = '';
filterResults.forEach(([songTitle, artistName]) => {
    emailContent += `<b>${artistName}<b>, <i>${songTitle}</i><br>`;
});

fetchTop25();