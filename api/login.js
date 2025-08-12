// api/login.js

export default function handler(request, response) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    // It's common for Vercel to not parse JSON bodies automatically.
    // We'll handle both object and stringified JSON.
    let body;
    try {
        body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    } catch (e) {
        return response.status(400).json({ message: 'Invalid JSON body' });
    }

    const { username, password } = body;

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    // This is a simple, insecure, hardcoded token for demonstration.
    // A real application should use a secure, signed, and expiring token (like JWT).
    const hardcodedToken = "a-very-secret-and-hard-to-guess-token-fanta-laghee-2025";

    // Check if the required environment variables are set on the server
    if (!adminUser || !adminPass) {
        console.error("FATAL: Missing ADMIN_USER or ADMIN_PASS environment variables on Vercel.");
        return response.status(500).json({ message: 'Server configuration error. Please contact support.' });
    }

    // Check credentials
    if (username === adminUser && password === adminPass) {
        // Successful login: return the token
        return response.status(200).json({ success: true, token: hardcodedToken });
    } else {
        // Failed login
        return response.status(401).json({ success: false, message: 'Invalid username or password' });
    }
}
