import { BakongKHQR, IndividualInfo, khqrData } from 'bakong-khqr';
import axios from 'axios';
import { config } from '../config/index.js';

export const generateKHQR = async (orderId, amount) => {
  try {
    const parsedAmount = Math.round(parseFloat(amount) * 100) / 100;

    if (!parsedAmount || parsedAmount <= 0) {
      throw new Error('Invalid amount: ' + amount);
    }

    const expirationTimestamp = Date.now() + 10 * 60 * 1000;

    const optionalData = {
      currency: khqrData.currency.usd,
      amount: parsedAmount,
      billNumber: String(orderId).slice(0, 25),
      mobileNumber: config.BAKONG_PHONE_NUMBER,
      storeLabel: 'Mens Store',
      terminalLabel: 'WEB01',
      expirationTimestamp: expirationTimestamp,
    };

    // ✅ CORRECT: (bakongAccountID, merchantName, merchantCity, optionalData)
    const individualInfo = new IndividualInfo(
      config.BAKONG_ACCOUNT_USERNAME,
      'Mens Store',
      'Phnom Penh',
      optionalData
    );

    const khqr = new BakongKHQR();
    const response = khqr.generateIndividual(individualInfo);

    if (response.status.code !== 0 || !response.data) {
      console.error('KHQR generation failed:', response.status);
      throw new Error('Failed to generate KHQR: ' + response.status.message);
    }

    const decoded = BakongKHQR.decode(response.data.qr);
    console.log('✅ QR merchant name:', decoded && decoded.data ? decoded.data.merchantName : 'N/A');
    console.log('✅ QR amount:', decoded && decoded.data ? decoded.data.transactionAmount : 'N/A');
    console.log('✅ QR currency:', decoded && decoded.data ? decoded.data.transactionCurrency : 'N/A');

    return {
      qrString: response.data.qr,
      md5: response.data.md5,
      expiresAt: new Date(expirationTimestamp),
    };
  } catch (error) {
    console.error('generateKHQR error:', error.message);
    throw new Error('Failed to generate payment QR: ' + error.message);
  }
};

export const checkPaymentStatus = async (md5) => {
  try {
    const response = await axios.post(
      config.NBC_API_URL + 'v1/check_transaction_by_md5',
      { md5 },
      {
        headers: {
          Authorization: 'Bearer ' + config.BAKONG_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    if (response.data && response.data.responseCode === 0) {
      return { status: 'paid', data: response.data.data };
    }

    return { status: 'pending' };
  } catch (error) {
    const responseCode = error.response && error.response.data
      ? error.response.data.responseCode
      : null;
    if (responseCode === 6 || (error.response && error.response.status === 404)) {
      return { status: 'pending' };
    }
    console.error('checkPaymentStatus error:', error.response ? error.response.data : error.message);
    return { status: 'pending' };
  }
};