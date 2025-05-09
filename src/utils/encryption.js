import CryptoJS from 'crypto-js';
import { enhancedEncrypt, enhancedDecrypt } from './enhancedEncryption';

const encrypt = (data, passphrase) => {
    try {
        
        if (!data || data.trim() === '') {
            console.warn("Attempting to encrypt empty data");
            return "";
        }
        
        if (!passphrase) {
            console.error("Passphrase is required for encryption");
            throw new Error("Passphrase is required");
        }
        
        
        return enhancedEncrypt(data, passphrase);
    } catch (error) {
        console.error("Encryption failed:", error);
        throw error;
    }
};

const decrypt = (ciphertext, passphrase) => {
    try {
        if (!ciphertext) {
            console.warn("Cannot decrypt empty data");
            return "";
        }
        
        if (!passphrase) {
            console.error("Passphrase is required for decryption");
            throw new Error("Passphrase is required");
        }
        
        
        return enhancedDecrypt(ciphertext, passphrase);
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Unable to decrypt with provided passphrase");
    }
};


function isValidUTF8(str) {
  try {
    return (new TextEncoder().encode(str)).length > 0;
  } catch (e) {
    return false;
  }
}

const encryptNote = (note, passphrase) => {
    return encrypt(note, passphrase);
};

const decryptNote = (note, passphrase) => {
    return decrypt(note, passphrase);
};

const generateKeyPair = async (passphrase) => {
    
    const publicKey = CryptoJS.SHA256(passphrase + "-public").toString();
    const privateKey = CryptoJS.SHA256(passphrase + "-private").toString();
    
    return {
        publicKey,
        privateKey
    };
};


const debugEncryptionInfo = (encryptedData) => {
  if (!encryptedData) {
    return {
      isEmpty: true,
      length: 0,
      type: 'undefined/null',
      firstChars: 'N/A',
      isBase64: false,
      isJSON: false
    };
  }
  
  let isJSON = false;
  try {
    JSON.parse(encryptedData);
    isJSON = true;
  } catch (e) {
    
  }
  
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(encryptedData);
  
  return {
    isEmpty: false,
    length: encryptedData.length,
    type: typeof encryptedData,
    firstChars: encryptedData.substring(0, 20) + '...',
    isBase64: isBase64,
    isJSON: isJSON
  };
};


const testPassphrase = (ciphertext, passphrase) => {
  try {
    const result = decrypt(ciphertext, passphrase);
    return !!result;
  } catch (e) {
    return false;
  }
};

export { 
    encrypt, 
    decrypt, 
    encryptNote, 
    decryptNote, 
    generateKeyPair,
    debugEncryptionInfo,
    testPassphrase
};