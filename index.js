const fs = require('fs').promises;
const axios = require('axios');

const defaultHeaders = {
    'user-agent': 'Dart/3.6 (dart:io)',
    'accept': '*/*',
    'accept-encoding': 'gzip',
    'host': 'api.airdroptoken.com'
};

const API_ENDPOINTS = {
    payouts: 'https://api.airdroptoken.com/airdrops/payouts',
    miners: 'https://api.airdroptoken.com/miners/',
    minerDetail: 'https://api.airdroptoken.com/miners/miner/'
};

async function getTokens() {
    try {
        const data = await fs.readFile('tokens.txt', 'utf8');
        return data.split('\n').map(t => t.trim()).filter(t => t);
    } catch (error) {
        return [];
    }
}

async function startMining() {
    const tokens = await getTokens();
    if (tokens.length === 0) {
        console.error('No valid tokens found. Create tokens.txt with one token per line.');
        return;
    }
    
    console.log(`*********************************************
*     MULTI-ACCOUNT MIRA NETWORK MINING     *
*     recode by VYUGRAA                     *
*     https://github.com/vyugraa            *
*********************************************
*     (Running ${tokens.length} accounts)                 *
*********************************************`);
    
    while (true) {
        for (const [index, token] of tokens.entries()) {
            const accountNumber = index + 1;
            try {
                const minerData = await makeApiRequest(API_ENDPOINTS.minerDetail, token);
                console.log(`
ACCOUNT #${accountNumber} STATUS 
Token: ${token.substring(0, 5)}...
Time Left: ${minerData?.object?.mining_time_left || 0}s
ADT/hour: ${minerData?.object?.adt_per_hour || 0}
`);
                
                // Background requests
                await makeApiRequest(API_ENDPOINTS.payouts, token);
                await makeApiRequest(API_ENDPOINTS.miners, token);
                
            } catch (error) {
                console.error(`
ACCOUNT #${accountNumber} ERROR 
${error.message}
`);
            }
        }
        
        // Menampilkan countdown timer
        await new Promise(resolve => {
            let timeLeft = 30;
            const timer = setInterval(() => {
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(`NEXT CYCLE IN ${timeLeft}s`);
                timeLeft--;
                
                if (timeLeft < 0) {
                    clearInterval(timer);
                    process.stdout.write('\n');
                    resolve();
                }
            }, 1000);
        });
    }
}

async function makeApiRequest(endpoint, token) {
    try {
        const response = await axios.get(endpoint, {
            headers: {
                ...defaultHeaders,
                'authorization': `Bearer ${token}`
            },
            timeout: 30000
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
}

process.on('SIGINT', () => {
    console.log('\nStopping mining process...');
    process.exit(0);
});

startMining();
