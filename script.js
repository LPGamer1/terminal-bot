/* * * * * * * * * * * * * * * * * * * Mass DM (Modo Cloud Shell)    *
* Token via Variável de Ambiente *
* * * * * * * * * * * * * * * * * */

const { Client } = require("discord.js");
const { red, yellow, greenBright, yellowBright } = require("chalk");
const readline = require("readline").createInterface({ input: process.stdin, output: process.stdout });
const fs = require("fs");

const client = new Client();

// --- MUDANÇA DE SEGURANÇA ---
// Tenta pegar o token do Linux (Cloud Shell/Render)
// Se não tiver, tenta pegar do arquivo settings.json
let token = process.env.DISCORD_TOKEN;
let message = "";

try {
    const settings = require("./settings.json");
    if (!token) token = settings.token; // Se não tem no env, usa do arquivo
    message = settings.message;
} catch (e) {
    console.log(red("[!] Arquivo settings.json não encontrado ou inválido."));
}
// ----------------------------

client.on("ready", () => {
    console.log(greenBright(`\n[✔] Logado como: ${client.user.tag}`));
    Main();
});

function Main() {
    console.log("\n\tMass DM (Seguro)\n\t[1] Modo Rápido\n\t[2] Modo Seguro (Com Tempo)\n");
    readline.question("[?] Escolha: ", answer => {
        if (answer === "1") {
            readline.question("[?] ID do Servidor: ", id => {
                ScrapeUsers(id).then(() => MassDMNormal());
            });
        } else if (answer === "2") {
            readline.question("[?] ID do Servidor: ", id => {
                ScrapeUsers(id).then(() => {
                    readline.question("[?] Tempo (segundos): ", time => {
                        MassDMTimeOut(parseInt(time) * 1000);
                    });
                });
            });
        }
    });
}

async function ScrapeUsers(guildID) {
    try {
        const guild = await client.guilds.fetch(guildID);
        console.log(yellow(`\n[!] Lendo servidor: ${guild.name}...`));
        const members = guild.members.cache.map(u => u.id);
        
        if (members.length === 0) {
            console.log(red("[X] Nenhum membro no cache. Ative as Intents no Dev Portal!"));
            process.exit(1);
        }
        
        fs.writeFileSync('./scraped.json', JSON.stringify({ IDs: members }, null, 2));
        console.log(greenBright(`[✔] ${members.length} IDs salvos.`));
    } catch (e) {
        console.log(red("[X] Erro ao ler servidor: " + e.message));
        process.exit(1);
    }
}

function MassDMTimeOut(timeout) {
    const ids = require("./scraped.json").IDs;
    console.log(yellow(`[!] Enviando para ${ids.length} pessoas...`));
    ids.forEach((id, i) => {
        setTimeout(() => {
            client.users.fetch(id).then(u => {
                u.send(message)
                    .then(() => console.log(greenBright(`[${i+1}] Enviado: ${u.tag}`)))
                    .catch(() => console.log(red(`[${i+1}] Falha: ${u.tag}`)));
            }).catch(() => {});
        }, timeout * i);
    });
}

function MassDMNormal() {
    const ids = require("./scraped.json").IDs;
    ids.forEach(id => {
        client.users.fetch(id).then(u => u.send(message).catch(()=>{})).catch(()=>{});
    });
}

if (!token) {
    console.log(red("[ERRO] Token não encontrado! Use 'export DISCORD_TOKEN=seu_token' antes de rodar."));
    process.exit(1);
} else {
    client.login(token).catch(err => console.log(red("Token Inválido: " + err.message)));
}
