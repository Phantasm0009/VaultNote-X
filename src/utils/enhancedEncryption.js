import CryptoJS from 'crypto-js';

export const enhancedEncrypt = (data, passphrase) => {
  if (!data) return "";
  if (!passphrase) throw new Error("Passphrase is required");
  
  // Use a salt for better security
  const salt = CryptoJS.lib.WordArray.random(128/8);
  
  // Use a key derivation function to create a stronger key
  const key = CryptoJS.PBKDF2(passphrase, salt, {
    keySize: 256/32,
    iterations: 1000
  });
  
  // Store the salt with the encrypted data for decryption
  const encrypted = CryptoJS.AES.encrypt(data, key.toString());
  
  // Return JSON containing both the salt and encrypted data
  return JSON.stringify({
    salt: salt.toString(),
    data: encrypted.toString()
  });
};

export const enhancedDecrypt = (encryptedData, passphrase) => {
  if (!encryptedData) return "";
  if (!passphrase) throw new Error("Passphrase is required");
  
  // Debug what we're trying to decrypt
  console.log("Decrypting data of length:", encryptedData.length);
  
  try {
    // First try the enhanced format with JSON
    try {
      const jsonData = JSON.parse(encryptedData);
      if (jsonData.salt && jsonData.data) {
        // Reconstruct the key using the same derivation
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
    
    // Try multiple direct approaches with different configurations
    const decryptionMethods = [
      // Standard AES decrypt with UTF8 encoding
      () => {
        const bytes = CryptoJS.AES.decrypt(encryptedData, passphrase);
        return bytes.toString(CryptoJS.enc.Utf8);
      },
      // AES with specific options
      () => {
        const bytes = CryptoJS.AES.decrypt(encryptedData, passphrase, {
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });
        return bytes.toString(CryptoJS.enc.Utf8);
      },
      // Try with password as key directly
      () => {
        const key = CryptoJS.enc.Utf8.parse(passphrase);
        const bytes = CryptoJS.AES.decrypt(encryptedData, key, {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        });
        return bytes.toString(CryptoJS.enc.Utf8);
      }
    ];
    
    // Try each method
    for (let method of decryptionMethods) {
      try {
        const result = method();
        if (result && result.length > 0) {
          return result;
        }
      } catch (e) {
        // Continue to next method on failure
      }
    }
    
    // If we get here, all attempts failed
    throw new Error("Could not decrypt with the provided passphrase");
    
  } catch (error) {
    console.error("Enhanced decryption failed:", error);
    throw error;
  }
};