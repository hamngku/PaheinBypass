import PaheinBypass from "./PaheinBypass.js";
import { createInterface } from "readline";

const readline = createInterface({
    input: process.stdin,
    output: process.stdout
});

const readLineAsync = msg => {
    return new Promise(resolve => {
        readline.question(msg, userRes => {
            resolve(userRes);
        });
    });
}

const startApp = async() => {
    /*  
        PAHE.in File Hosting
        1F, GD, MG, MU, PD, SD, SND, UTB
        1fichier.com, drive.google.com, mega.nz, megaup.net ,pixeldrain.com, send.cm, uptobox.com
        ["1F", "GD", "MG", "MU", "PD", "SD", "SND", "UTB"]
    */
    const paheLink = await readLineAsync("* Enter Pahe.in (pahe.li) Download Link: ");
    try {
        const paheBypass = new PaheinBypass(paheLink);
        console.log("* Finding all the download links on this page."); 
        console.log("* Avalible host file: 1F, GD, MG, MU, PD, SD, SND, UTB")
        const filterHost = await readLineAsync("* To filter which hosts to include, input them like this: GD, MG, etc\n  If you don't want to filter, just type 'NO' and press enter: ");
        const filterHostArr = filterHost.toLowerCase() === 'no' ? [] : filterHost.split(',');
        const links = await paheBypass.getAllLinks(filterHostArr);
        console.log(`* Done here all the links`); 
        console.info(links);
    } catch (error) {
        console.error(error);
    }
    readline.close();
}

startApp();