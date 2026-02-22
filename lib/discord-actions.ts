"use server";

export async function getDiscordStatus() {
    try {
        const response = await fetch("https://discordapp.com/api/guilds/688822800210854005/widget.json", {
            next: { revalidate: 60 } // Cache for 1 minute
        });

        if (!response.ok) {
            throw new Error("Failed to fetch Discord status");
        }

        const data = await response.json();
        return {
            onlineCount: data.presence_count || 0,
            members: data.members || [],
            name: data.name,
            invite: data.instant_invite
        };
    } catch (error) {
        console.error("Discord API Error:", error);
        return null;
    }
}
