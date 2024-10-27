const PASSWORD = "123"; // Change this password
const SALT = crypto.getRandomValues(new Uint8Array(16));

//derive AES key with the provided password + salt
async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-CBC", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

// Encrypt JSON data
async function encryptData(data, password, salt) {
    const key = await deriveKey(password, salt);
    const iv = crypto.getRandomValues(new Uint8Array(16));

//    const encoder = new TextEncoder();
//    const paddedData = padData(encoder.encode(JSON.stringify(data)));

    const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-CBC", iv: iv },
        key,
        padData(data)
    );

	document.getElementById("successfullyEncrypted").textContent = "Document successfully encrypted";
    return {
        salt: btoa(String.fromCharCode(...salt)),
        iv: btoa(String.fromCharCode(...iv)),
        data: btoa(String.fromCharCode(...new Uint8Array(encryptedData)))
    };

}

// Decrypt JSON data
async function decryptData(encryptedData, password) {
    const salt = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(encryptedData.data), c => c.charCodeAt(0));
    
    const key = await deriveKey(password, salt);

    const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-CBC", iv: iv },
        key,
        data
    );

    return unpadData(new Uint8Array(decryptedData));
}

// PKCS7 Padding
function padData(data) {
    const padding = 16 - (data.byteLength % 16);
    const padded = new Uint8Array(data.byteLength + padding);
    padded.set(new Uint8Array(data));
    padded.fill(padding, data.byteLength);
    return padded;
}

function unpadData(data) {
    const padding = data[data.byteLength - 1];
    return data.slice(0, data.byteLength - padding);
}

