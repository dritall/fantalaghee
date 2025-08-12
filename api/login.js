export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
      // In a real application, you would use a secure session mechanism.
      // For this example, we'll use a simple cookie.
      const session = Buffer.from(JSON.stringify({ loggedIn: true })).toString('base64');
      res.setHeader('Set-Cookie', `auth=${session}; Path=/; HttpOnly; SameSite=Strict`);
      return res.status(200).json({ message: 'Login successful' });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
