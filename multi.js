const axios = require('axios');
const { ethers } = require('ethers');
const fs = require('fs').promises;
const readline = require('readline');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');
const chalk = require('chalk').default;

// Helper function to generate a random user agent string
function getRandomUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPad; CPU OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:91.0) Gecko/20100101 Firefox/91.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Default configuration
const defaultConfig = {
  baseUrl: 'https://back.aidapp.com',
  campaignId: '6b963d81-a8e9-4046-b14f-8454bc3e6eb2',
  excludedMissionId: 'f8edb0b4-ac7d-4a32-8522-65c5fb053725',
  headers: {
    'accept': '*/*',
    'origin': 'https://my.aidapp.com',
    'referer': 'https://my.aidapp.com/',
    'user-agent': 'default'
  }
};

// The four task IDs (missions) you want to complete
const taskIds = [
  'f8a1de65-613d-4500-85e9-f7c572af3248',
  '34ec5840-3820-4bdd-b065-66a127dd1930',
  '2daf1a21-6c69-49f0-8c5c-4bca2f3c4e40',
  'df2a34a4-05a9-4bde-856a-7f5b8768889a'
];

// Helper: Shuffle an array in place (Fisher-Yates)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Load proxies from file (one per line)
async function loadProxies() {
  try {
    const content = await fs.readFile('proxies.txt', 'utf8');
    return content.trim().split('\n').filter(proxy => proxy.length > 0);
  } catch (error) {
    console.error(chalk.red('Error reading proxies.txt:'), error.message);
    return [];
  }
}

// Load referral codes from refs.txt (one per line)
async function loadReferrals() {
  try {
    const content = await fs.readFile('refs.txt', 'utf8');
    return content.trim().split('\n').filter(ref => ref.length > 0);
  } catch (error) {
    console.error(chalk.red('Error reading refs.txt:'), error.message);
    return [];
  }
}

// Create an axios instance that forces requests through the proxy and sets a random user-agent
function createAxiosInstance(proxy) {
  const headers = { ...defaultConfig.headers, 'user-agent': getRandomUserAgent() };
  if (proxy) {
    return axios.create({
      proxy: false, // disable axios' built-in proxy handling
      httpAgent: new HttpProxyAgent(proxy),
      httpsAgent: new HttpsProxyAgent(proxy),
      headers: headers
    });
  } else {
    return axios.create({ headers: headers });
  }
}

// Function to ask user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Create a new wallet
function createWallet() {
  const wallet = ethers.Wallet.createRandom();
  console.log(chalk.green(`New Wallet: ${wallet.address}`));
  return wallet;
}

// Save account details (including the referral used)
async function saveAccount(wallet, refCode) {
  const data = `Address: ${wallet.address}\nPrivateKey: ${wallet.privateKey}\nRefCode: ${refCode}\n\n`;
  await fs.appendFile('accounts.txt', data);
  console.log(chalk.blue('Account saved to accounts.txt'));
}

// Save access token to token.txt
async function saveToken(token) {
  await fs.appendFile('token.txt', `${token}\n`);
  console.log(chalk.yellow('Access token saved to token.txt'));
}

// Sign an authentication message
async function signMessage(wallet, message) {
  return wallet.signMessage(message);
}

// Login function using the wallet and referral code
async function login(wallet, referralCode, axiosInstance) {
  const timestamp = Date.now();
  const message = `MESSAGE_ETHEREUM_${timestamp}:${timestamp}`;
  const signature = await signMessage(wallet, message);
  const url = `${defaultConfig.baseUrl}/user-auth/login?strategy=WALLET&chainType=EVM&address=${wallet.address}&token=${message}&signature=${signature}&inviter=${referralCode}`;
  try {
    const response = await axiosInstance.get(url);
    console.log(chalk.green(`Login Success for ${wallet.address}`));
    await saveAccount(wallet, response.data.user.refCode);
    await saveToken(response.data.tokens.access_token);
    return response.data.tokens.access_token;
  } catch (error) {
    console.error(chalk.red(`Login Failed for ${wallet.address}:`), error.response?.data || error.message);
    return null;
  }
}

// Complete a mission (task)
async function completeMission(missionId, accessToken, axiosInstance) {
  try {
    console.log(chalk.cyan(`Attempting to complete mission: ${missionId}`));
    await axiosInstance.post(`${defaultConfig.baseUrl}/questing/mission-activity/${missionId}`, {}, {
      headers: { ...defaultConfig.headers, 'authorization': `Bearer ${accessToken}` }
    });
    console.log(chalk.green(`Mission ${missionId} completed successfully!`));
    return true;
  } catch (error) {
    console.error(chalk.red(`Error completing mission ${missionId}`), error.response?.data || error.message);
    return false;
  }
}

// Claim reward for a mission (task)
async function claimMissionReward(missionId, accessToken, axiosInstance) {
  try {
    console.log(chalk.cyan(`Claiming reward for mission: ${missionId}`));
    await axiosInstance.post(`${defaultConfig.baseUrl}/questing/mission-reward/${missionId}`, {}, {
      headers: { ...defaultConfig.headers, 'authorization': `Bearer ${accessToken}` }
    });
    console.log(chalk.green(`Reward for mission ${missionId} claimed successfully!`));
    return true;
  } catch (error) {
    console.error(chalk.red(`Error claiming reward for mission ${missionId}`), error.response?.data || error.message);
    return false;
  }
}

// Helper to obfuscate a token (shows first 4 and last 4 characters)
function obfuscateToken(token) {
  if (token.length <= 8) return token;
  return token.substring(0, 4) + '****' + token.substring(token.length - 4);
}

// Main function: For each account, create a wallet, randomly select a referral from refs.txt, use a proxy (with HTTP & HTTPS agents), perform an IP lookup via ip-api.com using a fresh axios.get call, login, then complete all four tasks in a random order.
async function main() {
  const proxies = await loadProxies();
  if (proxies.length === 0) {
    console.log(chalk.yellow('No proxies found, proceeding without proxies.'));
  }
  
  const referrals = await loadReferrals();
  if (referrals.length === 0) {
    console.log(chalk.yellow('No referrals found in refs.txt. Please add at least one referral code.'));
    process.exit(1);
  }
  
  const numAccounts = parseInt(await askQuestion(chalk.yellow('Enter number of accounts to create: ')), 10);
  rl.close();
  
  for (let i = 0; i < numAccounts; i++) {
    console.log(chalk.cyan(`\nCreating account ${i + 1}/${numAccounts}...`));
    const wallet = createWallet();
    
    // Use a random proxy if available
    const proxy = proxies.length > 0 ? proxies[Math.floor(Math.random() * proxies.length)] : '';
    const axiosInstance = createAxiosInstance(proxy);
    if (proxy) {
      try {
        // Force the IP lookup through the proxy using axios.get with explicit httpAgent
        const ipResponse = await axios.get("http://ip-api.com/json", {
          httpAgent: new HttpProxyAgent(proxy),
          headers: { ...defaultConfig.headers, 'Connection': 'close' }
        });
        console.log(chalk.cyan(`Ip used: ${ipResponse.data.query}`));
      } catch (e) {
        console.log(chalk.cyan(`Ip used: Unknown`));
      }
    }
    
    // Randomly select a referral from refs.txt
    const referralCode = referrals[Math.floor(Math.random() * referrals.length)];
    console.log(chalk.magenta(`Using referral: ${referralCode}`));
    
    const accessToken = await login(wallet, referralCode, axiosInstance);
    if (accessToken) {
      // Shuffle the four tasks and complete each in random order
      let tasksToComplete = shuffle(taskIds.slice());
      for (const missionId of tasksToComplete) {
        console.log(chalk.magenta(`Processing mission: ${missionId}`));
        if (await completeMission(missionId, accessToken, axiosInstance)) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await claimMissionReward(missionId, accessToken, axiosInstance);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log(chalk.green('\nAll accounts created and missions completed successfully!'));
}

main().catch(error => console.error(chalk.red('Bot encountered an error:'), error));
