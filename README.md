# VaultNote X

## Inspiration

In a world increasingly dependent on cloud storage, privacy is often sacrificed for convenience. We wanted to create a note-taking app that works **entirely offline**, stores your data securely, and offers features like **version history and encryption** — without ever sending your information to the cloud. VaultNote X is built for activists, journalists, researchers, and anyone who values **true data ownership**.

---

## What it does

VaultNote X is an **offline-first, encrypted note system** that:

* Lets you create, edit, and organize notes
* Encrypts all notes locally using **AES-256 encryption**
* Stores a **version history** of each note, so you can view and restore past edits
* Allows local password protection with a **secure key derivation** method
* Tracks note access with detailed **access logs** for security monitoring
* Offers both **light and dark modes** for comfortable use in any environment
* Stores everything on your device — **no internet, no cloud, no tracking**

Optional features:

* Markdown formatting
* Version control with Git-like commit history
* Secure device-specific passphrase remembering

---

## How I built it

* **Frontend**: React.js with custom CSS for a responsive interface
* **Encryption**: CryptoJS for AES-256 encryption with multiple fallback methods
* **Versioning**: Custom Git-inspired version control system with branch support
* **Storage**: LocalStorage for encrypted notes and settings
* **Theming**: Dynamic theme system with seamless light/dark mode transitions
* **Security**: Enhanced password strength validation and multi-method decryption
* **Offline**: Progressive Web App with service worker for offline capabilities

---

## Challenges I ran into

* Implementing robust client-side **encryption and decryption** workflows
* Handling **key derivation securely** from user-entered passwords without server-side validation
* Designing a version history system that balances **performance and simplicity**
* Ensuring encryption compatibility between different versions and methods
* Creating an accessible UI that works well in both light and dark modes

---

## Accomplishments that I'm proud of

* Built a fully offline, secure note-taking app with comprehensive encryption features
* Implemented a sophisticated version control system with branching support
* Designed an intuitive UI that adapts to user preferences with theme toggle
* Created a detailed access logging system for security monitoring
* Ensured robust encryption with multiple fallback methods for maximum compatibility

---

## What I learned

* How to implement and troubleshoot client-side encryption methods
* The importance of progressive enhancement for security features
* Techniques for building responsive interfaces that work across themes
* Best practices for local storage security and encryption
* How to design user-friendly security systems that don't sacrifice protection

---

## What's next for VaultNote X

* ✅ Enhanced biometric authentication for secure access
* ✅ Secure note sharing via encrypted QR codes
* 🌐 Multi-device support through peer-to-peer sync (no central server)
* 🖋️ Rich text editing with maintained encryption
* 🛡️ Integrated password manager for seamless access
* 📁 Encrypted file attachments for comprehensive note-taking
* 🔍 Full-text encrypted search capabilities
* 📱 Native mobile applications with the same security guarantees

---

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/Phantasm0009/vaultnote-x.git
   ```
2. Navigate to the project directory:
   ```
   cd vaultnote-x
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the application:
   ```
   npm start
   ```

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.
