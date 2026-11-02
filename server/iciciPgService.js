import crypto from 'crypto';

/**
 * ICICI Bank Orange PG Service
 * Supports UAT & Production Environments.
 */

const ICICI_CONFIG = {
  // Defaults from UAT specification document provided by ICICI
  uat: {
    mid: process.env.ICICI_PG_MID || '100000000007164',
    key: process.env.ICICI_PG_KEY || 'db06cca0-838b-4e01-8b20-6ac446ffb6bd',
    aggregatorId: process.env.ICICI_PG_AGGREGATOR_ID || 'A100000000007164',
    initiateSaleUrl: 'https://pgpayuat.icici.bank.in/tsp/pg/api/v2/initiateSale',
    statusCheckUrl: 'https://pgpayuat.icici.bank.in/tsp/pg/api/command'
  },
  prod: {
    mid: process.env.ICICI_PG_MID,
    key: process.env.ICICI_PG_KEY,
    aggregatorId: process.env.ICICI_PG_AGGREGATOR_ID,
    initiateSaleUrl: 'https://pgpay.icicibank.com/pg/api/v2/initiateSale',
    statusCheckUrl: 'https://pgpay.icicibank.com/pg/api/command'
  }
};

/**
 * Determine environment (default to 'uat' unless explicitly set to 'prod' or 'live')
 */
export function getEnvironment() {
  const env = (process.env.ICICI_PG_ENV || 'uat').toLowerCase();
  return env === 'prod' || env === 'production' || env === 'live' ? 'prod' : 'uat';
}

/**
 * Get active configuration
 */
export function getConfig() {
  const env = getEnvironment();
  const cfg = ICICI_CONFIG[env];
  return {
    ...cfg,
    env,
    mid: process.env.ICICI_PG_MID || cfg.mid,
    key: process.env.ICICI_PG_KEY || cfg.key,
    aggregatorId: process.env.ICICI_PG_AGGREGATOR_ID || cfg.aggregatorId
  };
}

/**
 * Generate HMAC SHA-256 Digest as mandated by ICICI Specification:
 * 1. Filter out null, undefined, empty string parameters
 * 2. Sort keys alphabetically
 * 3. Concatenate values in alphabetical key order
 * 4. Compute HMAC-SHA256 with merchant key and convert to lowercase hex
 */
export function generateHmacDigest(payload, key) {
  const sortedKeys = Object.keys(payload).sort();
  let plain = '';
  sortedKeys.forEach(k => {
    const val = payload[k];
    if (val !== null && val !== undefined && val !== '') {
      plain += val.toString();
    }
  });

  return crypto
    .createHmac('sha256', key)
    .update(plain, 'ascii')
    .digest('hex')
    .toLowerCase();
}

/**
 * Initiate Sale API Call with ICICI Bank
 */
export async function initiateSale({
  merchantTxnNo,
  amount,
  customerEmail,
  customerMobile,
  customerName,
  returnURL,
  addlParam1,
  addlParam2
}) {
  const cfg = getConfig();

  // Formatted date string in YYYYMMDDHHMMSS (greater than current time, max 235959)
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const txnDate = `${yyyy}${mm}${dd}235959`;

  const requestPayload = {
    merchantId: cfg.mid,
    merchantTxnNo: String(merchantTxnNo).slice(0, 20),
    amount: Number(amount).toFixed(2),
    currencyCode: '356', // INR
    payType: '0',        // 0 = Standard Redirection (Card, UPI, Netbanking, Wallets)
    customerEmailID: customerEmail || 'guest@sabharwalhotels.com',
    customerMobileNo: customerMobile ? customerMobile.replace(/\D/g, '').slice(-10) : '9999999999',
    customerName: customerName || 'Guest',
    transactionType: 'SALE',
    txnDate: txnDate,
    returnURL: returnURL
  };

  if (cfg.aggregatorId) {
    requestPayload.aggregatorID = cfg.aggregatorId;
  }
  if (addlParam1) {
    requestPayload.addlParam1 = String(addlParam1).slice(0, 64);
  }
  if (addlParam2) {
    requestPayload.addlParam2 = String(addlParam2).slice(0, 64);
  }

  // Calculate secureHash
  const secureHash = generateHmacDigest(requestPayload, cfg.key);
  requestPayload.secureHash = secureHash;

  console.log(`[ICICI-PG] Calling initiateSale [${cfg.env}] with merchantTxnNo: ${requestPayload.merchantTxnNo}, amount: ${requestPayload.amount}`);

  const response = await fetch(cfg.initiateSaleUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload)
  });

  const responseJson = await response.json();
  console.log('[ICICI-PG] initiateSale response:', responseJson);

  if (responseJson.responseCode === 'R1000' && responseJson.redirectURI && responseJson.tranCtx) {
    const paymentUrl = `${responseJson.redirectURI}?tranCtx=${encodeURIComponent(responseJson.tranCtx)}`;
    return {
      success: true,
      paymentUrl,
      tranCtx: responseJson.tranCtx,
      merchantTxnNo: responseJson.merchantTxnNo || requestPayload.merchantTxnNo,
      raw: responseJson
    };
  } else {
    return {
      success: false,
      error: responseJson.responseDescription || `ICICI PG returned error code: ${responseJson.responseCode}`,
      raw: responseJson
    };
  }
}

/**
 * Verify response callback signature from ICICI
 */
export function verifyCallbackHash(postParams) {
  const cfg = getConfig();
  const receivedHash = (postParams.secureHash || '').toLowerCase();
  if (!receivedHash) return false;

  // Clone params without secureHash for validation
  const paramsToHash = { ...postParams };
  delete paramsToHash.secureHash;

  const expectedHash = generateHmacDigest(paramsToHash, cfg.key);
  return expectedHash === receivedHash;
}

/**
 * Status Check API
 */
export async function checkTransactionStatus({ merchantTxnNo, originalTxnNo }) {
  const cfg = getConfig();

  const requestPayload = {
    merchantId: cfg.mid,
    merchantTxnNo: String(merchantTxnNo).slice(0, 20),
    originalTxnNo: String(originalTxnNo || merchantTxnNo).slice(0, 20),
    transactionType: 'STATUS'
  };

  if (cfg.aggregatorId) {
    requestPayload.aggregatorID = cfg.aggregatorId;
  }

  const secureHash = generateHmacDigest(requestPayload, cfg.key);
  requestPayload.secureHash = secureHash;

  const formBody = Object.keys(requestPayload)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(requestPayload[key]))
    .join('&');

  const response = await fetch(cfg.statusCheckUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody
  });

  return await response.json();
}
