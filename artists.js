const fs = require('fs').promises;
const axios = require('axios');
const cheerio = require('cheerio');
const nodeMailer = require('nodemailer');

// Function to fetch and filter artists based on the webpage
async function fetchFilteredArtists(artists) {
    try {
        const response = await axios.get('http://www.popvortex.com/music/charts/top-rap-songs.php');
        const $ = cheerio.load(response.data);  // Load HTML into Cheerio for parsing
        const filterResults = []; // Array to store artist names and song titles
        const seenResults = new Set();  // Set to track unique combinations
        
        // Store desired artist names in lowercase
        const artistsLowerCase = artists.map(artist => artist.toLowerCase());

        $('p.title-artist').each((i, element) => {
            const songTitle = $(element).find('.title').text();            
            const artistName = $(element).find('.artist').text();
    
            // Check if full artist name or song title matches desired artists
            const fullArtistKey = `${songTitle}-${artistName.toLowerCase()}`;
            if ((artistsLowerCase.includes(artistName.toLowerCase()) || artistsLowerCase.includes(songTitle.toLowerCase())) && !seenResults.has(fullArtistKey)) {
                filterResults.push([songTitle, artistName]);
                seenResults.add(fullArtistKey);
            }

            const exceptions = ["Tyler, the Creator"]; // List of names to skip splitting

            // Separate artists if they are listed with ',' or '&', except exceptions
            const individualArtists = artistName
                .split(/,|&/)                      // Split by both `,` and `&`
                .flatMap(name => exceptions.includes(name.trim()) ? [name.trim()] : name.split(',').map(part => part.trim()))  // Check exceptions
                .map(name => name.toLowerCase());   // Convert to lowercase for uniformity

            // Check each individual artist against the desired artists
            individualArtists.forEach(individualArtist => {
                const individualKey = `${songTitle}-${individualArtist}`;
                if (artistsLowerCase.includes(individualArtist) && !seenResults.has(individualKey)) {
                    filterResults.push([songTitle, individualArtist]);
                    seenResults.add(individualKey);
                }
            });
            
            // Check for featured artists in song title
            const featuredMatch = songTitle.match(/\(feat\. (.*?)\)/i);
            if (featuredMatch) {
                const featuredArtistsText = featuredMatch[1];
                
                // Split featured artists by ',' or '&' and trim each name
                const featuredArtists = featuredArtistsText.split(/,|&/).map(name => name.trim().toLowerCase());

                // Check if any featured artist matches desired artists
                featuredArtists.forEach(featuredArtist => {
                    const featuredKey = `${songTitle}-${featuredArtist}`;
                    if (artistsLowerCase.includes(featuredArtist) && !seenResults.has(featuredKey)) {
                        filterResults.push([songTitle, featuredArtist]);
                        seenResults.add(featuredKey);
                    }
                });
            }

            // Stop after the top 25
            if (i === 24) return false;
        });

        return filterResults;  // Return the list of songs and artists
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// function to get credentials from json file
async function loadCredentials() {
    try {
        const data = await fs.readFile('credentials.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading credentials: ", error);
    }
}

// Function to send mail
async function sendEmail(filteredResults, artists) {
    // Load credentials
    const {from, to, senderEmail, senderPassword} = await loadCredentials();

    // create transporter
    const transporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: senderEmail,
            pass: senderPassword
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
            from: from,
            to: to,
            subject: `Your artists are: ${artists}`,
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
    } else {
        console.log("Email not sent because artists are not specified or not in Top25");
        process.exit(1);
    }
}

// Main function to call fetchFilteredArtists and print results
async function main() {
    // Get artists from command line (if any are provided)
    const artists = process.argv.slice(2);

    // Fetch the top 25 artists and songs, ignoring the filter
    const results = await fetchFilteredArtists(artists);
    // console.log(results); print results
    
    // send email
    sendEmail(results, artists);
}

main();
