const fs = require('fs').promises;
const chalk = require('chalk').default;

async function extractRefCodes() {
  try {
    const content = await fs.readFile('accounts.txt', 'utf8');
    // Split the file into lines and filter out lines that contain "RefCode:"
    const lines = content.split('\n');
    const refCodes = lines
      .filter(line => line.startsWith('RefCode:'))
      .map(line => line.substring('RefCode:'.length).trim())
      .filter(code => code.length > 0);

    // Remove duplicate referral codes if necessary
    const uniqueRefCodes = [...new Set(refCodes)];

    await fs.writeFile('refs.txt', uniqueRefCodes.join('\n'));
    console.log(chalk.green(`Extracted ${uniqueRefCodes.length} referral code(s) and saved to refs.txt`));
  } catch (error) {
    console.error(chalk.red('Error extracting referral codes:'), error.message);
  }
}

extractRefCodes();
