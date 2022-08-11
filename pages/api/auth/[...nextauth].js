import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import DiscordProvider from "next-auth/providers/discord";

process.env.NEXTAUTH_URL = "http://localhost:52470";

export const authOptions = {
    // Configure one or more authentication providers
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_ID,
            clientSecret: process.env.DISCORD_SECRET
        }),
        // ...add more providers here
    ],
}

export default NextAuth(authOptions);