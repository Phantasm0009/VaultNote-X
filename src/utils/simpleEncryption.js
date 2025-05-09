import CryptoJS from 'crypto-js';


const encrypt = (data, passphrase) => {
  if (!data) return '';
  if (!passphrase) throw new Error('Passphrase is required');
  
  
  return CryptoJS.AES.encrypt(data, passphrase).toString();
};


const decrypt = (encrypted, passphrase) => {
  if (!encrypted) return '';
  if (!passphrase) throw new Error('Passphrase is required');
  
  console.log(`Attempting to decrypt data of length ${encrypted.length}`);
  
  
  const errors = [];
  
  try {
    
    console.log("Trying standard AES decryption...");
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, passphrase);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (decrypted && decrypted.length > 0) {
        console.log("Standard decryption successful");
        return decrypted;
      }
    } catch (e) {
      errors.push(`Standard decryption error: ${e.message}`);
    }
    
    
    console.log("Trying JSON format decryption...");
    try {
      const jsonData = JSON.parse(encrypted);
      if (jsonData.salt && jsonData.data) {
        
        const key = CryptoJS.PBKDF2(passphrase, jsonData.salt, {
          keySize: 256/32,
          iterations: 1000
        });
        
        const bytes = CryptoJS.AES.decrypt(jsonData.data, key.toString());
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        
        if (decrypted && decrypted.length > 0) {
          console.log("JSON format decryption successful");
          return decrypted;
        }
      }
    } catch (e) {
      errors.push(`JSON format decryption error: ${e.message}`);
    }
    
    
    console.log("Trying CBC mode decryption...");
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, passphrase, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (decrypted && decrypted.length > 0) {
        console.log("CBC mode decryption successful");
        return decrypted;
      }
    } catch (e) {
      errors.push(`CBC mode error: ${e.message}`);
    }
    
    
    console.log("Trying direct key parsing...");
    try {
      const key = CryptoJS.enc.Utf8.parse(passphrase);
      const bytes = CryptoJS.AES.decrypt(encrypted, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      });
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (decrypted && decrypted.length > 0) {
        console.log("Direct key parsing successful");
        return decrypted;
      }
    } catch (e) {
      errors.push(`Direct key error: ${e.message}`);
    }
    
    
    console.log("Trying base64 decode as last resort...");
    try {
      if (/^[A-Za-z0-9+/=]+$/.test(encrypted)) {
        const decoded = atob(encrypted);
        if (decoded && decoded.length > 0 && /[\x20-\x7E]/.test(decoded)) {
          console.log("Base64 decode successful");
          return decoded;
        }
      }
    } catch (e) {
      errors.push(`Base64 decode error: ${e.message}`);
    }
    
    
    console.error("All decryption methods failed:", errors);
    throw new Error('Decryption failed - unable to decrypt with provided passphrase');
  } catch (error) {
    console.error('Decryption error details:', error, '\nAll previous errors:', errors);
    throw new Error('Unable to decrypt with provided passphrase');
  }
};


const isCorrectPassphrase = (encrypted, passphrase) => {
  if (!encrypted || !passphrase) return false;
  
  try {
    const decrypted = decrypt(encrypted, passphrase);
    return !!decrypted;
  } catch (e) {
    return false;
  }
};

export { encrypt, decrypt, isCorrectPassphrase };