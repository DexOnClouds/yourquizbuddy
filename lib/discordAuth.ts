export const discordAuthUrl = () => {
  const rootUrl = 'https://discord.com/oauth2/authorize';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const options = {
    client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
    redirect_uri: `${baseUrl}/api/auth/discord/callback`,
    response_type: 'code',
    scope: 'identify email',
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};
