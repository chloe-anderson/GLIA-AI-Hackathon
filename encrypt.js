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

    //const decoder = new TextDecoder();
    //return JSON.parse(decoder.decode(unpadData(new Uint8Array(decryptedData))));
    return unpadData(new Uint8Array(decryptedData));
}

// PKCS7 Padding
function padData(data) {
    const padding = 16 - (data.byteLength % 16);
    const padded = new Uint8Array(data.byteLength + padding);
    padded.set(new Uint8Array((data));
    padded.fill(padding, data.byteLength);
    return padded;
}

function unpadData(data) {
    const padding = data[data.byteLength - 1];
    return data.slice(0, data.byteLength - padding);
}

// Keyword search in decrypted data
function searchKeywords(decryptedData, keywords) {
    return decryptedData.records.filter(record =>
        keywords.some(keyword =>
            record.condition.toLowerCase().includes(keyword.toLowerCase())
        )
    );
}

// Example usage
async function encryptAndStore() {
    const medicalData = {
        records: [
            { id: 1, name: "John Doe", age: 50, condition: "Hypertension" },
            { id: 2, name: "Jane Smith", age: 30, condition: "Diabetes" },
            { id: 3, name: "Mike Lee", age: 40, condition: "Hypertension" },
            { id: 4, name: "Emily Davis", age: 35, condition: "Healthy" }
        ]
    };
	const encoder = new TextEncoder();
	const data = encoder.encode(JSON.stringify(medicalData));
    const encryptedData = await encryptData(data, PASSWORD, SALT);
    document.getElementById("output").textContent = "Encrypted Data:\n" + JSON.stringify(encryptedData, null, 2);
}

async function searchAndRetrieve() {
    const encryptedData = JSON.parse(document.getElementById("output").textContent);
   
	//keywords = user specified keywrods from the input
    const keywordInput = document.getElementById("keywordInput").value.trim();	
	if(!keywordInput) {
		document.getElementById("output").textContent += "\n\nEnter a keyword to search for.";
		return;
	}
    const keywords = keywordInput.split(/\s+/);	//split by whitespace

    const decryptedArray = await decryptData(encryptedData, PASSWORD);
	const decoder = new TextDecoder();
	const decryptedData = JSON.parse(decoder.decode(decryptedArray));

    //search for the user-specified keywords
    const results = searchKeywords(decryptedData, keywords);

    document.getElementById("output").textContent += "\n\nFiltered Records with keyword(s): " + keywords + "\n" + JSON.stringify(results, null, 2);

//search-results

}






