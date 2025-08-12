export default async function handler(req, res) {
  if (req.method === 'POST') {
    // To log out, we expire the cookie by setting its Max-Age to 0.
    res.setHeader('Set-Cookie', 'auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    return res.status(200).json({ message: 'Logout successful' });
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
