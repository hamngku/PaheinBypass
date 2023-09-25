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
    const downloadLink = await readLineAsync("* Enter Pahe.in (pahe.li) Download Link: ");
    console.log("* Processing...");  
    const paheBypass = new PaheinBypass(downloadLink);
    const directLink = await paheBypass.directLink;
    console.log("* Direct Link: " + directLink);
    readline.close();
}

startApp();