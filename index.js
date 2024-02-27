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
    const paheLink = await readLineAsync("* Enter Pahe.in (pahe.ink) Download Link: ");
    try {
        const paheBypass = new PaheinBypass(paheLink);
        console.info("* Finding all the download links on this page."); 
        const getAllLinks = await paheBypass.getAllLinks();
        console.info(`* Avalible host file: ${getAllLinks.hostsAvailable.join(", ")}`);
        const filterHost = await readLineAsync("* To filter which hosts to include, input them like this: GD, MG, etc\n  If you don't want to filter, just type 'NO' or just press enter: ");
        const filterHostArr = filterHost.toLowerCase() === 'no' || filterHost === "" ? [] : filterHost.split(',');
        console.info("* Trying to get direct links download.");
        const getBypassHostLinks = await paheBypass.getBypassHostLinks(filterHostArr);
        console.info(`* Done here all the links`); 
        console.info(getBypassHostLinks);
    } catch (error) {
        console.error(error);
    }
    readline.close();
}

startApp();
