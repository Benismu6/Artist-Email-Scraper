const fs = require('fs').promises;
const axios = require('axios');
const cheerio = require('cheerio');
const { console } = require('inspector');
const nodeMailer = require('nodemailer');

async function fetchFilteredArtists(artists) {
    try {
        // Axios and cheerio to get html document and parse for wanted data
        const response = await axios.get('http://www.popvortex.com/music/charts/top-rap-songs.php');
        const $ = cheerio.load(response.data);
        const filterResults = [];  // Array of Tuples to store Artist name and song title
        
        // Get artists to filter from command line and change case to small case
        const artistsLowerCase = artists.map(artist => artist.toLowerCase());

        $('p.title-artist').each((i, element) => {
            // Temporaly save song title and artist name
            const songTitle = $(element).find('.title').text();
            const artistName = $(element).find('.artist').text();
            console.log(`Rank: ${i}, Song: ${songTitle}, Artist: ${artistName}`);

            // Check if desired artists are in top25
            if (artistsLowerCase.includes(artistName.toLowerCase())) {
                filterResults.push([songTitle, artistName]);
            }
            
            // Quit loop after getting top 25
            if (i == 25) return false;
            
        });
        
        return filterResults;
    }catch (error) {
        console.error('Error reading file:', error);
    }
}

function sendEmail(filteredResults, artists) {
    // create transporter
    const transporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'yameanben@gmail.com',
            pass: 'cosc-484'
        }
    });

    // Format email content
    let emailContent = '';
    filteredResults.forEach(([songTitle, artistName]) => {
        emailContent += `<b>${artistName}</b>, <i>${songTitle}</i><br>`;
    });

    // Condition to send mail only if there's valid results
    if (filteredResults.length > 0) {
        const mailOptions = {
            from: 'yameanben@gmail.com',
            to: "yameanben@gmail.com",
            subject: `Your artists are: ${artists.join(", ")}`,
            html: emailContent
        };

        // Send mail using nodemailer
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
            } else {
                console.log('Email sent: ', info.response)
            }
        });
    }
}

async function main() {
    console.log("Full arguments", process.argv);
    // Get artists from command line 
    const artists = process.argv.slice(2);
    console.log(artists);

    const results = await fetchFilteredArtists(artists);
    // sendEmail(results, artists);

    console.log(results);
}

main();