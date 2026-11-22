// Cria o acesso ao painel (ou troca a senha, se o acesso já existir).
//
// Uso:  npm run admin:criar
//       npm run admin:criar -- outro@email.com
//
// A senha é digitada aqui no terminal (não aparece na tela) e vai direto para o
// Supabase Auth, que a guarda criptografada. Ela não fica no código nem no .env.
// O e-mail também precisa estar em ADMIN_EMAILS no .env para entrar no painel.
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env");
} catch {
  // variáveis podem vir do ambiente
}

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Não mostra o que é digitado (só a pergunta)
      const internal = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
      internal._writeToOutput = (s: string) => {
        if (s.includes(question)) internal.output.write(question);
      };
    }
    rl.question(question, (answer) => {
      if (hidden) process.stdout.write("\n");
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no arquivo .env antes de continuar.");
  }

  const allowed = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const email = (process.argv[2] ?? (await ask(`E-mail do painel [${allowed[0] ?? ""}]: `)) ?? "").trim().toLowerCase() || allowed[0];
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("E-mail inválido.");
  if (!allowed.includes(email)) {
    console.log(`⚠ ${email} não está em ADMIN_EMAILS no .env — inclua para conseguir entrar no painel.`);
  }

  const password = await ask("Crie uma senha (mínimo 10 caracteres): ", true);
  if (password.length < 10) throw new Error("A senha precisa ter pelo menos 10 caracteres.");
  const confirm = await ask("Repita a senha: ", true);
  if (password !== confirm) throw new Error("As senhas não conferem.");

  const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  // Procura se o acesso já existe
  let existingId: string | undefined;
  for (let page = 1; !existingId; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Não foi possível consultar os usuários: ${error.message}`);
    existingId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
    if (data.users.length < 200) break;
  }

  if (existingId) {
    const { error } = await supabase.auth.admin.updateUserById(existingId, { password, email_confirm: true });
    if (error) throw new Error(`Não foi possível trocar a senha: ${error.message}`);
    console.log(`✔ Senha de ${email} atualizada. Entre em /admin/entrar.`);
  } else {
    const { error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(`Não foi possível criar o acesso: ${error.message}`);
    console.log(`✔ Acesso criado para ${email}. Entre em /admin/entrar.`);
  }
}

main().catch((error) => {
  console.error(`✖ ${(error as Error).message}`);
  process.exitCode = 1;
});
