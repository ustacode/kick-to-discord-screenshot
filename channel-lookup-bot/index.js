import { Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";

const requiredEnvVars = [
  "DISCORD_TOKEN",
  "DISCORD_CLIENT_ID",
  "DISCORD_GUILD_ID",
  "KICK_OAUTH2_TOKEN"
];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const command = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Fetch Kick channel details by slug")
  .addStringOption((option) =>
    option
      .setName("slug")
      .setDescription("Kick channel username/slug to lookup")
      .setRequired(true)
      .setMaxLength(100)
  );

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function formatReply(data) {
  if (typeof data === "string") {
    return data;
  }
  return JSON.stringify(data, null, 2);
}

async function registerGuildCommand() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
    { body: [command.toJSON()] }
  );
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready as ${readyClient.user.tag}`);
  try {
    await registerGuildCommand();
    console.log("Registered guild slash command: /kick");
  } catch (error) {
    console.error("Failed to register slash command:", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName !== "kick") {
    return;
  }

  const slug = interaction.options.getString("slug", true).trim();
  const kickApiBaseUrl = process.env.KICK_API_BASE_URL || "https://api.kick.com";

  await interaction.deferReply();

  try {
    const requestUrl = new URL("/public/v1/channels", kickApiBaseUrl);
    requestUrl.searchParams.append("slug", slug);

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.KICK_OAUTH2_TOKEN}`,
        Accept: "*/*"
      }
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const bodyText = formatReply(responseBody).slice(0, 1800);
      await interaction.editReply(`Kick API returned ${response.status}.\n\n\`\`\`${bodyText}\`\`\``);
      return;
    }

    if (Array.isArray(responseBody) && responseBody.length === 0) {
      await interaction.editReply(`No channel found for slug: \`${slug}\`.`);
      return;
    }

    const bodyText = formatReply(responseBody).slice(0, 1800);
    await interaction.editReply(`Kick API response:\n\n\`\`\`${bodyText}\`\`\``);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await interaction.editReply(`Request failed: ${errorMessage}`);
  }
});

client.login(process.env.DISCORD_TOKEN);
