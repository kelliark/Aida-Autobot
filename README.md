# Multi Referral Account Creator & Mission Completer

This project is a Node.js script that automatically creates Ethereum wallet accounts, logs into AidApp using randomly selected referral codes from a list, and completes a set of pre-defined missions in a randomized order for each account. The script also utilizes proxies (with randomized user agents) to help mask your IP.

# Register here
- https://my.aidapp.com/

## Features

- **Multi Referral Support:**  
  - Loads referral codes from a file (`refs.txt`) and randomly selects one for each new account. // only applicable to `multi.js` the `main.js` one isn't
- **Proxy Integration:**  
  - Loads proxies from a file (`proxies.txt`), and for each account, a random proxy is chosen.
- **Random User Agent:**  
  - Generates a random user agent for each account request to mimic different devices (desktop, mobile, etc.).
- **Account & Mission Automation:**  
  - Creates a new Ethereum wallet for each account.  
  - Logs into AidApp using the wallet and a randomly selected referral.  
  - Randomizes the order of four pre-defined mission IDs and completes all of them, claiming rewards for each.

- **Output Files:**  
  - `accounts.txt` contains the wallet details and used referral code for each account.  
  - `token.txt` saves the access token for each account.
  - `refs.txt` containts you referral codes //tips after creating bunch of accounts, use the extractor so your referral accounts have refs too to avoid... y'know

## Prerequisites

- [Node.js](https://nodejs.org/) (version 12 or later recommended)
- npm (Node Package Manager)

## Installation

1. **Clone or Download the Repository:**

   ```bash
   git clone https://github.com/kelliark/Aida-Autobot
   cd Aida-Autobot
   ```

2. **Install Dependencies:**

   Run the following command to install the required npm packages:

   ```bash
   npm install
   ```

## Setup

1. **Open `refs.txt`:**

   Open a file named `refs.txt` in the project directory and add one referral code per line.

   Example:
   ```
   REFERRAL_CODE_1
   REFERRAL_CODE_2
   REFERRAL_CODE_3
   ```

2. **Create `proxies.txt` (Optional but recommended):**

   Create a file named `proxies.txt` in the project directory and add one proxy URL per line.

   Example:
   ```
   http://username:password@proxy1.example.com:port
   http://username:password@proxy2.example.com:port
   ```

## Usage

To run the script, execute:

- Multi Referral
```bash
node multi.js
```
- Single Referral
```bash
node main.js
```
- Auto Task using token // use this if there's a new task, you can simply find the taskid through Network Tab and replace the Id's, I do that so its way safer
```bash
node autotask.js
```
- Auto Extract Referral Code from `accounts.txt`
```bash
node refcodeextractor.js
```


## Customization

- **Task IDs:**  
  The four mission IDs are hardcoded in the script. You can update or add more as needed.

## License

This project is licensed under the MIT License.

## Disclaimer

Use at your risk, all risk are borne with the user.

