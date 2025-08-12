// api/login.js

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', ['POST']);
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { username, password } = request.body;

        if (!username || !password) {
            return response.status(400).json({ message: 'Username and password are required.' });
        }

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
    } catch (error) {
        console.error("Error in login handler:", error);
        return response.status(500).json({ message: 'An unexpected error occurred.' });
    }
}
