import CryptoJS from 'crypto-js';

export const enhancedEncrypt = (data, passphrase) => {
  if (!data) return "";
  if (!passphrase) throw new Error("Passphrase is required");
  
  
  const salt = CryptoJS.lib.WordArray.random(128/8);
  
  
  const key = CryptoJS.PBKDF2(passphrase, salt, {
    keySize: 256/32,
    iterations: 1000
  });
  
  
  const encrypted = CryptoJS.AES.encrypt(data, key.toString());
  
  
  return JSON.stringify({
    salt: salt.toString(),
    data: encrypted.toString()
  });
};

export const enhancedDecrypt = (encryptedData, passphrase) => {
  if (!encryptedData) return "";
  if (!passphrase) throw new Error("Passphrase is required");
  
  
  console.log("Decrypting data of length:", encryptedData.length);
  
  try {
    
    try {
      const jsonData = JSON.parse(encryptedData);
      if (jsonData.salt && jsonData.data) {
        
        const key = CryptoJS.PBKDF2(passphrase, jsonData.salt, {
          keySize: 256/32,
          iterations: 1000
        });
        
        const decrypted = CryptoJS.AES.decrypt(jsonData.data, key.toString());
        const result = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (result && result.length > 0) {
          return result;
        }
      }
    } catch (parseError) {
      console.log("Not in enhanced format, trying legacy formats");
    }
    
    
    const decryptionMethods = [
      
      () => {
        const bytes = CryptoJS.AES.decrypt(encryptedData, passphrase);
        return bytes.toString(CryptoJS.enc.Utf8);
      },
      
      () => {
        const bytes = CryptoJS.AES.decrypt(encryptedData, passphrase, {
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });
        return bytes.toString(CryptoJS.enc.Utf8);
      },
      
      () => {
        const key = CryptoJS.enc.Utf8.parse(passphrase);
        const bytes = CryptoJS.AES.decrypt(encryptedData, key, {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        });
        return bytes.toString(CryptoJS.enc.Utf8);
      }
    ];
    
    
    for (let method of decryptionMethods) {
      try {
        const result = method();
        if (result && result.length > 0) {
          return result;
        }
      } catch (e) {
        
      }
    }
    
    
    throw new Error("Could not decrypt with the provided passphrase");
    
  } catch (error) {
    console.error("Enhanced decryption failed:", error);
    throw error;
  }
};